import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { ApiError } from './common/errors/apiError.js';
import { errorHandler } from './middlewares/errorHandler.js';
import authRoutes from './modules/auth/auth.routes.js';
import ordersRoutes from './modules/orders/orders.routes.js';
import vehiclesRoutes from './modules/vehicles/vehicles.routes.js';
import routesRoutes from './modules/routes/routes.routes.js';
import analyticsRoutes from './modules/analytics/analytics.routes.js';
import usersRoutes from './modules/users/users.routes.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(morgan('dev'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/vehicles', vehiclesRoutes);
app.use('/api/routes', routesRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/users', usersRoutes);

app.use((req, res, next) => {
  next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} was not found`));
});

app.use(errorHandler);

export default app;
