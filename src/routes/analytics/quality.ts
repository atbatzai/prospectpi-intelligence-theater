/**
 * Quality Metrics Routes
 * Story 6.2: Quality Metrics & SLA Tracking
 */

import { Router, Request, Response } from 'express';
import { authMiddleware } from '../../middleware/authMiddleware';
import { requirePermission } from '../../middleware/rbacMiddleware';
import { Permission } from '../../services/auth/RBACService';
import { qualityMetricsService } from '../../services/analytics/QualityMetricsService';

const qualityRouter = Router();

// Get quality metrics for a specific dossier
qualityRouter.get('/dossiers/:dossierId', authMiddleware, requirePermission(Permission.ANALYTICS_READ), async (req: Request, res: Response): Promise<void> => {
  try {
    const { dossierId } = req.params;
    const metrics = await qualityMetricsService.getQualityMetrics(dossierId);

    if (!metrics) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Quality metrics not found for this dossier'
      });
      return;
    }

    res.json({
      success: true,
      data: metrics
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to retrieve quality metrics',
      message: error.message
    });
  }
});

// Get aggregate quality metrics for organization
qualityRouter.get('/aggregate', authMiddleware, requirePermission(Permission.ANALYTICS_READ), async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const aggregateMetrics = await qualityMetricsService.getAggregateQuality(user.organizationId);

    res.json({
      success: true,
      data: aggregateMetrics
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to retrieve aggregate metrics',
      message: error.message
    });
  }
});

// Calculate quality score for a dossier
qualityRouter.post('/calculate/:dossierId', authMiddleware, requirePermission(Permission.ANALYTICS_WRITE), async (req: Request, res: Response): Promise<void> => {
  try {
    const { dossierId } = req.params;
    const { dossier } = req.body;

    if (!dossier) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Dossier data required'
      });
      return;
    }

    const scores = await qualityMetricsService.calculateQualityScore(dossier);

    res.json({
      success: true,
      data: {
        dossierId,
        scores,
        interpretation: {
          overall: scores.overall >= 0.8 ? 'Excellent' : scores.overall >= 0.6 ? 'Good' : scores.overall >= 0.4 ? 'Fair' : 'Poor',
          grade: scores.overall >= 0.9 ? 'A+' : scores.overall >= 0.8 ? 'A' : scores.overall >= 0.7 ? 'B' : scores.overall >= 0.6 ? 'C' : 'D'
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to calculate quality score',
      message: error.message
    });
  }
});

export default qualityRouter;
