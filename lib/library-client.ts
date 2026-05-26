import { apiClient } from './api';

export const libraryClient = {
  getBooks: () => apiClient.get<any[]>('/library/books'),
  createBook: (payload: any) => apiClient.post('/library/books', payload),
  updateBook: (id: string, payload: any) => apiClient.put(`/library/books/${id}`, payload),
  deleteBook: (id: string) => apiClient.delete(`/library/books/${id}`),
  getLoans: () => apiClient.get<any[]>('/library/loans'),
  issueBook: (payload: any) => apiClient.post('/library/loans/issue', payload),
  returnBook: (payload: any) => apiClient.post('/library/loans/return', payload),
};
