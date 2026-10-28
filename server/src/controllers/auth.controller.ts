import { asyncHandler } from '../utils/asyncHandler.js';
import * as auth from '../services/auth.service.js';
import { clearSessionCookie, revokeSession, startSession } from '../services/session.service.js';
import { emailStatus } from '../services/email.service.js';
import { audit } from '../services/audit.service.js';

const GENERIC = 'If an account exists for that email, we have sent instructions to it.';

export const register = asyncHandler(async (req, res) => {
  const { confirmPassword: _c, acceptTerms: _a, ...input } = req.body;
  const { user, emailStatus: mail } = await auth.register(req, input);
  res.status(201).json({
    user: auth.toUserDto(user),
    message: 'Account created. Check your email to verify your address.',
    emailDelivery: mail, // 'not_sent_demo_mode' makes demo mode visible to the client
  });
});

export const login = asyncHandler(async (req, res) => {
  const user = await auth.login(req, req.body.identifier, req.body.password);
  await startSession(req, res, user.id, req.body.rememberMe);
  res.json({ user: auth.toUserDto(user) });
});

export const logout = asyncHandler(async (req, res) => {
  if (req.auth) {
    await revokeSession(req.auth.userId, req.auth.sid);
    await audit(req, 'auth.logout');
  }
  clearSessionCookie(res);
  res.json({ message: 'Signed out.' });
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const user = await auth.verifyEmail(req, req.body.token);
  res.json({ message: 'Email verified.', user: auth.toUserDto(user) });
});

export const resendVerification = asyncHandler(async (req, res) => {
  await auth.resendVerification(req, req.body.email);
  res.json({ message: 'If that account needs verification, a new link is on its way.', emailProvider: emailStatus() });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  await auth.forgotPassword(req, req.body.email);
  res.json({ message: GENERIC });
});

export const resetPassword = asyncHandler(async (req, res) => {
  await auth.resetPassword(req, req.body.token, req.body.password);
  clearSessionCookie(res);
  res.json({ message: 'Password updated. Sign in with your new password.' });
});
