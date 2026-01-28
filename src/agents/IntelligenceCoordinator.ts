/**
 * ProspectPI Intelligence Theater - Intelligence Coordinator Agent
 * Story 1.1: Three-Agent Orchestration System
 * 
 * Agent 1: Intelligence Coordinator
 * - Model: Claude 3.5 Sonnet (claude-3-5-sonnet-20241022) ✅ OPTIMIZED
 * - Temperature: 0.1 (conservative for quality control)
 * - Role: Orchestration + Quality Assurance + User Interaction
 * - Performance: 2x faster than Claude 3 Opus, improved reasoning
 */

import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { ApiConfig } from '../config/ApiConfig';
import { 
  AgentProgress, 
  AgentContext, 
  QualityGate, 
  OptimizedUserInput,
  AgentError 
} from '../interfaces/AgentTypes';
import { v4 as uuidv4 } from 'uuid';

export class IntelligenceCoordinator {
  private anthropic: Anthropic | null = null;
  private openai: OpenAI | null = null;
  private modelType: 'anthropic' | 'openai';
  private context: AgentContext | null = null;
  private progressCallback: ((progress: AgentProgress) => void) | undefined;

  constructor(progressCallback?: (progress: AgentProgress) => void) {
    // Dynamically select API client based on model
    const model = ApiConfig.INTELLIGENCE_COORDINATOR_MODEL;
    
    if (model.startsWith('claude-')) {
      this.modelType = 'anthropic';
      this.anthropic = new Anthropic({
        apiKey: ApiConfig.ANTHROPIC_API_KEY,
      });
    } else if (model.startsWith('gpt-')) {
      this.modelType = 'openai';
      this.openai = new OpenAI({
        apiKey: ApiConfig.OPENAI_API_KEY,
      });
    } else {
      throw new Error(`Unsupported model: ${model}. Must start with 'claude-' or 'gpt-'`);
    }
    
    this.progressCallback = progressCallback;
  }

  /**
   * Initialize a new intelligence gathering mission
   */
  async initializeMission(userInput: OptimizedUserInput): Promise<AgentContext> {
    const requestId = uuidv4();
    
    this.context = {
      requestId,
      userInput,
      qualityGates: [],
      startTime: new Date()
    };

    await this.updateProgress({
      stage: 'planning',
      agent: 'coordinator',
      message: `Initializing intelligence mission for ${userInput.companyName}`,
      confidence: 0.9,
      estimatedTimeRemaining: 180,
      userCanInterrupt: true,
      timestamp: new Date()
    });

    return this.context;
  }

  /**
   * Create comprehensive workflow plan for the intelligence mission
   */
  async createWorkflowPlan(): Promise<{
    plan: string;
    qualityGates: QualityGate[];
    estimatedCost: number;
    estimatedDuration: number;
  }> {
    if (!this.context) {
      throw new Error('Mission context not initialized. Call initializeMission first.');
    }

    await this.updateProgress({
      stage: 'planning',
      agent: 'coordinator',
      message: 'Analyzing requirements and creating workflow plan...',
      confidence: 0.8,
      estimatedTimeRemaining: 165,
      userCanInterrupt: true,
      timestamp: new Date()
    });

    const prompt = `You are the Intelligence Coordinator for a three-agent intelligence system. 
    Create a comprehensive workflow plan for gathering intelligence on "${this.context.userInput.companyName}".

    User Input:
    - Company: ${this.context.userInput.companyName}
    - Additional Context: ${this.context.userInput.additionalContext || 'None provided'}
    - Priority: ${this.context.userInput.priority}
    - Output Format: ${this.context.userInput.outputFormat}
    - Confidence Threshold: ${this.context.userInput.confidenceThreshold}

    Create a detailed plan that includes:
    1. Data collection strategy for Field Researcher
    2. Analysis priorities for Intelligence Detective
    3. Quality gates and validation checkpoints
    4. Cost optimization strategy (target: $${ApiConfig.COST_TARGET_PER_DOSSIER}/dossier)
    5. Risk mitigation for API failures

    Respond in JSON format:
    {
      "workflowPlan": "detailed step-by-step plan",
      "dataSourcePriority": ["source1", "source2", ...],
      "qualityGates": [
        {
          "name": "gate name",
          "criteria": "validation criteria",
          "confidenceThreshold": 0.8
        }
      ],
      "estimatedCost": 0.65,
      "estimatedDuration": 150,
      "riskMitigation": "fallback strategies"
    }`;

    try {
      let planText: string;
      
      if (this.modelType === 'anthropic' && this.anthropic) {
        const response = await this.anthropic.messages.create({
          model: ApiConfig.INTELLIGENCE_COORDINATOR_MODEL,
          max_tokens: 2000,
          temperature: ApiConfig.INTELLIGENCE_COORDINATOR_TEMPERATURE,
          messages: [{
            role: 'user',
            content: prompt
          }]
        });
        planText = response.content[0].type === 'text' ? response.content[0].text : '';
      } else if (this.modelType === 'openai' && this.openai) {
        const response = await this.openai.chat.completions.create({
          model: ApiConfig.INTELLIGENCE_COORDINATOR_MODEL,
          max_tokens: 2000,
          temperature: ApiConfig.INTELLIGENCE_COORDINATOR_TEMPERATURE,
          messages: [{
            role: 'user',
            content: prompt
          }],
          response_format: { type: 'json_object' }
        });
        planText = response.choices[0]?.message?.content || '';
      } else {
        throw new Error('API client not initialized');
      }

      const planData = JSON.parse(planText);

      // Create quality gates from the plan
      const qualityGates: QualityGate[] = planData.qualityGates.map((gate: any) => ({
        name: gate.name,
        passed: false,
        confidence: 0,
        validationMessage: '',
        timestamp: new Date()
      }));

      this.context.qualityGates = qualityGates;

      await this.updateProgress({
        stage: 'planning',
        agent: 'coordinator',
        message: 'Workflow plan created successfully',
        confidence: 0.95,
        estimatedTimeRemaining: planData.estimatedDuration,
        userCanInterrupt: false,
        timestamp: new Date()
      });

      return {
        plan: planData.workflowPlan,
        qualityGates,
        estimatedCost: planData.estimatedCost,
        estimatedDuration: planData.estimatedDuration
      };

    } catch (error: any) {
      await this.handleError({
        agent: 'coordinator',
        error: `Workflow planning failed: ${error.message}`,
        recoverable: true,
        timestamp: new Date(),
        context: { userInput: this.context.userInput }
      });
      throw error;
    }
  }

  /**
   * Validate quality gate with Claude analysis
   */
  async validateQualityGate(
    gateName: string, 
    data: any, 
    criteria: string
  ): Promise<QualityGate> {
    await this.updateProgress({
      stage: 'analyzing',
      agent: 'coordinator',
      message: `Validating quality gate: ${gateName}`,
      confidence: 0.7,
      estimatedTimeRemaining: 30,
      userCanInterrupt: false,
      timestamp: new Date()
    });

    const prompt = `You are validating a quality gate for intelligence data.

    Gate: ${gateName}
    Criteria: ${criteria}
    Data to validate: ${JSON.stringify(data, null, 2)}

    Evaluate if the data meets the quality criteria. Consider:
    1. Data completeness
    2. Source reliability
    3. Information accuracy
    4. Relevance to the intelligence mission

    Respond in JSON format:
    {
      "passed": true/false,
      "confidence": 0.0-1.0,
      "validationMessage": "detailed explanation",
      "recommendations": "improvement suggestions if needed"
    }`;

    try {
      let validationText: string;
      
      if (this.modelType === 'anthropic' && this.anthropic) {
        const response = await this.anthropic.messages.create({
          model: ApiConfig.INTELLIGENCE_COORDINATOR_MODEL,
          max_tokens: 1000,
          temperature: ApiConfig.INTELLIGENCE_COORDINATOR_TEMPERATURE,
          messages: [{
            role: 'user',
            content: prompt
          }]
        });
        validationText = response.content[0].type === 'text' ? response.content[0].text : '';
      } else if (this.modelType === 'openai' && this.openai) {
        const response = await this.openai.chat.completions.create({
          model: ApiConfig.INTELLIGENCE_COORDINATOR_MODEL,
          max_tokens: 1000,
          temperature: ApiConfig.INTELLIGENCE_COORDINATOR_TEMPERATURE,
          messages: [{
            role: 'user',
            content: prompt
          }],
          response_format: { type: 'json_object' }
        });
        validationText = response.choices[0]?.message?.content || '';
      } else {
        throw new Error('API client not initialized');
      }

      const validation = JSON.parse(validationText);

      const qualityGate: QualityGate = {
        name: gateName,
        passed: validation.passed,
        confidence: validation.confidence,
        validationMessage: validation.validationMessage,
        timestamp: new Date()
      };

      // Update context with validated gate
      if (this.context) {
        const gateIndex = this.context.qualityGates.findIndex(g => g.name === gateName);
        if (gateIndex !== -1) {
          this.context.qualityGates[gateIndex] = qualityGate;
        }
      }

      return qualityGate;

    } catch (error: any) {
      await this.handleError({
        agent: 'coordinator',
        error: `Quality gate validation failed: ${error.message}`,
        recoverable: true,
        timestamp: new Date(),
        context: { gateName, criteria }
      });
      
      return {
        name: gateName,
        passed: false,
        confidence: 0,
        validationMessage: `Validation failed: ${error.message}`,
        timestamp: new Date()
      };
    }
  }

  /**
   * Perform final quality assurance on completed dossier
   */
  async performFinalQA(dossierData: any): Promise<{
    approved: boolean;
    confidence: number;
    feedback: string;
    qualityScore: number;
  }> {
    await this.updateProgress({
      stage: 'synthesizing',
      agent: 'coordinator',
      message: 'Performing final quality assurance review...',
      confidence: 0.9,
      estimatedTimeRemaining: 45,
      userCanInterrupt: false,
      timestamp: new Date()
    });

    const prompt = `You are performing final quality assurance on an intelligence dossier.

    Dossier Data: ${JSON.stringify(dossierData, null, 2)}

    CRITICAL: This is REAL intelligence generation. Judge based on PRACTICAL business value, not perfection.

    Quality Standards for APPROVAL (confidence 0.6+):
    - Has 3+ distinct intelligence sections with real content
    - Provides actionable insights for sales/business use
    - Contains specific company information (not generic templates)
    - Shows clear value for sales meeting preparation
    - Sources and confidence levels are reasonable

    Quality Standards for HIGH CONFIDENCE (0.8+):
    - Has 6+ comprehensive intelligence sections
    - Rich, specific insights about company/industry/technology
    - Clear competitive positioning and opportunities
    - Detailed stakeholder and organizational intelligence
    - Strong source diversity and validation

    TARGET: ProspectPI customers pay $50+ and expect intelligence that helps them WIN DEALS.
    REJECT only if dossier is truly empty, generic, or completely unusable.

    Current dossier has ${Object.keys(dossierData).length} main sections. Judge accordingly.

    Respond in JSON format:
    {
      "approved": true/false,
      "confidence": 0.0-1.0,
      "qualityScore": 0.0-1.0,
      "feedback": "detailed quality assessment focusing on business value",
      "improvements": ["suggestion1", "suggestion2"],
      "costEfficiency": "cost analysis vs target"
    }`;

    try {
      let qaText: string;
      
      if (this.modelType === 'anthropic' && this.anthropic) {
        const response = await this.anthropic.messages.create({
          model: ApiConfig.INTELLIGENCE_COORDINATOR_MODEL,
          max_tokens: 1500,
          temperature: ApiConfig.INTELLIGENCE_COORDINATOR_TEMPERATURE,
          messages: [{
            role: 'user',
            content: prompt
          }]
        });
        qaText = response.content[0].type === 'text' ? response.content[0].text : '';
      } else if (this.modelType === 'openai' && this.openai) {
        const response = await this.openai.chat.completions.create({
          model: ApiConfig.INTELLIGENCE_COORDINATOR_MODEL,
          max_tokens: 1500,
          temperature: ApiConfig.INTELLIGENCE_COORDINATOR_TEMPERATURE,
          messages: [{
            role: 'user',
            content: prompt
          }],
          response_format: { type: 'json_object' }
        });
        qaText = response.choices[0]?.message?.content || '';
      } else {
        throw new Error('API client not initialized');
      }

      const qaResult = JSON.parse(qaText);

      return {
        approved: qaResult.approved,
        confidence: qaResult.confidence,
        feedback: qaResult.feedback,
        qualityScore: qaResult.qualityScore
      };

    } catch (error: any) {
      await this.handleError({
        agent: 'coordinator',
        error: `Final QA failed: ${error.message}`,
        recoverable: false,
        timestamp: new Date(),
        context: { dossierSummary: 'QA validation attempt' }
      });
      
      return {
        approved: false,
        confidence: 0,
        feedback: `Quality assurance failed: ${error.message}`,
        qualityScore: 0
      };
    }
  }

  /**
   * Update progress and notify callback if provided
   */
  private async updateProgress(progress: AgentProgress): Promise<void> {
    if (this.progressCallback) {
      this.progressCallback(progress);
    }
  }

  /**
   * Handle agent errors with recovery strategies
   */
  private async handleError(error: AgentError): Promise<void> {
    console.error(`[Intelligence Coordinator Error] ${error.error}`, error.context);
    
    if (this.progressCallback) {
      this.progressCallback({
        stage: 'planning',
        agent: 'coordinator',
        message: `Error: ${error.error}`,
        confidence: 0,
        estimatedTimeRemaining: 0,
        userCanInterrupt: true,
        timestamp: new Date()
      });
    }
  }

  /**
   * Get current mission context
   */
  getContext(): AgentContext | null {
    return this.context;
  }

  /**
   * Reset coordinator for new mission
   */
  reset(): void {
    this.context = null;
  }
}