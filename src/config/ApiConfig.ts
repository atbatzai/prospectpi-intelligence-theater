/**
 * ProspectPI Intelligence Theater - API Configuration
 * Story 1.1: Three-Agent Orchestration System
 * 
 * Centralized API client configuration for all services
 */

import dotenv from 'dotenv';

dotenv.config();

export class ApiConfig {
  // AI Services
  static readonly ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY!;
  static readonly OPENAI_API_KEY = process.env.OPENAI_API_KEY!;
  static readonly DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY!;
  static readonly GOOGLE_GEMINI_API_KEY = process.env.GOOGLE_GEMINI_API_KEY!;
  static readonly PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY!;

  // Data Sources
  static readonly THEIRSTACK_JWT = process.env.THEIRSTACK_JWT!;
  static readonly MARKETAUX_TOKEN = process.env.MARKETAUX_TOKEN!;
  static readonly CORESIGNAL_MCP_AUTH = process.env.CORESIGNAL_MCP_AUTH!;

  // Agent Configuration
  static readonly INTELLIGENCE_COORDINATOR_MODEL = process.env.INTELLIGENCE_COORDINATOR_MODEL || 'claude-3-5-sonnet-20241022';
  static readonly INTELLIGENCE_COORDINATOR_TEMPERATURE = parseFloat(process.env.INTELLIGENCE_COORDINATOR_TEMPERATURE || '0.1');
  static readonly FIELD_RESEARCHER_PRIMARY_MODEL = process.env.FIELD_RESEARCHER_PRIMARY_MODEL || 'deepseek-chat';
  static readonly FIELD_RESEARCHER_FALLBACK_MODEL = process.env.FIELD_RESEARCHER_FALLBACK_MODEL || 'gpt-4o-mini';
  static readonly DETECTIVE_MODEL = process.env.DETECTIVE_MODEL || 'claude-3-5-sonnet-20241022';
  static readonly DETECTIVE_TEMPERATURE_MIN = parseFloat(process.env.DETECTIVE_TEMPERATURE_MIN || '0.1');
  static readonly DETECTIVE_TEMPERATURE_MAX = parseFloat(process.env.DETECTIVE_TEMPERATURE_MAX || '0.3');

  // Cost Optimization
  static readonly COST_TARGET_PER_DOSSIER = parseFloat(process.env.COST_TARGET_PER_DOSSIER || '0.70');

  // API Endpoints
  static readonly ANTHROPIC_BASE_URL = 'https://api.anthropic.com';
  static readonly OPENAI_BASE_URL = 'https://api.openai.com/v1';
  static readonly DEEPSEEK_BASE_URL = 'https://api.deepseek.com/v1';
  static readonly PERPLEXITY_BASE_URL = 'https://api.perplexity.ai';
  static readonly THEIRSTACK_BASE_URL = 'https://api.theirstack.com/v1';
  static readonly MARKETAUX_BASE_URL = 'https://api.marketaux.com/v1';
  static readonly CORESIGNAL_MCP_URL = 'https://mcp.coresignal.com/sse';

  // Rate Limiting
  static readonly RATE_LIMIT_REQUESTS_PER_MINUTE = 60;
  static readonly RATE_LIMIT_REQUESTS_PER_SECOND = 2;
  
  // Timeouts
  static readonly DEFAULT_TIMEOUT_MS = 30000;
  static readonly LONG_TIMEOUT_MS = 120000;

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