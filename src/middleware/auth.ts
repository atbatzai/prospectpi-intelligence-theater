/**
 * ProspectPI Intelligence Theater - Authentication Middleware
 * Story 1.2: REST API Endpoints & Request Handling
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { CustomError } from './errorHandler';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

export const authenticateJWT = (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    throw new CustomError('Authentication token required', 401, 'MISSING_TOKEN');
  }

  try {
    const jwtSecret = process.env.JWT_SECRET || 'default-secret-key';
    const decoded = jwt.verify(token, jwtSecret) as any;
    
    req.user = {
      id: decoded.userId,
      email: decoded.email
    };
    
    next();
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError') {
      throw new CustomError('Invalid authentication token', 401, 'INVALID_TOKEN');
    }
    if (error.name === 'TokenExpiredError') {
      throw new CustomError('Authentication token expired', 401, 'TOKEN_EXPIRED');
    }
    throw new CustomError('Authentication failed', 401, 'AUTH_FAILED');
  }
};

// Optional auth middleware - for demo purposes, creates a demo user
export const optionalAuth = (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    // No token provided, use demo user
    req.user = {
      id: 'demo-user-id',
      email: 'demo@prospectpi.com'
    };
    next();
    return;
  }

  try {
    const jwtSecret = process.env.JWT_SECRET || 'default-secret-key';
    const decoded = jwt.verify(token, jwtSecret) as any;
    
    req.user = {
      id: decoded.userId,
      email: decoded.email
    };
    
    next();
  } catch (error: any) {
    // Invalid token, fallback to demo user
    req.user = {
      id: 'demo-user-id',
      email: 'demo@prospectpi.com'
    };
    next();
  }
};