import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link as RouterLink, useNavigate, useSearchParams } from 'react-router-dom';
import { Alert, Box, Button, CircularProgress, Link, Stack } from '@mui/material';
import { useSnackbar } from 'notistack';
import { useState } from 'react';
import type { z } from 'zod';
import { AuthShell } from '../components/AuthShell';
import { PasswordField } from '../components/PasswordField';
import { PasswordChecklist } from '../components/PasswordChecklist';
import { authApi } from '../api/auth';
import { resetSchema } from '../utils/schemas';
import { parseApiError } from '../utils/errors';

type Form = z.infer<typeof resetSchema>;

export default function ResetPassword() {
  const token = useSearchParams()[0].get('token') ?? '';
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [err, setErr] = useState<string | null>(null);
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<Form>({ resolver: zodResolver(resetSchema), defaultValues: { password: '', confirmPassword: '' } });

  const onSubmit = handleSubmit(async (v) => {
    setErr(null);
    try {
      await authApi.resetPassword({ token, ...v });
      enqueueSnackbar('Password updated. Sign in with your new password.', { variant: 'success' });
      navigate('/login', { replace: true });
    } catch (e) { setErr(parseApiError(e).message); }
  });

  if (!/^[a-f0-9]{64}$/i.test(token)) {
    return (
      <AuthShell title="Link not valid">
        <Stack spacing={2} sx={{ maxWidth: 460 }}>
          <Alert severity="error">This reset link is incomplete. Request a new one.</Alert>
          <Button variant="contained" component={RouterLink} to="/forgot-password">Request a new link</Button>
        </Stack>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Choose a new password" subtitle="You will be signed out everywhere after changing it.">
      <Box component="form" onSubmit={onSubmit} noValidate>
        <Stack spacing={2.5} sx={{ maxWidth: 460 }}>
          {err && <Alert severity="error" role="alert" action={<Button color="inherit" size="small" component={RouterLink} to="/forgot-password">New link</Button>}>{err}</Alert>}
          <PasswordField label="New password" autoComplete="new-password" autoFocus {...register('password')} error={!!errors.password} helperText={errors.password?.message} />
          <PasswordChecklist value={watch('password') ?? ''} />
          <PasswordField label="Confirm new password" autoComplete="new-password" {...register('confirmPassword')} error={!!errors.confirmPassword} helperText={errors.confirmPassword?.message} />
          <Button type="submit" variant="contained" size="large" disabled={isSubmitting} startIcon={isSubmitting ? <CircularProgress size={18} color="inherit" /> : undefined}>Update password</Button>
          <Link component={RouterLink} to="/login">Back to sign in</Link>
        </Stack>
      </Box>
    </AuthShell>
  );
}
