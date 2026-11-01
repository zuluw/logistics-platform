import { prisma } from '../../config/prisma.js';
import { ApiError } from '../../common/errors/apiError.js';
import { osrmService } from '../../services/osrm.service.js';
import { socketService } from '../../services/socket.service.js';
import { mailService } from '../../services/mail.service.js';

const ROUTE_INCLUDE = {
  vehicle: true,
  driver: { select: { id: true, fullName: true, email: true, phone: true } },
  dispatcher: { select: { id: true, fullName: true, email: true } },
  routePoints: {
    include: { order: true },
    orderBy: { stopSequence: 'asc' },
  },
};

function attachSteps(route) {
  if (!route) return route;
  let steps = [];
  if (route.polylineGeometry) {
    try {
      const parsed = typeof route.polylineGeometry === 'string'
        ? JSON.parse(route.polylineGeometry)
        : route.polylineGeometry;
      if (Array.isArray(parsed?.steps)) {
        steps = parsed.steps;
      }
    } catch {}
  }
  return { ...route, steps };
}

async function resolveAndValidate(vehicleId, orderIds) {
  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });

  if (!vehicle) {
    throw ApiError.notFound('Vehicle not found');
  }

  if (vehicle.status !== 'AVAILABLE') {
    throw ApiError.badRequest('Vehicle is not available');
  }

  const orders = await prisma.order.findMany({
    where: { id: { in: orderIds } },
  });

  if (orders.length !== orderIds.length) {
    throw ApiError.badRequest('One or more orders were not found');
  }

  const nonPending = orders.filter((o) => o.status !== 'PENDING');
  if (nonPending.length > 0) {
    throw ApiError.badRequest('All orders must have PENDING status');
  }

  const totalWeight = orders.reduce((sum, o) => sum + o.weightKg, 0);
  if (totalWeight > vehicle.capacityKg) {
    throw ApiError.badRequest(
      `Total order weight (${totalWeight.toFixed(2)} kg) exceeds vehicle capacity (${vehicle.capacityKg} kg)`,
    );
  }

  return { vehicle, orders };
}

function buildCoordinates(warehouseCoords, orders) {
  const warehouse = [warehouseCoords.longitude, warehouseCoords.latitude];
  const stops = orders.map((o) => [o.longitude, o.latitude]);
  return [warehouse, ...stops];
}

function applyWaypointOrder(orders, waypointsOrder) {
  const stopOrder = waypointsOrder.slice(1).map((wi) => wi - 1);
  return stopOrder.map((i) => orders[i]);
}

export class RoutesService {
  async calculateRoute({ vehicleId, orderIds, warehouseCoords }) {
    const { vehicle, orders } = await resolveAndValidate(vehicleId, orderIds);
    const coordinates = buildCoordinates(warehouseCoords, orders);
    const osrmResult = await osrmService.optimizeTrip(coordinates);
    const orderedOrders = applyWaypointOrder(orders, osrmResult.waypointsOrder);

    return {
      vehicle,
      distanceKm: osrmResult.distanceKm,
      durationMin: osrmResult.durationMin,
      geometry: osrmResult.geometry,
      steps: osrmResult.steps || [],
      orderedOrders,
    };
  }

  async createRoute(dispatcherId, { vehicleId, driverId, routeDate, orderIds, warehouseCoords }) {
    const { vehicle, orders } = await resolveAndValidate(vehicleId, orderIds);

    const driver = await prisma.user.findUnique({ where: { id: driverId } });
    if (!driver || driver.role !== 'DRIVER') {
      throw ApiError.badRequest('Driver not found or user does not have the DRIVER role');
    }

    const coordinates = buildCoordinates(warehouseCoords, orders);
    const osrmResult = await osrmService.optimizeTrip(coordinates);
    const orderedOrders = applyWaypointOrder(orders, osrmResult.waypointsOrder);

    const geomObj = typeof osrmResult.geometry === 'string'
      ? JSON.parse(osrmResult.geometry)
      : osrmResult.geometry;

    const polylineGeometry = JSON.stringify({
      ...geomObj,
      steps: osrmResult.steps || [],
    });

    const route = await prisma.$transaction(async (tx) => {
      const created = await tx.route.create({
        data: {
          status: 'ACTIVE',
          totalDistanceKm: osrmResult.distanceKm,
          totalDurationMin: osrmResult.durationMin,
          polylineGeometry,
          vehicleId,
          driverId,
          dispatcherId,
          ...(routeDate ? { routeDate: new Date(routeDate) } : {}),
        },
      });

      await tx.routePoint.createMany({
        data: orderedOrders.map((order, index) => ({
          routeId: created.id,
          orderId: order.id,
          stopSequence: index + 1,
        })),
      });

      await tx.vehicle.update({
        where: { id: vehicleId },
        data: { status: 'IN_TRANSIT' },
      });

      await tx.order.updateMany({
        where: { id: { in: orderIds } },
        data: { status: 'ASSIGNED' },
      });

      return created;
    });

    const createdRoute = await prisma.route.findUnique({
      where: { id: route.id },
      include: ROUTE_INCLUDE,
    });

    const enrichedRoute = attachSteps(createdRoute);

    socketService.emitToDriver(driverId, 'route:assigned', enrichedRoute);
    socketService.emitToDispatchers('route:created', enrichedRoute);

    return enrichedRoute;
  }

  async getMyActiveRoute(driverId) {
    const route = await prisma.route.findFirst({
      where: { driverId, status: 'ACTIVE' },
      include: ROUTE_INCLUDE,
    });

    if (!route) {
      throw ApiError.notFound('No active route found for this driver');
    }

    return attachSteps(route);
  }

  async getRoutes({ status } = {}) {
    const where = status ? { status } : {};

    const routes = await prisma.route.findMany({
      where,
      include: ROUTE_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });

    return routes.map(attachSteps);
  }

  async updatePointStatus(driverId, routeId, pointId, status) {
    const route = await prisma.route.findUnique({
      where: { id: routeId },
      include: {
        driver: { select: { id: true, fullName: true, phone: true } },
        routePoints: {
          include: { order: true },
        },
      },
    });

    if (!route) {
      throw ApiError.notFound('Route not found');
    }

    if (route.driverId !== driverId) {
      throw ApiError.forbidden('This route does not belong to you');
    }

    const point = route.routePoints.find((p) => p.id === pointId);
    if (!point) {
      throw ApiError.notFound('Route point not found');
    }

    await prisma.$transaction(async (tx) => {
      await tx.routePoint.update({
        where: { id: pointId },
        data: {
          ...(status === 'DELIVERED' ? { actualArrival: new Date() } : {}),
        },
      });

      await tx.order.update({
        where: { id: point.orderId },
        data: { status },
      });

      if (status === 'DELIVERED') {
        const updatedPoints = await tx.routePoint.findMany({
          where: { routeId },
          include: { order: true },
        });

        const updatedCurrentOrder = { ...point.order, status };
        const allDelivered = updatedPoints.every(
          (p) => (p.id === pointId ? updatedCurrentOrder.status : p.order.status) === 'DELIVERED',
        );

        if (allDelivered) {
          await tx.route.update({
            where: { id: routeId },
            data: { status: 'COMPLETED' },
          });

          await tx.vehicle.update({
            where: { id: route.vehicleId },
            data: { status: 'AVAILABLE' },
          });
        }
      }
    });

    const actualArrival = status === 'DELIVERED' ? new Date().toISOString() : null;
    const isCompleted = status === 'DELIVERED';

    socketService.emitToDispatchers('order:status_changed', {
      routeId,
      pointId,
      status,
      actualArrival,
      isCompleted,
    });

    if (status === 'DELIVERED') {
      const recipientEmail = point.order.customerPhone
        ? `${point.order.customerName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'customer'}@delivery.client`
        : 'customer@delivery.client';

      mailService
        .sendDeliveryConfirmationEmail(recipientEmail, {
          customerName: point.order.customerName,
          deliveryAddress: point.order.deliveryAddress,
          actualArrival: new Date(),
          courierName: route.driver?.fullName || 'Courier Driver',
        })
        .catch(() => {});
    }

    const updated = await prisma.route.findUnique({
      where: { id: routeId },
      include: ROUTE_INCLUDE,
    });

    return attachSteps(updated);
  }

  async reassignRouteVehicle(routeId, newVehicleId) {
    const route = await prisma.route.findUnique({
      where: { id: routeId },
    });

    if (!route) {
      throw ApiError.notFound('Route not found');
    }

    if (route.vehicleId === newVehicleId) {
      const existing = await prisma.route.findUnique({
        where: { id: routeId },
        include: ROUTE_INCLUDE,
      });
      return attachSteps(existing);
    }

    const newVehicle = await prisma.vehicle.findUnique({
      where: { id: newVehicleId },
    });

    if (!newVehicle) {
      throw ApiError.notFound('Vehicle not found');
    }

    if (newVehicle.status !== 'AVAILABLE') {
      throw ApiError.badRequest('New vehicle is not available');
    }

    await prisma.$transaction(async (tx) => {
      if (route.vehicleId) {
        await tx.vehicle.update({
          where: { id: route.vehicleId },
          data: { status: 'AVAILABLE' },
        });
      }

      await tx.vehicle.update({
        where: { id: newVehicleId },
        data: { status: 'IN_TRANSIT' },
      });

      await tx.route.update({
        where: { id: routeId },
        data: { vehicleId: newVehicleId },
      });
    });

    const updatedRoute = await prisma.route.findUnique({
      where: { id: routeId },
      include: ROUTE_INCLUDE,
    });

    const enrichedRoute = attachSteps(updatedRoute);

    socketService.emitToDriver(enrichedRoute.driverId, 'route:vehicle_updated', enrichedRoute);
    socketService.emitToDispatchers('route:updated', enrichedRoute);

    return enrichedRoute;
  }
}

export const routesService = new RoutesService();
