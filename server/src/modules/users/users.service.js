import { prisma } from '../../config/prisma.js';
import { ApiError } from '../../common/errors/apiError.js';

export class UsersService {
  async getUsers({ page = 1, limit = 10, role, search } = {}) {
    const skip = (page - 1) * limit;
    const where = {};

    if (role) {
      where.role = role;
    }

    if (search && search.trim()) {
      const term = search.trim();
      where.OR = [
        { fullName: { contains: term, mode: 'insensitive' } },
        { email: { contains: term, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          phone: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async updateUserRole(currentUserId, targetUserId, newRole) {
    if (currentUserId === targetUserId) {
      throw ApiError.badRequest('Cannot change your own role');
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      throw ApiError.notFound('User not found');
    }

    return prisma.user.update({
      where: { id: targetUserId },
      data: { role: newRole },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async deleteUser(currentUserId, targetUserId) {
    if (currentUserId === targetUserId) {
      throw ApiError.badRequest('Cannot delete your own account');
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      include: {
        vehiclesAssigned: true,
        routesDriven: {
          where: { status: 'ACTIVE' },
        },
      },
    });

    if (!targetUser) {
      throw ApiError.notFound('User not found');
    }

    if (
      (targetUser.vehiclesAssigned && targetUser.vehiclesAssigned.length > 0) ||
      (targetUser.routesDriven && targetUser.routesDriven.length > 0)
    ) {
      throw ApiError.badRequest('Cannot delete user with active assignments');
    }

    return prisma.user.delete({
      where: { id: targetUserId },
    });
  }
}

export const usersService = new UsersService();
