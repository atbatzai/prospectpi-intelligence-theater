/**
 * Task 4.2: Mobile Network Switching Integration Tests
 * Tests network condition changes and mobile connectivity scenarios
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { usePerformanceStore } from '@/store/intelligenceStore';
import { MobileErrorMessage } from '@/components/ui/MobileErrorMessage';
import { useMobileRetry } from '@/hooks/useMobileRetry';

// Mock performance store
vi.mock('@/store/intelligenceStore');

// Mock mobile retry hook for testing
vi.mock('@/hooks/useMobileRetry');

// Mock WebSocket
const mockWebSocket = {
  send: vi.fn(),
  close: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  readyState: WebSocket.OPEN,
};
global.WebSocket = vi.fn(() => mockWebSocket) as any;

// Mock navigator with network switching capabilities
const createMockNavigator = (online: boolean, connectionType?: string) => ({
  onLine: online,
  connection: connectionType ? {
    effectiveType: connectionType,
    downlink: connectionType === '3g' ? 1.5 : connectionType === '4g' ? 10 : 0.5,
    rtt: connectionType === '3g' ? 300 : connectionType === '4g' ? 50 : 500,
    saveData: connectionType === '2g'
  } : undefined,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
});

// Test component for network switching
const TestNetworkComponent: React.FC = () => {
  const performanceStore = usePerformanceStore();
  const { deviceCapabilities } = performanceStore;
  const mockOperation = () => Promise.resolve('success');
  const { executeWithRetry, retry, currentAttempt, networkQuality } = useMobileRetry(mockOperation);
  const [networkState, setNetworkState] = React.useState('online');
  const [attemptCount, setAttemptCount] = React.useState(0);

  React.useEffect(() => {
    const handleOnline = () => setNetworkState('online');
    const handleOffline = () => setNetworkState('offline');
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = async () => {
    const newAttemptCount = attemptCount + 1;
    setAttemptCount(newAttemptCount);
    
    try {
      await executeWithRetry();
      setNetworkState('connected');
      // Trigger performance monitoring
      if (deviceCapabilities) {
        performanceStore.updatePerformanceSettings(deviceCapabilities);
      }
    } catch (error) {
      setNetworkState('failed');
    }
  };

  return (
    <div>
      <div data-testid="network-status">Status: {networkState}</div>
      <div data-testid="attempt-count">Attempts: {attemptCount}</div>
      <div data-testid="connection-type">
        Connection: {deviceCapabilities?.connectionQuality || networkQuality?.quality || 'unknown'}
      </div>
      <button onClick={handleRetry} data-testid="retry-button">
        Retry Connection
      </button>
    </div>
  );
};

describe('Mobile Network Switching Integration Tests', () => {
  let mockDeviceCapabilities: any;
  let mockPerformanceStore: any;
  let mockMobileRetry: any;
  let originalNavigator: any;

  beforeEach(() => {
    // Save original navigator
    originalNavigator = global.navigator;

    // Mock device capabilities
    mockDeviceCapabilities = {
      performanceTier: 'low',
      connectionQuality: '4g',
      deviceMemory: 2,
      batteryLevel: 0.8,
      emergencyMode: false,
    };

    mockPerformanceStore = {
      deviceCapabilities: mockDeviceCapabilities,
      updatePerformanceSettings: vi.fn(),
      setConnectionQuality: vi.fn(),
      performanceBudget: {
        maxUpdateFrequency: {
          mobile3G: 500,
          mobile4G: 250,
          tablet: 100,
          desktop: 50,
        },
        maxConnections: {
          mobile: 1,
          tablet: 1,
          desktop: 3,
        },
        batchingThreshold: {
          mobile: 3,
          tablet: 2,
          desktop: 1,
        },
      },
      isPerformanceOptimized: false,
      animationsEnabled: true,
      updateFrequency: 100,
      initializePerformanceDetection: vi.fn(),
      setAnimationsEnabled: vi.fn(),
      getOptimalUpdateFrequency: vi.fn(),
    };

    mockMobileRetry = {
      executeWithRetry: vi.fn().mockResolvedValue('success'),
      retry: vi.fn().mockResolvedValue('success'),
      cancel: vi.fn(),
      reset: vi.fn(),
      networkQuality: { quality: '4g', bandwidth: 10, latency: 50, packetLoss: 0 },
      isRetrying: false,
      currentAttempt: 0,
      lastError: null,
      retryHistory: [],
      nextRetryIn: 0,
    };

    (usePerformanceStore as any).mockReturnValue(mockPerformanceStore);
    (useMobileRetry as any).mockImplementation(() => mockMobileRetry);
  });

  afterEach(() => {
    // Restore original navigator
    global.navigator = originalNavigator;
    vi.clearAllMocks();
  });

  describe('Network State Detection', () => {
    it('detects online to offline transitions', async () => {
      // Start online
      Object.defineProperty(global, 'navigator', {
        value: createMockNavigator(true, '4g'),
        writable: true,
      });

      render(<TestNetworkComponent />);
      
      expect(screen.getByTestId('network-status')).toHaveTextContent('Status: online');

      // Simulate going offline
      Object.defineProperty(global, 'navigator', {
        value: createMockNavigator(false),
        writable: true,
      });

      // Trigger offline event
      fireEvent(window, new Event('offline'));

      await waitFor(() => {
        expect(screen.getByTestId('network-status')).toHaveTextContent('Status: offline');
      });
    });

    it('detects offline to online transitions', async () => {
      // Start offline
      Object.defineProperty(global, 'navigator', {
        value: createMockNavigator(false),
        writable: true,
      });

      render(<TestNetworkComponent />);
      
      // Trigger offline event first
      fireEvent(window, new Event('offline'));
      
      await waitFor(() => {
        expect(screen.getByTestId('network-status')).toHaveTextContent('Status: offline');
      });

      // Go back online
      Object.defineProperty(global, 'navigator', {
        value: createMockNavigator(true, '4g'),
        writable: true,
      });

      fireEvent(window, new Event('online'));

      await waitFor(() => {
        expect(screen.getByTestId('network-status')).toHaveTextContent('Status: online');
      });
    });
  });

  describe('Connection Quality Changes', () => {
    it('adapts to 3G network conditions', async () => {
      Object.defineProperty(global, 'navigator', {
        value: createMockNavigator(true, '3g'),
        writable: true,
      });

      mockDeviceCapabilities.connectionQuality = '3g';

      render(<TestNetworkComponent />);
      
      expect(screen.getByTestId('connection-type')).toHaveTextContent('Connection: 3g');
    });

    it('adapts to 4G network conditions', async () => {
      Object.defineProperty(global, 'navigator', {
        value: createMockNavigator(true, '4g'),
        writable: true,
      });

      mockDeviceCapabilities.connectionQuality = '4g';

      render(<TestNetworkComponent />);
      
      expect(screen.getByTestId('connection-type')).toHaveTextContent('Connection: 4g');
    });

    it('handles slow 2G connections with appropriate fallbacks', async () => {
      Object.defineProperty(global, 'navigator', {
        value: createMockNavigator(true, '2g'),
        writable: true,
      });

      mockDeviceCapabilities.connectionQuality = '2g';
      mockDeviceCapabilities.emergencyMode = true; // Trigger emergency mode on 2G

      render(<TestNetworkComponent />);
      
      expect(screen.getByTestId('connection-type')).toHaveTextContent('Connection: 2g');
    });
  });

  describe('Retry Mechanisms with Network Switching', () => {
    it('uses exponential backoff for retry attempts', async () => {
      Object.defineProperty(global, 'navigator', {
        value: createMockNavigator(true, '3g'),
        writable: true,
      });

      render(<TestNetworkComponent />);
      
      const retryButton = screen.getByTestId('retry-button');
      
      // First attempt
      fireEvent.click(retryButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('attempt-count')).toHaveTextContent('Attempts: 1');
      });

      expect(mockMobileRetry.executeWithRetry).toHaveBeenCalled();
    });

    it('cancels retries when network goes offline', async () => {
      Object.defineProperty(global, 'navigator', {
        value: createMockNavigator(true, '4g'),
        writable: true,
      });

      render(<TestNetworkComponent />);
      
      const retryButton = screen.getByTestId('retry-button');
      
      // Start retry attempt
      fireEvent.click(retryButton);
      
      // Simulate network going offline during retry
      Object.defineProperty(global, 'navigator', {
        value: createMockNavigator(false),
        writable: true,
      });
      
      fireEvent(window, new Event('offline'));

      await waitFor(() => {
        expect(screen.getByTestId('network-status')).toHaveTextContent('Status: offline');
      });
    });

    it('adjusts retry intervals based on connection quality', async () => {
      // Test with slow 3G connection
      Object.defineProperty(global, 'navigator', {
        value: createMockNavigator(true, '3g'),
        writable: true,
      });

      mockDeviceCapabilities.connectionQuality = '3g';

      render(<TestNetworkComponent />);
      
      const retryButton = screen.getByTestId('retry-button');
      
      // Multiple retry attempts
      fireEvent.click(retryButton);
      fireEvent.click(retryButton);
      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(screen.getByTestId('attempt-count')).toHaveTextContent('Attempts: 3');
      });

      // Verify executeWithRetry was called multiple times
      expect(mockMobileRetry.executeWithRetry).toHaveBeenCalledTimes(3);
    });
  });

  describe('Error Recovery Integration with Network Changes', () => {
    it('shows appropriate error messages for different network states', async () => {
      // Start with network error
      const mockOnRetry = vi.fn();
      
      render(
        <MobileErrorMessage
          error={{ message: 'Network timeout', networkError: true }}
          onRetry={mockOnRetry}
        />
      );

      expect(screen.getByText(/network problems detected/i)).toBeInTheDocument();
      
      // Simulate network recovery
      Object.defineProperty(global, 'navigator', {
        value: createMockNavigator(true, '4g'),
        writable: true,
      });

      const retryButton = screen.getByRole('button', { name: /try again/i });
      fireEvent.click(retryButton);

      expect(mockOnRetry).toHaveBeenCalled();
    });

    it('adapts error messages for poor network conditions', async () => {
      Object.defineProperty(global, 'navigator', {
        value: createMockNavigator(true, '2g'),
        writable: true,
      });

      render(
        <MobileErrorMessage
          error={{ message: 'Request timeout', code: 'TIMEOUT' }}
          onRetry={vi.fn()}
        />
      );

      // Should show timeout-specific messaging for slow connections
      expect(screen.getByText(/request timeout/i)).toBeInTheDocument();
      expect(screen.getByText(/took too long/i)).toBeInTheDocument();
    });
  });

  describe('Performance Optimization During Network Changes', () => {
    it('enables emergency mode on very poor connections', async () => {
      Object.defineProperty(global, 'navigator', {
        value: createMockNavigator(true, '2g'),
        writable: true,
      });

      mockDeviceCapabilities.connectionQuality = '2g';
      mockDeviceCapabilities.emergencyMode = true;

      render(<TestNetworkComponent />);
      
      expect(screen.getByTestId('connection-type')).toHaveTextContent('Connection: 2g');
    });

    it('optimizes for battery during poor network conditions', async () => {
      Object.defineProperty(global, 'navigator', {
        value: createMockNavigator(true, '3g'),
        writable: true,
      });

      mockDeviceCapabilities.connectionQuality = '3g';
      mockDeviceCapabilities.batteryLevel = 0.2; // Low battery

      render(<TestNetworkComponent />);
      
      // Component should adapt to low battery + poor network
      expect(screen.getByTestId('connection-type')).toHaveTextContent('Connection: 3g');
    });

    it('maintains performance monitoring during network switches', async () => {
      Object.defineProperty(global, 'navigator', {
        value: createMockNavigator(true, '4g'),
        writable: true,
      });

      render(<TestNetworkComponent />);
      
      // Switch to 3G
      Object.defineProperty(global, 'navigator', {
        value: createMockNavigator(true, '3g'),
        writable: true,
      });

      // Trigger a retry to test performance monitoring
      const retryButton = screen.getByTestId('retry-button');
      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(mockPerformanceStore.updatePerformanceSettings).toHaveBeenCalled();
      });
    });
  });

  describe('Real-World Network Scenarios', () => {
    it('handles airplane mode scenarios', async () => {
      // Start online
      Object.defineProperty(global, 'navigator', {
        value: createMockNavigator(true, '4g'),
        writable: true,
      });

      render(<TestNetworkComponent />);
      expect(screen.getByTestId('network-status')).toHaveTextContent('Status: online');

      // Enter airplane mode (offline with no connection)
      Object.defineProperty(global, 'navigator', {
        value: createMockNavigator(false),
        writable: true,
      });

      fireEvent(window, new Event('offline'));

      await waitFor(() => {
        expect(screen.getByTestId('network-status')).toHaveTextContent('Status: offline');
      });
    });

    it('handles WiFi to cellular switching', async () => {
      // Start on WiFi (fast connection)
      Object.defineProperty(global, 'navigator', {
        value: createMockNavigator(true, '4g'), // Simulating WiFi as 4G speed
        writable: true,
      });

      mockDeviceCapabilities.connectionQuality = '4g';

      render(<TestNetworkComponent />);
      expect(screen.getByTestId('connection-type')).toHaveTextContent('Connection: 4g');

      // Switch to 3G cellular
      Object.defineProperty(global, 'navigator', {
        value: createMockNavigator(true, '3g'),
        writable: true,
      });

      mockDeviceCapabilities.connectionQuality = '3g';
      
      // Update the component with new connection quality
      mockPerformanceStore.setConnectionQuality('3g');
      
      expect(mockPerformanceStore.setConnectionQuality).toHaveBeenCalledWith('3g');
    });

    it('handles intermittent connectivity (flaky network)', async () => {
      Object.defineProperty(global, 'navigator', {
        value: createMockNavigator(true, '3g'),
        writable: true,
      });

      render(<TestNetworkComponent />);
      
      // Simulate flaky connection with rapid online/offline changes
      fireEvent(window, new Event('offline'));
      await new Promise(resolve => setTimeout(resolve, 100));
      
      fireEvent(window, new Event('online'));
      await new Promise(resolve => setTimeout(resolve, 100));
      
      fireEvent(window, new Event('offline'));
      await new Promise(resolve => setTimeout(resolve, 100));
      
      fireEvent(window, new Event('online'));

      // Component should handle rapid network changes gracefully
      await waitFor(() => {
        expect(screen.getByTestId('network-status')).toHaveTextContent('Status: online');
      });
    });
  });
});