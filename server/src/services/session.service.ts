import crypto from 'node:crypto';
import type { CookieOptions, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { Session } from '../models/index.js';
import { SESSION_COOKIE } from '../middleware/auth.js';

const cookieBase = (): CookieOptions => ({ httpOnly: true, secure: env.COOKIE_SECURE, sameSite: 'lax', path: '/' });

export async function startSession(req: Request, res: Response, userId: string, rememberMe: boolean) {
  const ttlMs = rememberMe ? env.REMEMBER_ME_DAYS * 86_400_000 : env.SESSION_HOURS * 3_600_000;
  const sid = crypto.randomBytes(24).toString('hex');
  const expiresAt = new Date(Date.now() + ttlMs);
  await Session.create({ user: userId, sid, userAgent: req.get('user-agent')?.slice(0, 300), ip: req.ip, expiresAt });
  const token = jwt.sign({ sub: userId, sid }, env.JWT_SECRET, { algorithm: 'HS256', expiresIn: Math.floor(ttlMs / 1000) });
  // Persistent cookie only when the user opted in to "remember me"; otherwise a browser-session cookie.
  res.cookie(SESSION_COOKIE, token, rememberMe ? { ...cookieBase(), maxAge: ttlMs } : cookieBase());
  return { sid, expiresAt };
}

export const clearSessionCookie = (res: Response) => res.clearCookie(SESSION_COOKIE, cookieBase());

export const revokeSession = (userId: string, sid: string) =>
  Session.updateOne({ user: userId, sid, revokedAt: { $exists: false } }, { revokedAt: new Date() });

export const revokeAllSessions = (userId: string, exceptSid?: string) =>
  Session.updateMany({ user: userId, revokedAt: { $exists: false }, ...(exceptSid ? { sid: { $ne: exceptSid } } : {}) }, { revokedAt: new Date() });
