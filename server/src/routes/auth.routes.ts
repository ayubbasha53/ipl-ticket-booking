import { Router } from 'express';
import * as c from '../controllers/auth.controller.js';
import { validateBody } from '../middleware/validate.js';
import { emailLinkLimiter, loginLimiter, registerLimiter } from '../middleware/rateLimit.js';
import {
  forgotPasswordSchema, loginSchema, registerSchema, resendVerificationSchema, resetPasswordSchema, verifyEmailSchema,
} from '../validators/auth.js';

const r = Router();
r.post('/register', registerLimiter, validateBody(registerSchema), c.register);
r.post('/login', loginLimiter, validateBody(loginSchema), c.login);
r.post('/logout', c.logout);
r.post('/verify-email', validateBody(verifyEmailSchema), c.verifyEmail);
r.post('/resend-verification', emailLinkLimiter, validateBody(resendVerificationSchema), c.resendVerification);
r.post('/forgot-password', emailLinkLimiter, validateBody(forgotPasswordSchema), c.forgotPassword);
r.post('/reset-password', loginLimiter, validateBody(resetPasswordSchema), c.resetPassword);
export default r;
