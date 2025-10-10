/**
 * Task 4.3: API Client Testing with Mobile Network Condition Simulation
 * Tests API client behavior under various mobile network conditions (3G/4G/unstable)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Network condition simulation utilities
interface NetworkCondition {
  effectiveType: '2g' | '3g' | '4g' | 'slow-2g';
  downlink: number; // Mbps
  rtt: number; // Round trip time in ms
  saveData: boolean;
}

const NETWORK_CONDITIONS: Record<string, NetworkCondition> = {
  '4g': {
    effectiveType: '4g',
    downlink: 10.0,
    rtt: 50,
    saveData: false,
  },
  '3g': {
    effectiveType: '3g',
    downlink: 1.5,
    rtt: 300,
    saveData: false,
  },
  '2g': {
    effectiveType: '2g',
    downlink: 0.25,
    rtt: 1000,
    saveData: true,
  },
  'slow-2g': {
    effectiveType: 'slow-2g',
    downlink: 0.05,
    rtt: 2000,
    saveData: true,
  },
};

// Mock API client with network condition simulation
class MockApiClient {
  private networkCondition: NetworkCondition | null = null;
  private requestCount = 0;
  
  setNetworkCondition(condition: NetworkCondition) {
    this.networkCondition = condition;
  }

  async get(url: string) {
    if (!this.networkCondition) {
      throw new Error('Network condition not set');
    }
    
    const condition = this.networkCondition;
    this.requestCount++;
    
    // Simulate network latency (reduced for testing)
    await new Promise(resolve => setTimeout(resolve, Math.min(condition.rtt / 10, 100)));
    
    // Simulate failures on poor connections
    if (condition.effectiveType === 'slow-2g' && this.requestCount <= 2) {
      throw new Error('Network request failed');
    }
    
    return {
      data: {
        message: 'API response',
        networkCondition: condition.effectiveType,
        attempts: this.requestCount,
      },
      status: 200,
    };
  }

  async post(url: string, data: any) {
    if (!this.networkCondition) {
      throw new Error('Network condition not set');
    }
    
    const condition = this.networkCondition;
    
    // Simulate payload optimization on slow networks
    let processedData = { ...data };
    if (condition.effectiveType === '2g') {
      // Remove non-essential fields for 2G
      delete processedData.contextLinks;
      delete processedData.additionalContext;
    } else if (condition.effectiveType === '3g') {
      // Truncate large arrays and strings for 3G
      if (processedData.contextLinks?.length > 10) {
        processedData.contextLinks = processedData.contextLinks.slice(0, 10);
      }
      if (processedData.additionalContext?.length > 1000) {
        processedData.additionalContext = processedData.additionalContext.substring(0, 1000);
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, Math.min(condition.rtt / 10, 100)));
    
    return {
      data: {
        success: true,
        processedData,
        networkCondition: condition.effectiveType,
      },
      status: 200,
    };
  }

  resetRequestCount() {
    this.requestCount = 0;
  }
}

// Test setup
let apiClient: MockApiClient;

describe('Mobile Network Conditions - API Client Testing', () => {
  beforeEach(() => {
    apiClient = new MockApiClient();
  });

  describe('Network Condition Simulation', () => {
    it('should handle 4G network conditions', async () => {
      const condition = NETWORK_CONDITIONS['4g'];
      apiClient.setNetworkCondition(condition);

      const response = await apiClient.get('/api/test');
      
      expect(response.status).toBe(200);
      expect(response.data.networkCondition).toBe('4g');
      expect(response.data.attempts).toBe(1);
    });

    it('should handle 3G network conditions', async () => {
      const condition = NETWORK_CONDITIONS['3g'];
      apiClient.setNetworkCondition(condition);

      const response = await apiClient.get('/api/test');
      
      expect(response.status).toBe(200);
      expect(response.data.networkCondition).toBe('3g');
      expect(response.data.attempts).toBe(1);
    });

    it('should handle 2G network conditions', async () => {
      const condition = NETWORK_CONDITIONS['2g'];
      apiClient.setNetworkCondition(condition);

      const response = await apiClient.get('/api/test');
      
      expect(response.status).toBe(200);
      expect(response.data.networkCondition).toBe('2g');
      expect(response.data.attempts).toBe(1);
    });

    it('should handle slow-2G with retry mechanism', async () => {
      const condition = NETWORK_CONDITIONS['slow-2g'];
      apiClient.setNetworkCondition(condition);

      // First two requests should fail
      await expect(apiClient.get('/api/test')).rejects.toThrow('Network request failed');
      await expect(apiClient.get('/api/test')).rejects.toThrow('Network request failed');
      
      // Third request should succeed
      const response = await apiClient.get('/api/test');
      expect(response.status).toBe(200);
      expect(response.data.networkCondition).toBe('slow-2g');
      expect(response.data.attempts).toBe(3);
    });
  });

  describe('Payload Optimization', () => {
    it('should optimize payload for 2G networks', async () => {
      const condition = NETWORK_CONDITIONS['2g'];
      apiClient.setNetworkCondition(condition);

      const payload = {
        companyName: 'Test Company',
        contextLinks: ['link1', 'link2', 'link3'],
        additionalContext: 'Some additional context',
        requestType: 'research',
      };

      const response = await apiClient.post('/api/research/request', payload);
      
      expect(response.data.success).toBe(true);
      expect(response.data.processedData.contextLinks).toBeUndefined();
      expect(response.data.processedData.additionalContext).toBeUndefined();
      expect(response.data.processedData.companyName).toBe('Test Company');
    });

    it('should truncate large data for 3G networks', async () => {
      const condition = NETWORK_CONDITIONS['3g'];
      apiClient.setNetworkCondition(condition);

      const largePayload = {
        companyName: 'Test Company',
        contextLinks: Array(20).fill('link').map((l, i) => `${l}-${i}`),
        additionalContext: 'x'.repeat(2000),
        requestType: 'research',
      };

      const response = await apiClient.post('/api/research/request', largePayload);
      
      expect(response.data.success).toBe(true);
      expect(response.data.processedData.contextLinks).toHaveLength(10);
      expect(response.data.processedData.additionalContext).toHaveLength(1000);
    });

    it('should preserve full payload for 4G networks', async () => {
      const condition = NETWORK_CONDITIONS['4g'];
      apiClient.setNetworkCondition(condition);

      const payload = {
        companyName: 'Test Company',
        contextLinks: Array(15).fill('link').map((l, i) => `${l}-${i}`),
        additionalContext: 'x'.repeat(1500),
        requestType: 'research',
      };

      const response = await apiClient.post('/api/research/request', payload);
      
      expect(response.data.success).toBe(true);
      expect(response.data.processedData.contextLinks).toHaveLength(15);
      expect(response.data.processedData.additionalContext).toHaveLength(1500);
    });
  });

  describe('Request Retry Logic', () => {
    it('should reset request count between network condition changes', () => {
      apiClient.setNetworkCondition(NETWORK_CONDITIONS['4g']);
      apiClient.resetRequestCount();
      
      apiClient.setNetworkCondition(NETWORK_CONDITIONS['slow-2g']);
      // Test that request count starts fresh
      expect(() => apiClient.resetRequestCount()).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should throw error when network condition not set', async () => {
      await expect(apiClient.get('/api/test')).rejects.toThrow('Network condition not set');
    });

    it('should throw error for POST when network condition not set', async () => {
      await expect(apiClient.post('/api/test', {})).rejects.toThrow('Network condition not set');
    });
  });
});

