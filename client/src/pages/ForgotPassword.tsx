import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link as RouterLink } from 'react-router-dom';
import { Alert, Box, Button, CircularProgress, Link, Stack, TextField } from '@mui/material';
import { useState } from 'react';
import type { z } from 'zod';
import { AuthShell } from '../components/AuthShell';
import { authApi } from '../api/auth';
import { forgotSchema } from '../utils/schemas';
import { parseApiError } from '../utils/errors';

type Form = z.infer<typeof forgotSchema>;

export default function ForgotPassword() {
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({ resolver: zodResolver(forgotSchema), defaultValues: { email: '' } });

  const onSubmit = handleSubmit(async ({ email }) => {
    setErr(null);
    try { setMsg((await authApi.forgotPassword(email)).message); } catch (e) { setErr(parseApiError(e).message); }
  });

  return (
    <AuthShell title="Reset your password" subtitle="Enter the email address you registered with. If we find an account, we will send a link that works once for 30 minutes.">
      <Box component="form" onSubmit={onSubmit} noValidate>
        <Stack spacing={2.5} sx={{ maxWidth: 460 }}>
          {msg && <Alert severity="success" role="status">{msg}</Alert>}
          {err && <Alert severity="error" role="alert">{err}</Alert>}
          <TextField label="Email address" type="email" autoComplete="email" autoFocus {...register('email')} error={!!errors.email} helperText={errors.email?.message} />
          <Button type="submit" variant="contained" size="large" disabled={isSubmitting} startIcon={isSubmitting ? <CircularProgress size={18} color="inherit" /> : undefined}>Send reset link</Button>
          <Link component={RouterLink} to="/login">Back to sign in</Link>
        </Stack>
      </Box>
    </AuthShell>
  );
}
