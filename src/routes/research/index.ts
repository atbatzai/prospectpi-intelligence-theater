/**
 * ProspectPI Intelligence Theater - Research Routes
 * Story 1.2: REST API Endpoints & Request Handling
 */

import { Router } from 'express';
import { generateDossierHandler } from './generateDossier';
import { optionalAuth } from '../../middleware/auth';

export const researchRouter = Router();

// POST /api/v1/research/generate-dossier
researchRouter.post('/generate-dossier', optionalAuth, generateDossierHandler);