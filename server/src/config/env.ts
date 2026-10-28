import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../.env') });
import { z } from 'zod';

const bool = z
  .enum(['true', 'false'])
  .default('false')
  .transform((v) => v === 'true');

const schema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().default(4000),
    CLIENT_URL: z.string().url().default('http://localhost:5173'),
    MONGODB_URI: z.string().min(1),
    JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
    COOKIE_SECURE: bool,
    SESSION_HOURS: z.coerce.number().positive().default(12),
    REMEMBER_ME_DAYS: z.coerce.number().positive().default(30),
    EMAIL_PROVIDER: z.enum(['console', 'smtp', 'brevo']).default('console'),
    BREVO_API_KEY: z.string().optional(),
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.coerce.number().int().default(587),
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),
    MAIL_FROM_NAME: z.string().default('IPL Tickets Demo'),
    MAIL_FROM_ADDRESS: z.string().email().default('no-reply@example.com'),
    ADMIN_SEED_EMAIL: z.string().optional(),
    ADMIN_SEED_PHONE: z.string().optional(),
    ADMIN_SEED_PASSWORD: z.string().optional(),
  })
  .superRefine((env, ctx) => {
    if (env.EMAIL_PROVIDER === 'smtp' && !(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS)) {
      ctx.addIssue({ code: 'custom', message: 'EMAIL_PROVIDER=smtp requires SMTP_HOST, SMTP_USER and SMTP_PASS' });
    }
    if (env.EMAIL_PROVIDER === 'brevo' && !env.BREVO_API_KEY) {
      ctx.addIssue({ code: 'custom', message: 'EMAIL_PROVIDER=brevo requires BREVO_API_KEY' });
    }
    if (env.NODE_ENV === 'production') {
      if (!env.COOKIE_SECURE) ctx.addIssue({ code: 'custom', message: 'COOKIE_SECURE must be true in production' });
      if (env.EMAIL_PROVIDER === 'console') {
        ctx.addIssue({ code: 'custom', message: 'EMAIL_PROVIDER=console (demo mode) is not allowed in production' });
      }
    }
  });

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  const lines = parsed.error.issues.map((i) => `  - ${i.path.join('.') || 'env'}: ${i.message}`);
  console.error(`Invalid environment configuration:\n${lines.join('\n')}`);
  process.exit(1);
}

export const env = parsed.data;
export const isProd = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';
