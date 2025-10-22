import { Request, Response } from 'express';
import { MackConsultationEngine } from '../core/mack-engine';

export class ConsultationHandler {
  private mackEngine: MackConsultationEngine;

  constructor() {
    this.mackEngine = new MackConsultationEngine();
  }

  /**
   * Start new consultation session
   * POST /api/v1/consultation/start
   */
  public startConsultation = async (req: Request, res: Response) => {
    try {
      const { userId } = req.body;
      const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const conversation = await this.mackEngine.startConsultation(userId || 'anonymous', sessionId);
      
      res.json({
        success: true,
        data: {
          conversationId: conversation.id,
          sessionId: conversation.sessionId,
          initialMessage: conversation.messages[0],
          stage: conversation.stage,
          completionScore: conversation.completionScore
        }
      });
    } catch (error) {
      console.error('Error starting consultation:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to start consultation'
      });
    }
  };

  /**
   * Process user message in consultation
   * POST /api/v1/consultation/message
   */
  public processMessage = async (req: Request, res: Response) => {
    try {
      const { conversationId, message } = req.body;
      
      if (!conversationId || !message) {
        return res.status(400).json({
          success: false,
          error: 'conversationId and message are required'
        });
      }

      const mackResponse = await this.mackEngine.processUserMessage(conversationId, message);
      const conversation = this.mackEngine.getConversation(conversationId);
      
      return res.json({
        success: true,
        data: {
          mackResponse,
          stage: conversation?.stage,
          completionScore: conversation?.completionScore,
          extractedContext: conversation?.extractedContext
        }
      });
    } catch (error) {
      console.error('Error processing message:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to process message'
      });
    }
  };

  /**
   * Get conversation state
   * GET /api/v1/consultation/:conversationId
   */
  public getConversation = async (req: Request, res: Response) => {
    try {
      const { conversationId } = req.params;
      
      const conversation = this.mackEngine.getConversation(conversationId);
      
      if (!conversation) {
        return res.status(404).json({
          success: false,
          error: 'Conversation not found'
        });
      }

      return res.json({
        success: true,
        data: conversation
      });
    } catch (error) {
      console.error('Error getting conversation:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to get conversation'
      });
    }
  };

  /**
   * Convert consultation to research request
   * POST /api/v1/consultation/:conversationId/generate-research
   */
  public generateResearch = async (req: Request, res: Response) => {
    try {
      const { conversationId } = req.params;
      
      const optimizedInput = this.mackEngine.generateOptimizedUserInput(conversationId);
      
      if (!optimizedInput) {
        return res.status(404).json({
          success: false,
          error: 'Conversation not found or insufficient data'
        });
      }

      return res.json({
        success: true,
        data: {
          optimizedUserInput: optimizedInput,
          message: "Mack has prepared your research brief. Ready to deploy the field agents?"
        }
      });
    } catch (error) {
      console.error('Error generating research:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to generate research'
      });
    }
  };
}