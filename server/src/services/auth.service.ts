import bcrypt from 'bcrypt';
import type { Request } from 'express';
import { env, isTest } from '../config/env.js';
import { User } from '../models/index.js';
import { badRequest, conflict, AppError } from '../utils/errors.js';
import { generateToken, hashToken } from '../utils/crypto.js';
import { normalizePhone } from '../validators/auth.js';
import { sendEmail } from './email.service.js';
import { passwordChangedTemplate, resetPasswordTemplate, verifyEmailTemplate } from './emailTemplates.js';
import { audit } from './audit.service.js';
import { revokeAllSessions } from './session.service.js';

const BCRYPT_COST = isTest ? 4 : 12;
const VERIFY_HOURS = 24;
const RESET_MINUTES = 30;
const RESEND_COOLDOWN_MS = 60_000;
const MAX_FAILED = 5;
const LOCK_MS = 15 * 60_000;
// Used so that unknown accounts cost the same time as known ones.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', BCRYPT_COST);

export const hashPassword = (pw: string) => bcrypt.hash(pw, BCRYPT_COST);

export function toUserDto(u: InstanceType<typeof User>) {
  return {
    id: u.id as string,
    name: u.name,
    email: u.email,
    phone: u.phone,
    role: u.role,
    emailVerified: u.emailVerified,
    phoneVerified: u.phoneVerified,
    consent: {
      transactionalNotifications: u.consent?.transactionalNotifications ?? true,
      marketingNotifications: u.consent?.marketingNotifications ?? false,
    },
    createdAt: u.createdAt,
  };
}

async function sendVerification(user: InstanceType<typeof User>) {
  const { token, hash } = generateToken();
  await User.updateOne(
    { _id: user._id },
    { emailVerifyTokenHash: hash, emailVerifyExpires: new Date(Date.now() + VERIFY_HOURS * 3_600_000), emailVerifySentAt: new Date() },
  );
  const url = `${env.CLIENT_URL}/verify-email?token=${token}`;
  const tpl = verifyEmailTemplate(user.name, url, VERIFY_HOURS);
  return sendEmail({ to: user.email, userId: user.id, template: 'verify_email', devActionUrl: url, ...tpl });
}

export interface RegisterInput {
  name: string; email: string; phone: string; password: string;
  transactionalNotifications: boolean; marketingNotifications: boolean;
}

export async function register(req: Request, input: RegisterInput) {
  const clash = await User.findOne({ $or: [{ email: input.email }, { phone: input.phone }] }).select('email phone');
  if (clash) {
    const fields: Record<string, string> = {};
    if (clash.email === input.email) fields.email = 'An account with this email already exists';
    if (clash.phone === input.phone) fields.phone = 'An account with this mobile number already exists';
    throw new AppError(409, 'Account already exists.', 'duplicate_account', { fields });
  }
  const now = new Date();
  const user = await User.create({
    name: input.name,
    email: input.email,
    phone: input.phone,
    passwordHash: await hashPassword(input.password),
    consent: {
      termsAcceptedAt: now,
      privacyAcceptedAt: now,
      transactionalNotifications: input.transactionalNotifications,
      marketingNotifications: input.marketingNotifications,
    },
  });
  const mail = await sendVerification(user);
  await audit(req, 'auth.register', { actor: user.id, entityType: 'User', entityId: user.id });
  return { user, emailStatus: mail.status };
}

export async function login(req: Request, identifier: string, password: string) {
  const query = identifier.includes('@') ? { email: identifier.toLowerCase() } : { phone: normalizePhone(identifier) };
  const user = await User.findOne(query).select('+passwordHash +failedLoginAttempts +lockUntil');

  const invalid = () => new AppError(401, 'Email, mobile number or password is incorrect.', 'invalid_credentials');

  if (!user) {
    await bcrypt.compare(password, DUMMY_HASH);
    await audit(req, 'auth.login_failed', { meta: { reason: 'unknown_account' } });
    throw invalid();
  }
  if (user.lockUntil && user.lockUntil > new Date()) {
    await audit(req, 'auth.login_blocked_locked', { actor: user.id });
    throw new AppError(429, 'Too many failed attempts. Try again in 15 minutes or reset your password.', 'account_locked');
  }
  if (user.status !== 'active') throw new AppError(403, 'This account is disabled. Contact support.', 'account_disabled');

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    const attempts = (user.failedLoginAttempts ?? 0) + 1;
    const lock = attempts >= MAX_FAILED;
    await User.updateOne({ _id: user._id }, lock ? { failedLoginAttempts: 0, lockUntil: new Date(Date.now() + LOCK_MS) } : { failedLoginAttempts: attempts });
    await audit(req, 'auth.login_failed', { actor: user.id, meta: { locked: lock } });
    throw invalid();
  }
  await User.updateOne({ _id: user._id }, { failedLoginAttempts: 0, $unset: { lockUntil: 1 }, lastLoginAt: new Date() });
  await audit(req, 'auth.login', { actor: user.id });
  return user;
}

export async function verifyEmail(req: Request, token: string) {
  const user = await User.findOneAndUpdate(
    { emailVerifyTokenHash: hashToken(token), emailVerifyExpires: { $gt: new Date() } },
    { emailVerified: true, emailVerifiedAt: new Date(), $unset: { emailVerifyTokenHash: 1, emailVerifyExpires: 1 } },
    { new: true },
  );
  if (!user) throw badRequest('This verification link is invalid or has expired. Request a new one.');
  await audit(req, 'auth.email_verified', { actor: user.id });
  return user;
}

/** Always resolves the same way so callers cannot learn whether an account exists. */
export async function resendVerification(req: Request, email: string) {
  const user = await User.findOne({ email }).select('+emailVerifySentAt');
  if (!user || user.emailVerified) return;
  if (user.emailVerifySentAt && Date.now() - user.emailVerifySentAt.getTime() < RESEND_COOLDOWN_MS) return;
  await sendVerification(user);
  await audit(req, 'auth.verification_resent', { actor: user.id });
}

export async function forgotPassword(req: Request, email: string) {
  const user = await User.findOne({ email });
  if (!user || user.status !== 'active') return;
  const { token, hash } = generateToken();
  await User.updateOne({ _id: user._id }, { resetTokenHash: hash, resetTokenExpires: new Date(Date.now() + RESET_MINUTES * 60_000) });
  const url = `${env.CLIENT_URL}/reset-password?token=${token}`;
  await sendEmail({ to: user.email, userId: user.id, template: 'reset_password', devActionUrl: url, ...resetPasswordTemplate(user.name, url, RESET_MINUTES) });
  await audit(req, 'auth.reset_requested', { actor: user.id });
}

export async function resetPassword(req: Request, token: string, newPassword: string) {
  const passwordHash = await hashPassword(newPassword);
  // Single atomic step: valid token is consumed and password replaced together, so a link works exactly once.
  const user = await User.findOneAndUpdate(
    { resetTokenHash: hashToken(token), resetTokenExpires: { $gt: new Date() } },
    {
      passwordHash,
      passwordChangedAt: new Date(),
      failedLoginAttempts: 0,
      emailVerified: true,
      $unset: { resetTokenHash: 1, resetTokenExpires: 1, lockUntil: 1 },
    },
    { new: true },
  );
  if (!user) throw badRequest('This reset link is invalid, already used or expired. Request a new one.');
  await revokeAllSessions(user.id);
  await audit(req, 'auth.password_reset', { actor: user.id });
  await sendEmail({ to: user.email, userId: user.id, template: 'password_changed', ...passwordChangedTemplate(user.name) });
}

export async function changePassword(req: Request, userId: string, current: string, next: string, keepSid: string) {
  const user = await User.findById(userId).select('+passwordHash');
  if (!user) throw badRequest('Account not found.');
  if (!(await bcrypt.compare(current, user.passwordHash))) {
    await audit(req, 'auth.change_password_failed', { actor: userId });
    throw new AppError(400, 'Current password is incorrect.', 'validation_failed', { fields: { currentPassword: 'Current password is incorrect' } });
  }
  await User.updateOne({ _id: userId }, { passwordHash: await hashPassword(next), passwordChangedAt: new Date() });
  await revokeAllSessions(userId, keepSid);
  await audit(req, 'auth.password_changed', { actor: userId });
  await sendEmail({ to: user.email, userId, template: 'password_changed', ...passwordChangedTemplate(user.name) });
}

export async function updateProfile(req: Request, userId: string, patch: { name?: string; phone?: string; transactionalNotifications?: boolean; marketingNotifications?: boolean }) {
  const user = await User.findById(userId);
  if (!user) throw badRequest('Account not found.');
  if (patch.name) user.name = patch.name;
  if (patch.phone && patch.phone !== user.phone) {
    if (await User.exists({ phone: patch.phone, _id: { $ne: userId } })) {
      throw conflict('That mobile number is already in use.', { fields: { phone: 'An account with this mobile number already exists' } });
    }
    user.phone = patch.phone;
    user.phoneVerified = false;
  }
  if (patch.transactionalNotifications !== undefined) user.set('consent.transactionalNotifications', patch.transactionalNotifications);
  if (patch.marketingNotifications !== undefined) user.set('consent.marketingNotifications', patch.marketingNotifications);
  await user.save();
  await audit(req, 'user.profile_updated', { actor: userId });
  return user;
}
