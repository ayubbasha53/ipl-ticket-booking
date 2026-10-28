import { z } from 'zod';

export const normalizePhone = (v: string) => v.replace(/[\s()-]/g, '');

export const emailSchema = z.string().trim().toLowerCase().email('Enter a valid email address').max(254);

/** E.164 with country code, e.g. +919876543210 */
export const phoneSchema = z
  .string()
  .transform(normalizePhone)
  .pipe(z.string().regex(/^\+[1-9]\d{7,14}$/, 'Enter a mobile number with country code, e.g. +919876543210'));

export const passwordSchema = z
  .string()
  .min(10, 'Use at least 10 characters')
  .max(72, 'Use at most 72 characters')
  .regex(/[a-z]/, 'Add a lowercase letter')
  .regex(/[A-Z]/, 'Add an uppercase letter')
  .regex(/\d/, 'Add a number')
  .regex(/[^A-Za-z0-9]/, 'Add a symbol');

const tokenSchema = z.string().regex(/^[a-f0-9]{64}$/i, 'This link is not valid');

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'Enter your full name').max(80),
    email: emailSchema,
    phone: phoneSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    acceptTerms: z.literal(true, { errorMap: () => ({ message: 'Accept the terms and privacy policy to continue' }) }),
    transactionalNotifications: z.boolean().default(true),
    marketingNotifications: z.boolean().default(false),
  })
  .refine((d) => d.password === d.confirmPassword, { path: ['confirmPassword'], message: 'Passwords do not match' });

export const loginSchema = z.object({
  identifier: z.string().trim().min(3, 'Enter your email or mobile number').max(254),
  password: z.string().min(1, 'Enter your password').max(200),
  rememberMe: z.boolean().default(false),
});

export const verifyEmailSchema = z.object({ token: tokenSchema });
export const resendVerificationSchema = z.object({ email: emailSchema });
export const forgotPasswordSchema = z.object({ email: emailSchema });

export const resetPasswordSchema = z
  .object({ token: tokenSchema, password: passwordSchema, confirmPassword: z.string() })
  .refine((d) => d.password === d.confirmPassword, { path: ['confirmPassword'], message: 'Passwords do not match' });

export const updateProfileSchema = z
  .object({
    name: z.string().trim().min(2).max(80).optional(),
    phone: phoneSchema.optional(),
    transactionalNotifications: z.boolean().optional(),
    marketingNotifications: z.boolean().optional(),
  })
  .strict();

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password'),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, { path: ['confirmPassword'], message: 'Passwords do not match' })
  .refine((d) => d.newPassword !== d.currentPassword, { path: ['newPassword'], message: 'Choose a password you have not used here' });
