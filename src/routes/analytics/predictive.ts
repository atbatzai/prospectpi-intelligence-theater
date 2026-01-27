/**
 * Predictive Analytics Routes
 * Story 6.4: Predictive Analytics Engine
 */

import { Router, Request, Response } from 'express';
import { authMiddleware } from '../../middleware/authMiddleware';
import { requirePermission } from '../../middleware/rbacMiddleware';
import { Permission } from '../../services/auth/RBACService';
import { predictiveService } from '../../services/analytics/PredictiveService';

const predictiveRouter = Router();

// Cost prediction
predictiveRouter.get('/cost-forecast', authMiddleware, requirePermission(Permission.ANALYTICS_READ), async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const daysAhead = parseInt(req.query.days as string) || 30;

    const prediction = await predictiveService.predictCost(user.organizationId, daysAhead);

    res.json({
      success: true,
      data: prediction
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to predict cost',
      message: error.message
    });
  }
});

// Usage forecast
predictiveRouter.get('/usage-forecast', authMiddleware, requirePermission(Permission.ANALYTICS_READ), async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const daysAhead = parseInt(req.query.days as string) || 30;

    const forecast = await predictiveService.forecastUsage(user.organizationId, daysAhead);

    res.json({
      success: true,
      data: forecast
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to forecast usage',
      message: error.message
    });
  }
});

// Anomaly detection
predictiveRouter.get('/anomalies', authMiddleware, requirePermission(Permission.ANALYTICS_READ), async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const days = parseInt(req.query.days as string) || 7;

    const anomalies = await predictiveService.detectAnomalies(user.organizationId, days);

    res.json({
      success: true,
      data: anomalies
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to detect anomalies',
      message: error.message
    });
  }
});

// Research patterns
predictiveRouter.get('/patterns', authMiddleware, requirePermission(Permission.ANALYTICS_READ), async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const patterns = await predictiveService.getResearchPatterns(user.organizationId);

    res.json({
      success: true,
      data: patterns
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to get research patterns',
      message: error.message
    });
  }
});

export default predictiveRouter;
