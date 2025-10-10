/**
 * Task 5.1: Adaptive Performance Architecture - Module Exports
 * Device-aware performance optimization system
 */

export { 
  AdaptivePerformanceManager, 
  type PerformanceBudget, 
  type AdaptiveConfiguration 
} from './AdaptivePerformanceManager';

export {
  useAdaptivePerformance,
  useAdaptiveAnimation,
  useAdaptiveWebSocket,
  useAdaptiveRendering,
  useAdaptiveLoading,
  useProgressiveEnhancement
} from './useAdaptivePerformance';