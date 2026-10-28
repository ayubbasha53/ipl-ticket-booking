import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { authApi } from '../../api/auth';
import type { User } from '../../types';

interface AuthState { user: User | null; status: 'loading' | 'ready' }
const initialState: AuthState = { user: null, status: 'loading' };

// A 401 here simply means "not signed in".
export const bootstrapSession = createAsyncThunk('auth/bootstrap', async () => {
  try { return await authApi.me(); } catch { return null; }
});
export const signIn = createAsyncThunk('auth/signIn', (b: Parameters<typeof authApi.login>[0]) => authApi.login(b));
export const signOut = createAsyncThunk('auth/signOut', async () => { try { await authApi.logout(); } catch { /* session may already be gone */ } });

const slice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (s, a: PayloadAction<User>) => { s.user = a.payload; },
    sessionExpired: (s) => { s.user = null; },
  },
  extraReducers: (b) => {
    b.addCase(bootstrapSession.fulfilled, (s, a) => { s.user = a.payload; s.status = 'ready'; });
    b.addCase(signIn.fulfilled, (s, a) => { s.user = a.payload; });
    b.addCase(signOut.fulfilled, (s) => { s.user = null; });
  },
});

export const { setUser, sessionExpired } = slice.actions;
export default slice.reducer;
