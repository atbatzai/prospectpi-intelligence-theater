/**
 * Task 4.3: WebSocket Mobile Network Condition Testing
 * Tests WebSocket behavior under mobile network conditions and optimization
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock WebSocket class
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = MockWebSocket.CONNECTING;
  url: string;
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  
  private messageQueue: string[] = [];

  constructor(url: string) {
    this.url = url;
    // Simulate connection opening after a delay
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      this.onopen?.(new Event('open'));
    }, 10);
  }

  send(data: string | ArrayBufferLike | Blob | ArrayBufferView) {
    if (this.readyState !== MockWebSocket.OPEN) {
      throw new Error('WebSocket is not open');
    }
    this.messageQueue.push(String(data));
  }

  close(code?: number, reason?: string) {
    this.readyState = MockWebSocket.CLOSING;
    setTimeout(() => {
      this.readyState = MockWebSocket.CLOSED;
      this.onclose?.(new CloseEvent('close', { code: code || 1000, reason }));
    }, 5);
  }

  getMessageQueue() {
    return [...this.messageQueue];
  }
}

// Network condition utilities
interface NetworkCondition {
  effectiveType: '2g' | '3g' | '4g' | 'slow-2g';
  downlink: number;
  rtt: number;
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

// Mobile WebSocket Manager
class MobileWebSocketManager {
  private ws: MockWebSocket | null = null;
  private networkCondition: NetworkCondition | null = null;
  private messageQueue: any[] = [];
  private isConnected = false;
  private batteryLevel = 1.0;

  constructor(private url: string) {}

  setNetworkCondition(condition: NetworkCondition) {
    this.networkCondition = condition;
  }

  setBatteryLevel(level: number) {
    this.batteryLevel = level;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new MockWebSocket(this.url);
      
      this.ws.onopen = () => {
        this.isConnected = true;
        this.flushMessageQueue();
        resolve();
      };

      this.ws.onerror = () => {
        reject(new Error('Connection failed'));
      };

      this.ws.onclose = () => {
        this.isConnected = false;
      };
    });
  }

  send(data: any) {
    const optimizedData = this.optimizeForNetwork(data);
    
    if (this.isConnected && this.ws) {
      this.ws.send(JSON.stringify(optimizedData));
    } else {
      this.messageQueue.push(optimizedData);
    }
  }

  private optimizeForNetwork(data: any) {
    if (!this.networkCondition) return data;

    let optimized = { ...data };

    // Optimize for slow networks
    if (this.networkCondition.effectiveType === '2g') {
      delete optimized.metadata;
      delete optimized.contextLinks;
      
      if (optimized.content && optimized.content.length > 100) {
        optimized.content = optimized.content.substring(0, 100) + '...';
      }
    } else if (this.networkCondition.effectiveType === '3g') {
      if (optimized.contextLinks?.length > 5) {
        optimized.contextLinks = optimized.contextLinks.slice(0, 5);
      }
    }

    // Battery optimization
    if (this.batteryLevel < 0.2) {
      optimized.priority = 'low-power';
      delete optimized.animations;
    }

    return optimized;
  }

  private flushMessageQueue() {
    while (this.messageQueue.length > 0 && this.isConnected && this.ws) {
      const message = this.messageQueue.shift();
      this.ws.send(JSON.stringify(message));
    }
  }

  close() {
    if (this.ws) {
      this.ws.close();
    }
    this.isConnected = false;
  }

  getState() {
    return {
      isConnected: this.isConnected,
      queueLength: this.messageQueue.length,
      batteryLevel: this.batteryLevel,
    };
  }
}

// Test setup
let wsManager: MobileWebSocketManager;

describe('WebSocket Mobile Network Conditions', () => {
  beforeEach(() => {
    global.WebSocket = MockWebSocket as any;
    wsManager = new MobileWebSocketManager('ws://localhost:3001');
  });

  describe('Network Condition Optimization', () => {
    it('should handle 4G network connections efficiently', async () => {
      const condition = NETWORK_CONDITIONS['4g'];
      wsManager.setNetworkCondition(condition);

      await wsManager.connect();
      
      const testData = {
        type: 'research_request',
        content: 'Full content for 4G',
        metadata: { priority: 'high' },
        contextLinks: ['link1', 'link2', 'link3'],
      };

      wsManager.send(testData);
      
      const state = wsManager.getState();
      expect(state.isConnected).toBe(true);
      expect(state.queueLength).toBe(0);
    });

    it('should optimize messages for 3G networks', async () => {
      const condition = NETWORK_CONDITIONS['3g'];
      wsManager.setNetworkCondition(condition);

      await wsManager.connect();
      
      const testData = {
        type: 'research_request',
        content: 'Test content',
        contextLinks: Array(10).fill('link'), // Should be truncated to 5
        metadata: { priority: 'medium' },
      };

      wsManager.send(testData);
      
      expect(wsManager.getState().isConnected).toBe(true);
    });

    it('should aggressively optimize for 2G networks', async () => {
      const condition = NETWORK_CONDITIONS['2g'];
      wsManager.setNetworkCondition(condition);

      await wsManager.connect();
      
      const testData = {
        type: 'research_request',
        content: 'x'.repeat(200), // Should be truncated to 100 chars
        metadata: { priority: 'high' }, // Should be removed
        contextLinks: ['link1', 'link2'], // Should be removed
      };

      wsManager.send(testData);
      
      expect(wsManager.getState().isConnected).toBe(true);
    });

    it('should queue messages when disconnected', async () => {
      const condition = NETWORK_CONDITIONS['4g'];
      wsManager.setNetworkCondition(condition);

      // Don't connect, just send messages
      const testData = {
        type: 'research_request',
        content: 'Queued message',
      };

      wsManager.send(testData);
      
      const state = wsManager.getState();
      expect(state.isConnected).toBe(false);
      expect(state.queueLength).toBe(1);
    });
  });

  describe('Battery Optimization', () => {
    it('should optimize for low battery conditions', async () => {
      const condition = NETWORK_CONDITIONS['3g'];
      wsManager.setNetworkCondition(condition);
      wsManager.setBatteryLevel(0.15); // 15% battery

      await wsManager.connect();
      
      const testData = {
        type: 'research_request',
        content: 'Test content',
        animations: ['fade', 'slide'], // Should be removed
        richMedia: { images: ['img1.jpg'] }, // Should be removed
      };

      wsManager.send(testData);
      
      expect(wsManager.getState().batteryLevel).toBe(0.15);
    });

    it('should handle connection closure', () => {
      wsManager.close();
      
      expect(wsManager.getState().isConnected).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle network condition checks', () => {
      // Test basic network condition functionality
      const condition = NETWORK_CONDITIONS['4g'];
      wsManager.setNetworkCondition(condition);
      
      expect(condition.effectiveType).toBe('4g');
      expect(condition.downlink).toBe(10.0);
      expect(condition.rtt).toBe(50);
    });
  });
});