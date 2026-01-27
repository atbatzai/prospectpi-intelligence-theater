/**
 * Plugin Marketplace Routes
 * Story 7.5: Integration Marketplace
 */

import { Router, Request, Response } from 'express';
import { authMiddleware } from '../../middleware/authMiddleware';
import { requirePermission } from '../../middleware/rbacMiddleware';
import { Permission } from '../../services/auth/RBACService';
import { pluginService, PluginCategory } from '../../services/platform/PluginService';

const pluginsRouter = Router();

// List available plugins
pluginsRouter.get('/marketplace', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const category = req.query.category as PluginCategory | undefined;
    const plugins = await pluginService.listPlugins(category);

    res.json({
      success: true,
      data: plugins
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to list plugins',
      message: error.message
    });
  }
});

// Install plugin
pluginsRouter.post('/install', authMiddleware, requirePermission(Permission.ADMIN_SETTINGS), async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const { pluginId, config } = req.body;

    if (!pluginId || !config) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Plugin ID and config required'
      });
      return;
    }

    const installation = await pluginService.installPlugin(
      pluginId,
      user.organizationId,
      config
    );

    res.json({
      success: true,
      data: installation
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to install plugin',
      message: error.message
    });
  }
});

// List installed plugins
pluginsRouter.get('/installed', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const installations = await pluginService.listInstallations(user.organizationId);

    res.json({
      success: true,
      data: installations
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to list installations',
      message: error.message
    });
  }
});

// Uninstall plugin
pluginsRouter.delete('/:installationId', authMiddleware, requirePermission(Permission.ADMIN_SETTINGS), async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const { installationId } = req.params;

    await pluginService.uninstallPlugin(installationId, user.organizationId);

    res.json({
      success: true,
      message: 'Plugin uninstalled successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to uninstall plugin',
      message: error.message
    });
  }
});

export default pluginsRouter;
