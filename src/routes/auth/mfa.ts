/**
 * Multi-Factor Authentication Routes
 * Story 5.1: Enterprise Authentication
 */

import { Router, Request, Response } from 'express';
import { mfaService } from '../../services/auth/MFAService';
import { authMiddleware } from '../../middleware/authMiddleware';

const mfaRouter = Router();

// Setup TOTP (requires authentication)
mfaRouter.post('/totp/setup', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    
    const result = await mfaService.setupTOTP(userId);
    
    res.json({
      success: true,
      data: {
        secret: result.secret,
        qrCodeUrl: result.qrCodeUrl,
        backupCodes: result.backupCodes
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Verify and enable TOTP
mfaRouter.post('/totp/verify', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { token } = req.body;
    
    if (!token) {
      res.status(400).json({
        success: false,
        error: 'TOTP token is required'
      });
      return;
    }
    
    const isValid = await mfaService.verifyAndEnableTOTP(userId, token);
    
    if (!isValid) {
      res.status(400).json({
        success: false,
        error: 'Invalid TOTP token'
      });
      return;
    }
    
    res.json({
      success: true,
      message: 'MFA enabled successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Check MFA status
mfaRouter.get('/status', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const enabled = await mfaService.isMFAEnabled(userId);
    
    res.json({
      success: true,
      data: {
        enabled,
        methods: enabled ? ['totp'] : []
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Disable MFA
mfaRouter.post('/disable', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { token } = req.body;
    
    // Verify TOTP before disabling
    const isValid = await mfaService.verifyTOTP(userId, token);
    
    if (!isValid) {
      res.status(400).json({
        success: false,
        error: 'Invalid TOTP token'
      });
      return;
    }
    
    await mfaService.disableMFA(userId);
    
    res.json({
      success: true,
      message: 'MFA disabled successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export { mfaRouter };
