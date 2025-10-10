/**
 * Task 5.1: Adaptive Performance Hooks
 * React hooks for device-aware performance optimization
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { AdaptivePerformanceManager, AdaptiveConfiguration, PerformanceBudget } from './AdaptivePerformanceManager';

/**
 * Hook for accessing adaptive performance configuration
 */
export function useAdaptivePerformance() {
  const [config, setConfig] = useState<AdaptiveConfiguration | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const performanceManagerRef = useRef<AdaptivePerformanceManager>();

  useEffect(() => {
    const initializePerformance = async () => {
      try {
        const manager = AdaptivePerformanceManager.getInstance();
        performanceManagerRef.current = manager;
        
        const initialConfig = await manager.initialize();
        setConfig(initialConfig);
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize adaptive performance:', error);
        setIsInitialized(true); // Mark as initialized even on error
      }
    };

    initializePerformance();

    // Cleanup on unmount
    return () => {
      if (performanceManagerRef.current) {
        performanceManagerRef.current.dispose();
      }
    };
  }, []);

  const getPerformanceBudget = useCallback((): PerformanceBudget | null => {
    return config?.performanceBudget || null;
  }, [config]);

  const isEmergencyMode = useCallback((): boolean => {
    return config?.deviceCapabilities.emergencyMode || false;
  }, [config]);

  const shouldUseAnimations = useCallback((): boolean => {
    return config?.performanceBudget.enableAnimations || false;
  }, [config]);

  const getWebSocketFrequency = useCallback((): number => {
    return config?.performanceBudget.websocketUpdateFrequency || 1000;
  }, [config]);

  return {
    config,
    isInitialized,
    getPerformanceBudget,
    isEmergencyMode,
    shouldUseAnimations,
    getWebSocketFrequency,
    performanceTier: config?.deviceCapabilities.performanceTier || 'medium',
    connectionQuality: config?.deviceCapabilities.connectionQuality || '4G',
    enableProgressiveEnhancement: config?.performanceBudget.enableProgressiveEnhancement || false
  };
}

/**
 * Hook for adaptive animations based on device capabilities
 */
export function useAdaptiveAnimation(animationComplexity: number = 1) {
  const { shouldUseAnimations, getPerformanceBudget, isEmergencyMode } = useAdaptivePerformance();

  const shouldAnimate = useCallback(() => {
    if (isEmergencyMode()) return false;
    if (!shouldUseAnimations()) return false;
    
    const budget = getPerformanceBudget();
    if (!budget) return false;
    
    return animationComplexity <= budget.maxAnimationComplexity;
  }, [shouldUseAnimations, getPerformanceBudget, isEmergencyMode, animationComplexity]);

  const getAnimationDuration = useCallback((baseDuration: number) => {
    if (!shouldAnimate()) return 0;
    
    const budget = getPerformanceBudget();
    if (!budget) return baseDuration;
    
    // Reduce animation duration for lower performance devices
    const performanceMultiplier = budget.maxAnimationComplexity / 5; // Normalize to 0-1
    return baseDuration * Math.max(0.3, performanceMultiplier); // Minimum 30% of original duration
  }, [shouldAnimate, getPerformanceBudget]);

  return {
    shouldAnimate: shouldAnimate(),
    getAnimationDuration,
    animationClass: shouldAnimate() ? 'animate' : 'no-animate'
  };
}

/**
 * Hook for adaptive WebSocket updates
 */
export function useAdaptiveWebSocket() {
  const { getWebSocketFrequency, isEmergencyMode, config } = useAdaptivePerformance();

  const getUpdateFrequency = useCallback(() => {
    return getWebSocketFrequency();
  }, [getWebSocketFrequency]);

  const shouldBatchMessages = useCallback(() => {
    if (isEmergencyMode()) return true;
    
    const connectionQuality = config?.deviceCapabilities.connectionQuality;
    return connectionQuality === '2G' || connectionQuality === '3G';
  }, [isEmergencyMode, config]);

  const getBatchSize = useCallback(() => {
    if (isEmergencyMode()) return 5; // Larger batches for emergency mode
    
    const performanceTier = config?.deviceCapabilities.performanceTier;
    switch (performanceTier) {
      case 'low': return 3;
      case 'medium': return 2;
      case 'high': return 1; // No batching for high-performance devices
      default: return 2;
    }
  }, [isEmergencyMode, config]);

  return {
    updateFrequency: getUpdateFrequency(),
    shouldBatchMessages: shouldBatchMessages(),
    batchSize: getBatchSize()
  };
}

/**
 * Hook for adaptive component rendering
 */
export function useAdaptiveRendering(componentName: string) {
  const { getPerformanceBudget, isEmergencyMode, isInitialized } = useAdaptivePerformance();
  const renderStartRef = useRef<number>(0);

  const startRenderMeasurement = useCallback(() => {
    renderStartRef.current = performance.now();
  }, []);

  const endRenderMeasurement = useCallback(() => {
    if (renderStartRef.current > 0) {
      const renderTime = performance.now() - renderStartRef.current;
      
      // Track render time for performance monitoring
      if ('performance' in window && 'measure' in performance) {
        performance.mark(`${componentName}-render-end`);
        performance.measure(`${componentName}-render`, `${componentName}-render-start`, `${componentName}-render-end`);
      }
      
      renderStartRef.current = 0;
      return renderTime;
    }
    return 0;
  }, [componentName]);

  const shouldRenderComponent = useCallback(() => {
    if (!isInitialized) return true; // Render while initializing
    if (isEmergencyMode()) return false; // Skip non-essential components in emergency mode
    return true;
  }, [isInitialized, isEmergencyMode]);

  const shouldUseSimplifiedVersion = useCallback(() => {
    if (!isInitialized) return false;
    
    const budget = getPerformanceBudget();
    if (!budget) return false;
    
    return budget.maxAnimationComplexity === 0 || isEmergencyMode();
  }, [isInitialized, getPerformanceBudget, isEmergencyMode]);

  useEffect(() => {
    if ('performance' in window && 'mark' in performance) {
      performance.mark(`${componentName}-render-start`);
    }
    startRenderMeasurement();

    return () => {
      endRenderMeasurement();
    };
  }, [componentName, startRenderMeasurement, endRenderMeasurement]);

  return {
    shouldRenderComponent: shouldRenderComponent(),
    shouldUseSimplifiedVersion: shouldUseSimplifiedVersion(),
    startRenderMeasurement,
    endRenderMeasurement
  };
}

/**
 * Hook for adaptive loading states
 */
export function useAdaptiveLoading() {
  const { isEmergencyMode, getPerformanceBudget } = useAdaptivePerformance();

  const getLoadingComponent = useCallback((complexity: 'simple' | 'complex' = 'simple') => {
    if (isEmergencyMode() || complexity === 'simple') {
      return 'text'; // Simple text-based loading
    }
    
    const budget = getPerformanceBudget();
    if (!budget || budget.maxAnimationComplexity === 0) {
      return 'text';
    }
    
    return budget.maxAnimationComplexity >= 3 ? 'skeleton' : 'spinner';
  }, [isEmergencyMode, getPerformanceBudget]);

  return {
    getLoadingComponent,
    useTextOnly: isEmergencyMode()
  };
}

/**
 * Hook for progressive enhancement features
 */
export function useProgressiveEnhancement() {
  const { config, isInitialized } = useAdaptivePerformance();

  const canUseFeature = useCallback((featureComplexity: 'low' | 'medium' | 'high') => {
    if (!isInitialized || !config) return false;
    
    if (!config.performanceBudget.enableProgressiveEnhancement) return false;
    
    const performanceTier = config.deviceCapabilities.performanceTier;
    
    switch (featureComplexity) {
      case 'low': return true; // Always available
      case 'medium': return performanceTier !== 'low';
      case 'high': return performanceTier === 'high';
      default: return false;
    }
  }, [isInitialized, config]);

  const getFeatureLevel = useCallback(() => {
    if (!config) return 'low';
    
    const performanceTier = config.deviceCapabilities.performanceTier;
    return performanceTier;
  }, [config]);

  return {
    canUseFeature,
    featureLevel: getFeatureLevel(),
    isProgressiveEnhancementEnabled: config?.performanceBudget.enableProgressiveEnhancement || false
  };
}