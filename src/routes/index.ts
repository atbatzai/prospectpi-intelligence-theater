/**
 * ProspectPI Intelligence Theater - API Routes
 * Story 1.2: REST API Endpoints & Request Handling
 * Epic 2.5.3: Enhanced with Performance Monitoring & Cost Tracking
 */

import { Router } from 'express';
import { researchRouter } from './research';
import { authRouter } from './auth';
import { monitoringRouter } from './monitoring';

export const apiRouter = Router();

// Research endpoints
apiRouter.use('/research', researchRouter);

// Authentication endpoints
apiRouter.use('/auth', authRouter);

// Epic 2.5.3: Monitoring & Cost Tracking endpoints
apiRouter.use('/monitoring', monitoringRouter);

// Additional route groups can be added here
// apiRouter.use('/user', userRouter);