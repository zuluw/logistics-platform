import { describe, it, expect, vi, afterEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import { prisma } from '../src/config/prisma.js';
import { env } from '../src/config/env.js';

describe('Vehicles Module API', () => {
  const dispatcherToken = jwt.sign(
    { id: '123e4567-e89b-12d3-a456-426614174090', email: 'dispatcher@logistics.by', role: 'DISPATCHER' },
    env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  const driverId = '123e4567-e89b-12d3-a456-426614174091';

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('GET /api/vehicles/drivers returns 200 with list of available drivers', async () => {
    vi.spyOn(prisma.user, 'findMany').mockResolvedValue([
      {
        id: driverId,
        fullName: 'Ivan Driver',
        email: 'driver@logistics.by',
        phone: '+375291234567',
      },
    ]);

    const res = await request(app)
      .get('/api/vehicles/drivers')
      .set('Authorization', `Bearer ${dispatcherToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].id).toBe(driverId);
  });

  it('PATCH /api/vehicles/:id returns 400 when driver is executing an active route with another vehicle', async () => {
    const vehicleId = '123e4567-e89b-12d3-a456-426614174010';
    const activeRouteVehicleId = '123e4567-e89b-12d3-a456-426614174099';

    vi.spyOn(prisma.vehicle, 'findUnique').mockResolvedValue({
      id: vehicleId,
      brand: 'Ford Transit',
      licensePlate: '1111-AX-7',
      capacityKg: 1500,
      volumeM3: 10,
      status: 'AVAILABLE',
      currentDriverId: null,
    });

    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({
      id: driverId,
      fullName: 'Ivan Driver',
      email: 'driver@logistics.by',
      role: 'DRIVER',
    });

    vi.spyOn(prisma.route, 'findFirst').mockResolvedValue({
      id: 'active-route-id',
      driverId,
      vehicleId: activeRouteVehicleId,
      status: 'ACTIVE',
    });

    const res = await request(app)
      .patch(`/api/vehicles/${vehicleId}`)
      .set('Authorization', `Bearer ${dispatcherToken}`)
      .send({ currentDriverId: driverId });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Driver is currently executing an active delivery route');
  });

  it('PATCH /api/vehicles/:id succeeds and unbinds driver from other vehicles when available', async () => {
    const vehicleId = '123e4567-e89b-12d3-a456-426614174010';

    vi.spyOn(prisma.vehicle, 'findUnique').mockResolvedValue({
      id: vehicleId,
      brand: 'Ford Transit',
      licensePlate: '1111-AX-7',
      capacityKg: 1500,
      volumeM3: 10,
      status: 'AVAILABLE',
      currentDriverId: null,
    });

    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({
      id: driverId,
      fullName: 'Ivan Driver',
      email: 'driver@logistics.by',
      role: 'DRIVER',
    });

    vi.spyOn(prisma.route, 'findFirst').mockResolvedValue(null);
    const updateManySpy = vi.spyOn(prisma.vehicle, 'updateMany').mockResolvedValue({ count: 1 });
    vi.spyOn(prisma.vehicle, 'update').mockResolvedValue({
      id: vehicleId,
      brand: 'Ford Transit',
      licensePlate: '1111-AX-7',
      capacityKg: 1500,
      volumeM3: 10,
      status: 'AVAILABLE',
      currentDriverId: driverId,
      currentDriver: {
        id: driverId,
        fullName: 'Ivan Driver',
        email: 'driver@logistics.by',
        phone: '+375291234567',
      },
    });

    const res = await request(app)
      .patch(`/api/vehicles/${vehicleId}`)
      .set('Authorization', `Bearer ${dispatcherToken}`)
      .send({ currentDriverId: driverId });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.currentDriverId).toBe(driverId);
    expect(updateManySpy).toHaveBeenCalledWith({
      where: { currentDriverId: driverId, NOT: { id: vehicleId } },
      data: { currentDriverId: null },
    });
  });
});
