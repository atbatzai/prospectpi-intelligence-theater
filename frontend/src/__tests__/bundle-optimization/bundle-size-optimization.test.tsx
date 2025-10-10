/**
 * Task 5.2: Bundle Size Optimization Testing
 * Core bundle size monitoring functionality
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { BundleSizeMonitor } from '@/utils/bundle-analysis/bundleSizeMonitor';

// Mock data for testing - Simulates Next.js build stats output
const mockBuildStats = {
  chunks: [
    {
      id: 'main',
      names: ['main'],
      size: 150000, // 150KB
      modules: [
        { name: './src/pages/_app.tsx' },
        { name: './src/components/Layout.tsx' }
      ]
    },
    {
      id: 'auth-epic',
      names: ['auth-epic'],
      size: 100000, // 100KB - Auth epic chunk
      modules: [
        { name: './src/components/auth/LoginForm.tsx' },
        { name: './src/components/auth/SignupForm.tsx' }
      ]
    },
    {
      id: 'intelligence-epic',
      names: ['intelligence-epic'],
      size: 80000, // 80KB - Intelligence epic
      modules: [
        { name: './src/components/intelligence/AgentProgressTheater.tsx' },
        { name: './src/components/intelligence/SmartCompanyInput.tsx' }
      ]
    },
    {
      id: 'mobile-epic',
      names: ['mobile-epic'],
      size: 75000, // 75KB - Mobile epic
      modules: [
        { name: './src/components/mobile/MobileErrorMessage.tsx' },
        { name: './src/components/mobile/MobileNavigation.tsx' }
      ]
    },
    {
      id: 'vendors',
      names: ['vendors'],
      size: 200000, // 200KB - Large vendor bundle
      modules: [
        { name: './node_modules/react/index.js' },
        { name: './node_modules/react-dom/index.js' }
      ]
    }
  ]
};

describe('Task 5.2: Bundle Size Optimization', () => {
  describe('BundleSizeMonitor', () => {
    let monitor: BundleSizeMonitor;

    beforeEach(() => {
      monitor = BundleSizeMonitor.getInstance();
    });

    it('should analyze bundle metrics correctly', () => {
      const metrics = monitor.analyzeBundleMetrics(mockBuildStats);

      expect(metrics.totalSize).toBe(605000); // Sum of all chunk sizes
      expect(metrics.chunks).toHaveLength(5);
      expect(metrics.chunks[0].name).toBe('vendors'); // Largest chunk first
    });

    it('should identify epic chunks correctly', () => {
      const metrics = monitor.analyzeBundleMetrics(mockBuildStats);
      
      const authChunk = metrics.chunks.find(c => c.name === 'auth-epic');
      const intelligenceChunk = metrics.chunks.find(c => c.name === 'intelligence-epic');
      const mobileChunk = metrics.chunks.find(c => c.name === 'mobile-epic');

      expect(authChunk?.isEpic).toBe(true);
      expect(authChunk?.epicCategory).toBe('auth');
      expect(intelligenceChunk?.isEpic).toBe(true);
      expect(intelligenceChunk?.epicCategory).toBe('intelligence');
      expect(mobileChunk?.isEpic).toBe(true);
      expect(mobileChunk?.epicCategory).toBe('mobile');
    });

    it('should check performance budgets for all device types', () => {
      const metrics = monitor.analyzeBundleMetrics(mockBuildStats);

      // Total size (605KB) exceeds all budgets
      expect(metrics.performanceBudgets.mobile.isViolation).toBe(true);
      expect(metrics.performanceBudgets.tablet.isViolation).toBe(true);
      expect(metrics.performanceBudgets.desktop.isViolation).toBe(true);
    });

    it('should generate optimization recommendations', () => {
      const metrics = monitor.analyzeBundleMetrics(mockBuildStats);

      // Log recommendations to see exact format
      console.log('Recommendations:', metrics.recommendations);

      expect(metrics.recommendations.length).toBeGreaterThan(0);
      expect(metrics.recommendations.some(r => r.includes('Mobile budget exceeded'))).toBe(true);
      expect(metrics.recommendations.some(r => r.includes('Large chunks detected'))).toBe(true);
    });

    it('should format bundle sizes correctly', () => {
      const metrics = monitor.analyzeBundleMetrics(mockBuildStats);
      
      // Check that gzipped sizes are calculated (approximately 30% of original)
      metrics.chunks.forEach(chunk => {
        expect(chunk.gzippedSize).toBeCloseTo(chunk.size * 0.3, 0);
      });
    });

    it('should enforce mobile performance budgets', () => {
      const metrics = monitor.analyzeBundleMetrics(mockBuildStats);
      
      // Mobile budget: 200KB total, current: 605KB
      expect(metrics.performanceBudgets.mobile.isViolation).toBe(true);
      expect(metrics.performanceBudgets.mobile.violationPercentage).toBeGreaterThan(190); // ~202% violation
    });

    it('should pass compliance check for optimized bundles', () => {
      const optimizedBuildStats = {
        chunks: [
          { id: 'main', names: ['main'], size: 80000, modules: [] }, // 80KB
          { id: 'auth-epic', names: ['auth-epic'], size: 40000, modules: [] }, // 40KB
          { id: 'intelligence-epic', names: ['intelligence-epic'], size: 50000, modules: [] } // 50KB
        ]
      };

      const metrics = monitor.analyzeBundleMetrics(optimizedBuildStats);
      
      // Total: 170KB - under mobile budget (200KB)
      expect(metrics.performanceBudgets.mobile.isViolation).toBe(false);
      expect(metrics.performanceBudgets.tablet.isViolation).toBe(false);
      expect(metrics.performanceBudgets.desktop.isViolation).toBe(false);
    });
  });
});