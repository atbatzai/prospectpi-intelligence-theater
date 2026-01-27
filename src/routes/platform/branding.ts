/**
 * White-Label Branding Routes
 * Story 7.4: White-Label Platform
 */

import { Router, Request, Response } from 'express';
import { authMiddleware } from '../../middleware/authMiddleware';
import { requirePermission } from '../../middleware/rbacMiddleware';
import { Permission } from '../../services/auth/RBACService';
import { whiteLabelService } from '../../services/platform/WhiteLabelService';

const brandingRouter = Router();

// Get branding configuration
brandingRouter.get('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const branding = await whiteLabelService.getBranding(user.organizationId);

    res.json({
      success: true,
      data: branding
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to get branding',
      message: error.message
    });
  }
});

// Create or update branding
brandingRouter.post('/', authMiddleware, requirePermission(Permission.ADMIN_SETTINGS), async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const { companyName, ...config } = req.body;

    if (!companyName) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Company name required'
      });
      return;
    }

    const existing = await whiteLabelService.getBranding(user.organizationId);

    if (existing) {
      await whiteLabelService.updateBranding(user.organizationId, config);
      const updated = await whiteLabelService.getBranding(user.organizationId);
      res.json({
        success: true,
        data: updated
      });
    } else {
      const branding = await whiteLabelService.createBranding(
        user.organizationId,
        companyName,
        config
      );
      res.json({
        success: true,
        data: branding
      });
    }
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to save branding',
      message: error.message
    });
  }
});

// Get branding by subdomain (public endpoint)
brandingRouter.get('/subdomain/:subdomain', async (req: Request, res: Response): Promise<void> => {
  try {
    const { subdomain } = req.params;
    const branding = await whiteLabelService.getBrandingBySubdomain(subdomain);

    if (!branding) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Subdomain not found'
      });
      return;
    }

    res.json({
      success: true,
      data: branding
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to get branding',
      message: error.message
    });
  }
});

export default brandingRouter;
