import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

export async function connectDb(uri: string = env.MONGODB_URI): Promise<void> {
  mongoose.set('strictQuery', true);
  // NoSQL-injection defence: every request body is parsed by Zod (plain strings/numbers only) and
  // raw req.body is never passed into a query filter. Do NOT enable mongoose's global sanitizeFilter:
  // it also neutralises our own trusted operators such as $gt.
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
  logger.info('MongoDB connected');
}

/** Transactions need a replica set. Callers use this to pick the fallback inventory strategy. */
export async function supportsTransactions(): Promise<boolean> {
  const admin = mongoose.connection.db?.admin();
  if (!admin) return false;
  try {
    const hello = await admin.command({ hello: 1 });
    return Boolean(hello.setName) || hello.msg === 'isdbgrid';
  } catch {
    return false;
  }
}

export async function disconnectDb(): Promise<void> {
  await mongoose.disconnect();
}
