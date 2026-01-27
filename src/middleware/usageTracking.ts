/**
 * Usage Tracking Middleware
 * Story 6.1: Customer Analytics & Usage Metrics
 */

import { Request, Response, NextFunction } from 'express';
import { analyticsService } from '../services/analytics/AnalyticsService';

export const trackUsage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const startTime = Date.now();

  // Capture original res.send
  const originalSend = res.send;

  res.send = function(data: any): Response {
    const responseTime = Date.now() - startTime;
    const user = (req as any).user;

    // Track API usage asynchronously (don't block response)
    if (user && user.userId) {
      analyticsService.trackAPICall(
        user.userId,
        req.path,
        req.method,
        responseTime,
        res.statusCode,
        0, // Cost tracking TODO
        user.organizationId
      ).catch(err => {
        console.error('Failed to track API usage:', err);
      });
    }

    return originalSend.call(this, data);
  };

  next();
};

export const trackEvent = (eventType: string, resourceType: string) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const user = (req as any).user;

    if (user && user.userId) {
      analyticsService.trackEvent(
        user.userId,
        eventType,
        resourceType,
        req.params.id,
        { path: req.path, method: req.method },
        user.organizationId
      ).catch(err => {
        console.error('Failed to track event:', err);
      });
    }

    next();
  };
};
