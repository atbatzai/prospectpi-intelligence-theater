/**
 * Public API Routes (v1)
 * Story 7.1: Public API
 */

import { Router, Request, Response } from 'express';
import { apiKeyAuth, requireScope } from '../../../middleware/apiKeyAuth';
import { authMiddleware } from '../../../middleware/authMiddleware';
import { apiKeyService } from '../../../services/api/ApiKeyService';
import { requirePermission } from '../../../middleware/rbacMiddleware';
import { Permission } from '../../../services/auth/RBACService';

const publicApiRouter = Router();

// API Key Management (requires user auth)
publicApiRouter.post('/api-keys', authMiddleware, requirePermission(Permission.API_KEY_WRITE), async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const { name, scopes, expiresInDays } = req.body;

    if (!name || !scopes || !Array.isArray(scopes)) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Name and scopes array required'
      });
      return;
    }

    const { apiKey, keyData } = await apiKeyService.createApiKey(
      user.userId,
      user.organizationId,
      name,
      scopes,
      expiresInDays
    );

    res.json({
      success: true,
      apiKey, // Only returned once!
      keyData: {
        ...keyData,
        warning: 'Store this API key securely. It will not be shown again.'
      }
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to create API key',
      message: error.message
    });
  }
});

// List API keys (requires user auth)
publicApiRouter.get('/api-keys', authMiddleware, requirePermission(Permission.API_KEY_READ), async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const keys = await apiKeyService.listApiKeys(user.userId, user.organizationId);

    res.json({
      success: true,
      data: keys
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to list API keys',
      message: error.message
    });
  }
});

// Revoke API key (requires user auth)
publicApiRouter.delete('/api-keys/:keyId', authMiddleware, requirePermission(Permission.API_KEY_WRITE), async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const { keyId } = req.params;

    await apiKeyService.revokeApiKey(keyId, user.userId);

    res.json({
      success: true,
      message: 'API key revoked successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to revoke API key',
      message: error.message
    });
  }
});

// Example public endpoint (uses API key auth)
publicApiRouter.get('/dossiers', apiKeyAuth, requireScope('research:read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const apiKey = (req as any).apiKey;
    
    // TODO: Implement actual dossier listing
    res.json({
      success: true,
      data: [],
      meta: {
        organizationId: apiKey.organizationId,
        scopes: apiKey.scopes
      }
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to list dossiers',
      message: error.message
    });
  }
});

// Create dossier via public API
publicApiRouter.post('/dossiers', apiKeyAuth, requireScope('research:create'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { companyName, websiteUrl } = req.body;

    if (!companyName) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'companyName required'
      });
      return;
    }

    // TODO: Implement dossier creation
    res.json({
      success: true,
      message: 'Dossier creation queued',
      data: {
        requestId: 'mock-request-id',
        status: 'pending'
      }
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to create dossier',
      message: error.message
    });
  }
});

export default publicApiRouter;
