import { describe, it, expect, vi, afterEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import { prisma } from '../src/config/prisma.js';
import { env } from '../src/config/env.js';

describe('Routes Module API', () => {
  const dispatcherToken = jwt.sign(
    { id: '123e4567-e89b-12d3-a456-426614174090', email: 'dispatcher@logistics.by', role: 'DISPATCHER' },
    env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  const driverId = '123e4567-e89b-12d3-a456-426614174091';
  const driverToken = jwt.sign(
    { id: driverId, email: 'driver@logistics.by', role: 'DRIVER' },
    env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('POST /api/routes/calculate returns 400 Bad Request when total cargo weight exceeds vehicle capacity', async () => {
    const vehicleId = '123e4567-e89b-12d3-a456-426614174010';
    const orderId = '123e4567-e89b-12d3-a456-426614174020';

    vi.spyOn(prisma.vehicle, 'findUnique').mockResolvedValue({
      id: vehicleId,
      brand: 'Small Van',
      licensePlate: '5555-AX-7',
      capacityKg: 500,
      volumeM3: 4.0,
      status: 'AVAILABLE',
      currentDriverId: driverId,
    });

    vi.spyOn(prisma.order, 'findMany').mockResolvedValue([
      {
        id: orderId,
        customerName: 'Heavy Cargo Customer',
        customerPhone: '+375299990000',
        deliveryAddress: '1 Heavy Industrial St, Minsk',
        latitude: 53.91,
        longitude: 27.56,
        weightKg: 850,
        volumeM3: 3.0,
        status: 'PENDING',
      },
    ]);

    const res = await request(app)
      .post('/api/routes/calculate')
      .set('Authorization', `Bearer ${dispatcherToken}`)
      .send({
        vehicleId,
        orderIds: [orderId],
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('exceeds vehicle capacity');
  });

  it('GET /api/routes/my returns 200 and active route for authenticated driver', async () => {
    const mockActiveRoute = {
      id: '123e4567-e89b-12d3-a456-426614174030',
      status: 'ACTIVE',
      totalDistanceKm: 24.5,
      totalDurationMin: 45,
      polylineGeometry: '{"type":"LineString","coordinates":[]}',
      vehicleId: '123e4567-e89b-12d3-a456-426614174010',
      driverId,
      dispatcherId: '123e4567-e89b-12d3-a456-426614174090',
      createdAt: new Date(),
      vehicle: {
        id: '123e4567-e89b-12d3-a456-426614174010',
        brand: 'Mercedes-Benz Sprinter',
        licensePlate: '1234-AX-7',
      },
      driver: {
        id: driverId,
        fullName: 'Ivan Ivanov',
        email: 'driver@logistics.by',
        phone: '+375294445566',
      },
      dispatcher: {
        id: '123e4567-e89b-12d3-a456-426614174090',
        fullName: 'Alexander Mikhalkov',
        email: 'dispatcher@logistics.by',
      },
      routePoints: [],
    };

    vi.spyOn(prisma.route, 'findFirst').mockResolvedValue(mockActiveRoute);

    const res = await request(app)
      .get('/api/routes/my')
      .set('Authorization', `Bearer ${driverToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(mockActiveRoute.id);
    expect(res.body.data.status).toBe('ACTIVE');
  });
});
