import nodemailer from 'nodemailer';
import { env, isProd } from '../config/env.js';
import { NotificationLog } from '../models/index.js';
import { logger } from '../utils/logger.js';

export interface EmailInput {
  to: string;
  userId?: string;
  template: string;
  subject: string;
  html: string;
  text: string;
  /** Prevents duplicate sends of the same logical email (e.g. booking confirmation). */
  dedupeKey?: string;
  /** Shown in the console in development demo mode only. */
  devActionUrl?: string;
}

const maskEmail = (e: string) => e.replace(/^(.).*(@.*)$/, '$1***$2');

let transport: nodemailer.Transporter | null = null;
function getTransport() {
  transport ??= nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  });
  return transport;
}

/** Brevo transactional API over HTTPS (port 443). Works on hosts that block SMTP ports, e.g. Render free. */
async function sendViaBrevo(input: EmailInput): Promise<string | undefined> {
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': env.BREVO_API_KEY!, 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({
      sender: { name: env.MAIL_FROM_NAME, email: env.MAIL_FROM_ADDRESS },
      to: [{ email: input.to }],
      subject: input.subject,
      htmlContent: input.html,
      textContent: input.text,
    }),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`Brevo API responded ${res.status}`);
  const data = (await res.json().catch(() => ({}))) as { messageId?: string };
  return data.messageId;
}

export const emailStatus = () => ({
  provider: env.EMAIL_PROVIDER,
  live: env.EMAIL_PROVIDER !== 'console',
  note: env.EMAIL_PROVIDER === 'console' ? 'DEMO mode: emails are NOT delivered' : `${env.EMAIL_PROVIDER} configured`,
});

export async function sendEmail(input: EmailInput): Promise<{ status: 'sent' | 'failed' | 'not_sent_demo_mode' }> {
  const base = { user: input.userId, channel: 'email' as const, template: input.template, toMasked: maskEmail(input.to), dedupeKey: input.dedupeKey };

  if (input.dedupeKey && (await NotificationLog.exists({ dedupeKey: input.dedupeKey, status: 'sent' }))) {
    return { status: 'sent' };
  }

  if (env.EMAIL_PROVIDER === 'console') {
    await NotificationLog.create({ ...base, provider: 'console', status: 'not_sent_demo_mode', dedupeKey: undefined });
    if (!isProd) {
      logger.warn(`[EMAIL DEMO MODE - not delivered] "${input.subject}" for ${maskEmail(input.to)}`, input.devActionUrl ? { link: input.devActionUrl } : undefined);
    }
    return { status: 'not_sent_demo_mode' };
  }

  // One retry for transient provider errors.
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const messageId =
        env.EMAIL_PROVIDER === 'brevo'
          ? await sendViaBrevo(input)
          : (
              await getTransport().sendMail({
                from: `"${env.MAIL_FROM_NAME}" <${env.MAIL_FROM_ADDRESS}>`,
                to: input.to,
                subject: input.subject,
                text: input.text,
                html: input.html,
              })
            ).messageId;
      await NotificationLog.create({ ...base, provider: env.EMAIL_PROVIDER, status: 'sent', providerMessageId: messageId });
      return { status: 'sent' };
    } catch (err) {
      if (attempt === 2) {
        await NotificationLog.create({ ...base, provider: env.EMAIL_PROVIDER, status: 'failed', error: (err as Error).message.slice(0, 200), dedupeKey: undefined });
        logger.error('Email delivery failed', { template: input.template });
        return { status: 'failed' };
      }
    }
  }
  return { status: 'failed' };
}
