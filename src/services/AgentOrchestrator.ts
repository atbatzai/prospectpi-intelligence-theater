/**
 * ProspectPI Intelligence Theater - Agent Orchestration Service
 * Story 1.1: Three-Agent Orchestration System (Enhanced to 4-Agent for Epic 2.4)
 * 
 * Orchestrates the four-agent intelligence system:
 * 1. Intelligence Coordinator (planning & QA)
 * 2. Field Intelligence Researcher (data collection)
 * 3. Prospect Intelligence Detective (analysis & synthesis)
 * 4. Cultural Intelligence Agent (cultural adaptation)
 */

import { IntelligenceCoordinator } from '../agents/IntelligenceCoordinator';
import { FieldIntelligenceResearcher } from '../agents/FieldIntelligenceResearcher';
import { ProspectIntelligenceDetective } from '../agents/ProspectIntelligenceDetective';
import { CulturalIntelligenceAgent } from '../agents/CulturalIntelligenceAgent';
import { 
  OptimizedUserInput, 
  AgentProgress, 
  DossierResult, 
  QualityGate,
  AgentError
} from '../interfaces/AgentTypes';

export interface OrchestrationResult {
  success: boolean;
  dossier?: DossierResult;
  error?: string;
  totalCost: number;
  executionTime: number;
  qualityGates: QualityGate[];
  agentProgress: AgentProgress[];
  culturalAdaptation?: any;
}

export class AgentOrchestrator {
  private coordinator: IntelligenceCoordinator;
  private researcher: FieldIntelligenceResearcher;
  private detective: ProspectIntelligenceDetective;
  private culturalAgent: CulturalIntelligenceAgent;
  private progressHistory: AgentProgress[] = [];
  private progressCallback: ((progress: AgentProgress) => void) | undefined;

  constructor(progressCallback?: (progress: AgentProgress) => void) {
    this.progressCallback = progressCallback;
    
    // Initialize agents with progress tracking
    this.coordinator = new IntelligenceCoordinator(this.trackProgress.bind(this));
    this.researcher = new FieldIntelligenceResearcher(this.trackProgress.bind(this));
    this.detective = new ProspectIntelligenceDetective(this.trackProgress.bind(this));
    this.culturalAgent = new CulturalIntelligenceAgent(this.trackProgress.bind(this));
  }

  /**
   * Check if the input contains consultation-derived context
   */
  private hasConsultationContext(userInput: OptimizedUserInput): boolean {
    return !!(
      userInput.consultation_derived_context ||
      userInput.strategic_research_focus?.length ||
      userInput.priority_intelligence_areas?.length ||
      userInput.mack_briefing_summary
    );
  }

  /**
   * Execute complete three-agent intelligence workflow with consultation awareness
   */
  async executeIntelligenceMission(userInput: OptimizedUserInput): Promise<OrchestrationResult> {
    const startTime = Date.now();
    this.progressHistory = [];
    const isConsultationDerived = this.hasConsultationContext(userInput);

    try {
      // Phase 1: Intelligence Coordinator - Mission Planning (Consultation-Enhanced)
      const initialMessage = isConsultationDerived 
        ? 'Orchestrator processing Mack\'s strategic consultation briefing'
        : 'Orchestrator initializing three-agent intelligence mission';

      await this.trackProgress({
        stage: 'planning',
        agent: 'coordinator',
        message: initialMessage,
        confidence: isConsultationDerived ? 0.95 : 0.9, // Higher confidence with consultation
        estimatedTimeRemaining: isConsultationDerived ? 180 : 240, // Faster with consultation context
        userCanInterrupt: true,
        timestamp: new Date()
      });

      const context = await this.coordinator.initializeMission(userInput);
      const workflowPlan = await this.coordinator.createWorkflowPlan();

      // Quality Gate 1: Plan Validation
      const planValidation = await this.coordinator.validateQualityGate(
        'Mission Planning',
        { plan: workflowPlan.plan, estimatedCost: workflowPlan.estimatedCost },
        'Plan completeness, cost efficiency, and feasibility'
      );

      if (!planValidation.passed && userInput.confidenceThreshold === 'high') {
        throw new Error(`Mission planning failed quality gate: ${planValidation.validationMessage}`);
      }

      // Phase 2: Field Intelligence Researcher - Data Collection (Consultation-Enhanced)
      const researchMessage = isConsultationDerived
        ? 'Field Researcher activated with Mack\'s strategic intelligence priorities'
        : 'Handoff to Field Intelligence Researcher initiated';

      await this.trackProgress({
        stage: 'researching',
        agent: 'coordinator',
        message: `${researchMessage} (Enhanced 10-source intelligence gathering)`,
        confidence: planValidation.confidence,
        estimatedTimeRemaining: isConsultationDerived 
          ? Math.floor(workflowPlan.estimatedDuration * 0.8) // 20% faster with consultation
          : workflowPlan.estimatedDuration + 30, // Additional time for social intelligence
        userCanInterrupt: false,
        timestamp: new Date()
      });

      await this.researcher.initializeResearch(context);
      const researchData = await this.researcher.gatherIntelligence();

      // Quality Gate 2: Data Collection Validation (4-source system)
      const dataValidation = await this.coordinator.validateQualityGate(
        'Data Collection',
        { 
          sourcesCount: researchData.length,
          averageConfidence: researchData.reduce((sum, r) => sum + r.confidence, 0) / researchData.length,
          totalCost: (this.researcher as any).getTotalCost(),
          withinCostTarget: (this.researcher as any).isWithinCostTarget()
        },
        'Data completeness, source diversity, and cost efficiency (4-source system)'
      );

      if (!dataValidation.passed && userInput.confidenceThreshold === 'high') {
        throw new Error(`Data collection failed quality gate: ${dataValidation.validationMessage}`);
      }

      // Phase 3: Prospect Intelligence Detective - Analysis & Synthesis (Consultation-Enhanced)
      const detectiveMessage = isConsultationDerived
        ? 'Intelligence Detective analyzing data with Mack\'s strategic focus areas'
        : 'Handoff to Prospect Intelligence Detective initiated';

      await this.trackProgress({
        stage: 'analyzing',
        agent: 'coordinator',
        message: detectiveMessage,
        confidence: dataValidation.confidence,
        estimatedTimeRemaining: isConsultationDerived ? 70 : 90, // Faster with focused analysis
        userCanInterrupt: false,
        timestamp: new Date()
      });

      await this.detective.initializeAnalysis(context, researchData);
      const dossier = await this.detective.analyzeIntelligence(researchData);

      // Phase 4: Cultural Intelligence Agent - Cultural Adaptation (Epic 2.4)
      await this.trackProgress({
        stage: 'analyzing',
        agent: 'coordinator',
        message: 'Cultural Intelligence Agent adapting dossier for target market...',
        confidence: dossier.confidenceScore * 0.95, // Slight confidence adjustment for cultural processing
        estimatedTimeRemaining: 25, // Cultural processing adds ~2 seconds as per requirement
        userCanInterrupt: false,
        timestamp: new Date()
      });

      // Initialize cultural processing
      await this.culturalAgent.initializeCulturalProcessing(context);
      
      // Extract company domain from input or generate from company name
      const companyDomain = userInput.companyName.toLowerCase().replace(/\s+/g, '') + '.com';
      const culturalAdaptation = await this.culturalAgent.adaptDossierForCulture(dossier, companyDomain);

      // Apply cultural adaptations to dossier
      if (culturalAdaptation.adaptedSections) {
        dossier.structuredSections.executiveSummary.summary = culturalAdaptation.adaptedSections.executiveSummary || dossier.structuredSections.executiveSummary.summary;
        // Store cultural variant in metadata for A/B testing
        (dossier as any).culturalAdaptation = culturalAdaptation;
      }

      // Phase 5: Intelligence Coordinator - Final Quality Assurance
      await this.trackProgress({
        stage: 'synthesizing',
        agent: 'coordinator',
        message: 'Performing final quality assurance review',
        confidence: dossier.confidenceScore,
        estimatedTimeRemaining: 30,
        userCanInterrupt: false,
        timestamp: new Date()
      });

      const finalQA = await this.coordinator.performFinalQA(dossier);

      // Quality Gate 3: Final QA Validation
      const qaValidation = await this.coordinator.validateQualityGate(
        'Final Quality Assurance',
        { 
          approved: finalQA.approved,
          confidence: finalQA.confidence,
          qualityScore: finalQA.qualityScore,
          dossierLength: dossier.structuredSections.strategicRecommendations.approachStrategy.length
        },
        'Dossier quality, accuracy, and completeness standards'
      );

      if (!qaValidation.passed && !finalQA.approved && userInput.confidenceThreshold === 'high') {
        throw new Error(`Final QA failed: ${finalQA.feedback}`);
      }

      // Mission Complete
      const executionTime = Date.now() - startTime;
      const allQualityGates = [planValidation, dataValidation, qaValidation];

      await this.trackProgress({
        stage: 'synthesizing',
        agent: 'coordinator',
        message: `Intelligence mission completed successfully in ${Math.round(executionTime / 1000)}s`,
        confidence: dossier.confidenceScore,
        estimatedTimeRemaining: 0,
        userCanInterrupt: false,
        timestamp: new Date()
      });

      return {
        success: true,
        dossier,
        totalCost: dossier.totalCost,
        executionTime,
        qualityGates: allQualityGates,
        agentProgress: this.progressHistory,
        culturalAdaptation
      };

    } catch (error: any) {
      await this.handleOrchestrationError(error, startTime);
      
      return {
        success: false,
        error: error.message,
        totalCost: (this.researcher as any).getTotalCost(),
        executionTime: Date.now() - startTime,
        qualityGates: this.coordinator.getContext()?.qualityGates || [],
        agentProgress: this.progressHistory
      };
    }
  }

  /**
   * Execute recovery procedures for failed operations
   */
  async executeRecoveryProcedure(
    failedOperation: string, 
    userInput: OptimizedUserInput
  ): Promise<OrchestrationResult> {
    await this.trackProgress({
      stage: 'planning',
      agent: 'coordinator',
      message: `Executing recovery procedure for: ${failedOperation}`,
      confidence: 0.6,
      estimatedTimeRemaining: 120,
      userCanInterrupt: true,
      timestamp: new Date()
    });

    // Reset all agents
    this.coordinator.reset();
    this.researcher.reset();
    this.detective.reset();

    // Retry with fallback settings
    const fallbackInput: OptimizedUserInput = {
      ...userInput,
      priority: 'standard',
      confidenceThreshold: 'medium',
      outputFormat: userInput.outputFormat || 'executive'
    };

    return this.executeIntelligenceMission(fallbackInput);
  }

  /**
   * Get real-time status of all agents
   */
  getAgentStatus(): {
    coordinator: any;
    researcher: { totalCost: number; withinTarget: boolean };
    detective: any;
    overallProgress: number;
  } {
    const recentProgress = this.progressHistory.slice(-3);
    const overallProgress = recentProgress.length > 0 
      ? recentProgress.reduce((sum, p) => sum + p.confidence, 0) / recentProgress.length 
      : 0;

    return {
      coordinator: this.coordinator.getContext(),
      researcher: {
        totalCost: (this.researcher as any).getTotalCost(),
        withinTarget: (this.researcher as any).isWithinCostTarget()
      },
      detective: { status: 'active' }, // Detective doesn't expose internal state
      overallProgress
    };
  }

  /**
   * Emergency stop all agents
   */
  async emergencyStop(reason: string): Promise<void> {
    await this.trackProgress({
      stage: 'planning',
      agent: 'coordinator',
      message: `EMERGENCY STOP: ${reason}`,
      confidence: 0,
      estimatedTimeRemaining: 0,
      userCanInterrupt: false,
      timestamp: new Date()
    });

    // Reset all agents
    this.coordinator.reset();
    this.researcher.reset();
    this.detective.reset();
    this.progressHistory = [];
  }

  /**
   * Track progress from all agents
   */
  private async trackProgress(progress: AgentProgress): Promise<void> {
    this.progressHistory.push(progress);
    
    // Keep only last 50 progress updates to prevent memory issues
    if (this.progressHistory.length > 50) {
      this.progressHistory = this.progressHistory.slice(-50);
    }
    
    if (this.progressCallback) {
      this.progressCallback(progress);
    }
  }

  /**
   * Handle orchestration errors with recovery strategies
   */
  private async handleOrchestrationError(error: any, startTime: number): Promise<void> {
    const errorData: AgentError = {
      agent: 'coordinator',
      error: `Orchestration failed: ${error.message}`,
      recoverable: error.name !== 'ValidationError',
      timestamp: new Date(),
      context: {
        executionTime: Date.now() - startTime,
        progressHistory: this.progressHistory.length
      }
    };

    await this.trackProgress({
      stage: 'planning',
      agent: 'coordinator',
      message: `Mission failed: ${error.message}`,
      confidence: 0,
      estimatedTimeRemaining: 0,
      userCanInterrupt: true,
      timestamp: new Date()
    });

    console.error('[Agent Orchestrator Error]', errorData);
  }

  /**
   * Reset orchestrator for new mission
   */
  reset(): void {
    this.coordinator.reset();
    this.researcher.reset();
    this.detective.reset();
    this.progressHistory = [];
  }

  /**
   * Get progress history
   */
  getProgressHistory(): AgentProgress[] {
    return [...this.progressHistory];
  }
}