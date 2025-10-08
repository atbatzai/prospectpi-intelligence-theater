/**
 * ProspectPI Intelligence Theater - Rate Limiter Middleware
 * Story 1.2: REST API Endpoints & Request Handling
 */

import { Request, Response, NextFunction } from 'express';
import { RateLimiterMemory } from 'rate-limiter-flexible';

// Configure rate limiters for different endpoints
const researchRateLimiter = new RateLimiterMemory({
  keyPrefix: 'research_limit',
  points: 10, // 10 research requests
  duration: 60, // Per 60 seconds (1 minute)
});

const generalRateLimiter = new RateLimiterMemory({
  keyPrefix: 'general_limit',
  points: 100, // 100 requests
  duration: 60, // Per 60 seconds
});

export const rateLimiter = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
    let limiter = generalRateLimiter;

    // Use stricter rate limiting for research endpoints
    if (req.path.includes('/research/generate-dossier')) {
      limiter = researchRateLimiter;
    }

    await limiter.consume(clientIp);
    next();
  } catch (rejRes: any) {
    const remainingPoints = rejRes?.remainingPoints || 0;
    const msBeforeNext = rejRes?.msBeforeNext || 60000;
    const totalHits = rejRes?.totalHits || 0;

    // Set rate limit headers
    res.set({
      'Retry-After': Math.round(msBeforeNext / 1000) || 1,
      'X-RateLimit-Limit': req.path.includes('/research/generate-dossier') ? '10' : '100',
      'X-RateLimit-Remaining': remainingPoints,
      'X-RateLimit-Reset': new Date(Date.now() + msBeforeNext).toISOString(),
    });

    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please try again later.',
        details: {
          limit: req.path.includes('/research/generate-dossier') ? 10 : 100,
          window: '60 seconds',
          totalRequests: totalHits,
          retryAfter: Math.round(msBeforeNext / 1000)
        }
      }
    });
  }
};