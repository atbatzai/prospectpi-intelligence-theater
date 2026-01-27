/**
 * ProspectPI Intelligence Theater - API Configuration
 * Story 1.1: Three-Agent Orchestration System
 * Epic 2.5.3: Enhanced API Cost Tracking & Performance Monitoring
 * 
 * Centralized API client configuration for all services with real-time cost tracking
 */

import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Epic 2.5.3: Circuit Breaker State Management
 */
export interface CircuitBreakerState {
  isOpen: boolean;
  failureCount: number;
  lastFailureTime: Date | null;
  successCount: number;
  state: 'closed' | 'open' | 'half-open';
}

/**
 * Epic 2.5.3: Real-time API Cost Tracking & Monitoring Service with Circuit Breakers
 */
export class ApiCostTracker {
  private static instance: ApiCostTracker;
  private dailyCosts: Map<string, number> = new Map(); // date -> total cost
  private costHistory: ApiCostData[] = [];
  private budgetAlerts: ((data: { currentCost: number; threshold: number; date: string }) => void)[] = [];
  
  // Task 3.3: Circuit Breaker Implementation
  private circuitBreakers: Map<string, CircuitBreakerState> = new Map();
  private readonly FAILURE_THRESHOLD = 5; // Open circuit after 5 failures
  private readonly SUCCESS_THRESHOLD = 3; // Close circuit after 3 successes  
  private readonly TIMEOUT_DURATION = 60000; // 60 seconds before attempting half-open

  private constructor() {}

  static getInstance(): ApiCostTracker {
    if (!ApiCostTracker.instance) {
      ApiCostTracker.instance = new ApiCostTracker();
    }
    return ApiCostTracker.instance;
  }

  /**
   * Task 2.1: Track API cost with per-request attribution
   */
  trackApiCost(costData: ApiCostData): void {
    const today = new Date().toISOString().split('T')[0];
    const currentDailyCost = this.dailyCosts.get(today) || 0;
    const newDailyCost = currentDailyCost + costData.cost;
    
    this.dailyCosts.set(today, newDailyCost);
    this.costHistory.push(costData);
    
    // Task 2.2: Check budget threshold (120% alert)
    const dailyBudget = ApiConfig.COST_TARGET_PER_DOSSIER * ApiConfig.ENHANCED_API_BUDGET_MULTIPLIER;
    const alertThreshold = dailyBudget * ApiConfig.COST_ALERT_THRESHOLD;
    
    if (newDailyCost >= alertThreshold) {
      this.triggerBudgetAlert(newDailyCost, alertThreshold, today);
    }

    console.log(`🎯 API Cost Tracked: ${costData.source} = $${costData.cost.toFixed(4)} | Daily Total: $${newDailyCost.toFixed(4)}`);
  }

  /**
   * Task 2.2: Automated budget alerting system
   */
  private triggerBudgetAlert(currentCost: number, threshold: number, date: string): void {
    const alertData = { currentCost, threshold, date };
    console.warn(`🚨 BUDGET ALERT: Daily API cost ($${currentCost.toFixed(4)}) exceeded 120% threshold ($${threshold.toFixed(4)}) on ${date}`);
    
    this.budgetAlerts.forEach(callback => callback(alertData));
  }

  /**
   * Task 2.3: Cost reporting for business stakeholders  
   */
  getDailyCostReport(date?: string): { date: string; cost: number; budget: number; utilizationPercent: number } {
    const reportDate = date || new Date().toISOString().split('T')[0];
    const cost = this.dailyCosts.get(reportDate) || 0;
    const budget = ApiConfig.COST_TARGET_PER_DOSSIER * ApiConfig.ENHANCED_API_BUDGET_MULTIPLIER;
    const utilizationPercent = (cost / budget) * 100;

    return { date: reportDate, cost, budget, utilizationPercent };
  }

  /**
   * Task 2.4: Research quality metrics tracking
   */
  getValueMetrics(days: number = 7): { averageValueScore: number; totalRequests: number; solutionFocusedPercent: number } {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const recentData = this.costHistory.filter(item => item.timestamp >= cutoffDate);
    const solutionFocused = recentData.filter(item => item.requestType === 'solution-focused');
    
    const averageValueScore = recentData.length > 0 
      ? recentData.reduce((sum, item) => sum + item.valueScore, 0) / recentData.length 
      : 0;
    
    const solutionFocusedPercent = recentData.length > 0 
      ? (solutionFocused.length / recentData.length) * 100 
      : 0;

    return {
      averageValueScore,
      totalRequests: recentData.length,
      solutionFocusedPercent
    };
  }

  /**
   * Subscribe to budget alerts
   */
  onBudgetAlert(callback: (data: { currentCost: number; threshold: number; date: string }) => void): void {
    this.budgetAlerts.push(callback);
  }

  /**
   * Task 3.3: Circuit Breaker - Check if API source is available
   */
  isApiSourceAvailable(source: string): boolean {
    const breaker = this.getCircuitBreakerState(source);
    
    if (breaker.state === 'open') {
      // Check if timeout period has passed for half-open attempt
      const timeSinceLastFailure = breaker.lastFailureTime 
        ? Date.now() - breaker.lastFailureTime.getTime()
        : 0;
        
      if (timeSinceLastFailure > this.TIMEOUT_DURATION) {
        breaker.state = 'half-open';
        console.log(`🔄 Circuit Breaker: ${source} transitioning to half-open state`);
      } else {
        console.warn(`🚫 Circuit Breaker: ${source} is OPEN - requests blocked`);
        return false;
      }
    }
    
    return true; // Closed or half-open states allow requests
  }

  /**
   * Task 3.3: Record API success for circuit breaker
   */
  recordApiSuccess(source: string): void {
    const breaker = this.getCircuitBreakerState(source);
    breaker.successCount++;
    breaker.failureCount = 0; // Reset failure count on success

    if (breaker.state === 'half-open' && breaker.successCount >= this.SUCCESS_THRESHOLD) {
      breaker.state = 'closed';
      breaker.successCount = 0;
      console.log(`✅ Circuit Breaker: ${source} CLOSED - service recovered`);
    }
  }

  /**
   * Task 3.3: Record API failure for circuit breaker  
   */
  recordApiFailure(source: string): void {
    const breaker = this.getCircuitBreakerState(source);
    breaker.failureCount++;
    breaker.lastFailureTime = new Date();
    breaker.successCount = 0; // Reset success count on failure

    if (breaker.failureCount >= this.FAILURE_THRESHOLD) {
      breaker.state = 'open';
      breaker.isOpen = true;
      console.error(`🚨 Circuit Breaker: ${source} OPENED - service degraded after ${breaker.failureCount} failures`);
    }
  }

  /**
   * Task 3.3: Get or initialize circuit breaker state
   */
  private getCircuitBreakerState(source: string): CircuitBreakerState {
    if (!this.circuitBreakers.has(source)) {
      this.circuitBreakers.set(source, {
        isOpen: false,
        failureCount: 0,
        lastFailureTime: null,
        successCount: 0,
        state: 'closed'
      });
    }
    return this.circuitBreakers.get(source)!;
  }

  /**
   * Task 3.3: Get circuit breaker status for monitoring
   */
  getCircuitBreakerStatus(): Record<string, CircuitBreakerState> {
    const status: Record<string, CircuitBreakerState> = {};
    this.circuitBreakers.forEach((state, source) => {
      status[source] = { ...state }; // Return copy to prevent external modification
    });
    return status;
  }

  /**
   * Task 3.4: Quality Gates - Production Deployment Validation
   */
  validateQualityGates(): { passed: boolean; gates: QualityGateResult[]; overallScore: number } {
    const results: QualityGateResult[] = [];
    
    // Gate 1: Cost Control (Budget within 140% of target)
    const todayCosts = this.getDailyCostReport();
    const costControlPassed = todayCosts.utilizationPercent <= 140;
    results.push({
      name: 'Cost Control',
      passed: costControlPassed,
      score: Math.max(0, 100 - todayCosts.utilizationPercent),
      details: `Budget utilization: ${todayCosts.utilizationPercent.toFixed(1)}%`,
      critical: true
    });

    // Gate 2: Service Availability (>80% APIs operational)
    const circuitStatus = this.getCircuitBreakerStatus();
    const totalServices = Object.keys(circuitStatus).length || 4; // Default 4 services
    const healthyServices = Object.values(circuitStatus).filter(cb => cb.state === 'closed').length;
    const availabilityPercent = totalServices > 0 ? (healthyServices / totalServices) * 100 : 100;
    const availabilityPassed = availabilityPercent >= 80;
    results.push({
      name: 'Service Availability',
      passed: availabilityPassed,
      score: availabilityPercent,
      details: `${healthyServices}/${totalServices} services healthy`,
      critical: true
    });

    // Gate 3: Solution-Relevance Quality (Average score >3.0)
    const qualityMetrics = this.getValueMetrics(7);
    const qualityPassed = qualityMetrics.averageValueScore >= 3.0;
    results.push({
      name: 'Solution Relevance Quality',
      passed: qualityPassed,
      score: (qualityMetrics.averageValueScore / 5) * 100,
      details: `Average quality score: ${qualityMetrics.averageValueScore.toFixed(2)}/5.0`,
      critical: false
    });

    // Gate 4: Solution-Focused Usage (>60% solution-focused requests)
    const solutionFocusPassed = qualityMetrics.solutionFocusedPercent >= 60;
    results.push({
      name: 'Solution Focus Adoption',
      passed: solutionFocusPassed,
      score: qualityMetrics.solutionFocusedPercent,
      details: `${qualityMetrics.solutionFocusedPercent.toFixed(1)}% solution-focused requests`,
      critical: false
    });

    // Calculate overall score
    const criticalGates = results.filter(r => r.critical);
    const nonCriticalGates = results.filter(r => !r.critical);
    
    const criticalPassed = criticalGates.every(g => g.passed);
    const criticalScore = criticalGates.reduce((sum, g) => sum + g.score, 0) / criticalGates.length;
    const nonCriticalScore = nonCriticalGates.reduce((sum, g) => sum + g.score, 0) / nonCriticalGates.length;
    
    const overallScore = criticalPassed ? (criticalScore * 0.7 + nonCriticalScore * 0.3) : 0;
    const passed = criticalPassed && overallScore >= 75;

    return { passed, gates: results, overallScore };
  }
}

/**
 * Epic 2.5.3: Quality Gate Result Interface
 */
export interface QualityGateResult {
  name: string;
  passed: boolean;
  score: number; // 0-100
  details: string;
  critical: boolean; // Critical gates must pass for deployment
}

/**
 * Epic 2.5.3: API Cost Tracking Interface
 */
export interface ApiCostData {
  source: string;
  requestType: 'solution-focused' | 'generic';
  cost: number;
  valueScore: number; // 1-5 scale for solution relevance
  timestamp: Date;
  requestId: string;
  companyName: string;
  solutionContext?: {
    vendorName?: string;
    productName?: string;
    industryFocus?: string;
    painPoints?: string[];
  } | undefined;
}

export class ApiConfig {
  // AI Services
  static readonly ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY!;
  static readonly OPENAI_API_KEY = process.env.OPENAI_API_KEY!;
  static readonly DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY!;
  static readonly GOOGLE_GEMINI_API_KEY = process.env.GOOGLE_GEMINI_API_KEY!;
  static readonly PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY!;
  
  /**
   * Epic 2.5.1: TheirStack Integration for Technographic Intelligence
   */

  // Data Sources
  static readonly THEIRSTACK_JWT = process.env.THEIRSTACK_JWT!;
  static readonly MARKETAUX_TOKEN = process.env.MARKETAUX_TOKEN!;
  static readonly CORESIGNAL_MCP_AUTH = process.env.CORESIGNAL_MCP_AUTH!;
  
  // Infrastructure Intelligence APIs  
  static readonly SHODAN_API_KEY = process.env.SHODAN_API_KEY!;
  // Note: Clearbit removed (acquired by HubSpot)

  // Agent Configuration - Optimized with Claude 3.5 Sonnet (2x faster, better reasoning)
  static readonly INTELLIGENCE_COORDINATOR_MODEL = (() => {
    const model = process.env.INTELLIGENCE_COORDINATOR_MODEL || 'claude-3-5-sonnet-20240620';
    console.log('🔍 LOADING INTELLIGENCE_COORDINATOR_MODEL:', model);
    return model;
  })();
  static readonly INTELLIGENCE_COORDINATOR_TEMPERATURE = parseFloat(process.env.INTELLIGENCE_COORDINATOR_TEMPERATURE || '0.1');
  static readonly FIELD_RESEARCHER_PRIMARY_MODEL = process.env.FIELD_RESEARCHER_PRIMARY_MODEL || 'deepseek-chat';
  static readonly FIELD_RESEARCHER_FALLBACK_MODEL = process.env.FIELD_RESEARCHER_FALLBACK_MODEL || 'gpt-4o-mini';
  static readonly DETECTIVE_MODEL = (() => {
    const model = process.env.DETECTIVE_MODEL || 'claude-3-5-sonnet-20240620';
    console.log('🔍 LOADING DETECTIVE_MODEL:', model);
    return model;
  })();
  static readonly DETECTIVE_TEMPERATURE_MIN = parseFloat(process.env.DETECTIVE_TEMPERATURE_MIN || '0.1');
  static readonly DETECTIVE_TEMPERATURE_MAX = parseFloat(process.env.DETECTIVE_TEMPERATURE_MAX || '0.3');

  // Cost Optimization & Epic 2.5.3 Enhancement
  static readonly COST_TARGET_PER_DOSSIER = parseFloat(process.env.COST_TARGET_PER_DOSSIER || '0.70');
  static readonly ENHANCED_API_BUDGET_MULTIPLIER = parseFloat(process.env.ENHANCED_API_BUDGET_MULTIPLIER || '1.4'); // +40% approved
  static readonly COST_ALERT_THRESHOLD = parseFloat(process.env.COST_ALERT_THRESHOLD || '1.2'); // 120% alert threshold
  
  // Epic 2.5.3: Solution-Relevance Value Targets
  static readonly THEIRSTACK_VALUE_TARGET = parseFloat(process.env.THEIRSTACK_VALUE_TARGET || '3.0'); // 300% improvement
  static readonly MARKETAUX_VALUE_TARGET = parseFloat(process.env.MARKETAUX_VALUE_TARGET || '2.5'); // 250% improvement  
  static readonly CORESIGNAL_VALUE_TARGET = parseFloat(process.env.CORESIGNAL_VALUE_TARGET || '4.0'); // 400% improvement
  static readonly PERPLEXITY_VALUE_TARGET = parseFloat(process.env.PERPLEXITY_VALUE_TARGET || '5.0'); // 500% improvement

  // API Endpoints
  static readonly ANTHROPIC_BASE_URL = 'https://api.anthropic.com';
  static readonly OPENAI_BASE_URL = 'https://api.openai.com/v1';
  static readonly DEEPSEEK_BASE_URL = 'https://api.deepseek.com/v1';
  static readonly PERPLEXITY_BASE_URL = 'https://api.perplexity.ai';
  static readonly THEIRSTACK_BASE_URL = 'https://api.theirstack.com/v1';
  static readonly MARKETAUX_BASE_URL = 'https://api.marketaux.com/v1';
  static readonly CORESIGNAL_MCP_URL = 'https://mcp.coresignal.com/sse';
  
  // Infrastructure Intelligence Base URLs
  static readonly SHODAN_BASE_URL = 'https://api.shodan.io';
  static readonly CLEARBIT_BASE_URL = 'https://person-stream.clearbit.com';
  
  // Rate Limiting
  static readonly RATE_LIMIT_REQUESTS_PER_MINUTE = 60;
  static readonly RATE_LIMIT_REQUESTS_PER_SECOND = 2;
  
  // Timeouts
  static readonly DEFAULT_TIMEOUT_MS = 30000;
  static readonly STANDARD_TIMEOUT_MS = 30000;
  static readonly LONG_TIMEOUT_MS = 120000;

  // Social Media Intelligence APIs (Phase 4 - Future Implementation)
  static readonly REDDIT_BASE_URL = 'https://www.reddit.com';
  static readonly TWITTER_BASE_URL = 'https://api.twitter.com/2';
  static readonly GITHUB_BASE_URL = 'https://api.github.com';
  static readonly YOUTUBE_BASE_URL = 'https://www.googleapis.com/youtube/v3';
  static readonly DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || '';
  static readonly TWITTER_BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN || '';
  static readonly GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
  static readonly YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || '';

  static validateConfiguration(): void {
    const requiredKeys = [
      'ANTHROPIC_API_KEY',
      'OPENAI_API_KEY', 
      'DEEPSEEK_API_KEY',
      'GOOGLE_GEMINI_API_KEY',
      'PERPLEXITY_API_KEY',
      'THEIRSTACK_JWT',
      'MARKETAUX_TOKEN',
      'CORESIGNAL_MCP_AUTH'
    ];

    const missing = requiredKeys.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
  }

  /**
   * Clean Separation: Check if we have real API keys for data sources
   */
  static hasRealDataSourceAPIs(): boolean {
    const dataSourceKeys = [
      'THEIRSTACK_JWT',
      'MARKETAUX_TOKEN', 
      'CORESIGNAL_MCP_AUTH',
      'SHODAN_API_KEY',
      'CLEARBIT_API_KEY'
    ];
    
    return dataSourceKeys.some(key => {
      const value = process.env[key];
      return value && value.length > 20 && !value.includes('demo') && !value.includes('test') && !value.includes('YOUR_');
    });
  }

  /**
   * Clean Separation: Check if we should use mock mode
   */
  static shouldUseMockMode(): boolean {
    return process.env.FORCE_MOCK_MODE === 'true' ||
           !this.hasRealDataSourceAPIs();
  }

  /**
   * Clean Separation: Get system mode for logging
   */
  static getSystemMode(): 'production' | 'development' | 'mock' {
    if (process.env.FORCE_MOCK_MODE === 'true') return 'mock';
    if (!this.hasRealDataSourceAPIs()) return 'mock';
    return process.env.NODE_ENV === 'production' ? 'production' : 'development';
  }
}

export interface ApiClient {
  baseUrl: string;
  apiKey: string;
  timeout: number;
  rateLimitPerMinute: number;
}

export class AnthropicClient implements ApiClient {
  baseUrl = ApiConfig.ANTHROPIC_BASE_URL;
  apiKey = ApiConfig.ANTHROPIC_API_KEY;
  timeout = ApiConfig.LONG_TIMEOUT_MS;
  rateLimitPerMinute = ApiConfig.RATE_LIMIT_REQUESTS_PER_MINUTE;
}

export class OpenAIClient implements ApiClient {
  baseUrl = ApiConfig.OPENAI_BASE_URL;
  apiKey = ApiConfig.OPENAI_API_KEY;
  timeout = ApiConfig.DEFAULT_TIMEOUT_MS;
  rateLimitPerMinute = ApiConfig.RATE_LIMIT_REQUESTS_PER_MINUTE;
}

export class DeepSeekClient implements ApiClient {
  baseUrl = ApiConfig.DEEPSEEK_BASE_URL;
  apiKey = ApiConfig.DEEPSEEK_API_KEY;
  timeout = ApiConfig.DEFAULT_TIMEOUT_MS;
  rateLimitPerMinute = ApiConfig.RATE_LIMIT_REQUESTS_PER_MINUTE;
}

export class PerplexityClient implements ApiClient {
  baseUrl = ApiConfig.PERPLEXITY_BASE_URL;
  apiKey = ApiConfig.PERPLEXITY_API_KEY;
  timeout = ApiConfig.DEFAULT_TIMEOUT_MS;
  rateLimitPerMinute = ApiConfig.RATE_LIMIT_REQUESTS_PER_MINUTE;
}