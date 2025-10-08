/**
 * ProspectPI Intelligence Theater - Field Intelligence Researcher Agent
 * Story 1.1: Three-Agent Orchestration System
 * 
 * Agent 2: Field Intelligence Researcher
 * - Primary Model: DeepSeek (deepseek-chat) for cost optimization
 * - Fallback Model: GPT-4o-mini for reliability
 * - Role: Data collection from 4 premium sources + real-time web
 * - APIs: TheirStack, MarketAux, Coresignal MCP, Perplexity
 * - Cost Target: $0.70/dossier
 */

import { ApiConfig } from '@config/ApiConfig';
import { 
  AgentProgress, 
  AgentContext, 
  ResearchData,
  AgentError 
} from '@interfaces/AgentTypes';
import axios, { AxiosResponse } from 'axios';

interface APIResponse {
  source: 'theirstack' | 'marketaux' | 'coresignal' | 'perplexity';
  data: any;
  success: boolean;
  cost: number;
  responseTime: number;
  error?: string;
}

export class FieldIntelligenceResearcher {
  private context: AgentContext | null = null;
  private progressCallback: ((progress: AgentProgress) => void) | undefined;
  private totalCost: number = 0;

  constructor(progressCallback?: (progress: AgentProgress) => void) {
    this.progressCallback = progressCallback;
  }

  /**
   * Initialize research mission with context
   */
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

  /**
   * Gather intelligence from all available sources in parallel
   */
  async gatherIntelligence(): Promise<ResearchData[]> {
    if (!this.context) {
      throw new Error('Research context not initialized. Call initializeResearch first.');
    }

    const companyName = this.context.userInput.companyName;
    
    await this.updateProgress({
      stage: 'researching',
      agent: 'researcher',
      message: 'Initiating parallel data collection from all sources...',
      confidence: 0.7,
      estimatedTimeRemaining: 90,
      userCanInterrupt: false,
      dataSourcesActive: ['theirstack', 'marketaux', 'coresignal', 'perplexity'],
      insightsDiscovered: 0,
      timestamp: new Date()
    });

    // Execute all API calls in parallel with rate limiting
    const researchPromises = [
      this.collectTheirStackData(companyName),
      this.collectMarketAuxData(companyName),
      this.collectCoresignalData(companyName),
      this.collectPerplexityData(companyName)
    ];

    try {
      const apiResponses = await Promise.allSettled(researchPromises);
      const researchData: ResearchData[] = [];
      let insightsCount = 0;

      // Process all responses
      for (const response of apiResponses) {
        if (response.status === 'fulfilled' && response.value.success) {
          const apiResponse = response.value;
          researchData.push({
            source: apiResponse.source,
            data: apiResponse.data,
            confidence: this.calculateConfidence(apiResponse),
            timestamp: new Date(),
            cost: apiResponse.cost
          });
          this.totalCost += apiResponse.cost;
          insightsCount++;
        }
      }

      await this.updateProgress({
        stage: 'researching',
        agent: 'researcher',
        message: `Research complete: ${insightsCount} sources successful`,
        confidence: 0.9,
        estimatedTimeRemaining: 30,
        userCanInterrupt: false,
        dataSourcesActive: [],
        insightsDiscovered: insightsCount,
        timestamp: new Date()
      });

      return researchData;

    } catch (error: any) {
      await this.handleError({
        agent: 'researcher',
        error: `Intelligence gathering failed: ${error.message}`,
        recoverable: true,
        timestamp: new Date(),
        context: { companyName, totalCost: this.totalCost }
      });
      throw error;
    }
  }

  /**
   * Collect technographic data from TheirStack
   */
  private async collectTheirStackData(companyName: string): Promise<APIResponse> {
    const startTime = Date.now();
    
    try {
      await this.updateProgress({
        stage: 'researching',
        agent: 'researcher',
        message: 'Collecting technographic intelligence from TheirStack...',
        confidence: 0.8,
        estimatedTimeRemaining: 60,
        userCanInterrupt: false,
        dataSourcesActive: ['theirstack'],
        insightsDiscovered: 0,
        timestamp: new Date()
      });

      const response: AxiosResponse = await axios.get(
        `${ApiConfig.THEIRSTACK_BASE_URL}/companies/search`,
        {
          headers: {
            'Authorization': `Bearer ${ApiConfig.THEIRSTACK_JWT}`,
            'Content-Type': 'application/json'
          },
          params: {
            name: companyName,
            limit: 10
          },
          timeout: ApiConfig.DEFAULT_TIMEOUT_MS
        }
      );

      return {
        source: 'theirstack',
        data: response.data,
        success: true,
        cost: 0.15, // Estimated cost per API call
        responseTime: Date.now() - startTime
      };

    } catch (error: any) {
      return {
        source: 'theirstack',
        data: null,
        success: false,
        cost: 0,
        responseTime: Date.now() - startTime,
        error: error.message
      };
    }
  }

  /**
   * Collect financial news from MarketAux
   */
  private async collectMarketAuxData(companyName: string): Promise<APIResponse> {
    const startTime = Date.now();
    
    try {
      await this.updateProgress({
        stage: 'researching',
        agent: 'researcher',
        message: 'Gathering financial intelligence from MarketAux...',
        confidence: 0.8,
        estimatedTimeRemaining: 45,
        userCanInterrupt: false,
        dataSourcesActive: ['marketaux'],
        insightsDiscovered: 1,
        timestamp: new Date()
      });

      const response: AxiosResponse = await axios.get(
        `${ApiConfig.MARKETAUX_BASE_URL}/news/all`,
        {
          params: {
            api_token: ApiConfig.MARKETAUX_TOKEN,
            search: companyName,
            limit: 20,
            published_after: '2024-01-01T00:00:00Z'
          },
          timeout: ApiConfig.DEFAULT_TIMEOUT_MS
        }
      );

      return {
        source: 'marketaux',
        data: response.data,
        success: true,
        cost: 0.10, // Estimated cost per API call
        responseTime: Date.now() - startTime
      };

    } catch (error: any) {
      return {
        source: 'marketaux',
        data: null,
        success: false,
        cost: 0,
        responseTime: Date.now() - startTime,
        error: error.message
      };
    }
  }

  /**
   * Collect professional data from Coresignal MCP
   */
  private async collectCoresignalData(companyName: string): Promise<APIResponse> {
    const startTime = Date.now();
    
    try {
      await this.updateProgress({
        stage: 'researching',
        agent: 'researcher',
        message: 'Accessing professional intelligence via Coresignal MCP...',
        confidence: 0.7,
        estimatedTimeRemaining: 30,
        userCanInterrupt: false,
        dataSourcesActive: ['coresignal'],
        insightsDiscovered: 2,
        timestamp: new Date()
      });

      // MCP integration would be handled via specific protocol
      // For now, implementing as HTTP request to SSE endpoint
      const response: AxiosResponse = await axios.post(
        ApiConfig.CORESIGNAL_MCP_URL,
        {
          method: 'company_search',
          params: {
            name: companyName,
            limit: 10
          }
        },
        {
          headers: {
            'apikey': ApiConfig.CORESIGNAL_MCP_AUTH,
            'Content-Type': 'application/json'
          },
          timeout: ApiConfig.LONG_TIMEOUT_MS
        }
      );

      return {
        source: 'coresignal',
        data: response.data,
        success: true,
        cost: 0.20, // Estimated cost per API call
        responseTime: Date.now() - startTime
      };

    } catch (error: any) {
      return {
        source: 'coresignal',
        data: null,
        success: false,
        cost: 0,
        responseTime: Date.now() - startTime,
        error: error.message
      };
    }
  }

  /**
   * Collect real-time web intelligence from Perplexity
   */
  private async collectPerplexityData(companyName: string): Promise<APIResponse> {
    const startTime = Date.now();
    
    try {
      await this.updateProgress({
        stage: 'researching',
        agent: 'researcher',
        message: 'Gathering real-time web intelligence from Perplexity...',
        confidence: 0.9,
        estimatedTimeRemaining: 15,
        userCanInterrupt: false,
        dataSourcesActive: ['perplexity'],
        insightsDiscovered: 3,
        timestamp: new Date()
      });

      const query = `${companyName} company profile, recent news, business model, key executives, technology stack, competitive position`;
      
      const response: AxiosResponse = await axios.post(
        `${ApiConfig.PERPLEXITY_BASE_URL}/chat/completions`,
        {
          model: 'llama-3.1-sonar-small-128k-online',
          messages: [{
            role: 'user',
            content: query
          }],
          max_tokens: 2000,
          temperature: 0.2,
          return_citations: true,
          return_images: false
        },
        {
          headers: {
            'Authorization': `Bearer ${ApiConfig.PERPLEXITY_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: ApiConfig.LONG_TIMEOUT_MS
        }
      );

      return {
        source: 'perplexity',
        data: response.data,
        success: true,
        cost: 0.25, // Estimated cost per API call
        responseTime: Date.now() - startTime
      };

    } catch (error: any) {
      return {
        source: 'perplexity',
        data: null,
        success: false,
        cost: 0,
        responseTime: Date.now() - startTime,
        error: error.message
      };
    }
  }

  /**
   * Calculate confidence score based on API response quality
   */
  private calculateConfidence(apiResponse: APIResponse): number {
    let confidence = 0.5; // Base confidence
    
    // Adjust based on response time (faster = more reliable)
    if (apiResponse.responseTime < 5000) confidence += 0.2;
    else if (apiResponse.responseTime < 10000) confidence += 0.1;
    
    // Adjust based on data richness
    if (apiResponse.data) {
      const dataSize = JSON.stringify(apiResponse.data).length;
      if (dataSize > 5000) confidence += 0.2;
      else if (dataSize > 1000) confidence += 0.1;
    }
    
    // Source-specific adjustments
    switch (apiResponse.source) {
      case 'perplexity':
        confidence += 0.1; // Real-time web data bonus
        break;
      case 'theirstack':
        confidence += 0.05; // Technographic data bonus
        break;
    }
    
    return Math.min(confidence, 1.0);
  }

  /**
   * Get current research cost
   */
  getTotalCost(): number {
    return this.totalCost;
  }

  /**
   * Check if cost target is being met
   */
  isWithinCostTarget(): boolean {
    return this.totalCost <= ApiConfig.COST_TARGET_PER_DOSSIER;
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
    console.error(`[Field Intelligence Researcher Error] ${error.error}`, error.context);
    
    if (this.progressCallback) {
      this.progressCallback({
        stage: 'researching',
        agent: 'researcher',
        message: `Error: ${error.error}`,
        confidence: 0,
        estimatedTimeRemaining: 0,
        userCanInterrupt: true,
        timestamp: new Date()
      });
    }
  }

  /**
   * Reset researcher for new mission
   */
  reset(): void {
    this.context = null;
    this.totalCost = 0;
  }
}