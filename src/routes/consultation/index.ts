import express, { Request, Response } from 'express';
import { authenticateJWT } from '../../middleware/auth';
import { MackConsultationService } from '../../services/consultation/MackConsultationService';
import { AgentOrchestrator } from '../../services/AgentOrchestrator';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    organizationId: string;
    organizationRole: string;
    email: string;
  };
}

const router = express.Router();
// Lazy initialization to avoid database access before initialization
let consultationService: MackConsultationService | null = null;

function getConsultationService(): MackConsultationService {
  if (!consultationService) {
    consultationService = new MackConsultationService();
  }
  return consultationService;
}

/**
 * MACK CONSULTATION AGENT API ROUTES
 * Phase 1: Foundation & Core Consultation Endpoints
 */

// Health check endpoint for consultation service
router.get('/health', (_req, res: Response): void => {
  res.json({
    success: true,
    service: 'Mack Consultation Agent',
    status: 'operational',
    version: '1.0.0-phase1',
    timestamp: new Date().toISOString()
  });
});

// POST /api/v1/consultation/start - Initialize new consultation session
router.post('/start', authenticateJWT, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    
    console.log(`🎭 Mack: Starting consultation for user ${user.email}`);
    
    const session = await getConsultationService().startConsultation(
      user.userId, 
      user.organizationId
    );
    
    // Get the initial greeting from Mack
    const initialStep = session.conversation_context.conversation_flow.find(
      step => step.step_id === 'greeting'
    );
    
    res.status(201).json({
      success: true,
      data: {
        session_id: session.id,
        mack_message: initialStep?.mack_message || "Hey there! I'm Mack, your corporate investigator. Let's get started.",
        conversation_step: 'greeting',
        status: 'active'
      }
    });
  } catch (error: any) {
    console.error('❌ Consultation start failed:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CONSULTATION_START_FAILED',
        message: error.message
      }
    });
  }
});

// POST /api/v1/consultation/{sessionId}/respond - Process user response
router.post('/:sessionId/respond', authenticateJWT, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;
    const { user_input } = req.body;
    
    if (!user_input) {
      res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_USER_INPUT',
          message: 'User input is required'
        }
      });
      return;
    }
    
    console.log(`🎭 Mack: Processing response for session ${sessionId}: "${user_input}"`);
    
    const result = await getConsultationService().processUserResponse(sessionId, user_input);
    
    res.json({
      success: true,
      data: {
        session_id: sessionId,
        mack_response: result.mackResponse,
        next_step: result.nextStep?.step_type || 'completed',
        business_context_update: result.businessContextUpdate,
        is_consultation_complete: result.isComplete,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error('❌ Consultation response processing failed:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CONSULTATION_RESPONSE_FAILED',
        message: error.message
      }
    });
  }
});

// GET /api/v1/consultation/{sessionId}/status - Get consultation session status
router.get('/:sessionId/status', authenticateJWT, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;
    
    const session = await getConsultationService().getConsultationSession(sessionId);
    
    if (!session) {
      res.status(404).json({
        success: false,
        error: {
          code: 'SESSION_NOT_FOUND',
          message: 'Consultation session not found'
        }
      });
      return;
    }
    
    // Verify user owns this session
    if (session.user_id !== req.user!.userId) {
      res.status(403).json({
        success: false,
        error: {
          code: 'ACCESS_DENIED',
          message: 'You can only access your own consultation sessions'
        }
      });
      return;
    }
    
    res.json({
      success: true,
      data: {
        session_id: session.id,
        status: session.status,
        current_step: session.conversation_context.current_step,
        conversation_progress: {
          steps_completed: session.conversation_context.user_responses.length,
          total_steps: session.conversation_context.conversation_flow.length
        },
        business_context_completeness: calculateContextCompleteness(session.business_context),
        created_at: session.created_at,
        completed_at: session.completed_at,
        quality_score: session.consultation_quality_score
      }
    });
  } catch (error: any) {
    console.error('❌ Consultation status fetch failed:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CONSULTATION_STATUS_FAILED',
        message: error.message
      }
    });
  }
});

// GET /api/v1/consultation/{sessionId}/research-plan - Get generated research plan
router.get('/:sessionId/research-plan', authenticateJWT, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;
    
    const session = await getConsultationService().getConsultationSession(sessionId);
    
    if (!session) {
      res.status(404).json({
        success: false,
        error: {
          code: 'SESSION_NOT_FOUND',
          message: 'Consultation session not found'
        }
      });
      return;
    }
    
    // Verify user owns this session
    if (session.user_id !== req.user!.userId) {
      res.status(403).json({
        success: false,
        error: {
          code: 'ACCESS_DENIED',
          message: 'You can only access your own consultation sessions'
        }
      });
      return;
    }
    
    if (!session.research_plan) {
      res.status(400).json({
        success: false,
        error: {
          code: 'RESEARCH_PLAN_NOT_READY',
          message: 'Research plan not yet generated. Complete the consultation first.'
        }
      });
      return;
    }
    
    res.json({
      success: true,
      data: {
        session_id: session.id,
        research_plan: session.research_plan,
        optimized_input: session.research_plan.optimized_user_input,
        mack_briefing: session.research_plan.consultation_insights_summary,
        estimated_completion_time: session.research_plan.estimated_completion_time
      }
    });
  } catch (error: any) {
    console.error('❌ Research plan fetch failed:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'RESEARCH_PLAN_FETCH_FAILED',
        message: error.message
      }
    });
  }
});

// POST /api/v1/consultation/{sessionId}/execute - Execute intelligence mission based on consultation
router.post('/:sessionId/execute', authenticateJWT, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;
    const user = req.user!;
    
    const session = await getConsultationService().getConsultationSession(sessionId);
    
    if (!session) {
      res.status(404).json({
        success: false,
        error: {
          code: 'SESSION_NOT_FOUND',
          message: 'Consultation session not found'
        }
      });
      return;
    }
    
    // Verify user owns this session
    if (session.user_id !== user.userId) {
      res.status(403).json({
        success: false,
        error: {
          code: 'ACCESS_DENIED',
          message: 'You can only execute your own consultation sessions'
        }
      });
      return;
    }
    
    // Verify consultation is completed and research plan exists
    if (!session.research_plan || session.status !== 'completed') {
      res.status(400).json({
        success: false,
        error: {
          code: 'CONSULTATION_NOT_READY',
          message: 'Consultation must be completed before executing intelligence mission'
        }
      });
      return;
    }
    
    // Convert consultation OptimizedUserInput to AgentTypes OptimizedUserInput
    const consultationInput = session.research_plan.optimized_user_input;
    const agentSystemInput = getConsultationService().convertToAgentSystemInput(consultationInput);
    
    // Execute intelligence mission with consultation-aware orchestrator
    const orchestrator = new AgentOrchestrator();
    const result = await orchestrator.executeIntelligenceMission(agentSystemInput);
    
    res.json({
      success: true,
      data: {
        consultation_session_id: sessionId,
        research_result: result,
        mack_briefing: session.research_plan.consultation_insights_summary,
        consultation_enhanced: true
      }
    });
    
  } catch (error: any) {
    console.error('❌ Consultation intelligence execution failed:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTELLIGENCE_EXECUTION_FAILED',
        message: error.message
      }
    });
  }
});

// GET /api/v1/consultation/history - Get user's consultation history
router.get('/history', authenticateJWT, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = parseInt(req.query.offset as string) || 0;
    
    // TODO: Add method to MackConsultationService to get user consultation history
    // For now, return placeholder with user context
    res.json({
      success: true,
      data: {
        consultations: [],
        pagination: {
          limit,
          offset,
          total: 0
        },
        userId: user.userId // Using user variable
      }
    });
  } catch (error: any) {
    console.error('❌ Consultation history fetch failed:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CONSULTATION_HISTORY_FAILED',
        message: error.message
      }
    });
  }
});

// POST /api/v1/consultation/{sessionId}/feedback - Submit consultation feedback
router.post('/:sessionId/feedback', authenticateJWT, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;
    const { 
      satisfaction_rating, 
      credibility_rating, 
      feedback_text, 
      improvement_suggestions 
    } = req.body;
    
    // TODO: Store feedback in database when MackConsultationService.submitFeedback is implemented
    console.log('Feedback received:', { satisfaction_rating, credibility_rating, feedback_text, improvement_suggestions });
    
    if (!satisfaction_rating && !credibility_rating) {
      res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_RATINGS',
          message: 'At least one rating (satisfaction or credibility) is required'
        }
      });
      return;
    }
    
    // TODO: Add feedback submission to MackConsultationService
    // For now, return success
    res.json({
      success: true,
      data: {
        message: 'Feedback submitted successfully',
        session_id: sessionId
      }
    });
  } catch (error: any) {
    console.error('❌ Consultation feedback submission failed:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CONSULTATION_FEEDBACK_FAILED',
        message: error.message
      }
    });
  }
});

// Utility function to calculate business context completeness
function calculateContextCompleteness(businessContext: any): number {
  const requiredFields = [
    'target_company.company_name',
    'sales_context.primary_pain_point',
    'sales_context.solution_category'
  ];
  
  let completedFields = 0;
  
  requiredFields.forEach(field => {
    const fieldPath = field.split('.');
    let value = businessContext;
    
    for (const key of fieldPath) {
      value = value?.[key];
    }
    
    if (value && value.trim().length > 0) {
      completedFields++;
    }
  });
  
  return completedFields / requiredFields.length;
}

export = router;