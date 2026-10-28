import { Router } from 'express';
import * as c from '../controllers/user.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { changePasswordSchema, updateProfileSchema } from '../validators/auth.js';

const r = Router();
r.use(requireAuth);
r.get('/me', c.me);
r.patch('/me', validateBody(updateProfileSchema), c.updateMe);
r.patch('/me/password', validateBody(changePasswordSchema), c.changePassword);
r.get('/me/sessions', c.listSessions);
r.delete('/me/sessions/:sid', c.revokeOne);
r.post('/me/logout-all', c.logoutAll);
export default r;
