import rateLimit from 'express-rate-limit';
import { isTest } from '../config/env.js';

const make = (windowMs: number, limit: number, message: string) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skip: () => isTest,
    message: { error: { code: 'rate_limited', message } },
  });

const MIN = 60 * 1000;
export const loginLimiter = make(15 * MIN, 20, 'Too many sign-in attempts. Try again in 15 minutes.');
export const registerLimiter = make(60 * MIN, 10, 'Too many sign-ups from this network. Try again later.');
export const emailLinkLimiter = make(60 * MIN, 6, 'Too many requests. Try again in an hour.');
export const apiLimiter = make(MIN, 300, 'Too many requests. Slow down and try again.');
