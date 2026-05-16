import { apiClient } from './api';

export const moduleApi = {
  siteSettings: {
    getSiteConfig: () => apiClient.get('/site-settings/site-config'),
    updateSiteConfig: (data: any) => apiClient.put('/site-settings/site-config', data),
    getAppControls: () => apiClient.get('/site-settings/app-controls'),
    updateAppControls: (data: any) => apiClient.put('/site-settings/app-controls', data),
  },

  classRoutines: {
    getAll: (params?: any) => apiClient.get('/class-routines', params ? { params } : undefined),
    getMine: (params?: any) => apiClient.get('/class-routines/my', params ? { params } : undefined),
    getPublic: (params?: any) => apiClient.get('/class-routines/public', params ? { params } : undefined),
    create: (data: any) => apiClient.post('/class-routines', data),
    update: (id: string, data: any) => apiClient.put(`/class-routines/${id}`, data),
    updateApproval: (id: string, data: any) => apiClient.patch(`/class-routines/${id}/approval`, data),
    updatePublic: (id: string, isPublic: boolean) => apiClient.patch(`/class-routines/${id}/public`, { isPublic }),
    delete: (id: string) => apiClient.delete(`/class-routines/${id}`),
  },

  leaves: {
    getAll: (params?: any) => apiClient.get('/leaves', params ? { params } : undefined),
    apply: (data: any) => apiClient.post('/leaves', data),
    review: (id: string, data: any) => apiClient.patch(`/leaves/${id}/review`, data),
  },

  promotions: {
    preview: (params: any) => apiClient.get('/promotions/preview', { params }),
    process: (data: any) => apiClient.post('/promotions/process', data),
    records: (params?: any) => apiClient.get('/promotions/records', params ? { params } : undefined),
  },

  payroll: {
    previewAttendanceSalary: (params: any) => apiClient.get('/payroll/salary-attendance/preview', { params }),
    processAttendanceSalary: (data: any) => apiClient.post('/payroll/salary-attendance/process', data),
  },

  sms: {
    headMonthly: (params?: any) => apiClient.get('/sms/head/monthly', params ? { params } : undefined),
    adminUsage: (params?: any) => apiClient.get('/sms/admin/usage', params ? { params } : undefined),
    log: (data: any) => apiClient.post('/sms/logs', data),
  },

  messages: {
    unread: () => apiClient.get('/messages/stats/unread'),
    inbox: () => apiClient.get('/messages/inbox'),
    sent: () => apiClient.get('/messages/sent'),
    detail: (id: string) => apiClient.get(`/messages/${id}`),
    send: (data: any) => apiClient.post('/messages/send', data),
    markRead: (id: string) => apiClient.patch(`/messages/${id}/read`),
    remove: (id: string) => apiClient.delete(`/messages/${id}`),
  },
};

export default moduleApi;
