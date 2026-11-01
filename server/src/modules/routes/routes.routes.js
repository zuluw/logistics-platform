import { Router } from 'express';
import { routesController } from './routes.controller.js';
import {
  calculateRouteSchema,
  createRouteSchema,
  updatePointStatusSchema,
  queryRouteSchema,
  reassignRouteVehicleSchema,
} from './routes.dto.js';
import { validate, validateQuery } from '../../middlewares/validate.middleware.js';
import { authMiddleware, roleGuard } from '../../middlewares/auth.middleware.js';

const router = Router();

router.use(authMiddleware);

router.post('/calculate', roleGuard('DISPATCHER', 'ADMIN'), validate(calculateRouteSchema), routesController.calculateRoute);

router.post('/', roleGuard('DISPATCHER', 'ADMIN'), validate(createRouteSchema), routesController.createRoute);

router.get('/', roleGuard('DISPATCHER', 'ADMIN'), validateQuery(queryRouteSchema), routesController.getRoutes);

router.get('/my', roleGuard('DRIVER'), routesController.getMyRoute);

router.patch('/:id/points/:pointId', roleGuard('DRIVER', 'DISPATCHER'), validate(updatePointStatusSchema), routesController.updatePointStatus);

router.patch('/:id/vehicle', roleGuard('DISPATCHER', 'ADMIN'), validate(reassignRouteVehicleSchema), routesController.reassignRouteVehicle);

export default router;
