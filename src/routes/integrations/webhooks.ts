/**
 * Webhook Routes
 * Story 7.3: Workflow Automation - Webhooks
 */

import { Router, Request, Response } from 'express';
import { authMiddleware } from '../../middleware/authMiddleware';
import { requirePermission } from '../../middleware/rbacMiddleware';
import { Permission } from '../../services/auth/RBACService';
import { webhookService, WebhookEvent } from '../../services/integrations/WebhookService';

const webhooksRouter = Router();

// Create webhook
webhooksRouter.post('/', authMiddleware, requirePermission(Permission.ADMIN_SETTINGS), async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const { url, events, secret } = req.body;

    if (!url || !events || !Array.isArray(events)) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'URL and events array required'
      });
      return;
    }

    const webhook = await webhookService.createWebhook(
      user.organizationId,
      url,
      events as WebhookEvent[],
      secret
    );

    res.json({
      success: true,
      data: webhook
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to create webhook',
      message: error.message
    });
  }
});

// List webhooks
webhooksRouter.get('/', authMiddleware, requirePermission(Permission.ADMIN_SETTINGS), async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const webhooks = await webhookService.listWebhooks(user.organizationId);

    res.json({
      success: true,
      data: webhooks
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to list webhooks',
      message: error.message
    });
  }
});

// Get webhook deliveries
webhooksRouter.get('/:webhookId/deliveries', authMiddleware, requirePermission(Permission.ADMIN_SETTINGS), async (req: Request, res: Response): Promise<void> => {
  try {
    const { webhookId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;

    const deliveries = await webhookService.getDeliveries(webhookId, limit);

    res.json({
      success: true,
      data: deliveries
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to get deliveries',
      message: error.message
    });
  }
});

// Delete webhook
webhooksRouter.delete('/:webhookId', authMiddleware, requirePermission(Permission.ADMIN_SETTINGS), async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const { webhookId } = req.params;

    await webhookService.deleteWebhook(webhookId, user.organizationId);

    res.json({
      success: true,
      message: 'Webhook deleted successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to delete webhook',
      message: error.message
    });
  }
});

// Test webhook
webhooksRouter.post('/:webhookId/test', authMiddleware, requirePermission(Permission.ADMIN_SETTINGS), async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const { webhookId } = req.params;

    await webhookService.triggerEvent(
      user.organizationId,
      WebhookEvent.DOSSIER_CREATED,
      {
        test: true,
        message: 'This is a test webhook event',
        timestamp: new Date().toISOString()
      }
    );

    res.json({
      success: true,
      message: 'Test webhook triggered'
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to trigger webhook',
      message: error.message
    });
  }
});

export default webhooksRouter;
