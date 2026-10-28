import axios, { type InternalAxiosRequestConfig } from 'axios';

export const api = axios.create({ baseURL: '/api', withCredentials: true, timeout: 15000 });

const readCsrf = () => document.cookie.split('; ').find((c) => c.startsWith('ipl_csrf='))?.split('=')[1];

// Double-submit CSRF: echo the (non-httpOnly) cookie in a header on every state-changing request.
api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  if (config.method && config.method.toLowerCase() !== 'get') {
    let token = readCsrf();
    if (!token) {
      await axios.get('/api/csrf', { withCredentials: true });
      token = readCsrf();
    }
    if (token) config.headers.set('X-CSRF-Token', token);
  }
  return config;
});

let onUnauthorized: (() => void) | null = null;
export const setUnauthorizedHandler = (fn: () => void) => { onUnauthorized = fn; };

api.interceptors.response.use(
  (r) => r,
  (err) => {
    const url: string = err.config?.url ?? '';
    // A 401 from a protected call means the session ended; auth endpoints handle their own 401s.
    if (err.response?.status === 401 && !url.startsWith('/auth/') && url !== '/users/me') onUnauthorized?.();
    return Promise.reject(err);
  },
);
