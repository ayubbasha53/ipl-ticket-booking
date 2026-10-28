import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { Session, User, type Role } from '../models/index.js';
import { forbidden, unauthorized } from '../utils/errors.js';

export const SESSION_COOKIE = 'ipl_session';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: { userId: string; role: Role; sid: string };
    }
  }
}

/** Requires a valid, unrevoked, unexpired server-side session. */
export const requireAuth: RequestHandler = async (req, _res, next) => {
  try {
    const raw = req.cookies?.[SESSION_COOKIE] as string | undefined;
    if (!raw) throw unauthorized();
    let payload: jwt.JwtPayload;
    try {
      payload = jwt.verify(raw, env.JWT_SECRET, { algorithms: ['HS256'] }) as jwt.JwtPayload;
    } catch {
      throw unauthorized('Your session has expired. Sign in again.');
    }
    const session = await Session.findOne({ sid: payload.sid, revokedAt: { $exists: false }, expiresAt: { $gt: new Date() } });
    if (!session) throw unauthorized('Your session has expired. Sign in again.');
    const user = await User.findById(session.user).select('role status');
    if (!user || user.status !== 'active') throw unauthorized('Your session has expired. Sign in again.');
    req.auth = { userId: user.id, role: user.role as Role, sid: session.sid };
    next();
  } catch (err) {
    next(err);
  }
};

export const requireRole =
  (...roles: Role[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.auth) return next(unauthorized());
    if (!roles.includes(req.auth.role)) return next(forbidden());
    next();
  };
