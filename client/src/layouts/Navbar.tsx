import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { AppBar, Box, Button, IconButton, Menu, MenuItem, Toolbar, Typography } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { useSnackbar } from 'notistack';
import { BallMark } from '../components/BallMark';
import { palette } from '../app/theme';
import { useAppDispatch, useAppSelector } from '../app/store';
import { signOut } from '../features/auth/authSlice';

export function Navbar() {
  const user = useAppSelector((s) => s.auth.user);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  const logout = async () => {
    setAnchor(null);
    await dispatch(signOut());
    enqueueSnackbar('Signed out', { variant: 'success' });
    navigate('/');
  };

  return (
    <AppBar position="static" color="secondary" elevation={0} component="header">
      <Toolbar sx={{ gap: 1, maxWidth: 1200, width: '100%', mx: 'auto' }} component="nav" aria-label="Main">
        <Box component={RouterLink} to="/" sx={{ display: 'flex', alignItems: 'center', gap: 1.25, color: 'inherit', textDecoration: 'none', mr: 'auto' }}>
          <BallMark size={32} />
          <Typography variant="h5" component="span" sx={{ color: palette.floodlight }}>Seam Tickets</Typography>
        </Box>
        <Box sx={{ display: { xs: 'none', sm: 'flex' }, gap: 1 }}>
          {user ? (
            <>
              <Button color="inherit" component={RouterLink} to="/account">Account</Button>
              <Button variant="outlined" color="inherit" onClick={logout}>Sign out</Button>
            </>
          ) : (
            <>
              <Button color="inherit" component={RouterLink} to="/login">Sign in</Button>
              <Button variant="contained" color="primary" component={RouterLink} to="/register">Create account</Button>
            </>
          )}
        </Box>
        <IconButton sx={{ display: { xs: 'inline-flex', sm: 'none' } }} color="inherit" aria-label="Open menu" aria-haspopup="true" onClick={(e) => setAnchor(e.currentTarget)}>
          <MenuIcon />
        </IconButton>
        <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
          {user
            ? [
                <MenuItem key="a" component={RouterLink} to="/account" onClick={() => setAnchor(null)}>Account</MenuItem>,
                <MenuItem key="o" onClick={logout}>Sign out</MenuItem>,
              ]
            : [
                <MenuItem key="l" component={RouterLink} to="/login" onClick={() => setAnchor(null)}>Sign in</MenuItem>,
                <MenuItem key="r" component={RouterLink} to="/register" onClick={() => setAnchor(null)}>Create account</MenuItem>,
              ]}
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
