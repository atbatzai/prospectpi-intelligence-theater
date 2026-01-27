/**
 * ProspectPI Intelligence Theater - Field Intelligence Researcher Agent  
 * MINIMAL WORKING VERSION - QA-First Rebuild
 */

import { ApiConfig, ApiCostTracker } from '../config/ApiConfig';
import { 
  AgentProgress, 
  AgentContext, 
  ResearchData
} from '../interfaces/AgentTypes';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

export class FieldIntelligenceResearcher {
  private context: AgentContext | null = null;
  private progressCallback: ((progress: AgentProgress) => void) | undefined;
  private totalCost: number = 0;
  private costTracker: ApiCostTracker;
  private requestId: string;

  constructor(progressCallback?: (progress: AgentProgress) => void) {
    this.progressCallback = progressCallback;
    this.costTracker = ApiCostTracker.getInstance();
    this.requestId = uuidv4();
  }

  async initializeResearch(context: AgentContext): Promise<void> {
    this.context = context;
    this.totalCost = 0;
    
    await this.updateProgress({
      stage: 'researching',
      agent: 'researcher',
      message: `Starting field research for ${context.userInput.companyName}`,
      confidence: 0.8,
      estimatedTimeRemaining: 120,
      userCanInterrupt: true,
      dataSourcesActive: ['theirstack', 'marketaux', 'coresignal', 'perplexity'],
      insightsDiscovered: 0,
      timestamp: new Date()
    });
  }

  async gatherIntelligence(): Promise<ResearchData[]> {
    if (!this.context) {
      throw new Error('Research context not initialized');
    }

    await this.updateProgress({
      stage: 'researching',
      agent: 'researcher',
      message: 'Gathering intelligence from data sources...',
      confidence: 0.7,
      estimatedTimeRemaining: 90,
      userCanInterrupt: false,
      dataSourcesActive: ['theirstack', 'marketaux', 'coresignal', 'perplexity'],
      insightsDiscovered: 0,
      timestamp: new Date()
    });

    const results: ResearchData[] = [];
    const companyName = this.context.userInput.companyName;

    // TheirStack: Technographic intelligence
    try {
      await this.updateProgress({
        stage: 'researching',
        agent: 'researcher',
        message: `Investigating ${companyName} technology stack...`,
        confidence: 0.75,
        estimatedTimeRemaining: 75,
        userCanInterrupt: false,
        dataSourcesActive: ['theirstack'],
        insightsDiscovered: 0,
        timestamp: new Date()
      });

      const theirStackResponse = await axios.get(
        `${ApiConfig.THEIRSTACK_BASE_URL}/companies/search?name=${encodeURIComponent(companyName)}`,
        {
          headers: { 'Authorization': `Bearer ${ApiConfig.THEIRSTACK_JWT}` },
          timeout: ApiConfig.DEFAULT_TIMEOUT_MS
        }
      );

      const theirStackCost = 0.10;
      this.totalCost += theirStackCost;
      this.costTracker.trackApiCost({
        source: 'theirstack',
        cost: theirStackCost,
        timestamp: new Date(),
        requestType: 'solution-focused',
        valueScore: 3.0,
        requestId: this.requestId,
        companyName: companyName
      });

      results.push({
        source: 'theirstack',
        data: theirStackResponse.data || { technologies: [], executives: [] },
        confidence: 0.9,
        timestamp: new Date(),
        cost: theirStackCost
      });
    } catch (error: any) {
      console.warn(`⚠️ TheirStack API failed: ${error.message}`);
      results.push({
        source: 'theirstack',
        data: { error: error.message, status: 'unavailable' },
        confidence: 0.0,
        timestamp: new Date(),
        cost: 0
      });
    }

    // MarketAux: Financial intelligence
    try {
      await this.updateProgress({
        stage: 'researching',
        agent: 'researcher',
        message: `Gathering financial intelligence on ${companyName}...`,
        confidence: 0.80,
        estimatedTimeRemaining: 60,
        userCanInterrupt: false,
        dataSourcesActive: ['marketaux'],
        insightsDiscovered: results.length,
        timestamp: new Date()
      });

      const marketAuxResponse = await axios.get(
        `${ApiConfig.MARKETAUX_BASE_URL}/news/all?companies=${encodeURIComponent(companyName)}&api_token=${ApiConfig.MARKETAUX_TOKEN}&limit=10`,
        { timeout: ApiConfig.DEFAULT_TIMEOUT_MS }
      );

      const marketAuxCost = 0.05;
      this.totalCost += marketAuxCost;
      this.costTracker.trackApiCost({
        source: 'marketaux',
        cost: marketAuxCost,
        timestamp: new Date(),
        requestType: 'solution-focused',
        valueScore: 2.5,
        requestId: this.requestId,
        companyName: companyName
      });

      results.push({
        source: 'marketaux',
        data: marketAuxResponse.data || { news: [], financials: [] },
        confidence: 0.85,
        timestamp: new Date(),
        cost: marketAuxCost
      });
    } catch (error: any) {
      console.warn(`⚠️ MarketAux API failed: ${error.message}`);
      results.push({
        source: 'marketaux',
        data: { error: error.message, status: 'unavailable' },
        confidence: 0.0,
        timestamp: new Date(),
        cost: 0
      });
    }

    // Coresignal: Professional network intelligence
    try {
      await this.updateProgress({
        stage: 'researching',
        agent: 'researcher',
        message: `Analyzing professional networks for ${companyName}...`,
        confidence: 0.85,
        estimatedTimeRemaining: 45,
        userCanInterrupt: false,
        dataSourcesActive: ['coresignal'],
        insightsDiscovered: results.length,
        timestamp: new Date()
      });

      const coresignalResponse = await axios.post(
        ApiConfig.CORESIGNAL_MCP_URL,
        {
          action: 'company_search',
          params: { company_name: companyName }
        },
        {
          headers: { 'apikey': ApiConfig.CORESIGNAL_MCP_AUTH },
          timeout: ApiConfig.DEFAULT_TIMEOUT_MS
        }
      );

      const coresignalCost = 0.08;
      this.totalCost += coresignalCost;
      this.costTracker.trackApiCost({
        source: 'coresignal',
        cost: coresignalCost,
        timestamp: new Date(),
        requestType: 'solution-focused',
        valueScore: 4.0,
        requestId: this.requestId,
        companyName: companyName
      });

      results.push({
        source: 'coresignal',
        data: coresignalResponse.data || { employees: [], departments: [] },
        confidence: 0.88,
        timestamp: new Date(),
        cost: coresignalCost
      });
    } catch (error: any) {
      console.warn(`⚠️ Coresignal API failed: ${error.message}`);
      results.push({
        source: 'coresignal',
        data: { error: error.message, status: 'unavailable' },
        confidence: 0.0,
        timestamp: new Date(),
        cost: 0
      });
    }

    // Perplexity: Real-time intelligence
    try {
      await this.updateProgress({
        stage: 'researching',
        agent: 'researcher',
        message: `Searching real-time intelligence about ${companyName}...`,
        confidence: 0.90,
        estimatedTimeRemaining: 30,
        userCanInterrupt: false,
        dataSourcesActive: ['perplexity'],
        insightsDiscovered: results.length,
        timestamp: new Date()
      });

      const perplexityResponse = await axios.post(
        `${ApiConfig.PERPLEXITY_BASE_URL}/chat/completions`,
        {
          model: 'llama-3.1-sonar-small-128k-online',
          messages: [{
            role: 'user',
            content: `Find current business intelligence about ${companyName}: recent news, strategic initiatives, technology adoption, and market position.`
          }]
        },
        {
          headers: { 'Authorization': `Bearer ${ApiConfig.PERPLEXITY_API_KEY}` },
          timeout: ApiConfig.DEFAULT_TIMEOUT_MS
        }
      );

      const perplexityCost = 0.12;
      this.totalCost += perplexityCost;
      this.costTracker.trackApiCost({
        source: 'perplexity',
        cost: perplexityCost,
        timestamp: new Date(),
        requestType: 'solution-focused',
        valueScore: 5.0,
        requestId: this.requestId,
        companyName: companyName
      });

      results.push({
        source: 'perplexity',
        data: perplexityResponse.data || { insights: [] },
        confidence: 0.92,
        timestamp: new Date(),
        cost: perplexityCost
      });
    } catch (error: any) {
      console.warn(`⚠️ Perplexity API failed: ${error.message}`);
      results.push({
        source: 'perplexity',
        data: { error: error.message, status: 'unavailable' },
        confidence: 0.0,
        timestamp: new Date(),
        cost: 0
      });
    }

    await this.updateProgress({
      stage: 'researching',
      agent: 'researcher',
      message: `Intelligence gathered from ${results.filter(r => r.confidence > 0).length}/4 sources`,
      confidence: 0.95,
      estimatedTimeRemaining: 10,
      userCanInterrupt: false,
      dataSourcesActive: [],
      insightsDiscovered: results.length,
      timestamp: new Date()
    });

    return results;
  }

  getTotalCost(): number {
    return this.totalCost;
  }

  isWithinCostTarget(): boolean {
    return this.totalCost <= ApiConfig.COST_TARGET_PER_DOSSIER;
  }

  async emergencyStop(): Promise<void> {
    console.log('Emergency stop requested');
  }

  reset(): void {
    this.context = null;
    this.totalCost = 0;
    this.requestId = uuidv4();
  }

  private async updateProgress(progress: AgentProgress): Promise<void> {
    if (this.progressCallback) {
      this.progressCallback(progress);
    }
  }
}
