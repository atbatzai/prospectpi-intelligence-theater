'use client';

import { useState, useCallback, useRef } from 'react';
import { usePerformanceStore } from '@/store/intelligenceStore';

interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  exponentialBase: number;
  timeoutMs: number;
}

interface NetworkCondition {
  quality: 'fast' | 'slow' | 'unstable' | 'offline';
  bandwidth: number; // Mbps estimate
  latency: number; // ms
  packetLoss: number; // percentage
}

interface RetryAttempt {
  attempt: number;
  timestamp: number;
  networkCondition: NetworkCondition;
  error?: Error;
  success: boolean;
}

interface MobileRetryState {
  isRetrying: boolean;
  currentAttempt: number;
  lastError: Error | null;
  retryHistory: RetryAttempt[];
  nextRetryIn: number;
}

/**
 * Task 3.5: Mobile retry hook with connection quality awareness
 * Provides intelligent retry mechanisms for mobile network conditions
 */
export function useMobileRetry<T>(
  operation: () => Promise<T>,
  customConfig?: Partial<RetryConfig>
) {
  const { deviceCapabilities } = usePerformanceStore();
  const [retryState, setRetryState] = useState<MobileRetryState>({
    isRetrying: false,
    currentAttempt: 0,
    lastError: null,
    retryHistory: [],
    nextRetryIn: 0
  });
  
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const connectionQualityRef = useRef<NetworkCondition>({
    quality: 'fast',
    bandwidth: 10,
    latency: 100,
    packetLoss: 0
  });

  // Task 3.5: Adaptive retry configuration based on device and network conditions
  const getRetryConfig = useCallback((): RetryConfig => {
    const isMobile = deviceCapabilities?.performanceTier === 'low' || window.innerWidth < 768;
    const isLowPower = deviceCapabilities?.emergencyMode || deviceCapabilities?.batteryOptimization;
    
    const baseConfig: RetryConfig = {
      maxAttempts: 5,
      baseDelay: 1000,
      maxDelay: 30000,
      exponentialBase: 2,
      timeoutMs: 10000
    };

    // Merge with custom config
    const config = { ...baseConfig, ...customConfig };

    // Task 3.5: Adjust for mobile conditions
    if (isMobile) {
      config.maxAttempts = Math.min(config.maxAttempts, 3); // Fewer retries on mobile
      config.baseDelay = config.baseDelay * 1.5; // Longer delays for mobile networks
      config.timeoutMs = Math.min(config.timeoutMs, 15000); // Shorter timeouts
    }

    if (isLowPower) {
      config.maxAttempts = Math.min(config.maxAttempts, 2); // Minimal retries on low battery
      config.baseDelay = config.baseDelay * 2; // Much longer delays to preserve battery
    }

    return config;
  }, [deviceCapabilities, customConfig]);

  // Task 3.5: Network quality assessment for retry strategy
  const assessNetworkQuality = useCallback(async (): Promise<NetworkCondition> => {
    try {
      const startTime = performance.now();
      
      // Quick network test with small payload
      const testUrl = '/api/health'; // Assume we have a health endpoint
      const response = await Promise.race([
        fetch(testUrl, { 
          method: 'HEAD',
          cache: 'no-cache',
          signal: AbortSignal.timeout(5000)
        }),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Network test timeout')), 5000)
        )
      ]);

      const endTime = performance.now();
      const latency = endTime - startTime;
      
      // Estimate bandwidth and quality based on response time and success
      let quality: NetworkCondition['quality'] = 'fast';
      let bandwidth = 10; // Default estimate
      
      if (latency > 2000) {
        quality = 'slow';
        bandwidth = 1;
      } else if (latency > 1000) {
        quality = 'unstable';
        bandwidth = 3;
      } else if (latency > 500) {
        quality = 'slow';
        bandwidth = 5;
      }

      const condition: NetworkCondition = {
        quality,
        bandwidth,
        latency,
        packetLoss: latency > 1000 ? (latency - 1000) / 100 : 0
      };

      connectionQualityRef.current = condition;
      return condition;
      
    } catch (error) {
      // Network is likely offline or very poor
      const offlineCondition: NetworkCondition = {
        quality: 'offline',
        bandwidth: 0,
        latency: Infinity,
        packetLoss: 100
      };
      
      connectionQualityRef.current = offlineCondition;
      return offlineCondition;
    }
  }, []);

  // Task 3.5: Calculate retry delay based on network conditions
  const getRetryDelay = useCallback((attempt: number, networkCondition: NetworkCondition): number => {
    const config = getRetryConfig();
    let delay = config.baseDelay * Math.pow(config.exponentialBase, attempt - 1);
    
    // Task 3.5: Adjust delay based on network quality
    switch (networkCondition.quality) {
      case 'offline':
        delay = Math.min(delay * 4, config.maxDelay); // Much longer for offline
        break;
      case 'unstable':
        delay = Math.min(delay * 2.5, config.maxDelay); // Longer for unstable
        break;
      case 'slow':
        delay = Math.min(delay * 1.5, config.maxDelay); // Slightly longer for slow
        break;
      case 'fast':
      default:
        delay = Math.min(delay, config.maxDelay); // Standard delay for fast
        break;
    }

    // Add jitter to prevent thundering herd
    const jitter = Math.random() * 0.3 * delay;
    return Math.floor(delay + jitter);
  }, [getRetryConfig]);

  // Task 3.5: Check if retry should be attempted
  const shouldRetry = useCallback((attempt: number, error: Error, networkCondition: NetworkCondition): boolean => {
    const config = getRetryConfig();
    
    if (attempt >= config.maxAttempts) return false;
    
    // Task 3.5: Don't retry on certain error types
    if (error.name === 'AbortError' || 
        error.message.includes('401') || 
        error.message.includes('403') ||
        error.message.includes('404')) {
      return false;
    }

    // Task 3.5: Don't retry if offline and no connection recovery expected
    if (networkCondition.quality === 'offline' && attempt > 1) {
      return false;
    }

    // Task 3.5: Limit retries on mobile with low battery
    if (deviceCapabilities?.emergencyMode && attempt > 1) {
      return false;
    }

    return true;
  }, [getRetryConfig, deviceCapabilities]);

  // Task 3.5: Execute operation with intelligent retry
  const executeWithRetry = useCallback(async (): Promise<T> => {
    const config = getRetryConfig();
    let lastError: Error;
    
    setRetryState(prev => ({
      ...prev,
      isRetrying: true,
      currentAttempt: 0,
      lastError: null
    }));

    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      try {
        // Assess network before each attempt (except first)
        const networkCondition = attempt > 1 ? 
          await assessNetworkQuality() : 
          connectionQualityRef.current;

        setRetryState(prev => ({
          ...prev,
          currentAttempt: attempt
        }));

        // Execute the operation with timeout
        const result = await Promise.race([
          operation(),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Operation timeout')), config.timeoutMs)
          )
        ]);

        // Success - record and return
        const successAttempt: RetryAttempt = {
          attempt,
          timestamp: Date.now(),
          networkCondition,
          success: true
        };

        setRetryState(prev => ({
          ...prev,
          isRetrying: false,
          retryHistory: [...prev.retryHistory, successAttempt]
        }));

        return result;

      } catch (error) {
        lastError = error as Error;
        
        const failedAttempt: RetryAttempt = {
          attempt,
          timestamp: Date.now(),
          networkCondition: connectionQualityRef.current,
          error: lastError,
          success: false
        };

        setRetryState(prev => ({
          ...prev,
          lastError,
          retryHistory: [...prev.retryHistory, failedAttempt]
        }));

        // Check if we should retry
        if (!shouldRetry(attempt, lastError, connectionQualityRef.current)) {
          break;
        }

        // Calculate delay for next attempt
        const delay = getRetryDelay(attempt, connectionQualityRef.current);
        
        setRetryState(prev => ({
          ...prev,
          nextRetryIn: delay
        }));

        // Wait before next attempt
        await new Promise(resolve => {
          retryTimeoutRef.current = setTimeout(resolve, delay);
        });
      }
    }

    // All attempts failed
    setRetryState(prev => ({
      ...prev,
      isRetrying: false,
      nextRetryIn: 0
    }));

    throw lastError!;
    
  }, [operation, getRetryConfig, assessNetworkQuality, shouldRetry, getRetryDelay]);

  // Task 3.5: Manual retry trigger
  const retry = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    
    return executeWithRetry();
  }, [executeWithRetry]);

  // Task 3.5: Cancel ongoing retry
  const cancel = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    
    setRetryState(prev => ({
      ...prev,
      isRetrying: false,
      nextRetryIn: 0
    }));
  }, []);

  // Task 3.5: Reset retry state
  const reset = useCallback(() => {
    cancel();
    setRetryState({
      isRetrying: false,
      currentAttempt: 0,
      lastError: null,
      retryHistory: [],
      nextRetryIn: 0
    });
  }, [cancel]);

  return {
    ...retryState,
    executeWithRetry,
    retry,
    cancel,
    reset,
    networkQuality: connectionQualityRef.current
  };
}