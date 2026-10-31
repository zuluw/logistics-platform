import { describe, it, expect, vi, afterEach } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import app from '../src/app.js';
import { prisma } from '../src/config/prisma.js';

describe('Auth Module API', () => {
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
});
