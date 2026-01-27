/**
 * API Key Authentication Middleware
 * Story 7.1: Public API
 */

import { Request, Response, NextFunction } from 'express';
import { apiKeyService } from '../services/api/ApiKeyService';

export const apiKeyAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Check for API key in header
    const apiKey = req.headers['x-api-key'] as string;

    if (!apiKey) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'API key required. Provide X-API-Key header.'
      });
      return;
    }

    // Validate API key
    const keyData = await apiKeyService.validateApiKey(apiKey);

    if (!keyData) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired API key'
      });
      return;
    }

    // Attach key data to request
    (req as any).apiKey = keyData;
    (req as any).user = {
      userId: keyData.userId,
      organizationId: keyData.organizationId
    };

    next();
  } catch (error: any) {
    res.status(500).json({
      error: 'Authentication failed',
      message: error.message
    });
  }
};

export const requireScope = (scope: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const apiKey = (req as any).apiKey;

    if (!apiKey || !apiKey.scopes.includes(scope)) {
      res.status(403).json({
        error: 'Forbidden',
        message: `Required scope: ${scope}`,
        providedScopes: apiKey?.scopes || []
      });
      return;
    }

    next();
  };
};
