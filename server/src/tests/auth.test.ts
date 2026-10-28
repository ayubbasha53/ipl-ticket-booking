import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

let mongod: MongoMemoryServer;
let app: import('express').Express;
let models: typeof import('../models/index.js');
const sent: { template: string; url?: string }[] = [];

const user = { name: 'Asha Rao', email: 'asha@example.com', phone: '+919876543210', password: 'Str0ng!Passw0rd', confirmPassword: 'Str0ng!Passw0rd', acceptTerms: true };

/** An agent that carries cookies and always echoes the CSRF token. */
async function client() {
  const agent = request.agent(app);
  await agent.get('/api/csrf');
  const jar = (agent as any).jar.getCookies({ path: '/', domain: '127.0.0.1', secure: false, script: false });
  const csrf = jar.find((c: any) => c.name === 'ipl_csrf')?.value as string;
  const wrap = (m: 'post' | 'patch' | 'delete') => (url: string) => (agent as any)[m](url).set('x-csrf-token', csrf);
  return { agent, post: wrap('post'), patch: wrap('patch'), del: wrap('delete'), get: (u: string) => agent.get(u) };
}

const tokenFrom = (url?: string) => new URL(url!).searchParams.get('token')!;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri('ipl_test');
  // Capture "emails" at the service boundary so tests can read the one-time links.
  vi.doMock('../services/email.service.js', async (orig) => {
    const mod = await orig<typeof import('../services/email.service.js')>();
    return { ...mod, sendEmail: async (i: any) => { sent.push({ template: i.template, url: i.devActionUrl }); return { status: 'not_sent_demo_mode' as const }; } };
  });
  const { connectDb } = await import('../config/db.js');
  await connectDb(process.env.MONGODB_URI);
  models = await import('../models/index.js');
  await Promise.all(Object.values(mongoose.models).map((m) => m.init()));
  app = (await import('../app.js')).createApp();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod?.stop();
});

beforeEach(async () => {
  sent.length = 0;
  await Promise.all(Object.values(mongoose.models).map((m) => m.deleteMany({})));
});

async function registerAndVerify(c: Awaited<ReturnType<typeof client>>) {
  await c.post('/api/auth/register').send(user).expect(201);
  const link = sent.find((s) => s.template === 'verify_email')!;
  await c.post('/api/auth/verify-email').send({ token: tokenFrom(link.url) }).expect(200);
}

describe('registration', () => {
  it('creates an account with hashed password and sends a verification email', async () => {
    const c = await client();
    const res = await c.post('/api/auth/register').send(user).expect(201);
    expect(res.body.user.email).toBe(user.email);
    expect(res.body.user.emailVerified).toBe(false);
    expect(JSON.stringify(res.body)).not.toContain('passwordHash');
    const stored = await models.User.findOne({ email: user.email }).select('+passwordHash');
    expect(stored!.passwordHash).not.toContain(user.password);
    expect(stored!.passwordHash.startsWith('$2')).toBe(true);
    expect(sent.some((s) => s.template === 'verify_email')).toBe(true);
  });
  it('prevents duplicate email and phone with field-level errors', async () => {
    const c = await client();
    await c.post('/api/auth/register').send(user).expect(201);
    const r = await c.post('/api/auth/register').send({ ...user, email: 'ASHA@example.com' }).expect(409);
    expect(r.body.error.details.fields.email).toBeDefined();
    const r2 = await c.post('/api/auth/register').send({ ...user, email: 'other@example.com' }).expect(409);
    expect(r2.body.error.details.fields.phone).toBeDefined();
  });
  it('returns field-level validation messages', async () => {
    const c = await client();
    const r = await c.post('/api/auth/register').send({ ...user, password: 'weak', confirmPassword: 'weak' }).expect(400);
    expect(r.body.error.fields.password).toBeDefined();
  });
  it('rejects state-changing requests without a CSRF token', async () => {
    await request(app).post('/api/auth/register').send(user).expect(403);
  });
});

describe('email verification', () => {
  it('verifies once and rejects reuse', async () => {
    const c = await client();
    await c.post('/api/auth/register').send(user).expect(201);
    const token = tokenFrom(sent.find((s) => s.template === 'verify_email')!.url);
    await c.post('/api/auth/verify-email').send({ token }).expect(200);
    await c.post('/api/auth/verify-email').send({ token }).expect(400);
  });
  it('rejects expired links', async () => {
    const c = await client();
    await c.post('/api/auth/register').send(user).expect(201);
    const token = tokenFrom(sent.find((s) => s.template === 'verify_email')!.url);
    await models.User.updateOne({ email: user.email }, { emailVerifyExpires: new Date(Date.now() - 1000) });
    await c.post('/api/auth/verify-email').send({ token }).expect(400);
  });
  it('resend returns the same response for unknown and known emails', async () => {
    const c = await client();
    await c.post('/api/auth/register').send(user).expect(201);
    const a = await c.post('/api/auth/resend-verification').send({ email: 'nobody@example.com' }).expect(200);
    await models.User.updateOne({ email: user.email }, { emailVerifySentAt: new Date(Date.now() - 120_000) });
    const b = await c.post('/api/auth/resend-verification').send({ email: user.email }).expect(200);
    expect(a.body.message).toBe(b.body.message);
    expect(sent.filter((s) => s.template === 'verify_email')).toHaveLength(2);
  });
});

describe('login and sessions', () => {
  it('logs in with email or phone, sets an httpOnly cookie, and exposes /me', async () => {
    const c = await client();
    await registerAndVerify(c);
    const res = await c.post('/api/auth/login').send({ identifier: user.email, password: user.password }).expect(200);
    const cookie = (res.headers['set-cookie'] as unknown as string[]).find((x) => x.startsWith('ipl_session'))!;
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Lax/i);
    expect(cookie).not.toMatch(/Max-Age=\d+/i); // browser-session cookie unless rememberMe
    const me = await c.get('/api/users/me').expect(200);
    expect(me.body.user.emailVerified).toBe(true);

    const c2 = await client();
    await c2.post('/api/auth/login').send({ identifier: '+91 98765 43210', password: user.password }).expect(200);
  });
  it('issues a persistent cookie only when rememberMe is set', async () => {
    const c = await client();
    await registerAndVerify(c);
    const res = await c.post('/api/auth/login').send({ identifier: user.email, password: user.password, rememberMe: true }).expect(200);
    const cookie = (res.headers['set-cookie'] as unknown as string[]).find((x) => x.startsWith('ipl_session'))!;
    expect(cookie).toMatch(/Max-Age=\d+/i);
  });
  it('rejects wrong password and unknown account with the same message', async () => {
    const c = await client();
    await registerAndVerify(c);
    const a = await c.post('/api/auth/login').send({ identifier: user.email, password: 'Wrong!Passw0rd1' }).expect(401);
    const b = await c.post('/api/auth/login').send({ identifier: 'nobody@example.com', password: 'Wrong!Passw0rd1' }).expect(401);
    expect(a.body.error.message).toBe(b.body.error.message);
  });
  it('locks the account after repeated failures', async () => {
    const c = await client();
    await registerAndVerify(c);
    for (let i = 0; i < 5; i++) await c.post('/api/auth/login').send({ identifier: user.email, password: 'Wrong!Passw0rd1' }).expect(401);
    await c.post('/api/auth/login').send({ identifier: user.email, password: user.password }).expect(429);
  });
  it('blocks protected routes without a session and after logout', async () => {
    const c = await client();
    await c.get('/api/users/me').expect(401);
    await registerAndVerify(c);
    await c.post('/api/auth/login').send({ identifier: user.email, password: user.password }).expect(200);
    await c.get('/api/users/me').expect(200);
    await c.post('/api/auth/logout').send({}).expect(200);
    await c.get('/api/users/me').expect(401);
  });
  it('revoked sessions stop working even if the cookie is replayed', async () => {
    const c = await client();
    await registerAndVerify(c);
    await c.post('/api/auth/login').send({ identifier: user.email, password: user.password }).expect(200);
    await models.Session.updateMany({}, { revokedAt: new Date() });
    await c.get('/api/users/me').expect(401);
  });
});

describe('forgot and reset password', () => {
  it('gives a generic response and sends a link only for real accounts', async () => {
    const c = await client();
    await registerAndVerify(c);
    sent.length = 0;
    const known = await c.post('/api/auth/forgot-password').send({ email: user.email }).expect(200);
    const unknown = await c.post('/api/auth/forgot-password').send({ email: 'nobody@example.com' }).expect(200);
    expect(known.body).toEqual(unknown.body);
    expect(sent.filter((s) => s.template === 'reset_password')).toHaveLength(1);
  });
  it('stores only a hash, works exactly once, and revokes sessions', async () => {
    const c = await client();
    await registerAndVerify(c);
    await c.post('/api/auth/login').send({ identifier: user.email, password: user.password }).expect(200);
    await c.post('/api/auth/forgot-password').send({ email: user.email }).expect(200);
    const token = tokenFrom(sent.find((s) => s.template === 'reset_password')!.url);
    const stored = await models.User.findOne({ email: user.email }).select('+resetTokenHash');
    expect(stored!.resetTokenHash).not.toBe(token);

    const next = 'N3w!Passw0rd-xyz';
    await c.post('/api/auth/reset-password').send({ token, password: next, confirmPassword: next }).expect(200);
    await c.post('/api/auth/reset-password').send({ token, password: 'An0ther!Passw0rd', confirmPassword: 'An0ther!Passw0rd' }).expect(400);
    await c.get('/api/users/me').expect(401);
    const c2 = await client();
    await c2.post('/api/auth/login').send({ identifier: user.email, password: user.password }).expect(401);
    await c2.post('/api/auth/login').send({ identifier: user.email, password: next }).expect(200);
  });
  it('rejects expired reset links', async () => {
    const c = await client();
    await registerAndVerify(c);
    await c.post('/api/auth/forgot-password').send({ email: user.email }).expect(200);
    const token = tokenFrom(sent.find((s) => s.template === 'reset_password')!.url);
    await models.User.updateOne({ email: user.email }, { resetTokenExpires: new Date(Date.now() - 1000) });
    await c.post('/api/auth/reset-password').send({ token, password: 'N3w!Passw0rd-xyz', confirmPassword: 'N3w!Passw0rd-xyz' }).expect(400);
  });
});

describe('profile and password change', () => {
  it('updates profile, resets phone verification on change, and blocks duplicate phone', async () => {
    const c = await client();
    await registerAndVerify(c);
    await models.User.create({ name: 'Other', email: 'o@example.com', phone: '+919000000001', passwordHash: 'x', consent: { termsAcceptedAt: new Date(), privacyAcceptedAt: new Date() } });
    await c.post('/api/auth/login').send({ identifier: user.email, password: user.password }).expect(200);
    await c.patch('/api/users/me').send({ phone: '+919000000001' }).expect(409);
    const ok = await c.patch('/api/users/me').send({ name: 'Asha R', phone: '+919000000002' }).expect(200);
    expect(ok.body.user.name).toBe('Asha R');
    expect(ok.body.user.phoneVerified).toBe(false);
  });
  it('refuses to let a client change its own role', async () => {
    const c = await client();
    await registerAndVerify(c);
    await c.post('/api/auth/login').send({ identifier: user.email, password: user.password }).expect(200);
    await c.patch('/api/users/me').send({ role: 'admin' }).expect(400);
    expect((await models.User.findOne({ email: user.email }))!.role).toBe('customer');
  });
  it('changes password only with the correct current password and signs out other devices', async () => {
    const a = await client();
    await registerAndVerify(a);
    await a.post('/api/auth/login').send({ identifier: user.email, password: user.password }).expect(200);
    const b = await client();
    await b.post('/api/auth/login').send({ identifier: user.email, password: user.password }).expect(200);
    const next = 'N3w!Passw0rd-xyz';
    await a.patch('/api/users/me/password').send({ currentPassword: 'bad', newPassword: next, confirmPassword: next }).expect(400);
    await a.patch('/api/users/me/password').send({ currentPassword: user.password, newPassword: next, confirmPassword: next }).expect(200);
    await a.get('/api/users/me').expect(200);
    await b.get('/api/users/me').expect(401);
  });
});

describe('role guard', () => {
  it('forbids customers from role-restricted routes', async () => {
    const { requireRole } = await import('../middleware/auth.js');
    const req: any = { auth: { role: 'customer' } };
    let err: any;
    requireRole('admin')(req, {} as any, (e?: unknown) => { err = e; });
    expect(err.status).toBe(403);
    err = undefined;
    requireRole('admin', 'staff')({ auth: { role: 'staff' } } as any, {} as any, (e?: unknown) => { err = e; });
    expect(err).toBeUndefined();
  });
});
