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

  const admin = await prisma.user.create({
    data: {
      email: 'admin@logistics.by',
      passwordHash,
      fullName: 'Alexander Mikhalkov',
      role: Role.ADMIN,
      phone: '+375291000001',
    },
  });

  const dispatcher = await prisma.user.create({
    data: {
      email: 'dispatcher@logistics.by',
      passwordHash,
      fullName: 'Elena Smirnova',
      role: Role.DISPATCHER,
      phone: '+375292000002',
    },
  });

  const driver1 = await prisma.user.create({
    data: {
      email: 'driver@logistics.by',
      passwordHash,
      fullName: 'Ivan Ivanov',
      role: Role.DRIVER,
      phone: '+375293000003',
    },
  });

  const driver2 = await prisma.user.create({
    data: {
      email: 'driver2@logistics.by',
      passwordHash,
      fullName: 'Dmitry Kovalev',
      role: Role.DRIVER,
      phone: '+375294000004',
    },
  });

  const vehicle1 = await prisma.vehicle.create({
    data: {
      brand: 'Mercedes-Benz Sprinter',
      licensePlate: '1234-AX-7',
      capacityKg: 1500.0,
      volumeM3: 12.0,
      status: VehicleStatus.AVAILABLE,
      currentDriverId: driver1.id,
    },
  });

  const vehicle2 = await prisma.vehicle.create({
    data: {
      brand: 'Ford Transit',
      licensePlate: '5678-BX-7',
      capacityKg: 1200.0,
      volumeM3: 9.5,
      status: VehicleStatus.AVAILABLE,
      currentDriverId: driver2.id,
    },
  });

  const vehicle3 = await prisma.vehicle.create({
    data: {
      brand: 'Volkswagen Crafter',
      licensePlate: '9012-CX-7',
      capacityKg: 2000.0,
      volumeM3: 15.0,
      status: VehicleStatus.AVAILABLE,
      currentDriverId: null,
    },
  });

  const ordersData = [
    {
      customerName: 'TechnoSphera LLC',
      customerPhone: '+375291110011',
      deliveryAddress: 'Minsk, Nezavisimosti Ave 4',
      latitude: 53.8961,
      longitude: 27.5503,
      weightKg: 150.0,
      volumeM3: 1.2,
      status: OrderStatus.PENDING,
    },
    {
      customerName: 'Smirnov Retail',
      customerPhone: '+375292220022',
      deliveryAddress: 'Minsk, Nemiga St 5',
      latitude: 53.9031,
      longitude: 27.5518,
      weightKg: 280.0,
      volumeM3: 1.8,
      status: OrderStatus.PENDING,
    },
    {
      customerName: 'Electronics Store',
      customerPhone: '+375293330033',
      deliveryAddress: 'Minsk, Pritytskogo St 29',
      latitude: 53.9082,
      longitude: 27.4872,
      weightKg: 420.0,
      volumeM3: 2.5,
      status: OrderStatus.PENDING,
    },
    {
      customerName: 'Vostok Logistics Hub',
      customerPhone: '+375294440044',
      deliveryAddress: 'Minsk, Mayakovskogo St 15',
      latitude: 53.8765,
      longitude: 27.5684,
      weightKg: 210.0,
      volumeM3: 1.4,
      status: OrderStatus.PENDING,
    },
    {
      customerName: 'Green Market Central',
      customerPhone: '+375295550055',
      deliveryAddress: 'Minsk, Kozlova St 8',
      latitude: 53.9075,
      longitude: 27.5892,
      weightKg: 310.0,
      volumeM3: 2.0,
      status: OrderStatus.PENDING,
    },
    {
      customerName: 'Prime Cargo Point',
      customerPhone: '+375296660066',
      deliveryAddress: 'Minsk, Dzerzhinskogo Ave 57',
      latitude: 53.8721,
      longitude: 27.4984,
      weightKg: 190.0,
      volumeM3: 1.1,
      status: OrderStatus.PENDING,
    },
  ];

  await prisma.order.createMany({
    data: ordersData,
  });

  console.log('Database seeded successfully:');
  console.log('- Users:');
  console.log(`  * Admin: ${admin.email} / password123 (${admin.fullName})`);
  console.log(`  * Dispatcher: ${dispatcher.email} / password123 (${dispatcher.fullName})`);
  console.log(`  * Driver 1: ${driver1.email} / password123 (${driver1.fullName})`);
  console.log(`  * Driver 2: ${driver2.email} / password123 (${driver2.fullName})`);
  console.log('- Fleet Vehicles:');
  console.log(`  * ${vehicle1.brand} (${vehicle1.licensePlate}) -> Driver: ${driver1.fullName}`);
  console.log(`  * ${vehicle2.brand} (${vehicle2.licensePlate}) -> Driver: ${driver2.fullName}`);
  console.log(`  * ${vehicle3.brand} (${vehicle3.licensePlate}) -> Unassigned`);
  console.log(`- Orders created: ${ordersData.length} pending orders`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
