import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import mongoose from 'mongoose';
import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { isProd } from '../config/env.js';

export const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json({ error: { code: 'not_found', message: 'That endpoint does not exist.' } });
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    const fields: Record<string, string> = {};
    for (const issue of err.issues) {
      const key = issue.path.join('.') || '_';
      fields[key] ??= issue.message;
    }
    return res.status(400).json({ error: { code: 'validation_failed', message: 'Check the highlighted fields.', fields } });
  }
  if (err instanceof AppError) {
    return res.status(err.status).json({ error: { code: err.code, message: err.message, details: err.details } });
  }
  if (err instanceof mongoose.mongo.MongoServerError && err.code === 11000) {
    return res.status(409).json({ error: { code: 'conflict', message: 'That record already exists.' } });
  }
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ error: { code: 'bad_json', message: 'Request body is not valid JSON.' } });
  }
  logger.error('Unhandled error', isProd ? { message: err?.message } : err);
  res.status(500).json({ error: { code: 'internal', message: 'Something went wrong on our side. Try again shortly.' } });
};
