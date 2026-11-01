import { z } from 'zod';

const warehouseCoordDefaults = {
  latitude: 53.8961,
  longitude: 27.5503,
};

export const calculateRouteSchema = z.object({
  vehicleId: z.string().uuid('Invalid vehicle ID format'),
  orderIds: z.array(z.string().uuid('Invalid order ID format')).min(1, 'At least one order is required'),
  warehouseCoords: z
    .object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
    })
    .default(warehouseCoordDefaults),
});

export const createRouteSchema = z.object({
  vehicleId: z.string().uuid('Invalid vehicle ID format'),
  driverId: z.string().uuid('Invalid driver ID format'),
  routeDate: z.string().optional(),
  orderIds: z.array(z.string().uuid('Invalid order ID format')).min(1, 'At least one order is required'),
  warehouseCoords: z
    .object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
    })
    .default(warehouseCoordDefaults),
});

export const updatePointStatusSchema = z.object({
  status: z.enum(['PENDING', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED']),
});

export const queryRouteSchema = z.object({
  status: z.enum(['DRAFT', 'ACTIVE', 'COMPLETED']).optional(),
});

export const reassignRouteVehicleSchema = z.object({
  vehicleId: z.string().uuid('Invalid vehicle ID format'),
});
