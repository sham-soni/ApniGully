const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getHeaders(customHeaders?: Record<string, string>): Record<string, string> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...customHeaders,
    };
  }

  async request<T>(
    method: string,
    path: string,
    data?: any,
    options?: { headers?: Record<string, string> }
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers = this.getHeaders(options?.headers);

    const config: RequestInit = {
      method,
      headers,
      ...(data && { body: JSON.stringify(data) }),
    };

    const response = await fetch(url, config);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  get<T>(path: string, options?: { headers?: Record<string, string> }): Promise<T> {
    return this.request<T>('GET', path, undefined, options);
  }

  post<T>(path: string, data?: any, options?: { headers?: Record<string, string> }): Promise<T> {
    return this.request<T>('POST', path, data, options);
  }

  put<T>(path: string, data?: any, options?: { headers?: Record<string, string> }): Promise<T> {
    return this.request<T>('PUT', path, data, options);
  }

  delete<T>(path: string, options?: { headers?: Record<string, string> }): Promise<T> {
    return this.request<T>('DELETE', path, undefined, options);
  }
}

export const api = new ApiClient(API_URL);

// Offline queue for sync
class OfflineQueue {
  private queue: any[] = [];
  private storageKey = 'apnigully_offline_queue';

  constructor() {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.queue = JSON.parse(stored);
      }

      window.addEventListener('online', () => this.processQueue());
    }
  }

  add(action: { type: string; data: any; timestamp: number }) {
    this.queue.push(action);
    this.save();
  }

  private save() {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.storageKey, JSON.stringify(this.queue));
    }
  }

  async processQueue() {
    if (!navigator.onLine || this.queue.length === 0) return;

    const actions = [...this.queue];
    this.queue = [];
    this.save();

    for (const action of actions) {
      try {
        if (action.type === 'post') {
          await api.post('/posts/sync', { posts: [action.data] });
        } else if (action.type === 'message') {
          await api.post('/chats/sync', { messages: [action.data] });
        }
      } catch (error) {
        console.error('Failed to sync action:', error);
        this.add(action); // Re-add failed action
      }
    }
  }

  getQueueLength() {
    return this.queue.length;
  }
}

export const offlineQueue = new OfflineQueue();

// SWR fetcher
export const fetcher = (url: string) => api.get(url);
