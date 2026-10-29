import { PrismaClient, Role, VehicleStatus, OrderStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  await prisma.routePoint.deleteMany();
  await prisma.route.deleteMany();
  await prisma.order.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('password123', 12);

  const dispatcher = await prisma.user.create({
    data: {
      email: 'dispatcher@logistics.by',
      passwordHash,
      fullName: 'Alexander Mikhalkov (Dispatcher)',
      role: Role.DISPATCHER,
      phone: '+375291112233',
    },
  });

  const driver = await prisma.user.create({
    data: {
      email: 'driver@logistics.by',
      passwordHash,
      fullName: 'Ivan Ivanov (Driver)',
      role: Role.DRIVER,
      phone: '+375294445566',
    },
  });

  const vehicle = await prisma.vehicle.create({
    data: {
      brand: 'Mercedes-Benz Sprinter',
      licensePlate: '1234-AX-7',
      capacityKg: 1500.0,
      volumeM3: 12.0,
      status: VehicleStatus.AVAILABLE,
      currentDriverId: driver.id,
    },
  });

  const ordersData = [
    {
      customerName: 'TechnoSphere LLC',
      customerPhone: '+375293330011',
      deliveryAddress: '4 Independence Ave, Minsk',
      latitude: 53.8961,
      longitude: 27.5503,
      weightKg: 120.0,
      volumeM3: 0.8,
      status: OrderStatus.PENDING,
    },
    {
      customerName: 'Smirnov Sole Proprietorship',
      customerPhone: '+375295550022',
      deliveryAddress: '5 Nemiga St, Minsk',
      latitude: 53.9031,
      longitude: 27.5518,
      weightKg: 250.0,
      volumeM3: 1.5,
      status: OrderStatus.PENDING,
    },
    {
      customerName: 'Electronics Store',
      customerPhone: '+375297770033',
      deliveryAddress: '29 Pritytskogo St, Minsk',
      latitude: 53.9082,
      longitude: 27.4872,
      weightKg: 400.0,
      volumeM3: 2.2,
      status: OrderStatus.PENDING,
    },
    {
      customerName: 'Vostok Warehouse',
      customerPhone: '+375299990044',
      deliveryAddress: '15 Mayakovskogo St, Minsk',
      latitude: 53.8765,
      longitude: 27.5684,
      weightKg: 180.0,
      volumeM3: 1.0,
      status: OrderStatus.PENDING,
    },
  ];

  for (const o of ordersData) {
    await prisma.order.create({ data: o });
  }

  console.log('Database seeded successfully:');
  console.log(`- Dispatcher: dispatcher@logistics.by / password123`);
  console.log(`- Driver: driver@logistics.by / password123`);
  console.log(`- Vehicle: ${vehicle.brand} (${vehicle.licensePlate})`);
  console.log(`- Orders created: ${ordersData.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
