import axios, { AxiosInstance, AxiosError } from 'axios';
import { getDemoMode } from './demo-store';
import { demoRequest } from './demo-api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://school-server-b264c1a1fac6.herokuapp.com/api';
  export const API_URL = API_BASE_URL;

interface ApiError {
  message: string;
  error?: any;
}

class ApiClient {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        if (typeof window !== 'undefined') {
          const selectedInstitutionId = localStorage.getItem('selectedInstitutionId');
          if (selectedInstitutionId) {
            config.headers['x-institution-id'] = selectedInstitutionId;
          }
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          this.clearToken();
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
    }
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
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
  }

  async get<T>(url: string, config?: any): Promise<T> {
    try {
      if (getDemoMode()) {
        return await demoRequest('GET', url, undefined) as T;
      }
      const response = await this.client.get<T>(url, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async post<T>(url: string, data?: any, config?: any): Promise<T> {
    try {
      if (getDemoMode()) {
        return await demoRequest('POST', url, data) as T;
      }
      const response = await this.client.post<T>(url, data, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async put<T>(url: string, data?: any, config?: any): Promise<T> {
    try {
      if (getDemoMode()) {
        return await demoRequest('PUT', url, data) as T;
      }
      const response = await this.client.put<T>(url, data, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async patch<T>(url: string, data?: any, config?: any): Promise<T> {
    try {
      if (getDemoMode()) {
        return await demoRequest('PATCH', url, data) as T;
      }
      const response = await this.client.patch<T>(url, data, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async delete<T>(url: string, config?: any): Promise<T> {
    try {
      if (getDemoMode()) {
        return await demoRequest('DELETE', url, undefined) as T;
      }
      const response = await this.client.delete<T>(url, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getBlob(url: string, config?: any): Promise<Blob> {
    try {
      if (getDemoMode()) {
        const result = await demoRequest('GET', url, undefined);
        if (result instanceof Blob) return result;
        return new Blob([typeof result === 'string' ? result : JSON.stringify(result)], { type: 'application/octet-stream' });
      }
      const response = await this.client.get(url, {
        ...config,
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private handleError(error: any): ApiError {
    if (axios.isAxiosError(error)) {
      const message = this.getErrorMessage(error);
      // Don't emit error toasts for 404s - they're often expected and handled by the caller
      // Don't emit for messages/stats/unread which is polled regularly
      const shouldSuppressToast = error.response?.status === 404 || 
                                  error.config?.url?.includes('/messages/stats/unread');
      if (!shouldSuppressToast) {
        this.emitErrorToast(message);
      }
      return {
        message,
        error: error.response?.data,
      };
    }
    this.emitErrorToast('An unexpected error occurred');
    return {
      message: 'An unexpected error occurred',
      error,
    };
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
    if (Array.isArray(data?.errors) && data.errors.length) {
      return data.errors.map((item: any) => item?.message || item).filter(Boolean).join(', ');
    }

    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      return 'সার্ভারের সাথে যোগাযোগ করা যাচ্ছে না। ইন্টারনেট বা সার্ভার চেক করুন।';
    }

    return error.message || 'Request failed';
  }

  private emitErrorToast(message: string) {
    if (typeof window === 'undefined' || !message) return;
    window.dispatchEvent(new CustomEvent('app-toast', {
      detail: {
        title: 'Server error',
        message,
        type: 'error',
        duration: 5000,
      },
    }));
  }
}

export const apiClient = new ApiClient();

// API Endpoints
export const api = {
  // Auth
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

  // Users
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

  // Students
  students: {
    getAll: () => apiClient.get('/students'),
    getById: (id: string) => apiClient.get(`/students/${id}`),
    create: (data: any) => apiClient.post('/students', data),
    update: (id: string, data: any) => apiClient.put(`/students/${id}`, data),
    delete: (id: string) => apiClient.delete(`/students/${id}`),
  },

  // Teachers
  teachers: {
    getAll: () => apiClient.get('/teachers'),
    getById: (id: string) => apiClient.get(`/teachers/${id}`),
    create: (data: any) => apiClient.post('/teachers', data),
    update: (id: string, data: any) => apiClient.put(`/teachers/${id}`, data),
    delete: (id: string) => apiClient.delete(`/teachers/${id}`),
  },

  // Staff
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

  // Attendance
  attendance: {
    getAll: (params?: any) => apiClient.get('/attendance', params ? { params } : undefined),
    mark: (data: any) => apiClient.post('/attendance/mark', data),
    scanIdCard: (data: any) => apiClient.post('/attendance/scan-id-card', data),
    getStudents: (params?: any) => apiClient.get('/attendance/students', params ? { params } : undefined),
    getReports: (params?: any) => apiClient.get('/attendance/reports', params ? { params } : undefined),
    getMine: (params?: any) => apiClient.get('/attendance/me', params ? { params } : undefined),
    getStudentAttendance: (studentId: string) => apiClient.get(`/attendance/student/${studentId}`),
  },

  // Finance
  finance: {
    dashboard: () => apiClient.get('/finance'),
    fees: {
      getAll: () => apiClient.get('/finance/fees'),
      getByStudent: (studentId: string) => apiClient.get(`/finance/fees/student/${studentId}`),
      create: (data: any) => apiClient.post('/finance/fees', data),
      update: (id: string, data: any) => apiClient.put(`/finance/fees/${id}`, data),
    },
    payments: {
      getAll: () => apiClient.get('/finance/payments'),
      create: (data: any) => apiClient.post('/finance/payments', data),
    },
    collections: (params?: any) => apiClient.get('/finance/collections', params ? { params } : undefined),
    salary: () => apiClient.get('/finance/salary'),
    processSalary: (data: any) => apiClient.post('/finance/salary/process', data),
    reports: (params?: any) => apiClient.get('/finance/reports', params ? { params } : undefined),
    myFees: (params?: any) => apiClient.get('/finance/my-fees', params ? { params } : undefined),
  },

  // ID Cards
  idCards: {
    getAll: () => apiClient.get('/id-cards'),
    getMine: () => apiClient.get('/id-cards/me/card'),
    getById: (id: string) => apiClient.get(`/id-cards/${id}`),
    searchOwners: (params: any) => apiClient.get('/id-cards/owners/search', { params }),
    create: (data: any) => apiClient.post('/id-cards', data),
    generate: (data: any) => apiClient.post('/id-cards/generate', data),
    generateStudent: (studentId: string) => apiClient.get(`/id-cards/student/${studentId}`),
    generateTeacher: (teacherId: string) => apiClient.get(`/id-cards/teacher/${teacherId}`),
    generateStaff: (staffId: string) => apiClient.get(`/id-cards/staff/${staffId}`),
    download: (id: string, format = 'pdf') => apiClient.getBlob(`/id-cards/${id}/download?format=${format}`),
    email: (id: string, data: any) => apiClient.post(`/id-cards/${id}/email`, data),
    bulkGenerate: (data: any) => apiClient.post('/id-cards/bulk', data),
    verify: (code: string) => apiClient.post('/id-cards/verify', { code }),
    renew: (id: string, data: any) => apiClient.post(`/id-cards/${id}/renew`, data),
    stats: () => apiClient.get('/id-cards/reports/stats'),
  },

  // Dashboard
  dashboard: {
    stats: () => apiClient.get('/dashboard/stats'),
    summary: () => apiClient.get('/dashboard/summary'),
    charts: () => apiClient.get('/dashboard/charts'),
    composition: () => apiClient.get('/dashboard/composition'),
    attendanceOverview: () => apiClient.get('/dashboard/attendance-overview'),
    feeOverview: () => apiClient.get('/dashboard/fee-overview'),
    recentNotices: () => apiClient.get('/dashboard/recent-notices'),
  },

  // Notices
  notices: {
    getAll: () => apiClient.get('/notices'),
    getById: (id: string) => apiClient.get(`/notices/${id}`),
    create: (data: any, config?: any) => apiClient.post('/notices', data, data instanceof FormData ? {
      headers: { 'Content-Type': 'multipart/form-data' },
      ...config,
    } : config),
    update: (id: string, data: any) => apiClient.put(`/notices/${id}`, data),
    delete: (id: string) => apiClient.delete(`/notices/${id}`),
  },

  // Notifications
  notifications: {
    getAll: () => apiClient.get('/notifications'),
    markRead: (id: string) => apiClient.post('/notifications/mark-read', { id }),
    markAll: () => apiClient.post('/notifications/mark-all'),
    create: (data: any) => apiClient.post('/notifications', data),
  },

  // Academic
  academic: {
    classes: {
      getAll: () => apiClient.get('/academic/classes'),
      getById: (id: string) => apiClient.get(`/academic/classes/${id}`),
      create: (data: any) => apiClient.post('/academic/classes', data),
      update: (id: string, data: any) => apiClient.put(`/academic/classes/${id}`, data),
      delete: (id: string) => apiClient.delete(`/academic/classes/${id}`),
    },
    subjects: {
      getAll: () => apiClient.get('/academic/subjects'),
      getById: (id: string) => apiClient.get(`/academic/subjects/${id}`),
      create: (data: any) => apiClient.post('/academic/subjects', data),
      update: (id: string, data: any) => apiClient.put(`/academic/subjects/${id}`, data),
      delete: (id: string) => apiClient.delete(`/academic/subjects/${id}`),
    },
    exams: {
      getAll: () => apiClient.get('/academic/exams'),
      getById: (id: string) => apiClient.get(`/academic/exams/${id}`),
      create: (data: any) => apiClient.post('/academic/exams', data),
      update: (id: string, data: any) => apiClient.put(`/academic/exams/${id}`, data),
      delete: (id: string) => apiClient.delete(`/academic/exams/${id}`),
    },
    results: {
      getAll: () => apiClient.get('/academic/results'),
      getEntry: (params: any) => apiClient.get('/academic/results', { params }),
      getByStudent: (studentId: string) => apiClient.get(`/academic/results/student/${studentId}`),
      create: (data: any) => apiClient.post('/academic/results', data),
      update: (id: string, data: any) => apiClient.put(`/academic/results/${id}`, data),
      saveDraft: (data: any) => apiClient.post('/academic/results/draft', data),
      submitReview: (data: any) => apiClient.post('/academic/results/submit-review', data),
      assistantApprove: (data: any) => apiClient.post('/academic/results/assistant-approve', data),
      headApprove: (data: any) => apiClient.post('/academic/results/head-approve', data),
      publish: (data: any) => apiClient.post('/academic/results/publish', data),
    },
    reportCard: {
      get: (params?: any) => apiClient.get('/academic/report-card', params ? { params } : undefined),
      students: (params?: any) => apiClient.get('/academic/report-card/students', params ? { params } : undefined),
    },
  },

  // Documents
  documents: {
    getAll: (params?: any) => apiClient.get('/documents', params ? { params } : undefined),
    manage: (params?: any) => apiClient.get('/documents/manage', params ? { params } : undefined),
    upload: (data: FormData | Record<string, any>, config?: any) => apiClient.post('/documents/upload', data, data instanceof FormData ? {
      headers: { 'Content-Type': 'multipart/form-data' },
      ...config,
    } : config),
    delete: (id: string) => apiClient.delete(`/documents/${id}`),
  },

  // Users and routes that have dedicated pages
  committee: {
    getAll: () => apiClient.get('/committee'),
    create: (data: any) => apiClient.post('/committee', data),
    update: (id: string, data: any) => apiClient.put(`/committee/${id}`, data),
  },
  parent: {
    portal: () => apiClient.get('/parent/portal'),
  },

  // Backup
  backup: {
    getAll: () => apiClient.get('/backup'),
    create: (data: any) => apiClient.post('/backup', data),
    restore: (id: string) => apiClient.post(`/backup/${id}/restore`),
    export: (collections?: string[]) => apiClient.get('/backup/export', { params: collections ? { collections: collections.join(',') } : undefined, responseType: 'blob' }),
    import: (data: any) => apiClient.post('/backup/import', data),
  },

  // Messages & Email
  messages: {
    getInbox: () => apiClient.get('/messages/inbox'),
    getSent: () => apiClient.get('/messages/sent'),
    getById: (id: string) => apiClient.get(`/messages/${id}`),
    send: (data: any) => apiClient.post('/messages/send', data),
    markAsRead: (id: string) => apiClient.patch(`/messages/${id}/read`),
    delete: (id: string) => apiClient.delete(`/messages/${id}`),
    getUnreadCount: async () => {
      try {
        return await apiClient.get('/messages/stats/unread');
      } catch (error: any) {
        if (error?.response?.status === 404) return { success: true, unreadCount: 0 };
        throw error;
      }
    },
  },
};
