/**
 * Analytics Routes
 * Story 6.1: Customer Analytics & Usage Metrics
 */

import { Router, Request, Response } from 'express';
import { analyticsService } from '../../services/analytics/AnalyticsService';
import { authMiddleware } from '../../middleware/authMiddleware';
import { requirePermission } from '../../middleware/rbacMiddleware';
import { Permission } from '../../services/auth/RBACService';

const analyticsRouter = Router();

// All analytics routes require authentication
analyticsRouter.use(authMiddleware);

// Get usage metrics (requires analytics:read permission)
analyticsRouter.get('/metrics', requirePermission(Permission.ANALYTICS_READ), async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const days = parseInt(req.query.days as string) || 30;

    const metrics = await analyticsService.getUsageMetrics(user.organizationId, days);

    res.json({
      success: true,
      data: metrics
    });
  } catch (error: any) {
    console.error('Failed to get usage metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve usage metrics'
    });
  }
});

// Get dossier analytics
analyticsRouter.get('/dossiers', requirePermission(Permission.ANALYTICS_READ), async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const limit = parseInt(req.query.limit as string) || 100;

    const analytics = await analyticsService.getDossierAnalytics(user.organizationId, limit);

    res.json({
      success: true,
      data: analytics
    });
  } catch (error: any) {
    console.error('Failed to get dossier analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve dossier analytics'
    });
  }
});

// Get API usage statistics
analyticsRouter.get('/api-usage', requirePermission(Permission.ANALYTICS_READ), async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const days = parseInt(req.query.days as string) || 7;

    const stats = await analyticsService.getAPIUsageStats(user.organizationId, days);

    res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    console.error('Failed to get API usage stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve API usage statistics'
    });
  }
});

// Export analytics data (requires analytics:export permission)
analyticsRouter.get('/export', requirePermission(Permission.ANALYTICS_EXPORT), async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const days = parseInt(req.query.days as string) || 30;

    const [metrics, dossiers, apiUsage] = await Promise.all([
      analyticsService.getUsageMetrics(user.organizationId, days),
      analyticsService.getDossierAnalytics(user.organizationId, 1000),
      analyticsService.getAPIUsageStats(user.organizationId, days)
    ]);

    const exportData = {
      organization_id: user.organizationId,
      export_date: new Date().toISOString(),
      period_days: days,
      metrics,
      dossiers,
      api_usage: apiUsage
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="analytics-export-${Date.now()}.json"`);
    res.json(exportData);
  } catch (error: any) {
    console.error('Failed to export analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export analytics data'
    });
  }
});

export default analyticsRouter;
