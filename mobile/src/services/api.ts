import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://192.168.1.196:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

type ConnectionCallback = (isOnline: boolean) => void;
const listeners = new Set<ConnectionCallback>();

export const subscribeToConnection = (callback: ConnectionCallback) => {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
};

const notifyConnection = (isOnline: boolean) => {
  listeners.forEach(cb => cb(isOnline));
};

api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('@ANOT_token');
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
  (error) => {
    if (!error.response) {
      // Request failed and no response was returned, meaning network/host is unreachable
      notifyConnection(false);
    } else {
      notifyConnection(true);
    }
    return Promise.reject(error);
  }
);

export default api;
