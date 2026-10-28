import { useEffect, useRef, useState } from 'react';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import { Alert, Button, CircularProgress, Stack } from '@mui/material';
import { AuthShell } from '../components/AuthShell';
import { authApi } from '../api/auth';
import { parseApiError } from '../utils/errors';
import { useAppDispatch, useAppSelector } from '../app/store';
import { setUser } from '../features/auth/authSlice';

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const dispatch = useAppDispatch();
  const signedIn = useAppSelector((s) => !!s.auth.user);
  const [state, setState] = useState<'working' | 'ok' | 'error'>('working');
  const [message, setMessage] = useState('');
  const started = useRef(false); // the link is single-use; avoid the dev double-effect

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (!token) { setState('error'); setMessage('This verification link is not valid.'); return; }
    authApi.verifyEmail(token)
      .then(({ user }) => { setState('ok'); if (signedIn) dispatch(setUser(user)); })
      .catch((e) => { setState('error'); setMessage(parseApiError(e).message); });
  }, [token, signedIn, dispatch]);

  return (
    <AuthShell title="Email verification">
      <Stack spacing={2} sx={{ maxWidth: 460 }} aria-live="polite">
        {state === 'working' && <Stack direction="row" spacing={2} alignItems="center"><CircularProgress size={24} /><span>Verifying your email</span></Stack>}
        {state === 'ok' && (<><Alert severity="success">Your email address is verified.</Alert><Button variant="contained" component={RouterLink} to={signedIn ? '/account' : '/login'}>{signedIn ? 'Go to your account' : 'Sign in'}</Button></>)}
        {state === 'error' && (<><Alert severity="error">{message}</Alert><Button variant="outlined" component={RouterLink} to="/account">Request a new link from your account</Button></>)}
      </Stack>
    </AuthShell>
  );
}
