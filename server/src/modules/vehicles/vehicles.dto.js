import { z } from 'zod';

export const createVehicleSchema = z.object({
  brand: z.string().min(2, 'Brand must be at least 2 characters long').trim(),
  licensePlate: z.string().min(3, 'License plate must be at least 3 characters long').trim(),
  capacityKg: z.number().positive('Capacity must be greater than 0'),
  volumeM3: z.number().positive('Volume must be greater than 0'),
  status: z.enum(['AVAILABLE', 'IN_TRANSIT', 'MAINTENANCE']).default('AVAILABLE'),
  currentDriverId: z.string().uuid('Invalid driver ID format').optional().nullable(),
});

export const updateVehicleSchema = z.object({
  brand: z.string().min(2, 'Brand must be at least 2 characters long').trim().optional(),
  licensePlate: z.string().min(3, 'License plate must be at least 3 characters long').trim().optional(),
  capacityKg: z.number().positive('Capacity must be greater than 0').optional(),
  volumeM3: z.number().positive('Volume must be greater than 0').optional(),
  status: z.enum(['AVAILABLE', 'IN_TRANSIT', 'MAINTENANCE']).optional(),
  currentDriverId: z.string().uuid('Invalid driver ID format').optional().nullable(),
});

export const queryVehicleSchema = z.object({
  status: z.enum(['AVAILABLE', 'IN_TRANSIT', 'MAINTENANCE']).optional(),
  search: z.string().optional(),
});
