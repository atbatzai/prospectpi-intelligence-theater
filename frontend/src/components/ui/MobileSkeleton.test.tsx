/**
 * Task 4.1: Mobile Skeleton Component Tests  
 */

import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { MobileSkeleton, MobileSkeletonGroup } from './MobileSkeleton';
import { DeviceCapabilities } from '@/types';

// Mock the performance store
vi.mock('@/store/intelligenceStore', () => ({
  usePerformanceStore: vi.fn()
}));

import { usePerformanceStore } from '@/store/intelligenceStore';

describe('MobileSkeleton', () => {
  let mockDeviceCapabilities: DeviceCapabilities;
  const mockUsePerformanceStore = usePerformanceStore as any;

  beforeEach(() => {
    mockDeviceCapabilities = {
      performanceTier: 'low',
      connectionQuality: '3G',
      hardware: {
        cores: 4,
        memory: 3,
        gpu: 'integrated'
      },
      batteryOptimization: true,
      reducedMotion: false,
      dataSaver: true,
      emergencyMode: false
    };

    mockUsePerformanceStore.mockReturnValue({
      deviceCapabilities: mockDeviceCapabilities,
      animationsEnabled: true
    });
  });

  describe('Basic Skeleton Component', () => {
    it('renders with default properties', () => {
      render(<MobileSkeleton />);
      
      const skeleton = document.querySelector('.bg-slate-200');
      expect(skeleton).toBeInTheDocument();
      expect(skeleton).toHaveClass('h-4', 'w-full', 'rounded-md');
    });

    it('applies custom dimensions', () => {
      render(<MobileSkeleton height="h-8" width="w-32" />);
      
      const skeleton = document.querySelector('.bg-slate-200');
      expect(skeleton).toHaveClass('h-8', 'w-32');
    });

    it('supports rounded mode', () => {
      render(<MobileSkeleton rounded />);
      
      const skeleton = document.querySelector('.bg-slate-200');
      expect(skeleton).toHaveClass('rounded-full');
    });

    it('applies custom CSS classes', () => {
      render(<MobileSkeleton className="custom-class" />);
      
      const skeleton = document.querySelector('.bg-slate-200');
      expect(skeleton).toHaveClass('custom-class');
    });
  });

  describe('Animation Optimization', () => {
    it('enables animations on high-performance devices', () => {
      mockDeviceCapabilities.performanceTier = 'high';
      mockUsePerformanceStore.mockReturnValue({
        deviceCapabilities: mockDeviceCapabilities,
        animationsEnabled: true
      });

      render(<MobileSkeleton />);
      
      const skeleton = document.querySelector('.bg-slate-200');
      expect(skeleton).toHaveClass('animate-pulse');
    });

    it('disables animations on low-performance devices', () => {
      mockDeviceCapabilities.performanceTier = 'low';
      mockUsePerformanceStore.mockReturnValue({
        deviceCapabilities: mockDeviceCapabilities,
        animationsEnabled: false
      });

      render(<MobileSkeleton />);
      
      const skeleton = document.querySelector('.bg-slate-200');
      expect(skeleton).not.toHaveClass('animate-pulse');
    });

    it('respects reduced motion preferences', () => {
      mockDeviceCapabilities.reducedMotion = true;
      mockUsePerformanceStore.mockReturnValue({
        deviceCapabilities: mockDeviceCapabilities,
        animationsEnabled: false
      });

      render(<MobileSkeleton />);
      
      const skeleton = document.querySelector('.bg-slate-200');
      expect(skeleton).not.toHaveClass('animate-pulse');
    });

    it('disables animations in emergency mode', () => {
      mockDeviceCapabilities.emergencyMode = true;
      mockUsePerformanceStore.mockReturnValue({
        deviceCapabilities: mockDeviceCapabilities,
        animationsEnabled: false
      });

      render(<MobileSkeleton />);
      
      const skeleton = document.querySelector('.bg-slate-200');
      expect(skeleton).not.toHaveClass('animate-pulse');
    });

    it('allows manual animation override', () => {
      render(<MobileSkeleton animate={false} />);
      
      const skeleton = document.querySelector('.bg-slate-200');
      expect(skeleton).not.toHaveClass('animate-pulse');
    });
  });
});

describe('MobileSkeletonGroup', () => {
  let mockDeviceCapabilities: DeviceCapabilities;
  const mockUsePerformanceStore = usePerformanceStore as any;

  beforeEach(() => {
    mockDeviceCapabilities = {
      performanceTier: 'medium',
      connectionQuality: '4G',
      hardware: {
        cores: 8,
        memory: 6,
        gpu: 'integrated'
      },
      batteryOptimization: false,
      reducedMotion: false,
      dataSaver: false,
      emergencyMode: false
    };

    mockUsePerformanceStore.mockReturnValue({
      deviceCapabilities: mockDeviceCapabilities,
      animationsEnabled: true
    });

    // Mock window dimensions for desktop
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024, // Desktop width
    });
  });

  describe('Agent Theater Pattern', () => {
    it('renders agent theater skeleton layout', () => {
      render(<MobileSkeletonGroup type="agent-theater" />);
      
      // Should render 3 agent cards by default
      const cards = document.querySelectorAll('.border.rounded-lg.bg-white');
      expect(cards.length).toBe(3);
    });

    it('adapts agent theater for mobile', () => {
      mockDeviceCapabilities.performanceTier = 'low';
      Object.defineProperty(window, 'innerWidth', {
        value: 375, // Mobile width
      });

      render(<MobileSkeletonGroup type="agent-theater" />);
      
      // Should add mobile margins
      const cards = document.querySelectorAll('.mx-2');
      expect(cards.length).toBeGreaterThan(0);
    });
  });

  describe('Dossier Section Pattern', () => {
    it('renders dossier section skeleton layout', () => {
      render(<MobileSkeletonGroup type="dossier-section" count={2} />);
      
      const sections = document.querySelectorAll('.border.rounded-lg.bg-white');
      expect(sections.length).toBe(2);
    });

    it('includes confidence badges in dossier sections', () => {
      render(<MobileSkeletonGroup type="dossier-section" />);
      
      // Should have skeleton elements for confidence badges
      const badgeSkeletons = document.querySelectorAll('.w-16, .w-20');
      expect(badgeSkeletons.length).toBeGreaterThan(0);
    });
  });

  describe('Company Input Pattern', () => {
    it('renders company input form skeleton', () => {
      render(<MobileSkeletonGroup type="company-input" />);
      
      // Should have form structure with input fields
      const formContainer = document.querySelector('.p-6.border.rounded-lg.bg-white');
      expect(formContainer).toBeInTheDocument();
    });

    it('adapts company input for mobile layout', () => {
      mockDeviceCapabilities.performanceTier = 'low';
      Object.defineProperty(window, 'innerWidth', {
        value: 375, // Mobile width
      });

      render(<MobileSkeletonGroup type="company-input" />);
      
      // Should use mobile grid layout (1 column)
      const gridContainer = document.querySelector('.grid-cols-1');
      expect(gridContainer).toBeInTheDocument();
    });

    it('uses desktop grid layout on larger screens', () => {
      Object.defineProperty(window, 'innerWidth', {
        value: 1024, // Desktop width
      });

      render(<MobileSkeletonGroup type="company-input" />);
      
      // Should use desktop grid layout (2 columns)
      const gridContainer = document.querySelector('.grid-cols-2');
      expect(gridContainer).toBeInTheDocument();
    });
  });

  describe('List Item Pattern', () => {
    it('renders list item skeletons', () => {
      render(<MobileSkeletonGroup type="list-item" count={5} />);
      
      // Should render 5 list items
      const listItems = document.querySelectorAll('.flex.items-center.gap-3');
      expect(listItems.length).toBe(5);
    });

    it('ensures mobile touch target sizes for list items', () => {
      mockDeviceCapabilities.performanceTier = 'low';
      Object.defineProperty(window, 'innerWidth', {
        value: 375, // Mobile width
      });

      render(<MobileSkeletonGroup type="list-item" count={3} />);
      
      // Should have minimum touch target height
      const listItems = document.querySelectorAll('.min-h-\\[48px\\]');
      expect(listItems.length).toBe(3);
    });
  });

  describe('Card Pattern', () => {
    it('renders card skeletons with proper structure', () => {
      render(<MobileSkeletonGroup type="card" count={2} />);
      
      const cards = document.querySelectorAll('.border.rounded-lg.bg-white');
      expect(cards.length).toBe(2);
    });

    it('includes action buttons in card layout', () => {
      render(<MobileSkeletonGroup type="card" />);
      
      // Should have skeleton elements for buttons
      const buttonSkeletons = document.querySelectorAll('.w-16');
      expect(buttonSkeletons.length).toBeGreaterThan(0);
    });
  });

  describe('Performance Optimization', () => {
    it('renders quickly on low-end devices', () => {
      mockDeviceCapabilities.performanceTier = 'low';
      
      const startTime = performance.now();
      render(<MobileSkeletonGroup type="agent-theater" />);
      const endTime = performance.now();
      
      const renderTime = endTime - startTime;
      expect(renderTime).toBeLessThan(50); // 50ms budget
    });

    it('uses fewer skeleton elements on very low-end devices', () => {
      mockDeviceCapabilities.performanceTier = 'low';
      mockDeviceCapabilities.emergencyMode = true;
      
      render(<MobileSkeletonGroup type="agent-theater" />);
      
      // Should render fewer elements in emergency mode
      const skeletons = document.querySelectorAll('.bg-slate-200');
      expect(skeletons.length).toBeLessThan(20); // Reduced skeleton count
    });

    it('applies custom CSS classes', () => {
      render(<MobileSkeletonGroup type="list-item" className="custom-spacing" />);
      
      const container = document.querySelector('.custom-spacing');
      expect(container).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('adapts skeleton sizing for mobile screens', () => {
      Object.defineProperty(window, 'innerWidth', {
        value: 375, // Mobile width
      });

      render(<MobileSkeletonGroup type="dossier-section" />);
      
      // Should use mobile-optimized sizing
      const mobileElements = document.querySelectorAll('.h-4, .h-5');
      expect(mobileElements.length).toBeGreaterThan(0);
    });

    it('uses larger skeleton elements on desktop', () => {
      Object.defineProperty(window, 'innerWidth', {
        value: 1024, // Desktop width
      });

      render(<MobileSkeletonGroup type="dossier-section" />);
      
      // Should use desktop sizing
      const desktopElements = document.querySelectorAll('.h-5, .h-6');
      expect(desktopElements.length).toBeGreaterThan(0);
    });
  });

  describe('Memory Efficiency', () => {
    it('validates memory usage with large skeleton groups', () => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      render(<MobileSkeletonGroup type="list-item" count={50} />);
      
      const afterMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryIncrease = afterMemory - initialMemory;
      
      // Should not use excessive memory for skeleton rendering
      expect(memoryIncrease).toBeLessThan(512 * 1024); // 512KB limit
    });
  });
});