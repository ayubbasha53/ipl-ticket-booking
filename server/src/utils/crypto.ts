import crypto from 'node:crypto';

/** Opaque random token for emails; only the SHA-256 hash is ever stored. */
export function generateToken(bytes = 32): { token: string; hash: string } {
  const token = crypto.randomBytes(bytes).toString('hex');
  return { token, hash: hashToken(token) };
}

export const hashToken = (token: string): string => crypto.createHash('sha256').update(token).digest('hex');

export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}
