// Mack Consultation Agent Types
export interface ConsultationAgent {
  id: 'mack';
  name: 'Mack';
  expertise: string[];
  conversationStyle: 'investigative' | 'strategic' | 'analytical';
  currentContext: BusinessContext;
  researchPlan: IntelligencePlan;
}

export interface ConversationState {
  id: string;
  sessionId: string;
  userId: string;
  stage: 'introduction' | 'context-building' | 'plan-review' | 'handoff';
  messages: ConversationMessage[];
  extractedContext: BusinessContext;
  researchPlan?: IntelligencePlan;
  completionScore: number; // 0-100%
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationMessage {
  id: string;
  role: 'mack' | 'user';
  content: string;
  timestamp: Date;
  intent?: string;
  extractedData?: Partial<BusinessContext>;
}

export interface BusinessContext {
  companyName: string;
  industry?: string;
  vendorName?: string;
  productName?: string;
  primaryPainPoint?: string;
  solutionFocus?: string;
  competitiveAngle?: string;
  decisionMakers?: string[];
  timeline?: string;
  budgetContext?: string;
  insideConnections?: boolean;
  additionalContext?: string;
}

export interface IntelligencePlan {
  id: string;
  targetCompany: string;
  solutionContext: string;
  investigativeAngles: string[];
  priorityAreas: string[];
  expectedDeliverables: string[];
  estimatedDuration: string;
  confidenceLevel: number;
}