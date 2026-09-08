import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { subscribeToUnauthorized } from '../services/api';
import { getToken, setToken, removeToken } from '../services/tokenStorage';

export interface User {
  id: number;
  name: string;
  email: string;
  avatar_url?: string;
}

interface AuthContextData {
  signed: boolean;
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadStorageData() {
      try {
        const storedToken = await getToken();
        if (storedToken) {
          try {
            // Validar token via /me no backend
            const response = await api.get('/me');
            const currentUser = response.data.user || response.data;
            setUser(currentUser);
            await AsyncStorage.setItem('@ANOT_user', JSON.stringify(currentUser));
          } catch (err: any) {
            if (err.response?.status === 401) {
              await removeToken();
              await AsyncStorage.removeItem('@ANOT_user');
              setUser(null);
            }
          }
        }
      } catch (err) {
        console.log('Erro ao validar token de autenticação:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadStorageData();

    // Inscrever para limpar sessão se um 401 ocorrer em qualquer requisição
    const unsubscribe = subscribeToUnauthorized(async () => {
      await removeToken();
      await AsyncStorage.removeItem('@ANOT_user');
      setUser(null);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.post('/login', { email, password });
      const { user: loggedUser, token } = response.data;

      await setToken(token);
      await AsyncStorage.setItem('@ANOT_user', JSON.stringify(loggedUser));

      setUser(loggedUser);
    } catch (err: any) {
      const message = err.response?.data?.message || 'Erro ao realizar login. Tente novamente.';
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.post('/register', {
        name,
        email,
        password,
        password_confirmation: password,
      });
      const { user: registeredUser, token } = response.data;

      await setToken(token);
      await AsyncStorage.setItem('@ANOT_user', JSON.stringify(registeredUser));

      setUser(registeredUser);
    } catch (err: any) {
      const message = err.response?.data?.message || 'Erro ao criar conta. Tente novamente.';
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await api.post('/logout');
    } catch (err) {
      console.log('Aviso ao notificar logout no servidor:', err);
    } finally {
      await removeToken();
      await AsyncStorage.removeItem('@ANOT_user');
      setUser(null);
      setIsLoading(false);
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        signed: !!user,
        user,
        isLoading,
        error,
        login,
        register,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
}
