import { z } from 'zod';

export const queryUsersSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  role: z.enum(['ADMIN', 'DISPATCHER', 'DRIVER']).optional(),
  search: z.string().optional(),
});

export const updateUserRoleSchema = z.object({
  role: z.enum(['ADMIN', 'DISPATCHER', 'DRIVER']),
});
