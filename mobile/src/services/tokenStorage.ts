import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const TOKEN_KEY = 'auth_token';
const useSecureStore = Platform.OS !== 'web';

/**
 * Garante que operações de armazenamento nativo (SecureStore) nunca travem
 * indefinidamente caso o KeyStore do dispositivo esteja bloqueado ou responda com atraso.
 */
function withTimeout<T>(promise: Promise<T>, ms: number = 2000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Storage operation timeout')), ms)
    ),
  ]);
}

export const saveToken = async (token: string): Promise<void> => {
  if (useSecureStore) {
    try {
      await withTimeout(SecureStore.setItemAsync(TOKEN_KEY, token));
      return;
    } catch {
      // Fallback para AsyncStorage em caso de indisponibilidade ou timeout do SecureStore
    }
  }

  try {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } catch (err) {
    console.warn('[tokenStorage] Falha ao salvar token no AsyncStorage:', err);
  }
};

export const getToken = async (): Promise<string | null> => {
  if (useSecureStore) {
    try {
      const secureToken = await withTimeout(SecureStore.getItemAsync(TOKEN_KEY));
      if (secureToken) return secureToken;
    } catch {
      // Fallback para AsyncStorage em caso de falha no SecureStore
    }
  }

  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const deleteToken = async (): Promise<void> => {
  if (useSecureStore) {
    try {
      await withTimeout(SecureStore.deleteItemAsync(TOKEN_KEY));
    } catch {
      // Ignora falhas de remoção do SecureStore
    }
  }

  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
  } catch {
    // Ignora falhas de remoção do AsyncStorage
  }
};

const USER_KEY = 'auth_user';

export const saveUser = async (user: any): Promise<void> => {
  try {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    // Falha silenciosa de serialização em ambiente sem persistência
  }
};

export const getUser = async (): Promise<any | null> => {
  try {
    const raw = await AsyncStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const deleteUser = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(USER_KEY);
  } catch {
    // Ignora falhas de remoção
  }
};
