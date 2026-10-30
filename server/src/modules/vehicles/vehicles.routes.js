import { Router } from 'express';
import { vehiclesController } from './vehicles.controller.js';
import { createVehicleSchema, updateVehicleSchema, queryVehicleSchema } from './vehicles.dto.js';
import { validate, validateQuery } from '../../middlewares/validate.middleware.js';
import { authMiddleware, roleGuard } from '../../middlewares/auth.middleware.js';

const router = Router();

router.use(authMiddleware);

router.get(
  '/',
  roleGuard('DISPATCHER', 'ADMIN', 'DRIVER'),
  validateQuery(queryVehicleSchema),
  vehiclesController.getVehicles,
);

router.get('/:id', roleGuard('DISPATCHER', 'ADMIN', 'DRIVER'), vehiclesController.getVehicleById);

router.post(
  '/',
  roleGuard('DISPATCHER', 'ADMIN'),
  validate(createVehicleSchema),
  vehiclesController.createVehicle,
);

router.patch(
  '/:id',
  roleGuard('DISPATCHER', 'ADMIN'),
  validate(updateVehicleSchema),
  vehiclesController.updateVehicle,
);

router.delete('/:id', roleGuard('ADMIN'), vehiclesController.deleteVehicle);

export default router;
