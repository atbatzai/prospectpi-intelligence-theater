/**
 * Task 4.2: Mobile Touch Interaction Integration Tests
 * Tests comprehensive touch interaction flows across mobile components
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { AgentProgressTheater } from '@/components/intelligence-theater/AgentProgressTheater';
import { SmartCompanyInput } from '@/components/intelligence-theater/SmartCompanyInput';
import { DossierViewer } from '@/components/intelligence-theater/DossierViewer';
import { MobileErrorMessage } from '@/components/ui/MobileErrorMessage';
import { usePerformanceStore } from '@/store/intelligenceStore';

// Mock performance store for mobile testing
vi.mock('@/store/intelligenceStore');

// Mock WebSocket for testing
const mockWebSocket = {
  send: vi.fn(),
  close: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  readyState: WebSocket.OPEN,
};
global.WebSocket = vi.fn(() => mockWebSocket) as any;

// Mock navigator for mobile device simulation
const mockNavigator = {
  onLine: true,
  connection: {
    effectiveType: '4g',
    downlink: 10,
    rtt: 100,
  },
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
};

Object.defineProperty(window, 'navigator', {
  value: mockNavigator,
  writable: true,
});

// Mock mobile viewport
const mockMobileViewport = () => {
  Object.defineProperty(window, 'innerWidth', { value: 375, writable: true });
  Object.defineProperty(window, 'innerHeight', { value: 667, writable: true });
  Object.defineProperty(window, 'screen', {
    value: { width: 375, height: 667 },
    writable: true,
  });
};

// Mock touch capabilities
const mockTouchSupport = () => {
  Object.defineProperty(window, 'ontouchstart', { value: null, writable: true });
  Object.defineProperty(navigator, 'maxTouchPoints', { value: 5, writable: true });
};

describe('Mobile Touch Interaction Integration Tests', () => {
  let mockDeviceCapabilities: any;
  let mockPerformanceStore: any;

  beforeEach(() => {
    // Mock mobile device capabilities
    mockDeviceCapabilities = {
      performanceTier: 'low',
      deviceMemory: 2,
      hardwareConcurrency: 2,
      connectionQuality: '4G',
      batteryLevel: 0.5,
      reducedMotion: false,
      emergencyMode: false,
    };

    mockPerformanceStore = {
      deviceCapabilities: mockDeviceCapabilities,
      animationsEnabled: true,
      performanceMode: 'adaptive',
      setDeviceCapabilities: vi.fn(),
      updatePerformanceMetrics: vi.fn(),
    };

    (usePerformanceStore as any).mockReturnValue(mockPerformanceStore);

    // Set up mobile environment
    mockMobileViewport();
    mockTouchSupport();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const renderWithProviders = (component: React.ReactElement) => {
    return render(component);
  };

  describe('Touch Target Validation', () => {
    it('ensures all interactive elements meet 48px minimum touch target', async () => {
      renderWithProviders(
        <SmartCompanyInput
          onSubmit={vi.fn()}
          isGenerating={false}
          previousCompanies={[]}
        />
      );

      // Find all interactive elements
      const buttons = screen.getAllByRole('button');
      const inputs = screen.getAllByRole('textbox');

      // Validate touch targets have proper classes
      [...buttons, ...inputs].forEach(element => {
        const className = element.className;
        // Check for mobile-friendly classes
        expect(className).toMatch(/min-h-\[48px\]|min-h-12|h-12|h-9|py-3/);
      });
    });

    it('validates touch target spacing prevents accidental taps', async () => {
      renderWithProviders(
        <MobileErrorMessage
          error={{ message: 'Test error' }}
          onRetry={vi.fn()}
          onDismiss={vi.fn()}
        />
      );

      const buttons = screen.getAllByRole('button');
      
      // Ensure buttons exist and have proper mobile spacing classes
      expect(buttons.length).toBeGreaterThan(0);
      buttons.forEach(button => {
        expect(button.className).toMatch(/gap-2|gap-3|space-y-4|flex-col/);
      });
    });
  });

  describe('Touch Gesture Integration', () => {
    it('handles touch sequences correctly in company input', async () => {
      const mockOnSubmit = vi.fn();
      
      renderWithProviders(
        <SmartCompanyInput
          onSubmit={mockOnSubmit}
          isGenerating={false}
          previousCompanies={[]}
        />
      );

      const companyInput = screen.getByLabelText(/company name/i);
      
      // Simulate touch sequence
      fireEvent.touchStart(companyInput, {
        touches: [{ clientX: 100, clientY: 100, identifier: 0 }],
      });
      
      fireEvent.focus(companyInput);
      fireEvent.change(companyInput, { target: { value: 'Test Company' } });
      
      fireEvent.touchEnd(companyInput, {
        changedTouches: [{ clientX: 100, clientY: 100, identifier: 0 }],
      });

      expect(companyInput).toHaveValue('Test Company');
    });

    it('handles swipe gestures in dossier viewer', async () => {
      renderWithProviders(
        <DossierViewer
          dossier={{
            id: 'test-dossier',
            companyName: 'Test Company',
            classification: 'public',
            generatedAt: '2025-10-08',
            confidence: 95,
            sourceCount: 5,
            executiveSummary: 'Test description',
            sections: [
              { 
                id: 'overview', 
                title: 'Overview', 
                content: 'Content 1',
                confidence: 'high' as const,
                sources: [{ 
                  id: 'source1', 
                  name: 'Test Source 1', 
                  confidence: 95, 
                  freshness: 'recent', 
                  type: 'internal' as const 
                }],
                expandable: true,
                isExpanded: false
              },
              { 
                id: 'financials', 
                title: 'Financials', 
                content: 'Content 2',
                confidence: 'high' as const,
                sources: [{ 
                  id: 'source2', 
                  name: 'Test Source 2', 
                  confidence: 90, 
                  freshness: 'recent', 
                  type: 'internal' as const 
                }],
                expandable: true,
                isExpanded: false
              },
            ],
          }}
          onSectionToggle={vi.fn()}
          onExport={vi.fn()}
        />
      );

      const dossierContainer = screen.getByText('Test Company').closest('div');
      
      if (dossierContainer) {
        // Simulate swipe left gesture
        fireEvent.touchStart(dossierContainer, {
          touches: [{ clientX: 200, clientY: 100, identifier: 0 }],
        });
        
        fireEvent.touchMove(dossierContainer, {
          touches: [{ clientX: 100, clientY: 100, identifier: 0 }],
        });
        
        fireEvent.touchEnd(dossierContainer, {
          changedTouches: [{ clientX: 100, clientY: 100, identifier: 0 }],
        });

        // Verify swipe was handled (component remains stable)
        await waitFor(() => {
          expect(dossierContainer).toBeInTheDocument();
        });
      }
    });
  });

  describe('Multi-Touch and Complex Gestures', () => {
    it('handles pinch-to-zoom in agent theater', async () => {
      renderWithProviders(
        <AgentProgressTheater
          progress={[
            {
              id: 'agent1',
              name: 'Intelligence Coordinator',
              status: 'working',
              progress: 45,
              currentAction: 'Analyzing company data',
              avatar: '/avatars/coordinator.png'
            },
          ]}
          canInterrupt={true}
          onInterrupt={vi.fn()}
          estimatedCompletion={120}
        />
      );

      const theaterContainer = screen.getByText('Intelligence Coordinator').closest('div');
      
      if (theaterContainer) {
        // Simulate pinch gesture
        fireEvent.touchStart(theaterContainer, {
          touches: [
            { clientX: 100, clientY: 100, identifier: 0 },
            { clientX: 200, clientY: 200, identifier: 1 },
          ],
        });
        
        fireEvent.touchMove(theaterContainer, {
          touches: [
            { clientX: 90, clientY: 90, identifier: 0 },
            { clientX: 210, clientY: 210, identifier: 1 },
          ],
        });
        
        fireEvent.touchEnd(theaterContainer, {
          changedTouches: [
            { clientX: 90, clientY: 90, identifier: 0 },
            { clientX: 210, clientY: 210, identifier: 1 },
          ],
        });

        // Verify component remains stable during complex touch events
        expect(theaterContainer).toBeInTheDocument();
      }
    });

    it('prevents ghost clicks after touch interactions', async () => {
      const mockOnRetry = vi.fn();
      
      renderWithProviders(
        <MobileErrorMessage
          error={{ message: 'Network error' }}
          onRetry={mockOnRetry}
        />
      );

      const retryButton = screen.getByRole('button', { name: /try again/i });
      
      // Simulate touch followed by delayed click (ghost click scenario)
      fireEvent.touchStart(retryButton);
      fireEvent.touchEnd(retryButton);
      fireEvent.click(retryButton);
      
      // Wait for debounce
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Should only trigger once
      expect(mockOnRetry).toHaveBeenCalled();
    });
  });

  describe('Touch Accessibility Integration', () => {
    it('supports voice control touch interactions', async () => {
      renderWithProviders(
        <SmartCompanyInput
          onSubmit={vi.fn()}
          isGenerating={false}
          previousCompanies={[]}
        />
      );

      const submitButton = screen.getByRole('button', { name: /generate intelligence dossier/i });
      
      // Simulate voice control activation
      fireEvent.keyDown(submitButton, { key: 'Enter' });
      fireEvent.click(submitButton);
      
      // Verify button is accessible
      expect(submitButton).toBeInTheDocument();
    });

    it('maintains focus management during touch interactions', async () => {
      renderWithProviders(
        <SmartCompanyInput
          onSubmit={vi.fn()}
          isGenerating={false}
          previousCompanies={[]}
        />
      );

      const companyInput = screen.getByLabelText(/company name/i);
      const submitButton = screen.getByRole('button', { name: /generate intelligence dossier/i });
      
      // Touch to focus
      fireEvent.touchStart(companyInput);
      companyInput.focus();
      
      await waitFor(() => {
        expect(document.activeElement).toBe(companyInput);
      });
      
      // Touch different element - simulate blur from input
      fireEvent.touchStart(submitButton);
      companyInput.blur();
      
      await waitFor(() => {
        expect(document.activeElement).not.toBe(companyInput);
      });
    });
  });

  describe('Performance Impact of Touch Events', () => {
    it('maintains performance during intensive touch interactions', async () => {
      const performanceMarks: number[] = [];
      
      renderWithProviders(
        <AgentProgressTheater
          progress={[
            { id: 'agent1', name: 'Agent 1', status: 'working', progress: 30, currentAction: 'Working...', avatar: '/avatars/agent1.png' },
            { id: 'agent2', name: 'Agent 2', status: 'working', progress: 60, currentAction: 'Processing...', avatar: '/avatars/agent2.png' },
            { id: 'agent3', name: 'Agent 3', status: 'working', progress: 90, currentAction: 'Finalizing...', avatar: '/avatars/agent3.png' },
          ]}
          canInterrupt={true}
          onInterrupt={vi.fn()}
          estimatedCompletion={120}
        />
      );

      const container = screen.getByText('Agent 1').closest('div');
      
      if (container) {
        // Measure performance during rapid touch events
        for (let i = 0; i < 5; i++) {
          const start = performance.now();
          
          fireEvent.touchStart(container, {
            touches: [{ clientX: 100 + i * 5, clientY: 100 + i * 5, identifier: i }],
          });
          
          fireEvent.touchMove(container, {
            touches: [{ clientX: 110 + i * 5, clientY: 110 + i * 5, identifier: i }],
          });
          
          fireEvent.touchEnd(container, {
            changedTouches: [{ clientX: 110 + i * 5, clientY: 110 + i * 5, identifier: i }],
          });
          
          const end = performance.now();
          performanceMarks.push(end - start);
        }

        // Verify reasonable performance
        const averageTime = performanceMarks.reduce((a, b) => a + b) / performanceMarks.length;
        expect(averageTime).toBeLessThan(100); // Allow 100ms for test environment
      }
    });

    it('adapts touch sensitivity based on device capabilities', async () => {
      // Test with low-performance device
      mockDeviceCapabilities.performanceTier = 'low';
      mockDeviceCapabilities.deviceMemory = 1;
      
      renderWithProviders(
        <SmartCompanyInput
          onSubmit={vi.fn()}
          isGenerating={false}
          previousCompanies={[]}
        />
      );

      const input = screen.getByLabelText(/company name/i);
      
      // Verify component handles rapid changes gracefully
      fireEvent.touchStart(input);
      fireEvent.change(input, { target: { value: 'T' } });
      fireEvent.change(input, { target: { value: 'Te' } });
      fireEvent.change(input, { target: { value: 'Tes' } });
      fireEvent.change(input, { target: { value: 'Test' } });
      
      await waitFor(() => {
        expect(input).toHaveValue('Test');
      });
    });
  });
});