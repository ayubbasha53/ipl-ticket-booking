import { Link as RouterLink } from 'react-router-dom';
import { Box, Button, Container, Stack, Typography } from '@mui/material';
import { BallMark } from '../components/BallMark';
import { SeamLine } from '../components/SeamLine';
import { palette } from '../app/theme';
import { useAppSelector } from '../app/store';

export default function Home() {
  const user = useAppSelector((s) => s.auth.user);
  return (
    <>
      <Box sx={{ bgcolor: palette.night, color: '#fff', position: 'relative', overflow: 'hidden' }}>
        <Box aria-hidden="true" sx={{ position: 'absolute', right: { xs: -120, md: -40 }, top: { xs: 'auto', md: '50%' }, bottom: { xs: -120, md: 'auto' }, transform: { md: 'translateY(-50%)' }, opacity: { xs: 0.35, md: 1 } }}>
          <Box sx={{ display: { xs: 'none', md: 'block' } }}><BallMark size={460} /></Box>
          <Box sx={{ display: { xs: 'block', md: 'none' } }}><BallMark size={320} /></Box>
        </Box>
        <Container maxWidth="lg" sx={{ position: 'relative', py: { xs: 8, md: 14 } }}>
          <Typography variant="h1" sx={{ fontSize: { xs: '3.4rem', sm: '5rem', md: '6.5rem' }, maxWidth: '9ch' }}>
            Find your seat for match night.
          </Typography>
          <Box sx={{ my: 3 }}><SeamLine color={palette.seam} width={160} /></Box>
          <Typography sx={{ fontSize: '1.2rem', maxWidth: '44ch', color: 'rgba(255,255,255,.88)' }}>
            Browse fixtures, pick a stand, pay and carry your ticket on your phone. This build is a demo with sample matches and sandbox payments.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 4 }}>
            {user ? (
              <Button size="large" variant="contained" component={RouterLink} to="/account">Go to your account</Button>
            ) : (
              <>
                <Button size="large" variant="contained" component={RouterLink} to="/register">Create account</Button>
                <Button size="large" variant="outlined" color="inherit" component={RouterLink} to="/login">Sign in</Button>
              </>
            )}
          </Stack>
        </Container>
      </Box>
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Typography variant="h4" component="h2" gutterBottom>What works in this build</Typography>
        <Typography color="text.secondary" sx={{ maxWidth: '65ch' }}>
          Accounts are live: registration, email verification, sign-in, password reset, profile and session management.
          Fixtures, seat selection, payments and tickets are being added in later phases, so there is nothing to book yet.
        </Typography>
      </Container>
    </>
  );
}
