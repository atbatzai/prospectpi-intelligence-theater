import { useState, useEffect, useRef, useCallback } from 'react';
import { AgentProgress } from '@/types';
import { usePerformanceStore } from '@/store/intelligenceStore';

const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';

interface AgentProgressMessage {
  requestId: string;
  agent: 'coordinator' | 'researcher' | 'detective';
  stage: string;
  message: string;
  confidence?: number;
  estimatedTimeRemaining?: number;
  dataSourcesActive: string[];
  insightsDiscovered: number;
}

interface UseWebSocketOptions {
  onMessage?: (message: AgentProgressMessage) => void;
  onError?: (error: Event) => void;
  onClose?: () => void;
}

export const useWebSocket = (requestId: string | null, options: UseWebSocketOptions = {}) => {
  const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [agentProgress, setAgentProgress] = useState<AgentProgress[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Task 3.2: Enhanced reconnection state management
  const reconnectAttemptRef = useRef(0);
  const maxReconnectAttempts = useRef(10);
  const lastDisconnectTime = useRef<number>(0);
  
  // Task 0.5: Mobile-optimized WebSocket message batching
  const { getOptimalUpdateFrequency, deviceCapabilities, performanceBudget } = usePerformanceStore();
  const messageQueueRef = useRef<AgentProgressMessage[]>([]);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastBatchProcessTime = useRef<number>(Date.now());
  
  // Mobile optimization: Adaptive update frequency
  const getAdaptiveUpdateFrequency = useCallback(() => {
    if (!deviceCapabilities) return 1000;
    
    // Adjust frequency based on device capabilities and battery state
    const baseFrequency = getOptimalUpdateFrequency();
    
    if (deviceCapabilities.batteryOptimization) {
      return Math.max(baseFrequency * 2, 2000); // Reduce update frequency when battery is low
    }
    
    if (deviceCapabilities.connectionQuality === '2G') {
      return Math.max(baseFrequency * 1.5, 1500); // Slower updates on 2G
    }
    
    return baseFrequency;
  }, [deviceCapabilities, getOptimalUpdateFrequency]);

  // Task 3.2: Intelligent reconnection with mobile battery optimization
  const getReconnectDelay = useCallback((attempt: number): number => {
    if (!deviceCapabilities) return 3000;
    
    // Base delays optimized for mobile battery life
    const baseDelay = deviceCapabilities.batteryOptimization ? 5000 : 3000;
    const maxDelay = deviceCapabilities.performanceTier === 'low' ? 30000 : 20000;
    
    // Exponential backoff with jitter
    const exponentialDelay = baseDelay * Math.pow(1.5, Math.min(attempt, 8));
    const jitter = Math.random() * 1000;
    
    return Math.min(exponentialDelay + jitter, maxDelay);
  }, [deviceCapabilities]);

  // Task 3.2: Smart reconnection logic with network awareness
  const shouldAttemptReconnect = useCallback((): boolean => {
    // Don't reconnect if offline
    if (!navigator.onLine) return false;
    
    // Limit reconnection attempts for battery preservation
    const maxAttempts = deviceCapabilities?.batteryOptimization ? 5 : 10;
    if (reconnectAttemptRef.current >= maxAttempts) return false;
    
    // Avoid rapid reconnection attempts (minimum 5 seconds between attempts)
    const timeSinceLastDisconnect = Date.now() - lastDisconnectTime.current;
    if (timeSinceLastDisconnect < 5000) return false;
    
    return true;
  }, [deviceCapabilities]);

  const processMessage = useCallback((message: AgentProgressMessage) => {
    setAgentProgress(prev => {
      const updated = [...prev];
      const existingIndex = updated.findIndex(p => p.name === message.agent);
      
      const newProgress: AgentProgress = {
        id: message.agent,
        name: message.agent,
        status: message.stage === 'completed' ? 'completed' : 'working',
        progress: Math.min(95, message.confidence || 0),
        currentAction: message.message,
        avatar: getAgentAvatar(message.agent),
        metadata: {
          sourceCount: message.dataSourcesActive.length,
          insightsCount: message.insightsDiscovered,
          confidenceScore: message.confidence,
        }
      };

      if (existingIndex >= 0) {
        updated[existingIndex] = newProgress;
      } else {
        updated.push(newProgress);
      }

      return updated;
    });
  }, []);

  const processBatchedMessages = useCallback(() => {
    const now = Date.now();
    const timeSinceLastBatch = now - lastBatchProcessTime.current;
    const minBatchInterval = getAdaptiveUpdateFrequency();
    
    if (timeSinceLastBatch < minBatchInterval && messageQueueRef.current.length < 3) {
      // Don't process small batches too frequently on mobile
      return;
    }
    
    const messages = messageQueueRef.current.splice(0);
    if (messages.length === 0) return;
    
    // Process the most recent message from each agent to avoid overwhelming UI
    const latestMessages = new Map<string, AgentProgressMessage>();
    messages.forEach(msg => {
      latestMessages.set(msg.agent, msg);
    });
    
    latestMessages.forEach(processMessage);
    lastBatchProcessTime.current = now;
  }, [processMessage, getAdaptiveUpdateFrequency]);
  
  const queueMessage = useCallback((message: AgentProgressMessage) => {
    messageQueueRef.current.push(message);
    
    const batchSize = deviceCapabilities?.performanceTier === 'low' ? 1 : 3;
    const frequency = getAdaptiveUpdateFrequency();
    
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    
    // Process immediately if queue is full or on low-performance devices
    if (messageQueueRef.current.length >= batchSize || deviceCapabilities?.performanceTier === 'low') {
      processBatchedMessages();
    } else {
      updateTimeoutRef.current = setTimeout(processBatchedMessages, frequency);
    }
  }, [deviceCapabilities, getAdaptiveUpdateFrequency, processBatchedMessages]);

  const connect = useCallback(() => {
    if (!requestId) return;

    try {
      setConnectionState('connecting');
      const wsUrl = `${WS_BASE_URL}/ws/progress/${requestId}`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setConnectionState('connected');
        // Task 3.2: Reset reconnection attempts on successful connection
        reconnectAttemptRef.current = 0;
        console.log('✅ WebSocket connected successfully for request:', requestId);
      };

      ws.onmessage = (event) => {
        try {
          const message: AgentProgressMessage = JSON.parse(event.data);
          
          // Task 0.5: Mobile-optimized message batching
          if (deviceCapabilities && 
              (deviceCapabilities.performanceTier === 'low' || 
               deviceCapabilities.connectionQuality === '2G' || 
               deviceCapabilities.connectionQuality === '3G')) {
            
            // Queue messages for batched processing on mobile
            messageQueueRef.current.push(message);
            
            if (updateTimeoutRef.current) return; // Batching already scheduled
            
            updateTimeoutRef.current = setTimeout(() => {
              processBatchedMessages();
              updateTimeoutRef.current = null;
            }, getOptimalUpdateFrequency());
            
          } else {
            // Process immediately on high-performance devices
            processMessage(message);
          }

          options.onMessage?.(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        setConnectionState('error');
        options.onError?.(error);
        console.error('WebSocket error:', error);
      };

      ws.onclose = (event) => {
        setConnectionState('disconnected');
        lastDisconnectTime.current = Date.now();
        options.onClose?.();
        
        console.log(`🔌 WebSocket disconnected: Code ${event.code}, Reason: ${event.reason}`);
        
        // Task 3.2: Intelligent mobile-optimized reconnection
        if (shouldAttemptReconnect() && requestId) {
          reconnectAttemptRef.current++;
          const delay = getReconnectDelay(reconnectAttemptRef.current);
          
          console.log(`📱 Scheduling reconnect attempt ${reconnectAttemptRef.current} in ${delay}ms (Mobile optimized)`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            if (navigator.onLine && requestId) {
              console.log(`🔄 Attempting WebSocket reconnection ${reconnectAttemptRef.current}/${maxReconnectAttempts.current}`);
              connect();
            }
          }, delay);
        } else {
          console.warn('🚫 WebSocket reconnection limit reached or conditions not met');
        }
      };

      wsRef.current = ws;
    } catch (error) {
      setConnectionState('error');
      console.error('Failed to create WebSocket connection:', error);
    }
  }, [requestId, options]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setConnectionState('disconnected');
  }, []);

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  useEffect(() => {
    if (requestId) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [requestId, connect, disconnect]);

  return {
    connectionState,
    agentProgress,
    connect,
    disconnect,
    sendMessage,
  };
};

function getAgentAvatar(agent: string): string {
  switch (agent) {
    case 'coordinator':
      return '🎯';
    case 'researcher':
      return '🔍';
    case 'detective':
      return '🕵️';
    default:
      return '🤖';
  }
}