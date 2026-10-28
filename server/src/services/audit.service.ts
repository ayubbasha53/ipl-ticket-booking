import type { Request } from 'express';
import { AuditLog } from '../models/index.js';
import { logger } from '../utils/logger.js';

export async function audit(req: Request | undefined, action: string, opts: { actor?: string; entityType?: string; entityId?: string; meta?: Record<string, unknown> } = {}) {
  try {
    await AuditLog.create({
      actor: opts.actor ?? req?.auth?.userId,
      action,
      entityType: opts.entityType,
      entityId: opts.entityId,
      ip: req?.ip,
      userAgent: req?.get('user-agent')?.slice(0, 300),
      meta: opts.meta,
    });
  } catch {
    logger.error('Audit log write failed', { action });
  }
}
