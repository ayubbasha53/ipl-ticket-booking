import { z } from 'zod';

// Mirrors server/src/validators/auth.ts. The server remains the authority.
const phone = z
  .string()
  .transform((v) => v.replace(/[\s()-]/g, ''))
  .pipe(z.string().regex(/^\+[1-9]\d{7,14}$/, 'Enter a mobile number with country code, e.g. +919876543210'));

export const passwordRules = [
  { label: 'At least 10 characters', test: (v: string) => v.length >= 10 },
  { label: 'A lowercase letter', test: (v: string) => /[a-z]/.test(v) },
  { label: 'An uppercase letter', test: (v: string) => /[A-Z]/.test(v) },
  { label: 'A number', test: (v: string) => /\d/.test(v) },
  { label: 'A symbol', test: (v: string) => /[^A-Za-z0-9]/.test(v) },
];

const password = z
  .string()
  .min(10, 'Use at least 10 characters')
  .max(72, 'Use at most 72 characters')
  .regex(/[a-z]/, 'Add a lowercase letter')
  .regex(/[A-Z]/, 'Add an uppercase letter')
  .regex(/\d/, 'Add a number')
  .regex(/[^A-Za-z0-9]/, 'Add a symbol');

const email = z.string().trim().min(1, 'Enter your email address').email('Enter a valid email address');

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'Enter your full name').max(80),
    email,
    phone,
    password,
    confirmPassword: z.string().min(1, 'Confirm your password'),
    acceptTerms: z.boolean().refine((v) => v, 'Accept the terms and privacy policy to continue'),
    marketingNotifications: z.boolean(),
  })
  .refine((d) => d.password === d.confirmPassword, { path: ['confirmPassword'], message: 'Passwords do not match' });

export const loginSchema = z.object({
  identifier: z.string().trim().min(3, 'Enter your email or mobile number'),
  password: z.string().min(1, 'Enter your password'),
  rememberMe: z.boolean(),
});

export const forgotSchema = z.object({ email });

export const resetSchema = z
  .object({ password, confirmPassword: z.string().min(1, 'Confirm your password') })
  .refine((d) => d.password === d.confirmPassword, { path: ['confirmPassword'], message: 'Passwords do not match' });

export const profileSchema = z.object({
  name: z.string().trim().min(2, 'Enter your full name').max(80),
  phone,
  marketingNotifications: z.boolean(),
});

export const changePasswordSchema = z
  .object({ currentPassword: z.string().min(1, 'Enter your current password'), newPassword: password, confirmPassword: z.string().min(1, 'Confirm your new password') })
  .refine((d) => d.newPassword === d.confirmPassword, { path: ['confirmPassword'], message: 'Passwords do not match' });
