/**
 * Reporting Routes
 * Story 6.3: Business Intelligence Reports
 */

import { Router, Request, Response } from 'express';
import { authMiddleware } from '../../middleware/authMiddleware';
import { requirePermission } from '../../middleware/rbacMiddleware';
import { Permission } from '../../services/auth/RBACService';
import { reportingService, ReportType, ReportFormat } from '../../services/analytics/ReportingService';

const reportsRouter = Router();

// Create report template
reportsRouter.post('/templates', authMiddleware, requirePermission(Permission.ANALYTICS_WRITE), async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const { name, type, config, schedule } = req.body;

    if (!name || !type) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Name and type required'
      });
      return;
    }

    const template = await reportingService.createTemplate(
      name,
      type as ReportType,
      user.organizationId,
      config || {},
      schedule
    );

    res.json({
      success: true,
      data: template
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to create report template',
      message: error.message
    });
  }
});

// List report templates
reportsRouter.get('/templates', authMiddleware, requirePermission(Permission.ANALYTICS_READ), async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const templates = await reportingService.listTemplates(user.organizationId);

    res.json({
      success: true,
      data: templates
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to list templates',
      message: error.message
    });
  }
});

// Generate report
reportsRouter.post('/generate/:templateId', authMiddleware, requirePermission(Permission.ANALYTICS_READ), async (req: Request, res: Response): Promise<void> => {
  try {
    const { templateId } = req.params;
    const { format } = req.body;

    const report = await reportingService.generateReport(
      templateId,
      format || ReportFormat.JSON
    );

    res.json({
      success: true,
      data: report
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to generate report',
      message: error.message
    });
  }
});

export default reportsRouter;
