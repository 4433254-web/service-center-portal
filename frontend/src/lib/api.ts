const API_BASE = '/api';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('sc_token');
}
export function setToken(t: string) { localStorage.setItem('sc_token', t); }
export function clearToken() { localStorage.removeItem('sc_token'); localStorage.removeItem('sc_user'); }
export function getUser() {
  if (typeof window === 'undefined') return null;
  try { const s = localStorage.getItem('sc_user'); return s ? JSON.parse(s) : null; } catch { return null; }
}
export function setUser(u: any) { localStorage.setItem('sc_user', JSON.stringify(u)); }

async function request<T>(method: string, path: string, body?: any): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, {
    method, headers, body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401) { clearToken(); if (typeof window !== 'undefined') window.location.href = '/login'; throw new Error('Unauthorized'); }
  if (!res.ok) { const e = await res.json().catch(() => ({ message: res.statusText })); throw new Error(e.message ?? `HTTP ${res.status}`); }
  if (res.status === 204) return undefined as T;
  return res.json();
}

async function uploadFile<T>(path: string, formData: FormData): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, { method: 'POST', headers, body: formData });
  if (res.status === 401) { clearToken(); if (typeof window !== 'undefined') window.location.href = '/login'; throw new Error('Unauthorized'); }
  if (!res.ok) { const e = await res.json().catch(() => ({ message: res.statusText })); throw new Error(e.message ?? `HTTP ${res.status}`); }
  return res.json();
}

export const api = {
  get: <T>(p: string) => request<T>('GET', p),
  post: <T>(p: string, b?: any) => request<T>('POST', p, b),
  patch: <T>(p: string, b?: any) => request<T>('PATCH', p, b),
  del: <T>(p: string) => request<T>('DELETE', p),
};

export const authApi = {
  login: (login: string, password: string) => api.post<{ access_token: string; user: any }>('/auth/login', { login, password }),
  me: () => api.get<any>('/auth/me'),
};

export const ordersApi = {
  list: (params?: Record<string, string>) => { const q = params ? '?' + new URLSearchParams(params).toString() : ''; return api.get<{ items: any[]; total: number }>(`/orders${q}`); },
  get: (id: string) => api.get<any>(`/orders/${id}`),
  create: (data: any) => api.post<any>('/orders', data),
  update: (id: string, data: any) => api.patch<any>(`/orders/${id}`, data),
  changeStatus: (id: string, toStatus: string, comment?: string) => api.post<any>(`/orders/${id}/status`, { toStatus, comment }),
  statusHistory: (id: string) => api.get<any[]>(`/orders/${id}/status-history`),
  comments: (id: string) => api.get<any[]>(`/orders/${id}/comments`),
  addComment: (id: string, commentText: string, isInternal?: boolean) => api.post<any>(`/orders/${id}/comments`, { commentText, isInternal }),
  documents: (id: string) => api.get<any[]>(`/orders/${id}/documents`),
  generateReceipt: (id: string) => api.post<any>(`/orders/${id}/documents/receipt`),
  files: (id: string) => api.get<any[]>(`/orders/${id}/files`),
  photos: (id: string) => api.get<any[]>(`/orders/${id}/photos`),
  uploadPhoto: (id: string, file: File, comment: string, stage: string) => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('comment', comment);
    fd.append('stage', stage);
    return uploadFile<any>(`/orders/${id}/photos`, fd);
  },
  deletePhoto: (orderId: string, photoId: string) => api.del<any>(`/orders/${orderId}/photos/${photoId}`),
  transfer: (id: string, toLocationId: string, comment?: string) =>
    api.post<any>(`/orders/${id}/transfer`, { toLocationId, comment }),
  assignMaster: (id: string, masterUserId: string | null) =>
    api.patch<any>(`/orders/${id}/master`, { masterUserId }),
};

export const clientsApi = {
  list: (params?: Record<string, string>) => { const q = params ? '?' + new URLSearchParams(params).toString() : ''; return api.get<{ items: any[]; total: number }>(`/clients${q}`); },
  get: (id: string) => api.get<any>(`/clients/${id}`),
  create: (data: any) => api.post<any>('/clients', data),
  update: (id: string, data: any) => api.patch<any>(`/clients/${id}`, data),
  orders: (id: string) => api.get<any[]>(`/clients/${id}/orders`),
  devices: (id: string) => api.get<any[]>(`/clients/${id}/devices`),
};

export const devicesApi = {
  list: (params?: Record<string, string>) => { const q = params ? '?' + new URLSearchParams(params).toString() : ''; return api.get<{ items: any[]; total: number }>(`/devices${q}`); },
  get: (id: string) => api.get<any>(`/devices/${id}`),
  create: (data: any) => api.post<any>('/devices', data),
};

export const usersApi = {
  list: () => api.get<any[]>('/users'),
  create: (data: any) => api.post<any>('/users', data),
  update: (id: string, data: any) => api.patch<any>(`/users/${id}`, data),
  resetPassword: (id: string, password: string) => api.post<any>(`/users/${id}/reset-password`, { password }),
};

export const dashboardApi = {
  stats: () => api.get<any>('/dashboard'),
};

export const locationsApi = {
  list: () => api.get<any[]>('/locations'),
  get: (id: string) => api.get<any>(`/locations/${id}`),
  create: (data: any) => api.post<any>('/locations', data),
  update: (id: string, data: any) => api.patch<any>(`/locations/${id}`, data),
  addUser: (locationId: string, userId: string) => api.post<any>(`/locations/${locationId}/users`, { userId }),
  removeUser: (locationId: string, userId: string) => api.del<any>(`/locations/${locationId}/users/${userId}`),
  getUsers: (locationId: string) => api.get<any[]>(`/locations/${locationId}/users`),
};
