import { describe, expect, it } from 'vitest';
import { loginSchema, registerSchema, resetSchema } from '../utils/schemas';

const base = { name: 'Asha Rao', email: 'a@b.co', phone: '+91 98765 43210', password: 'Str0ng!Passw0rd', confirmPassword: 'Str0ng!Passw0rd', acceptTerms: true, marketingNotifications: false };

describe('client schemas', () => {
  it('accepts a valid registration and normalises the phone number', () => {
    const r = registerSchema.parse(base);
    expect(r.phone).toBe('+919876543210');
  });
  it('reports field-level errors', () => {
    const r = registerSchema.safeParse({ ...base, email: 'nope', phone: '12345', acceptTerms: false, confirmPassword: 'x' });
    expect(r.success).toBe(false);
    if (!r.success) {
      const f = r.error.flatten().fieldErrors;
      expect(f.email).toBeDefined();
      expect(f.phone).toBeDefined();
      expect(f.acceptTerms).toBeDefined();
      expect(f.confirmPassword).toBeDefined();
    }
  });
  it('requires matching passwords on reset', () => {
    expect(resetSchema.safeParse({ password: 'Str0ng!Passw0rd', confirmPassword: 'Different1!aaa' }).success).toBe(false);
  });
  it('requires a login identifier and password', () => {
    expect(loginSchema.safeParse({ identifier: '', password: '', rememberMe: false }).success).toBe(false);
  });
});
