import { v4 as uuidv4 } from 'uuid';
import { DatabaseManager } from '../../database/DatabaseManager';
import { OpenAI } from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import {
  ConsultationSession,
  ConversationContext,
  BusinessContext,
  ResearchPlan,
  ConversationStep,
  UserResponse,
  MackPersonalityState,
  IntentClassification,
  OptimizedUserInput,
  ABTestConfiguration,
  ABTestVariant,
  ABTestEvent,
  ConversationOptimizations
} from '../../interfaces/consultation/types';

/**
 * MACK CONSULTATION SERVICE
 * Core conversational AI engine for business context extraction
 * Transforms generic form-filling into strategic P.I. consultation
 */
export class MackConsultationService {
  private dbManager: DatabaseManager | null = null;
  private openai: OpenAI;
  private anthropic: Anthropic;
  
  constructor() {
    // Initialize AI clients for Phase 3 integration
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || 'placeholder-key'
    });
    
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || 'placeholder-key'
    });
  }

  private getDbManager(): DatabaseManager {
    if (!this.dbManager) {
      this.dbManager = DatabaseManager.getInstance();
    }
    return this.dbManager;
  }
  
  private readonly MACK_PERSONALITY_PROMPTS = {
    greeting: "I'm Mack. I've been conducting corporate intelligence for 15 years—Fortune 500 acquisitions, competitive analysis, due diligence. I specialize in gathering the strategic intelligence that closes deals. What's your situation?",
    context_gathering: "Let's get specific. Who's the target organization, what solution are you positioning, and what's driving the opportunity? I need to understand the business context before we start gathering intelligence.",
    strategic_focus: "Good. Now let me ask some focused questions about your strategic objectives. The quality of our intelligence depends on understanding exactly what business decisions you're trying to make.",
    validation: "Let me confirm the scope: We're investigating {company} for a {solution} opportunity, focusing on {priorities}. The critical intelligence areas are {focus_areas}. Is that the strategic picture?",
    research_plan: "Excellent. Here's my tactical plan: {methodology}. My team will prioritize {data_sources} and focus on {analysis_areas}. Expect actionable intelligence with source attribution in approximately {timeframe}.",
    handoff: "I'm briefing the intelligence team now with your strategic context. You'll see the Field Researcher gather data, then the Detective analyze patterns and opportunities. I'll surface any critical findings as they develop."
  };

  /**
   * Initialize a new consultation session
   */
  async startConsultation(userId: string, organizationId?: string): Promise<ConsultationSession> {
    const sessionId = uuidv4();
    const conversationId = uuidv4();
    
    const initialConversationContext: ConversationContext = {
      conversation_id: conversationId,
      current_step: 'greeting',
      conversation_flow: await this.generateInitialConversationFlow(),
      user_responses: [],
      mack_personality_state: this.initializeMackPersonality(userId),
      intent_classification_history: []
    };

    const session: ConsultationSession = {
      id: sessionId,
      user_id: userId,
      organization_id: organizationId || null,
      team_id: null, // Phase 2 feature
      status: 'active',
      conversation_context: initialConversationContext,
      business_context: this.initializeBusinessContext(),
      research_plan: null,
      created_at: new Date().toISOString(),
      completed_at: null,
      consultation_quality_score: null
    };

    // Store session in database
    await this.saveConsultationSession(session);
    
    return session;
  }

  /**
   * Process user response and generate next Mack response
   */
  async processUserResponse(
    sessionId: string, 
    userInput: string
  ): Promise<{
    mackResponse: string;
    nextStep: ConversationStep | null;
    businessContextUpdate: Partial<BusinessContext>;
    isComplete: boolean;
  }> {
    const session = await this.getConsultationSession(sessionId);
    if (!session) throw new Error('Consultation session not found');

    // Classify user intent and extract business context
    const intentClassification = await this.classifyIntent(userInput, session.conversation_context);
    const businessContextExtraction = await this.extractBusinessContext(userInput, session.business_context);
    
    // Update conversation context
    const userResponse: UserResponse = {
      response_id: uuidv4(),
      step_id: session.conversation_context.current_step,
      user_input: userInput,
      processed_intent: intentClassification.classified_intent,
      confidence_score: intentClassification.confidence_score,
      business_insights_extracted: intentClassification.business_context_signals,
      timestamp: new Date().toISOString()
    };

    session.conversation_context.user_responses.push(userResponse);
    session.conversation_context.intent_classification_history.push(intentClassification);

    // Update business context
    session.business_context = { ...session.business_context, ...businessContextExtraction };

    // Determine next conversation step
    const currentStep = session.conversation_context.conversation_flow.find(
      step => step.step_id === session.conversation_context.current_step
    );

    const nextStepResult = await this.determineNextStep(currentStep!, userResponse, session);
    
    // Generate Mack's response
    const mackResponse = await this.generateMackResponse(
      nextStepResult.nextStep,
      session.business_context,
      session.conversation_context.mack_personality_state
    );

    // Update session
    session.conversation_context.current_step = nextStepResult.nextStep?.step_id || 'completed';
    await this.saveConsultationSession(session);

    // Check if consultation is complete
    const isComplete = nextStepResult.nextStep?.step_type === 'handoff' || !nextStepResult.nextStep;
    
    if (isComplete && nextStepResult.nextStep?.step_type === 'handoff') {
      // Generate research plan and optimized input
      session.research_plan = await this.generateResearchPlan(session);
      session.status = 'completed';
      session.completed_at = new Date().toISOString();
      session.consultation_quality_score = await this.calculateQualityScore(session);
      await this.saveConsultationSession(session);
    }

    return {
      mackResponse,
      nextStep: nextStepResult.nextStep,
      businessContextUpdate: businessContextExtraction,
      isComplete
    };
  }

  /**
   * Get current consultation session
   */
  async getConsultationSession(sessionId: string): Promise<ConsultationSession | null> {
    const result = await this.getDbManager().queryOne(
      'SELECT * FROM consultation_sessions WHERE id = ?',
      [sessionId]
    );
    
    if (!result) return null;

    return {
      ...result,
      conversation_context: JSON.parse(result.conversation_context),
      business_context: JSON.parse(result.business_context),
      research_plan: result.research_plan ? JSON.parse(result.research_plan) : null
    };
  }

  /**
   * Generate research plan from consultation
   */
  async generateResearchPlan(session: ConsultationSession): Promise<ResearchPlan> {
    const optimizedInput = this.generateOptimizedUserInput(session);
    
    return {
      plan_id: uuidv4(),
      consultation_session_id: session.id,
      optimized_user_input: optimizedInput,
      research_strategy: {
        primary_research_angles: this.extractResearchAngles(session.business_context),
        data_source_priorities: this.determinePrioritySources(session.business_context),
        agent_coordination_plan: {
          intelligence_coordinator_briefing: this.generateCoordinatorBriefing(session),
          field_researcher_priorities: this.extractResearchPriorities(session.business_context),
          intelligence_detective_focus_areas: this.extractDetectiveFocus(session.business_context),
          consultation_context_handoff: this.generateContextHandoff(session)
        },
        quality_optimization_focus: this.extractQualityFocus(session.business_context),
        consultation_success_correlation: []
      },
      quality_gates: [],
      success_metrics: [],
      estimated_completion_time: this.estimateResearchTime(session.business_context),
      consultation_insights_summary: this.generateInsightsSummary(session)
    };
  }

  /**
   * Generate optimized user input for existing 3-agent system with consultation enhancements
   */
  private generateOptimizedUserInput(session: ConsultationSession): OptimizedUserInput {
    const bc = session.business_context;
    
    return {
      // Required fields matching consultation OptimizedUserInput interface
      companyName: bc.target_company.company_name,
      companyUrl: bc.target_company.company_url || '',
      linkedinUrl: bc.target_company.linkedin_url || '',
      industry: bc.target_company.industry || bc.industry_context.industry_vertical,
      primaryPainPoint: bc.sales_context.primary_pain_point,
      vendorName: 'ProspectPI Client', // Will be enhanced from conversation context
      productName: bc.sales_context.solution_category,
      organizationFocus: this.extractOrganizationFocus(bc),
      locationOfInterest: bc.target_company.geographic_focus || '',
      contextLinks: [], // Will be populated from conversation if available
      additionalContext: this.generateAdditionalContext(bc),
      
      // Phase 2: Consultation Integration Fields
      consultation_derived_context: this.generateConsultationContext(session),
      strategic_research_focus: bc.research_objectives.map(obj => obj.objective_type),
      priority_intelligence_areas: bc.research_objectives
        .filter(obj => obj.priority_level === 'critical')
        .map(obj => obj.objective_type),
      business_context_signals: session.conversation_context.intent_classification_history
        .flatMap(intent => intent.business_context_signals || []),
      mack_briefing_summary: this.generateMackBriefing(session)
    };
  }

  // Core conversation flow methods
  private async generateInitialConversationFlow(): Promise<ConversationStep[]> {
    return [
      {
        step_id: 'greeting',
        step_type: 'greeting',
        mack_message: this.MACK_PERSONALITY_PROMPTS.greeting,
        expected_response_type: 'text',
        validation_rules: [],
        next_step_logic: {
          conditions: [
            {
              condition_type: 'user_response',
              condition_expression: 'has_company_mention',
              next_step_id: 'context_gathering'
            }
          ],
          default_next_step: 'context_gathering',
          error_recovery_step: 'clarification_company'
        }
      },
      {
        step_id: 'context_gathering',
        step_type: 'context_gathering',
        mack_message: this.MACK_PERSONALITY_PROMPTS.context_gathering,
        expected_response_type: 'text',
        validation_rules: [],
        next_step_logic: {
          conditions: [],
          default_next_step: 'strategic_focus',
          error_recovery_step: 'clarification_context'
        }
      },
      {
        step_id: 'strategic_focus',
        step_type: 'context_gathering',
        mack_message: this.MACK_PERSONALITY_PROMPTS.strategic_focus,
        expected_response_type: 'text',
        validation_rules: [],
        next_step_logic: {
          conditions: [],
          default_next_step: 'validation',
          error_recovery_step: 'clarification_strategic'
        }
      },
      {
        step_id: 'validation',
        step_type: 'validation',
        mack_message: this.MACK_PERSONALITY_PROMPTS.validation,
        expected_response_type: 'confirmation',
        validation_rules: [],
        next_step_logic: {
          conditions: [
            {
              condition_type: 'user_response',
              condition_expression: 'confirmation_positive',
              next_step_id: 'research_plan'
            }
          ],
          default_next_step: 'context_gathering',
          error_recovery_step: 'clarification_validation'
        }
      },
      {
        step_id: 'research_plan',
        step_type: 'research_plan',
        mack_message: this.MACK_PERSONALITY_PROMPTS.research_plan,
        expected_response_type: 'confirmation',
        validation_rules: [],
        next_step_logic: {
          conditions: [],
          default_next_step: 'handoff',
          error_recovery_step: 'research_plan'
        }
      },
      {
        step_id: 'handoff',
        step_type: 'handoff',
        mack_message: this.MACK_PERSONALITY_PROMPTS.handoff,
        expected_response_type: 'confirmation',
        validation_rules: [],
        next_step_logic: {
          conditions: [],
          default_next_step: 'completed',
          error_recovery_step: 'handoff'
        }
      }
    ];
  }

  private initializeMackPersonality(_userId: string): MackPersonalityState {
    return {
      expertise_level: 'investigative',
      communication_style: 'professional',
      industry_focus: null,
      previous_interaction_memory: [],
      credibility_signals: [
        "15 years corporate investigation experience",
        "Specialized in sales intelligence",
        "Focus on actionable business insights"
      ]
    };
  }

  private initializeBusinessContext(): BusinessContext {
    return {
      target_company: {
        company_name: '',
        company_url: null,
        linkedin_url: null,
        industry: null,
        company_size: null,
        geographic_focus: null,
        key_decision_makers: [],
        competitive_positioning: null
      },
      sales_context: {
        sales_stage: 'prospecting',
        solution_category: '',
        primary_pain_point: '',
        value_proposition: null,
        competitive_landscape: [],
        deal_size_estimate: null,
        timeline: null,
        stakeholders_involved: []
      },
      research_objectives: [],
      strategic_context: {
        strategic_importance: 'standard_prospect',
        organizational_relationship: null,
        previous_engagement_history: [],
        internal_champion_info: null,
        potential_roadblocks: []
      },
      industry_context: {
        industry_vertical: '',
        market_dynamics: [],
        regulatory_considerations: [],
        technology_trends: [],
        competitive_pressures: []
      },
      urgency_level: 'medium',
      complexity_assessment: {
        overall_complexity: 'moderate',
        research_scope: 'comprehensive',
        data_source_requirements: [],
        estimated_research_time: 180,
        recommended_agent_focus: []
      }
    };
  }

  // Phase 3: AI Integration with OpenAI GPT-4o-mini for Intent Classification
  private async classifyIntent(userInput: string, context: ConversationContext): Promise<IntentClassification> {
    try {
      const systemPrompt = `You are Mack, a professional corporate investigator with 15 years of experience. 
Analyze user input to classify intent and extract business context signals for strategic intelligence gathering.

Classification Options:
- company_research_request: User wants intelligence on a specific company
- solution_positioning: User discussing their product/service approach
- competitive_analysis: User asking about competitors or market position
- stakeholder_identification: User needs to identify decision makers
- business_context_gathering: User providing background information
- strategic_planning: User discussing deal strategy or approach
- clarification_needed: User response is unclear or incomplete

Extract business context signals like: industry mentions, company size indicators, urgency signals, 
competitive references, technology stack mentions, budget indicators, timeline references.`;

      const userPrompt = `Current conversation stage: ${context.current_step}
Previous responses: ${context.user_responses.slice(-3).map(r => r.user_input).join('; ')}

User input: "${userInput}"

Respond with JSON:
{
  "classified_intent": "intent_category",
  "confidence_score": 0.0-1.0,
  "business_context_signals": ["signal1", "signal2"],
  "next_question_suggestions": ["question1", "question2"]
}`;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 500,
        response_format: { type: "json_object" }
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from OpenAI');
      }

      const parsed = JSON.parse(response);
      
      return {
        user_input: userInput,
        classified_intent: parsed.classified_intent || 'company_research_request',
        confidence_score: parsed.confidence_score || 0.7,
        business_context_signals: parsed.business_context_signals || [],
        next_question_suggestions: parsed.next_question_suggestions || [],
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ OpenAI intent classification failed:', error);
      // Fallback to rule-based classification
      return this.fallbackIntentClassification(userInput);
    }
  }

  private fallbackIntentClassification(userInput: string): IntentClassification {
    const input = userInput.toLowerCase();
    let intent = 'company_research_request';
    let confidence = 0.6;
    const signals: string[] = [];

    if (input.includes('competitor') || input.includes('competition')) {
      intent = 'competitive_analysis';
      confidence = 0.8;
      signals.push('competitive_focus');
    }
    
    if (input.includes('decision maker') || input.includes('stakeholder')) {
      intent = 'stakeholder_identification';
      confidence = 0.8;
      signals.push('stakeholder_focus');
    }

    // Extract business signals
    if (input.includes('enterprise') || input.includes('large company')) signals.push('enterprise_target');
    if (input.includes('urgent') || input.includes('asap')) signals.push('high_urgency');
    if (input.includes('budget') || input.includes('cost')) signals.push('budget_sensitive');

    return {
      user_input: userInput,
      classified_intent: intent,
      confidence_score: confidence,
      business_context_signals: signals,
      next_question_suggestions: [`Can you tell me more about the ${intent.replace('_', ' ')}?`],
      timestamp: new Date().toISOString()
    };
  }

  // Phase 3: AI Integration with Claude 3.5 Sonnet for Business Context Extraction
  private async extractBusinessContext(userInput: string, currentContext: BusinessContext): Promise<Partial<BusinessContext>> {
    try {
      const systemPrompt = `You are Mack, a seasoned corporate investigator extracting strategic business context from user conversations.

Extract and update business context from user input. Focus on:
- Target company details (name, industry, size)
- Sales context (solution type, pain points, sales stage)
- Research objectives (what intelligence is needed)
- Strategic context (importance, urgency, competitive factors)
- Industry context (vertical, market dynamics)

Only extract information explicitly mentioned or strongly implied. If information is unclear, mark as null.

Return JSON with only the fields that need updating based on the user input.`;

      const userPrompt = `Current context: ${JSON.stringify(currentContext, null, 2)}

New user input: "${userInput}"

Extract any new or updated business context. Return JSON with only fields that should be updated:
{
  "target_company": {
    "company_name": "string or null",
    "industry": "string or null",
    "company_size": "string or null"
  },
  "sales_context": {
    "solution_category": "string or null", 
    "primary_pain_point": "string or null",
    "sales_stage": "string or null"
  },
  "research_objectives": [
    {
      "objective_type": "string",
      "priority_level": "critical|important|nice_to_have",
      "specific_questions": ["string"],
      "success_criteria": "string"
    }
  ],
  "urgency_level": "low|medium|high|urgent",
  "strategic_context": {
    "strategic_importance": "string"
  }
}`;

      const message = await this.anthropic.messages.create({
        model: "claude-3-opus-20240229",
        max_tokens: 1000,
        temperature: 0.2,
        messages: [{
          role: "user",
          content: userPrompt
        }],
        system: systemPrompt
      });

      const response = message.content[0];
      if (response.type !== 'text') {
        throw new Error('Unexpected response type from Claude');
      }

      const parsed = JSON.parse(response.text);
      
      // Merge with current context
      const updatedContext: Partial<BusinessContext> = {};
      
      if (parsed.target_company) {
        updatedContext.target_company = {
          ...currentContext.target_company,
          ...parsed.target_company
        };
      }
      
      if (parsed.sales_context) {
        updatedContext.sales_context = {
          ...currentContext.sales_context,
          ...parsed.sales_context
        };
      }
      
      if (parsed.research_objectives && parsed.research_objectives.length > 0) {
        updatedContext.research_objectives = [
          ...(currentContext.research_objectives || []),
          ...parsed.research_objectives
        ];
      }
      
      if (parsed.urgency_level) {
        updatedContext.urgency_level = parsed.urgency_level;
      }
      
      if (parsed.strategic_context) {
        updatedContext.strategic_context = {
          ...currentContext.strategic_context,
          ...parsed.strategic_context
        };
      }

      return updatedContext;
      
    } catch (error) {
      console.error('❌ Claude business context extraction failed:', error);
      // Fallback to simple extraction
      return this.fallbackBusinessContextExtraction(userInput, currentContext);
    }
  }

  private fallbackBusinessContextExtraction(userInput: string, currentContext: BusinessContext): Partial<BusinessContext> {
    const input = userInput.toLowerCase();
    const updates: Partial<BusinessContext> = {};

    // Simple keyword-based extraction
    if (input.includes('microsoft') || input.includes('google') || input.includes('amazon')) {
      const companyMatch = input.match(/(microsoft|google|amazon|apple|meta|salesforce|oracle|ibm)/i);
      if (companyMatch && !currentContext.target_company.company_name) {
        updates.target_company = {
          ...currentContext.target_company,
          company_name: companyMatch[1],
          industry: 'Technology'
        };
      }
    }

    // Extract pain points
    if (input.includes('cost') || input.includes('budget') || input.includes('expensive')) {
      updates.sales_context = {
        ...currentContext.sales_context,
        primary_pain_point: 'Cost optimization and budget constraints'
      };
    }

    return updates;
  }

  // Phase 3: Enhanced Mack Response Generation with Context Awareness
  private async generateMackResponse(
    step: ConversationStep | null,
    businessContext: BusinessContext,
    _personalityState: MackPersonalityState
  ): Promise<string> {
    try {
      const baseMessage = step?.mack_message || "Let me gather some more details about your situation.";
      
      // If we have business context, personalize the response
      if (businessContext.target_company.company_name) {
        const companyName = businessContext.target_company.company_name;
        const industry = businessContext.target_company.industry || 'this industry';
        const painPoint = businessContext.sales_context.primary_pain_point;
        
        if (step?.step_type === 'validation' && painPoint) {
          return `Understood. So we're investigating ${companyName} because of ${painPoint}. In my experience with ${industry} targets, this type of challenge often reveals interesting competitive positioning opportunities. Let me make sure I have the strategic picture right before we proceed.`;
        }
        
        if (step?.step_type === 'context_gathering') {
          return `${companyName} - good choice. I've worked similar cases in ${industry}. The key is understanding their business drivers and decision-making process. Let me ask a few targeted questions to ensure we gather the right intelligence.`;
        }
      }
      
      // Add industry-specific context if available
      if (businessContext.industry_context?.industry_vertical && step?.step_type === 'context_gathering') {
        const industry = businessContext.industry_context.industry_vertical;
        const industryContext = this.getIndustryIntelligenceContext(industry);
        return `${baseMessage} ${industryContext.split('.')[0]}. What's the specific opportunity you're working?`;
      }
      
      return baseMessage;
      
    } catch (error) {
      console.error('❌ Mack response generation error:', error);
      return step?.mack_message || "Tell me more about what you're looking to investigate.";
    }
  }

  private async determineNextStep(
    currentStep: ConversationStep,
    _userResponse: UserResponse,
    session: ConsultationSession
  ): Promise<{ nextStep: ConversationStep | null }> {
    // TODO: Implement conversation flow logic
    const nextStepId = currentStep.next_step_logic.default_next_step;
    const nextStep = session.conversation_context.conversation_flow.find(step => step.step_id === nextStepId);
    return { nextStep: nextStep || null };
  }

  // Database operations
  private async saveConsultationSession(session: ConsultationSession): Promise<void> {
    const exists = await this.getDbManager().queryOne('SELECT id FROM consultation_sessions WHERE id = ?', [session.id]);
    
    if (exists) {
      await this.getDbManager().execute(`
        UPDATE consultation_sessions SET
          status = ?,
          conversation_context = ?,
          business_context = ?,
          research_plan = ?,
          completed_at = ?,
          consultation_quality_score = ?
        WHERE id = ?
      `, [
        session.status,
        JSON.stringify(session.conversation_context),
        JSON.stringify(session.business_context),
        session.research_plan ? JSON.stringify(session.research_plan) : null,
        session.completed_at,
        session.consultation_quality_score,
        session.id
      ]);
    } else {
      await this.getDbManager().execute(`
        INSERT INTO consultation_sessions (
          id, user_id, organization_id, team_id, status,
          conversation_context, business_context, research_plan,
          created_at, completed_at, consultation_quality_score
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        session.id,
        session.user_id,
        session.organization_id,
        session.team_id,
        session.status,
        JSON.stringify(session.conversation_context),
        JSON.stringify(session.business_context),
        session.research_plan ? JSON.stringify(session.research_plan) : null,
        session.created_at,
        session.completed_at,
        session.consultation_quality_score
      ]);
    }
  }

  // Helper methods for research plan generation
  private extractResearchAngles(bc: BusinessContext): string[] {
    return bc.research_objectives.map(obj => obj.objective_type);
  }

  private determinePrioritySources(_bc: BusinessContext): string[] {
    return ['linkedin', 'company_website', 'news', 'financial_data'];
  }

  private generateCoordinatorBriefing(session: ConsultationSession): string {
    return `Mack's briefing: ${session.business_context.sales_context.primary_pain_point}. Focus on ${session.business_context.research_objectives.map(obj => obj.objective_type).join(', ')}.`;
  }

  private extractResearchPriorities(bc: BusinessContext): string[] {
    return bc.research_objectives
      .filter(obj => obj.priority_level === 'critical')
      .map(obj => obj.objective_type);
  }

  private extractDetectiveFocus(_bc: BusinessContext): string[] {
    return ['competitive_analysis', 'decision_maker_insights', 'strategic_initiatives'];
  }

  private generateContextHandoff(session: ConsultationSession): string {
    return `Consultation insights: ${session.business_context.sales_context.primary_pain_point}`;
  }

  private extractQualityFocus(_bc: BusinessContext): string[] {
    return ['business_relevance', 'actionable_insights', 'strategic_value'];
  }

  private estimateResearchTime(bc: BusinessContext): number {
    return bc.complexity_assessment.estimated_research_time;
  }

  private generateInsightsSummary(session: ConsultationSession): string {
    return `Mack identified key focus areas: ${session.business_context.research_objectives.map(obj => obj.objective_type).join(', ')}`;
  }

  private extractOrganizationFocus(bc: BusinessContext): string {
    return `${bc.sales_context.solution_category} solution for ${bc.target_company.industry} market`;
  }

  private generateAdditionalContext(bc: BusinessContext): string {
    return `Sales stage: ${bc.sales_context.sales_stage}. Strategic importance: ${bc.strategic_context.strategic_importance}`;
  }

  private generateConsultationContext(session: ConsultationSession): string {
    return `Mack consultation completed with ${session.conversation_context.user_responses.length} interaction rounds`;
  }

  private generateMackBriefing(session: ConsultationSession): string {
    const industryContext = this.getIndustryIntelligenceContext(session.business_context.industry_context.industry_vertical);
    return `Mack's Strategic Assessment: ${session.business_context.sales_context.primary_pain_point} represents ${this.assessOpportunityValue(session)} opportunity for ${session.business_context.target_company.company_name}. ${industryContext} Focus areas: ${session.business_context.research_objectives.filter(obj => obj.priority_level === 'critical').map(obj => obj.objective_type).join(', ')}.`;
  }

  /**
   * Provide industry-specific intelligence context
   */
  private getIndustryIntelligenceContext(industry: string): string {
    const industryGuidance: { [key: string]: string } = {
      'technology': 'Tech sector requires focus on innovation cycles, technical stack analysis, and competitive positioning in rapidly evolving markets.',
      'financial-services': 'Financial sector intelligence priorities: regulatory compliance positioning, risk management frameworks, and competitive service offerings.',
      'healthcare': 'Healthcare sector analysis: regulatory environment navigation, patient outcome focus, and technology adoption patterns.',
      'manufacturing': 'Industrial sector intelligence: supply chain resilience, operational efficiency metrics, and market positioning strategies.',
      'retail': 'Retail sector priorities: customer experience differentiation, digital transformation progress, and competitive market positioning.',
      'professional-services': 'Professional services focus: client relationship management, service delivery excellence, and competitive capability assessment.'
    };
    
    return industryGuidance[industry.toLowerCase()] || 'Cross-industry analysis requires focus on market positioning, competitive advantages, and strategic business priorities.';
  }

  /**
   * Assess opportunity value based on business context
   */
  private assessOpportunityValue(session: ConsultationSession): string {
    const strategicImportance = session.business_context.strategic_context.strategic_importance;
    const urgencyLevel = session.business_context.urgency_level;
    
    if (strategicImportance === 'key_account' || urgencyLevel === 'urgent') {
      return 'high-value strategic';
    } else if (strategicImportance === 'expansion_target' || urgencyLevel === 'high') {
      return 'significant expansion';
    } else if (strategicImportance === 'competitive_win') {
      return 'critical competitive';
    }
    
    return 'standard business';
  }

  /**
   * Convert consultation OptimizedUserInput to AgentTypes OptimizedUserInput for 3-agent system
   */
  convertToAgentSystemInput(consultationInput: OptimizedUserInput): import('../../interfaces/AgentTypes').OptimizedUserInput {
    return {
      companyName: consultationInput.companyName,
      companyUrl: consultationInput.companyUrl,
      linkedinUrl: consultationInput.linkedinUrl,
      vendorName: consultationInput.vendorName,
      productName: consultationInput.productName,
      industry: consultationInput.industry,
      primaryPainPoint: consultationInput.primaryPainPoint,
      additionalContext: consultationInput.additionalContext,
      priority: 'standard',
      outputFormat: 'full',
      confidenceThreshold: 'medium',
      competitorAnalysis: true,
      budgetIntelligence: true,
      technologyStackFocus: consultationInput.strategic_research_focus?.includes('technology_stack') || false,
      // Phase 2: Consultation Integration Fields
      consultation_derived_context: consultationInput.consultation_derived_context,
      strategic_research_focus: consultationInput.strategic_research_focus,
      priority_intelligence_areas: consultationInput.priority_intelligence_areas,
      business_context_signals: consultationInput.business_context_signals,
      mack_briefing_summary: consultationInput.mack_briefing_summary,
      consultation_session_id: `consultation_${Date.now()}`
    };
  }

  private async calculateQualityScore(session: ConsultationSession): Promise<number> {
    try {
      let score = 0;
      let maxScore = 0;
      
      // Business context completeness (40 points)
      maxScore += 40;
      const businessContext = session.business_context;
      if (businessContext?.target_company?.company_name) score += 10;
      if (businessContext?.target_company?.industry) score += 10;
      if (businessContext?.sales_context?.primary_pain_point) score += 10;
      if (businessContext?.strategic_context?.strategic_importance) score += 10;
      
      // Conversation flow completeness (30 points)
      maxScore += 30;
      const conversationSteps = session.conversation_context?.conversation_flow?.length || 0;
      if (conversationSteps >= 3) score += 10;
      if (conversationSteps >= 5) score += 10;
      if (session.status === 'completed') score += 10;
      
      // Research plan quality (30 points)
      maxScore += 30;
      if (session.research_plan?.research_strategy?.primary_research_angles?.length) {
        const areas = session.research_plan.research_strategy.primary_research_angles.length;
        if (areas >= 3) score += 10;
        if (areas >= 5) score += 10;
        if (session.research_plan.success_metrics?.length) score += 10;
      }
      
      return maxScore > 0 ? score / maxScore : 0.85;
      
    } catch (error) {
      console.error('❌ Quality score calculation error:', error);
      return 0.85;
    }
  }

  // Phase 3: Analytics and Performance Tracking Methods
  async trackConversationMetrics(sessionId: string): Promise<void> {
    try {
      const session = await this.getConsultationSession(sessionId);
      if (!session) return;
      
      const metrics = {
        conversation_length: session.conversation_context?.conversation_flow?.length || 0,
        business_context_completeness: this.calculateContextCompleteness(session.business_context),
        ai_interaction_count: this.countAIInteractions(session),
        research_relevance_score: await this.calculateResearchRelevance(session),
        user_satisfaction_predicted: await this.predictUserSatisfaction(session)
      };
      
      // Store analytics data
      await this.getDbManager().execute(`
        INSERT OR REPLACE INTO consultation_analytics (
          session_id, conversation_length, business_context_completeness,
          ai_interaction_count, research_relevance_score, user_satisfaction_predicted,
          tracked_at
        ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
      `, [
        sessionId,
        metrics.conversation_length,
        metrics.business_context_completeness,
        metrics.ai_interaction_count,
        metrics.research_relevance_score,
        metrics.user_satisfaction_predicted
      ]);
      
      console.log('📊 Consultation metrics tracked:', metrics);
      
    } catch (error) {
      console.error('❌ Analytics tracking error:', error);
    }
  }

  private calculateContextCompleteness(businessContext: BusinessContext): number {
    if (!businessContext) return 0;
    
    let completeness = 0;
    let totalFields = 0;
    
    // Target company completeness
    totalFields += 3;
    if (businessContext.target_company?.company_name) completeness += 1;
    if (businessContext.target_company?.industry) completeness += 1;
    if (businessContext.target_company?.company_size) completeness += 1;
    
    // Sales context completeness
    totalFields += 3;
    if (businessContext.sales_context?.primary_pain_point) completeness += 1;
    if (businessContext.sales_context?.solution_category) completeness += 1;
    if (businessContext.sales_context?.value_proposition) completeness += 1;
    
    // Strategic context completeness
    totalFields += 2;
    if (businessContext.strategic_context?.strategic_importance) completeness += 1;
    if (businessContext.strategic_context?.organizational_relationship) completeness += 1;
    
    return totalFields > 0 ? completeness / totalFields : 0;
  }

  private countAIInteractions(session: ConsultationSession): number {
    // Count intent classifications, context extractions, and response generations
    return (session.conversation_context?.conversation_flow?.length || 0) * 2; // Approximate AI interactions per step
  }

  private async calculateResearchRelevance(session: ConsultationSession): Promise<number> {
    try {
      if (!session.research_plan?.research_strategy?.primary_research_angles) return 0.5;
      
      // Calculate relevance based on business context alignment
      const businessContext = session.business_context;
      const researchAreas = session.research_plan.research_strategy.primary_research_angles;
      
      let relevanceScore = 0;
      const maxRelevance = researchAreas.length;
      
      for (const area of researchAreas) {
        // Check if research area aligns with business context
        if (businessContext?.sales_context?.primary_pain_point && 
            area.toLowerCase().includes(businessContext.sales_context.primary_pain_point.toLowerCase())) {
          relevanceScore += 1;
        } else if (businessContext?.target_company?.industry &&
                   area.toLowerCase().includes(businessContext.target_company.industry.toLowerCase())) {
          relevanceScore += 0.7;
        } else {
          relevanceScore += 0.5; // Default relevance
        }
      }
      
      return maxRelevance > 0 ? Math.min(relevanceScore / maxRelevance, 1) : 0.5;
      
    } catch (error) {
      console.error('❌ Research relevance calculation error:', error);
      return 0.5;
    }
  }

  private async predictUserSatisfaction(session: ConsultationSession): Promise<number> {
    try {
      // Predictive model based on conversation patterns
      let satisfaction = 0.5;
      
      // Conversation completeness factor
      if (session.status === 'completed') satisfaction += 0.2;
      
      // Business context quality factor
      const contextCompleteness = this.calculateContextCompleteness(session.business_context);
      satisfaction += (contextCompleteness * 0.3);
      
      // Research plan quality factor
      if (session.research_plan?.research_strategy?.primary_research_angles?.length) {
        const researchQuality = Math.min(session.research_plan.research_strategy.primary_research_angles.length / 5, 1);
        satisfaction += (researchQuality * 0.2);
      }
      
      // Conversation flow smoothness (fewer steps = smoother)
      const conversationLength = session.conversation_context?.conversation_flow?.length || 0;
      if (conversationLength <= 6) satisfaction += 0.1;
      
      return Math.min(satisfaction, 1);
      
    } catch (error) {
      console.error('❌ User satisfaction prediction error:', error);
      return 0.75; // Default optimistic prediction
    }
  }

  // Phase 3 Week 7: Advanced A/B Testing Framework
  async getOptimizationVariant(userId: string, testName: string = 'consultation_experience'): Promise<ABTestVariant> {
    try {
      // Load A/B test configuration
      const testConfig = await this.getABTestConfiguration(testName);
      
      // Deterministic assignment based on user ID and test
      const hash = this.simpleHash(`${userId}_${testName}`);
      const assignment = hash % 100; // 0-99 percentile
      
      // Assign based on traffic allocation
      let cumulativeWeight = 0;
      for (const variant of testConfig.variants) {
        cumulativeWeight += variant.trafficAllocation;
        if (assignment < cumulativeWeight) {
          // Record assignment for analytics
          await this.recordABTestAssignment(userId, testName, variant.name);
          return variant;
        }
      }
      
      // Fallback to control
      const controlVariant = testConfig.variants.find(v => v.name === 'control') || testConfig.variants[0];
      await this.recordABTestAssignment(userId, testName, controlVariant.name);
      return controlVariant;
      
    } catch (error) {
      console.error('❌ A/B variant assignment error:', error);
      return {
        name: 'control',
        trafficAllocation: 100,
        features: {
          aiIntentClassification: false,
          aiContextExtraction: false,
          dynamicResponseGeneration: false,
          advancedAnalytics: false,
          conversationOptimization: false
        }
      };
    }
  }

  private async getABTestConfiguration(testName: string): Promise<ABTestConfiguration> {
    // In production, this would load from database or feature flag service
    const configurations: Record<string, ABTestConfiguration> = {
      consultation_experience: {
        name: 'consultation_experience',
        status: 'active',
        variants: [
          {
            name: 'control',
            trafficAllocation: 34,
            features: {
              aiIntentClassification: false,
              aiContextExtraction: false,
              dynamicResponseGeneration: false,
              advancedAnalytics: false,
              conversationOptimization: false
            }
          },
          {
            name: 'ai_enhanced',
            trafficAllocation: 33,
            features: {
              aiIntentClassification: true,
              aiContextExtraction: true,
              dynamicResponseGeneration: false,
              advancedAnalytics: true,
              conversationOptimization: false
            }
          },
          {
            name: 'conversation_optimized',
            trafficAllocation: 33,
            features: {
              aiIntentClassification: true,
              aiContextExtraction: true,
              dynamicResponseGeneration: true,
              advancedAnalytics: true,
              conversationOptimization: true
            }
          }
        ]
      }
    };

    return configurations[testName] || configurations['consultation_experience'];
  }

  private async recordABTestAssignment(userId: string, testName: string, variant: string): Promise<void> {
    try {
      await this.getDbManager().execute(`
        INSERT OR REPLACE INTO ab_test_assignments (
          user_id, test_name, variant_name, assigned_at, session_count
        ) VALUES (?, ?, ?, datetime('now'), COALESCE(
          (SELECT session_count FROM ab_test_assignments WHERE user_id = ? AND test_name = ?), 0
        ) + 1)
      `, [userId, testName, variant, userId, testName]);
    } catch (error) {
      console.error('❌ A/B test assignment recording error:', error);
    }
  }

  // Phase 3 Week 7: Conversation Optimization Engine
  async optimizeConversationFlow(session: ConsultationSession, variant: ABTestVariant): Promise<ConversationOptimizations> {
    try {
      const optimizations: ConversationOptimizations = {
        skipGreeting: false,
        industryFocusedQuestions: false,
        acceleratedContext: false,
        smartDefaults: false,
        proactiveValidation: false
      };

      if (!variant.features.conversationOptimization) {
        return optimizations;
      }

      // Analyze user patterns and session context
      const userHistory = await this.getUserConsultationHistory(session.user_id);
      const contextCompleteness = this.calculateContextCompleteness(session.business_context);

      // Skip greeting for returning users
      if (userHistory.length > 2) {
        optimizations.skipGreeting = true;
      }

      // Industry-focused questions if we have context
      if (session.business_context?.target_company?.industry) {
        optimizations.industryFocusedQuestions = true;
      }

      // Accelerate context gathering for experienced users
      if (userHistory.length > 0 && contextCompleteness > 0.7) {
        optimizations.acceleratedContext = true;
      }

      // Smart defaults based on user patterns
      if (userHistory.length >= 3) {
        optimizations.smartDefaults = true;
      }

      // Proactive validation for high-value conversations
      if (session.business_context?.strategic_context?.strategic_importance === 'key_account') {
        optimizations.proactiveValidation = true;
      }

      return optimizations;

    } catch (error) {
      console.error('❌ Conversation optimization error:', error);
      return {
        skipGreeting: false,
        industryFocusedQuestions: false,
        acceleratedContext: false,
        smartDefaults: false,
        proactiveValidation: false
      };
    }
  }

  private async getUserConsultationHistory(userId: string): Promise<ConsultationSession[]> {
    try {
      const result = await this.getDbManager().query(`
        SELECT * FROM consultation_sessions 
        WHERE user_id = ? AND status = 'completed'
        ORDER BY created_at DESC
        LIMIT 10
      `, [userId]);
      
      return result?.map((row: any) => ({
        ...row,
        conversation_context: JSON.parse(row.conversation_context || '{}'),
        business_context: JSON.parse(row.business_context || '{}'),
        research_plan: row.research_plan ? JSON.parse(row.research_plan) : null
      })) || [];
    } catch (error) {
      console.error('❌ User history retrieval error:', error);
      return [];
    }
  }

  // Phase 3 Week 7: Real-time Performance Monitoring
  async trackABTestPerformance(userId: string, testName: string, event: ABTestEvent): Promise<void> {
    try {
      await this.getDbManager().execute(`
        INSERT INTO ab_test_events (
          user_id, test_name, variant_name, event_type, event_data, 
          session_id, timestamp
        ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
      `, [
        userId,
        testName,
        event.variantName,
        event.eventType,
        JSON.stringify(event.eventData),
        event.sessionId
      ]);

      // Real-time analytics aggregation
      if (event.eventType === 'conversion') {
        await this.updateConversionMetrics(testName, event.variantName);
      }

    } catch (error) {
      console.error('❌ A/B test performance tracking error:', error);
    }
  }

  private async updateConversionMetrics(testName: string, variantName: string): Promise<void> {
    try {
      await this.getDbManager().execute(`
        INSERT OR REPLACE INTO ab_test_metrics (
          test_name, variant_name, total_users, conversions, conversion_rate, last_updated
        ) SELECT 
          ?, 
          ?, 
          COUNT(DISTINCT user_id),
          COUNT(CASE WHEN event_type = 'conversion' THEN 1 END),
          ROUND(
            CAST(COUNT(CASE WHEN event_type = 'conversion' THEN 1 END) AS FLOAT) / 
            COUNT(DISTINCT user_id) * 100, 2
          ),
          datetime('now')
        FROM ab_test_events 
        WHERE test_name = ? AND variant_name = ?
      `, [testName, variantName, testName, variantName]);
    } catch (error) {
      console.error('❌ Conversion metrics update error:', error);
    }
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}
