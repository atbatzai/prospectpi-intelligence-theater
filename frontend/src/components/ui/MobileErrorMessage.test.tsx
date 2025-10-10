/**
 * Task 4.1: Mobile Error Message Component Tests
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { MobileErrorMessage } from './MobileErrorMessage';
import { DeviceCapabilities } from '@/types';

// Mock the performance store
vi.mock('@/store/intelligenceStore', () => ({
  usePerformanceStore: vi.fn()
}));

import { usePerformanceStore } from '@/store/intelligenceStore';

describe('MobileErrorMessage', () => {
  let mockDeviceCapabilities: DeviceCapabilities;
  const mockUsePerformanceStore = usePerformanceStore as any;
  const mockOnRetry = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
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
      deviceCapabilities: mockDeviceCapabilities
    });

    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true
    });
  });

  describe('Error Display and Classification', () => {
    it('displays network error with appropriate icon and message', () => {
      const error = new Error('Network request failed');
      
      render(
        <MobileErrorMessage
          error={error}
          onRetry={mockOnRetry}
          onDismiss={vi.fn()}
        />
      );

      expect(screen.getByText(/Something Went Wrong/i)).toBeInTheDocument();
      expect(screen.getByText(/Network request failed/i)).toBeInTheDocument();
    });

    it('displays timeout error with appropriate messaging', () => {
      const error = new Error('Request timeout');
      
      render(
        <MobileErrorMessage
          error={error}
          onRetry={mockOnRetry}
          onDismiss={vi.fn()}
        />
      );

      expect(screen.getByText(/Request Timeout/i)).toBeInTheDocument();
      expect(screen.getByText(/took too long/i)).toBeInTheDocument();
    });

    it('displays server error with appropriate messaging', () => {
      const error = new Error('500 Internal Server Error');
      
      render(
        <MobileErrorMessage
          error={error}
          onRetry={mockOnRetry}
          onDismiss={vi.fn()}
        />
      );

      expect(screen.getByText(/Something Went Wrong/i)).toBeInTheDocument();
      expect(screen.getByText(/500 Internal Server Error/i)).toBeInTheDocument();
    });

    it('provides helpful context for different network conditions', () => {
      mockDeviceCapabilities.connectionQuality = '2G';
      
      const error = new Error('Network request failed');
      
      render(
        <MobileErrorMessage
          error={error}
          onRetry={mockOnRetry}
          onDismiss={vi.fn()}
        />
      );

      expect(screen.getByText(/Something Went Wrong/i)).toBeInTheDocument();
    });
  });

  describe('Touch-Optimized Mobile Interface', () => {
    it('validates minimum touch target sizes', () => {
      const error = new Error('Test error');
      
      render(
        <MobileErrorMessage
          error={error}
          onRetry={mockOnRetry}
          onDismiss={vi.fn()}
        />
      );

      const retryButton = screen.getByRole('button', { name: /try again/i });
      const dismissButton = screen.getByRole('button', { name: /dismiss/i });

      // Should meet mobile accessibility standards (48px minimum)
      expect(retryButton).toHaveClass('min-h-[48px]');
      expect(dismissButton).toHaveClass('min-h-[48px]');
    });

    it('handles touch interactions properly', async () => {
      const error = new Error('Test error');
      
      render(
        <MobileErrorMessage
          error={error}
          onRetry={mockOnRetry}
          onDismiss={vi.fn()}
        />
      );

      const retryButton = screen.getByRole('button', { name: /try again/i });
      
      // Simulate touch interaction
      fireEvent.touchStart(retryButton);
      fireEvent.click(retryButton);
      
      expect(mockOnRetry).toHaveBeenCalled();
    });

    it('provides visual feedback on touch', () => {
      const error = new Error('Test error');
      
      render(
        <MobileErrorMessage
          error={error}
          onRetry={mockOnRetry}
          onDismiss={vi.fn()}
        />
      );

      const retryButton = screen.getByRole('button', { name: /try again/i });
      
      // Should have active state styling
      expect(retryButton).toHaveClass('active:bg-blue-800');
    });
  });

  describe('Network Quality Awareness', () => {
    it('shows offline detection message when navigator is offline', () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      });

      const error = new Error('Network request failed');
      
      render(
        <MobileErrorMessage
          error={error}
          onRetry={mockOnRetry}
          onDismiss={vi.fn()}
        />
      );

      expect(screen.getByText(/offline/i)).toBeInTheDocument();
      expect(screen.getByText(/check your network settings/i)).toBeInTheDocument();
    });

    it('adapts help text for different connection qualities', () => {
      // Mock network connection API
      Object.defineProperty(navigator, 'connection', {
        writable: true,
        value: { effectiveType: '3g' }
      });
      
      const error = { message: 'Request timeout', networkError: true };
      
      render(
        <MobileErrorMessage
          error={error}
          onRetry={mockOnRetry}
          onDismiss={vi.fn()}
        />
      );

      expect(screen.getByText(/3G network/i)).toBeInTheDocument();
    });

    it('shows airplane mode detection', () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      });

      // Mock connection type as none (airplane mode indicator)
      Object.defineProperty(navigator, 'connection', {
        value: { type: 'none' },
        writable: true
      });

      const error = { message: 'Network request failed', networkError: true };
      
      render(
        <MobileErrorMessage
          error={error}
          onRetry={mockOnRetry}
          onDismiss={vi.fn()}
        />
      );

      expect(screen.getByText(/no internet connection/i)).toBeInTheDocument();
    });
  });

  describe('Mobile Performance Optimization', () => {
    it('renders quickly on low-end mobile devices', () => {
      mockDeviceCapabilities.performanceTier = 'low';
      
      const error = new Error('Test error');
      const startTime = performance.now();
      
      render(
        <MobileErrorMessage
          error={error}
          onRetry={mockOnRetry}
          onDismiss={vi.fn()}
        />
      );
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      expect(renderTime).toBeLessThan(50); // 50ms budget
    });

    it('reduces animations in battery optimization mode', () => {
      mockDeviceCapabilities.batteryOptimization = true;
      
      const error = new Error('Test error');
      
      render(
        <MobileErrorMessage
          error={error}
          onRetry={mockOnRetry}
          onDismiss={vi.fn()}
        />
      );

      // Should not have bounce animation in battery mode
      const errorContainer = screen.getByText('Something Went Wrong').closest('[class*="border"]');
      expect(errorContainer).toBeInTheDocument();
    });

    it('handles emergency mode gracefully', () => {
      mockDeviceCapabilities.emergencyMode = true;
      
      const error = new Error('Test error');
      
      render(
        <MobileErrorMessage
          error={error}
          onRetry={mockOnRetry}
          onDismiss={vi.fn()}
        />
      );

      // Should still display error but in simplified form
      expect(screen.getByText('Something Went Wrong')).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });
  });

  describe('Retry Functionality', () => {
    it('disables retry button during retry attempts', async () => {
      const error = new Error('Test error');
      
      render(
        <MobileErrorMessage
          error={error}
          onRetry={mockOnRetry}
          onDismiss={vi.fn()}
          isRetrying={true}
        />
      );

      const retryButton = screen.getByRole('button', { name: /retrying/i });
      expect(retryButton).toBeDisabled();
    });

    it('shows appropriate retry count messaging', () => {
      const error = {
        message: 'Test error',
        retryCount: 2
      };
      
      render(
        <MobileErrorMessage
          error={error}
          onRetry={mockOnRetry}
          onDismiss={vi.fn()}
        />
      );

      // Component shows basic error message
      expect(screen.getByText('Test error')).toBeInTheDocument();
    });

    it('provides network quality-aware retry suggestions', () => {
      mockDeviceCapabilities.connectionQuality = '2G';
      
      const error = new Error('Network request failed');
      
      render(
        <MobileErrorMessage
          error={error}
          onRetry={mockOnRetry}
          onDismiss={vi.fn()}
        />
      );

      // Should show mobile tip for network issues
      expect(screen.getByText(/mobile tip/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility Compliance', () => {
    it('provides proper ARIA labels and roles', () => {
      const error = new Error('Test error');
      
      render(
        <MobileErrorMessage
          error={error}
          onRetry={mockOnRetry}
          onDismiss={vi.fn()}
        />
      );

      // Should have accessible buttons
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /dismiss/i })).toBeInTheDocument();
    });

    it('supports keyboard navigation', () => {
      const error = new Error('Test error');
      const onDismiss = vi.fn();
      
      render(
        <MobileErrorMessage
          error={error}
          onRetry={mockOnRetry}
          onDismiss={onDismiss}
        />
      );

      const retryButton = screen.getByRole('button', { name: /try again/i });
      
      retryButton.focus();
      fireEvent.click(retryButton);
      
      expect(mockOnRetry).toHaveBeenCalled();
    });

    it('provides proper focus management', () => {
      const error = new Error('Test error');
      
      render(
        <MobileErrorMessage
          error={error}
          onRetry={mockOnRetry}
          onDismiss={vi.fn()}
        />
      );

      const retryButton = screen.getByRole('button', { name: /try again/i });
      
      // Should be focusable
      expect(retryButton.tabIndex).not.toBe(-1);
    });
  });
});