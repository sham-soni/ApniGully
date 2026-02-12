import axios from 'axios';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:4000/api';
const OFFLINE_QUEUE_KEY = 'offline_queue';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync('auth_token');
      await SecureStore.deleteItemAsync('auth_user');
    }
    return Promise.reject(error);
  }
);

// Offline queue management
interface QueuedRequest {
  id: string;
  method: string;
  url: string;
  data?: any;
  timestamp: number;
}

async function getOfflineQueue(): Promise<QueuedRequest[]> {
  try {
    const queue = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
    return queue ? JSON.parse(queue) : [];
  } catch {
    return [];
  }
}

async function saveOfflineQueue(queue: QueuedRequest[]): Promise<void> {
  await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
}

export async function queueOfflineRequest(
  method: string,
  url: string,
  data?: any
): Promise<void> {
  const queue = await getOfflineQueue();
  queue.push({
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    method,
    url,
    data,
    timestamp: Date.now(),
  });
  await saveOfflineQueue(queue);
}

export async function processOfflineQueue(): Promise<void> {
  const netInfo = await NetInfo.fetch();
  if (!netInfo.isConnected) return;

  const queue = await getOfflineQueue();
  if (queue.length === 0) return;

  const failedRequests: QueuedRequest[] = [];

  for (const request of queue) {
    try {
      await api.request({
        method: request.method,
        url: request.url,
        data: request.data,
      });
    } catch (error) {
      // Keep failed requests in queue for retry
      failedRequests.push(request);
    }
  }

  await saveOfflineQueue(failedRequests);
}

// SWR-like fetcher
export const fetcher = async (url: string) => {
  const response = await api.get(url);
  return response.data;
};

// Helper for mutation operations with offline support
export async function mutate(
  method: 'post' | 'put' | 'patch' | 'delete',
  url: string,
  data?: any
) {
  const netInfo = await NetInfo.fetch();

  if (!netInfo.isConnected) {
    await queueOfflineRequest(method, url, data);
    return { queued: true };
  }

  try {
    const response = await api[method](url, data);
    return response.data;
  } catch (error) {
    throw error;
  }
}

export default api;
