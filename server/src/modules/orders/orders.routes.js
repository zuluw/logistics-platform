import { Router } from 'express';
import { ordersController } from './orders.controller.js';
import { createOrderSchema, updateOrderSchema, queryOrderSchema } from './orders.dto.js';
import { validate, validateQuery } from '../../middlewares/validate.middleware.js';
import { authMiddleware, roleGuard } from '../../middlewares/auth.middleware.js';

const router = Router();

router.use(authMiddleware);

router.get(
  '/',
  roleGuard('DISPATCHER', 'ADMIN'),
  validateQuery(queryOrderSchema),
  ordersController.getOrders,
);

router.get('/:id', roleGuard('DISPATCHER', 'ADMIN'), ordersController.getOrderById);

router.post(
  '/',
  roleGuard('DISPATCHER', 'ADMIN'),
  validate(createOrderSchema),
  ordersController.createOrder,
);

router.patch(
  '/:id',
  roleGuard('DISPATCHER', 'ADMIN'),
  validate(updateOrderSchema),
  ordersController.updateOrder,
);

router.delete('/:id', roleGuard('DISPATCHER', 'ADMIN'), ordersController.deleteOrder);

export default router;
