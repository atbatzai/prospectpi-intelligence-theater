/**
 * CRM Integration Routes
 * Story 7.2: CRM Integrations
 */

import { Router, Request, Response } from 'express';
import { authMiddleware } from '../../middleware/authMiddleware';
import { requirePermission } from '../../middleware/rbacMiddleware';
import { Permission } from '../../services/auth/RBACService';
import { crmService, CRMProvider } from '../../services/integrations/CRMService';

const crmRouter = Router();

// OAuth callback for CRM providers
crmRouter.post('/connect/:provider', authMiddleware, requirePermission(Permission.ADMIN_SETTINGS), async (req: Request, res: Response): Promise<void> => {
  try {
    const { provider } = req.params;
    const { accessToken, refreshToken, instanceUrl, expiresIn } = req.body;
    const user = (req as any).user;

    if (!Object.values(CRMProvider).includes(provider as CRMProvider)) {
      res.status(400).json({
        error: 'Invalid provider',
        message: `Supported providers: ${Object.values(CRMProvider).join(', ')}`
      });
      return;
    }

    const connection = await crmService.createConnection(
      user.organizationId,
      provider as CRMProvider,
      accessToken,
      refreshToken,
      instanceUrl,
      expiresIn
    );

    res.json({
      success: true,
      data: connection
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to connect CRM',
      message: error.message
    });
  }
});

// Get CRM connection status
crmRouter.get('/status/:provider', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { provider } = req.params;
    const user = (req as any).user;

    const connection = await crmService.getConnection(user.organizationId, provider as CRMProvider);

    res.json({
      success: true,
      connected: !!connection,
      data: connection ? {
        provider: connection.provider,
        enabled: connection.enabled,
        createdAt: connection.createdAt
      } : null
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to get CRM status',
      message: error.message
    });
  }
});

// Sync dossier to CRM
crmRouter.post('/sync/:provider/:dossierId', authMiddleware, requirePermission(Permission.RESEARCH_CREATE), async (req: Request, res: Response): Promise<void> => {
  try {
    const { provider, dossierId } = req.params;
    const user = (req as any).user;

    const connection = await crmService.getConnection(user.organizationId, provider as CRMProvider);

    if (!connection) {
      res.status(404).json({
        error: 'CRM not connected',
        message: `Please connect ${provider} first`
      });
      return;
    }

    // TODO: Fetch actual dossier from database
    const mockDossier = {
      id: dossierId,
      company_name: 'Example Corp',
      website_url: 'https://example.com',
      sections: {}
    };

    const result = await crmService.syncDossierToCRM(
      connection.id,
      provider as CRMProvider,
      mockDossier
    );

    if (result.success) {
      res.json({
        success: true,
        message: `Dossier synced to ${provider}`,
        crmId: result.crmId
      });
    } else {
      res.status(500).json({
        error: 'Sync failed',
        message: result.error
      });
    }
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to sync to CRM',
      message: error.message
    });
  }
});

// Get sync history
crmRouter.get('/history/:provider', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { provider } = req.params;
    const user = (req as any).user;

    const connection = await crmService.getConnection(user.organizationId, provider as CRMProvider);

    if (!connection) {
      res.json({ success: true, data: [] });
      return;
    }

    const history = await crmService.getSyncHistory(connection.id);

    res.json({
      success: true,
      data: history
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to get sync history',
      message: error.message
    });
  }
});

export default crmRouter;
