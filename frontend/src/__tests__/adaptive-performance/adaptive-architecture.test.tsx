/**
 * Task 5.1: Adaptive Performance Architecture Testing
 * Comprehensive testing for device-aware performance optimization system
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AdaptivePerformanceManager } from '@/lib/adaptive-performance/AdaptivePerformanceManager';
import { 
  useAdaptivePerformance, 
  useAdaptiveAnimation, 
  useAdaptiveWebSocket,
  useAdaptiveRendering,
  useProgressiveEnhancement
} from '@/lib/adaptive-performance/useAdaptivePerformance';
import React from 'react';

// Mock performance API for testing
const mockPerformance = {
  now: vi.fn(() => Date.now()),
  mark: vi.fn(),
  measure: vi.fn(),
  memory: {
    usedJSHeapSize: 50 * 1024 * 1024, // 50MB
    totalJSHeapSize: 100 * 1024 * 1024 // 100MB
  }
};

const mockNavigator = {
  hardwareConcurrency: 4,
  deviceMemory: 4,
  connection: {
    effectiveType: '4g',
    saveData: false
  },
  getBattery: vi.fn(() => Promise.resolve({
    level: 0.8,
    charging: true
  })),
  userAgent: 'Mozilla/5.0 (Linux; Android 10; Pixel 3) AppleWebKit/537.36'
};

// Test component for hooks
const TestComponent = ({ 
  animationComplexity = 2,
  featureComplexity = 'medium' as 'low' | 'medium' | 'high'
}: { 
  animationComplexity?: number;
  featureComplexity?: 'low' | 'medium' | 'high';
}) => {
  const adaptivePerf = useAdaptivePerformance();
  const animation = useAdaptiveAnimation(animationComplexity);
  const websocket = useAdaptiveWebSocket();
  const rendering = useAdaptiveRendering('TestComponent');
  const progressive = useProgressiveEnhancement();

  if (!rendering.shouldRenderComponent) {
    return <div data-testid="component-hidden">Component Hidden</div>;
  }

  return (
    <div data-testid="test-component">
      <div data-testid="performance-tier">{adaptivePerf.performanceTier}</div>
      <div data-testid="emergency-mode">{adaptivePerf.isEmergencyMode().toString()}</div>
      <div data-testid="should-animate">{animation.shouldAnimate.toString()}</div>
      <div data-testid="animation-class">{animation.animationClass}</div>
      <div data-testid="websocket-frequency">{websocket.updateFrequency}</div>
      <div data-testid="websocket-batch-size">{websocket.batchSize}</div>
      <div data-testid="simplified-version">{rendering.shouldUseSimplifiedVersion.toString()}</div>
      <div data-testid="progressive-feature">{progressive.canUseFeature(featureComplexity).toString()}</div>
      <div data-testid="feature-level">{progressive.featureLevel}</div>
    </div>
  );
};

describe('Task 5.1: Adaptive Performance Architecture', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup global mocks
    Object.defineProperty(global, 'performance', {
      value: mockPerformance,
      writable: true
    });
    
    Object.defineProperty(global, 'navigator', {
      value: mockNavigator,
      writable: true
    });

    Object.defineProperty(global, 'window', {
      value: {
        innerWidth: 1024,
        innerHeight: 768,
        matchMedia: vi.fn((query) => ({
          matches: query.includes('prefers-reduced-motion'),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn()
        }))
      },
      writable: true
    });

    // Reset singleton instance
    (AdaptivePerformanceManager as any).instance = null;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('AdaptivePerformanceManager', () => {
    it('should initialize with correct device capabilities for high-performance device', async () => {
      // Setup high-performance device
      Object.defineProperty(global, 'navigator', {
        value: {
          ...mockNavigator,
          hardwareConcurrency: 8,
          deviceMemory: 16,
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        writable: true
      });

      const manager = AdaptivePerformanceManager.getInstance();
      const config = await manager.initialize();

      expect(config.deviceCapabilities.performanceTier).toBe('high');
      expect(config.performanceBudget.maxRenderTime).toBe(8.3); // 120fps capable
      expect(config.performanceBudget.websocketUpdateFrequency).toBe(50); // Real-time
      expect(config.performanceBudget.enableAnimations).toBe(true);
      expect(config.performanceBudget.enableProgressiveEnhancement).toBe(true);
    });

    it('should initialize with correct device capabilities for low-performance mobile device', async () => {
      // Setup low-performance mobile device
      Object.defineProperty(global, 'navigator', {
        value: {
          ...mockNavigator,
          hardwareConcurrency: 2,
          deviceMemory: 2,
          userAgent: 'Mozilla/5.0 (Linux; Android 7.0; SM-G610F) AppleWebKit/537.36'
        },
        writable: true
      });

      const manager = AdaptivePerformanceManager.getInstance();
      const config = await manager.initialize();

      expect(config.deviceCapabilities.performanceTier).toBe('low');
      expect(config.performanceBudget.maxRenderTime).toBe(16.6);
      expect(config.performanceBudget.websocketUpdateFrequency).toBe(500);
      expect(config.performanceBudget.maxMemoryUsage).toBe(50); // Limited memory
      expect(config.performanceBudget.maxAnimationComplexity).toBe(1); // Minimal animations
    });

    it('should activate emergency mode for extremely limited devices', async () => {
      // Setup extremely limited device
      Object.defineProperty(global, 'navigator', {
        value: {
          ...mockNavigator,
          hardwareConcurrency: 1,
          deviceMemory: 1,
          connection: {
            effectiveType: '2g',
            saveData: true
          }
        },
        writable: true
      });

      const manager = AdaptivePerformanceManager.getInstance();
      const config = await manager.initialize();

      expect(config.deviceCapabilities.emergencyMode).toBe(true);
      expect(config.performanceBudget.maxRenderTime).toBe(33.3); // 30fps fallback
      expect(config.performanceBudget.enableAnimations).toBe(false);
      expect(config.performanceBudget.websocketUpdateFrequency).toBe(2000); // 2s updates
      expect(config.performanceBudget.maxMemoryUsage).toBe(25); // Minimal memory
    });

    it('should adapt performance based on connection quality', async () => {
      // Setup device with slow connection
      Object.defineProperty(global, 'navigator', {
        value: {
          ...mockNavigator,
          connection: {
            effectiveType: '3g',
            saveData: true
          }
        },
        writable: true
      });

      const manager = AdaptivePerformanceManager.getInstance();
      const config = await manager.initialize();

      expect(config.deviceCapabilities.connectionQuality).toBe('3G');
      expect(config.performanceBudget.websocketUpdateFrequency).toBeGreaterThanOrEqual(1000);
      expect(config.performanceBudget.enableRealTimeUpdates).toBe(false);
    });

    it('should degrade performance when resource usage is high', async () => {
      const manager = AdaptivePerformanceManager.getInstance();
      await manager.initialize();

      // Mock high resource usage
      const highUsageMetrics = {
        cpuUsage: 0.9,
        memoryUsage: 180, // Above 80% of 200MB budget
        batteryLevel: 0.1, // Low battery
        networkLatency: 1500 // High latency
      };

      // Access private method for testing
      const shouldDegrade = (manager as any).shouldDegradePerformance(highUsageMetrics);
      expect(shouldDegrade).toBe(true);
    });

    it('should restore performance when resources are available', async () => {
      const manager = AdaptivePerformanceManager.getInstance();
      await manager.initialize();

      // Mock good resource usage
      const goodUsageMetrics = {
        cpuUsage: 0.3,
        memoryUsage: 50, // Well within budget
        batteryLevel: 0.7, // Good battery
        networkLatency: 100 // Low latency
      };

      const canRestore = (manager as any).canRestorePerformance(goodUsageMetrics);
      expect(canRestore).toBe(true);
    });
  });

  describe('useAdaptivePerformance hook', () => {
    it('should provide correct performance configuration for medium-tier device', async () => {
      render(<TestComponent />);
      
      await waitFor(() => {
        expect(screen.getByTestId('performance-tier')).toHaveTextContent('medium');
      });
      
      expect(screen.getByTestId('emergency-mode')).toHaveTextContent('false');
    });

    it('should handle emergency mode correctly', async () => {
      // Setup emergency mode device
      Object.defineProperty(global, 'navigator', {
        value: {
          ...mockNavigator,
          hardwareConcurrency: 1,
          deviceMemory: 1
        },
        writable: true
      });

      render(<TestComponent />);
      
      await waitFor(() => {
        expect(screen.getByTestId('emergency-mode')).toHaveTextContent('true');
      });
    });
  });

  describe('useAdaptiveAnimation hook', () => {
    it('should enable animations for medium complexity on medium-tier device', async () => {
      render(<TestComponent animationComplexity={2} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('should-animate')).toHaveTextContent('true');
      });
      
      expect(screen.getByTestId('animation-class')).toHaveTextContent('animate');
    });

    it('should disable animations for high complexity on low-tier device', async () => {
      // Setup low-tier device
      Object.defineProperty(global, 'navigator', {
        value: {
          ...mockNavigator,
          hardwareConcurrency: 2,
          deviceMemory: 2
        },
        writable: true
      });

      render(<TestComponent animationComplexity={5} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('should-animate')).toHaveTextContent('false');
      });
      
      expect(screen.getByTestId('animation-class')).toHaveTextContent('no-animate');
    });

    it('should disable all animations in emergency mode', async () => {
      // Setup emergency mode
      Object.defineProperty(global, 'navigator', {
        value: {
          ...mockNavigator,
          hardwareConcurrency: 1,
          deviceMemory: 1
        },
        writable: true
      });

      render(<TestComponent animationComplexity={1} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('should-animate')).toHaveTextContent('false');
      });
    });
  });

  describe('useAdaptiveWebSocket hook', () => {
    it('should set appropriate WebSocket frequency for medium-tier device', async () => {
      render(<TestComponent />);
      
      await waitFor(() => {
        const frequency = screen.getByTestId('websocket-frequency').textContent;
        expect(parseInt(frequency!)).toBe(250); // Medium tier frequency
      });
      
      const batchSize = screen.getByTestId('websocket-batch-size').textContent;
      expect(parseInt(batchSize!)).toBe(2); // Medium tier batch size
    });

    it('should use larger batch sizes for low-performance devices', async () => {
      // Setup low-tier device
      Object.defineProperty(global, 'navigator', {
        value: {
          ...mockNavigator,
          hardwareConcurrency: 2,
          deviceMemory: 2
        },
        writable: true
      });

      render(<TestComponent />);
      
      await waitFor(() => {
        const batchSize = screen.getByTestId('websocket-batch-size').textContent;
        expect(parseInt(batchSize!)).toBe(3); // Low tier batch size
      });
    });

    it('should use emergency settings for extremely limited devices', async () => {
      // Setup emergency mode device
      Object.defineProperty(global, 'navigator', {
        value: {
          ...mockNavigator,
          hardwareConcurrency: 1,
          deviceMemory: 1
        },
        writable: true
      });

      render(<TestComponent />);
      
      await waitFor(() => {
        const frequency = screen.getByTestId('websocket-frequency').textContent;
        expect(parseInt(frequency!)).toBe(2000); // Emergency mode frequency
        
        const batchSize = screen.getByTestId('websocket-batch-size').textContent;
        expect(parseInt(batchSize!)).toBe(5); // Emergency mode batch size
      });
    });
  });

  describe('useAdaptiveRendering hook', () => {
    it('should render components normally on capable devices', async () => {
      render(<TestComponent />);
      
      await waitFor(() => {
        expect(screen.getByTestId('test-component')).toBeInTheDocument();
      });
      
      expect(screen.getByTestId('simplified-version')).toHaveTextContent('false');
    });

    it('should use simplified version for low-performance scenarios', async () => {
      // Setup low-performance device
      Object.defineProperty(global, 'navigator', {
        value: {
          ...mockNavigator,
          hardwareConcurrency: 2,
          deviceMemory: 2
        },
        writable: true
      });

      render(<TestComponent />);
      
      await waitFor(() => {
        expect(screen.getByTestId('simplified-version')).toHaveTextContent('true');
      });
    });

    it('should hide non-essential components in emergency mode', async () => {
      // Setup emergency mode device
      Object.defineProperty(global, 'navigator', {
        value: {
          ...mockNavigator,
          hardwareConcurrency: 1,
          deviceMemory: 1
        },
        writable: true
      });

      render(<TestComponent />);
      
      // Component should be hidden in emergency mode
      await waitFor(() => {
        expect(screen.queryByTestId('test-component')).not.toBeInTheDocument();
      });
    });
  });

  describe('useProgressiveEnhancement hook', () => {
    it('should enable medium complexity features on medium-tier devices', async () => {
      render(<TestComponent featureComplexity="medium" />);
      
      await waitFor(() => {
        expect(screen.getByTestId('progressive-feature')).toHaveTextContent('true');
      });
      
      expect(screen.getByTestId('feature-level')).toHaveTextContent('medium');
    });

    it('should disable high complexity features on low-tier devices', async () => {
      // Setup low-tier device
      Object.defineProperty(global, 'navigator', {
        value: {
          ...mockNavigator,
          hardwareConcurrency: 2,
          deviceMemory: 2
        },
        writable: true
      });

      render(<TestComponent featureComplexity="high" />);
      
      await waitFor(() => {
        expect(screen.getByTestId('progressive-feature')).toHaveTextContent('false');
        expect(screen.getByTestId('feature-level')).toHaveTextContent('low');
      });
    });

    it('should enable all features on high-performance devices', async () => {
      // Setup high-performance device
      Object.defineProperty(global, 'navigator', {
        value: {
          ...mockNavigator,
          hardwareConcurrency: 8,
          deviceMemory: 16,
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        writable: true
      });

      render(<TestComponent featureComplexity="high" />);
      
      await waitFor(() => {
        expect(screen.getByTestId('progressive-feature')).toHaveTextContent('true');
        expect(screen.getByTestId('feature-level')).toHaveTextContent('high');
      });
    });
  });

  describe('Performance Budget Compliance', () => {
    it('should enforce memory usage limits based on device tier', async () => {
      const manager = AdaptivePerformanceManager.getInstance();
      const config = await manager.initialize();

      // Medium tier device should have 100MB memory budget
      expect(config.performanceBudget.maxMemoryUsage).toBe(100);
      
      // Check that budget is enforced
      const currentUsage = await (manager as any).getCurrentResourceUsage();
      expect(currentUsage.memoryUsage).toBeLessThanOrEqual(config.performanceBudget.maxMemoryUsage * 0.8);
    });

    it('should adjust animation complexity based on performance constraints', async () => {
      const manager = AdaptivePerformanceManager.getInstance();
      await manager.initialize();
      
      const config = manager.getConfiguration();
      expect(config?.performanceBudget.maxAnimationComplexity).toBeGreaterThanOrEqual(0);
      expect(config?.performanceBudget.maxAnimationComplexity).toBeLessThanOrEqual(5);
    });

    it('should validate WebSocket update frequency constraints', async () => {
      const manager = AdaptivePerformanceManager.getInstance();
      await manager.initialize();
      
      const config = manager.getConfiguration();
      
      // Frequency should be reasonable for device tier
      if (config?.deviceCapabilities.performanceTier === 'low') {
        expect(config.performanceBudget.websocketUpdateFrequency).toBeGreaterThanOrEqual(500);
      } else if (config?.deviceCapabilities.performanceTier === 'high') {
        expect(config.performanceBudget.websocketUpdateFrequency).toBeLessThanOrEqual(100);
      }
    });
  });

  describe('Real-world Performance Scenarios', () => {
    it('should handle rapid device capability changes', async () => {
      const manager = AdaptivePerformanceManager.getInstance();
      await manager.initialize();
      
      let config = manager.getConfiguration();
      const originalTier = config?.deviceCapabilities.performanceTier;
      
      // Simulate performance degradation
      (manager as any).degradePerformance();
      
      config = manager.getConfiguration();
      expect(config?.performanceBudget.maxAnimationComplexity).toBeLessThanOrEqual(3);
    });

    it('should handle battery-aware optimization', async () => {
      // Mock low battery scenario
      Object.defineProperty(global, 'navigator', {
        value: {
          ...mockNavigator,
          getBattery: vi.fn(() => Promise.resolve({
            level: 0.15, // 15% battery
            charging: false
          }))
        },
        writable: true
      });

      const manager = AdaptivePerformanceManager.getInstance();
      const config = await manager.initialize();
      
      expect(config.deviceCapabilities.batteryOptimization).toBe(true);
    });

    it('should adapt to network quality changes', async () => {
      // Test 3G network adaptation
      Object.defineProperty(global, 'navigator', {
        value: {
          ...mockNavigator,
          connection: {
            effectiveType: '3g',
            saveData: true
          }
        },
        writable: true
      });

      const manager = AdaptivePerformanceManager.getInstance();
      const config = await manager.initialize();
      
      expect(config.deviceCapabilities.connectionQuality).toBe('3G');
      expect(config.performanceBudget.websocketUpdateFrequency).toBeGreaterThanOrEqual(1000);
      expect(config.performanceBudget.enableRealTimeUpdates).toBe(false);
    });
  });
});