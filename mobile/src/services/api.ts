import axios from 'axios';
import { deleteToken, getToken } from './tokenStorage';

const ENV_API_URL = process.env.EXPO_PUBLIC_API_URL;
const DEFAULT_URL = 'http://localhost:8000';

if (process.env.NODE_ENV === 'production' && !ENV_API_URL?.startsWith('https://')) {
  throw new Error('A URL da API em produção deve ser configurada com HTTPS.');
}

export const API_URL = `${(ENV_API_URL || DEFAULT_URL).replace(/\/+$/, '').replace(/\/api$/, '')}/api`;

// Timeout aumentado para 25s para suportar cold starts em servidores de produção (ex: Render)
const api = axios.create({
  baseURL: API_URL,
  timeout: 25000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

type ConnectionCallback = (isOnline: boolean) => void;
type UnauthorizedCallback = () => void;

const listeners = new Set<ConnectionCallback>();
const unauthorizedListeners = new Set<UnauthorizedCallback>();

export const subscribeToConnection = (callback: ConnectionCallback) => {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
};

export const subscribeToUnauthorized = (callback: UnauthorizedCallback) => {
  unauthorizedListeners.add(callback);
  return () => {
    unauthorizedListeners.delete(callback);
  };
};

const notifyConnection = (isOnline: boolean) => {
  listeners.forEach((cb) => cb(isOnline));
};

let isHandling401 = false;

// Rotas públicas que nunca devem acionar o fluxo de "sessão expirada / logout forçado"
const isGuestAuthUrl = (url?: string): boolean => {
  if (!url) return false;
  return (
    url.includes('/login') ||
    url.includes('/register') ||
    url.includes('/forgot-password') ||
    url.includes('/reset-password')
  );
};

api.interceptors.request.use(
  async (config) => {
    if (__DEV__) {
      console.log(`[ANOT API] ${config.method?.toUpperCase() || 'REQUEST'} ${config.baseURL || ''}${config.url || ''}`);
    }

    // Não injetar token Sanctum se for uma rota de autenticação pública
    if (!isGuestAuthUrl(config.url)) {
      const token = await getToken();
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    notifyConnection(true);
    return response;
  },
  async (error) => {
    if (!error.response) {
      notifyConnection(false);
    } else {
      notifyConnection(true);

      const requestUrl = error.config?.url;
      const isGuestRoute = isGuestAuthUrl(requestUrl);

      // Apenas acionar o evento de 401 se NÃO for rota pública (onde 401 significa apenas credenciais inválidas)
      if (error.response.status === 401 && !isHandling401 && !isGuestRoute) {
        isHandling401 = true;
        await deleteToken();
        unauthorizedListeners.forEach((cb) => cb());
        setTimeout(() => {
          isHandling401 = false;
        }, 1000);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
