import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useAppSelector } from '../app/store';
import type { Role } from '../types';

/** UX guard only. The API enforces authorization on every request. */
export function ProtectedRoute({ roles }: { roles?: Role[] }) {
  const { user, status } = useAppSelector((s) => s.auth);
  const location = useLocation();
  if (status === 'loading') return <Box sx={{ display: 'grid', placeItems: 'center', py: 10 }}><CircularProgress aria-label="Loading your account" /></Box>;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/account" replace />;
  return <Outlet />;
}

/** Keeps signed-in people out of login/register. */
export function GuestRoute() {
  const { user, status } = useAppSelector((s) => s.auth);
  if (status === 'loading') return null;
  return user ? <Navigate to="/account" replace /> : <Outlet />;
}
