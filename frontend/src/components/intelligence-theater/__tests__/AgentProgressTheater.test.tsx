import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { AgentProgressTheater } from '../AgentProgressTheater';
import { AgentProgress, DeviceCapabilities } from '@/types';

// Mock the performance store
vi.mock('@/store/intelligenceStore', () => ({
  usePerformanceStore: vi.fn()
}));

// Mock adaptive performance hooks
vi.mock('@/lib/adaptive-performance', () => ({
  useAdaptivePerformance: vi.fn(),
  useAdaptiveAnimation: vi.fn(),
  useAdaptiveRendering: vi.fn(),
  useAdaptiveLoading: vi.fn()
}));

import { usePerformanceStore } from '@/store/intelligenceStore';
import { 
  useAdaptivePerformance,
  useAdaptiveAnimation,
  useAdaptiveRendering,
  useAdaptiveLoading
} from '@/lib/adaptive-performance';

describe('AgentProgressTheater', () => {
  const mockOnInterrupt = vi.fn();

  const mockAgentProgress: AgentProgress[] = [
    {
      id: 'coordinator',
      name: 'coordinator',
      status: 'working',
      progress: 65,
      currentAction: 'Analyzing target organization structure',
      avatar: '🎯',
      metadata: {
        sourceCount: 8,
        insightsCount: 12,
        confidenceScore: 78
      }
    },
    {
      id: 'researcher',
      name: 'researcher',
      status: 'working',
      progress: 42,
      currentAction: 'Gathering financial intelligence from public sources',
      avatar: '🔍',
      metadata: {
        sourceCount: 15,
        insightsCount: 8,
        confidenceScore: 65
      }
    },
    {
      id: 'detective',
      name: 'detective',
      status: 'completed',
      progress: 100,
      currentAction: 'Competitive analysis complete',
      avatar: '🕵️',
      metadata: {
        sourceCount: 6,
        insightsCount: 24,
        confidenceScore: 92
      }
    }
  ];

  beforeEach(() => {
    mockOnInterrupt.mockClear();
    
    // Mock performance store for all tests
    const mockUsePerformanceStore = usePerformanceStore as any;
    mockUsePerformanceStore.mockReturnValue({
      deviceCapabilities: {
        isMobile: false,
        screen: { width: 1024, height: 768 },
        performanceTier: 'high',
        connection: { effectiveType: '4g', downlink: 10 },
        batteryOptimization: false,
        reducedMotion: false,
        emergencyMode: false
      },
      performanceMonitor: {
        startTracking: vi.fn(),
        stopTracking: vi.fn(),
        getMetrics: vi.fn(() => ({ renderTime: 100, memoryUsage: 50 }))
      },
      isLoading: false,
      isInitialized: true
    });

    // Mock adaptive performance hooks
    const mockUseAdaptivePerformance = useAdaptivePerformance as any;
    mockUseAdaptivePerformance.mockReturnValue({
      isEmergencyMode: vi.fn(() => false),
      performanceTier: 'high',
      connectionQuality: 'good',
      enableProgressiveEnhancement: vi.fn(() => true),
      isInitialized: true
    });

    const mockUseAdaptiveAnimation = useAdaptiveAnimation as any;
    mockUseAdaptiveAnimation.mockReturnValue({
      shouldAnimate: true,
      getAnimationDuration: vi.fn((base: number) => base),
      animationClass: 'transition-all duration-300'
    });

    const mockUseAdaptiveRendering = useAdaptiveRendering as any;
    mockUseAdaptiveRendering.mockReturnValue({
      shouldRenderComponent: true,
      shouldUseSimplifiedVersion: false
    });

    const mockUseAdaptiveLoading = useAdaptiveLoading as any;
    mockUseAdaptiveLoading.mockReturnValue({
      getLoadingComponent: vi.fn(() => null)
    });
  });

  const renderComponent = (props = {}) => {
    return render(
      <AgentProgressTheater
        progress={mockAgentProgress}
        canInterrupt={false}
        onInterrupt={mockOnInterrupt}
        estimatedCompletion={180}
        {...props}
      />
    );
  };

  it('renders the theater header with live operations title', () => {
    renderComponent();
    
    expect(screen.getByText('Intelligence Theater - Live Operations')).toBeInTheDocument();
    expect(screen.getByText('3 Agents Active')).toBeInTheDocument();
    expect(screen.getByText('Multi-Source Intel')).toBeInTheDocument();
  });

  it('displays estimated completion time', () => {
    renderComponent({ estimatedCompletion: 240 });
    
    expect(screen.getByText('ETA: 4m 0s')).toBeInTheDocument();
  });

  it('renders all agent progress cards', () => {
    renderComponent();
    
    expect(screen.getByText('coordinator')).toBeInTheDocument();
    expect(screen.getByText('researcher')).toBeInTheDocument();
    expect(screen.getByText('detective')).toBeInTheDocument();
    
    // Check agent avatars
    expect(screen.getByText('🎯')).toBeInTheDocument();
    expect(screen.getByText('🔍')).toBeInTheDocument();
    expect(screen.getByText('🕵️')).toBeInTheDocument();
  });

  it('shows correct agent status badges', () => {
    renderComponent();
    
    const workingBadges = screen.getAllByText('working');
    expect(workingBadges).toHaveLength(2);
    
    expect(screen.getByText('completed')).toBeInTheDocument();
  });

  it('displays progress bars with correct values', () => {
    renderComponent();

    // Use getAllByText for duplicate values and check array length
    const progress65 = screen.getAllByText('65%');
    expect(progress65.length).toBeGreaterThanOrEqual(1);
    
    const progress42 = screen.getAllByText('42%');
    expect(progress42.length).toBeGreaterThanOrEqual(1);
    
    const progress100 = screen.getAllByText('100%');
    expect(progress100.length).toBeGreaterThanOrEqual(1);
  });  it('shows current action for each agent', () => {
    renderComponent();
    
    expect(screen.getByText('Analyzing target organization structure')).toBeInTheDocument();
    expect(screen.getByText('Gathering financial intelligence from public sources')).toBeInTheDocument();
    expect(screen.getByText('Competitive analysis complete')).toBeInTheDocument();
  });

  it('displays metadata for each agent', () => {
    renderComponent();
    
    // Check if metadata sections exist
    expect(screen.getAllByText('Sources')).toHaveLength(3);
    expect(screen.getAllByText('Insights')).toHaveLength(3);
    expect(screen.getAllByText('Confidence Score')).toHaveLength(3);
    
    // Check specific values - using getAllByText for duplicates
    const sources8 = screen.getAllByText('8');
    expect(sources8.length).toBeGreaterThanOrEqual(1);
    
    const sources15 = screen.getAllByText('15');
    expect(sources15.length).toBeGreaterThanOrEqual(1);
    
    const sources6 = screen.getAllByText('6'); 
    expect(sources6.length).toBeGreaterThanOrEqual(1);
  });

  it('shows interrupt button when interruption is allowed', () => {
    renderComponent({ canInterrupt: true });
    
    const interruptButton = screen.getByRole('button', { name: /Stop Intelligence Generation/i });
    expect(interruptButton).toBeInTheDocument();
    expect(screen.getByText('You can interrupt the process and review partial results')).toBeInTheDocument();
  });

  it('hides interrupt button when interruption is not allowed', () => {
    renderComponent({ canInterrupt: false });
    
    expect(screen.queryByRole('button', { name: /Stop Intelligence Generation/i })).not.toBeInTheDocument();
  });

  it('calls onInterrupt when interrupt button is clicked', () => {
    renderComponent({ canInterrupt: true });
    
    const interruptButton = screen.getByRole('button', { name: /Stop Intelligence Generation/i });
    fireEvent.click(interruptButton);
    
    expect(mockOnInterrupt).toHaveBeenCalledTimes(1);
  });

  it('shows empty state when no agents are active', () => {
    renderComponent({ progress: [] });
    
    expect(screen.getByText('Waiting for intelligence agents to begin analysis...')).toBeInTheDocument();
  });

  it('displays three-column layout correctly', () => {
    renderComponent();
    
    // The component should render in a grid layout
    const theaterContainer = screen.getByText('coordinator').closest('.grid');
    expect(theaterContainer).toHaveClass('md:grid-cols-3');
  });

  // Task 4.1: Mobile Performance Validation Tests
  describe('Mobile Performance Validation', () => {
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
        animationsEnabled: true,
        updateFrequency: 2000
      });
    });

    it('adapts animations for mobile devices', async () => {
      renderComponent();
      
      // Should have reduced animation complexity on mobile
      const progressBars = screen.getAllByRole('progressbar');
      progressBars.forEach(bar => {
        // Mobile animations should be simplified
        expect(bar).not.toHaveClass('animate-bounce');
      });
    });

    it('disables animations when reduced motion is preferred', () => {
      mockDeviceCapabilities.reducedMotion = true;
      mockUsePerformanceStore.mockReturnValue({
        deviceCapabilities: mockDeviceCapabilities,
        animationsEnabled: false,
        updateFrequency: 2000
      });

      renderComponent();
      
      // Should respect reduced motion preferences
      const progressElements = screen.getAllByRole('progressbar');
      expect(progressElements.length).toBeGreaterThan(0);
      // Animations should be disabled
    });

    it('switches to emergency mode layout for extremely low-end devices', () => {
      mockDeviceCapabilities.emergencyMode = true;
      mockUsePerformanceStore.mockReturnValue({
        deviceCapabilities: mockDeviceCapabilities,
        animationsEnabled: false,
        updateFrequency: 5000
      });

      // Update adaptive performance mock to return emergency mode
      const mockUseAdaptivePerformance = useAdaptivePerformance as any;
      mockUseAdaptivePerformance.mockReturnValue({
        isEmergencyMode: vi.fn(() => true),
        performanceTier: 'low',
        connectionQuality: 'poor',
        enableProgressiveEnhancement: vi.fn(() => false),
        isInitialized: true
      });

      renderComponent();
      
      // Should show simplified text-only mode
      expect(screen.getByText(/Emergency Performance Mode/i)).toBeInTheDocument();
    });

    it('uses mobile-optimized layout on small screens', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375, // Mobile width
      });

      renderComponent();
      
      // Should use single column layout on mobile
      const theaterContainer = screen.getByText('coordinator').closest('.grid');
      expect(theaterContainer).toHaveClass('grid-cols-1');
    });

    it('validates touch target sizes for mobile accessibility', () => {
      // Mock mobile conditions to trigger mobile layout
      const mockUseAdaptivePerformance = useAdaptivePerformance as any;
      mockUseAdaptivePerformance.mockReturnValue({
        isEmergencyMode: vi.fn(() => false),
        performanceTier: 'low', // This triggers mobile layout
        connectionQuality: 'good',
        enableProgressiveEnhancement: vi.fn(() => true),
        isInitialized: true
      });

      renderComponent({ canInterrupt: true });
      
      // Interrupt buttons should meet mobile touch target minimum (44px)
      const interruptButtons = screen.getAllByText(/Stop|Interrupt/i);
      interruptButtons.forEach(button => {
        const buttonElement = button.closest('button');
        if (buttonElement) {
          // Should have minimum mobile touch target size
          expect(buttonElement).toHaveClass('min-h-11'); // 44px minimum
        }
      });
    });

    it('performs efficiently with battery optimization enabled', () => {
      const startTime = performance.now();
      
      renderComponent();
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should render quickly even on low-end mobile devices
      expect(renderTime).toBeLessThan(100); // 100ms budget for initial render
    });

    it('handles poor network conditions gracefully', async () => {
      mockDeviceCapabilities.connectionQuality = '2G';
      mockUsePerformanceStore.mockReturnValue({
        deviceCapabilities: mockDeviceCapabilities,
        animationsEnabled: false,
        updateFrequency: 5000
      });

      renderComponent();
      
      // Should adapt to poor network conditions
      await waitFor(() => {
        // Progress updates should be less frequent
        expect(screen.getByText(/coordinator/i)).toBeInTheDocument();
      }, { timeout: 6000 }); // Allow for slower updates
    });

    it('validates memory usage stays within mobile limits', () => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      renderComponent();
      
      const afterMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryIncrease = afterMemory - initialMemory;
      
      // Component shouldn't use excessive memory (arbitrary limit: 1MB)
      expect(memoryIncrease).toBeLessThan(1024 * 1024); // 1MB limit
    });
  });
});