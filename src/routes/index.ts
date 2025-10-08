/**
 * ProspectPI Intelligence Theater - API Routes
 * Story 1.2: REST API Endpoints & Request Handling
 */

import { Router } from 'express';
import { researchRouter } from './research';
import { authRouter } from './auth';

export const apiRouter = Router();

// Research endpoints
apiRouter.use('/research', researchRouter);

// Authentication endpoints
apiRouter.use('/auth', authRouter);

// Additional route groups can be added here
// apiRouter.use('/user', userRouter);