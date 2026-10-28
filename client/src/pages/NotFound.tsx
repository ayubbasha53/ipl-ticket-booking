import { Link as RouterLink } from 'react-router-dom';
import { Button, Container, Typography } from '@mui/material';

export default function NotFound() {
  return (
    <Container maxWidth="sm" sx={{ py: 10 }}>
      <Typography variant="h2" component="h1" gutterBottom>Page not found</Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>The page you are looking for does not exist or has moved.</Typography>
      <Button variant="contained" component={RouterLink} to="/">Back to home</Button>
    </Container>
  );
}
