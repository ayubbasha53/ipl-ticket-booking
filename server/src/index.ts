import { createApp } from './app.js';
import { connectDb, supportsTransactions } from './config/db.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';

async function main() {
  await connectDb();
  if (!(await supportsTransactions())) {
    logger.warn('MongoDB is not a replica set: transactions unavailable. Inventory will use the atomic-update fallback strategy.');
  }
  createApp().listen(env.PORT, () => logger.info(`API listening on http://localhost:${env.PORT}`));
}

main().catch((err) => {
  logger.error('Failed to start server', { message: (err as Error).message });
  process.exit(1);
});
