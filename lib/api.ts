import axios, { AxiosInstance, AxiosError } from 'axios';
import { getDemoMode } from './demo-store';
import { demoRequest } from './demo-api';

const DEFAULT_REMOTE_API = 'https://school-server-b264c1a1fac6.herokuapp.com/api';
const ENV_API_URL = process.env.NEXT_PUBLIC_API_URL || '';
const API_BASE_URL = ENV_API_URL || (typeof window !== 'undefined' ? '/api' : DEFAULT_REMOTE_API);
export const API_URL = API_BASE_URL;

interface ApiError {
  message: string;
  error?: any;
}

class ApiClient {
  private client: AxiosInstance;
  private fallbackClient: AxiosInstance;
  private token: string | null = null;
  private networkToastAt = 0;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 20000,
      headers: { 'Content-Type': 'application/json' },
    });
    this.fallbackClient = axios.create({
      baseURL: DEFAULT_REMOTE_API,
      timeout: 20000,
      headers: { 'Content-Type': 'application/json' },
    });

    const attachRequest = (instance: AxiosInstance) => {
      instance.interceptors.request.use(
        (config) => {
          const token = this.getToken();
          if (token) config.headers.Authorization = `Bearer ${token}`;
          if (typeof window !== 'undefined') {
            const selectedInstitutionId = localStorage.getItem('selectedInstitutionId');
            if (selectedInstitutionId) config.headers['x-institution-id'] = selectedInstitutionId;
          }
          return config;
        },
        (error) => Promise.reject(error)
      );
    };

    const attachResponse = (instance: AxiosInstance) => {
      instance.interceptors.response.use(
        (response) => response,
        (error) => {
          if (error.response?.status === 401) {
            this.clearToken();
            if (typeof window !== 'undefined') window.location.href = '/login';
          }
          return Promise.reject(error);
        }
      );
    };

    attachRequest(this.client);
    attachRequest(this.fallbackClient);
    attachResponse(this.client);
    attachResponse(this.fallbackClient);
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') localStorage.setItem('token', token);
  }

  getToken(): string | null {
    if (this.token) return this.token;
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) this.token = token;
      return token;
    }
    return null;
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') localStorage.removeItem('token');
  }

  private async requestWithFallback<T>(method: 'get' | 'post' | 'put' | 'patch' | 'delete', url: string, data?: any, config?: any): Promise<T> {
    try {
      const response = method === 'get' || method === 'delete'
        ? await this.client[method]<T>(url, config)
        : await this.client[method]<T>(url, data, config);
      return response.data;
    } catch (error: any) {
      const isNetwork = axios.isAxiosError(error) && (error.code === 'ERR_NETWORK' || error.message === 'Network Error' || !error.response);
      const isUsingProxy = typeof window !== 'undefined' && API_BASE_URL === '/api';
      if (isNetwork && isUsingProxy) {
        const response = method === 'get' || method === 'delete'
          ? await this.fallbackClient[method]<T>(url, config)
          : await this.fallbackClient[method]<T>(url, data, config);
        return response.data;
      }
      throw error;
    }
  }

  async get<T>(url: string, config?: any): Promise<T> {
    try {
      if (getDemoMode()) return await demoRequest('GET', url, undefined) as T;
      return await this.requestWithFallback<T>('get', url, undefined, config);
    } catch (error) { throw this.handleError(error); }
  }

  async post<T>(url: string, data?: any, config?: any): Promise<T> {
    try {
      if (getDemoMode()) return await demoRequest('POST', url, data) as T;
      return await this.requestWithFallback<T>('post', url, data, config);
    } catch (error) { throw this.handleError(error); }
  }

  async put<T>(url: string, data?: any, config?: any): Promise<T> {
    try {
      if (getDemoMode()) return await demoRequest('PUT', url, data) as T;
      return await this.requestWithFallback<T>('put', url, data, config);
    } catch (error) { throw this.handleError(error); }
  }

  async patch<T>(url: string, data?: any, config?: any): Promise<T> {
    try {
      if (getDemoMode()) return await demoRequest('PATCH', url, data) as T;
      return await this.requestWithFallback<T>('patch', url, data, config);
    } catch (error) { throw this.handleError(error); }
  }

  async delete<T>(url: string, config?: any): Promise<T> {
    try {
      if (getDemoMode()) return await demoRequest('DELETE', url, undefined) as T;
      return await this.requestWithFallback<T>('delete', url, undefined, config);
    } catch (error) { throw this.handleError(error); }
  }

  async getBlob(url: string, config?: any): Promise<Blob> {
    try {
      if (getDemoMode()) {
        const result = await demoRequest('GET', url, undefined);
        if (result instanceof Blob) return result;
        return new Blob([typeof result === 'string' ? result : JSON.stringify(result)], { type: 'application/octet-stream' });
      }
      const response = await this.client.get(url, { ...config, responseType: 'blob' });
      return response.data;
    } catch (error) { throw this.handleError(error); }
  }

  async postBlob(url: string, data?: any, config?: any): Promise<Blob> {
    try {
      if (getDemoMode()) {
        const result = await demoRequest('POST', url, data);
        if (result instanceof Blob) return result;
        return new Blob([typeof result === 'string' ? result : JSON.stringify(result)], { type: 'application/octet-stream' });
      }
      const response = await this.client.post(url, data, { ...config, responseType: 'blob' });
      return response.data;
    } catch (error) { throw this.handleError(error); }
  }

  private handleError(error: any): ApiError {
    if (axios.isAxiosError(error)) {
      const message = this.getErrorMessage(error);
      const shouldSuppressToast = error.response?.status === 404 || error.config?.url?.includes('/messages/stats/unread');
      if (!shouldSuppressToast) this.emitErrorToast(message);
      return { message, error: error.response?.data };
    }
    this.emitErrorToast('An unexpected error occurred');
    return { message: 'An unexpected error occurred', error };
  }

  private getErrorMessage(error: AxiosError<any>): string {
    const data = error.response?.data;
    const status = error.response?.status;
    if (status === 500 || status === 502 || status === 503 || status === 504) {
      if (typeof data?.message === 'string' && data.message !== 'Server error') return data.message;
      return 'সার্ভারে সমস্যা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।';
    }
    if (typeof data === 'string') return data;
    if (typeof data?.message === 'string') return data.message;
    if (typeof data?.error === 'string') return data.error;
    if (typeof data?.error?.message === 'string') return data.error.message;
    if (Array.isArray(data?.errors) && data.errors.length) return data.errors.map((item: any) => item?.message || item).filter(Boolean).join(', ');
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') return 'সার্ভারের সাথে যোগাযোগ করা যাচ্ছে না। Server deploy/CORS/API URL check করুন।';
    return error.message || 'Request failed';
  }

  private emitErrorToast(message: string) {
    if (typeof window === 'undefined' || !message) return;
    const now = Date.now();
    if (message.includes('সার্ভারের সাথে যোগাযোগ') && now - this.networkToastAt < 10000) return;
    if (message.includes('সার্ভারের সাথে যোগাযোগ')) this.networkToastAt = now;
    window.dispatchEvent(new CustomEvent('app-toast', {
      detail: { title: 'Server error', message, type: 'error', duration: 5000 },
    }));
  }
}

export const apiClient = new ApiClient();

// API Endpoints
export const api = {
  auth: {
    login: (data: any) => apiClient.post('/auth/login', data),
    register: (data: any) => apiClient.post('/auth/register', data),
    forgotPassword: (data: any) => apiClient.post('/auth/forgot-password', data),
    profile: () => apiClient.get('/auth/profile'),
    updateProfile: (data: any) => apiClient.put('/auth/profile', data),
    changePassword: (data: any) => apiClient.post('/auth/change-password', data),
  },

  admissions: {
    schools: (params?: any) => apiClient.get('/admissions/public/schools', params ? { params } : undefined),
    apply: (data: any) => apiClient.post('/admissions/public/apply', data),
    getAll: () => apiClient.get('/admissions'),
    accept: (id: string, data?: any) => apiClient.post(`/admissions/${id}/accept`, data),
    reject: (id: string) => apiClient.post(`/admissions/${id}/reject`),
  },

  publicResults: {
    schools: (params?: any) => apiClient.get('/academic/public/results/schools', params ? { params } : undefined),
    options: (params?: any) => apiClient.get('/academic/public/results/options', params ? { params } : undefined),
    lookup: (params: any) => apiClient.get('/academic/public/results', { params }),
  },

  users: {
    getAll: () => apiClient.get('/users'),
    getAllUsers: () => apiClient.get('/users/all'),
    getById: (id: string) => apiClient.get(`/users/${id}`),
    create: (data: any) => apiClient.post('/users', data),
    update: (id: string, data: any) => apiClient.put(`/users/${id}`, data),
    delete: (id: string) => apiClient.delete(`/users/${id}`),
    updateStatus: (id: string, isActive: boolean) => apiClient.patch(`/users/${id}/status`, { isActive }),
    updateRole: (id: string, role: string) => apiClient.patch(`/users/${id}/role`, { role }),
    resetPassword: (id: string, password?: string) => apiClient.post(`/users/${id}/reset-password`, password ? { password } : undefined),
    permissions: () => apiClient.get('/users/permissions'),
    updatePermissions: (matrix: any) => apiClient.put('/users/permissions', { matrix }),
  },

  students: {
    getAll: () => apiClient.get('/students'),
    getById: (id: string) => apiClient.get(`/students/${id}`),
    create: (data: any) => apiClient.post('/students', data),
    update: (id: string, data: any) => apiClient.put(`/students/${id}`, data),
    delete: (id: string) => apiClient.delete(`/students/${id}`),
  },

  teachers: {
    getAll: () => apiClient.get('/teachers'),
    getById: (id: string) => apiClient.get(`/teachers/${id}`),
    create: (data: any) => apiClient.post('/teachers', data),
    update: (id: string, data: any) => apiClient.put(`/teachers/${id}`, data),
    delete: (id: string) => apiClient.delete(`/teachers/${id}`),
  },

  staff: {
    getAll: () => apiClient.get('/staff'),
    getById: (id: string) => apiClient.get(`/staff/${id}`),
    create: (data: any) => apiClient.post('/staff', data),
    update: (id: string, data: any) => apiClient.put(`/staff/${id}`, data),
    delete: (id: string) => apiClient.delete(`/staff/${id}`),
  },

  institution: {
    plans: () => apiClient.get('/institution/plans'),
    profile: () => apiClient.get('/institution/profile'),
    updateProfile: (data: any) => apiClient.put('/institution/profile', data),
    recordPayment: (data: any) => apiClient.post('/institution/billing/payment', data),
  },

  admin: {
    schools: (params?: any) => apiClient.get('/admin/schools', params ? { params } : undefined),
    updateSchool: (id: string, data: any) => apiClient.patch(`/admin/schools/${id}`, data),
    verifyPayment: (id: string) => apiClient.post(`/admin/schools/${id}/verify-payment`),
    selectSchool: (id: string) => apiClient.get(`/admin/schools/${id}/select`),
    users: (params?: any) => apiClient.get('/admin/users', params ? { params } : undefined),
  },

  academic: {
    classes: {
      getAll: () => apiClient.get('/academic/classes'),
      create: (data: any) => apiClient.post('/academic/classes', data),
      update: (id: string, data: any) => apiClient.put(`/academic/classes/${id}`, data),
      delete: (id: string) => apiClient.delete(`/academic/classes/${id}`),
    },
    sections: {
      getAll: () => apiClient.get('/academic/sections'),
      create: (data: any) => apiClient.post('/academic/sections', data),
      update: (id: string, data: any) => apiClient.put(`/academic/sections/${id}`, data),
      delete: (id: string) => apiClient.delete(`/academic/sections/${id}`),
    },
    subjects: {
      getAll: () => apiClient.get('/academic/subjects'),
      create: (data: any) => apiClient.post('/academic/subjects', data),
      update: (id: string, data: any) => apiClient.put(`/academic/subjects/${id}`, data),
      delete: (id: string) => apiClient.delete(`/academic/subjects/${id}`),
    },
    exams: {
      getAll: () => apiClient.get('/academic/exams'),
      create: (data: any) => apiClient.post('/academic/exams', data),
      update: (id: string, data: any) => apiClient.put(`/academic/exams/${id}`, data),
      delete: (id: string) => apiClient.delete(`/academic/exams/${id}`),
    },
    results: {
      getAll: () => apiClient.get('/academic/results'),
      create: (data: any) => apiClient.post('/academic/results', data),
      update: (id: string, data: any) => apiClient.put(`/academic/results/${id}`, data),
      delete: (id: string) => apiClient.delete(`/academic/results/${id}`),
    },
  },

  finance: {
    myFees: () => apiClient.get('/finance/my-fees'),
    fees: () => apiClient.get('/finance/fees'),
    payments: () => apiClient.get('/finance/payments'),
    collections: () => apiClient.get('/finance/collections'),
  },
};
