import { getDemoMode } from './demo-store';
import { demoRequest } from './demo-api';

const DEFAULT_API_TARGET = 'https://school-server-b264c1a1fac6.herokuapp.com';
const ENV_API_URL = process.env.NEXT_PUBLIC_API_URL || '';
const ENV_API_TARGET = process.env.NEXT_PUBLIC_API_TARGET || DEFAULT_API_TARGET;
const isBrowser = typeof window !== 'undefined';
const isLocal = isBrowser && /^(localhost|127\.0\.0\.1)$/i.test(window.location.hostname);

const normalizeApiUrl = (value: string) => value.replace(/\/$/, '').replace(/\/api$/, '') + '/api';

// Production browser uses the real server directly. Server CORS is controlled by ALLOWED_ORIGINS in server env.
// Local browser may still use NEXT_PUBLIC_API_URL for development.
export const API_URL = isBrowser
  ? (isLocal && ENV_API_URL ? normalizeApiUrl(ENV_API_URL) : normalizeApiUrl(ENV_API_TARGET))
  : normalizeApiUrl(ENV_API_URL || ENV_API_TARGET || DEFAULT_API_TARGET);

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

async function withTimeout(input: RequestInfo | URL, init: RequestInit = {}, ms = 90000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try { return await fetch(input, { ...init, signal: controller.signal }); }
  finally { clearTimeout(timer); }
}

class ApiClient {
  private currentToken: string | null = null;
  private lastToast = 0;

  setToken(value: string) { this.currentToken = value; if (isBrowser) localStorage.setItem('token', value); }
  getToken() { if (this.currentToken) return this.currentToken; if (!isBrowser) return null; this.currentToken = localStorage.getItem('token'); return this.currentToken; }
  clearToken() { this.currentToken = null; if (isBrowser) localStorage.removeItem('token'); }

  private headers(body?: any, extra?: any) {
    const h: any = { ...(extra || {}) };
    if (!(body instanceof FormData) && !h['Content-Type']) h['Content-Type'] = 'application/json';
    const auth = this.getToken();
    if (auth) h.Authorization = `Bearer ${auth}`;
    if (isBrowser) {
      const institutionId = localStorage.getItem('selectedInstitutionId');
      if (institutionId) h['x-institution-id'] = institutionId;
    }
    return h;
  }

  private async request<T>(method: Method, url: string, data?: any, config: any = {}): Promise<T> {
    if (getDemoMode()) return await demoRequest(method, url, data) as T;
    const qs = config?.params ? `?${new URLSearchParams(Object.entries(config.params).filter(([, v]) => v !== undefined && v !== null) as any).toString()}` : '';
    const body = method === 'GET' || method === 'DELETE' ? undefined : (data instanceof FormData ? data : JSON.stringify(data || {}));
    const init: RequestInit = { method, headers: this.headers(body instanceof FormData ? body : data, config.headers), body, credentials: 'include' };
    try {
      const res = await withTimeout(`${API_URL}${url}${qs}`, init, 90000);
      return await this.parse<T>(res);
    } catch (e: any) {
      throw this.toError(e);
    }
  }

  private async parse<T>(res: Response): Promise<T> {
    if (res.status === 401) { this.clearToken(); if (isBrowser) window.location.href = '/login'; }
    const text = await res.text();
    const data = text ? (() => { try { return JSON.parse(text); } catch { return text; } })() : null;
    if (!res.ok) throw this.toError(data || { message: res.statusText });
    return data as T;
  }

  private toError(err: any) {
    const raw = typeof err?.message === 'string' ? err.message : (typeof err === 'string' ? err : 'Server connection failed');
    const message = raw.includes('abort') || raw.includes('signal') ? 'Server response timeout. Please restart dyno or check database/API.' : raw;
    this.toast(message);
    return { message, error: err };
  }

  private toast(message: string) {
    if (!isBrowser) return;
    const now = Date.now();
    if (now - this.lastToast < 8000) return;
    this.lastToast = now;
    window.dispatchEvent(new CustomEvent('app-toast', { detail: { title: 'API Error', message, type: 'error', duration: 5000 } }));
  }

  get<T>(url: string, config?: any) { return this.request<T>('GET', url, undefined, config); }
  post<T>(url: string, data?: any, config?: any) { return this.request<T>('POST', url, data, config); }
  put<T>(url: string, data?: any, config?: any) { return this.request<T>('PUT', url, data, config); }
  patch<T>(url: string, data?: any, config?: any) { return this.request<T>('PATCH', url, data, config); }
  delete<T>(url: string, config?: any) { return this.request<T>('DELETE', url, undefined, config); }
  async getBlob(url: string, config?: any) { const res = await withTimeout(`${API_URL}${url}`, { headers: this.headers(undefined, config?.headers) }, 90000); return await res.blob(); }
  async postBlob(url: string, data?: any, config?: any) { const res = await withTimeout(`${API_URL}${url}`, { method: 'POST', headers: this.headers(data, config?.headers), body: JSON.stringify(data || {}) }, 90000); return await res.blob(); }
}

export const apiClient = new ApiClient();
const crud = (base: string) => ({ getAll: (params?: any) => apiClient.get(base, { params }), getById: (id: string) => apiClient.get(`${base}/${id}`), create: (data: any) => apiClient.post(base, data), update: (id: string, data: any) => apiClient.put(`${base}/${id}`, data), delete: (id: string) => apiClient.delete(`${base}/${id}`) });
const idCardApi = {
  ...crud('/id-cards'),
  getMine: () => apiClient.get('/id-cards/me/card'),
  stats: () => apiClient.get('/id-cards/reports/stats'),
  searchOwners: (params?: any) => apiClient.get('/id-cards/owners/search', { params }),
  generate: (data: any) => apiClient.post('/id-cards/generate', data),
  bulkGenerate: (data: any) => apiClient.post('/id-cards/bulk', data),
  renew: (id: string, data?: any) => apiClient.post(`/id-cards/${id}/renew`, data),
  verify: (data: any) => apiClient.post('/id-cards/verify', data),
  download: (id: string, format: 'pdf' | 'png' = 'pdf') => apiClient.getBlob(`/id-cards/${id}/download?format=${format}`),
  renderPdf: (data: any) => apiClient.postBlob('/id-cards/render-pdf', data),
  email: (id: string, data: any) => apiClient.post(`/id-cards/${id}/email`, data),
};

export const api: any = {
  auth: { login: (d: any) => apiClient.post('/auth/login', d), register: (d: any) => apiClient.post('/auth/register', d), forgotPassword: (d: any) => apiClient.post('/auth/forgot-password', d), profile: () => apiClient.get('/auth/profile'), updateProfile: (d: any) => apiClient.put('/auth/profile', d), changePassword: (d: any) => apiClient.post('/auth/change-password', d) },
  dashboard: { summary: () => apiClient.get('/dashboard/summary'), charts: () => apiClient.get('/dashboard/charts'), composition: () => apiClient.get('/dashboard/composition'), recentNotices: () => apiClient.get('/dashboard/recent-notices') },
  admissions: { schools: (p?: any) => apiClient.get('/admissions/public/schools', { params: p }), apply: (d: any) => apiClient.post('/admissions/public/apply', d), getAll: () => apiClient.get('/admissions'), accept: (id: string, d?: any) => apiClient.post(`/admissions/${id}/accept`, d), reject: (id: string) => apiClient.post(`/admissions/${id}/reject`) },
  publicResults: { schools: (p?: any) => apiClient.get('/academic/public/results/schools', { params: p }), options: (p?: any) => apiClient.get('/academic/public/results/options', { params: p }), lookup: (p: any) => apiClient.get('/academic/public/results', { params: p }) },
  users: { ...crud('/users'), getAllUsers: () => apiClient.get('/users/all'), updateStatus: (id: string, isActive: boolean) => apiClient.patch(`/users/${id}/status`, { isActive }), updateRole: (id: string, role: string) => apiClient.patch(`/users/${id}/role`, { role }), resetPassword: (id: string, password?: string) => apiClient.post(`/users/${id}/reset-password`, password ? { password } : undefined), permissions: () => apiClient.get('/users/permissions'), updatePermissions: (matrix: any) => apiClient.put('/users/permissions', { matrix }) },
  students: crud('/students'), teachers: crud('/teachers'), staff: crud('/staff'), documents: crud('/documents'), notices: crud('/notices'), idCards: idCardApi, payroll: crud('/payroll'), promotions: crud('/promotions'), holidays: crud('/holidays'),
  institution: { plans: () => apiClient.get('/institution/plans'), profile: () => apiClient.get('/institution/profile'), updateProfile: (d: any) => apiClient.put('/institution/profile', d), recordPayment: (d: any) => apiClient.post('/institution/billing/payment', d) },
  admin: { schools: (p?: any) => apiClient.get('/admin/schools', { params: p }), updateSchool: (id: string, d: any) => apiClient.patch(`/admin/schools/${id}`, d), verifyPayment: (id: string) => apiClient.post(`/admin/schools/${id}/verify-payment`), selectSchool: (id: string) => apiClient.get(`/admin/schools/${id}/select`), users: (p?: any) => apiClient.get('/admin/users', { params: p }) },
  academic: { classes: crud('/academic/classes'), sections: crud('/academic/sections'), subjects: crud('/academic/subjects'), exams: crud('/academic/exams'), results: crud('/academic/results'), reportCard: { students: (p: any) => apiClient.get('/academic/report-card/students', { params: p }), get: (p: any) => apiClient.get('/academic/report-card', { params: p }) } },
  attendance: { ...crud('/attendance'), mark: (d: any) => apiClient.post('/attendance/mark', d), reports: (p?: any) => apiClient.get('/attendance/reports', { params: p }), me: (p?: any) => apiClient.get('/attendance/me', { params: p }) },
  finance: { myFees: () => apiClient.get('/finance/my-fees'), fees: () => apiClient.get('/finance/fees'), payments: () => apiClient.get('/finance/payments'), collections: () => apiClient.get('/finance/collections'), reports: (p?: any) => apiClient.get('/finance/reports', { params: p }) },
  notifications: { getAll: () => apiClient.get('/notifications'), markRead: (id: string) => apiClient.patch(`/notifications/${id}/read`) },
  messages: { getAll: () => apiClient.get('/messages'), unread: () => apiClient.get('/messages/stats/unread'), send: (d: any) => apiClient.post('/messages', d) },
};
