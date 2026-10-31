import { analyticsService } from './analytics.service.js';
import { ApiResponse } from '../../common/responses/apiResponse.js';

export class AnalyticsController {
  async getSummary(req, res, next) {
    try {
      const summary = await analyticsService.getSummary();
      return ApiResponse.ok(res, summary);
    } catch (error) {
      next(error);
    }
  }
}

export const analyticsController = new AnalyticsController();
