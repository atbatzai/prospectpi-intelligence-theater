/**
 * ProspectPI Intelligence Theater - Agent Type Definitions
 * Story 1.1: Three-Agent Orchestration System
 * Story 1.2: REST API Endpoints & Request Handling
 * 
 * TypeScript interfaces for agent communication, progress tracking, and API contracts
 */

export interface AgentProgress {
  stage: 'planning' | 'researching' | 'analyzing' | 'synthesizing' | 'quality_check';
  agent: 'coordinator' | 'researcher' | 'detective' | 'intelligence_coordinator' | 'field_researcher' | 'intelligence_detective';
  message: string;
  confidence: number;
  estimatedTimeRemaining: number;
  userCanInterrupt: boolean;
  dataSourcesActive?: string[];
  insightsDiscovered?: number;
  timestamp: Date;
}

// Story 1.2: Lovable Frontend Integration Interfaces - ENHANCED FOR SOLUTION-RELEVANCE
export interface ProspectResearchInput {
  // CRITICAL: Company being researched
  companyName: string;                    // Required
  companyUrl?: string;                    // Optional
  
  // CRITICAL: Solution Context - The vendor/product being sold
  vendorName: string;                     // Required - e.g. IBM, Microsoft, Dell, Adobe
  productName: string;                    // Required - e.g. Apptio, Microsoft365, PowerEdge, PageMaker
  productCategory?: string;               // Optional - e.g. Cloud Platform, ERP, Security, Analytics
  
  // CRITICAL: Industry & Pain Point Context
  industry: string;                       // Required - target company's industry
  primaryPainPoint: string;               // Required - specific challenge/focus area
  secondaryPainPoints?: string[];         // Optional - additional challenges
  
  // Enhanced Context Fields
  crmNotes?: string;                      // Optional - max 1000 chars
  organizationFocus?: string;             // Optional
  locationOfInterest?: string;            // Optional
  contextLinks?: string[];                // Optional - array of URLs
  additionalContext?: string;             // Optional - max 2000 chars
  
  // Solution-Relevance Flags
  competitorAnalysis?: boolean;           // Include competitor intelligence
  budgetIntelligence?: boolean;           // Research spending patterns
  technologyStackFocus?: boolean;         // Deep-dive on current tech stack
}

export interface ResearchApiPayload extends ProspectResearchInput {
  userId: string;
  requestId: string;
  timestamp: string;
  apiKeys: {
    theirstack: string;
    marketaux: string;
    coresignal: string;
    perplexity: string;
    linkedin?: string;
  };
}

// ENHANCED: Multi-Agent Orchestration Context from PRD
export interface AgentOrchestrationContext {
  requestId: string;
  salesContext: {
    vendorName: string;
    productName: string;
    industry: string;
    primaryPainPoint: string;
    secondaryPainPoints?: string[];
  };
  researchStrategy: {
    priorityAPIs: ('theirstack' | 'marketaux' | 'coresignal' | 'perplexity')[];
    industryFocus: string[];
    competitorAnalysis: boolean;
    budgetIntelligence: boolean;
    technologyStackFocus: boolean;
  };
  progressCallback: (stage: string, progress: number, message: string) => void;
}

export interface ResearchApiResponse {
  success: boolean;
  requestId: string;
  status: 'processing' | 'complete' | 'error';
  estimatedCompletion?: number;
  websocketUrl?: string;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface OptimizedUserInput {
  // Company being researched
  companyName: string;
  companyUrl?: string;                    // Optional - Company website
  linkedinUrl?: string;                   // Optional - LinkedIn company page
  linkedinUserUrl?: string;               // Optional - LinkedIn user/executive profile
  
  // CRITICAL: Solution Context
  vendorName: string;                     // The vendor/company selling (e.g. IBM, Microsoft)
  productName: string;                    // The specific product (e.g. Apptio, Office365)
  
  // CRITICAL: Industry & Pain Point Context  
  industry: string;                       // Target company's industry
  primaryPainPoint: string;               // Main challenge to address
  
  // Enhanced Research Context
  additionalContext?: string;
  competitorAnalysis?: boolean;
  budgetIntelligence?: boolean;
  technologyStackFocus?: boolean;
  
  // Research Configuration
  priority: 'standard' | 'express';
  outputFormat: 'full' | 'executive' | 'custom';
  confidenceThreshold: 'high' | 'medium' | 'all';
  
  // Phase 2: Consultation Integration Fields
  consultation_derived_context?: string;     // Rich context from Mack consultation
  strategic_research_focus?: string[];       // Areas identified during consultation  
  priority_intelligence_areas?: string[];    // High-value intelligence targets
  mack_briefing_summary?: string;           // Mack's strategic briefing for agents
  business_context_signals?: string[];       // Key business signals discovered
  consultation_session_id?: string;         // Reference to consultation session
}

export interface AgentContext {
  requestId: string;
  userInput: OptimizedUserInput;
  previousResults?: any;
  qualityGates: QualityGate[];
  startTime: Date;
}

export interface QualityGate {
  name: string;
  passed: boolean;
  confidence: number;
  validationMessage: string;
  timestamp: Date;
}

export interface ResearchData {
  source: 'theirstack' | 'marketaux' | 'coresignal' | 'perplexity' | 'shodan' | 'bmad-enhancement' | 'reddit' | 'twitter' | 'github' | 'youtube' | 'discord';
  data: any;
  confidence: number;
  timestamp: Date;
  cost: number;
  responseTime?: number;
}

export interface DossierResult {
  requestId: string;
  companyName: string;
  
  // Solution-Relevance Context
  vendorName: string;
  productName: string;
  industry: string;
  primaryPainPoint: string;
  
  // ENHANCED: PRD-Inspired Structured Intelligence Analysis
  structuredSections: {
    dealWinningIntelligence?: {
      dealProbabilityScore: number;
      goNoGoRecommendation: 'GO' | 'NO-GO' | 'CONDITIONAL';
      resourceInvestment: 'HIGH' | 'MEDIUM' | 'LOW';
      immediateRedFlags: string[];
      strongBuyingSignals: string[];
      winningStrategy: {
        primaryApproach: string;
        keyStakeholders: Array<{
          name?: string;
          role: string;
          influence: 'HIGH' | 'MEDIUM' | 'LOW';
          priorities: string[];
          approachStrategy: string;
          keyMessages: string[];
        }>;
        competitiveDifferentiation: string[];
        messagingStrategy: string[];
        timingRecommendation: string;
        proofPointsNeeded: string[];
      };
      agentReasoning: {
        coordinatorHunches: string[];
        researcherInsights: string[];
        detectiveHypotheses: string[];
        confidenceReasons: Array<{
          insight: string;
          confidence: number;
          reasoning: string;
        }>;
        patternRecognition: string[];
        stealthOpportunities: string[];
      };
    };
    
    executiveSummary: {
      summary: string;
      solutionRelevanceScore: number;      // 0-100 score of product-market fit
      keyOpportunities: string[];
      criticalRisks: string[];
    };
    
    painPointAlignment: {
      primaryPainPoint: {
        challenge: string;
        evidence: string[];
        solutionFit: string;
        confidence: 'high' | 'medium' | 'limited';
      };
      secondaryPainPoints?: Array<{
        challenge: string;
        evidence: string[];
        solutionFit: string;
        confidence: 'high' | 'medium' | 'limited';
      }>;
    };
    
    competitiveIntelligence: {
      currentVendors: Array<{
        vendor: string;
        products: string[];
        marketShare?: string;
        relationship: 'partner' | 'competitor' | 'unknown';
      }>;
      competitorThreat: 'low' | 'medium' | 'high';
      competitiveAdvantages: string[];
      threats: string[];
    };
    
    budgetIntelligence: {
      estimatedBudget?: string;
      spendingPatterns: string[];
      budgetCycle: string;
      budgetFitAnalysis: string;
      decisionMakers: Array<{
        name?: string;
        role: string;
        influence: 'high' | 'medium' | 'low';
        background?: string;
      }>;
    };
    
    technologyIntelligence: {
      currentStack: Array<{
        category: string;
        technologies: string[];
        integrationPoints?: string[];
      }>;
      modernizationSignals: string[];
      implementationReadiness: 'ready' | 'needs-prep' | 'not-ready';
      technicalRequirements: string[];
    };
    
    marketPosition: {
      industryContext: string;
      marketTrends: string[];
      growthSignals: string[];
      riskFactors: string[];
      strategicInitiatives: string[];
    };
    
    strategicRecommendations: {
      approachStrategy: string;
      keyMessaging: string[];
      stakeholderStrategy: Array<{
        role: string;
        approach: string;
        keyPoints: string[];
      }>;
      timeline: string;
      nextSteps: string[];
    };
    
    // Phase 4: Social & Community Intelligence Enhancement
    socialIntelligence: {
      communitySentiment: string;
      executiveCommunications: string[];
      developerSentiment: string;
      brandPerception: string;
      socialProofSignals: string[];
      reputationRisks: string[];
    };
    
    enterpriseReadiness: {
      socialProofScore: number;
      communityHealthScore: number;
      executivePresenceScore: number;
      developerExperienceScore: number;
      overallSocialIntelligenceScore: number;
    };
  };
  
  // Metadata
  sources: ResearchData[];
  confidenceScore: number;
  insightsCount: number;
  sourcesCount: number;
  totalCost: number;
  generatedAt: Date;
  format: 'cia' | 'executive' | 'custom';
}

export interface AgentError {
  agent: 'coordinator' | 'researcher' | 'detective';
  error: string;
  recoverable: boolean;
  timestamp: Date;
  context?: any;
}

// Story 1.3: WebSocket Real-Time Progress System Interfaces
export interface WebSocketMessage {
  type: 'agent_progress' | 'connection_status' | 'error' | 'completion';
  requestId: string;
  timestamp: string;
  data: AgentProgress | ConnectionStatus | ErrorInfo | CompletionInfo;
}

export interface ConnectionStatus {
  status: 'connected' | 'authenticated' | 'subscribed';
  message: string;
}

export interface ErrorInfo {
  code: string;
  message: string;
  recoverable: boolean;
  recovery_instructions?: string;
}

export interface CompletionInfo {
  status: 'complete' | 'failed';
  dossier_url?: string;
  summary: string;
}

// CRITICAL: PRD-Inspired Backend Implementation Requirements
export interface BackendImplementationGuide {
  /*
  BACKEND ARCHITECTURE REQUIREMENTS (Adapted from PRD):
  
  1. FASTAPI ENDPOINTS (Replace Supabase Edge Functions):
     - POST /api/research/generate-dossier
     - GET /api/research/stream-progress/:requestId (SSE)
     - POST /api/research/webhook-handler
     - GET /api/research/dossier/:requestId
  
  2. DATABASE SCHEMA (PostgreSQL):
     - research_requests table (enhanced with vendor/product context)
     - dossier_results table (structured JSON sections)
     - source_citations table (API attribution)
     - research_progress table (real-time updates)
  
  3. EXTERNAL API INTEGRATION (Parallel Processing):
     - TheirStack API: Technology stack analysis
     - MarketAux API: Financial intelligence & earnings calls
     - Coresignal API: Professional network mapping
     - Perplexity API: Real-time web intelligence
     - LinkedIn Intelligence: Hiring patterns & job postings
     - Patent Databases: R&D activity analysis
  
  4. AI ORCHESTRATION (Multi-Agent System):
     - Intelligence Coordinator: Research strategy & API prioritization
     - Field Researcher: Parallel data collection from external sources
     - Intelligence Detective: AI synthesis with solution-relevance focus
  
  5. REAL-TIME PROGRESS (WebSocket/SSE):
     - Stage updates: coordinator -> researcher -> detective
     - Progress percentages: 0-30% -> 30-75% -> 75-100%
     - Dynamic messaging with sales context integration
  
  6. PROMPT ENGINEERING (Solution-Focused):
     - System prompts include vendor/product/industry context
     - Pain point alignment drives research priorities
     - Industry-specific research strategies
     - Competitive intelligence based on vendor context
  
  IMPLEMENTATION PRIORITY:
  1. Update database schema with new fields
  2. Enhance API endpoint to accept solution context
  3. Implement parallel external API calls
  4. Create AI orchestration system with solution-focused prompts
  5. Add real-time progress streaming
  6. Build structured dossier generation
  */
}