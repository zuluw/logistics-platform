import { usersService } from './users.service.js';
import { ApiResponse } from '../../common/responses/apiResponse.js';

export class UsersController {
  async getUsers(req, res, next) {
    try {
      const result = await usersService.getUsers(req.query);
      return ApiResponse.ok(res, result);
    } catch (error) {
      next(error);
    }
  }

  async updateUserRole(req, res, next) {
    try {
      const updatedUser = await usersService.updateUserRole(
        req.user.id,
        req.params.id,
        req.body.role
      );
      return ApiResponse.ok(res, updatedUser, 'User role updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async deleteUser(req, res, next) {
    try {
      await usersService.deleteUser(req.user.id, req.params.id);
      return ApiResponse.noContent(res);
    } catch (error) {
      next(error);
    }
  }
}

export const usersController = new UsersController();
