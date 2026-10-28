import axios from 'axios';

export interface ApiError { message: string; code?: string; fields: Record<string, string> }

/** Normalises server errors (validation `fields`, duplicate-account `details.fields`) into one shape. */
export function parseApiError(err: unknown): ApiError {
  if (axios.isAxiosError(err)) {
    if (!err.response) return { message: 'Cannot reach the server. Check your connection and try again.', code: 'network', fields: {} };
    const e = err.response.data?.error;
    return { message: e?.message ?? 'Something went wrong. Try again.', code: e?.code, fields: e?.fields ?? e?.details?.fields ?? {} };
  }
  return { message: 'Something went wrong. Try again.', fields: {} };
}
