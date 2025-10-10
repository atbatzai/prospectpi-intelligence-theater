/**
 * Task 4.4: WebSocket Mobile Optimization Tests
 * Tests WebSocket message batching, reconnection logic, and battery impact optimization
 */

import { describe, it, expect, beforeEach } from 'vitest';

// Network condition interface
interface NetworkCondition {
  effectiveType: '2g' | '3g' | '4g' | 'slow-2g';
  downlink: number;
  rtt: number;
  saveData: boolean;
}

const NETWORK_CONDITIONS: Record<string, NetworkCondition> = {
  '4g': { effectiveType: '4g', downlink: 10.0, rtt: 50, saveData: false },
  '3g': { effectiveType: '3g', downlink: 1.5, rtt: 300, saveData: false },
  '2g': { effectiveType: '2g', downlink: 0.25, rtt: 1000, saveData: true },
  'slow-2g': { effectiveType: 'slow-2g', downlink: 0.05, rtt: 2000, saveData: true },
};

// Mobile WebSocket Manager with optimization features
class MobileWebSocketManager {
  private messageQueue: any[] = [];
  private networkCondition: NetworkCondition | null = null;
  private batteryLevel = 1.0;
  private batchInterval = 100;
  private reconnectAttempts = 0;
  private isConnected = false;

  constructor(private url: string) {}

  setNetworkCondition(condition: NetworkCondition) {
    this.networkCondition = condition;
    this.updateBatchInterval();
  }

  setBatteryLevel(level: number) {
    this.batteryLevel = level;
    this.updateBatchInterval();
  }

  private updateBatchInterval() {
    if (!this.networkCondition) return;

    let interval = 100; // Base 4G interval
    switch (this.networkCondition.effectiveType) {
      case '2g': interval = 500; break;
      case '3g': interval = 300; break;
      case 'slow-2g': interval = 1000; break;
    }

    // Battery optimization
    if (this.batteryLevel < 0.2) {
      interval *= 2; // Double for low battery
    } else if (this.batteryLevel < 0.5) {
      interval *= 1.5; // 1.5x for medium battery
    }

    this.batchInterval = interval;
  }

  connect() {
    this.isConnected = true;
    this.reconnectAttempts = 0;
  }

  disconnect() {
    this.isConnected = false;
  }

  forceDisconnect() {
    this.isConnected = false;
    this.reconnectAttempts++;
  }

  sendMessage(data: any) {
    this.messageQueue.push({ ...data, timestamp: Date.now() });
  }

  private compressMessages(messages: any[]): any[] {
    return messages.map(msg => ({
      t: msg.type?.charAt(0) || 't',
      d: msg.data || msg,
      ts: msg.timestamp
    }));
  }

  simulateMessageBatch(): any {
    if (this.messageQueue.length === 0) return null;

    const batch = [...this.messageQueue];
    this.messageQueue.length = 0;

    // Enable compression for low battery or slow networks
    const shouldCompress = this.batteryLevel < 0.5 || 
      (this.networkCondition?.effectiveType === '2g');

    if (batch.length > 1) {
      return {
        type: 'batch',
        messages: shouldCompress ? this.compressMessages(batch) : batch,
        batchSize: batch.length,
        compressed: shouldCompress
      };
    } else {
      return shouldCompress ? this.compressMessages(batch)[0] : batch[0];
    }
  }

  calculateReconnectDelay(): number {
    const baseDelays = {
      '4g': 1000,
      '3g': 2000,
      '2g': 5000,
      'slow-2g': 10000
    };
    
    const baseDelay = this.networkCondition ? 
      baseDelays[this.networkCondition.effectiveType] : 1000;
    
    // Exponential backoff
    let delay = baseDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    // Battery consideration
    if (this.batteryLevel < 0.2) {
      delay *= 2;
    }
    
    return Math.min(delay, 60000); // Cap at 60 seconds
  }

  getState() {
    return {
      isConnected: this.isConnected,
      queueLength: this.messageQueue.length,
      batchInterval: this.batchInterval,
      batteryLevel: this.batteryLevel,
      networkCondition: this.networkCondition?.effectiveType,
      reconnectAttempts: this.reconnectAttempts,
      reconnectDelay: this.calculateReconnectDelay()
    };
  }
}

let manager: MobileWebSocketManager;

describe('Task 4.4: WebSocket Mobile Optimization', () => {
  beforeEach(() => {
    manager = new MobileWebSocketManager('ws://localhost:3001');
  });

  describe('Message Batching Optimization', () => {
    it('should adapt batch interval to network conditions', () => {
      // 4G network - fastest batching
      manager.setNetworkCondition(NETWORK_CONDITIONS['4g']);
      expect(manager.getState().batchInterval).toBe(100);

      // 3G network - medium batching
      manager.setNetworkCondition(NETWORK_CONDITIONS['3g']);
      expect(manager.getState().batchInterval).toBe(300);

      // 2G network - slower batching
      manager.setNetworkCondition(NETWORK_CONDITIONS['2g']);
      expect(manager.getState().batchInterval).toBe(500);

      // Slow 2G - slowest batching
      manager.setNetworkCondition(NETWORK_CONDITIONS['slow-2g']);
      expect(manager.getState().batchInterval).toBe(1000);
    });

    it('should adjust batch interval based on battery level', () => {
      manager.setNetworkCondition(NETWORK_CONDITIONS['4g']);
      
      // High battery - normal interval
      manager.setBatteryLevel(0.75);
      expect(manager.getState().batchInterval).toBe(100);

      // Medium battery - 1.5x interval
      manager.setBatteryLevel(0.35);
      expect(manager.getState().batchInterval).toBe(150);

      // Low battery - 2x interval
      manager.setBatteryLevel(0.15);
      expect(manager.getState().batchInterval).toBe(200);
    });

    it('should batch multiple messages together', () => {
      manager.setNetworkCondition(NETWORK_CONDITIONS['4g']);
      
      manager.sendMessage({ type: 'progress', data: 'msg1' });
      manager.sendMessage({ type: 'progress', data: 'msg2' });
      manager.sendMessage({ type: 'status', data: 'msg3' });

      const batch = manager.simulateMessageBatch();
      expect(batch.type).toBe('batch');
      expect(batch.messages).toHaveLength(3);
      expect(batch.batchSize).toBe(3);
    });

    it('should handle single messages without batch wrapper', () => {
      manager.setNetworkCondition(NETWORK_CONDITIONS['4g']);
      
      manager.sendMessage({ type: 'heartbeat', data: 'ping' });

      const message = manager.simulateMessageBatch();
      expect(message.type).toBe('heartbeat');
      expect(message.data).toBe('ping');
      expect(message.timestamp).toBeDefined();
    });
  });

  describe('Reconnection Logic', () => {
    it('should calculate base delays by network condition', () => {
      // 4G - 1 second base delay
      manager.setNetworkCondition(NETWORK_CONDITIONS['4g']);
      manager.forceDisconnect();
      expect(manager.getState().reconnectDelay).toBe(1000);

      // 3G - 2 second base delay
      manager.setNetworkCondition(NETWORK_CONDITIONS['3g']);
      expect(manager.getState().reconnectDelay).toBe(2000);

      // 2G - 5 second base delay
      manager.setNetworkCondition(NETWORK_CONDITIONS['2g']);
      expect(manager.getState().reconnectDelay).toBe(5000);
    });

    it('should implement exponential backoff', () => {
      manager.setNetworkCondition(NETWORK_CONDITIONS['4g']);
      
      // First reconnection attempt - base delay
      manager.forceDisconnect();
      expect(manager.getState().reconnectDelay).toBe(1000);

      // Second attempt - double delay
      manager.forceDisconnect();
      expect(manager.getState().reconnectDelay).toBe(2000);

      // Third attempt - quadruple delay
      manager.forceDisconnect();
      expect(manager.getState().reconnectDelay).toBe(4000);
    });

    it('should consider battery level in reconnection timing', () => {
      manager.setNetworkCondition(NETWORK_CONDITIONS['4g']);
      
      // Normal battery
      manager.setBatteryLevel(0.8);
      manager.forceDisconnect();
      expect(manager.getState().reconnectDelay).toBe(1000);

      // Low battery - should double delay
      manager.setBatteryLevel(0.15);
      expect(manager.getState().reconnectDelay).toBe(2000);
    });
  });

  describe('Battery Impact Optimization', () => {
    it('should enable compression on low battery', () => {
      manager.setNetworkCondition(NETWORK_CONDITIONS['4g']);
      manager.setBatteryLevel(0.3); // Low battery

      manager.sendMessage({ type: 'data_update', data: 'content' });

      const message = manager.simulateMessageBatch();
      expect(message.t).toBeDefined(); // Compressed format
      expect(message.d).toBeDefined();
      expect(message.ts).toBeDefined();
    });

    it('should enable compression on slow networks', () => {
      manager.setNetworkCondition(NETWORK_CONDITIONS['2g']);
      manager.setBatteryLevel(0.8); // High battery

      manager.sendMessage({ type: 'sync_request', data: 'payload' });

      const message = manager.simulateMessageBatch();
      expect(message.t).toBe('s'); // Compressed type
      expect(message.d).toBe('payload');
    });

    it('should use normal format when conditions are good', () => {
      manager.setNetworkCondition(NETWORK_CONDITIONS['4g']);
      manager.setBatteryLevel(0.8); // High battery

      manager.sendMessage({ type: 'notification', data: 'alert' });

      const message = manager.simulateMessageBatch();
      expect(message.type).toBe('notification'); // Normal format
      expect(message.data).toBe('alert');
    });
  });

  describe('Connection State Management', () => {
    it('should track connection state correctly', () => {
      expect(manager.getState().isConnected).toBe(false);

      manager.connect();
      expect(manager.getState().isConnected).toBe(true);

      manager.disconnect();
      expect(manager.getState().isConnected).toBe(false);
    });

    it('should queue messages when disconnected', () => {
      manager.sendMessage({ type: 'offline', data: 'queued' });

      const state = manager.getState();
      expect(state.isConnected).toBe(false);
      expect(state.queueLength).toBe(1);
    });

    it('should maintain message order', () => {
      manager.sendMessage({ type: 'first', data: '1' });
      manager.sendMessage({ type: 'second', data: '2' });
      manager.sendMessage({ type: 'third', data: '3' });

      const batch = manager.simulateMessageBatch();
      expect(batch.messages[0].data).toBe('1');
      expect(batch.messages[1].data).toBe('2');
      expect(batch.messages[2].data).toBe('3');
    });
  });
});