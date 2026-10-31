import { Router } from 'express';
import { analyticsController } from './analytics.controller.js';

const router = Router();

router.get('/summary', (req, res, next) => analyticsController.getSummary(req, res, next));

export default router;
