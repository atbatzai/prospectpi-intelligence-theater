/**
 * ProspectPI Intelligence Theater - Prospect Intelligence Detective Agent
 * Story 1.1: Three-Agent Orchestration System
 * 
 * Agent 3: Prospect Intelligence Detective
 * - Model: Claude 3.5 Sonnet (claude-3-5-sonnet-20241022)
 * - Temperature: 0.1-0.3 (conservative for evidence validation)
 * - Role: Triangulation + confidence scoring + final synthesis
 * - Output: CIA-formatted dossier with citations
 */

import Anthropic from '@anthropic-ai/sdk';
import { ApiConfig } from '@config/ApiConfig';
import { 
  AgentProgress, 
  AgentContext, 
  ResearchData,
  DossierResult,
  AgentError 
} from '@interfaces/AgentTypes';

interface TriangulationResult {
  dataPoints: any[];
  consistencyScore: number;
  conflictingInformation: string[];
  verifiedFacts: string[];
  confidenceLevel: number;
}

interface EvidenceValidation {
  source: string;
  claim: string;
  verified: boolean;
  confidence: number;
  supportingEvidence: string[];
  contradictingEvidence: string[];
}

export class ProspectIntelligenceDetective {
  private anthropic: Anthropic;
  private context: AgentContext | null = null;
  private progressCallback: ((progress: AgentProgress) => void) | undefined;

  constructor(progressCallback?: (progress: AgentProgress) => void) {
    this.anthropic = new Anthropic({
      apiKey: ApiConfig.ANTHROPIC_API_KEY,
    });
    this.progressCallback = progressCallback;
  }

  /**
   * Initialize analysis mission with research data
   */
  async initializeAnalysis(context: AgentContext, researchData: ResearchData[]): Promise<void> {
    this.context = context;
    
    await this.updateProgress({
      stage: 'analyzing',
      agent: 'detective',
      message: `Starting deep analysis of ${researchData.length} intelligence sources`,
      confidence: 0.8,
      estimatedTimeRemaining: 90,
      userCanInterrupt: true,
      dataSourcesActive: researchData.map(r => r.source),
      insightsDiscovered: researchData.length,
      timestamp: new Date()
    });
  }

  /**
   * Perform comprehensive intelligence analysis with triangulation
   */
  async analyzeIntelligence(researchData: ResearchData[]): Promise<DossierResult> {
    if (!this.context) {
      throw new Error('Analysis context not initialized. Call initializeAnalysis first.');
    }

    const companyName = this.context.userInput.companyName;

    // Step 1: Data Triangulation
    await this.updateProgress({
      stage: 'analyzing',
      agent: 'detective',
      message: 'Triangulating data across multiple sources...',
      confidence: 0.7,
      estimatedTimeRemaining: 75,
      userCanInterrupt: false,
      timestamp: new Date()
    });

    const triangulation = await this.triangulateData(researchData);

    // Step 2: Evidence Validation
    await this.updateProgress({
      stage: 'analyzing',
      agent: 'detective',
      message: 'Validating evidence and calculating confidence scores...',
      confidence: 0.8,
      estimatedTimeRemaining: 60,
      userCanInterrupt: false,
      timestamp: new Date()
    });

    const evidenceValidation = await this.validateEvidence(researchData, triangulation);

    // Step 3: CIA-Formatted Synthesis
    await this.updateProgress({
      stage: 'synthesizing',
      agent: 'detective',
      message: 'Synthesizing final intelligence dossier...',
      confidence: 0.9,
      estimatedTimeRemaining: 30,
      userCanInterrupt: false,
      timestamp: new Date()
    });

    const dossier = await this.synthesizeDossier(
      companyName,
      researchData,
      triangulation,
      evidenceValidation
    );

    await this.updateProgress({
      stage: 'synthesizing',
      agent: 'detective',
      message: 'Intelligence analysis complete',
      confidence: dossier.confidenceScore,
      estimatedTimeRemaining: 0,
      userCanInterrupt: false,
      timestamp: new Date()
    });

    return dossier;
  }

  /**
   * Triangulate data from multiple sources to identify patterns and conflicts
   */
  private async triangulateData(researchData: ResearchData[]): Promise<TriangulationResult> {
    const prompt = `You are a CIA-level intelligence analyst performing data triangulation.

    Research Data from Multiple Sources:
    ${researchData.map((data, index) => `
    Source ${index + 1}: ${data.source.toUpperCase()}
    Confidence: ${data.confidence}
    Data: ${JSON.stringify(data.data, null, 2)}
    `).join('\n')}

    Perform comprehensive triangulation analysis:
    1. Identify consistent information across sources
    2. Detect conflicting or contradictory data points
    3. Assess overall data reliability and consistency
    4. Extract verified facts with high confidence
    5. Flag areas requiring additional validation

    Respond in JSON format:
    {
      "consistencyScore": 0.0-1.0,
      "consistentDataPoints": ["fact1", "fact2", ...],
      "conflictingInformation": ["conflict1", "conflict2", ...],
      "verifiedFacts": ["verified1", "verified2", ...],
      "dataGaps": ["gap1", "gap2", ...],
      "reliabilityAssessment": "detailed analysis",
      "recommendedConfidenceLevel": 0.0-1.0
    }`;

    try {
      const response = await this.anthropic.messages.create({
        model: ApiConfig.DETECTIVE_MODEL,
        max_tokens: 3000,
        temperature: ApiConfig.DETECTIVE_TEMPERATURE_MIN,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      const triangulationText = response.content[0].type === 'text' ? response.content[0].text : '';
      const triangulationData = JSON.parse(triangulationText);

      return {
        dataPoints: triangulationData.consistentDataPoints || [],
        consistencyScore: triangulationData.consistencyScore || 0,
        conflictingInformation: triangulationData.conflictingInformation || [],
        verifiedFacts: triangulationData.verifiedFacts || [],
        confidenceLevel: triangulationData.recommendedConfidenceLevel || 0
      };

    } catch (error: any) {
      await this.handleError({
        agent: 'detective',
        error: `Data triangulation failed: ${error.message}`,
        recoverable: true,
        timestamp: new Date(),
        context: { sourcesCount: researchData.length }
      });
      
      return {
        dataPoints: [],
        consistencyScore: 0,
        conflictingInformation: ['Triangulation analysis failed'],
        verifiedFacts: [],
        confidenceLevel: 0.1
      };
    }
  }

  /**
   * Validate evidence from each source with confidence scoring
   */
  private async validateEvidence(
    researchData: ResearchData[], 
    triangulation: TriangulationResult
  ): Promise<EvidenceValidation[]> {
    const validations: EvidenceValidation[] = [];

    for (const data of researchData) {
      const prompt = `You are validating intelligence evidence from source: ${data.source.toUpperCase()}

      Source Data: ${JSON.stringify(data.data, null, 2)}
      Source Confidence: ${data.confidence}
      Triangulation Context: ${JSON.stringify({
        consistencyScore: triangulation.consistencyScore,
        verifiedFacts: triangulation.verifiedFacts,
        conflictingInfo: triangulation.conflictingInformation
      }, null, 2)}

      Perform evidence validation:
      1. Assess source credibility and reliability
      2. Verify claims against known facts
      3. Identify supporting and contradicting evidence
      4. Calculate confidence score for this source

      Respond in JSON format:
      {
        "sourceCredibility": 0.0-1.0,
        "keyClaims": ["claim1", "claim2", ...],
        "verifiedClaims": ["verified1", "verified2", ...],
        "supportingEvidence": ["evidence1", "evidence2", ...],
        "contradictingEvidence": ["contradiction1", "contradiction2", ...],
        "overallConfidence": 0.0-1.0,
        "validationNotes": "detailed analysis"
      }`;

      try {
        const response = await this.anthropic.messages.create({
          model: ApiConfig.DETECTIVE_MODEL,
          max_tokens: 2000,
          temperature: ApiConfig.DETECTIVE_TEMPERATURE_MIN + 0.1,
          messages: [{
            role: 'user',
            content: prompt
          }]
        });

        const validationText = response.content[0].type === 'text' ? response.content[0].text : '';
        const validation = JSON.parse(validationText);

        validations.push({
          source: data.source,
          claim: validation.keyClaims?.join('; ') || 'No claims identified',
          verified: validation.overallConfidence > 0.6,
          confidence: validation.overallConfidence || 0,
          supportingEvidence: validation.supportingEvidence || [],
          contradictingEvidence: validation.contradictingEvidence || []
        });

      } catch (error: any) {
        validations.push({
          source: data.source,
          claim: 'Validation failed',
          verified: false,
          confidence: 0,
          supportingEvidence: [],
          contradictingEvidence: [`Validation error: ${error.message}`]
        });
      }
    }

    return validations;
  }

  /**
   * Synthesize final CIA-formatted intelligence dossier
   */
  private async synthesizeDossier(
    companyName: string,
    researchData: ResearchData[],
    triangulation: TriangulationResult,
    evidenceValidation: EvidenceValidation[]
  ): Promise<DossierResult> {
    const outputFormat = this.context?.userInput.outputFormat || 'cia';
    const totalCost = researchData.reduce((sum, data) => sum + data.cost, 0);

    const prompt = `You are a senior CIA intelligence analyst creating a comprehensive dossier.

    TARGET: ${companyName}
    OUTPUT FORMAT: ${outputFormat.toUpperCase()}

    INTELLIGENCE SOURCES:
    ${researchData.map(data => `- ${data.source.toUpperCase()}: ${data.confidence} confidence, $${data.cost} cost`).join('\n')}

    TRIANGULATION ANALYSIS:
    - Consistency Score: ${triangulation.consistencyScore}
    - Verified Facts: ${triangulation.verifiedFacts.length}
    - Conflicting Information: ${triangulation.conflictingInformation.length}

    EVIDENCE VALIDATION:
    ${evidenceValidation.map(ev => `- ${ev.source.toUpperCase()}: ${ev.confidence} confidence, ${ev.verified ? 'VERIFIED' : 'UNVERIFIED'}`).join('\n')}

    RAW INTELLIGENCE DATA:
    ${researchData.map((data, i) => `
    [SOURCE ${i + 1}: ${data.source.toUpperCase()}]
    ${JSON.stringify(data.data, null, 2)}
    `).join('\n')}

    Create a professional intelligence dossier with:
    1. Executive Summary
    2. Key Findings with confidence levels
    3. Business Intelligence Analysis
    4. Technology & Operations Assessment
    5. Financial & Market Position
    6. Risk Assessment & Threat Analysis
    7. Strategic Recommendations
    8. Source Citations & Confidence Ratings

    Use CIA-style formatting with classification markers, confidence indicators (HIGH/MEDIUM/LOW), and proper source attribution.

    Respond in JSON format:
    {
      "executiveSummary": "concise 2-3 paragraph overview",
      "keyFindings": ["finding1 (HIGH CONFIDENCE)", "finding2 (MEDIUM CONFIDENCE)", ...],
      "businessIntelligence": "detailed business analysis",
      "technologyAssessment": "technology stack and capabilities",
      "financialPosition": "financial health and market position",
      "riskAssessment": "potential risks and threats", 
      "strategicRecommendations": ["rec1", "rec2", ...],
      "sourceCitations": ["source1: claim (confidence%)", "source2: claim (confidence%)", ...],
      "overallConfidenceScore": 0.0-1.0,
      "classificationLevel": "UNCLASSIFIED//FOR OFFICIAL USE ONLY"
    }`;

    try {
      const response = await this.anthropic.messages.create({
        model: ApiConfig.DETECTIVE_MODEL,
        max_tokens: 4000,
        temperature: ApiConfig.DETECTIVE_TEMPERATURE_MAX,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      const dossierText = response.content[0].type === 'text' ? response.content[0].text : '';
      const dossierData = JSON.parse(dossierText);

      // Create comprehensive dossier document
      const fullDossier = this.formatDossierDocument(dossierData, companyName);

      return {
        requestId: this.context?.requestId || 'unknown',
        companyName,
        vendorName: 'Unknown Vendor',
        productName: 'Unknown Product',
        industry: 'Unknown Industry',
        primaryPainPoint: 'Unknown Pain Point',
        sections: {
          executiveSummary: {
            summary: dossierData.executiveSummary || 'Analysis completed',
            solutionRelevanceScore: Math.round((dossierData.overallConfidenceScore || 0) * 100),
            keyOpportunities: dossierData.keyFindings || [],
            criticalRisks: []
          },
          painPointAlignment: {
            primaryPainPoint: {
              challenge: 'Unknown',
              evidence: [],
              solutionFit: 'Analysis pending',
              confidence: 'medium'
            }
          },
          competitiveIntelligence: {
            currentVendors: [],
            competitorThreat: 'medium',
            competitiveAdvantages: [],
            threats: []
          },
          budgetIntelligence: {
            spendingPatterns: [],
            budgetCycle: 'Unknown',
            budgetFitAnalysis: 'Pending analysis',
            decisionMakers: []
          },
          technologyIntelligence: {
            currentStack: [],
            modernizationSignals: [],
            implementationReadiness: 'needs-prep',
            technicalRequirements: []
          },
          marketPosition: {
            industryContext: 'Analysis pending',
            marketTrends: [],
            growthSignals: [],
            riskFactors: [],
            strategicInitiatives: []
          },
          strategicRecommendations: {
            approachStrategy: fullDossier,
            keyMessaging: [],
            stakeholderStrategy: [],
            timeline: 'TBD',
            nextSteps: []
          }
        },
        sources: researchData,
        confidenceScore: dossierData.overallConfidenceScore || triangulation.confidenceLevel,
        insightsCount: dossierData.keyFindings?.length || 0,
        sourcesCount: researchData.length,
        totalCost,
        generatedAt: new Date(),
        format: outputFormat as 'cia' | 'executive' | 'custom'
      };

    } catch (error: any) {
      await this.handleError({
        agent: 'detective',
        error: `Dossier synthesis failed: ${error.message}`,
        recoverable: false,
        timestamp: new Date(),
        context: { companyName, sourcesCount: researchData.length }
      });

      return {
        requestId: this.context?.requestId || 'unknown',
        companyName,
        vendorName: 'Unknown Vendor',
        productName: 'Unknown Product', 
        industry: 'Unknown Industry',
        primaryPainPoint: 'Unknown Pain Point',
        sections: {
          executiveSummary: {
            summary: 'Intelligence analysis failed',
            solutionRelevanceScore: 0,
            keyOpportunities: [],
            criticalRisks: [error.message]
          },
          painPointAlignment: {
            primaryPainPoint: {
              challenge: 'Analysis failed',
              evidence: [],
              solutionFit: 'Error occurred',
              confidence: 'limited'
            }
          },
          competitiveIntelligence: {
            currentVendors: [],
            competitorThreat: 'medium',
            competitiveAdvantages: [],
            threats: []
          },
          budgetIntelligence: {
            spendingPatterns: [],
            budgetCycle: 'Unknown',
            budgetFitAnalysis: 'Analysis failed',
            decisionMakers: []
          },
          technologyIntelligence: {
            currentStack: [],
            modernizationSignals: [],
            implementationReadiness: 'not-ready',
            technicalRequirements: []
          },
          marketPosition: {
            industryContext: 'Analysis failed',
            marketTrends: [],
            growthSignals: [],
            riskFactors: [],
            strategicInitiatives: []
          },
          strategicRecommendations: {
            approachStrategy: `Error: ${error.message}`,
            keyMessaging: [],
            stakeholderStrategy: [],
            timeline: 'TBD',
            nextSteps: []
          }
        },
        sources: researchData,
        confidenceScore: 0,
        insightsCount: 0,
        sourcesCount: researchData.length,
        totalCost,
        generatedAt: new Date(),
        format: 'cia'
      };
    }
  }

  /**
   * Format the final dossier document in CIA style
   */
  private formatDossierDocument(dossierData: any, companyName: string): string {
    const timestamp = new Date().toISOString();
    
    return `
CLASSIFICATION: ${dossierData.classificationLevel || 'UNCLASSIFIED//FOR OFFICIAL USE ONLY'}

INTELLIGENCE DOSSIER
TARGET: ${companyName.toUpperCase()}
GENERATED: ${timestamp}
CONFIDENCE: ${Math.round((dossierData.overallConfidenceScore || 0) * 100)}%

=== EXECUTIVE SUMMARY ===
${dossierData.executiveSummary || 'No executive summary available'}

=== KEY FINDINGS ===
${(dossierData.keyFindings || []).map((finding: string, i: number) => `${i + 1}. ${finding}`).join('\n')}

=== BUSINESS INTELLIGENCE ANALYSIS ===
${dossierData.businessIntelligence || 'No business analysis available'}

=== TECHNOLOGY & OPERATIONS ASSESSMENT ===
${dossierData.technologyAssessment || 'No technology assessment available'}

=== FINANCIAL & MARKET POSITION ===
${dossierData.financialPosition || 'No financial analysis available'}

=== RISK ASSESSMENT & THREAT ANALYSIS ===
${dossierData.riskAssessment || 'No risk assessment available'}

=== STRATEGIC RECOMMENDATIONS ===
${(dossierData.strategicRecommendations || []).map((rec: string, i: number) => `${i + 1}. ${rec}`).join('\n')}

=== SOURCE CITATIONS & CONFIDENCE RATINGS ===
${(dossierData.sourceCitations || []).map((citation: string, i: number) => `[${i + 1}] ${citation}`).join('\n')}

=== ANALYST NOTES ===
This intelligence dossier was generated through automated multi-source analysis.
Confidence indicators: HIGH (>80%), MEDIUM (60-80%), LOW (<60%)
Review Date: ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}

END OF DOSSIER
    `.trim();
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
    console.error(`[Prospect Intelligence Detective Error] ${error.error}`, error.context);
    
    if (this.progressCallback) {
      this.progressCallback({
        stage: 'analyzing',
        agent: 'detective',
        message: `Error: ${error.error}`,
        confidence: 0,
        estimatedTimeRemaining: 0,
        userCanInterrupt: true,
        timestamp: new Date()
      });
    }
  }

  /**
   * Reset detective for new mission
   */
  reset(): void {
    this.context = null;
  }
}