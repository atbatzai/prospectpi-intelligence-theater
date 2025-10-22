/**
 * ProspectPI Intelligence Theater - API Connectivity Tests
 * Story 1.1: Three-Agent Orchestration System
 * 
 * Tests all API connections to ensure services are ready
 */

import { ApiConfig } from '../config/ApiConfig';
import axios from 'axios';

export interface ConnectivityResult {
  service: string;
  connected: boolean;
  responseTime: number;
  error?: string;
}

export class ApiConnectivityTest {
  private static async testService(
    name: string,
    url: string,
    headers: Record<string, string> = {},
    timeout: number = 10000
  ): Promise<ConnectivityResult> {
    const startTime = Date.now();
    
    try {
      await axios.get(url, {
        headers,
        timeout,
        validateStatus: (status: number) => status < 500 // Accept 400s as "connected"
      });
      
      return {
        service: name,
        connected: true,
        responseTime: Date.now() - startTime
      };
    } catch (error: any) {
      return {
        service: name,
        connected: false,
        responseTime: Date.now() - startTime,
        error: error.message
      };
    }
  }

  static async testAnthropicConnection(): Promise<ConnectivityResult> {
    return this.testService(
      'Anthropic Claude',
      `${ApiConfig.ANTHROPIC_BASE_URL}/v1/messages`,
      {
        'x-api-key': ApiConfig.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      }
    );
  }

  static async testOpenAIConnection(): Promise<ConnectivityResult> {
    return this.testService(
      'OpenAI GPT',
      `${ApiConfig.OPENAI_BASE_URL}/models`,
      {
        'Authorization': `Bearer ${ApiConfig.OPENAI_API_KEY}`,
        'content-type': 'application/json'
      }
    );
  }

  static async testDeepSeekConnection(): Promise<ConnectivityResult> {
    return this.testService(
      'DeepSeek',
      `${ApiConfig.DEEPSEEK_BASE_URL}/models`,
      {
        'Authorization': `Bearer ${ApiConfig.DEEPSEEK_API_KEY}`,
        'content-type': 'application/json'
      }
    );
  }

  static async testPerplexityConnection(): Promise<ConnectivityResult> {
    return this.testService(
      'Perplexity',
      `${ApiConfig.PERPLEXITY_BASE_URL}/chat/completions`,
      {
        'Authorization': `Bearer ${ApiConfig.PERPLEXITY_API_KEY}`,
        'content-type': 'application/json'
      }
    );
  }

  static async testTheirStackConnection(): Promise<ConnectivityResult> {
    return this.testService(
      'TheirStack',
      `${ApiConfig.THEIRSTACK_BASE_URL}/companies`,
      {
        'Authorization': `Bearer ${ApiConfig.THEIRSTACK_JWT}`,
        'content-type': 'application/json'
      }
    );
  }

  static async testMarketAuxConnection(): Promise<ConnectivityResult> {
    return this.testService(
      'MarketAux',
      `${ApiConfig.MARKETAUX_BASE_URL}/news/all?api_token=${ApiConfig.MARKETAUX_TOKEN}&limit=1`,
      {
        'content-type': 'application/json'
      }
    );
  }

  static async testCoresignalConnection(): Promise<ConnectivityResult> {
    // Coresignal uses MCP protocol, so we test the basic endpoint
    return this.testService(
      'Coresignal MCP',
      ApiConfig.CORESIGNAL_MCP_URL,
      {
        'apikey': ApiConfig.CORESIGNAL_MCP_AUTH,
        'content-type': 'application/json'
      }
    );
  }

  static async testAllConnections(): Promise<ConnectivityResult[]> {
    console.log('🔍 Testing API connectivity for all services...');
    
    const tests = [
      this.testAnthropicConnection(),
      this.testOpenAIConnection(),
      this.testDeepSeekConnection(),
      this.testPerplexityConnection(),
      this.testTheirStackConnection(),
      this.testMarketAuxConnection(),
      this.testCoresignalConnection()
    ];

    const results = await Promise.all(tests);
    
    console.log('\n📊 API Connectivity Results:');
    results.forEach(result => {
      const status = result.connected ? '✅' : '❌';
      const time = `${result.responseTime}ms`;
      console.log(`${status} ${result.service}: ${time}${result.error ? ` - ${result.error}` : ''}`);
    });

    const connectedCount = results.filter(r => r.connected).length;
    console.log(`\n📈 Overall: ${connectedCount}/${results.length} services connected`);
    
    return results;
  }

  static async validateAllConnections(): Promise<boolean> {
    try {
      ApiConfig.validateConfiguration();
      const results = await this.testAllConnections();
      const allConnected = results.every(r => r.connected);
      
      if (!allConnected) {
        console.error('❌ Some API connections failed. Check your API keys and network connectivity.');
        return false;
      }
      
      console.log('✅ All API connections validated successfully!');
      return true;
    } catch (error) {
      console.error('❌ API validation failed:', error);
      return false;
    }
  }
}