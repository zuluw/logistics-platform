import { z } from 'zod';

export const createOrderSchema = z.object({
  customerName: z.string().min(2, 'Customer name must be at least 2 characters long').trim(),
  customerPhone: z.string().min(5, 'Customer phone must be at least 5 characters long').trim(),
  deliveryAddress: z.string().min(5, 'Delivery address must be at least 5 characters long').trim(),
  latitude: z.number().min(-90, 'Latitude must be between -90 and 90').max(90, 'Latitude must be between -90 and 90'),
  longitude: z.number().min(-180, 'Longitude must be between -180 and 180').max(180, 'Longitude must be between -180 and 180'),
  weightKg: z.number().positive('Weight must be greater than 0'),
  volumeM3: z.number().positive('Volume must be greater than 0'),
  timeWindowStart: z.string().optional().nullable(),
  timeWindowEnd: z.string().optional().nullable(),
});

export const updateOrderSchema = z.object({
  customerName: z.string().min(2, 'Customer name must be at least 2 characters long').trim().optional(),
  customerPhone: z.string().min(5, 'Customer phone must be at least 5 characters long').trim().optional(),
  deliveryAddress: z.string().min(5, 'Delivery address must be at least 5 characters long').trim().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  weightKg: z.number().positive('Weight must be greater than 0').optional(),
  volumeM3: z.number().positive('Volume must be greater than 0').optional(),
  timeWindowStart: z.string().optional().nullable(),
  timeWindowEnd: z.string().optional().nullable(),
  status: z.enum(['PENDING', 'ASSIGNED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED']).optional(),
});

export const queryOrderSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  status: z.enum(['PENDING', 'ASSIGNED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED']).optional(),
  search: z.string().optional(),
  sortBy: z.enum(['createdAt', 'customerName', 'status', 'weightKg', 'volumeM3']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});
