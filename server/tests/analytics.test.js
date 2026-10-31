import { describe, it, expect, vi, afterEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { prisma } from '../src/config/prisma.js';

describe('Analytics Module API', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('GET /api/analytics/summary returns 200 with platform metrics', async () => {
    vi.spyOn(prisma.order, 'count')
      .mockResolvedValueOnce(50)
      .mockResolvedValueOnce(48);

    vi.spyOn(prisma.route, 'aggregate').mockResolvedValueOnce({
      _sum: { totalDistanceKm: 2450.5 },
    });

    vi.spyOn(prisma.vehicle, 'count').mockResolvedValueOnce(14);

    const res = await request(app).get('/api/analytics/summary');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('fuelSavingsPercent', 24);
    expect(res.body.data).toHaveProperty('onTimeDeliveryRate', '96.0');
    expect(res.body.data).toHaveProperty('totalDistanceKm', '2,451');
    expect(res.body.data).toHaveProperty('activeFleetsCount', 14);
  });
});
