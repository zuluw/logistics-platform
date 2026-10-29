import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { ApiError } from '../common/errors/apiError.js';

export const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(ApiError.unauthorized('Authentication token is missing or malformed'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(ApiError.unauthorized('Token has expired'));
    }
    if (error.name === 'JsonWebTokenError') {
      return next(ApiError.unauthorized('Invalid authentication token'));
    }
    return next(ApiError.unauthorized('Failed to authenticate token'));
  }
};

export const roleGuard = (...allowedRoles) => {
  const roles = allowedRoles.flat();

  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required'));
    }

    if (roles.length > 0 && !roles.includes(req.user.role)) {
      return next(ApiError.forbidden('Access denied: insufficient permissions'));
    }

    next();
  };
};

export const authenticate = authMiddleware;
