/**
 * Auth Middleware for Protected Routes
 * Story 5.1: Enterprise Authentication
 */

import { Request, Response, NextFunction } from 'express';
import { UserService } from '../models/User';

const userService = new UserService();

export const authMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized - No token provided' });
      return;
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Use validateJWT instead of verifyJWT
    const userData = await userService.validateJWT(token);
    
    if (!userData) {
      res.status(401).json({ error: 'Unauthorized - Invalid token' });
      return;
    }
    
    // Attach user to request
    (req as any).user = userData;
    next();
  } catch (error: any) {
    res.status(401).json({ error: 'Unauthorized - Invalid token' });
  }
};
