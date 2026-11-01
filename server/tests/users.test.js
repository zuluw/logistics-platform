import { describe, it, expect, vi, afterEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import { prisma } from '../src/config/prisma.js';
import { env } from '../src/config/env.js';

describe('Users Module API', () => {
  const adminToken = jwt.sign(
    { id: 'admin-user-id', email: 'admin@logistics.by', role: 'ADMIN' },
    env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  const dispatcherToken = jwt.sign(
    { id: 'dispatcher-user-id', email: 'dispatcher@logistics.by', role: 'DISPATCHER' },
    env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('GET /api/users returns 403 Forbidden for non-admin user', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${dispatcherToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/users returns 200 with paginated users list for admin', async () => {
    const mockUsers = [
      {
        id: 'u-1',
        email: 'user1@logistics.by',
        fullName: 'User One',
        role: 'DISPATCHER',
        phone: '+375291112233',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'u-2',
        email: 'user2@logistics.by',
        fullName: 'User Two',
        role: 'DRIVER',
        phone: '+375293334455',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    vi.spyOn(prisma.user, 'findMany').mockResolvedValue(mockUsers);
    vi.spyOn(prisma.user, 'count').mockResolvedValue(2);

    const res = await request(app)
      .get('/api/users?page=1&limit=10')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.data).toHaveLength(2);
    expect(res.body.data.meta).toEqual({
      total: 2,
      page: 1,
      limit: 10,
      totalPages: 1,
    });
  });

  it('PATCH /api/users/:id/role returns 400 when changing own role', async () => {
    const res = await request(app)
      .patch('/api/users/admin-user-id/role')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'DISPATCHER' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Cannot change your own role');
  });

  it('PATCH /api/users/:id/role updates role successfully for another user', async () => {
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({
      id: 'target-user-id',
      email: 'driver@logistics.by',
      fullName: 'Driver User',
      role: 'DRIVER',
    });

    vi.spyOn(prisma.user, 'update').mockResolvedValue({
      id: 'target-user-id',
      email: 'driver@logistics.by',
      fullName: 'Driver User',
      role: 'DISPATCHER',
      phone: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await request(app)
      .patch('/api/users/target-user-id/role')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'DISPATCHER' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.role).toBe('DISPATCHER');
  });

  it('DELETE /api/users/:id returns 400 when deleting own account', async () => {
    const res = await request(app)
      .delete('/api/users/admin-user-id')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Cannot delete your own account');
  });

  it('DELETE /api/users/:id returns 400 when user has active assignments', async () => {
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({
      id: 'driver-id',
      email: 'driver@logistics.by',
      fullName: 'Driver Busy',
      role: 'DRIVER',
      vehiclesAssigned: [{ id: 'veh-1' }],
      routesDriven: [],
    });

    const res = await request(app)
      .delete('/api/users/driver-id')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Cannot delete user with active assignments');
  });

  it('DELETE /api/users/:id deletes user successfully when no active assignments exist', async () => {
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({
      id: 'free-user-id',
      email: 'free@logistics.by',
      fullName: 'Free User',
      role: 'DRIVER',
      vehiclesAssigned: [],
      routesDriven: [],
    });

    vi.spyOn(prisma.user, 'delete').mockResolvedValue({
      id: 'free-user-id',
    });

    const res = await request(app)
      .delete('/api/users/free-user-id')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(204);
  });
});
