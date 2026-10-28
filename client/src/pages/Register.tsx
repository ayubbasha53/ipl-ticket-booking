import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { Link as RouterLink } from 'react-router-dom';
import { Alert, Box, Button, Checkbox, CircularProgress, FormControlLabel, FormHelperText, Link, Stack, TextField, Typography } from '@mui/material';
import { useSnackbar } from 'notistack';
import { useState } from 'react';
import type { z } from 'zod';
import { AuthShell } from '../components/AuthShell';
import { PasswordField } from '../components/PasswordField';
import { PasswordChecklist } from '../components/PasswordChecklist';
import { authApi } from '../api/auth';
import { registerSchema } from '../utils/schemas';
import { parseApiError } from '../utils/errors';

type FormIn = z.input<typeof registerSchema>;
type FormOut = z.output<typeof registerSchema>;

export default function Register() {
  const { enqueueSnackbar } = useSnackbar();
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState<{ email: string; demoMode: boolean } | null>(null);
  const { register, handleSubmit, control, watch, setError, formState: { errors, isSubmitting } } = useForm<FormIn, unknown, FormOut>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', phone: '+91', password: '', confirmPassword: '', acceptTerms: false, marketingNotifications: false },
  });

  const onSubmit = handleSubmit(async (v) => {
    setFormError(null);
    try {
      const res = await authApi.register({ ...v });
      setDone({ email: v.email, demoMode: res.emailDelivery === 'not_sent_demo_mode' });
    } catch (e) {
      const err = parseApiError(e);
      Object.entries(err.fields).forEach(([k, m]) => setError(k as keyof FormIn, { message: m }));
      setFormError(Object.keys(err.fields).length ? null : err.message);
    }
  });

  const resend = async () => {
    if (!done) return;
    try { await authApi.resendVerification(done.email); enqueueSnackbar('If the address needs verification, a new link is on its way.', { variant: 'info' }); }
    catch (e) { enqueueSnackbar(parseApiError(e).message, { variant: 'error' }); }
  };

  if (done) {
    return (
      <AuthShell title="Check your email" subtitle={`We created your account and sent a verification link to ${done.email}. The link works for 24 hours.`}>
        <Stack spacing={2} sx={{ maxWidth: 460 }}>
          {done.demoMode && <Alert severity="warning">Email delivery is not configured on this server (demo mode), so no email was sent. The developer console shows the link.</Alert>}
          <Button variant="outlined" onClick={resend}>Resend verification email</Button>
          <Link component={RouterLink} to="/login">Continue to sign in</Link>
        </Stack>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Create your account" subtitle="You need an account to book tickets. We only ask for what the booking needs.">
      <Box component="form" onSubmit={onSubmit} noValidate>
        <Stack spacing={2.5} sx={{ maxWidth: 520 }}>
          {formError && <Alert severity="error" role="alert">{formError}</Alert>}
          <TextField label="Full name" autoComplete="name" {...register('name')} error={!!errors.name} helperText={errors.name?.message} />
          <TextField label="Email address" type="email" autoComplete="email" {...register('email')} error={!!errors.email} helperText={errors.email?.message} />
          <TextField label="Mobile number with country code" type="tel" autoComplete="tel" {...register('phone')} error={!!errors.phone} helperText={errors.phone?.message ?? 'Example: +919876543210'} />
          <PasswordField label="Password" autoComplete="new-password" {...register('password')} error={!!errors.password} helperText={errors.password?.message} />
          <PasswordChecklist value={watch('password') ?? ''} />
          <PasswordField label="Confirm password" autoComplete="new-password" {...register('confirmPassword')} error={!!errors.confirmPassword} helperText={errors.confirmPassword?.message} />
          <Box>
            <Controller name="acceptTerms" control={control} render={({ field }) => (
              <FormControlLabel control={<Checkbox checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />}
                label={<Typography variant="body2">I accept the <Link component={RouterLink} to="/terms" target="_blank">terms</Link> and <Link component={RouterLink} to="/privacy" target="_blank">privacy policy</Link></Typography>} />
            )} />
            {errors.acceptTerms && <FormHelperText error role="alert">{errors.acceptTerms.message}</FormHelperText>}
            <Controller name="marketingNotifications" control={control} render={({ field }) => (
              <FormControlLabel control={<Checkbox checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />}
                label={<Typography variant="body2">Send me offers and news (optional). Booking and account emails are always sent.</Typography>} />
            )} />
          </Box>
          <Button type="submit" variant="contained" size="large" disabled={isSubmitting} startIcon={isSubmitting ? <CircularProgress size={18} color="inherit" /> : undefined}>
            {isSubmitting ? 'Creating account' : 'Create account'}
          </Button>
          <Typography variant="body2">Already registered? <Link component={RouterLink} to="/login">Sign in</Link></Typography>
        </Stack>
      </Box>
    </AuthShell>
  );
}
