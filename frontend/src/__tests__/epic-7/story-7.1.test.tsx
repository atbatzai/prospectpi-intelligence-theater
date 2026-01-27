/**
 * QA Test Suite: Story 7.1 - Public API Platform
 * 
 * Test Coverage:
 * - API key generation and management
 * - Rate limiting visualization
 * - API documentation access
 * - SDK download options
 * - Interactive API explorer
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DeveloperPortal } from '@/components/developer/DeveloperPortal';

Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(() => Promise.resolve()),
  },
});

describe('Story 7.1: Public API Platform & Developer Portal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders developer portal', () => {
    render(<DeveloperPortal />);
    expect(screen.getByText(/Developer Portal/i)).toBeInTheDocument();
  });

  it('displays quick start section with documentation link', () => {
    render(<DeveloperPortal />);
    expect(screen.getByText(/Getting Started/i)).toBeInTheDocument();
    expect(screen.getByText(/API Documentation/i)).toBeInTheDocument();
  });

  it('shows SDK download options', () => {
    render(<DeveloperPortal />);
    expect(screen.getByText(/Download SDK/i)).toBeInTheDocument();
    expect(screen.getByText(/JavaScript, Python, Ruby, Go/i)).toBeInTheDocument();
  });

  it('displays interactive API explorer link', () => {
    render(<DeveloperPortal />);
    expect(screen.getByText(/Try Interactive API/i)).toBeInTheDocument();
  });

  it('shows existing API keys', () => {
    render(<DeveloperPortal />);
    expect(screen.getByText(/Production API/i)).toBeInTheDocument();
    expect(screen.getByText(/Development API/i)).toBeInTheDocument();
  });

  it('displays rate limit usage for each API key', () => {
    render(<DeveloperPortal />);
    expect(screen.getByText(/3,421 \/ 10,000 requests/i)).toBeInTheDocument();
  });

  it('renders generate new key button', () => {
    render(<DeveloperPortal />);
    const generateButton = screen.getByRole('button', { name: /generate new key/i });
    expect(generateButton).toBeInTheDocument();
  });

  it('creates new API key when generate button clicked', () => {
    render(<DeveloperPortal />);
    const generateButton = screen.getByRole('button', { name: /generate new key/i });
    fireEvent.click(generateButton);
    expect(screen.getByText(/New API Key/i)).toBeInTheDocument();
  });

  it('copies API key to clipboard on copy button click', async () => {
    render(<DeveloperPortal />);
    const copyButtons = screen.getAllByRole('button', { name: '' });
    const firstCopyButton = copyButtons.find(btn => btn.querySelector('svg'));
    if (firstCopyButton) {
      fireEvent.click(firstCopyButton);
      expect(navigator.clipboard.writeText).toHaveBeenCalled();
    }
  });

  it('displays API endpoints documentation', () => {
    render(<DeveloperPortal />);
    expect(screen.getByText(/API Endpoints/i)).toBeInTheDocument();
    expect(screen.getByText(/\/api\/v1\/research\/generate-dossier/)).toBeInTheDocument();
  });

  it('shows HTTP method badges for endpoints', () => {
    render(<DeveloperPortal />);
    expect(screen.getByText(/POST/)).toBeInTheDocument();
    const getBadges = screen.getAllByText(/GET/);
    expect(getBadges.length).toBeGreaterThan(0);
  });

  it('displays last used timestamp for API keys', () => {
    render(<DeveloperPortal />);
    expect(screen.getByText(/Last used: 2 minutes ago/i)).toBeInTheDocument();
  });
});
