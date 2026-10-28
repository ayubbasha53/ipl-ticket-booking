import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { RouterProvider } from 'react-router-dom';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { SnackbarProvider } from 'notistack';
import { store } from './app/store';
import { theme } from './app/theme';
import { router } from './routes';
import { setUnauthorizedHandler } from './api/client';
import { bootstrapSession, sessionExpired } from './features/auth/authSlice';

setUnauthorizedHandler(() => store.dispatch(sessionExpired()));
store.dispatch(bootstrapSession());

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} autoHideDuration={4000}>
          <RouterProvider router={router} />
        </SnackbarProvider>
      </ThemeProvider>
    </Provider>
  </React.StrictMode>,
);
