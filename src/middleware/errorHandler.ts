/**
 * ProspectPI Intelligence Theater - Error Handler Middleware
 * Story 1.2: REST API Endpoints & Request Handling
 */

import { Request, Response, NextFunction } from 'express';
import winston from 'winston';

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  statusCode?: number;
}

export class CustomError extends Error {
  public statusCode: number;
  public code: string;
  public details?: any;

  constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR', details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.name = 'CustomError';
  }
}

export const errorHandler = (
  error: Error | CustomError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Log the error
  const logger = winston.createLogger({
    transports: [new winston.transports.Console()]
  });

  logger.error('API Error', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    timestamp: new Date().toISOString()
  });

  // Handle different types of errors
  if (error instanceof CustomError) {
    res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details
      }
    });
    return;
  }

  // JWT Errors
  if (error.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid authentication token'
      }
    });
    return;
  }

  if (error.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      error: {
        code: 'TOKEN_EXPIRED',
        message: 'Authentication token has expired'
      }
    });
    return;
  }

  // Validation Errors (Joi)
  if (error.name === 'ValidationError') {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: (error as any).details
      }
    });
    return;
  }

  // Rate Limiting Errors
  if (error.message.includes('Too many requests')) {
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please try again later.'
      }
    });
    return;
  }

  // Default Internal Server Error
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production' 
        ? 'An internal server error occurred' 
        : error.message
    }
  });
};