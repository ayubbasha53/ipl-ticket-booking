import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

let mongod: MongoMemoryServer;

beforeAll(async () => {
  process.env.EMAIL_PROVIDER = 'brevo';
  process.env.BREVO_API_KEY = 'test-key-not-real';
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri('brevo_test'));
});
afterAll(async () => { await mongoose.disconnect(); await mongod?.stop(); vi.unstubAllGlobals(); });

const mail = { to: 'asha@example.com', template: 'verify_email', subject: 'Hi', html: '<p>x</p>', text: 'x' };

describe('brevo email provider', () => {
  it('posts to the Brevo HTTPS API with the api-key header and logs a sent status', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ messageId: '<abc@brevo>' }) });
    vi.stubGlobal('fetch', fetchMock);
    const { sendEmail } = await import('../services/email.service.js');
    const r = await sendEmail(mail);
    expect(r.status).toBe('sent');
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe('https://api.brevo.com/v3/smtp/email');
    expect(init.headers['api-key']).toBe('test-key-not-real');
    expect(JSON.parse(init.body).to[0].email).toBe('asha@example.com');
    const { NotificationLog } = await import('../models/index.js');
    const log = await NotificationLog.findOne({ template: 'verify_email' });
    expect(log!.status).toBe('sent');
    expect(JSON.stringify(log)).not.toContain('test-key-not-real');
  });
  it('reports failure (not success) after retrying when the API errors', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 401, json: async () => ({}) });
    vi.stubGlobal('fetch', fetchMock);
    const { sendEmail } = await import('../services/email.service.js');
    const r = await sendEmail({ ...mail, template: 'reset_password' });
    expect(r.status).toBe('failed');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
