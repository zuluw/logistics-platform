import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { ApiError } from '../common/errors/apiError.js';
import { env } from '../config/env.js';

export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let errors = err.errors || [];

  if (err instanceof ZodError) {
    statusCode = 400;
    message = 'Input validation failed';
    errors = err.issues.map((i) => ({ field: i.path.join('.'), message: i.message }));
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
    statusCode = 409;
    message = 'A record with these unique values already exists';
  }

  return res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    errors: errors.length > 0 ? errors : undefined,
    stack: env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};