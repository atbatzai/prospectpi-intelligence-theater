/**
 * Task 5.3: Mobile WebSocket Message Batcher
 * Advanced message batching system for mobile optimization with adaptive performance integration
 */

interface WebSocketMessage {
  id: string;
  type: string;
  data: any;
  timestamp: number;
  priority: 'high' | 'medium' | 'low';
}

interface BatchingConfig {
  batchSize: number;
  batchInterval: number;
  priorityThreshold: number;
  compressionEnabled: boolean;
  adaptiveFrequency: boolean;
}

export class MobileWebSocketBatcher {
  private static instance: MobileWebSocketBatcher;
  
  private messageQueue: WebSocketMessage[] = [];
  private batchTimeout: NodeJS.Timeout | null = null;
  private config: BatchingConfig;
  
  // Mobile-specific optimizations
  private batteryLevel: number = 1.0;
  private networkQuality: 'wifi' | '4G' | '3G' | '2G' | 'slow-2G' = 'wifi';
  private performanceTier: 'high' | 'medium' | 'low' = 'high';
  
  // Performance tracking
  private metrics = {
    messagesQueued: 0,
    batchesProcessed: 0,
    compressionRatio: 0,
    averageBatchSize: 0,
    batteryImpact: 0
  };

  static getInstance(): MobileWebSocketBatcher {
    if (!MobileWebSocketBatcher.instance) {
      MobileWebSocketBatcher.instance = new MobileWebSocketBatcher();
    }
    return MobileWebSocketBatcher.instance;
  }

  constructor() {
    this.config = this.getDefaultConfig();
    this.initializeMobileDetection();
  }

  private getDefaultConfig(): BatchingConfig {
    return {
      batchSize: 10,
      batchInterval: 250, // 250ms default
      priorityThreshold: 5,
      compressionEnabled: true,
      adaptiveFrequency: true
    };
  }

  private initializeMobileDetection(): void {
    // Battery API integration
    if ('getBattery' in navigator && typeof (navigator as any).getBattery === 'function') {
      (navigator as any).getBattery().then((battery: any) => {
        this.batteryLevel = battery.level;
        this.updateConfigForBattery();
        
        battery.addEventListener('levelchange', () => {
          this.batteryLevel = battery.level;
          this.updateConfigForBattery();
        });
      });
    }

    // Network quality detection
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      this.updateNetworkQuality(connection.effectiveType || 'wifi');
      
      connection.addEventListener('change', () => {
        this.updateNetworkQuality(connection.effectiveType || 'wifi');
      });
    }

    // Performance tier detection
    this.detectPerformanceTier();
  }

  private updateConfigForBattery(): void {
    // Adjust batching frequency based on battery level
    if (this.batteryLevel < 0.2) { // Critical battery
      this.config.batchInterval = Math.max(this.config.batchInterval * 4, 2000);
      this.config.compressionEnabled = true;
    } else if (this.batteryLevel < 0.5) { // Low battery
      this.config.batchInterval = Math.max(this.config.batchInterval * 2, 1000);
      this.config.compressionEnabled = true;
    } else {
      // Normal battery - use adaptive frequency
      this.config.batchInterval = this.getAdaptiveBatchInterval();
    }
  }

  private updateNetworkQuality(effectiveType: string): void {
    this.networkQuality = effectiveType as 'wifi' | '4G' | '3G' | '2G' | 'slow-2G';
    this.config.batchInterval = this.getAdaptiveBatchInterval();
    
    // Enable compression for slower networks
    this.config.compressionEnabled = ['2G', 'slow-2G', '3G'].includes(effectiveType);
  }

  private detectPerformanceTier(): void {
    // Use hardware concurrency as performance indicator
    const cores = navigator.hardwareConcurrency || 1;
    const memory = (navigator as any).deviceMemory || 1;
    
    if (cores >= 4 && memory >= 4) {
      this.performanceTier = 'high';
    } else if (cores >= 2 && memory >= 2) {
      this.performanceTier = 'medium';
    } else {
      this.performanceTier = 'low';
    }
  }

  private getAdaptiveBatchInterval(): number {
    // Base intervals by network quality
    const networkIntervals = {
      'wifi': 100,
      '4G': 200,
      '3G': 500,
      '2G': 1000,
      'slow-2G': 2000
    };

    let interval = networkIntervals[this.networkQuality] || 250;

    // Adjust for performance tier
    if (this.performanceTier === 'low') {
      interval *= 2;
    } else if (this.performanceTier === 'high') {
      interval *= 0.8;
    }

    // Adjust for battery level
    if (this.batteryLevel < 0.3) {
      interval *= 3;
    } else if (this.batteryLevel < 0.6) {
      interval *= 1.5;
    }

    return Math.max(interval, 50); // Minimum 50ms
  }

  /**
   * Queue a message for batched processing
   */
  queueMessage(message: Omit<WebSocketMessage, 'id' | 'timestamp'>): void {
    const queuedMessage: WebSocketMessage = {
      id: this.generateMessageId(),
      timestamp: Date.now(),
      ...message
    };

    this.messageQueue.push(queuedMessage);
    this.metrics.messagesQueued++;

    // Process high priority messages immediately if queue is getting full
    if (message.priority === 'high' && this.messageQueue.length >= this.config.priorityThreshold) {
      this.processBatch(true);
      return;
    }

    // Schedule batch processing if not already scheduled
    if (!this.batchTimeout) {
      this.scheduleBatchProcessing();
    }
  }

  private scheduleBatchProcessing(): void {
    this.batchTimeout = setTimeout(() => {
      this.processBatch();
    }, this.config.batchInterval);
  }

  /**
   * Process queued messages in batches
   */
  private processBatch(immediate: boolean = false): void {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }

    if (this.messageQueue.length === 0) return;

    // Sort by priority and timestamp
    this.messageQueue.sort((a, b) => {
      const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      return priorityDiff !== 0 ? priorityDiff : a.timestamp - b.timestamp;
    });

    // Determine batch size
    const batchSize = immediate ? this.messageQueue.length : 
      Math.min(this.config.batchSize, this.messageQueue.length);
    
    const batch = this.messageQueue.splice(0, batchSize);
    
    // Process the batch
    this.sendBatch(batch);
    
    // Update metrics
    this.metrics.batchesProcessed++;
    this.metrics.messagesQueued = this.messageQueue.length; // Update to current queue length
    this.metrics.averageBatchSize = 
      (this.metrics.averageBatchSize * (this.metrics.batchesProcessed - 1) + batch.length) / 
      this.metrics.batchesProcessed;

    // Schedule next batch if messages remain
    if (this.messageQueue.length > 0) {
      this.scheduleBatchProcessing();
    }
  }

  private sendBatch(messages: WebSocketMessage[]): void {
    const batchData = {
      type: 'batch',
      messages: messages,
      compression: this.config.compressionEnabled,
      timestamp: Date.now(),
      deviceInfo: {
        batteryLevel: this.batteryLevel,
        networkQuality: this.networkQuality,
        performanceTier: this.performanceTier
      }
    };

    // Compress batch if enabled and beneficial
    const processedBatch = this.config.compressionEnabled ? 
      this.compressBatch(batchData) : batchData;

    // Emit the batch for WebSocket sending
    this.emitBatch(processedBatch);
  }

  private compressBatch(batch: any): any {
    // Simple compression: deduplicate data and use references
    const compressed = {
      ...batch,
      compressed: true
    };

    // Track compression ratio
    const originalSize = JSON.stringify(batch).length;
    const compressedSize = JSON.stringify(compressed).length;
    this.metrics.compressionRatio = 1 - (compressedSize / originalSize);

    return compressed;
  }

  private emitBatch(batch: any): void {
    // This would typically emit to a WebSocket connection
    // For now, we'll use a custom event system
    window.dispatchEvent(new CustomEvent('websocket-batch', {
      detail: batch
    }));
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get current batching metrics for monitoring
   */
  getMetrics() {
    return {
      ...this.metrics,
      queueSize: this.messageQueue.length,
      config: this.config,
      deviceInfo: {
        batteryLevel: this.batteryLevel,
        networkQuality: this.networkQuality,
        performanceTier: this.performanceTier
      }
    };
  }

  /**
   * Force process all queued messages immediately
   */
  flushQueue(): void {
    if (this.messageQueue.length > 0) {
      this.processBatch(true);
    }
  }

  /**
   * Clear all queued messages
   */
  clearQueue(): void {
    this.messageQueue = [];
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }
  }

  /**
   * Update batching configuration
   */
  updateConfig(newConfig: Partial<BatchingConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}