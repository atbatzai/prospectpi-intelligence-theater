/**
 * Cultural Intelligence Agent - Epic 2.4
 * 4th agent in the intelligence system for cultural adaptation of dossiers
 */

import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { ApiConfig } from '../config/ApiConfig';
import { 
  AgentProgress, 
  AgentContext, 
  ResearchData,
  DossierResult
} from '../interfaces/AgentTypes';
import { CulturalDetectionService, CulturalContext } from '../services/CulturalDetectionService';

export interface CulturalAdaptationResult {
  culturalContext: CulturalContext;
  adaptedSections: {
    executiveSummary: string;
    competitiveAnalysis: string;
    dealWinningStrategy: string;
    stakeholderAnalysis: string;
    riskAssessment: string;
  };
  adaptationReasons: string[];
  processingTime: number;
  confidence: number;
}

export class CulturalIntelligenceAgent {
  private anthropic: Anthropic | null = null;
  private openai: OpenAI | null = null;
  private modelType: 'anthropic' | 'openai';
  private context: AgentContext | null = null;
  private progressCallback: ((progress: AgentProgress) => void) | undefined;
  
  constructor(progressCallback?: (progress: AgentProgress) => void) {
    // Dynamically select API client based on model - use Detective model for cultural intelligence
    const model = ApiConfig.DETECTIVE_MODEL;
    
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
   * Initialize cultural intelligence processing
   */
  async initializeCulturalProcessing(context: AgentContext): Promise<void> {
    this.context = context;
    
    await this.updateProgress({
      stage: 'analyzing',
      agent: 'cultural_intelligence' as any,
      message: `Cultural Intelligence Agent analyzing ${context.userInput.companyName} for cultural adaptation`,
      confidence: 0.85,
      estimatedTimeRemaining: 15,
      userCanInterrupt: false,
      timestamp: new Date()
    });
  }
  
  /**
   * Adapt dossier for cultural context
   */
  async adaptDossierForCulture(dossier: DossierResult, companyDomain: string): Promise<CulturalAdaptationResult> {
    const startTime = Date.now();
    
    if (!this.context) {
      throw new Error('Cultural processing context not initialized');
    }
    
    // Step 1: Detect cultural context
    await this.updateProgress({
      stage: 'analyzing',
      agent: 'cultural_intelligence' as any, 
      message: 'Detecting cultural context from company domain and profile...',
      confidence: 0.8,
      estimatedTimeRemaining: 12,
      userCanInterrupt: false,
      timestamp: new Date()
    });
    
    const culturalContext = CulturalDetectionService.detectCulturalContext(
      companyDomain, 
      this.context.userInput.companyName
    );
    
    // Step 2: Get cultural adaptation rules
    const adaptationRules = CulturalDetectionService.getCulturalAdaptationRules(culturalContext);
    
    await this.updateProgress({
      stage: 'analyzing',
      agent: 'cultural_intelligence' as any,
      message: `Applying ${culturalContext.country} cultural adaptation (${culturalContext.communicationStyle} style)...`,
      confidence: 0.85,
      estimatedTimeRemaining: 8,
      userCanInterrupt: false,
      timestamp: new Date()
    });
    
    // Step 3: Culturally adapt each major section using LLM
    const adaptedSections = await this.adaptSectionsWithLLM(dossier, culturalContext, adaptationRules);
    
    await this.updateProgress({
      stage: 'analyzing', 
      agent: 'cultural_intelligence' as any,
      message: 'Cultural adaptation complete - dossier optimized for target market',
      confidence: 0.95,
      estimatedTimeRemaining: 2,
      userCanInterrupt: false,
      timestamp: new Date()
    });
    
    return {
      culturalContext,
      adaptedSections,
      adaptationReasons: this.generateAdaptationReasons(culturalContext, adaptationRules),
      processingTime: Date.now() - startTime,
      confidence: culturalContext.confidence
    };
  }
  
  private async adaptSectionsWithLLM(dossier: DossierResult, culturalContext: CulturalContext, rules: any): Promise<any> {
    const systemPrompt = `You are a cultural intelligence specialist adapting business intelligence for ${culturalContext.country} (${culturalContext.region}) business culture.

Cultural Profile:
- Hierarchy: ${culturalContext.culturalScores.hierarchy}/100 (${culturalContext.culturalScores.hierarchy > 70 ? 'High' : culturalContext.culturalScores.hierarchy < 30 ? 'Low' : 'Medium'})
- Directness: ${culturalContext.culturalScores.directness}/100 (${culturalContext.culturalScores.directness > 70 ? 'Very Direct' : culturalContext.culturalScores.directness < 30 ? 'Indirect' : 'Balanced'})
- Formality: ${culturalContext.culturalScores.formality}/100 (${culturalContext.culturalScores.formality > 70 ? 'Formal' : culturalContext.culturalScores.formality < 30 ? 'Casual' : 'Professional'})
- Relationship Focus: ${culturalContext.culturalScores.relationshipFirst}/100
- Business Culture: ${culturalContext.businessCultureType}

Adapt the following dossier sections while preserving all factual content and insights. Focus on adjusting:
1. Communication style and tone
2. Information hierarchy and presentation
3. Relationship vs task emphasis
4. Risk communication approach

Maintain professional intelligence quality while making culturally appropriate adjustments.`;
    
    const userPrompt = `Original Dossier Sections:

EXECUTIVE SUMMARY:
${(dossier as any).executiveSummary}

COMPETITIVE ANALYSIS:
${JSON.stringify((dossier as any).businessIntelligence?.competitive_analysis, null, 2)}

DEAL WINNING STRATEGY:
${JSON.stringify((dossier as any).businessIntelligence?.deal_winning_intel, null, 2)}

STAKEHOLDER ANALYSIS:
${JSON.stringify((dossier as any).businessIntelligence?.stakeholder_intelligence, null, 2)}

RISK ASSESSMENT:
${JSON.stringify((dossier as any).businessIntelligence?.risk_assessment, null, 2)}

Please provide culturally adapted versions of these sections in the following JSON format:
{
  "executiveSummary": "culturally adapted executive summary",
  "competitiveAnalysis": "culturally adapted competitive analysis", 
  "dealWinningStrategy": "culturally adapted deal strategy",
  "stakeholderAnalysis": "culturally adapted stakeholder insights",
  "riskAssessment": "culturally adapted risk communication"
}`;
    
    try {
      let responseText: string;
      
      if (this.modelType === 'anthropic' && this.anthropic) {
        const response = await this.anthropic.messages.create({
          model: 'claude-3-opus-20240229',
          max_tokens: 3000,
          temperature: 0.3,
          messages: [
            { role: 'user', content: systemPrompt + '\n\n' + userPrompt }
          ]
        });
        const content = response.content[0];
        responseText = content.type === 'text' ? content.text : '';
      } else if (this.modelType === 'openai' && this.openai) {
        const response = await this.openai.chat.completions.create({
          model: ApiConfig.DETECTIVE_MODEL,
          max_tokens: 3000,
          temperature: 0.3,
          messages: [
            { role: 'user', content: systemPrompt + '\n\n' + userPrompt }
          ],
          response_format: { type: 'json_object' }
        });
        responseText = response.choices[0]?.message?.content || '';
      } else {
        throw new Error('API client not initialized');
      }
      
      return JSON.parse(responseText);
    } catch (error: any) {
      console.error('Cultural adaptation LLM error:', error);
      // Fallback to rule-based adaptation
      return this.fallbackRuleBasedAdaptation(dossier, culturalContext, rules);
    }
  }
  
  private fallbackRuleBasedAdaptation(dossier: DossierResult, culturalContext: CulturalContext, rules: any): any {
    // Simple rule-based fallback
    const dossierAny = dossier as any;
    return {
      executiveSummary: this.applyToneAdjustment(dossierAny.executiveSummary || '', rules.communicationTone),
      competitiveAnalysis: JSON.stringify(dossierAny.businessIntelligence?.competitive_analysis || {}),
      dealWinningStrategy: JSON.stringify(dossierAny.businessIntelligence?.deal_winning_intel || {}),
      stakeholderAnalysis: JSON.stringify(dossierAny.businessIntelligence?.stakeholder_intelligence || {}),
      riskAssessment: JSON.stringify(dossierAny.businessIntelligence?.risk_assessment || {})
    };
  }
  
  private applyToneAdjustment(text: string, tone: string): string {
    // Simple tone adjustments - could be enhanced with more sophisticated NLP
    if (tone === 'formal') {
      return text.replace(/\bwe\b/g, 'the organization')
                 .replace(/\bthey\b/g, 'the company')
                 .replace(/\bcan\b/g, 'may');
    }
    return text;
  }
  
  private generateAdaptationReasons(culturalContext: CulturalContext, rules: any): string[] {
    const reasons = [];
    
    reasons.push(`Adapted for ${culturalContext.country} business culture (${culturalContext.communicationStyle} communication style)`);
    
    if (culturalContext.culturalScores.hierarchy > 70) {
      reasons.push('Enhanced executive-level focus due to high hierarchy culture');
    }
    
    if (culturalContext.culturalScores.relationshipFirst > 60) {
      reasons.push('Emphasized relationship-building opportunities for relationship-first culture');
    }
    
    if (culturalContext.culturalScores.formality > 70) {
      reasons.push('Increased formality to match cultural expectations');
    }
    
    return reasons;
  }
  
  private async updateProgress(progress: AgentProgress): Promise<void> {
    if (this.progressCallback) {
      this.progressCallback(progress);
    }
  }
}