import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { describe, expect, it } from 'vitest';
import auth from '../features/auth/authSlice';
import { ProtectedRoute } from '../routes/ProtectedRoute';
import type { User } from '../types';

const user: User = { id: '1', name: 'A', email: 'a@b.co', phone: '+911234567890', role: 'customer', emailVerified: true, phoneVerified: false, consent: { transactionalNotifications: true, marketingNotifications: false }, createdAt: '' };

function renderAt(path: string, preloaded: { user: User | null; status: 'loading' | 'ready' }, roles?: ('admin')[]) {
  const store = configureStore({ reducer: { auth }, preloadedState: { auth: preloaded } });
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route element={<ProtectedRoute roles={roles} />}><Route path="/secret" element={<p>secret page</p>} /></Route>
          <Route path="/login" element={<p>login page</p>} />
          <Route path="/account" element={<p>account page</p>} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
}

describe('ProtectedRoute', () => {
  it('redirects anonymous visitors to login', () => {
    renderAt('/secret', { user: null, status: 'ready' });
    expect(screen.getByText('login page')).toBeInTheDocument();
  });
  it('shows a loading state while the session is being checked', () => {
    renderAt('/secret', { user: null, status: 'loading' });
    expect(screen.getByLabelText('Loading your account')).toBeInTheDocument();
  });
  it('lets signed-in users through', () => {
    renderAt('/secret', { user, status: 'ready' });
    expect(screen.getByText('secret page')).toBeInTheDocument();
  });
  it('sends users without the required role away from the page', () => {
    renderAt('/secret', { user, status: 'ready' }, ['admin']);
    expect(screen.getByText('account page')).toBeInTheDocument();
  });
});
