import { api } from './client';
import type { SessionInfo, User } from '../types';

export const authApi = {
  register: (b: { name: string; email: string; phone: string; password: string; confirmPassword: string; acceptTerms: boolean; marketingNotifications: boolean }) =>
    api.post<{ user: User; message: string; emailDelivery: string }>('/auth/register', b).then((r) => r.data),
  login: (b: { identifier: string; password: string; rememberMe: boolean }) => api.post<{ user: User }>('/auth/login', b).then((r) => r.data.user),
  logout: () => api.post('/auth/logout', {}),
  verifyEmail: (token: string) => api.post<{ user: User }>('/auth/verify-email', { token }).then((r) => r.data),
  resendVerification: (email: string) => api.post<{ message: string }>('/auth/resend-verification', { email }).then((r) => r.data),
  forgotPassword: (email: string) => api.post<{ message: string }>('/auth/forgot-password', { email }).then((r) => r.data),
  resetPassword: (b: { token: string; password: string; confirmPassword: string }) => api.post<{ message: string }>('/auth/reset-password', b).then((r) => r.data),
  me: () => api.get<{ user: User }>('/users/me').then((r) => r.data.user),
  updateMe: (b: { name?: string; phone?: string; marketingNotifications?: boolean }) => api.patch<{ user: User }>('/users/me', b).then((r) => r.data.user),
  changePassword: (b: { currentPassword: string; newPassword: string; confirmPassword: string }) => api.patch<{ message: string }>('/users/me/password', b).then((r) => r.data),
  sessions: () => api.get<{ sessions: SessionInfo[] }>('/users/me/sessions').then((r) => r.data.sessions),
  endSession: (id: string) => api.delete(`/users/me/sessions/${id}`),
  logoutAll: () => api.post('/users/me/logout-all', {}),
};
