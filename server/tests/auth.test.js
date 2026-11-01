import { describe, it, expect, vi, afterEach } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import { prisma } from '../src/config/prisma.js';
import { env } from '../src/config/env.js';

describe('Auth Module API', () => {
  const token = jwt.sign(
    { id: 'mock-user-id', email: 'dispatcher@logistics.by', role: 'DISPATCHER' },
    env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('POST /api/auth/login returns 200 and JWT token with valid credentials', async () => {
    const passwordHash = await bcrypt.hash('password123', 10);
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({
      id: 'mock-user-id',
      email: 'dispatcher@logistics.by',
      passwordHash,
      fullName: 'Dispatcher User',
      role: 'DISPATCHER',
      phone: '+375291112233',
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'dispatcher@logistics.by',
        password: 'password123',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe('dispatcher@logistics.by');
  });

  it('POST /api/auth/login returns 401 with invalid password', async () => {
    const passwordHash = await bcrypt.hash('password123', 10);
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({
      id: 'mock-user-id',
      email: 'dispatcher@logistics.by',
      passwordHash,
      fullName: 'Dispatcher User',
      role: 'DISPATCHER',
      phone: '+375291112233',
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'dispatcher@logistics.by',
        password: 'wrongpassword',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/auth/register returns 400 when email format is invalid', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'invalid-email-format',
        password: 'password123',
        fullName: 'Alexander Mikhalkov',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors).toBeDefined();
  });

  it('PATCH /api/auth/profile updates profile and returns 200', async () => {
    vi.spyOn(prisma.user, 'update').mockResolvedValue({
      id: 'mock-user-id',
      email: 'dispatcher@logistics.by',
      fullName: 'Alexander M.',
      role: 'DISPATCHER',
      phone: '+375299998877',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await request(app)
      .patch('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({
        fullName: 'Alexander M.',
        phone: '+375299998877',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.fullName).toBe('Alexander M.');
  });

  it('POST /api/auth/change-password updates password successfully', async () => {
    const passwordHash = await bcrypt.hash('oldPassword123', 10);
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({
      id: 'mock-user-id',
      email: 'dispatcher@logistics.by',
      passwordHash,
    });
    vi.spyOn(prisma.user, 'update').mockResolvedValue({});

    const res = await request(app)
      .post('/api/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({
        currentPassword: 'oldPassword123',
        newPassword: 'newPassword123',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.message).toBe('Password updated successfully');
  });

  it('POST /api/auth/change-password returns 400 for incorrect current password', async () => {
    const passwordHash = await bcrypt.hash('oldPassword123', 10);
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({
      id: 'mock-user-id',
      email: 'dispatcher@logistics.by',
      passwordHash,
    });

    const res = await request(app)
      .post('/api/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({
        currentPassword: 'wrongPassword',
        newPassword: 'newPassword123',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/auth/stats returns user statistics', async () => {
    vi.spyOn(prisma.route, 'count')
      .mockResolvedValueOnce(10)
      .mockResolvedValueOnce(8);
    vi.spyOn(prisma.routePoint, 'count').mockResolvedValueOnce(45);
    vi.spyOn(prisma.route, 'aggregate').mockResolvedValueOnce({
      _sum: { totalDistanceKm: 340.5 },
    });

    const res = await request(app)
      .get('/api/auth/stats')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.role).toBe('DISPATCHER');
    expect(res.body.data.totalRoutesCount).toBe(10);
    expect(res.body.data.totalOrdersDistributed).toBe(45);
    expect(res.body.data.totalDistanceKm).toBe(340.5);
  });
});
