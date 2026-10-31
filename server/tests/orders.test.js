import { describe, it, expect, vi, afterEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import { prisma } from '../src/config/prisma.js';
import { env } from '../src/config/env.js';

describe('Orders Module API', () => {
  const dispatcherToken = jwt.sign(
    { id: 'mock-dispatcher-id', email: 'dispatcher@logistics.by', role: 'DISPATCHER' },
    env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('GET /api/orders returns 401 Unauthorized without token', async () => {
    const res = await request(app).get('/api/orders');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/orders returns 200 and paginated orders array with dispatcher token', async () => {
    const mockOrders = [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        customerName: 'TechnoSphere LLC',
        customerPhone: '+375293330011',
        deliveryAddress: '4 Independence Ave, Minsk',
        latitude: 53.8961,
        longitude: 27.5503,
        weightKg: 120,
        volumeM3: 0.8,
        status: 'PENDING',
        createdAt: new Date(),
      },
    ];

    vi.spyOn(prisma.order, 'findMany').mockResolvedValue(mockOrders);
    vi.spyOn(prisma.order, 'count').mockResolvedValue(1);

    const res = await request(app)
      .get('/api/orders')
      .set('Authorization', `Bearer ${dispatcherToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.data).toHaveLength(1);
    expect(res.body.data.meta).toBeDefined();
    expect(res.body.data.meta.total).toBe(1);
  });

  it('POST /api/orders returns 400 Bad Request when weightKg is negative', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${dispatcherToken}`)
      .send({
        customerName: 'TechnoSphere LLC',
        customerPhone: '+375293330011',
        deliveryAddress: '4 Independence Ave, Minsk',
        latitude: 53.8961,
        longitude: 27.5503,
        weightKg: -5,
        volumeM3: 1.0,
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors).toBeDefined();
  });

  it('POST /api/orders returns 201 Created with valid payload', async () => {
    const newOrderData = {
      customerName: 'Smirnov Sole Proprietorship',
      customerPhone: '+375295550022',
      deliveryAddress: '5 Nemiga St, Minsk',
      latitude: 53.9031,
      longitude: 27.5518,
      weightKg: 250,
      volumeM3: 1.5,
    };

    vi.spyOn(prisma.order, 'create').mockResolvedValue({
      id: '123e4567-e89b-12d3-a456-426614174001',
      ...newOrderData,
      status: 'PENDING',
      createdAt: new Date(),
    });

    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${dispatcherToken}`)
      .send(newOrderData);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBeDefined();
    expect(res.body.data.status).toBe('PENDING');
  });
});
