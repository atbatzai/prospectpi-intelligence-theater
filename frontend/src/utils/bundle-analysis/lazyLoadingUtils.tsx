/**
 * Task 5.2: Epic-based Lazy Loading Utilities
 * Performance-aware component loading with adaptive fallbacks
 */

import React, { Suspense, lazy, ComponentType } from 'react';
import { useAdaptivePerformance, useAdaptiveLoading } from '@/lib/adaptive-performance';

export interface LazyLoadOptions {
  epic: 'auth' | 'intelligence' | 'mobile' | 'admin';
  fallback?: React.ComponentType;
  preload?: boolean;
  performanceThreshold?: 'low' | 'medium' | 'high';
}

/**
 * Enhanced lazy loading with performance awareness
 */
export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: LazyLoadOptions
): React.ComponentType<React.ComponentProps<T>> {
  
  const LazyComponent = lazy(importFn);
  
  return function AdaptiveLazyComponent(props: React.ComponentProps<T>) {
    const { performanceTier, isEmergencyMode } = useAdaptivePerformance();
    const { getLoadingComponent } = useAdaptiveLoading();
    
    // Emergency mode fallback
    if (isEmergencyMode()) {
      const EmergencyFallback = options.fallback;
      if (EmergencyFallback) {
        return <EmergencyFallback {...props} />;
      }
      return <div className="p-4 text-center text-gray-600">Loading...</div>;
    }
    
    // Check performance threshold
    if (options.performanceThreshold) {
      const meetsThreshold = checkPerformanceThreshold(performanceTier, options.performanceThreshold);
      if (!meetsThreshold && options.fallback) {
        const Fallback = options.fallback;
        return <Fallback {...props} />;
      }
    }
    
    // Adaptive loading component
    const LoadingComponent = getAdaptiveLoadingComponent(options.epic);
    
    return (
      <Suspense fallback={<LoadingComponent />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

/**
 * Check if device meets performance threshold for component
 */
function checkPerformanceThreshold(
  deviceTier: 'low' | 'medium' | 'high',
  requiredTier: 'low' | 'medium' | 'high'
): boolean {
  const tierLevels = { low: 1, medium: 2, high: 3 };
  return tierLevels[deviceTier] >= tierLevels[requiredTier];
}

/**
 * Get adaptive loading component based on epic and performance
 */
function getAdaptiveLoadingComponent(epic: string): React.ComponentType {
  const { getLoadingComponent } = useAdaptiveLoading();
  const loadingType = getLoadingComponent('simple');
  
  switch (loadingType) {
    case 'text':
      return () => <TextLoading epic={epic} />;
    case 'spinner':
      return () => <SpinnerLoading epic={epic} />;
    case 'skeleton':
      return () => <SkeletonLoading epic={epic} />;
    default:
      return () => <TextLoading epic={epic} />;
  }
}

/**
 * Simple text loading fallback
 */
const TextLoading: React.FC<{ epic: string }> = ({ epic }) => (
  <div className="p-4 text-center text-gray-600" data-testid="text-loading">
    Loading {epic.charAt(0).toUpperCase() + epic.slice(1)} Epic...
  </div>
);

/**
 * Spinner loading fallback
 */
const SpinnerLoading: React.FC<{ epic: string }> = ({ epic }) => (
  <div className="flex items-center justify-center p-8" data-testid="spinner-loading">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    <span className="ml-3 text-gray-600">Loading {epic}...</span>
  </div>
);

/**
 * Skeleton loading fallback for high-performance devices
 */
const SkeletonLoading: React.FC<{ epic: string }> = ({ epic }) => (
  <div className="p-4 space-y-3" data-testid="skeleton-loading">
    <div className="animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
      <div className="h-32 bg-gray-200 rounded mb-4"></div>
      <div className="h-4 bg-gray-200 rounded w-full"></div>
    </div>
    <p className="text-xs text-gray-500 text-center">Loading {epic} epic components...</p>
  </div>
);

/**
 * Preload component for performance optimization
 */
export function preloadComponent(importFn: () => Promise<any>): void {
  // Preload during idle time
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      importFn().catch(() => {
        // Silently handle preload failures
      });
    });
  } else {
    // Fallback for browsers without requestIdleCallback
    setTimeout(() => {
      importFn().catch(() => {
        // Silently handle preload failures  
      });
    }, 2000);
  }
}

/**
 * Epic-specific lazy loading helpers
 */
export const EpicLoaders = {
  /**
   * Authentication Epic Components
   */
  auth: {
    LoginForm: createLazyComponent(
      () => import('@/components/auth/LoginForm'),
      { epic: 'auth', performanceThreshold: 'low' }
    ),
    RegisterForm: createLazyComponent(
      () => import('@/components/auth/RegisterForm'), 
      { epic: 'auth', performanceThreshold: 'low' }
    ),
    ProtectedRoute: createLazyComponent(
      () => import('@/components/auth/ProtectedRoute'),
      { epic: 'auth', performanceThreshold: 'low' }
    )
  },

  /**
   * Intelligence Theater Epic Components  
   */
  intelligence: {
    AgentProgressTheater: createLazyComponent(
      () => import('@/components/lazy/LazyAgentProgressTheater'),
      { 
        epic: 'intelligence', 
        performanceThreshold: 'medium',
        fallback: () => (
          <div className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">Intelligence Theater</h2>
            <p className="text-gray-600">Preparing intelligence analysis...</p>
          </div>
        )
      }
    ),
    SmartCompanyInput: createLazyComponent(
      () => import('@/components/lazy/LazySmartCompanyInput'),
      { epic: 'intelligence', performanceThreshold: 'low' }
    ),
    DossierViewer: createLazyComponent(
      () => import('@/components/lazy/LazyDossierViewer'),
      { 
        epic: 'intelligence', 
        performanceThreshold: 'medium',
        fallback: () => (
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold mb-2">Dossier</h3>
            <p className="text-gray-600">Loading intelligence dossier...</p>
          </div>
        )
      }
    )
  },

  /**
   * Mobile Optimization Epic Components
   */
  mobile: {
    MobileErrorMessage: createLazyComponent(
      () => import('@/components/lazy/LazyMobileErrorMessage'),
      { epic: 'mobile', performanceThreshold: 'low' }
    )
  }
};

/**
 * Preload critical components based on route
 */
export function preloadEpicComponents(route: string): void {
  switch (route) {
    case '/login':
    case '/register':
      // Auth epic preloading (when auth components are created)
      break;
      
    case '/dashboard':
    case '/intelligence':
      preloadComponent(() => import('@/components/lazy/LazyAgentProgressTheater'));
      preloadComponent(() => import('@/components/lazy/LazySmartCompanyInput'));
      break;
      
    case '/dossier':
    case '/results':
      preloadComponent(() => import('@/components/lazy/LazyDossierViewer'));
      break;
  }
}

/**
 * Bundle size tracking for lazy loaded components
 */
export function trackLazyLoadPerformance(componentName: string, loadTime: number): void {
  if (typeof window !== 'undefined' && 'performance' in window) {
    // Mark component load completion
    performance.mark(`lazy-${componentName}-loaded`);
    
    // Measure from navigation start
    performance.measure(
      `lazy-${componentName}-total`,
      'navigationStart',
      `lazy-${componentName}-loaded`
    );
    
    // Log performance metrics
    console.log(`🚀 Lazy loaded ${componentName} in ${loadTime}ms`);
    
    // Track against performance budget
    const budget = componentName.includes('intelligence') ? 2000 : 1000; // 2s for complex, 1s for simple
    if (loadTime > budget) {
      console.warn(`⚠️ ${componentName} exceeded performance budget (${loadTime}ms > ${budget}ms)`);
    }
  }
}