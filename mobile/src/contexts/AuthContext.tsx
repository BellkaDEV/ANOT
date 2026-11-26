import React, { createContext, useState, useEffect, useContext } from 'react';
import api, { subscribeToUnauthorized } from '../services/api';
import { deleteToken, getToken, saveToken, deleteUser, getUser, saveUser } from '../services/tokenStorage';
import { formatApiError } from '../utils/errorHandling';

export interface User {
  id: number;
  name: string;
  email: string;
  avatar_url?: string;
  email_verified_at?: string | null;
}

interface AuthContextData {
  signed: boolean;
  user: User | null;
  /**
   * Indica se a sessão inicial está sendo restaurada do armazenamento local.
   * Usado exclusivamente durante a inicialização do app para não exibir telas incorretas.
   */
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (token: string, email: string, password: string) => Promise<void>;
  resendEmailVerification: () => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: (password: string) => Promise<void>;
  changePassword: (currentPassword: string, password: string) => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadStorageData() {
      // Timeout de segurança: a inicialização NUNCA deve travar o app por mais de 4 segundos
      const initTimeout = setTimeout(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      }, 4000);

      try {
        const storedToken = await getToken();
        if (storedToken) {
          const cachedUser = await getUser();
          if (cachedUser && isMounted) {
            setUser(cachedUser);
          }
          try {
            // Validar token via /me no backend
            const response = await api.get('/me');
            const currentUser = response.data.user || response.data;
            if (isMounted) {
              setUser(currentUser);
              await saveUser(currentUser);
            }
          } catch (err: any) {
            if (err.response?.status === 401) {
              await deleteToken();
              await deleteUser();
              if (isMounted) setUser(null);
            }
          }
        }
      } catch (err) {
        console.log('[AuthContext] Erro ao validar token inicial:', err);
      } finally {
        clearTimeout(initTimeout);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadStorageData();

    // Inscrever para limpar sessão se um 401 ocorrer em qualquer requisição autenticada
    const unsubscribe = subscribeToUnauthorized(async () => {
      await deleteToken();
      await deleteUser();
      if (isMounted) setUser(null);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setError(null);
    const normalizedEmail = email.trim().toLowerCase();

    try {
      const response = await api.post('/login', {
        email: normalizedEmail,
        password,
      });

      const { user: loggedUser, token } = response.data;

      await saveToken(token);
      await saveUser(loggedUser);

      setUser(loggedUser);
    } catch (err: any) {
      const message = formatApiError(err, 'Usuário ou senha inválidos.');
      setError(message);
      const customErr: any = new Error(message);
      customErr.response = err.response;
      throw customErr;
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setError(null);
    const normalizedEmail = email.trim().toLowerCase();

    try {
      const response = await api.post('/register', {
        name: name.trim(),
        email: normalizedEmail,
        password,
        password_confirmation: password,
      });

      const { user: registeredUser, token } = response.data;

      await saveToken(token);
      await saveUser(registeredUser);

      setUser(registeredUser);
    } catch (err: any) {
      const message = formatApiError(err, 'Erro ao criar conta. Verifique os dados informados.');
      setError(message);
      const customErr: any = new Error(message);
      customErr.response = err.response;
      throw customErr;
    }
  };

  const requestPasswordReset = async (email: string) => {
    setError(null);
    const normalizedEmail = email.trim().toLowerCase();
    try {
      await api.post('/forgot-password', { email: normalizedEmail });
    } catch (err: any) {
      const message = formatApiError(err, 'Não foi possível solicitar a recuperação de senha agora.');
      setError(message);
      const customErr: any = new Error(message);
      customErr.response = err.response;
      throw customErr;
    }
  };

  const resetPassword = async (token: string, email: string, password: string) => {
    setError(null);
    const normalizedEmail = email.trim().toLowerCase();
    try {
      await api.post('/reset-password', {
        token,
        email: normalizedEmail,
        password,
        password_confirmation: password,
      });
    } catch (err: any) {
      const message = formatApiError(err, 'Não foi possível redefinir a senha.');
      setError(message);
      const customErr: any = new Error(message);
      customErr.response = err.response;
      throw customErr;
    }
  };

  const resendEmailVerification = async () => {
    setError(null);
    try {
      await api.post('/email/verification-notification');
    } catch (err: any) {
      const message = formatApiError(err, 'Não foi possível reenviar a verificação.');
      setError(message);
      const customErr: any = new Error(message);
      customErr.response = err.response;
      throw customErr;
    }
  };

  const logout = async () => {
    try {
      await api.post('/logout');
    } catch (err) {
      console.log('[AuthContext] Aviso ao notificar logout no servidor:', err);
    } finally {
      await deleteToken();
      await deleteUser();
      setUser(null);
    }
  };

  const deleteAccount = async (password: string) => {
    setError(null);
    try {
      await api.delete('/account', { data: { password } });
      await deleteToken();
      await deleteUser();
      setUser(null);
    } catch (err: any) {
      const message = formatApiError(err, 'Não foi possível excluir a conta.');
      setError(message);
      const customErr: any = new Error(message);
      customErr.response = err.response;
      throw customErr;
    }
  };

  const changePassword = async (currentPassword: string, password: string) => {
    setError(null);
    try {
      await api.put('/account/password', {
        current_password: currentPassword,
        password,
        password_confirmation: password,
      });
      await deleteToken();
      await deleteUser();
      setUser(null);
    } catch (err: any) {
      const message = formatApiError(err, 'Não foi possível alterar a senha.');
      setError(message);
      const customErr: any = new Error(message);
      customErr.response = err.response;
      throw customErr;
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
        requestPasswordReset,
        resetPassword,
        resendEmailVerification,
        logout,
        deleteAccount,
        changePassword,
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
