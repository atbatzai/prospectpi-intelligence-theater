import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { DeviceCapabilities } from "@/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Task 0.6: Performance Monitoring Pipeline
 * Real-time performance tracking system
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();
  
  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  trackMetric(name: string, value: number) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(value);
    
    // Keep only last 100 measurements
    if (this.metrics.get(name)!.length > 100) {
      this.metrics.get(name)!.shift();
    }
  }

  getAverageMetric(name: string): number {
    const values = this.metrics.get(name) || [];
    return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  }

  trackRenderTime(componentName: string, renderTime: number) {
    this.trackMetric(`render-${componentName}`, renderTime);
  }

  trackWebSocketLatency(latency: number) {
    this.trackMetric('websocket-latency', latency);
  }

  trackMemoryUsage() {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.trackMetric('memory-used', memory.usedJSHeapSize / 1024 / 1024); // MB
    }
  }

  getPerformanceReport() {
    return {
      renderTimes: Object.fromEntries(
        Array.from(this.metrics.entries())
          .filter(([key]) => key.startsWith('render-'))
          .map(([key, values]) => [key, this.getAverageMetric(key)])
      ),
      websocketLatency: this.getAverageMetric('websocket-latency'),
      memoryUsage: this.getAverageMetric('memory-used'),
    };
  }
}

/**
 * Task 0.3: Device Capability Detection System
 * Critical foundation for mobile performance optimization
 */
export async function detectDeviceCapabilities(): Promise<DeviceCapabilities> {
  // Performance tier detection based on hardware
  const cores = navigator.hardwareConcurrency || 4;
  const memory = (navigator as any).deviceMemory || 4;
  
  let performanceTier: 'low' | 'medium' | 'high' = 'medium';
  let emergencyMode = false;
  
  // Task 2.5: Emergency fallback detection for extremely low-end devices
  if (cores <= 2 || memory <= 2) {
    performanceTier = 'low';
    
    // Trigger emergency mode for devices with very limited resources
    if (cores === 1 || memory <= 1) {
      emergencyMode = true;
      console.warn('🚨 Emergency performance mode activated: text-only fallbacks enabled');
    }
  } else if (cores >= 6 && memory >= 8) {
    performanceTier = 'high';
  }

  // Connection quality detection
  const connection = (navigator as any).connection;
  let connectionQuality: '2G' | '3G' | '4G' | 'wifi' = '4G';
  if (connection) {
    const effectiveType = connection.effectiveType;
    if (effectiveType === 'slow-2g' || effectiveType === '2g') {
      connectionQuality = '2G';
    } else if (effectiveType === '3g') {
      connectionQuality = '3G';
    } else if (effectiveType === '4g' || !effectiveType) {
      connectionQuality = '4G';
    }
  }

  // Battery optimization detection
  const batteryOptimization = (navigator as any).getBattery ? 
    await getBatteryStatus() : false;

  // User preferences
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const dataSaver = (navigator as any).connection?.saveData || false;

  return {
    performanceTier,
    connectionQuality,
    hardware: {
      cores,
      memory,
      gpu: detectGPU()
    },
    batteryOptimization,
    reducedMotion,
    dataSaver,
    // Task 2.5: Emergency mode flag for text-only fallbacks
    emergencyMode
  };
}

async function getBatteryStatus(): Promise<boolean> {
  try {
    const battery = await (navigator as any).getBattery();
    return battery.charging === false && battery.level < 0.2;
  } catch {
    return false;
  }
}

function detectGPU(): 'integrated' | 'discrete' | 'unknown' {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') as WebGLRenderingContext | null;
    
    if (!gl) return 'unknown';
    
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (!debugInfo) return 'unknown';
    
    const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) as string;
    
    // Basic heuristics for GPU detection
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
