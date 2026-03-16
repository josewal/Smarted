import type { ApiResponse, ApiError } from 'smarted-shared';

const BASE = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });

  if (!res.ok) {
    if (res.status === 401 && !path.startsWith('/auth/login') && !path.startsWith('/auth/register') && !path.startsWith('/auth/me')) {
      window.location.href = '/login?expired=1';
      throw new Error('Session expired');
    }
    const error: ApiError = await res.json().catch(() => ({ error: 'Unknown', message: res.statusText }));
    throw new Error(error.message || error.error);
  }

  const json: ApiResponse<T> = await res.json();
  return json.data;
}

export const api = {
  // Auth
  register: (email: string, password: string, name?: string) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify({ email, password, name }) }),
  login: (email: string, password: string) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  logout: () =>
    request('/auth/logout', { method: 'POST' }),
  me: () =>
    request<import('smarted-shared').User>('/auth/me'),
  forgotPassword: (email: string) =>
    request<{ message: string }>('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (token: string, password: string) =>
    request<{ message: string }>('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, password }) }),
  changePassword: (currentPassword: string, newPassword: string) =>
    request<{ message: string }>('/auth/change-password', { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) }),
  verifyEmail: (token: string) =>
    request<{ message: string }>('/auth/verify-email', { method: 'POST', body: JSON.stringify({ token }) }),
  resendVerification: () =>
    request<{ message: string }>('/auth/resend-verification', { method: 'POST' }),

  // Cards
  listCards: (workspaceId: string) =>
    request<import('smarted-shared').Card[]>(`/cards?workspace_id=${workspaceId}`),
  getCard: (id: string) =>
    request<import('smarted-shared').Card>(`/cards/${id}`),
  createCard: (input: import('smarted-shared').CreateCardInput) =>
    request<import('smarted-shared').Card>('/cards', { method: 'POST', body: JSON.stringify(input) }),
  updateCard: (id: string, input: import('smarted-shared').UpdateCardInput) =>
    request<import('smarted-shared').Card>(`/cards/${id}`, { method: 'PUT', body: JSON.stringify(input) }),
  deleteCard: (id: string) =>
    request(`/cards/${id}`, { method: 'DELETE' }),
  generateCards: (sourceId: string, workspaceId: string, count?: number) =>
    request<import('smarted-shared').Card[]>('/cards/generate', {
      method: 'POST',
      body: JSON.stringify({ source_id: sourceId, workspace_id: workspaceId, count }),
    }),

  // Study
  getDueCards: (workspaceId: string) =>
    request<import('smarted-shared').StudyCard[]>(`/study/due?workspace_id=${workspaceId}`),
  submitReview: (input: import('smarted-shared').ReviewInput) =>
    request<import('smarted-shared').ReviewResult>('/study/review', { method: 'POST', body: JSON.stringify(input) }),
  getStats: (workspaceId: string) =>
    request<import('smarted-shared').DashboardStats>(`/study/stats?workspace_id=${workspaceId}`),

  // Sources
  listSources: (workspaceId: string) =>
    request<import('smarted-shared').SourceMaterial[]>(`/sources?workspace_id=${workspaceId}`),
  createSource: (workspaceId: string, title: string, type: string, content: string) =>
    request<import('smarted-shared').SourceMaterial>('/sources', {
      method: 'POST',
      body: JSON.stringify({ workspace_id: workspaceId, title, type, content }),
    }),
  deleteSource: (id: string) =>
    request(`/sources/${id}`, { method: 'DELETE' }),
};
