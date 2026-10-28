import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env, isProd } from './config/env.js';
import { csrf } from './middleware/csrf.js';
import { apiLimiter } from './middleware/rateLimit.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';
import { emailStatus } from './services/email.service.js';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  if (isProd) app.set('trust proxy', 1);

  app.use(helmet());
  app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());
  app.use('/api', apiLimiter);
  app.use(csrf);

  app.get('/api/health', (_req, res) => res.json({ status: 'ok', demo: true }));
  // Fetching this sets the CSRF cookie; the client echoes it back in X-CSRF-Token.
  app.get('/api/csrf', (_req, res) => res.json({ ok: true }));
  app.get('/api/system/status', (_req, res) => res.json({ demo: true, email: emailStatus(), sms: { live: false, note: 'SMS not configured' }, payments: { live: false, note: 'Payments arrive in a later phase' } }));

  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
