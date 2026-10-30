import { routesService } from './routes.service.js';
import { ApiResponse } from '../../common/responses/apiResponse.js';

export class RoutesController {
  async calculateRoute(req, res, next) {
    try {
      const preview = await routesService.calculateRoute(req.body);
      return ApiResponse.ok(res, preview, 'Route calculated successfully');
    } catch (error) {
      next(error);
    }
  }

  async createRoute(req, res, next) {
    try {
      const route = await routesService.createRoute(req.user.id, req.body);
      return ApiResponse.created(res, route, 'Route created successfully');
    } catch (error) {
      next(error);
    }
  }

  async getRoutes(req, res, next) {
    try {
      const routes = await routesService.getRoutes(req.query);
      return ApiResponse.ok(res, routes);
    } catch (error) {
      next(error);
    }
  }

  async getMyRoute(req, res, next) {
    try {
      const route = await routesService.getMyActiveRoute(req.user.id);
      return ApiResponse.ok(res, route);
    } catch (error) {
      next(error);
    }
  }

  async updatePointStatus(req, res, next) {
    try {
      const route = await routesService.updatePointStatus(
        req.user.id,
        req.params.id,
        req.params.pointId,
        req.body.status,
      );
      return ApiResponse.ok(res, route, 'Point status updated successfully');
    } catch (error) {
      next(error);
    }
  }
}

export const routesController = new RoutesController();
