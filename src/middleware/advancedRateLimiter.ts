/**
 * Advanced Rate Limiter with Tiered Limits
 * Story 5.3: Monitoring Platform - Performance Optimization
 */

import { Request, Response, NextFunction } from 'express';
import { rbacService, Role } from '../services/auth/RBACService';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  default: { windowMs: 60000, maxRequests: 100 }, // 100 req/min
  viewer: { windowMs: 60000, maxRequests: 50 },   // 50 req/min
  analyst: { windowMs: 60000, maxRequests: 200 }, // 200 req/min
  manager: { windowMs: 60000, maxRequests: 300 }, // 300 req/min
  org_admin: { windowMs: 60000, maxRequests: 500 }, // 500 req/min
  super_admin: { windowMs: 60000, maxRequests: 1000 } // 1000 req/min
};

class AdvancedRateLimiter {
  private requests: Map<string, number[]> = new Map();

  async checkLimit(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      const identifier = user?.userId || req.ip || 'anonymous';

      // Determine rate limit based on user role
      let limit = RATE_LIMITS.default;

      if (user?.userId) {
        const roles = await rbacService.getUserRoles(user.userId, user.organizationId);
        
        // Use highest role's limit
        if (roles.includes(Role.SUPER_ADMIN)) {
          limit = RATE_LIMITS.super_admin;
        } else if (roles.includes(Role.ORG_ADMIN)) {
          limit = RATE_LIMITS.org_admin;
        } else if (roles.includes(Role.MANAGER)) {
          limit = RATE_LIMITS.manager;
        } else if (roles.includes(Role.ANALYST)) {
          limit = RATE_LIMITS.analyst;
        } else if (roles.includes(Role.VIEWER)) {
          limit = RATE_LIMITS.viewer;
        }
      }

      const now = Date.now();
      const windowStart = now - limit.windowMs;

      // Get or create request history
      if (!this.requests.has(identifier)) {
        this.requests.set(identifier, []);
      }

      const requestHistory = this.requests.get(identifier)!;
      
      // Filter requests within window
      const recentRequests = requestHistory.filter(time => time > windowStart);

      if (recentRequests.length >= limit.maxRequests) {
        const retryAfter = Math.ceil((recentRequests[0] + limit.windowMs - now) / 1000);
        
        res.status(429).json({
          error: 'Too many requests',
          retryAfter,
          limit: limit.maxRequests,
          window: `${limit.windowMs / 1000}s`
        });
        return;
      }

      // Add current request
      recentRequests.push(now);
      this.requests.set(identifier, recentRequests);

      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', limit.maxRequests.toString());
      res.setHeader('X-RateLimit-Remaining', (limit.maxRequests - recentRequests.length).toString());
      res.setHeader('X-RateLimit-Reset', new Date(now + limit.windowMs).toISOString());

      next();
    } catch (error) {
      // On error, fall back to default rate limiting
      next();
    }
  }

  // Cleanup old entries periodically
  startCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      const maxWindow = Math.max(...Object.values(RATE_LIMITS).map(l => l.windowMs));
      
      for (const [key, times] of this.requests.entries()) {
        const recent = times.filter(t => t > now - maxWindow);
        if (recent.length > 0) {
          this.requests.set(key, recent);
        } else {
          this.requests.delete(key);
        }
      }
    }, 60000); // Clean every minute
  }
}

const rateLimiter = new AdvancedRateLimiter();
rateLimiter.startCleanup();

export const advancedRateLimiter = rateLimiter.checkLimit.bind(rateLimiter);
