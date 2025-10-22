/**
 * ProspectPI Intelligence Theater - Generate Dossier Endpoint
 * Story 1.2: REST API Endpoints & Request Handling
 * Enhanced for Story 1.3: WebSocket Real-Time Progress System
 * 
 * 🎭 BMad Orchestrator Integration: LIVE DATA CONNECTION
 * - Real TheirStack API integration
 * - Field Intelligence Researcher deployment
 * - Background processing with progress callbacks
 */

import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { v4 as uuidv4 } from 'uuid';
import Joi from 'joi';
import { ResearchApiResponse } from '../../interfaces/AgentTypes';
import { DossierService } from '../../models/Dossier';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

// ENHANCED: Validation schema for Solution-Relevance Research
const researchInputSchema = Joi.object({
  // Company being researched
  companyName: Joi.string().required().max(200).trim(),
  companyUrl: Joi.string().uri().optional(),
  linkedinUrl: Joi.string().uri().pattern(/linkedin\.com\/company\//).optional(),
  linkedinUserUrl: Joi.string().uri().pattern(/linkedin\.com\/in\//).optional(),
  
  // CRITICAL: Solution Context - REQUIRED FIELDS
  vendorName: Joi.string().required().max(100).trim()
    .messages({'any.required': 'Vendor name is required (e.g. IBM, Microsoft, Dell, Adobe)'}),
  productName: Joi.string().required().max(100).trim()
    .messages({'any.required': 'Product name is required (e.g. Apptio, Office365, PowerEdge)'}),
  productCategory: Joi.string().max(100).optional(),
  
  // CRITICAL: Industry & Pain Point Context - REQUIRED FIELDS  
  industry: Joi.string().required().max(100).trim()
    .messages({'any.required': 'Target company industry is required'}),
  primaryPainPoint: Joi.string().required().max(500).trim()
    .messages({'any.required': 'Primary pain point/challenge is required'}),
  secondaryPainPoints: Joi.array().items(Joi.string().max(200)).max(3).optional(),
  
  // Enhanced Context Fields
  crmNotes: Joi.string().max(1000).optional(),
  organizationFocus: Joi.string().max(100).optional(),
  locationOfInterest: Joi.string().max(100).optional(),
  contextLinks: Joi.array().items(Joi.string().uri()).max(5).optional(),
  additionalContext: Joi.string().max(2000).optional(),
  
  // Solution-Relevance Analysis Flags
  competitorAnalysis: Joi.boolean().optional(),
  budgetIntelligence: Joi.boolean().optional(),
  technologyStackFocus: Joi.boolean().optional()
});

export const generateDossierHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  // Validate request body
  const { error, value } = researchInputSchema.validate(req.body);
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
  console.log(`🎯 BMad Orchestrator: Starting research request ${requestId} for ${value.companyName}`);

  try {
    // **FULL AGENT ORCHESTRATION INTEGRATION** - Execute Complete 3-Agent System
    const { AgentOrchestrator } = await import('../../services/AgentOrchestrator');
    
    // Create WebSocket progress callback for real-time updates
    const progressCallback = (progress: any) => {
      console.log(`📡 Agent Progress [${requestId}]:`, progress);
      
      // Broadcast real-time progress to WebSocket clients
      try {
        // Access the global server instance to get the message broker
        const app = req.app as any;
        const messageBroker = app.get('messageBroker');
        if (messageBroker && messageBroker.sendAgentProgress) {
          messageBroker.sendAgentProgress(requestId, progress);
        }
      } catch (wsError) {
        console.log(`⚠️ WebSocket broadcast failed: ${wsError}`);
      }
    };
    
    // Prepare optimized user input for agent system
    const optimizedInput = {
      companyName: value.companyName,
      companyUrl: value.companyUrl,
      linkedinUrl: value.linkedinUrl,
      linkedinUserUrl: value.linkedinUserUrl,
      vendorName: value.vendorName,
      productName: value.productName,
      industry: value.industry,
      primaryPainPoint: value.primaryPainPoint,
      additionalContext: value.additionalContext || value.crmNotes,
      competitorAnalysis: value.competitorAnalysis || true,
      budgetIntelligence: value.budgetIntelligence || true,
      technologyStackFocus: value.technologyStackFocus || true,
      priority: 'standard' as 'standard' | 'express',
      outputFormat: 'full' as 'full' | 'executive' | 'custom',
      confidenceThreshold: 'medium' as 'high' | 'medium' | 'all'
    };
    
    // Initialize full agent orchestration system
    const orchestrator = new AgentOrchestrator(progressCallback);
    
    // Start background processing - Execute complete 3-agent mission
    setImmediate(async () => {
      try {
        // Track usage for subscription billing
        if (req.user?.id) {
          try {
            const { UserService } = await import('../../models/User');
            const userService = new UserService();
            await userService.incrementDossierUsage(req.user.id);
            console.log(`📊 Usage tracked for user: ${req.user.email}`);
          } catch (usageError) {
            console.warn(`⚠️ Failed to track usage: ${usageError}`);
          }
        }

        console.log(`🎭 Starting FULL 3-agent intelligence mission for ${value.companyName}...`);
        console.log(`📋 Mission Parameters:`, {
          company: optimizedInput.companyName,
          vendor: optimizedInput.vendorName,
          product: optimizedInput.productName,
          industry: optimizedInput.industry,
          painPoint: optimizedInput.primaryPainPoint
        });
        
        // Execute complete agent orchestration (Coordinator → Researcher → Detective)
        const missionResult = await orchestrator.executeIntelligenceMission(optimizedInput);
        
        // CRITICAL: Save completed dossier with full content
        if (missionResult.success && missionResult.dossier) {
          try {
            console.log(`💾 Saving completed dossier for ${requestId}...`);
            
            // Save the complete dossier data to database
            const { DatabaseManager } = await import('../../database/DatabaseManager');
            const db = DatabaseManager.getInstance();
            
            // 1. Create research request record
            await db.query(`
              INSERT OR REPLACE INTO research_requests 
              (request_id, user_id, organization_id, company_name, status, estimated_completion, created_at, completed_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [
              requestId,
              req.user?.id || 'anonymous',
              'dev-org-id', // Development organization ID
              optimizedInput.companyName,
              'completed',
              480,
              new Date().toISOString(),
              new Date().toISOString()
            ]);
            
            // 2. Create the dossier record with full content
            const dossierService = new DossierService();
            const savedDossier = await dossierService.createDossier(
              requestId,
              req.user?.id || 'anonymous',
              optimizedInput.companyName,
              missionResult.dossier.confidenceScore || 85,
              missionResult.dossier.sourcesCount || 5
            );
            
            // 3. Save the complete dossier content as JSON
            await db.query(`
              INSERT OR REPLACE INTO dossier_content 
              (dossier_id, request_id, content_json, generated_at)
              VALUES (?, ?, ?, ?)
            `, [
              savedDossier.id,
              requestId,
              JSON.stringify(missionResult.dossier),
              new Date().toISOString()
            ]);
            
            console.log(`✅ Dossier saved successfully: ${savedDossier.id}`);
            
            // 4. Notify completion via WebSocket
            try {
              const app = req.app as any;
              const messageBroker = app.get('messageBroker');
              if (messageBroker && messageBroker.sendAgentProgress) {
                messageBroker.sendAgentProgress(requestId, {
                  type: 'dossier_complete',
                  stage: 'complete',
                  agent: 'coordinator',
                  message: 'FBI-quality intelligence dossier completed successfully',
                  confidence: missionResult.dossier.confidenceScore,
                  timestamp: new Date(),
                  dossier: {
                    requestId,
                    companyName: optimizedInput.companyName,
                    confidenceScore: missionResult.dossier.confidenceScore,
                    sectionsCount: Object.keys(missionResult.dossier.structuredSections || {}).length,
                    totalCost: missionResult.totalCost,
                    executionTime: missionResult.executionTime
                  }
                });
                console.log(`📡 WebSocket completion notification sent for ${requestId}`);
              }
            } catch (wsError) {
              console.warn(`⚠️ WebSocket notification failed: ${wsError}`);
            }
            
          } catch (saveError: any) {
            console.error(`❌ Failed to save dossier for ${requestId}:`, saveError);
          }
        }
        
        console.log(`✅ 3-Agent Mission Complete for ${requestId}`);
        console.log(`📊 Mission Results:`, {
          success: missionResult.success,
          totalCost: missionResult.totalCost,
          executionTime: missionResult.executionTime,
          qualityGatesPassed: missionResult.qualityGates.filter(g => g.passed).length,
          agentProgressUpdates: missionResult.agentProgress.length,
          confidenceScore: missionResult.dossier?.confidenceScore
        });
        
        if (missionResult.success && missionResult.dossier) {
          console.log(`🎯 Structured dossier generated with ${Object.keys(missionResult.dossier.structuredSections || {}).length} sections`);
        }
        
      } catch (processingError: any) {
        console.error(`❌ Background processing failed for ${requestId}:`, processingError);
        // TODO: Notify failure via WebSocket
      }
    });
    
    // Return immediate response with WebSocket URL
    const response: ResearchApiResponse = {
      success: true,
      requestId,
      status: 'processing',
      estimatedCompletion: 480, // 8 minutes
      websocketUrl: `ws://${req.get('host')}/ws/research/${requestId}`,
      message: `🎭 BMad Orchestrator: Research initiated for ${value.companyName}. Deploying Field Intelligence Researcher...`
    };

    res.status(202).json(response);

  } catch (error: any) {
    console.error(`❌ BMad Orchestrator: Request processing failed for ${requestId}:`, error);
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