import axios from 'axios';
import { getToken, removeToken } from './tokenStorage';

const ENV_API_URL = process.env.EXPO_PUBLIC_API_URL;
const DEFAULT_URL = 'http://localhost:8000/api';

const API_URL = ENV_API_URL || DEFAULT_URL;

if (process.env.NODE_ENV === 'production' && !API_URL.startsWith('https://')) {
  console.warn('SEGURANÇA: A URL da API em produção deve utilizar o protocolo HTTPS.');
}

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
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
  listeners.forEach(cb => cb(isOnline));
};

let isHandling401 = false;

api.interceptors.request.use(
  async (config) => {
    const token = await getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
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

      if (error.response.status === 401 && !isHandling401) {
        isHandling401 = true;
        await removeToken();
        unauthorizedListeners.forEach(cb => cb());
        setTimeout(() => {
          isHandling401 = false;
        }, 1000);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
