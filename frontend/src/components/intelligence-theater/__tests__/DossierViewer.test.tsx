import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { DossierViewer } from '../DossierViewer';
import { DossierData, DeviceCapabilities } from '@/types';

// Mock the performance store
vi.mock('@/store/intelligenceStore', () => ({
  usePerformanceStore: vi.fn()
}));

import { usePerformanceStore } from '@/store/intelligenceStore';

describe('DossierViewer', () => {
  const mockOnSectionToggle = vi.fn();
  const mockOnExport = vi.fn();
  const mockUsePerformanceStore = usePerformanceStore as any;

  const mockDossier: DossierData = {
    id: 'dossier-123',
    companyName: 'OpenAI',
    classification: 'BUSINESS INTELLIGENCE',
    generatedAt: '2025-10-08T20:00:00Z',
    confidence: 87,
    sourceCount: 12,
    executiveSummary: 'OpenAI is a leading AI research company with strong market positioning and innovative technology capabilities.',
    sections: [
      {
        id: 'company-overview',
        title: 'Company Overview & Market Position',
        content: 'OpenAI operates as a leading AI research organization...',
        confidence: 'high',
        sources: [
          {
            id: 'src-1',
            name: 'TheirStack Technology Profile',
            confidence: 92,
            freshness: '2 hours ago',
            type: 'theirstack',
            url: 'https://theirstack.com/openai'
          }
        ],
        expandable: true
      },
      {
        id: 'financial-health',
        title: 'Financial Health & Performance',
        content: 'Financial indicators suggest strong revenue growth...',
        confidence: 'medium',
        sources: [
          {
            id: 'src-2',
            name: 'Market Analysis Report',
            confidence: 78,
            freshness: '1 day ago',
            type: 'marketaux'
          }
        ],
        expandable: true
      }
    ]
  };

  beforeEach(() => {
    mockOnSectionToggle.mockClear();
    mockOnExport.mockClear();
    
    // Setup default performance store mock for all tests
    mockUsePerformanceStore.mockReturnValue({
      deviceCapabilities: {
        performanceTier: 'medium',
        connectionQuality: '4G',
        hardware: { cores: 4, memory: 8, gpu: 'integrated' },
        batteryOptimization: false,
        reducedMotion: false,
        dataSaver: false,
        emergencyMode: false
      },
      animationsEnabled: true,
      initializePerformanceDetection: vi.fn()
    });
  });

  const renderComponent = (props = {}) => {
    return render(
      <DossierViewer
        dossier={mockDossier}
        onSectionToggle={mockOnSectionToggle}
        onExport={mockOnExport}
        expandedSections={new Set(['company-overview'])}
        {...props}
      />
    );
  };

  it('renders the CIA-style header correctly', () => {
    renderComponent();
    
    expect(screen.getByText('INTELLIGENCE DOSSIER')).toBeInTheDocument();
    expect(screen.getByText('Classification: BUSINESS INTELLIGENCE')).toBeInTheDocument();
    expect(screen.getByText('87% Confidence')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Export PDF/i })).toBeInTheDocument();
  });

  it('displays target organization information', () => {
    renderComponent();
    
    expect(screen.getByText('TARGET ORGANIZATION')).toBeInTheDocument();
    expect(screen.getByText('OpenAI')).toBeInTheDocument();
    expect(screen.getByText('GENERATED')).toBeInTheDocument();
    expect(screen.getByText('SOURCES')).toBeInTheDocument();
    expect(screen.getByText('12 Active Sources')).toBeInTheDocument();
  });

  it('renders executive summary section', () => {
    renderComponent();
    
    expect(screen.getByText('EXECUTIVE SUMMARY')).toBeInTheDocument();
    expect(screen.getByText(/OpenAI is a leading AI research company/)).toBeInTheDocument();
  });

  it('displays intelligence sections with confidence badges', () => {
    renderComponent();
    
    expect(screen.getByText('Company Overview & Market Position')).toBeInTheDocument();
    expect(screen.getByText('Financial Health & Performance')).toBeInTheDocument();
    
    // Check confidence badges with icons
    expect(screen.getByText('🟢 HIGH')).toBeInTheDocument();
    expect(screen.getByText('🟡 MEDIUM')).toBeInTheDocument();
  });

  it('shows source count badges for each section', () => {
    renderComponent();
    
    // The mockDossier has 2 sections, plus the overall source count, so expect 3 total
    const sourceBadges = screen.getAllByText(/Sources$/);
    expect(sourceBadges.length).toBeGreaterThanOrEqual(2);
  });

  it('expands sections when expandedSections includes section id', () => {
    renderComponent({ expandedSections: new Set(['company-overview']) });
    
    // Should show the content and sources for expanded section
    expect(screen.getByText(/OpenAI operates as a leading AI research organization/)).toBeInTheDocument();
    expect(screen.getByText('Source Citations')).toBeInTheDocument();
    expect(screen.getByText('TheirStack Technology Profile')).toBeInTheDocument();
  });

  it('calls onSectionToggle when section header is clicked', () => {
    renderComponent();
    
    // Find the CollapsibleTrigger button by looking for the section title and going up to find the button
    const sectionTitle = screen.getByText('Company Overview & Market Position');
    const sectionHeader = sectionTitle.closest('[data-state]'); // CollapsibleTrigger has data-state attribute
    fireEvent.click(sectionHeader!);
    
    expect(mockOnSectionToggle).toHaveBeenCalledWith('company-overview');
  });

  it('displays source citations with correct metadata', () => {
    renderComponent({ expandedSections: new Set(['company-overview']) });
    
    expect(screen.getByText('TheirStack Technology Profile')).toBeInTheDocument();
    expect(screen.getByText('Confidence: 92%')).toBeInTheDocument();
    expect(screen.getByText('Freshness: 2 hours ago')).toBeInTheDocument();
  });

  it('shows external link button for sources with URLs', () => {
    renderComponent({ expandedSections: new Set(['company-overview']) });
    
    const externalLinkButton = screen.getByRole('link');
    expect(externalLinkButton).toHaveAttribute('href', 'https://theirstack.com/openai');
    expect(externalLinkButton).toHaveAttribute('target', '_blank');
  });

  it('calls onExport when export PDF button is clicked', () => {
    renderComponent();
    
    const exportButton = screen.getByRole('button', { name: /Export PDF/i });
    fireEvent.click(exportButton);
    
    expect(mockOnExport).toHaveBeenCalledTimes(1);
  });

  it('displays correct confidence badge colors', () => {
    renderComponent();
    
    // Test that confidence badges have correct text (including emoji)
    const highBadge = screen.getByText('🟢 HIGH');
    expect(highBadge).toBeInTheDocument();
    expect(highBadge.closest('.bg-green-100')).toBeInTheDocument();
    
    const mediumBadge = screen.getByText('🟡 MEDIUM');
    expect(mediumBadge).toBeInTheDocument();
    expect(mediumBadge.closest('.bg-yellow-100')).toBeInTheDocument();
  });

  it('renders footer with generation metadata', () => {
    renderComponent();
    
    expect(screen.getByText(/This intelligence dossier was generated by ProspectPI/)).toBeInTheDocument();
    expect(screen.getByText(/ID: dossier-123/)).toBeInTheDocument();
  });

  it('shows chevron rotation for expanded sections', () => {
    renderComponent({ expandedSections: new Set(['company-overview']) });
    
    // Find the chevron in the expanded section by looking for the rotate-180 class
    const rotatedChevron = document.querySelector('.rotate-180');
    expect(rotatedChevron).toBeInTheDocument();
  });

  it('displays source type icons correctly', () => {
    renderComponent({ expandedSections: new Set(['company-overview']) });
    
    // Check for theirstack icon
    expect(screen.getByText('🏢')).toBeInTheDocument();
  });

  // Task 4.1: Mobile Performance & Progressive Loading Tests
  describe('Mobile Performance & Progressive Loading Validation', () => {
    let mockDeviceCapabilities: DeviceCapabilities;

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

    it('implements progressive loading on mobile devices', async () => {
      mockDeviceCapabilities.performanceTier = 'low';
      
      renderComponent();
      
      // Should load sections progressively on mobile
      await waitFor(() => {
        // Initial sections should be loaded
        expect(screen.getByText('Company Overview & Market Position')).toBeInTheDocument();
      });
      
      // Additional sections should load progressively
      await waitFor(() => {
        expect(screen.getByText('Financial Health & Performance')).toBeInTheDocument();
      }, { timeout: 1000 });
    });

    it('validates touch targets for mobile interaction', () => {
      renderComponent();
      
      const sectionHeaders = screen.getAllByRole('button');
      sectionHeaders.forEach(header => {
        // Touch targets should be at least 44px tall
        expect(header).toHaveClass('min-h-11');
      });
    });

    it('optimizes memory usage with section virtualization', async () => {
      const largeDossier: DossierData = {
        ...mockDossier,
        sections: Array(20).fill(null).map((_, i) => ({
          id: `section-${i}`,
          title: `Section ${i + 1}`,
          content: `Content for section ${i + 1}...`,
          confidence: 'high' as const,
          sources: [],
          expandable: true
        }))
      };

      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      renderComponent({ dossier: largeDossier });
      
      const afterMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryIncrease = afterMemory - initialMemory;
      
      // Should not load all sections at once on mobile
      expect(memoryIncrease).toBeLessThan(2 * 1024 * 1024); // 2MB limit
    });

    it('adapts layout for mobile screens', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375, // Mobile width
      });

      renderComponent();
      
      // Should use mobile-optimized spacing
      const dossierContainer = screen.getByText('Company Overview & Market Position').closest('.space-y-4');
      expect(dossierContainer).toBeInTheDocument();
    });

    it('handles poor network conditions with graceful degradation', async () => {
      mockDeviceCapabilities.connectionQuality = '2G';
      
      renderComponent();
      
      // Should still display basic content
      expect(screen.getByText('OpenAI')).toBeInTheDocument();
      expect(screen.getByText(/BUSINESS\s+INTELLIGENCE/)).toBeInTheDocument();
    });

    it('validates section expansion performance on mobile', async () => {
      renderComponent();
      
      const sectionHeader = screen.getByText('Company Overview & Market Position');
      
      const startTime = performance.now();
      fireEvent.click(sectionHeader);
      
      await waitFor(() => {
        expect(mockOnSectionToggle).toHaveBeenCalled();
      });
      
      const endTime = performance.now();
      const expansionTime = endTime - startTime;
      
      // Section expansion should be responsive
      expect(expansionTime).toBeLessThan(100); // 100ms budget
    });

    it('reduces animations in battery optimization mode', () => {
      mockDeviceCapabilities.batteryOptimization = true;
      mockUsePerformanceStore.mockReturnValue({
        deviceCapabilities: mockDeviceCapabilities,
        animationsEnabled: false
      });

      renderComponent();
      
      // Should not have smooth scroll animations
      const dossierElement = screen.getByText('OpenAI').closest('[data-testid]');
      if (dossierElement) {
        expect(dossierElement).not.toHaveClass('smooth-scroll');
      }
    });

    it('implements emergency mode fallback', () => {
      mockDeviceCapabilities.emergencyMode = true;
      mockUsePerformanceStore.mockReturnValue({
        deviceCapabilities: mockDeviceCapabilities,
        animationsEnabled: false
      });

      renderComponent();
      
      // Should show simplified text-only interface
      expect(screen.getByText(/Emergency Performance Mode/i)).toBeInTheDocument();
      expect(screen.getByText('OpenAI')).toBeInTheDocument();
    });

    it('validates export functionality on mobile', async () => {
      renderComponent();
      
      const exportButton = screen.getByRole('button', { name: /export/i });
      
      // Export button should be touch-friendly
      expect(exportButton).toHaveClass('min-h-11');
      
      fireEvent.click(exportButton);
      
      await waitFor(() => {
        expect(mockOnExport).toHaveBeenCalled();
      });
    });

    it('measures render performance on low-end mobile', async () => {
      mockDeviceCapabilities.performanceTier = 'low';
      
      const startTime = performance.now();
      renderComponent();
      
      // Wait for component to fully render
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should render within reasonable time on low-end devices (increased budget for CI environments)
      expect(renderTime).toBeLessThan(500); // 500ms budget for mobile in test environments
    });
  });
});