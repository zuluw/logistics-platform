import { vehiclesService } from './vehicles.service.js';
import { ApiResponse } from '../../common/responses/apiResponse.js';

export class VehiclesController {
  async getVehicles(req, res, next) {
    try {
      const vehicles = await vehiclesService.getVehicles(req.query);
      return ApiResponse.ok(res, vehicles);
    } catch (error) {
      next(error);
    }
  }

  async getVehicleById(req, res, next) {
    try {
      const vehicle = await vehiclesService.getVehicleById(req.params.id);
      return ApiResponse.ok(res, vehicle);
    } catch (error) {
      next(error);
    }
  }

  async createVehicle(req, res, next) {
    try {
      const vehicle = await vehiclesService.createVehicle(req.body);
      return ApiResponse.created(res, vehicle, 'Vehicle created successfully');
    } catch (error) {
      next(error);
    }
  }

  async updateVehicle(req, res, next) {
    try {
      const vehicle = await vehiclesService.updateVehicle(req.params.id, req.body);
      return ApiResponse.ok(res, vehicle, 'Vehicle updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async deleteVehicle(req, res, next) {
    try {
      await vehiclesService.deleteVehicle(req.params.id);
      return ApiResponse.noContent(res);
    } catch (error) {
      next(error);
    }
  }
}

export const vehiclesController = new VehiclesController();
