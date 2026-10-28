import crypto from 'node:crypto';
import type { RequestHandler } from 'express';
import { env } from '../config/env.js';
import { AppError } from '../utils/errors.js';
import { safeEqual } from '../utils/crypto.js';

export const CSRF_COOKIE = 'ipl_csrf';
const SAFE = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Double-submit cookie. The client reads the (non-httpOnly) cookie and echoes it in X-CSRF-Token.
 * An Origin check is layered on top. The payment webhook is exempt because it is signature-verified.
 */
export const csrf: RequestHandler = (req, res, next) => {
  let token = req.cookies?.[CSRF_COOKIE] as string | undefined;
  if (!token) {
    token = crypto.randomBytes(24).toString('hex');
    res.cookie(CSRF_COOKIE, token, { httpOnly: false, sameSite: 'lax', secure: env.COOKIE_SECURE, path: '/' });
  }
  if (SAFE.has(req.method) || req.path === '/api/payments/webhook') return next();

  const origin = req.get('origin');
  if (origin && origin !== env.CLIENT_URL) return next(new AppError(403, 'Request origin not allowed.', 'csrf'));

  const header = req.get('x-csrf-token');
  if (!header || !safeEqual(header, token)) {
    return next(new AppError(403, 'Security check failed. Refresh the page and try again.', 'csrf'));
  }
  next();
};
