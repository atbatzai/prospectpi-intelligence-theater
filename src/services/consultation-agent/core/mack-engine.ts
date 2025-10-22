import { ConversationState, ConversationMessage, BusinessContext, IntelligencePlan } from '../types/index';

/**
 * Mack - Corporate Investigation Specialist
 * "Expert in corporate intelligence and competitive analysis. I specialize in getting you the intel you need."
 */
export class MackConsultationEngine {
  private conversations: Map<string, ConversationState> = new Map();

  constructor() {
    // Mack initialization complete - ready for consultation
  }

  /**
   * Start new consultation session with Mack
   */
  public async startConsultation(userId: string, sessionId: string): Promise<ConversationState> {
    const conversationId = `${sessionId}-${Date.now()}`;
    
    const initialState: ConversationState = {
      id: conversationId,
      sessionId,
      userId,
      stage: 'introduction',
      messages: [],
      extractedContext: {} as BusinessContext,
      completionScore: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Mack's opening message
    const introMessage: ConversationMessage = {
      id: `msg-${Date.now()}`,
      role: 'mack',
      content: "Hey there - I'm Mack, your research specialist. I'm an expert in corporate intelligence and competitive analysis. What company are we investigating today?",
      timestamp: new Date(),
      intent: 'introduction'
    };

    initialState.messages.push(introMessage);
    this.conversations.set(conversationId, initialState);
    
    return initialState;
  }

  /**
   * Process user response and generate Mack's next question
   */
  public async processUserMessage(
    conversationId: string, 
    userMessage: string
  ): Promise<ConversationMessage> {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    // Add user message
    const userMsg: ConversationMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    };
    conversation.messages.push(userMsg);

    // Extract business context from message
    const extractedData = await this.extractBusinessContext(userMessage, conversation.stage);
    if (extractedData) {
      conversation.extractedContext = { ...conversation.extractedContext, ...extractedData };
      userMsg.extractedData = extractedData;
    }

    // Generate Mack's response based on conversation stage
    const mackResponse = await this.generateMackResponse(conversation);
    conversation.messages.push(mackResponse);

    // Update conversation state
    this.updateConversationState(conversation);
    this.conversations.set(conversationId, conversation);

    return mackResponse;
  }

  /**
   * Extract business context from user input
   */
  private async extractBusinessContext(
    message: string, 
    stage: ConversationState['stage']
  ): Promise<Partial<BusinessContext> | null> {
    // Basic extraction logic - would integrate with AI service in production
    const context: Partial<BusinessContext> = {};
    
    // Company name detection
    if (stage === 'introduction') {
      // Simple company name extraction (would use NLP in production)
      const possibleCompany = message.trim().replace(/[.,!?]/g, '');
      if (possibleCompany.length > 1) {
        context.companyName = possibleCompany;
      }
    }

    // Solution context extraction
    if (message.toLowerCase().includes('displac')) {
      context.competitiveAngle = 'displacement';
    }
    if (message.toLowerCase().includes('new business')) {
      context.competitiveAngle = 'new_business';
    }

    return Object.keys(context).length > 0 ? context : null;
  }

  /**
   * Generate Mack's investigative response
   */
  private async generateMackResponse(conversation: ConversationState): Promise<ConversationMessage> {
    const { stage, extractedContext } = conversation;
    let response = '';
    let nextStage = stage;

    switch (stage) {
      case 'introduction':
        if (extractedContext.companyName) {
          response = this.generateCompanyContextResponse(extractedContext.companyName);
          nextStage = 'context-building';
        } else {
          response = "I need a company name to get started. Which organization are you targeting?";
        }
        break;

      case 'context-building':
        response = this.generateContextBuildingResponse(extractedContext);
        if (this.isContextComplete(extractedContext)) {
          nextStage = 'plan-review';
        }
        break;

      case 'plan-review':
        response = this.generatePlanReviewResponse(extractedContext);
        nextStage = 'handoff';
        break;

      case 'handoff':
        response = "Perfect. I'm briefing our field agents now. You'll see their progress in real-time...";
        break;
    }

    conversation.stage = nextStage;

    return {
      id: `msg-${Date.now()}`,
      role: 'mack',
      content: response,
      timestamp: new Date(),
      intent: `${stage}_response`
    };
  }

  /**
   * Generate company-specific response
   */
  private generateCompanyContextResponse(companyName: string): string {
    // Mack's investigative personality with company-specific insights
    const responses = [
      `${companyName}, huh? Interesting target. What's the play - new business, competitive displacement, or partner channel?`,
      `${companyName} - I've worked cases against them before. What's your angle? Trying to get in direct or through existing relationships?`,
      `Good choice with ${companyName}. They're complex but worth the effort. What solution are you positioning to them?`,
      `${companyName}... tough nut to crack, but I know their weak spots. What's your competitive advantage?`
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }

  /**
   * Generate context-building questions
   */
  private generateContextBuildingResponse(context: BusinessContext): string {
    if (!context.competitiveAngle) {
      return "Got it. What's driving this research - new opportunity, competitive displacement, or expansion play?";
    }
    
    if (!context.solutionFocus) {
      return "Smart approach. What solution are you pitching to them?";
    }

    if (!context.primaryPainPoint) {
      return "Interesting angle. What's the main business problem your solution solves for them?";
    }

    return "Perfect. Any inside connections, or are we going in cold?";
  }

  /**
   * Generate research plan review
   */
  private generatePlanReviewResponse(context: BusinessContext): string {
    // Build research plan for review
    this.buildResearchPlan(context);
    
    return `Based on our conversation, here's my investigation plan:

📋 **Research Focus:**
• Target: ${context.companyName} (${context.competitiveAngle} play)
• Solution: ${context.solutionFocus}
• Key Challenge: ${context.primaryPainPoint}
• Approach: ${context.insideConnections ? 'Warm introduction + direct' : 'Cold outreach strategy'}

I'll focus on decision makers, budget cycles, and competitive landscape. Look good?`;
  }

  /**
   * Build intelligence plan from extracted context
   */
  private buildResearchPlan(context: BusinessContext): IntelligencePlan {
    return {
      id: `plan-${Date.now()}`,
      targetCompany: context.companyName || '',
      solutionContext: context.solutionFocus || '',
      investigativeAngles: [
        'Decision maker identification',
        'Budget cycle analysis',
        'Competitive landscape mapping',
        'Pain point validation'
      ],
      priorityAreas: [
        'Organizational structure',
        'Recent initiatives',
        'Technology stack',
        'Vendor relationships'
      ],
      expectedDeliverables: [
        'Executive profiles',
        'Company intelligence dossier',
        'Competitive positioning',
        'Engagement recommendations'
      ],
      estimatedDuration: '5-8 minutes',
      confidenceLevel: 0.85
    };
  }

  /**
   * Check if enough context has been gathered
   */
  private isContextComplete(context: BusinessContext): boolean {
    return !!(
      context.companyName &&
      context.competitiveAngle &&
      context.solutionFocus &&
      context.primaryPainPoint
    );
  }

  /**
   * Update conversation completion score
   */
  private updateConversationState(conversation: ConversationState): void {
    const context = conversation.extractedContext;
    let score = 0;
    
    if (context.companyName) score += 30;
    if (context.competitiveAngle) score += 20;
    if (context.solutionFocus) score += 20;
    if (context.primaryPainPoint) score += 20;
    if (context.insideConnections !== undefined) score += 10;
    
    conversation.completionScore = score;
    conversation.updatedAt = new Date();
  }

  /**
   * Get conversation state
   */
  public getConversation(conversationId: string): ConversationState | undefined {
    return this.conversations.get(conversationId);
  }

  /**
   * Convert consultation to OptimizedUserInput for existing system
   */
  public generateOptimizedUserInput(conversationId: string): any {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) return null;

    const context = conversation.extractedContext;
    
    return {
      companyName: context.companyName || '',
      vendorName: context.vendorName || '',
      productName: context.productName || context.solutionFocus || '',
      industry: context.industry || '',
      primaryPainPoint: context.primaryPainPoint || '',
      additionalContext: `Consultation with Mack: ${context.competitiveAngle} play. ${context.additionalContext || ''}`,
      priority: 'standard',
      consultationInsights: {
        investigativeAngles: conversation.researchPlan?.investigativeAngles || [],
        confidenceLevel: conversation.researchPlan?.confidenceLevel || 0.8,
        mackBriefing: `Research plan developed through strategic consultation with Mack.`
      }
    };
  }
}