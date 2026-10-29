import { prisma } from '../../config/prisma.js';
import { ApiError } from '../../common/errors/apiError.js';

export class OrdersService {
  async getOrders({ page, limit, status, search, sortBy, order }) {
    const skip = (page - 1) * limit;

    const where = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { customerName: { contains: search, mode: 'insensitive' } },
        { deliveryAddress: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: order },
      }),
      prisma.order.count({ where }),
    ]);

    return {
      data: orders,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getOrderById(id) {
    const order = await prisma.order.findUnique({
      where: { id },
      include: { routePoint: true },
    });

    if (!order) {
      throw ApiError.notFound('Order not found');
    }

    return order;
  }

  async createOrder(data) {
    return prisma.order.create({
      data: {
        ...data,
        status: 'PENDING',
      },
    });
  }

  async updateOrder(id, data) {
    await this.getOrderById(id);

    return prisma.order.update({
      where: { id },
      data,
    });
  }

  async deleteOrder(id) {
    const order = await prisma.order.findUnique({
      where: { id },
      include: { routePoint: true },
    });

    if (!order) {
      throw ApiError.notFound('Order not found');
    }

    if (order.routePoint) {
      throw ApiError.badRequest('Cannot delete an order that is already assigned to a route');
    }

    return prisma.order.delete({ where: { id } });
  }
}

export const ordersService = new OrdersService();
