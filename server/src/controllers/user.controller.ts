import { asyncHandler } from '../utils/asyncHandler.js';
import * as auth from '../services/auth.service.js';
import { Session, User } from '../models/index.js';
import { clearSessionCookie, revokeAllSessions, revokeSession } from '../services/session.service.js';
import { notFound } from '../utils/errors.js';

export const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.auth!.userId);
  if (!user) throw notFound('Account not found.');
  res.json({ user: auth.toUserDto(user) });
});

export const updateMe = asyncHandler(async (req, res) => {
  const user = await auth.updateProfile(req, req.auth!.userId, req.body);
  res.json({ user: auth.toUserDto(user) });
});

export const changePassword = asyncHandler(async (req, res) => {
  await auth.changePassword(req, req.auth!.userId, req.body.currentPassword, req.body.newPassword, req.auth!.sid);
  res.json({ message: 'Password changed. Other devices were signed out.' });
});

export const listSessions = asyncHandler(async (req, res) => {
  const sessions = await Session.find({ user: req.auth!.userId, revokedAt: { $exists: false }, expiresAt: { $gt: new Date() } }).sort({ createdAt: -1 });
  res.json({
    sessions: sessions.map((s) => ({
      id: s.sid,
      current: s.sid === req.auth!.sid,
      userAgent: s.userAgent,
      createdAt: s.createdAt,
      expiresAt: s.expiresAt,
    })),
  });
});

export const revokeOne = asyncHandler(async (req, res) => {
  const sid = String(req.params.sid);
  await revokeSession(req.auth!.userId, sid);
  if (sid === req.auth!.sid) clearSessionCookie(res);
  res.json({ message: 'Session ended.' });
});

export const logoutAll = asyncHandler(async (req, res) => {
  await revokeAllSessions(req.auth!.userId);
  clearSessionCookie(res);
  res.json({ message: 'Signed out of all devices.' });
});
