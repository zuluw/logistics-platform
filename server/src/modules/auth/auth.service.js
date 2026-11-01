import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/prisma.js';
import { env } from '../../config/env.js';
import { ApiError } from '../../common/errors/apiError.js';

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    env.JWT_SECRET,
    {
      expiresIn: env.JWT_EXPIRES_IN,
    }
  );
};

export class AuthService {
  async register({ email, password, fullName, role, phone }) {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw ApiError.badRequest('User with this email already exists');
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName,
        role,
        phone: phone || null,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
        vehiclesAssigned: {
          select: {
            id: true,
            brand: true,
            licensePlate: true,
            status: true,
          },
        },
      },
    });

    const token = generateToken(user);

    return { user, token };
  }

  async login({ email, password }) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        vehiclesAssigned: {
          select: {
            id: true,
            brand: true,
            licensePlate: true,
            status: true,
          },
        },
      },
    });

    if (!user) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    const { passwordHash: _, ...safeUser } = user;
    const token = generateToken(safeUser);

    return { user: safeUser, token };
  }

  async getMe(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
        vehiclesAssigned: {
          select: {
            id: true,
            brand: true,
            licensePlate: true,
            status: true,
          },
        },
      },
    });

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    return user;
  }

  async updateProfile(userId, { fullName, phone }) {
    const data = {};
    if (fullName !== undefined) {
      data.fullName = fullName.trim();
    }
    if (phone !== undefined) {
      data.phone = phone ? phone.trim() : null;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
        vehiclesAssigned: {
          select: {
            id: true,
            brand: true,
            licensePlate: true,
            status: true,
          },
        },
      },
    });

    return updatedUser;
  }

  async changePassword(userId, { currentPassword, newPassword }) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    const isCurrentValid = await bcrypt.compare(currentPassword, user.passwordHash);

    if (!isCurrentValid) {
      throw ApiError.badRequest('Invalid current password');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    return { message: 'Password updated successfully' };
  }

  async getUserStats(userId, role) {
    if (role === 'DRIVER') {
      const [deliveredOrdersCount, completedRoutesCount, totalRoutesCount, distanceAgg] =
        await Promise.all([
          prisma.routePoint.count({
            where: {
              route: { driverId: userId },
              order: { status: 'DELIVERED' },
            },
          }),
          prisma.route.count({
            where: {
              driverId: userId,
              status: 'COMPLETED',
            },
          }),
          prisma.route.count({
            where: {
              driverId: userId,
            },
          }),
          prisma.route.aggregate({
            where: { driverId: userId },
            _sum: { totalDistanceKm: true },
          }),
        ]);

      const rawKm = distanceAgg._sum.totalDistanceKm || 0;
      const totalDistanceKm = Math.round(rawKm * 10) / 10;

      return {
        role: 'DRIVER',
        deliveredOrdersCount,
        completedRoutesCount,
        totalRoutesCount,
        totalDistanceKm,
      };
    }

    const [totalRoutesCount, completedRoutesCount, totalOrdersDistributed, distanceAgg] =
      await Promise.all([
        prisma.route.count({
          where: { dispatcherId: userId },
        }),
        prisma.route.count({
          where: {
            dispatcherId: userId,
            status: 'COMPLETED',
          },
        }),
        prisma.routePoint.count({
          where: {
            route: { dispatcherId: userId },
          },
        }),
        prisma.route.aggregate({
          where: { dispatcherId: userId },
          _sum: { totalDistanceKm: true },
        }),
      ]);

    const rawKm = distanceAgg._sum.totalDistanceKm || 0;
    const totalDistanceKm = Math.round(rawKm * 10) / 10;

    return {
      role: 'DISPATCHER',
      totalRoutesCount,
      completedRoutesCount,
      totalOrdersDistributed,
      totalDistanceKm,
    };
  }
}

export const authService = new AuthService();
