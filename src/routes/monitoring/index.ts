/**
 * Monitoring Routes - Health, Metrics, Alerts
 * Story 5.3: Monitoring Platform
 */

import { Router, Request, Response } from 'express';
import { monitoringService } from '../../services/monitoring/MonitoringService';
import { authMiddleware } from '../../middleware/authMiddleware';
import { requirePermission } from '../../middleware/rbacMiddleware';
import { Permission } from '../../services/auth/RBACService';
import { ApiConnectivityTest } from '../../utils/ApiConnectivityTest';

const monitoringRouter = Router();

// Public health check (no auth required) - ENHANCED with API source status
monitoringRouter.get('/health', async (req: Request, res: Response): Promise<void> => {
  try {
    const health = await monitoringService.checkHealth();
    
    // Add API source connectivity status
    const apiSources = await Promise.all([
      ApiConnectivityTest.testTheirStackConnection().catch(e => ({ service: 'TheirStack', connected: false, responseTime: 0, error: e.message })),
      ApiConnectivityTest.testMarketAuxConnection().catch(e => ({ service: 'MarketAux', connected: false, responseTime: 0, error: e.message })),
      ApiConnectivityTest.testCoresignalConnection().catch(e => ({ service: 'Coresignal MCP', connected: false, responseTime: 0, error: e.message })),
      ApiConnectivityTest.testPerplexityConnection().catch(e => ({ service: 'Perplexity', connected: false, responseTime: 0, error: e.message }))
    ]);
    
    const healthySourcesCount = apiSources.filter(s => s.connected).length;
    const apiSourceStatus = healthySourcesCount >= 3 ? 'operational' : healthySourcesCount >= 2 ? 'degraded' : 'critical';
    
    const enhancedHealth = {
      ...health,
      apiSources: {
        status: apiSourceStatus,
        healthy: healthySourcesCount,
        total: apiSources.length,
        sources: apiSources.map(s => ({
          name: s.service,
          status: s.connected ? 'up' : 'down',
          responseTime: s.responseTime,
          error: s.error
        }))
      }
    };
    
    const statusCode = health.status === 'healthy' && apiSourceStatus !== 'critical' ? 200 : 
                      (health.status === 'degraded' || apiSourceStatus === 'degraded' ? 503 : 500);
    
    res.status(statusCode).json(enhancedHealth);
  } catch (error: any) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// System metrics (requires admin permission)
monitoringRouter.get('/metrics', authMiddleware, requirePermission(Permission.ADMIN_FULL), async (req: Request, res: Response): Promise<void> => {
  try {
    const metrics = monitoringService.getSystemMetrics();
    
    res.json({
      success: true,
      data: metrics
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve system metrics'
    });
  }
});

// Active alerts (requires admin permission)
monitoringRouter.get('/alerts', authMiddleware, requirePermission(Permission.ADMIN_FULL), async (req: Request, res: Response): Promise<void> => {
  try {
    const alerts = await monitoringService.getActiveAlerts();
    
    res.json({
      success: true,
      data: alerts
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve alerts'
    });
  }
});

// Resolve alert (requires admin permission)
monitoringRouter.post('/alerts/:alertId/resolve', authMiddleware, requirePermission(Permission.ADMIN_FULL), async (req: Request, res: Response): Promise<void> => {
  try {
    const { alertId } = req.params;
    
    await monitoringService.resolveAlert(alertId);
    
    res.json({
      success: true,
      message: 'Alert resolved successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to resolve alert'
    });
  }
});

export default monitoringRouter;
