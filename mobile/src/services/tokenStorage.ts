import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const TOKEN_KEY = 'auth_token';

const useSecureStore = Platform.OS !== 'web';

export const saveToken = async (token: string) => {
  if (useSecureStore) {
    try {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
      return;
    } catch {
      // Expo Go pode estar sem o módulo nativo correspondente ao SDK instalado.
    }
  }

  await AsyncStorage.setItem(TOKEN_KEY, token);
};

export const getToken = async () => {
  if (useSecureStore) {
    try {
      return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch {
      // Fallback para manter o fluxo de desenvolvimento funcional no Expo Go.
    }
  }

  return AsyncStorage.getItem(TOKEN_KEY);
};

export const deleteToken = async () => {
  if (useSecureStore) {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    } catch {
      // O fallback abaixo também limpa tokens salvos em desenvolvimento/Web.
    }
  }

  await AsyncStorage.removeItem(TOKEN_KEY);
};
