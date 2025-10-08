/**
 * ProspectPI Intelligence Theater - Generate Dossier Endpoint
 * Story 1.2: REST API Endpoints & Request Handling
 */

import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { v4 as uuidv4 } from 'uuid';
import Joi from 'joi';
import { ProspectResearchInput, ResearchApiResponse } from '@interfaces/AgentTypes';
import { DatabaseManager } from '../../database/DatabaseManager';


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
  try {
    console.log('=== Starting generateDossierHandler ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    // Validate request body
    const { error, value } = researchInputSchema.validate(req.body);
    if (error) {
      console.log('Validation error:', error);
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
    
    console.log('Validation passed');

  const input: ProspectResearchInput = value;
  const requestId = `req_${uuidv4().replace(/-/g, '').substring(0, 12)}`;
  
  // Extract user from authentication middleware
  const userId = req.user?.id || 'demo-user-id';

  try {
    // Save research request to database
    const db = DatabaseManager.getInstance();
    await db.run(`
      INSERT INTO research_requests (
        id, request_id, user_id, company_name, company_url, linkedin_url,
        crm_notes, organization_focus, location_of_interest, context_links,
        additional_context, status, estimated_completion
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      uuidv4(),
      requestId,
      userId,
      input.companyName,
      input.companyUrl || null,
      input.linkedinUrl || null,
      input.crmNotes || null,
      input.organizationFocus || null,
      input.locationOfInterest || null,
      input.contextLinks ? JSON.stringify(input.contextLinks) : null,
      input.additionalContext || null,
      'processing',
      480 // 8 minutes estimated completion
    ]);

    // Note: ResearchApiPayload will be used for future WebSocket integration
    // Currently using converted format for existing agent system

    // Start agent orchestration in background
    // TODO: Integrate with WebSocket progress system
    console.log(`Research request ${requestId} received for ${input.companyName}`);

    // TODO: Convert to existing OptimizedUserInput format for agent system when ready

    // TODO: Execute intelligence mission asynchronously when orchestrator is ready
    // This will be implemented after WebSocket integration is complete
    console.log(`Research request queued: ${requestId}`);

    // Return immediate response with WebSocket URL for progress tracking
    const response: ResearchApiResponse = {
      success: true,
      requestId,
      status: 'processing',
      estimatedCompletion: 480, // seconds
      websocketUrl: `ws://${req.get('host')}/ws?requestId=${requestId}`,
      message: 'Research request accepted. Connect to WebSocket for real-time updates.'
    };

    res.status(202).json(response);

  } catch (error: any) {
    console.error('Failed to process research request:', error);
    console.error('Error stack:', error.stack);
    
    res.status(500).json({
      success: false,
      error: {
        code: 'PROCESSING_ERROR',
        message: 'Failed to process research request',
        details: error.message
      }
    } as ResearchApiResponse);
  }
  
  } catch (outerError: any) {
    console.error('=== OUTER CATCH: Unexpected error in generateDossierHandler ===');
    console.error('Error:', outerError);
    console.error('Stack:', outerError.stack);
    
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: {
          code: 'HANDLER_ERROR',
          message: 'Unexpected error in request handler',
          details: outerError.message
        }
      } as ResearchApiResponse);
    }
  }
});