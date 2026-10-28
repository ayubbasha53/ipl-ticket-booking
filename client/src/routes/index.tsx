import { createBrowserRouter } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { GuestRoute, ProtectedRoute } from './ProtectedRoute';
import Home from '../pages/Home';
import Login from '../pages/Login';
import Register from '../pages/Register';
import VerifyEmail from '../pages/VerifyEmail';
import ForgotPassword from '../pages/ForgotPassword';
import ResetPassword from '../pages/ResetPassword';
import Profile from '../pages/Profile';
import NotFound from '../pages/NotFound';
import { Contact, Privacy, Terms } from '../pages/Legal';

export const router = createBrowserRouter([
  {
    element: <MainLayout />,
    children: [
      { path: '/', element: <Home /> },
      { element: <GuestRoute />, children: [{ path: '/login', element: <Login /> }, { path: '/register', element: <Register /> }] },
      { path: '/verify-email', element: <VerifyEmail /> },
      { path: '/forgot-password', element: <ForgotPassword /> },
      { path: '/reset-password', element: <ResetPassword /> },
      { path: '/terms', element: <Terms /> },
      { path: '/privacy', element: <Privacy /> },
      { path: '/contact', element: <Contact /> },
      { element: <ProtectedRoute />, children: [{ path: '/account', element: <Profile /> }] },
      { path: '*', element: <NotFound /> },
    ],
  },
]);
