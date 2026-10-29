import { authService } from './auth.service.js';
import { ApiResponse } from '../../common/responses/apiResponse.js';

export class AuthController {
  async register(req, res, next) {
    try {
      const result = await authService.register(req.body);
      return ApiResponse.created(res, result, 'User registered successfully');
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const result = await authService.login(req.body);
      return ApiResponse.ok(res, result, 'Login successful');
    } catch (error) {
      next(error);
    }
  }

  async getMe(req, res, next) {
    try {
      const user = await authService.getMe(req.user.id);
      return ApiResponse.ok(res, user, 'User profile retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
