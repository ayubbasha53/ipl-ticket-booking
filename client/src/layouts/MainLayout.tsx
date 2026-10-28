import { Link as RouterLink, Outlet } from 'react-router-dom';
import { Alert, Box, Container, Link, Typography } from '@mui/material';
import { Navbar } from './Navbar';
import { SeamLine } from '../components/SeamLine';

export function MainLayout() {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Box component="a" href="#main" sx={{ position: 'absolute', left: -9999, '&:focus': { left: 8, top: 8, zIndex: 2000, bgcolor: '#fff', p: 1 } }}>Skip to content</Box>
      <Alert severity="warning" icon={false} sx={{ borderRadius: 0, justifyContent: 'center', py: 0.25 }}>
        Demo project: sample matches and sandbox payments. Not affiliated with the IPL or BCCI. Tickets are not valid for stadium entry.
      </Alert>
      <Navbar />
      <Box component="main" id="main" sx={{ flex: 1 }}><Outlet /></Box>
      <Box component="footer" sx={{ bgcolor: 'secondary.main', color: 'rgba(255,255,255,.8)', mt: 6 }}>
        <SeamLine />
        <Container maxWidth="lg" sx={{ py: 3, display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'center' }}>
          <Typography variant="body2" sx={{ mr: 'auto' }}>Seam Tickets is an independent demo. All fixtures, prices and squads are sample data.</Typography>
          <Link component={RouterLink} to="/terms" color="inherit" underline="hover">Terms</Link>
          <Link component={RouterLink} to="/privacy" color="inherit" underline="hover">Privacy</Link>
          <Link component={RouterLink} to="/contact" color="inherit" underline="hover">Help</Link>
        </Container>
      </Box>
    </Box>
  );
}
