// MACK CONSULTATION AGENT - Core Interfaces
// Phase 1: Foundation & Core Consultation Types

export interface ConsultationSession {
  id: string;
  user_id: string;
  organization_id: string | null;
  team_id: string | null; // Phase 2: Team-aware consultations
  status: 'active' | 'completed' | 'abandoned' | 'error';
  conversation_context: ConversationContext;
  business_context: BusinessContext;
  research_plan: ResearchPlan | null;
  created_at: string;
  completed_at: string | null;
  consultation_quality_score: number | null;
}

export interface ConversationContext {
  conversation_id: string;
  current_step: string;
  conversation_flow: ConversationStep[];
  user_responses: UserResponse[];
  mack_personality_state: MackPersonalityState;
  intent_classification_history: IntentClassification[];
}

export interface ConversationStep {
  step_id: string;
  step_type: 'greeting' | 'context_gathering' | 'clarification' | 'validation' | 'research_plan' | 'handoff';
  mack_message: string;
  expected_response_type: 'text' | 'choice' | 'confirmation' | 'clarification';
  choices?: string[];
  validation_rules?: ValidationRule[];
  next_step_logic: NextStepLogic;
}

export interface UserResponse {
  response_id: string;
  step_id: string;
  user_input: string;
  processed_intent: string;
  confidence_score: number;
  business_insights_extracted: string[];
  timestamp: string;
}

export interface MackPersonalityState {
  expertise_level: 'investigative' | 'analytical' | 'strategic';
  communication_style: 'professional' | 'consultative' | 'technical';
  industry_focus: string | null;
  previous_interaction_memory: string[];
  credibility_signals: string[];
}

export interface IntentClassification {
  user_input: string;
  classified_intent: string;
  confidence_score: number;
  business_context_signals: string[];
  next_question_suggestions: string[];
  timestamp: string;
}

export interface BusinessContext {
  target_company: CompanyIntelligenceTarget;
  sales_context: SalesContext;
  research_objectives: ResearchObjective[];
  strategic_context: StrategicContext;
  industry_context: IndustryContext;
  urgency_level: 'low' | 'medium' | 'high' | 'urgent';
  complexity_assessment: ComplexityAssessment;
}

export interface CompanyIntelligenceTarget {
  company_name: string;
  company_url: string | null;
  linkedin_url: string | null;
  industry: string | null;
  company_size: string | null;
  geographic_focus: string | null;
  key_decision_makers: string[];
  competitive_positioning: string | null;
}

export interface SalesContext {
  sales_stage: 'prospecting' | 'qualifying' | 'proposing' | 'negotiating' | 'renewal';
  solution_category: string;
  primary_pain_point: string;
  value_proposition: string | null;
  competitive_landscape: string[];
  deal_size_estimate: string | null;
  timeline: string | null;
  stakeholders_involved: string[];
}

export interface ResearchObjective {
  objective_type: 'financial_health' | 'technology_stack' | 'decision_makers' | 'competitive_intel' | 'market_position' | 'strategic_initiatives';
  priority_level: 'critical' | 'important' | 'nice_to_have';
  specific_questions: string[];
  success_criteria: string;
}

export interface StrategicContext {
  strategic_importance: 'key_account' | 'expansion_target' | 'competitive_win' | 'reference_customer' | 'standard_prospect';
  organizational_relationship: string | null;
  previous_engagement_history: string[];
  internal_champion_info: string | null;
  potential_roadblocks: string[];
}

export interface IndustryContext {
  industry_vertical: string;
  market_dynamics: string[];
  regulatory_considerations: string[];
  technology_trends: string[];
  competitive_pressures: string[];
}

export interface ComplexityAssessment {
  overall_complexity: 'simple' | 'moderate' | 'complex' | 'enterprise';
  research_scope: 'basic' | 'comprehensive' | 'deep_dive';
  data_source_requirements: string[];
  estimated_research_time: number; // in minutes
  recommended_agent_focus: string[];
}

export interface ResearchPlan {
  plan_id: string;
  consultation_session_id: string;
  optimized_user_input: OptimizedUserInput;
  research_strategy: ResearchStrategy;
  quality_gates: QualityGate[];
  success_metrics: SuccessMetric[];
  estimated_completion_time: number;
  consultation_insights_summary: string;
}

export interface OptimizedUserInput {
  // Enhanced version of existing OptimizedUserInput with consultation insights
  companyName: string;
  companyUrl: string;
  linkedinUrl: string;
  industry: string;
  primaryPainPoint: string;
  vendorName: string;
  productName: string;
  organizationFocus: string;
  locationOfInterest: string;
  contextLinks: string[];
  additionalContext: string;
  // Consultation enhancements
  consultation_derived_context: string;
  strategic_research_focus: string[];
  priority_intelligence_areas: string[];
  business_context_signals: string[];
  mack_briefing_summary: string;
}

export interface ResearchStrategy {
  primary_research_angles: string[];
  data_source_priorities: string[];
  agent_coordination_plan: AgentCoordinationPlan;
  quality_optimization_focus: string[];
  consultation_success_correlation: string[];
}

export interface AgentCoordinationPlan {
  intelligence_coordinator_briefing: string;
  field_researcher_priorities: string[];
  intelligence_detective_focus_areas: string[];
  consultation_context_handoff: string;
}

export interface QualityGate {
  gate_name: string;
  gate_type: 'consultation_quality' | 'research_relevance' | 'business_context_accuracy';
  success_criteria: string[];
  measurement_method: string;
  consultation_correlation_weight: number;
}

export interface SuccessMetric {
  metric_name: string;
  target_value: number;
  measurement_unit: string;
  consultation_impact_factor: number;
}

export interface ValidationRule {
  rule_type: 'required' | 'format' | 'business_logic' | 'intent_classification';
  rule_expression: string;
  error_message: string;
  recovery_suggestions: string[];
}

export interface NextStepLogic {
  conditions: LogicCondition[];
  default_next_step: string;
  error_recovery_step: string;
}

export interface LogicCondition {
  condition_type: 'user_response' | 'intent_confidence' | 'business_context_completeness';
  condition_expression: string;
  next_step_id: string;
}

// Analytics and Optimization Types
export interface ConsultationAnalytics {
  session_id: string;
  completion_rate: number;
  conversation_quality_score: number;
  business_context_completeness: number;
  research_relevance_correlation: number;
  user_satisfaction_score: number | null;
  professional_credibility_rating: number | null;
  performance_metrics: ConsultationPerformanceMetrics;
}

export interface ConsultationPerformanceMetrics {
  total_conversation_time: number;
  steps_completed: number;
  clarification_rounds: number;
  intent_classification_accuracy: number;
  business_context_extraction_success: number;
  handoff_quality_score: number;
}

// Phase 3 Week 7: A/B Testing Framework Types
export interface ABTestConfiguration {
  name: string;
  status: 'active' | 'inactive' | 'completed';
  variants: ABTestVariant[];
}

export interface ABTestVariant {
  name: string;
  trafficAllocation: number; // Percentage 0-100
  features: ABTestFeatures;
}

export interface ABTestFeatures {
  aiIntentClassification: boolean;
  aiContextExtraction: boolean;
  dynamicResponseGeneration: boolean;
  advancedAnalytics: boolean;
  conversationOptimization: boolean;
}

export interface ABTestEvent {
  variantName: string;
  eventType: 'start' | 'complete' | 'abandon' | 'conversion' | 'error';
  eventData: Record<string, any>;
  sessionId: string;
}

export interface ConversationOptimizations {
  skipGreeting: boolean;
  industryFocusedQuestions: boolean;
  acceleratedContext: boolean;
  smartDefaults: boolean;
  proactiveValidation: boolean;
}