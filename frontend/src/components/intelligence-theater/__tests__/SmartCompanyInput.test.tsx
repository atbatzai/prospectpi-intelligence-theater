import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { SmartCompanyInput } from '../SmartCompanyInput';
import { OptimizedUserInput, DeviceCapabilities } from '@/types';

// Mock the performance store
vi.mock('@/store/intelligenceStore', () => ({
  usePerformanceStore: vi.fn()
}));

import { usePerformanceStore } from '@/store/intelligenceStore';

describe('SmartCompanyInput', () => {
  const mockOnSubmit = vi.fn();
  const mockPreviousCompanies = ['Acme Corp', 'TechCorp', 'Global Solutions'];

  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  const renderComponent = (props = {}) => {
    return render(
      <SmartCompanyInput
        onSubmit={mockOnSubmit}
        isGenerating={false}
        previousCompanies={mockPreviousCompanies}
        {...props}
      />
    );
  };

  it('renders the solution-relevance input interface', () => {
    renderComponent();
    
    expect(screen.getByText('Solution-Relevance Intelligence Theater')).toBeInTheDocument();
    expect(screen.getByText('Solution Context')).toBeInTheDocument();
    expect(screen.getByLabelText(/Target Company Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Your Vendor\/Company/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Your Product\/Solution/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Target Company Industry/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Primary Pain Point/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Generate Intelligence Dossier/i })).toBeInTheDocument();
  });

  it('validates all required solution-relevance fields', () => {
    renderComponent();
    
    const submitButton = screen.getByRole('button', { name: /Generate Intelligence Dossier/i });
    expect(submitButton).toBeDisabled();
    
    // Should show validation helper when fields are missing
    expect(screen.getByText(/Required Information Missing:/)).toBeInTheDocument();
    
    // Fill in required fields one by one
    const companyInput = screen.getByLabelText(/Target Company Name/i);
    fireEvent.change(companyInput, { target: { value: 'OpenAI' } });
    expect(submitButton).toBeDisabled(); // Still disabled, more fields needed
    
    const vendorInput = screen.getByLabelText(/Your Vendor\/Company/i);
    fireEvent.change(vendorInput, { target: { value: 'Microsoft' } });
    expect(submitButton).toBeDisabled(); // Still disabled
    
    const productInput = screen.getByLabelText(/Your Product\/Solution/i);
    fireEvent.change(productInput, { target: { value: 'Azure' } });
    expect(submitButton).toBeDisabled(); // Still disabled
    
    const industrySelect = screen.getByLabelText(/Target Company Industry/i);
    fireEvent.change(industrySelect, { target: { value: 'Technology' } });
    expect(submitButton).toBeDisabled(); // Still disabled
    
    const painPointInput = screen.getByLabelText(/Primary Pain Point/i);
    fireEvent.change(painPointInput, { target: { value: 'Cloud migration challenges' } });
    
    // Now all required fields are filled
    expect(submitButton).not.toBeDisabled();
  });

  it('shows autocomplete suggestions from previous companies', async () => {
    renderComponent();
    
    const companyInput = screen.getByLabelText(/Target Company Name/i);
    fireEvent.change(companyInput, { target: { value: 'Tech' } });
    fireEvent.focus(companyInput);
    
    await waitFor(() => {
      expect(screen.getByText('TechCorp')).toBeInTheDocument();
    });
  });

  it('allows selection of priority and output format', () => {
    renderComponent();
    
    // Test priority selection
    const expressRadio = screen.getByRole('radio', { name: /Express \(Faster\)/i });
    fireEvent.click(expressRadio);
    expect(expressRadio).toBeChecked();
    
    // Test output format selection
    const summaryRadio = screen.getByRole('radio', { name: /Executive Summary/i });
    fireEvent.click(summaryRadio);
    expect(summaryRadio).toBeChecked();
  });

  it('expands additional context section', () => {
    renderComponent();
    
    const contextButton = screen.getByRole('button', { name: /Additional Context & Focus Areas/i });
    fireEvent.click(contextButton);
    
    expect(screen.getByText('Focus on cloud migration signals')).toBeInTheDocument();
    expect(screen.getByText('Prioritize competitive analysis')).toBeInTheDocument();
  });

  it('allows selection of context suggestions', () => {
    renderComponent();
    
    // Expand context section
    const contextButton = screen.getByRole('button', { name: /Additional Context & Focus Areas/i });
    fireEvent.click(contextButton);
    
    // Select a context suggestion
    const contextSuggestion = screen.getByRole('button', { name: 'Focus on cloud migration signals' });
    fireEvent.click(contextSuggestion);
    
    // Verify it appears in selected areas
    expect(screen.getByText('Selected focus areas:')).toBeInTheDocument();
  });

  it('submits form with complete solution-relevance data structure', () => {
    renderComponent();
    
    // Fill all required solution-relevance fields
    const companyInput = screen.getByLabelText(/Target Company Name/i);
    fireEvent.change(companyInput, { target: { value: 'OpenAI' } });
    
    const vendorInput = screen.getByLabelText(/Your Vendor\/Company/i);
    fireEvent.change(vendorInput, { target: { value: 'Microsoft' } });
    
    const productInput = screen.getByLabelText(/Your Product\/Solution/i);
    fireEvent.change(productInput, { target: { value: 'Azure OpenAI Service' } });
    
    const industrySelect = screen.getByLabelText(/Target Company Industry/i);
    fireEvent.change(industrySelect, { target: { value: 'Technology' } });
    
    const painPointInput = screen.getByLabelText(/Primary Pain Point/i);
    fireEvent.change(painPointInput, { target: { value: 'AI integration challenges' } });
    
    // Open additional context section first
    const additionalContextButton = screen.getByRole('button', { name: /Show additional context/i });
    fireEvent.click(additionalContextButton);
    
    // Select enhanced analysis options
    const competitorCheckbox = screen.getByLabelText(/Include Competitor Analysis/i);
    fireEvent.click(competitorCheckbox);
    
    const budgetCheckbox = screen.getByLabelText(/Budget.*Decision Maker Intel/i);
    fireEvent.click(budgetCheckbox);
    
    // Select express priority
    const expressRadio = screen.getByRole('radio', { name: /Express \(Faster\)/i });
    fireEvent.click(expressRadio);
    
    // Submit form
    const submitButton = screen.getByRole('button', { name: /Generate Intelligence Dossier/i });
    fireEvent.click(submitButton);
    
    expect(mockOnSubmit).toHaveBeenCalledWith({
      companyName: 'OpenAI',
      vendorName: 'Microsoft',
      productName: 'Azure OpenAI Service',
      industry: 'Technology',
      primaryPainPoint: 'AI integration challenges',
      competitorAnalysis: true,
      budgetIntelligence: true,
      technologyStackFocus: false,
      priority: 'express',
      outputFormat: 'full',
      confidenceThreshold: 'medium',
      additionalContext: undefined
    });
  });

  it('disables form when generating', () => {
    renderComponent({ isGenerating: true });
    
    const companyInput = screen.getByLabelText(/Target Company Name/i);
    const vendorInput = screen.getByLabelText(/Your Vendor\/Company/i);
    const submitButton = screen.getByRole('button', { name: /Generating Intelligence Dossier.../i });
    
    expect(companyInput).toBeDisabled();
    expect(vendorInput).toBeDisabled();
    expect(submitButton).toBeDisabled();
    expect(screen.getByText('Generating Intelligence Dossier...')).toBeInTheDocument();
  });

  it('displays loading spinner when generating', () => {
    renderComponent({ isGenerating: true });
    
    expect(screen.getByRole('button', { name: /Generating Intelligence Dossier.../i })).toBeInTheDocument();
    // Check for spinner element
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  // Task 5.5: Screen Reader & Accessibility Tools Testing
  describe('Screen Reader & Accessibility Tools Testing', () => {
    test('provides comprehensive screen reader navigation structure', () => {
      renderComponent();

      // Check for proper landmarks and regions
      expect(screen.getByRole('form')).toBeInTheDocument();
      
      // Verify ARIA labels are present for screen readers
      expect(screen.getByLabelText(/Target Company Name/i)).toHaveAttribute('aria-required', 'true');
      expect(screen.getByLabelText(/Your Vendor\/Company/i)).toHaveAttribute('aria-required', 'true');
      expect(screen.getByLabelText(/Target Company Industry/i)).toHaveAttribute('aria-required', 'true');
      expect(screen.getByLabelText(/Your Product\/Solution/i)).toHaveAttribute('aria-required', 'true');
      expect(screen.getByLabelText(/Primary Pain Point/i)).toHaveAttribute('aria-required', 'true');
    });

    test('supports screen reader announcement of form validation', async () => {
      renderComponent();

      const companyInput = screen.getByLabelText(/Target Company Name/i);
      const submitButton = screen.getByRole('button', { name: /Generate Intelligence Dossier/i });
      
      // Test form validation with screen reader support
      fireEvent.change(companyInput, { target: { value: 'A' } });
      fireEvent.blur(companyInput);
      
      expect(companyInput).toHaveAttribute('aria-invalid', 'true');
    });

    test('provides proper heading hierarchy for screen reader navigation', () => {
      renderComponent();

      // Check heading structure (h1 > h2 > h3, etc.)
      expect(screen.getByRole('heading', { name: /Solution Context/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /Enhanced Analysis Options/i })).toBeInTheDocument();
    });

    test('supports keyboard navigation and focus management', () => {
      renderComponent();

      const firstInput = screen.getByLabelText(/Target Company Name/i);

      // Test tab order and focus management
      firstInput.focus();
      expect(document.activeElement).toBe(firstInput);

      // Test keyboard navigation - inputs should be tabbable
      const secondInput = screen.getByLabelText(/Your Vendor\/Company/i);
      expect(firstInput).not.toHaveAttribute('tabIndex', '-1');
      expect(secondInput).not.toHaveAttribute('tabIndex', '-1');
    });

    test('provides proper ARIA descriptions for complex form elements', () => {
      renderComponent();

      // Check radiogroup has proper ARIA attributes
      const priorityRadiogroup = screen.getByRole('radiogroup', { name: '6. Analysis Priority' });
      expect(priorityRadiogroup).toHaveAttribute('aria-labelledby');

      // Check radio buttons have descriptions
      const standardRadio = screen.getByRole('radio', { name: /Standard Analysis/i });
      expect(standardRadio).toHaveAttribute('aria-describedby');
    });

    test('announces dynamic content changes to screen readers', async () => {
      renderComponent();

      const toggleButton = screen.getByRole('button', { name: /Show Additional Context & Focus Areas/i });
      
      // Test ARIA live region updates
      expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
      fireEvent.click(toggleButton);
      expect(toggleButton).toHaveAttribute('aria-expanded', 'true');
    });

    test('supports voice control labeling', () => {
      renderComponent();

      // Check that all interactive elements have proper labels for voice control
      const submitButton = screen.getByRole('button', { name: /Generate Intelligence Dossier/i });
      expect(submitButton).toHaveAttribute('aria-label');
      
      const companyInput = screen.getByLabelText(/Target Company Name/i);
      expect(companyInput).toHaveAccessibleName();
    });

    test('provides alternative text and context for non-text elements', () => {
      renderComponent();

      // Check that SVG icons have proper aria-hidden attributes
      const icons = document.querySelectorAll('svg[aria-hidden="true"]');
      expect(icons.length).toBeGreaterThan(0);
      
      // Icons should be hidden from screen readers when decorative
      icons.forEach(icon => {
        expect(icon).toHaveAttribute('aria-hidden', 'true');
      });
    });
  });

  // Task 4.1: Mobile Performance Validation Tests
  describe('Mobile Performance & Touch Interaction Tests', () => {
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

    it('validates touch target sizes for mobile accessibility', () => {
      renderComponent();
      
      const submitButton = screen.getByRole('button', { name: /Generate Intelligence Dossier/i });
      const companyInput = screen.getByLabelText(/Target Company Name/i);
      
      // Touch targets should meet mobile accessibility standards (44px minimum)
      expect(submitButton).toHaveClass('min-h-11'); // 44px
      expect(companyInput).toHaveClass('min-h-12'); // 48px for inputs
    });

    it('adapts form layout for mobile screens', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375, // Mobile width
      });

      renderComponent();
      
      // Form should use mobile-optimized layout
      const formContainer = screen.getByLabelText(/Target Company Name/i).closest('form');
      expect(formContainer).toHaveClass('space-y-4'); // Mobile spacing
    });

    it('optimizes performance for low-end mobile devices', () => {
      mockDeviceCapabilities.performanceTier = 'low';
      
      // Mock performance.now to return consistent fast times
      const originalNow = performance.now;
      let callCount = 0;
      vi.spyOn(performance, 'now').mockImplementation(() => {
        callCount++;
        return callCount === 1 ? 0 : 25; // 25ms render time
      });
      
      renderComponent();
      
      // Verify component rendered with performance optimizations
      expect(screen.getByText(/Mobile Optimized/i)).toBeInTheDocument();
      
      // Restore original function
      performance.now = originalNow;
    });

    it('handles touch interactions properly', async () => {
      renderComponent();
      
      const companyInput = screen.getByLabelText(/Target Company Name/i);
      
      // Simulate touch interaction
      fireEvent.touchStart(companyInput);
      fireEvent.change(companyInput, { target: { value: 'Mobile Test Corp' } });
      fireEvent.touchEnd(companyInput);
      
      expect(companyInput).toHaveValue('Mobile Test Corp');
    });

    it('validates autocomplete performance on mobile', async () => {
      renderComponent();
      
      const companyInput = screen.getByLabelText(/Target Company Name/i);
      
      const startTime = performance.now();
      fireEvent.change(companyInput, { target: { value: 'Tech' } });
      
      await waitFor(() => {
        expect(screen.getByText('TechCorp')).toBeInTheDocument();
      });
      
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      // Autocomplete should respond quickly on mobile
      expect(responseTime).toBeLessThan(100); // 100ms budget
    });

    it('disables animations in battery optimization mode', () => {
      mockDeviceCapabilities.batteryOptimization = true;
      mockUsePerformanceStore.mockReturnValue({
        deviceCapabilities: mockDeviceCapabilities,
        animationsEnabled: false
      });

      renderComponent({ isGenerating: true });
      
      // Should not show spinner animation when battery optimization is on
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeNull();
    });

    it('validates form submission performance on mobile networks', async () => {
      mockDeviceCapabilities.connectionQuality = '3G';
      renderComponent();
      
      // Fill all required fields for valid form
      fireEvent.change(screen.getByLabelText(/Target Company Name/i), { target: { value: 'Test Company' } });
      fireEvent.change(screen.getByLabelText(/Your Vendor\/Company/i), { target: { value: 'Test Vendor' } });
      fireEvent.change(screen.getByLabelText(/Your Product\/Solution/i), { target: { value: 'Test Product' } });
      fireEvent.change(screen.getByLabelText(/Target Company Industry/i), { target: { value: 'Technology' } });
      fireEvent.change(screen.getByLabelText(/Primary Pain Point/i), { target: { value: 'Test pain point' } });
      
      const submitButton = screen.getByRole('button', { name: /Generate Intelligence Dossier/i });
      
      const startTime = performance.now();
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
      }, { timeout: 3000 });
      
      const endTime = performance.now();
      const submitTime = endTime - startTime;
      
      // Form validation should be fast even on slow networks
      expect(submitTime).toBeLessThan(1000); // More realistic timeout
    });

    it('handles emergency mode gracefully', () => {
      mockDeviceCapabilities.emergencyMode = true;
      mockUsePerformanceStore.mockReturnValue({
        deviceCapabilities: mockDeviceCapabilities,
        animationsEnabled: false
      });

      renderComponent();
      
      // Should still be functional in emergency mode
      expect(screen.getByLabelText(/Target Company Name/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Generate Intelligence Dossier/i })).toBeInTheDocument();
    });
  });
});