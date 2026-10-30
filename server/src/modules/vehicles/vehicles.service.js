import { prisma } from '../../config/prisma.js';
import { ApiError } from '../../common/errors/apiError.js';

const DRIVER_SELECT = {
  id: true,
  fullName: true,
  email: true,
  phone: true,
};

const ACTIVE_ROUTE_STATUSES = ['DRAFT', 'ACTIVE'];

async function assertDriverExists(driverId) {
  const driver = await prisma.user.findUnique({ where: { id: driverId } });

  if (!driver) {
    throw ApiError.notFound('Driver not found');
  }

  if (driver.role !== 'DRIVER') {
    throw ApiError.badRequest('Assigned user must have the DRIVER role');
  }
}

export class VehiclesService {
  async getVehicles({ status, search }) {
    const where = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { brand: { contains: search, mode: 'insensitive' } },
        { licensePlate: { contains: search, mode: 'insensitive' } },
      ];
    }

    return prisma.vehicle.findMany({
      where,
      include: { currentDriver: { select: DRIVER_SELECT } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getVehicleById(id) {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
      include: { currentDriver: { select: DRIVER_SELECT } },
    });

    if (!vehicle) {
      throw ApiError.notFound('Vehicle not found');
    }

    return vehicle;
  }

  async createVehicle(data) {
    if (data.currentDriverId) {
      await assertDriverExists(data.currentDriverId);
    }

    return prisma.vehicle.create({
      data,
      include: { currentDriver: { select: DRIVER_SELECT } },
    });
  }

  async updateVehicle(id, data) {
    await this.getVehicleById(id);

    if (data.currentDriverId) {
      await assertDriverExists(data.currentDriverId);
    }

    return prisma.vehicle.update({
      where: { id },
      data,
      include: { currentDriver: { select: DRIVER_SELECT } },
    });
  }

  async deleteVehicle(id) {
    await this.getVehicleById(id);

    const activeRouteCount = await prisma.route.count({
      where: {
        vehicleId: id,
        status: { in: ACTIVE_ROUTE_STATUSES },
      },
    });

    if (activeRouteCount > 0) {
      throw ApiError.badRequest('Cannot delete a vehicle with active or draft routes');
    }

    return prisma.vehicle.delete({ where: { id } });
  }
}

export const vehiclesService = new VehiclesService();
