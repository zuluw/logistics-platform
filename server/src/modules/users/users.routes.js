import { Router } from 'express';
import { usersController } from './users.controller.js';
import { queryUsersSchema, updateUserRoleSchema } from './users.dto.js';
import { validate, validateQuery } from '../../middlewares/validate.middleware.js';
import { authMiddleware, roleGuard } from '../../middlewares/auth.middleware.js';

const router = Router();

router.use(authMiddleware);
router.use(roleGuard('ADMIN'));

router.get('/', validateQuery(queryUsersSchema), usersController.getUsers);
router.patch('/:id/role', validate(updateUserRoleSchema), usersController.updateUserRole);
router.delete('/:id', usersController.deleteUser);

export default router;
