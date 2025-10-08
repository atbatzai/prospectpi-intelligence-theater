/**
 * ProspectPI Intelligence Theater - Generate Dossier Endpoint
 * Story 1.2: REST API Endpoints & Request Handling
 * Enhanced for Story 1.3: WebSocket Real-Time Progress System
 */

import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { v4 as uuidv4 } from 'uuid';
import Joi from 'joi';
import { ResearchApiResponse } from '@interfaces/AgentTypes';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

// Validation schema for ProspectResearchInput
const researchInputSchema = Joi.object({
  companyName: Joi.string().required().max(200).trim(),
  companyUrl: Joi.string().uri().optional(),
  linkedinUrl: Joi.string().uri().pattern(/linkedin\.com\/company\//).optional(),
  crmNotes: Joi.string().max(1000).optional(),
  organizationFocus: Joi.string().max(100).optional(),
  locationOfInterest: Joi.string().max(100).optional(),
  contextLinks: Joi.array().items(Joi.string().uri()).max(5).optional(),
  additionalContext: Joi.string().max(2000).optional()
});

export const generateDossierHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  // Validate request body
  const { error } = researchInputSchema.validate(req.body);
  if (error) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      }
    } as ResearchApiResponse);
    return;
  }

  const requestId = `req_${uuidv4().replace(/-/g, '').substring(0, 12)}`;

  try {
    // TODO: Integrate with database and agent orchestration
    // For now, return immediate response for WebSocket integration testing
    // Input validation passed: value contains the validated ProspectResearchInput
    
    // Return response with WebSocket URL matching Story 1.3 specifications
    const response: ResearchApiResponse = {
      success: true,
      requestId,
      status: 'processing',
      estimatedCompletion: 480, // 8 minutes
      websocketUrl: `ws://${req.get('host')}/ws/research/${requestId}`, // Updated URL format
      message: 'Research request accepted. Connect to WebSocket for real-time updates.'
    };

    res.status(202).json(response);

  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'PROCESSING_ERROR',
        message: 'Failed to process research request',
        details: error.message
      }
    } as ResearchApiResponse);
  }
});