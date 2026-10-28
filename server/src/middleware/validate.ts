import type { RequestHandler } from 'express';
import type { ZodTypeAny } from 'zod';

/** Validates and replaces req.body with the parsed (stripped, normalized) value. */
export const validateBody =
  (schema: ZodTypeAny): RequestHandler =>
  (req, _res, next) => {
    const result = schema.safeParse(req.body ?? {});
    if (!result.success) return next(result.error);
    req.body = result.data;
    next();
  };
