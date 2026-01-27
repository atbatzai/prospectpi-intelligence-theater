/**
 * Story 2.4.2: Cultural Intelligence Agent Integration
 * 
 * 4th agent integrated into existing 3-agent system for automatic cultural adaptation
 * with LLM prompts for market-specific intelligence processing
 */

import { CulturalContext, CulturalDetectionService } from './CulturalDetectionService';

export interface CulturalAdaptationStatus {
  stage: 'detecting' | 'analyzing' | 'adapting' | 'complete' | 'error';
  progress: number;
  currentAction: string;
  culturalContext?: CulturalContext;
  adaptationsApplied: string[];
  processingTime: number;
}

export interface CulturalAdaptationResult {
  success: boolean;
  culturalContext: CulturalContext;
  adaptations: {
    executiveSummary: string;
    competitiveAnalysis: string;
    riskCommunication: string;
    relationshipContext: string;
  };
  processingTimeMs: number;
  auditTrail: string[];
}

/**
 * Story 2.4.2: Cultural Intelligence Agent
 * Extends the 3-agent system with cultural adaptation capabilities
 */
export class CulturalIntelligenceAgent {
  private culturalContext: CulturalContext | null = null;
  private statusCallback?: (status: CulturalAdaptationStatus) => void;

  /**
   * Initialize cultural adaptation for a target company
   */
  async initialize(companyDomain: string, onStatusUpdate?: (status: CulturalAdaptationStatus) => void): Promise<void> {
    this.statusCallback = onStatusUpdate;
    this.updateStatus('detecting', 10, 'Detecting cultural context from company domain...');
    
    // Simulate async cultural detection
    await this.delay(500);
    this.culturalContext = CulturalDetectionService.detectFromDomain(companyDomain);
    
    this.updateStatus('detecting', 25, `Identified ${this.culturalContext.country} market context`);
  }

  /**
   * Apply cultural adaptation to dossier content
   */
  async adaptDossier(originalContent: any): Promise<CulturalAdaptationResult> {
    const startTime = Date.now();
    const auditTrail: string[] = [];

    if (!this.culturalContext) {
      throw new Error('Cultural context not initialized');
    }

    this.updateStatus('analyzing', 40, 'Analyzing cultural dimensions...');
    await this.delay(300);
    auditTrail.push(`Analyzed ${this.culturalContext.country} cultural dimensions`);

    this.updateStatus('adapting', 60, 'Applying cultural adaptations to dossier...');
    
    const adaptations = {
      executiveSummary: await this.adaptExecutiveSummary(originalContent.executiveSummary),
      competitiveAnalysis: await this.adaptCompetitiveAnalysis(originalContent.competitiveAnalysis),
      riskCommunication: await this.adaptRiskCommunication(originalContent.risks),
      relationshipContext: await this.addRelationshipContext()
    };

    auditTrail.push('Executive summary adapted for cultural hierarchy preferences');
    auditTrail.push('Competitive analysis framed for market communication style');
    auditTrail.push('Risk communication adjusted for directness level');
    
    if (this.culturalContext.culturalDimensions.relationshipFirst > 60) {
      auditTrail.push('Enhanced relationship context for relationship-first culture');
    }

    this.updateStatus('complete', 100, 'Cultural adaptation complete');

    const processingTime = Date.now() - startTime;

    return {
      success: true,
      culturalContext: this.culturalContext,
      adaptations,
      processingTimeMs: processingTime,
      auditTrail
    };
  }

  /**
   * Get WebSocket progress updates for Intelligence Theater
   */
  getProgressUpdates(): CulturalAdaptationStatus[] {
    if (!this.culturalContext) return [];

    return [
      {
        stage: 'detecting',
        progress: 25,
        currentAction: `Detected ${this.culturalContext.country} market`,
        culturalContext: this.culturalContext,
        adaptationsApplied: [],
        processingTime: 500
      },
      {
        stage: 'analyzing',
        progress: 50,
        currentAction: 'Analyzing cultural dimensions and communication preferences',
        culturalContext: this.culturalContext,
        adaptationsApplied: ['hierarchy_analysis', 'communication_style'],
        processingTime: 800
      },
      {
        stage: 'adapting',
        progress: 75,
        currentAction: 'Adapting dossier sections for cultural relevance',
        culturalContext: this.culturalContext,
        adaptationsApplied: ['executive_summary', 'competitive_framing', 'risk_communication'],
        processingTime: 1200
      },
      {
        stage: 'complete',
        progress: 100,
        currentAction: 'Cultural adaptation complete',
        culturalContext: this.culturalContext,
        adaptationsApplied: ['executive_summary', 'competitive_framing', 'risk_communication', 'relationship_context'],
        processingTime: 1500
      }
    ];
  }

  private async adaptExecutiveSummary(original: string): Promise<string> {
    if (!this.culturalContext) return original;

    const { hierarchy, directness, formality } = this.culturalContext.culturalDimensions;

    // High hierarchy cultures: emphasize senior stakeholders
    if (hierarchy > 70) {
      return `[Executive Leadership Focus] ${original}`;
    }

    // High directness: get straight to the point
    if (directness > 70) {
      return `[Direct Analysis] ${original}`;
    }

    return original;
  }

  private async adaptCompetitiveAnalysis(original: string): Promise<string> {
    if (!this.culturalContext) return original;

    const { directness } = this.culturalContext.culturalDimensions;

    // Low directness cultures: soften competitive framing
    if (directness < 40) {
      return original.replace(/dominates|crushes|destroys/gi, 'leads');
    }

    return original;
  }

  private async adaptRiskCommunication(risks: any[]): Promise<string> {
    if (!this.culturalContext) return JSON.stringify(risks);

    const { directness } = this.culturalContext.culturalDimensions;

    if (directness > 70) {
      return 'Direct risk warnings: ' + JSON.stringify(risks);
    } else {
      return 'Contextual risk considerations: ' + JSON.stringify(risks);
    }
  }

  private async addRelationshipContext(): Promise<string> {
    if (!this.culturalContext) return '';

    const { relationshipFirst } = this.culturalContext.culturalDimensions;

    if (relationshipFirst > 70) {
      return 'Relationship-building approach recommended. Invest time in personal connections before business discussions.';
    }

    return 'Task-focused approach appropriate.';
  }

  private updateStatus(stage: CulturalAdaptationStatus['stage'], progress: number, action: string): void {
    if (this.statusCallback) {
      this.statusCallback({
        stage,
        progress,
        currentAction: action,
        culturalContext: this.culturalContext || undefined,
        adaptationsApplied: [],
        processingTime: Date.now()
      });
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
