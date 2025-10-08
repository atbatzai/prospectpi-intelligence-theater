/**
 * ProspectPI Intelligence Theater - Request Logger Middleware
 * Story 1.2: REST API Endpoints & Request Handling
 */

import { Request, Response, NextFunction } from 'express';
import winston from 'winston';

export const requestLogger = (logger: winston.Logger) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const startTime = Date.now();
    
    // Log incoming request
    logger.info('Incoming Request', {
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      timestamp: new Date().toISOString()
    });

    // Capture original end function
    const originalEnd = res.end;

    // Override end function to log response
    res.end = function(chunk?: any, encoding?: any): Response {
      const duration = Date.now() - startTime;
      
      logger.info('Request Completed', {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      });

      // Call original end function
      originalEnd.call(this, chunk, encoding);
      return this;
    };

    next();
  };
};