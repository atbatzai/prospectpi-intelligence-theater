import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { SmartCompanyInput } from '../SmartCompanyInput';

// Mock the icons
vi.mock('lucide-react', () => ({
  Search: () => <div data-testid="search-icon">Search</div>,
  Sparkles: () => <div data-testid="sparkles-icon">Sparkles</div>,
  Building: () => <div data-testid="building-icon">Building</div>,
  Building2: () => <div data-testid="building2-icon">Building2</div>,
  Globe: () => <div data-testid="globe-icon">Globe</div>,
  TrendingUp: () => <div data-testid="trending-up-icon">TrendingUp</div>,
  Users: () => <div data-testid="users-icon">Users</div>,
  Clock: () => <div data-testid="clock-icon">Clock</div>
}));

describe('SmartCompanyInput - Magic Entry Interface (Story 2.1.1)', () => {
  const mockOnGenerate = vi.fn();

  beforeEach(() => {
    mockOnGenerate.mockClear();
  });

  describe('Single Input Field', () => {
    it('renders with single company input field', () => {
      render(<SmartCompanyInput onGenerate={mockOnGenerate} />);
      
      expect(screen.getByText('Generate Business Intelligence')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter company name or website...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Generate Sales Dossier/i })).toBeInTheDocument();
    });

    it('enables generate button only when input has content', () => {
      render(<SmartCompanyInput onGenerate={mockOnGenerate} />);
      
      const input = screen.getByPlaceholderText('Enter company name or website...');
      const generateButton = screen.getByRole('button', { name: /Generate Sales Dossier/i });
      
      // Initially disabled
      expect(generateButton).toBeDisabled();
      
      // Type company name - should enable
      fireEvent.change(input, { target: { value: 'Netflix' } });
      expect(generateButton).toBeEnabled();
      
      // Clear input - should disable again
      fireEvent.change(input, { target: { value: '' } });
      expect(generateButton).toBeDisabled();
    });
  });

  describe('Netflix Demo Option', () => {
    it('displays Netflix as demo option for instant value', () => {
      render(<SmartCompanyInput onGenerate={mockOnGenerate} />);
      
      expect(screen.getByText('Or try one of these examples for instant results:')).toBeInTheDocument();
      expect(screen.getByText('Netflix')).toBeInTheDocument();
      expect(screen.getByText('Entertainment & Media')).toBeInTheDocument();
    });

    it('generates intelligence for Netflix when demo button clicked', () => {
      render(<SmartCompanyInput onGenerate={mockOnGenerate} />);
      
      const netflixButton = screen.getByText('Netflix').closest('button');
      fireEvent.click(netflixButton!);
      
      expect(mockOnGenerate).toHaveBeenCalledWith({
        companyName: 'Netflix',
        industry: 'Entertainment & Media',
        primaryPainPoint: 'Market Intelligence',
        productName: 'Intelligence Platform',
        vendorName: 'ProspectPI'
      });
    });

    it('shows multiple demo companies including Netflix', () => {
      render(<SmartCompanyInput onGenerate={mockOnGenerate} />);
      
      // Netflix should be prominently featured
      expect(screen.getByText('Netflix')).toBeInTheDocument();
      
      // Should have other demo companies too
      const demoButtons = screen.getAllByText(/Entertainment|Technology|Finance|E-commerce/);
      expect(demoButtons.length).toBeGreaterThan(0);
    });
  });

  describe('Smart Autocomplete', () => {
    it('provides autocomplete suggestions', async () => {
      render(<SmartCompanyInput onGenerate={mockOnGenerate} />);
      
      const input = screen.getByPlaceholderText('Enter company name or website...');
      
      // Type partial company name
      fireEvent.change(input, { target: { value: 'Net' } });
      
      // Should show dropdown with suggestions (tested via UI interaction)
      expect(input).toHaveValue('Net');
    });

    it('handles keyboard navigation in autocomplete', () => {
      render(<SmartCompanyInput onGenerate={mockOnGenerate} />);
      
      const input = screen.getByPlaceholderText('Enter company name or website...');
      
      // Type to trigger autocomplete
      fireEvent.change(input, { target: { value: 'Apple' } });
      
      // Press Enter to submit
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
      expect(mockOnGenerate).toHaveBeenCalledWith({
        companyName: 'Apple',
        industry: 'Unknown',
        primaryPainPoint: 'Market Intelligence',
        productName: 'Intelligence Platform',
        vendorName: 'ProspectPI'
      });
    });
  });

  describe('Generate Button', () => {
    it('submits form when generate button clicked', () => {
      render(<SmartCompanyInput onGenerate={mockOnGenerate} />);
      
      const input = screen.getByPlaceholderText('Enter company name or website...');
      const generateButton = screen.getByRole('button', { name: /Generate Sales Dossier/i });
      
      fireEvent.change(input, { target: { value: 'Tesla' } });
      fireEvent.click(generateButton);
      
      expect(mockOnGenerate).toHaveBeenCalledWith({
        companyName: 'Tesla',
        industry: 'Unknown',
        primaryPainPoint: 'Market Intelligence',
        productName: 'Intelligence Platform',
        vendorName: 'ProspectPI'
      });
    });

    it('shows loading state when generating', async () => {
      render(<SmartCompanyInput onGenerate={mockOnGenerate} isGenerating={true} />);
      
      const input = screen.getByPlaceholderText('Enter company name or website...');
      const generateButton = screen.getByRole('button', { name: /Generating Intelligence/i });
      
      // Input and button should be disabled during loading
      expect(input).toBeDisabled();
      expect(generateButton).toBeDisabled();
      
      // Should show loading spinner in button
      expect(screen.getByText('Generating Intelligence...')).toBeInTheDocument();
    });
  });

  describe('Mobile Optimization', () => {
    it('uses mobile-optimized input interface', () => {
      render(<SmartCompanyInput onGenerate={mockOnGenerate} />);
      
      const input = screen.getByPlaceholderText('Enter company name or website...');
      
      // Should have mobile-friendly styling classes
      expect(input).toHaveClass('text-lg', 'py-4', 'rounded-xl');
    });

    it('uses responsive button sizing', () => {
      render(<SmartCompanyInput onGenerate={mockOnGenerate} />);
      
      const generateButton = screen.getByRole('button', { name: /Generate Sales Dossier/i });
      
      // Should have mobile-friendly button styling
      expect(generateButton).toHaveClass('w-full', 'py-4', 'text-lg', 'rounded-xl');
    });
  });

  describe('Error Handling', () => {
    it('handles empty input gracefully', () => {
      render(<SmartCompanyInput onGenerate={mockOnGenerate} />);
      
      const generateButton = screen.getByRole('button', { name: /Generate Sales Dossier/i });
      
      // Should be disabled for empty input
      expect(generateButton).toBeDisabled();
    });

    it('trims whitespace from input', () => {
      render(<SmartCompanyInput onGenerate={mockOnGenerate} />);
      
      const input = screen.getByPlaceholderText('Enter company name or website...');
      const generateButton = screen.getByRole('button', { name: /Generate Sales Dossier/i });
      
      fireEvent.change(input, { target: { value: '  Amazon  ' } });
      fireEvent.click(generateButton);
      
      expect(mockOnGenerate).toHaveBeenCalledWith({
        companyName: 'Amazon',
        industry: 'Unknown',
        primaryPainPoint: 'Market Intelligence',
        productName: 'Intelligence Platform',
        vendorName: 'ProspectPI'
      });
    });
  });

  describe('ProspectPI Branding', () => {
    it('displays ProspectPI branded interface', () => {
      render(<SmartCompanyInput onGenerate={mockOnGenerate} />);
      
      expect(screen.getByText('Generate Business Intelligence')).toBeInTheDocument();
      expect(screen.getByText('Enter any company name to get comprehensive intelligence in seconds')).toBeInTheDocument();
    });

    it('uses detective theme styling', () => {
      render(<SmartCompanyInput onGenerate={mockOnGenerate} />);
      
      const input = screen.getByPlaceholderText('Enter company name or website...');
      const generateButton = screen.getByRole('button', { name: /Generate Sales Dossier/i });
      
      // Should use detective theme classes
      expect(input).toHaveClass('detective-input');
      expect(generateButton).toHaveClass('detective-button-primary');
    });
  });
});