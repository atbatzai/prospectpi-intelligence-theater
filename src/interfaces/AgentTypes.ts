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

// Story 1.2: Lovable Frontend Integration Interfaces
export interface ProspectResearchInput {
  companyName: string;                    // Required
  companyUrl?: string;                    // Optional
  linkedinUrl?: string;                   // Optional  
  crmNotes?: string;                      // Optional - max 1000 chars
  organizationFocus?: string;             // Optional
  locationOfInterest?: string;            // Optional
  contextLinks?: string[];                // Optional - array of URLs
  additionalContext?: string;             // Optional - max 2000 chars
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
  companyName: string;
  additionalContext?: string;
  priority: 'standard' | 'express';
  outputFormat: 'full' | 'executive' | 'custom';
  confidenceThreshold: 'high' | 'medium' | 'all';
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
  source: 'theirstack' | 'marketaux' | 'coresignal' | 'perplexity';
  data: any;
  confidence: number;
  timestamp: Date;
  cost: number;
}

export interface DossierResult {
  requestId: string;
  companyName: string;
  summary: string;
  detailedAnalysis: string;
  sources: ResearchData[];
  confidenceScore: number;
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