import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Box, Button, Checkbox, Chip, CircularProgress, Container, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Divider, FormControlLabel, Paper, Skeleton, Stack, TextField, Typography } from '@mui/material';
import { useSnackbar } from 'notistack';
import type { z } from 'zod';
import { authApi } from '../api/auth';
import { PasswordField } from '../components/PasswordField';
import { PasswordChecklist } from '../components/PasswordChecklist';
import { useAppDispatch, useAppSelector } from '../app/store';
import { setUser, sessionExpired } from '../features/auth/authSlice';
import { changePasswordSchema, profileSchema } from '../utils/schemas';
import { parseApiError } from '../utils/errors';
import type { SessionInfo } from '../types';

type ProfileIn = z.input<typeof profileSchema>;
type ProfileOut = z.output<typeof profileSchema>;
type PwForm = z.infer<typeof changePasswordSchema>;

const fmt = (iso: string) => new Date(iso).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' });

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Paper variant="outlined" sx={{ p: { xs: 2.5, sm: 4 } }} component="section" aria-label={title}>
      <Typography variant="h5" component="h2" sx={{ mb: 2 }}>{title}</Typography>
      {children}
    </Paper>
  );
}

export default function Profile() {
  const user = useAppSelector((s) => s.auth.user)!;
  const dispatch = useAppDispatch();
  const { enqueueSnackbar } = useSnackbar();
  const [sessions, setSessions] = useState<SessionInfo[] | null>(null);
  const [confirmAll, setConfirmAll] = useState(false);

  const profile = useForm<ProfileIn, unknown, ProfileOut>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user.name, phone: user.phone, marketingNotifications: user.consent.marketingNotifications },
  });
  const pw = useForm<PwForm>({ resolver: zodResolver(changePasswordSchema), defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' } });

  const loadSessions = useCallback(() => { authApi.sessions().then(setSessions).catch(() => setSessions([])); }, []);
  useEffect(loadSessions, [loadSessions]);

  const saveProfile = profile.handleSubmit(async (v) => {
    try {
      dispatch(setUser(await authApi.updateMe(v)));
      enqueueSnackbar('Profile saved', { variant: 'success' });
    } catch (e) {
      const err = parseApiError(e);
      Object.entries(err.fields).forEach(([k, m]) => profile.setError(k as keyof ProfileIn, { message: m }));
      enqueueSnackbar(err.message, { variant: 'error' });
    }
  });

  const savePassword = pw.handleSubmit(async (v) => {
    try {
      await authApi.changePassword(v);
      pw.reset();
      enqueueSnackbar('Password changed. Other devices were signed out.', { variant: 'success' });
      loadSessions();
    } catch (e) {
      const err = parseApiError(e);
      Object.entries(err.fields).forEach(([k, m]) => pw.setError(k as keyof PwForm, { message: m }));
      if (!Object.keys(err.fields).length) enqueueSnackbar(err.message, { variant: 'error' });
    }
  });

  const resend = async () => {
    try { await authApi.resendVerification(user.email); enqueueSnackbar('If your address still needs verification, a new link is on its way.', { variant: 'info' }); }
    catch (e) { enqueueSnackbar(parseApiError(e).message, { variant: 'error' }); }
  };

  const endSession = async (id: string) => {
    try { await authApi.endSession(id); enqueueSnackbar('Device signed out', { variant: 'success' }); loadSessions(); }
    catch (e) { enqueueSnackbar(parseApiError(e).message, { variant: 'error' }); }
  };

  const logoutAll = async () => {
    setConfirmAll(false);
    try { await authApi.logoutAll(); } finally { dispatch(sessionExpired()); }
  };

  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, md: 6 } }}>
      <Typography variant="h2" component="h1" sx={{ fontSize: { xs: '2rem', sm: '2.75rem' }, mb: 3 }}>Your account</Typography>
      <Stack spacing={3}>
        {!user.emailVerified && (
          <Alert severity="warning" action={<Button color="inherit" size="small" onClick={resend}>Resend link</Button>}>
            Verify {user.email} to be able to book tickets. Check your inbox for the link.
          </Alert>
        )}

        <Section title="Profile">
          <Stack direction="row" spacing={1} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
            <Chip label={user.emailVerified ? 'Email verified' : 'Email not verified'} color={user.emailVerified ? 'success' : 'warning'} variant="outlined" />
            <Chip label={user.phoneVerified ? 'Mobile verified' : 'Mobile not verified'} variant="outlined" />
          </Stack>
          <Box component="form" onSubmit={saveProfile} noValidate>
            <Stack spacing={2.5} sx={{ maxWidth: 460 }}>
              <TextField label="Full name" autoComplete="name" {...profile.register('name')} error={!!profile.formState.errors.name} helperText={profile.formState.errors.name?.message} />
              <TextField label="Email address" value={user.email} disabled helperText="Email changes are not supported in this build." />
              <TextField label="Mobile number" autoComplete="tel" {...profile.register('phone')} error={!!profile.formState.errors.phone} helperText={profile.formState.errors.phone?.message ?? 'Changing your number marks it as unverified.'} />
              <Controller name="marketingNotifications" control={profile.control} render={({ field }) => (
                <FormControlLabel control={<Checkbox checked={!!field.value} onChange={(e) => field.onChange(e.target.checked)} />} label="Send me offers and news" />
              )} />
              <Button type="submit" variant="contained" disabled={profile.formState.isSubmitting} sx={{ alignSelf: 'flex-start' }}>Save changes</Button>
            </Stack>
          </Box>
        </Section>

        <Section title="Change password">
          <Box component="form" onSubmit={savePassword} noValidate>
            <Stack spacing={2.5} sx={{ maxWidth: 460 }}>
              <PasswordField label="Current password" autoComplete="current-password" {...pw.register('currentPassword')} error={!!pw.formState.errors.currentPassword} helperText={pw.formState.errors.currentPassword?.message} />
              <PasswordField label="New password" autoComplete="new-password" {...pw.register('newPassword')} error={!!pw.formState.errors.newPassword} helperText={pw.formState.errors.newPassword?.message} />
              <PasswordChecklist value={pw.watch('newPassword') ?? ''} />
              <PasswordField label="Confirm new password" autoComplete="new-password" {...pw.register('confirmPassword')} error={!!pw.formState.errors.confirmPassword} helperText={pw.formState.errors.confirmPassword?.message} />
              <Button type="submit" variant="contained" disabled={pw.formState.isSubmitting} sx={{ alignSelf: 'flex-start' }}>Change password</Button>
            </Stack>
          </Box>
        </Section>

        <Section title="Signed-in devices">
          {sessions === null ? <Skeleton variant="rounded" height={72} /> : (
            <Stack divider={<Divider />} spacing={1.5}>
              {sessions.map((s) => (
                <Stack key={s.id} direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }} justifyContent="space-between">
                  <Box>
                    <Typography fontWeight={600}>{s.current ? 'This device' : 'Another device'}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-word' }}>{s.userAgent?.slice(0, 80) ?? 'Unknown browser'}</Typography>
                    <Typography variant="body2" color="text.secondary">Signed in {fmt(s.createdAt)}. Expires {fmt(s.expiresAt)}.</Typography>
                  </Box>
                  {!s.current && <Button size="small" variant="outlined" onClick={() => endSession(s.id)}>Sign out device</Button>}
                </Stack>
              ))}
              <Box><Button color="primary" variant="outlined" onClick={() => setConfirmAll(true)} startIcon={undefined}>Sign out of all devices</Button></Box>
            </Stack>
          )}
        </Section>
      </Stack>

      <Dialog open={confirmAll} onClose={() => setConfirmAll(false)} aria-labelledby="all-title">
        <DialogTitle id="all-title">Sign out of all devices?</DialogTitle>
        <DialogContent><DialogContentText>This ends every session, including this one. You will need to sign in again.</DialogContentText></DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmAll(false)}>Cancel</Button>
          <Button variant="contained" onClick={logoutAll}>Sign out everywhere</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
