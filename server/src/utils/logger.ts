/* Minimal logger. Never pass passwords, tokens, OTPs or payment data to it. */
const stamp = () => new Date().toISOString();
const quiet = process.env.NODE_ENV === 'test';

export const logger = {
  info: (msg: string, meta?: unknown) => !quiet && console.log(`[${stamp()}] INFO  ${msg}`, meta ?? ''),
  warn: (msg: string, meta?: unknown) => !quiet && console.warn(`[${stamp()}] WARN  ${msg}`, meta ?? ''),
  error: (msg: string, meta?: unknown) => console.error(`[${stamp()}] ERROR ${msg}`, meta ?? ''),
};
