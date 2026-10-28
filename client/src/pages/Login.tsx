import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { Alert, Box, Button, Checkbox, CircularProgress, FormControlLabel, Link, Stack, TextField } from '@mui/material';
import { useSnackbar } from 'notistack';
import { useState } from 'react';
import { AuthShell } from '../components/AuthShell';
import { PasswordField } from '../components/PasswordField';
import { useAppDispatch } from '../app/store';
import { signIn } from '../features/auth/authSlice';
import { loginSchema } from '../utils/schemas';
import { parseApiError } from '../utils/errors';
import type { z } from 'zod';

type Form = z.infer<typeof loginSchema>;

export default function Login() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { enqueueSnackbar } = useSnackbar();
  const [formError, setFormError] = useState<string | null>(null);
  const { register, handleSubmit, control, formState: { errors, isSubmitting } } = useForm<Form>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: '', password: '', rememberMe: false },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await dispatch(signIn(values)).unwrap();
      enqueueSnackbar('Signed in', { variant: 'success' });
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from && from.startsWith('/') ? from : '/account', { replace: true });
    } catch (e) {
      setFormError(parseApiError(e).message);
    }
  });

  return (
    <AuthShell title="Sign in" subtitle="Use your email address or mobile number.">
      <Box component="form" onSubmit={onSubmit} noValidate>
        <Stack spacing={2.5} sx={{ maxWidth: 460 }}>
          {formError && <Alert severity="error" role="alert">{formError}</Alert>}
          <TextField label="Email or mobile number" autoComplete="username" autoFocus {...register('identifier')} error={!!errors.identifier} helperText={errors.identifier?.message} />
          <PasswordField label="Password" autoComplete="current-password" {...register('password')} error={!!errors.password} helperText={errors.password?.message} />
          <Controller name="rememberMe" control={control} render={({ field }) => (
            <FormControlLabel control={<Checkbox checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />} label="Keep me signed in on this device" />
          )} />
          <Button type="submit" variant="contained" size="large" disabled={isSubmitting} startIcon={isSubmitting ? <CircularProgress size={18} color="inherit" /> : undefined}>
            {isSubmitting ? 'Signing in' : 'Sign in'}
          </Button>
          <Stack direction="row" justifyContent="space-between" flexWrap="wrap" gap={1}>
            <Link component={RouterLink} to="/forgot-password">Forgot your password?</Link>
            <Link component={RouterLink} to="/register">Create an account</Link>
          </Stack>
        </Stack>
      </Box>
    </AuthShell>
  );
}
