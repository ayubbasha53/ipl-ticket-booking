import { describe, expect, it } from 'vitest';
import { loginSchema, passwordSchema, phoneSchema, registerSchema, resetPasswordSchema } from '../validators/auth.js';
import { generateToken, hashToken } from '../utils/crypto.js';

const valid = {
  name: 'Asha Rao', email: 'ASHA@Example.com', phone: '+91 98765 43210',
  password: 'Str0ng!Passw0rd', confirmPassword: 'Str0ng!Passw0rd', acceptTerms: true as const,
};

describe('validators', () => {
  it('normalizes email and phone on register', () => {
    const r = registerSchema.parse(valid);
    expect(r.email).toBe('asha@example.com');
    expect(r.phone).toBe('+919876543210');
    expect(r.marketingNotifications).toBe(false);
  });
  it('rejects phone without country code', () => {
    expect(phoneSchema.safeParse('9876543210').success).toBe(false);
  });
  it.each(['short1!A', 'alllowercase1!x', 'ALLUPPERCASE1!X', 'NoDigitsHere!!', 'NoSymbolsHere12'])('rejects weak password %s', (pw) => {
    expect(passwordSchema.safeParse(pw).success).toBe(false);
  });
  it('rejects mismatched confirmation and unaccepted terms', () => {
    const r = registerSchema.safeParse({ ...valid, confirmPassword: 'other', acceptTerms: false });
    expect(r.success).toBe(false);
    if (!r.success) {
      const paths = r.error.issues.map((i) => i.path[0]);
      expect(paths).toContain('acceptTerms');
    }
  });
  it('rejects NoSQL operator objects as identifiers', () => {
    expect(loginSchema.safeParse({ identifier: { $ne: '' }, password: 'x' }).success).toBe(false);
  });
  it('rejects malformed reset tokens', () => {
    expect(resetPasswordSchema.safeParse({ token: 'abc', password: valid.password, confirmPassword: valid.password }).success).toBe(false);
  });
});

describe('tokens', () => {
  it('stores only a hash and hashes deterministically', () => {
    const { token, hash } = generateToken();
    expect(token).toHaveLength(64);
    expect(hash).not.toBe(token);
    expect(hashToken(token)).toBe(hash);
  });
});
