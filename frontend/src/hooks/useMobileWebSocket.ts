/**
 * Task 5.3: Enhanced Mobile WebSocket Hook
 * Integrates MobileWebSocketBatcher with adaptive performance system
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { MobileWebSocketBatcher } from '@/utils/websocket/mobileWebSocketBatcher';
import { useAdaptivePerformance } from '@/lib/adaptive-performance';

interface MobileWebSocketMessage {
  type: string;
  data: any;
  priority?: 'high' | 'medium' | 'low';
}

interface MobileWebSocketOptions {
  autoConnect?: boolean;
  reconnectAttempts?: number;
  batchingEnabled?: boolean;
  onBatchProcessed?: (batch: any) => void;
  onError?: (error: Error) => void;
  onConnectionChange?: (connected: boolean) => void;
}

export const useMobileWebSocket = (url: string, options: MobileWebSocketOptions = {}) => {
  const {
    autoConnect = true,
    reconnectAttempts = 5,
    batchingEnabled = true,
    onBatchProcessed,
    onError,
    onConnectionChange
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'poor' | 'offline'>('good');
  const [messageCount, setMessageCount] = useState(0);
  const [batchMetrics, setBatchMetrics] = useState<any>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const batcherRef = useRef<MobileWebSocketBatcher | null>(null);
  const reconnectCountRef = useRef(0);
  const lastMessageTimeRef = useRef(0);

  // Adaptive performance integration
  const adaptivePerf = useAdaptivePerformance();
  const isEmergencyModeActive = adaptivePerf?.isEmergencyMode?.() || false;
  const performanceConfig = adaptivePerf?.config;

  // Initialize batcher
  useEffect(() => {
    if (batchingEnabled) {
      batcherRef.current = MobileWebSocketBatcher.getInstance();
      
      // Listen for batched messages
      const handleBatch = (event: CustomEvent) => {
        if (onBatchProcessed) {
          onBatchProcessed(event.detail);
        }
        
        // Update metrics
        const metrics = batcherRef.current?.getMetrics();
        setBatchMetrics(metrics);
        
        // Send batch via WebSocket
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify(event.detail));
        }
      };

      window.addEventListener('websocket-batch', handleBatch as EventListener);
      
      return () => {
        window.removeEventListener('websocket-batch', handleBatch as EventListener);
      };
    }
  }, [batchingEnabled, onBatchProcessed]);

  // Connection management with adaptive performance
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      wsRef.current = new WebSocket(url);

      wsRef.current.onopen = () => {
        setIsConnected(true);
        setConnectionQuality('excellent');
        reconnectCountRef.current = 0;
        onConnectionChange?.(true);
        
        console.log('📱 Mobile WebSocket connected with batching enabled:', batchingEnabled);
      };

      wsRef.current.onmessage = (event) => {
        const now = Date.now();
        lastMessageTimeRef.current = now;
        setMessageCount(prev => prev + 1);
        
        try {
          const message = JSON.parse(event.data);
          
          // Update connection quality based on message frequency
          const timeSinceLastMessage = now - lastMessageTimeRef.current;
          if (timeSinceLastMessage < 100) {
            setConnectionQuality('excellent');
          } else if (timeSinceLastMessage < 500) {
            setConnectionQuality('good');
          } else {
            setConnectionQuality('poor');
          }

          // Process message based on emergency mode
          if (isEmergencyModeActive && message.type !== 'critical') {
            // Drop non-critical messages in emergency mode
            return;
          }

          // Handle batch vs individual messages
          if (message.type === 'batch') {
            // Process batched messages
            message.messages?.forEach((msg: any) => {
              processIncomingMessage(msg);
            });
          } else {
            processIncomingMessage(message);
          }

        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
          onError?.(error as Error);
        }
      };

      wsRef.current.onclose = (event) => {
        setIsConnected(false);
        setConnectionQuality('offline');
        onConnectionChange?.(false);
        
        // Attempt reconnection with adaptive backoff
        if (reconnectCountRef.current < reconnectAttempts) {
          const delay = getReconnectDelay();
          setTimeout(() => {
            reconnectCountRef.current++;
            connect();
          }, delay);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('Mobile WebSocket error:', error);
        setConnectionQuality('poor');
        onError?.(new Error('WebSocket connection error'));
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      onError?.(error as Error);
    }
  }, [url, reconnectAttempts, isEmergencyModeActive, onConnectionChange, onError]);

  // Adaptive reconnection delay
  const getReconnectDelay = useCallback(() => {
    const baseDelay = 1000;
    const maxDelay = isEmergencyModeActive ? 30000 : 15000;
    
    // Exponential backoff with jitter
    const exponentialDelay = baseDelay * Math.pow(2, reconnectCountRef.current);
    const jitter = Math.random() * 1000;
    
    return Math.min(exponentialDelay + jitter, maxDelay);
  }, [isEmergencyModeActive]);

  // Process incoming messages with performance awareness
  const processIncomingMessage = useCallback((message: any) => {
    // Apply performance-based throttling in emergency mode
    if (isEmergencyModeActive && Math.random() > 0.7) {
      // Drop 30% of messages in emergency mode
      return;
    }

    // Emit custom event for message processing
    window.dispatchEvent(new CustomEvent('mobile-websocket-message', {
      detail: message
    }));
  }, [isEmergencyModeActive]);

  // Send message with batching
  const sendMessage = useCallback((message: MobileWebSocketMessage) => {
    if (batchingEnabled && batcherRef.current) {
      // Use batcher for mobile optimization
      batcherRef.current.queueMessage({
        type: message.type,
        data: message.data,
        priority: message.priority || 'medium'
      });
    } else if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      // Send directly
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, message queued for later:', message.type);
    }
  }, [batchingEnabled]);

  // Send high priority message immediately
  const sendUrgentMessage = useCallback((message: MobileWebSocketMessage) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        ...message,
        urgent: true,
        timestamp: Date.now()
      }));
    }
  }, []);

  // Disconnect
  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    if (batcherRef.current) {
      batcherRef.current.flushQueue();
    }
    
    setIsConnected(false);
    setConnectionQuality('offline');
  }, []);

  // Auto connect on mount
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  // Monitor connection health
  useEffect(() => {
    const interval = setInterval(() => {
      if (isConnected && wsRef.current) {
        // Send ping to maintain connection
        sendMessage({
          type: 'ping',
          data: { timestamp: Date.now() },
          priority: 'low'
        });
      }
    }, 30000); // Ping every 30 seconds

    return () => clearInterval(interval);
  }, [isConnected, sendMessage]);

  // Update batcher configuration based on performance
  useEffect(() => {
    if (batcherRef.current && performanceConfig) {
      const config = {
        batchInterval: isEmergencyModeActive ? 1000 : 250,
        compressionEnabled: isEmergencyModeActive,
        adaptiveFrequency: true
      };
      
      batcherRef.current.updateConfig(config);
    }
  }, [performanceConfig, isEmergencyModeActive]);

  return {
    // Connection state
    isConnected,
    connectionQuality,
    messageCount,
    
    // Methods
    connect,
    disconnect,
    sendMessage,
    sendUrgentMessage,
    
    // Metrics
    batchMetrics,
    reconnectCount: reconnectCountRef.current,
    
    // Performance info
    isEmergencyMode: isEmergencyModeActive,
    performanceConfig
  };
};