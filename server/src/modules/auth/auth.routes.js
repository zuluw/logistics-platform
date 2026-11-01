import { Router } from 'express';
import { authController } from './auth.controller.js';
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from './auth.dto.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';

const router = Router();

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);
router.get('/me', authMiddleware, authController.getMe);
router.patch('/profile', authMiddleware, validate(updateProfileSchema), authController.updateProfile);
router.post('/change-password', authMiddleware, validate(changePasswordSchema), authController.changePassword);
router.get('/stats', authMiddleware, authController.getUserStats);

export default router;
