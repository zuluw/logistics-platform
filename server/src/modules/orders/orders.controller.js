import { ordersService } from './orders.service.js';
import { ApiResponse } from '../../common/responses/apiResponse.js';

export class OrdersController {
  async getOrders(req, res, next) {
    try {
      const result = await ordersService.getOrders(req.query);
      return ApiResponse.ok(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getOrderById(req, res, next) {
    try {
      const order = await ordersService.getOrderById(req.params.id);
      return ApiResponse.ok(res, order);
    } catch (error) {
      next(error);
    }
  }

  async createOrder(req, res, next) {
    try {
      const order = await ordersService.createOrder(req.body);
      return ApiResponse.created(res, order, 'Order created successfully');
    } catch (error) {
      next(error);
    }
  }

  async updateOrder(req, res, next) {
    try {
      const order = await ordersService.updateOrder(req.params.id, req.body);
      return ApiResponse.ok(res, order, 'Order updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async deleteOrder(req, res, next) {
    try {
      await ordersService.deleteOrder(req.params.id);
      return ApiResponse.noContent(res);
    } catch (error) {
      next(error);
    }
  }
}

export const ordersController = new OrdersController();
