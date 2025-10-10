/**
 * Task 5.1: Adaptive Performance Architecture
 * Device-aware performance optimization and progressive enhancement
 */

import { DeviceCapabilities } from '@/types';
import { PerformanceMonitor } from '@/lib/utils';

export interface PerformanceBudget {
  maxRenderTime: number;
  maxMemoryUsage: number;
  maxAnimationComplexity: number;
  websocketUpdateFrequency: number;
  enableAnimations: boolean;
  enableRealTimeUpdates: boolean;
  enableProgressiveEnhancement: boolean;
}

export interface AdaptiveConfiguration {
  deviceCapabilities: DeviceCapabilities;
  performanceBudget: PerformanceBudget;
  currentResourceUsage: ResourceUsage;
}

interface ResourceUsage {
  cpuUsage: number;
  memoryUsage: number;
  batteryLevel?: number;
  networkLatency: number;
}

export class AdaptivePerformanceManager {
  private static instance: AdaptivePerformanceManager;
  private performanceMonitor: PerformanceMonitor;
  private currentConfig: AdaptiveConfiguration | null = null;
  private resourceCheckInterval: NodeJS.Timeout | null = null;
  private performanceObserver: PerformanceObserver | null = null;
  
  private constructor() {
    this.performanceMonitor = PerformanceMonitor.getInstance();
    this.initializePerformanceObserver();
  }

  static getInstance(): AdaptivePerformanceManager {
    if (!AdaptivePerformanceManager.instance) {
      AdaptivePerformanceManager.instance = new AdaptivePerformanceManager();
    }
    return AdaptivePerformanceManager.instance;
  }

  /**
   * Initialize adaptive performance system based on device capabilities
   */
  async initialize(): Promise<AdaptiveConfiguration> {
    const deviceCapabilities = await this.detectDeviceCapabilities();
    const performanceBudget = this.calculatePerformanceBudget(deviceCapabilities);
    const currentResourceUsage = await this.getCurrentResourceUsage();

    this.currentConfig = {
      deviceCapabilities,
      performanceBudget,
      currentResourceUsage
    };

    // Start continuous resource monitoring
    this.startResourceMonitoring();

    console.log('🎯 Adaptive Performance Architecture initialized', {
      tier: deviceCapabilities.performanceTier,
      connectionQuality: deviceCapabilities.connectionQuality,
      emergencyMode: deviceCapabilities.emergencyMode,
      websocketFrequency: performanceBudget.websocketUpdateFrequency
    });

    return this.currentConfig;
  }

  /**
   * Get current adaptive configuration
   */
  getConfiguration(): AdaptiveConfiguration | null {
    return this.currentConfig;
  }

  /**
   * Calculate performance budget based on device capabilities
   */
  private calculatePerformanceBudget(capabilities: DeviceCapabilities): PerformanceBudget {
    const { performanceTier, connectionQuality, emergencyMode, reducedMotion, dataSaver } = capabilities;

    // Base performance budgets by device tier
    const budgetMatrix = {
      low: {
        maxRenderTime: 16.6, // 60fps target, but may drop to 30fps
        maxMemoryUsage: 50, // MB
        maxAnimationComplexity: 1, // Minimal animations only
        websocketUpdateFrequency: 500, // 500ms between updates
        enableAnimations: !reducedMotion && !emergencyMode,
        enableRealTimeUpdates: !dataSaver,
        enableProgressiveEnhancement: false
      },
      medium: {
        maxRenderTime: 16.6, // 60fps target
        maxMemoryUsage: 100, // MB
        maxAnimationComplexity: 3, // Moderate animations
        websocketUpdateFrequency: 250, // 250ms between updates
        enableAnimations: !reducedMotion,
        enableRealTimeUpdates: true,
        enableProgressiveEnhancement: true
      },
      high: {
        maxRenderTime: 8.3, // 120fps capable
        maxMemoryUsage: 200, // MB
        maxAnimationComplexity: 5, // Complex animations allowed
        websocketUpdateFrequency: 50, // 50ms real-time updates
        enableAnimations: !reducedMotion,
        enableRealTimeUpdates: true,
        enableProgressiveEnhancement: true
      }
    };

    let budget = { ...budgetMatrix[performanceTier] };

    // Apply connection quality adjustments
    if (connectionQuality === '2G' || connectionQuality === '3G') {
      budget.websocketUpdateFrequency = Math.max(budget.websocketUpdateFrequency, 1000); // 1s minimum for slow connections
      budget.enableRealTimeUpdates = false;
    }

    // Emergency mode overrides
    if (emergencyMode) {
      budget = {
        maxRenderTime: 33.3, // 30fps fallback
        maxMemoryUsage: 25, // Minimal memory
        maxAnimationComplexity: 0, // No animations
        websocketUpdateFrequency: 2000, // 2s updates only
        enableAnimations: false,
        enableRealTimeUpdates: false,
        enableProgressiveEnhancement: false
      };
    }

    return budget;
  }

  /**
   * Detect device capabilities with enhanced mobile detection
   */
  private async detectDeviceCapabilities(): Promise<DeviceCapabilities> {
    // Reuse existing detection logic from utils.ts but with enhancements
    const cores = navigator.hardwareConcurrency || 4;
    const memory = (navigator as any).deviceMemory || 4;
    
    let performanceTier: 'low' | 'medium' | 'high' = 'medium';
    let emergencyMode = false;
    
    // Enhanced device classification
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isTablet = /iPad|Android(?!.*Mobile)/i.test(navigator.userAgent);
    
    if (isMobile && !isTablet) {
      // Mobile devices get more conservative budgets
      if (cores <= 4 || memory <= 3) {
        performanceTier = 'low';
        if (cores <= 2 || memory <= 2) {
          emergencyMode = true;
        }
      } else if (cores >= 8 && memory >= 6) {
        performanceTier = 'high';
      }
    } else {
      // Desktop/tablet classification
      if (cores <= 2 || memory <= 4) {
        performanceTier = 'low';
      } else if (cores >= 8 && memory >= 16) {
        performanceTier = 'high';
      }
    }

    // Connection detection
    const connection = (navigator as any).connection;
    let connectionQuality: '2G' | '3G' | '4G' | 'wifi' = '4G';
    if (connection) {
      const effectiveType = connection.effectiveType;
      if (effectiveType === 'slow-2g' || effectiveType === '2g') {
        connectionQuality = '2G';
      } else if (effectiveType === '3g') {
        connectionQuality = '3G';
      }
    }

    // Battery optimization
    const batteryOptimization = await this.getBatteryStatus();

    // User preferences
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dataSaver = (navigator as any).connection?.saveData || false;

    return {
      performanceTier,
      connectionQuality,
      hardware: {
        cores,
        memory,
        gpu: this.detectGPU()
      },
      batteryOptimization,
      reducedMotion,
      dataSaver,
      emergencyMode
    };
  }

  /**
   * Get current resource usage metrics
   */
  private async getCurrentResourceUsage(): Promise<ResourceUsage> {
    const memoryUsage = await this.getMemoryUsage();
    const networkLatency = this.performanceMonitor.getAverageMetric('websocket-latency') || 0;
    const cpuUsage = await this.estimateCPUUsage();
    const batteryLevel = await this.getBatteryLevel();

    return {
      cpuUsage,
      memoryUsage,
      batteryLevel,
      networkLatency
    };
  }

  /**
   * Start continuous resource monitoring to adapt performance in real-time
   */
  private startResourceMonitoring(): void {
    if (this.resourceCheckInterval) {
      clearInterval(this.resourceCheckInterval);
    }

    this.resourceCheckInterval = setInterval(async () => {
      if (!this.currentConfig) return;

      const currentUsage = await this.getCurrentResourceUsage();
      this.currentConfig.currentResourceUsage = currentUsage;

      // Check if we need to degrade performance
      const shouldDegrade = this.shouldDegradePerformance(currentUsage);
      if (shouldDegrade) {
        this.degradePerformance();
      }

      // Check if we can restore performance
      const canRestore = this.canRestorePerformance(currentUsage);
      if (canRestore) {
        this.restorePerformance();
      }

    }, 5000); // Check every 5 seconds
  }

  /**
   * Determine if performance should be degraded based on current resource usage
   */
  private shouldDegradePerformance(usage: ResourceUsage): boolean {
    if (!this.currentConfig) return false;

    const { performanceBudget } = this.currentConfig;
    
    return (
      usage.memoryUsage > performanceBudget.maxMemoryUsage * 0.8 || // 80% of budget
      usage.networkLatency > 1000 || // High latency
      (usage.batteryLevel !== undefined && usage.batteryLevel < 0.15) || // Low battery
      usage.cpuUsage > 0.8 // High CPU usage
    );
  }

  /**
   * Check if performance can be restored
   */
  private canRestorePerformance(usage: ResourceUsage): boolean {
    if (!this.currentConfig) return false;

    const { performanceBudget } = this.currentConfig;
    
    return (
      usage.memoryUsage < performanceBudget.maxMemoryUsage * 0.5 && // Well within budget
      usage.networkLatency < 200 && // Good latency
      (usage.batteryLevel === undefined || usage.batteryLevel > 0.3) && // Good battery
      usage.cpuUsage < 0.4 // Low CPU usage
    );
  }

  /**
   * Degrade performance by reducing animation complexity and update frequency
   */
  private degradePerformance(): void {
    if (!this.currentConfig) return;

    const budget = this.currentConfig.performanceBudget;
    
    // Reduce animation complexity
    if (budget.maxAnimationComplexity > 0) {
      budget.maxAnimationComplexity = Math.max(0, budget.maxAnimationComplexity - 1);
    }
    
    // Reduce update frequency
    budget.websocketUpdateFrequency = Math.min(2000, budget.websocketUpdateFrequency * 1.5);
    
    // Disable non-essential features
    if (budget.maxAnimationComplexity === 0) {
      budget.enableAnimations = false;
    }

    console.warn('⚠️ Performance degraded due to resource constraints', {
      animationComplexity: budget.maxAnimationComplexity,
      updateFrequency: budget.websocketUpdateFrequency,
      animationsEnabled: budget.enableAnimations
    });
  }

  /**
   * Restore performance when resources are available
   */
  private restorePerformance(): void {
    if (!this.currentConfig) return;

    // Recalculate optimal budget for current device
    const optimalBudget = this.calculatePerformanceBudget(this.currentConfig.deviceCapabilities);
    
    // Gradually restore capabilities
    const currentBudget = this.currentConfig.performanceBudget;
    
    if (currentBudget.maxAnimationComplexity < optimalBudget.maxAnimationComplexity) {
      currentBudget.maxAnimationComplexity = Math.min(
        optimalBudget.maxAnimationComplexity,
        currentBudget.maxAnimationComplexity + 1
      );
    }
    
    if (currentBudget.websocketUpdateFrequency > optimalBudget.websocketUpdateFrequency) {
      currentBudget.websocketUpdateFrequency = Math.max(
        optimalBudget.websocketUpdateFrequency,
        currentBudget.websocketUpdateFrequency * 0.8
      );
    }
    
    currentBudget.enableAnimations = optimalBudget.enableAnimations && currentBudget.maxAnimationComplexity > 0;

    console.log('✅ Performance restored', {
      animationComplexity: currentBudget.maxAnimationComplexity,
      updateFrequency: currentBudget.websocketUpdateFrequency,
      animationsEnabled: currentBudget.enableAnimations
    });
  }

  /**
   * Initialize performance observer for measuring rendering performance
   */
  private initializePerformanceObserver(): void {
    if ('PerformanceObserver' in window) {
      this.performanceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'measure') {
            this.performanceMonitor.trackMetric(`performance-${entry.name}`, entry.duration);
          }
        }
      });

      this.performanceObserver.observe({ entryTypes: ['measure'] });
    }
  }

  /**
   * Helper methods for resource detection
   */
  private async getBatteryStatus(): Promise<boolean> {
    try {
      const battery = await (navigator as any).getBattery();
      return battery.charging === false && battery.level < 0.2;
    } catch {
      return false;
    }
  }

  private async getBatteryLevel(): Promise<number | undefined> {
    try {
      const battery = await (navigator as any).getBattery();
      return battery.level;
    } catch {
      return undefined;
    }
  }

  private async getMemoryUsage(): Promise<number> {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return memory.usedJSHeapSize / 1024 / 1024; // Convert to MB
    }
    return 0;
  }

  private async estimateCPUUsage(): Promise<number> {
    // Simple CPU usage estimation based on frame timing
    return new Promise((resolve) => {
      const start = performance.now();
      const iterations = 10000;
      
      for (let i = 0; i < iterations; i++) {
        Math.random();
      }
      
      const end = performance.now();
      const executionTime = end - start;
      
      // Normalize to 0-1 scale (higher execution time = higher CPU usage)
      const normalizedUsage = Math.min(1, executionTime / 100);
      resolve(normalizedUsage);
    });
  }

  private detectGPU(): 'integrated' | 'discrete' | 'unknown' {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') as WebGLRenderingContext | null;
      
      if (!gl) return 'unknown';
      
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (!debugInfo) return 'unknown';
      
      const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) as string;
      
      if (renderer.includes('Intel') || renderer.includes('AMD Radeon(TM)')) {
        return 'integrated';
      } else if (renderer.includes('NVIDIA') || renderer.includes('Radeon RX')) {
        return 'discrete';
      }
      
      return 'unknown';
    } catch {
      return 'unknown';
    }
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    if (this.resourceCheckInterval) {
      clearInterval(this.resourceCheckInterval);
      this.resourceCheckInterval = null;
    }
    
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
      this.performanceObserver = null;
    }
  }
}

export default AdaptivePerformanceManager;