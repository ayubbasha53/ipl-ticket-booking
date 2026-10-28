import type { ReactNode } from 'react';
import { Box, Container, Paper, Typography } from '@mui/material';
import { BallMark } from './BallMark';
import { SeamLine } from './SeamLine';
import { palette } from '../app/theme';

export function AuthShell({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 7 } }}>
      <Paper variant="outlined" sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '5fr 7fr' }, overflow: 'hidden' }}>
        <Box sx={{ display: { xs: 'none', md: 'flex' }, flexDirection: 'column', justifyContent: 'space-between', bgcolor: palette.night, color: '#fff', p: 5, position: 'relative', overflow: 'hidden' }}>
          <Box sx={{ position: 'absolute', right: -70, bottom: -70, opacity: 0.95 }}><BallMark size={300} /></Box>
          <Box sx={{ position: 'relative' }}>
            <Typography variant="h3" component="p" sx={{ color: palette.floodlight }}>Seam Tickets</Typography>
            <Box sx={{ mt: 1 }}><SeamLine color={palette.seam} width={120} /></Box>
          </Box>
          <Typography sx={{ position: 'relative', maxWidth: 260, color: 'rgba(255,255,255,.85)' }}>
            A demo booking flow for T20 cricket. Sample fixtures and sandbox payments only.
          </Typography>
        </Box>
        <Box sx={{ p: { xs: 3, sm: 5 } }}>
          <Typography variant="h2" component="h1" sx={{ fontSize: { xs: '2rem', sm: '2.5rem' } }}>{title}</Typography>
          {subtitle && <Typography color="text.secondary" sx={{ mt: 1, mb: 3, maxWidth: '60ch' }}>{subtitle}</Typography>}
          {!subtitle && <Box sx={{ mb: 3 }} />}
          {children}
        </Box>
      </Paper>
    </Container>
  );
}
