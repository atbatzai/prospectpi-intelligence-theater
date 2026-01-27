/**
 * RBAC Middleware for Permission-Based Route Protection
 * Story 5.1: Enterprise Authentication - RBAC
 */

import { Request, Response, NextFunction } from 'express';
import { rbacService, Permission, Role } from '../services/auth/RBACService';

/**
 * Middleware to check if user has required permission
 */
export const requirePermission = (permission: Permission) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as any).user;
      
      if (!user || !user.userId) {
        res.status(401).json({ error: 'Unauthorized - Authentication required' });
        return;
      }

      const hasPermission = await rbacService.hasPermission(
        user.userId,
        permission,
        user.organizationId
      );

      if (!hasPermission) {
        res.status(403).json({
          error: 'Forbidden - Insufficient permissions',
          required: permission
        });
        return;
      }

      next();
    } catch (error: any) {
      res.status(500).json({ error: 'Permission check failed' });
    }
  };
};

/**
 * Middleware to check if user has required role
 */
export const requireRole = (role: Role) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as any).user;
      
      if (!user || !user.userId) {
        res.status(401).json({ error: 'Unauthorized - Authentication required' });
        return;
      }

      const hasRole = await rbacService.hasRole(
        user.userId,
        role,
        user.organizationId
      );

      if (!hasRole) {
        res.status(403).json({
          error: 'Forbidden - Insufficient role',
          required: role
        });
        return;
      }

      next();
    } catch (error: any) {
      res.status(500).json({ error: 'Role check failed' });
    }
  };
};

/**
 * Middleware to check if user has ANY of the required permissions
 */
export const requireAnyPermission = (...permissions: Permission[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as any).user;
      
      if (!user || !user.userId) {
        res.status(401).json({ error: 'Unauthorized - Authentication required' });
        return;
      }

      const userPermissions = await rbacService.getUserPermissions(
        user.userId,
        user.organizationId
      );

      const hasAnyPermission = permissions.some(perm => 
        userPermissions.includes(perm) || userPermissions.includes(Permission.ADMIN_FULL)
      );

      if (!hasAnyPermission) {
        res.status(403).json({
          error: 'Forbidden - Insufficient permissions',
          required: permissions
        });
        return;
      }

      next();
    } catch (error: any) {
      res.status(500).json({ error: 'Permission check failed' });
    }
  };
};
