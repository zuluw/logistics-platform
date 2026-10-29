import { Router } from 'express';
import { authController } from './auth.controller.js';
import { registerSchema, loginSchema } from './auth.dto.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';

const router = Router();

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.get('/me', authMiddleware, authController.getMe);

export default router;
