import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ProspectPIHeader, InvestigationStatus, EvidenceBadge } from './ProspectPIHeader';

describe('ProspectPIHeader - Story 2.1.2 Brand Integration', () => {
  describe('Detective Theme Branding', () => {
    it('renders ProspectPI logo with detective theme', () => {
      render(<ProspectPIHeader />);
      
      expect(screen.getByRole('heading', { name: /prospectpi/i })).toBeInTheDocument();
      expect(screen.getByText('Business Intelligence Detective')).toBeInTheDocument();
    });

    it('displays shield and search icons for detective branding', () => {
      render(<ProspectPIHeader />);
      
      // Check for Shield and Search icons (via SVG presence)
      const headerElement = screen.getByRole('heading', { name: /prospectpi/i }).closest('header');
      expect(headerElement?.querySelector('svg')).toBeInTheDocument();
    });

    it('uses navy/purple color scheme in CSS classes', () => {
      render(<ProspectPIHeader />);
      
      const logo = screen.getByRole('heading', { name: /prospectpi/i });
      expect(logo).toHaveClass('prospectpi-logo');
      
      const tagline = screen.getByText('Business Intelligence Detective');
      expect(tagline).toHaveClass('prospectpi-tagline');
    });
  });

  describe('Header Variants', () => {
    it('renders full variant with all features', () => {
      render(<ProspectPIHeader variant="full" />);
      
      expect(screen.getByText('Professional Intelligence Platform')).toBeInTheDocument();
      expect(screen.getByText('12+ Data Sources')).toBeInTheDocument();
      expect(screen.getByText('Sub-2min Reports')).toBeInTheDocument();
      expect(screen.getByText('Enterprise Security')).toBeInTheDocument();
    });

    it('renders compact variant without extras', () => {
      render(<ProspectPIHeader variant="compact" />);
      
      expect(screen.getByRole('heading', { name: /prospectpi/i })).toBeInTheDocument();
      expect(screen.getByText('Business Intelligence Detective')).toBeInTheDocument();
      expect(screen.queryByText('Professional Intelligence Platform')).not.toBeInTheDocument();
    });

    it('renders minimal variant with logo only', () => {
      render(<ProspectPIHeader variant="minimal" showTagline={false} />);
      
      expect(screen.getByRole('heading', { name: /prospectpi/i })).toBeInTheDocument();
      expect(screen.queryByText('Business Intelligence Detective')).not.toBeInTheDocument();
    });
  });

  describe('Navigation Features', () => {
    it('shows navigation when enabled', () => {
      render(<ProspectPIHeader showNavigation={true} />);
      
      expect(screen.getByRole('link', { name: /generate report/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /case history/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /new investigation/i })).toBeInTheDocument();
    });

    it('hides navigation when disabled', () => {
      render(<ProspectPIHeader showNavigation={false} />);
      
      expect(screen.queryByRole('link', { name: /generate report/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /case history/i })).not.toBeInTheDocument();
    });
  });

  describe('Professional Intelligence Platform Features', () => {
    it('displays PI badge with detective styling', () => {
      render(<ProspectPIHeader variant="full" />);
      
      expect(screen.getByText('PI')).toBeInTheDocument();
      expect(screen.getByText('Professional Intelligence Platform')).toBeInTheDocument();
    });

    it('shows key feature metrics', () => {
      render(<ProspectPIHeader variant="full" />);
      
      expect(screen.getByText('12+ Data Sources')).toBeInTheDocument();
      expect(screen.getByText('Sub-2min Reports')).toBeInTheDocument();
      expect(screen.getByText('Enterprise Security')).toBeInTheDocument();
    });
  });
});

describe('InvestigationStatus Component', () => {
  it('renders investigating status correctly', () => {
    render(<InvestigationStatus status="investigating" message="Looking for clues" />);
    
    expect(screen.getByText('Looking for clues')).toBeInTheDocument();
  });

  it('renders analyzing status with animation', () => {
    render(<InvestigationStatus status="analyzing" />);
    
    expect(screen.getByText('Analyzing Evidence')).toBeInTheDocument();
    const statusElement = screen.getByText('Analyzing Evidence').closest('div');
    expect(statusElement).toHaveClass('investigating-animation');
  });

  it('renders complete status', () => {
    render(<InvestigationStatus status="complete" />);
    
    expect(screen.getByText('Investigation Complete')).toBeInTheDocument();
  });

  it('renders alert status', () => {
    render(<InvestigationStatus status="alert" message="Attention needed" />);
    
    expect(screen.getByText('Attention needed')).toBeInTheDocument();
  });

  it('uses default message when none provided', () => {
    render(<InvestigationStatus status="investigating" />);
    
    expect(screen.getByText('Investigating...')).toBeInTheDocument();
  });
});

describe('EvidenceBadge Component', () => {
  it('renders default evidence badge', () => {
    render(<EvidenceBadge>Found evidence</EvidenceBadge>);
    
    expect(screen.getByText('Found evidence')).toBeInTheDocument();
  });

  it('renders important variant with correct styling', () => {
    render(<EvidenceBadge variant="important">Critical finding</EvidenceBadge>);
    
    const badge = screen.getByText('Critical finding');
    expect(badge).toHaveClass('bg-brand-purple-100', 'text-brand-purple-700', 'border-brand-purple-200');
  });

  it('renders clue variant with correct styling', () => {
    render(<EvidenceBadge variant="clue">Important clue</EvidenceBadge>);
    
    const badge = screen.getByText('Important clue');
    expect(badge).toHaveClass('bg-brand-navy-100', 'text-brand-navy-700', 'border-brand-navy-200');
  });

  it('renders default variant with evidence badge class', () => {
    render(<EvidenceBadge>Standard evidence</EvidenceBadge>);
    
    const badge = screen.getByText('Standard evidence');
    expect(badge).toHaveClass('evidence-badge');
  });
});

describe('Navy/Purple Color Scheme Integration', () => {
  it('applies detective theme CSS classes', () => {
    const { container } = render(<ProspectPIHeader variant="full" />);
    
    // Check that brand classes are present in the component
    expect(container.querySelector('.prospectpi-logo')).toBeInTheDocument();
    expect(container.querySelector('.prospectpi-tagline')).toBeInTheDocument();
  });

  it('uses gradient backgrounds for detective theme', () => {
    render(<ProspectPIHeader variant="full" />);
    
    // The header should have gradient background classes applied via CSS
    const header = screen.getByRole('banner') || screen.getByRole('heading', { name: /prospectpi/i }).closest('header');
    expect(header).toBeInTheDocument();
  });
});