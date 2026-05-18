type LibraryAuthHeaders = Record<string, string>;

const buildAuthHeaders = (): LibraryAuthHeaders => {
  if (typeof window === 'undefined') return {};
  const headers: LibraryAuthHeaders = {};
  const token = localStorage.getItem('token');
  const institutionId = localStorage.getItem('selectedInstitutionId');
  if (token) headers.Authorization = `Bearer ${token}`;
  if (institutionId) headers['x-institution-id'] = institutionId;
  return headers;
};

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api/library${path}`, {
    credentials: 'include',
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...buildAuthHeaders(),
      ...(init.headers || {}),
    },
  });
  const text = await response.text();
  const data = text ? (() => { try { return JSON.parse(text); } catch { return text; } })() : null;
  if (!response.ok) {
    throw new Error((data as any)?.message || response.statusText || 'Request failed');
  }
  return data as T;
}

export const libraryClient = {
  getBooks: () => request<any[]>('/books'),
  createBook: (payload: any) => request('/books', { method: 'POST', body: JSON.stringify(payload) }),
  updateBook: (id: string, payload: any) => request(`/books/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteBook: (id: string) => request(`/books/${id}`, { method: 'DELETE' }),
  getLoans: () => request<any[]>('/loans'),
  issueBook: (payload: any) => request('/loans/issue', { method: 'POST', body: JSON.stringify(payload) }),
  returnBook: (payload: any) => request('/loans/return', { method: 'POST', body: JSON.stringify(payload) }),
};
