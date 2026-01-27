/**
 * Dashboard Routes
 * Story 6.1: Customer Analytics Dashboard
 */

import { Router, Request, Response } from 'express';
import { authMiddleware } from '../../middleware/authMiddleware';
import { requirePermission } from '../../middleware/rbacMiddleware';
import { Permission } from '../../services/auth/RBACService';
import { dashboardService } from '../../services/analytics/DashboardService';

const dashboardRouter = Router();

// Get dashboard metrics
dashboardRouter.get('/metrics', authMiddleware, requirePermission(Permission.ANALYTICS_READ), async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const metrics = await dashboardService.getDashboardMetrics(user.organizationId);

    res.json({
      success: true,
      data: metrics
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to retrieve dashboard metrics',
      message: error.message
    });
  }
});

// Get activity heatmap
dashboardRouter.get('/heatmap', authMiddleware, requirePermission(Permission.ANALYTICS_READ), async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const days = parseInt(req.query.days as string) || 30;
    
    const heatmap = await dashboardService.getActivityHeatmap(user.organizationId, days);

    res.json({
      success: true,
      data: heatmap
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to retrieve activity heatmap',
      message: error.message
    });
  }
});

// Get user activity
dashboardRouter.get('/users', authMiddleware, requirePermission(Permission.ANALYTICS_READ), async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const limit = parseInt(req.query.limit as string) || 10;
    
    const userActivity = await dashboardService.getUserActivity(user.organizationId, limit);

    res.json({
      success: true,
      data: userActivity
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to retrieve user activity',
      message: error.message
    });
  }
});

export default dashboardRouter;
