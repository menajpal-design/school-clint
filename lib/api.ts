import { getDemoMode } from './demo-store';
import { demoRequest } from './demo-api';

const isBrowser = typeof window !== 'undefined';
const isLocal = isBrowser && /^(localhost|127\.0\.0\.1)$/i.test(window.location.hostname);

const normalizeApiUrl = (value: string) => value.replace(/\/$/, '').replace(/\/api$/, '') + '/api';

const defaultBrowserApiUrl = isBrowser ? '/api' : '';
const envApiUrl = process.env.NEXT_PUBLIC_API_URL || '';
const envApiTarget = process.env.NEXT_PUBLIC_API_TARGET || '';

export const API_URL = isBrowser
  ? (isLocal && envApiUrl ? normalizeApiUrl(envApiUrl) : (defaultBrowserApiUrl || normalizeApiUrl(envApiTarget || envApiUrl || '/api')))
  : normalizeApiUrl(envApiTarget || envApiUrl || '/api');

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

async function withTimeout(input: RequestInfo | URL, init: RequestInit = {}, ms = 90000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try { return await fetch(input, { ...init, signal: controller.signal }); }
  finally { clearTimeout(timer); }
}

const showAppToast = (title: string, message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success') => {
  if (!isBrowser) return;
  window.dispatchEvent(new CustomEvent('app-toast', { detail: { title, message, type, duration: 4500 } }));
};

class ApiClient {
  private currentToken: string | null = null;
  private lastToast = 0;
  private csrfToken: string | null = null;
  private csrfHeaderName: string = (process.env.NEXT_PUBLIC_CSRF_HEADER_NAME || 'x-csrf-token');
  private refreshing = false;

  private shouldAttachInstitutionScope(url: string) {
    if (url.startsWith('/admin/')) return false;
    if (!isBrowser) return false;
    const institutionId = localStorage.getItem('selectedInstitutionId');
    if (!institutionId) return false;
    const mainDomain = process.env.NEXT_PUBLIC_MAIN_DOMAIN || '';
    // If running on the platform (main) domain and an institution is selected, attach header.
    if (mainDomain && window.location.hostname.endsWith(mainDomain)) return true;
    // In local development attach when selected
    if (isLocal) return true;
    // Otherwise don't attach and let host-based tenancy resolve on server
    return false;
  }

  setToken(value: string, persist = true) {
    this.currentToken = value;
    if (!isBrowser) return;

    if (persist) {
      localStorage.setItem('token', value);
      sessionStorage.removeItem('token');
      return;
    }

    sessionStorage.setItem('token', value);
    localStorage.removeItem('token');
  }

  getToken() {
    if (this.currentToken) return this.currentToken;
    if (!isBrowser) return null;

    this.currentToken = localStorage.getItem('token') || sessionStorage.getItem('token');
    return this.currentToken;
  }

  clearToken() {
    this.currentToken = null;
    if (!isBrowser) return;
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
  }

  private headers(body?: any, extra?: any, url: string = '') {
    const h: any = { ...(extra || {}) };
    if (!(body instanceof FormData) && !h['Content-Type']) h['Content-Type'] = 'application/json';
    const auth = this.getToken();
    if (auth) h.Authorization = `Bearer ${auth}`;
    if (isBrowser && this.shouldAttachInstitutionScope(url)) {
      const institutionId = localStorage.getItem('selectedInstitutionId');
      if (institutionId) h['x-institution-id'] = institutionId;
    }
    return h;
  }

  private async request<T>(method: Method, url: string, data?: any, config: any = {}): Promise<T> {
    if (getDemoMode()) return await demoRequest(method, url, data) as T;
    const qs = config?.params ? `?${new URLSearchParams(Object.entries(config.params).filter(([, v]) => v !== undefined && v !== null) as any).toString()}` : '';
    const body = method === 'GET' || method === 'DELETE' ? undefined : (data instanceof FormData ? data : JSON.stringify(data || {}));
    const headers = this.headers(body instanceof FormData ? body : data, config.headers, url);

    // Attach CSRF token for state-changing requests
    if (method !== 'GET' && method !== 'DELETE') {
      try {
        await this.ensureCsrfToken();
        if (this.csrfToken) headers[this.csrfHeaderName] = this.csrfToken;
      } catch (err) {
        // ignore CSRF fetch errors; request will likely fail and be handled
      }
    }

    const init: RequestInit = { method, headers, body, credentials: 'include' };
    try {
      let res = await withTimeout(`${API_URL}${url}${qs}`, init, 90000);
      // If unauthorized, try to refresh and retry once
      if (res.status === 401 && isBrowser) {
        const refreshed = await this.attemptRefresh();
        if (refreshed) {
          // retry original request
          res = await withTimeout(`${API_URL}${url}${qs}`, init, 90000);
        }
      }
      return await this.parse<T>(res);
    }
    catch (e: any) { throw this.toError(e); }
  }

  private async ensureCsrfToken() {
    if (!isBrowser) return;
    if (this.csrfToken) return;
    try {
      const res = await withTimeout(`${API_URL}/csrf/token`, { method: 'GET', credentials: 'include' }, 15000);
      if (!res.ok) return;
      const data = await res.json();
      this.csrfToken = data?.csrfToken || null;
      // Fallback: if server set csrf cookie but token wasn't in JSON, read cookie directly
      if (!this.csrfToken) {
        try {
          const cookieName = (process.env.NEXT_PUBLIC_CSRF_COOKIE_NAME || 'csrf_token');
          const match = document.cookie.split(';').map(s => s.trim()).find(s => s.startsWith(cookieName + '='));
          if (match) this.csrfToken = decodeURIComponent(match.split('=')[1] || '') || null;
        } catch (e) {
          // ignore
        }
      }
    } catch (e) {
      // swallow
    }
  }

  private async attemptRefresh(): Promise<boolean> {
    if (!isBrowser) return false;
    if (this.refreshing) return false;
    this.refreshing = true;
    try {
      const res = await withTimeout(`${API_URL}/auth/refresh`, { method: 'POST', credentials: 'include' }, 15000);
      if (!res.ok) return false;
      // server sets refreshed cookies; optionally read new csrf token
      this.csrfToken = null;
      await this.ensureCsrfToken();
      return true;
    } catch (e) { return false; }
    finally { this.refreshing = false; }
  }

  private async parse<T>(res: Response): Promise<T> {
    if (res.status === 401) { this.clearToken(); if (isBrowser) window.location.href = '/login'; }
    const text = await res.text();
    const data = text ? (() => { try { return JSON.parse(text); } catch { return text; } })() : null;
    if (!res.ok) {
      if (isBrowser && (res.status === 428 || data?.code === 'STORAGE_CONFIG_REQUIRED')) {
        const message = data?.message || 'দয়া করে MongoDB URL এবং ImgBB API Key সেট করুন।';
        this.toast(message, 'Storage configuration required');
        const redirectTo = data?.redirectTo || '/settings';
        if (window.location.pathname !== redirectTo) window.location.href = redirectTo;
      }
      throw this.toError(data || { message: res.statusText });
    }
    return data as T;
  }

  private toError(err: any) {
    const raw = typeof err?.message === 'string' ? err.message : (typeof err === 'string' ? err : 'Server connection failed');
    const message = raw.includes('abort') || raw.includes('signal') ? 'Server response timeout. Please restart dyno or check database/API.' : raw;
    this.toast(message);
    return { message, error: err };
  }

  private toast(message: string, title = 'API Error') {
    if (!isBrowser) return;
    const now = Date.now();
    if (now - this.lastToast < 8000) return;
    this.lastToast = now;
    window.dispatchEvent(new CustomEvent('app-toast', { detail: { title, message, type: 'error', duration: 6000 } }));
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
const crud = (base: string) => ({ getAll: (params?: any) => apiClient.get(base, { params }), getById: (id: string) => apiClient.get(`${base}/${id}`), create: (data: any) => apiClient.post(base, data), update: (id: string, data: any) => apiClient.put(`${base}/${id}`, data), delete: (id: string) => apiClient.delete(base + '/' + id) });
const digits = (value: any) => String(value || '').replace(/\D/g, '');
const serialRoll = (index: number) => String(index + 1).padStart(2, '0');
const normalizeStudentRolls = (students: any[]) => students.map((student: any, index: number) => ({ ...student, rollNumber: student?.rollNumber || serialRoll(index) }));
const buildStudentRowsFromUsers = (users: any[]) => {
  const parents = users.filter((user: any) => user?.role === 'parent');
  const parentsByPhone = new Map<string, any>();
  parents.forEach((parent: any) => { const phone = digits(parent.phone); if (phone && !parentsByPhone.has(phone)) parentsByPhone.set(phone, parent); });
  return users.filter((user: any) => user?.role === 'student').map((user: any, index: number) => {
    const parent = parentsByPhone.get(digits(user.phone)) || parents[0];
    return { _id: `user-${user._id}`, rollNumber: user.rollNumber || serialRoll(index), admissionDate: user.createdAt, isActive: user.isActive !== false, userId: { _id: user._id, name: user.name, username: user.username, phone: user.phone, avatar: user.avatar }, classId: user.classId || undefined, sectionId: user.sectionId || undefined, parentId: parent ? { _id: parent._id, name: parent.name, username: parent.username, phone: parent.phone, avatar: parent.avatar } : undefined, guardianName: parent?.name || '', guardianPhone: parent?.phone || user.phone || '' };
  });
};
const getStudentsFromUsers = async () => {
  const usersData: any = await apiClient.get('/users');
  const users = Array.isArray(usersData?.users) ? usersData.users : [];
  return { students: buildStudentRowsFromUsers(users), fallbackFromUsers: true };
};
const buildTeacherRowsFromUsers = (users: any[]) => users.filter((user: any) => ['teacher', 'subject_teacher', 'class_teacher'].includes(user?.role)).map((user: any, index: number) => ({ _id: `user-${user._id}`, employeeId: user.employeeId || `T-${String(index + 1).padStart(3, '0')}`, designation: user.role === 'class_teacher' ? 'Class Teacher' : user.role === 'subject_teacher' ? 'Subject Teacher' : 'Teacher', department: user.department || '', salary: Number(user.salary || 0), joiningDate: user.createdAt, qualification: user.qualification || '', userId: { _id: user._id, name: user.name, username: user.username, email: user.email, phone: user.phone, avatar: user.avatar }, assignedClasses: [], subjects: [] }));
const getTeachersFromUsers = async () => {
  const usersData: any = await apiClient.get('/users');
  const users = Array.isArray(usersData?.users) ? usersData.users : [];
  return { teachers: buildTeacherRowsFromUsers(users), fallbackFromUsers: true };
};
const studentApi = { ...crud('/students'), getAll: async (params?: any) => { try { const data: any = await apiClient.get('/students', { params }); const students = Array.isArray(data?.students) ? normalizeStudentRolls(data.students) : []; if (students.length) return { ...data, students }; const fallback = await getStudentsFromUsers(); return { ...data, ...fallback }; } catch { return await getStudentsFromUsers(); } }, create: async (data: any) => { const payload = { ...data }; delete payload.email; delete payload.guardianEmail; const result = await apiClient.post('/students', payload); showAppToast('Student admitted', 'Username and password generated successfully.', 'success'); return result; }, update: async (id: string, data: any) => { const payload = { ...data }; delete payload.email; delete payload.guardianEmail; const result = await apiClient.put(`/students/${id}`, payload); showAppToast('Student updated', 'Student information saved successfully.', 'success'); return result; } };
const teacherApi = { ...crud('/teachers'), getAll: async (params?: any) => { try { const data: any = await apiClient.get('/teachers', { params }); const teachers = Array.isArray(data?.teachers) ? data.teachers : []; if (teachers.length) return { ...data, teachers }; const fallback = await getTeachersFromUsers(); return { ...data, ...fallback }; } catch { return await getTeachersFromUsers(); } }, create: async (data: any) => { const result = await apiClient.post('/teachers', data); showAppToast('Teacher saved', 'Teacher account/profile saved successfully.', 'success'); return result; }, update: async (id: string, data: any) => { const result = await apiClient.put(`/teachers/${id}`, data); showAppToast('Teacher updated', 'Teacher information saved successfully.', 'success'); return result; } };
const idCardApi = { ...crud('/id-cards'), getMine: () => apiClient.get('/id-cards/me/card'), stats: () => apiClient.get('/id-cards/reports/stats'), searchOwners: (params?: any) => apiClient.get('/id-cards/owners/search', { params }), generate: (data: any) => apiClient.post('/id-cards/generate', data), bulkGenerate: (data: any) => apiClient.post('/id-cards/bulk', data), renew: (id: string, data?: any) => apiClient.post(`/id-cards/${id}/renew`, data), verify: (data: any) => apiClient.post('/id-cards/verify', data), download: (id: string, format: 'pdf' | 'png' = 'pdf') => apiClient.getBlob(`/id-cards/${id}/download?format=${format}`), renderPdf: (data: any) => apiClient.postBlob('/id-cards/render-pdf', data), email: (id: string, data: any) => apiClient.post(`/id-cards/${id}/email`, data) };
const backupApi = {
  getAll: () => apiClient.get('/backup'),
  create: (data: any) => apiClient.post('/backup', data),
  export: (collections: string[]) => apiClient.postBlob('/backup/export', { collections }),
  import: (data: any) => apiClient.post('/backup/import', data),
  restore: (id: string) => apiClient.post(`/backup/${id}/restore`),
};

export const api: any = {
  auth: { login: (d: any) => apiClient.post('/auth/login', d), register: (d: any) => apiClient.post('/auth/register', d), forgotPassword: (d: any) => apiClient.post('/auth/forgot-password', d), profile: () => apiClient.get('/auth/profile'), updateProfile: (d: any) => apiClient.put('/auth/profile', d), changePassword: (d: any) => apiClient.post('/auth/change-password', d) },
  dashboard: { summary: () => apiClient.get('/dashboard/summary'), charts: () => apiClient.get('/dashboard/charts'), composition: () => apiClient.get('/dashboard/composition'), recentNotices: () => apiClient.get('/dashboard/recent-notices'), feeOverview: () => apiClient.get('/finance') },
  admissions: { schools: (p?: any) => apiClient.get('/admissions/public/schools', { params: p }), apply: (d: any) => apiClient.post('/admissions/public/apply', d), getAll: () => apiClient.get('/admissions'), accept: (id: string, d?: any) => apiClient.post(`/admissions/${id}/accept`, d), reject: (id: string) => apiClient.post(`/admissions/${id}/reject`) },
  publicResults: { schools: (p?: any) => apiClient.get('/academic/public/results/schools', { params: p }), options: (p?: any) => apiClient.get('/academic/public/results/options', { params: p }), lookup: (p: any) => apiClient.get('/academic/public/results', { params: p }) },
  users: { ...crud('/users'), getAllUsers: () => apiClient.get('/users/all'), updateStatus: (id: string, isActive: boolean) => apiClient.patch(`/users/${id}/status`, { isActive }), updateRole: (id: string, role: string) => apiClient.patch(`/users/${id}/role`, { role }), resetPassword: (id: string, password?: string) => apiClient.post(`/users/${id}/reset-password`, password ? { password } : undefined), permissions: () => apiClient.get('/users/permissions'), updatePermissions: (matrix: any) => apiClient.put('/users/permissions', { matrix }) },
  students: studentApi, teachers: teacherApi, staff: crud('/staff'), documents: crud('/documents'), notices: crud('/notices'), homework: { getAll: (params?: any) => apiClient.get('/homework', { params }), create: (data: any) => apiClient.post('/homework', data), delete: (id: string) => apiClient.delete(`/homework/${id}`) }, idCards: idCardApi, payroll: crud('/payroll'), promotions: crud('/promotions'), holidays: crud('/holidays'), backup: backupApi,
  library: { books: crud('/library/books'), loans: crud('/library/loans'), issue: (d: any) => apiClient.post('/library/loans/issue', d), return: (d: any) => apiClient.post('/library/loans/return') },
  institution: { plans: () => apiClient.get('/institution/plans'), profile: () => apiClient.get('/institution/profile'), updateProfile: (d: any) => apiClient.put('/institution/profile', d), recordPayment: (d: any) => apiClient.post('/institution/billing/payment', d), createStripeCheckout: (d: any) => apiClient.post('/institution/billing/stripe/checkout', d), checkSubdomain: (sub: string) => apiClient.get('/institution/subdomain/check', { params: { subdomain: sub } }) },
  institutionSmsTopup: (d: any) => apiClient.post('/institution/sms/topup', d),
  institutionSmsTopupPayment: (d: any) => apiClient.post('/institution/sms/topup/payment', d),
  institutionSmsTopupHistory: (p?: any) => apiClient.get('/institution/sms/topup/history', { params: p }),
  admin: { schools: (p?: any) => apiClient.get('/admin/schools', { params: p }), accounting: (p?: any) => apiClient.get('/admin/accounting', { params: p }), updateSchool: (id: string, d: any) => apiClient.patch(`/admin/schools/${id}`, d), verifyPayment: (id: string) => apiClient.post(`/admin/schools/${id}/verify-payment`), selectSchool: (id: string) => apiClient.get(`/admin/schools/${id}/select`), users: (p?: any) => apiClient.get('/admin/users', { params: p }), createUser: (d: any) => apiClient.post('/admin/users', d), backupExportAll: () => apiClient.get('/admin/backup/export-all'), backupImportAll: (data: any) => apiClient.post('/admin/backup/import-all', data) },
  academic: { classes: crud('/academic/classes'), sections: crud('/academic/sections'), subjects: crud('/academic/subjects'), exams: crud('/academic/exams'), results: crud('/academic/results'), reportCard: { students: (p: any) => apiClient.get('/academic/report-card/students', { params: p }), get: (p: any) => apiClient.get('/academic/report-card', { params: p }) } },
  attendance: { ...crud('/attendance'), getPeople: (p?: any) => apiClient.get('/attendance/people', { params: p }), getReports: (p?: any) => apiClient.get('/attendance/reports', { params: p }), getMine: (p?: any) => apiClient.get('/attendance/me', { params: p }), markMine: (d: any) => apiClient.post('/attendance/me/mark', d), mark: (d: any) => apiClient.post('/attendance/mark', d), reports: (p?: any) => apiClient.get('/attendance/reports', { params: p }), me: (p?: any) => apiClient.get('/attendance/me', { params: p }) },
  finance: { dashboard: () => apiClient.get('/finance'), myFees: () => apiClient.get('/finance/my-fees'), fees: () => apiClient.get('/finance/fees'), payments: () => apiClient.get('/finance/payments'), collections: () => apiClient.get('/finance/collections'), salary: () => apiClient.get('/finance/salary'), reports: (p?: any) => apiClient.get('/finance/reports', { params: p }) },
  notifications: { getAll: () => apiClient.get('/notifications'), markRead: (id: string) => apiClient.patch(`/notifications/${id}/read`), markAll: () => apiClient.patch('/notifications/read-all') },
  messages: {
    getAll: () => apiClient.get('/messages'),
    getInbox: () => apiClient.get('/messages/inbox'),
    getUnreadCount: () => apiClient.get('/messages/stats/unread'),
    unread: () => apiClient.get('/messages/stats/unread'),
    markAsRead: (id: string) => apiClient.patch(`/messages/${id}/read`),
    send: (d: any) => apiClient.post('/messages/send', d),
  },
};