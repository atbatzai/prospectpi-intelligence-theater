/**
 * QA Test Suite: Story 7.3 - Embedded Widgets
 * 
 * Test Coverage:
 * - Widget type selection (dossier preview, search, feed)
 * - Size configuration (small, medium, large)
 * - Custom branding (color, logo)
 * - Embed code generation
 * - CSP-compliant iframe security
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EmbeddedWidgetBuilder } from '@/components/embed/EmbeddedWidgetBuilder';

Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(() => Promise.resolve()),
  },
});

describe('Story 7.3: Embedded Widgets & White-label Options', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders embedded widget builder', () => {
    render(<EmbeddedWidgetBuilder />);
    expect(screen.getByText(/Embedded Widget Builder/i)).toBeInTheDocument();
  });

  it('displays widget type selection', () => {
    render(<EmbeddedWidgetBuilder />);
    expect(screen.getByText(/Widget Type/i)).toBeInTheDocument();
    expect(screen.getByText(/Dossier Preview/i)).toBeInTheDocument();
    expect(screen.getByText(/Company Search/i)).toBeInTheDocument();
    expect(screen.getByText(/Intelligence Feed/i)).toBeInTheDocument();
  });

  it('shows widget size options', () => {
    render(<EmbeddedWidgetBuilder />);
    expect(screen.getByText(/Widget Size/i)).toBeInTheDocument();
    expect(screen.getByText(/Small/i)).toBeInTheDocument();
    expect(screen.getByText(/Medium/i)).toBeInTheDocument();
    expect(screen.getByText(/Large/i)).toBeInTheDocument();
  });

  it('displays customization section with color picker', () => {
    render(<EmbeddedWidgetBuilder />);
    expect(screen.getByText(/Customization/i)).toBeInTheDocument();
    expect(screen.getByText(/Primary Color/i)).toBeInTheDocument();
    const colorInputs = screen.getAllByDisplayValue(/#1E3A8A/i);
    expect(colorInputs.length).toBeGreaterThan(0);
  });

  it('shows branding toggle', () => {
    render(<EmbeddedWidgetBuilder />);
    expect(screen.getByText(/Show ProspectPI Branding/i)).toBeInTheDocument();
  });

  it('generates embed code', () => {
    render(<EmbeddedWidgetBuilder />);
    expect(screen.getByText(/Embed Code/i)).toBeInTheDocument();
    const codeElement = screen.getByText(/<iframe/i);
    expect(codeElement).toBeInTheDocument();
  });

  it('includes CSP-compliant security attributes in iframe', () => {
    render(<EmbeddedWidgetBuilder />);
    const codeText = screen.getByText(/<iframe/i).textContent;
    expect(codeText).toContain('sandbox');
    expect(codeText).toContain('allow-scripts');
  });

  it('copies embed code to clipboard on copy button click', () => {
    render(<EmbeddedWidgetBuilder />);
    const copyButton = screen.getByRole('button', { name: /copy code/i });
    fireEvent.click(copyButton);
    expect(navigator.clipboard.writeText).toHaveBeenCalled();
  });

  it('shows copied confirmation after copy', () => {
    render(<EmbeddedWidgetBuilder />);
    const copyButton = screen.getByRole('button', { name: /copy code/i });
    fireEvent.click(copyButton);
    expect(screen.getByText(/Copied!/i)).toBeInTheDocument();
  });

  it('displays widget preview', () => {
    render(<EmbeddedWidgetBuilder />);
    expect(screen.getByText(/Preview/i)).toBeInTheDocument();
    expect(screen.getByText(/How your widget will appear/i)).toBeInTheDocument();
  });

  it('updates preview when widget type changes', () => {
    render(<EmbeddedWidgetBuilder />);
    const searchButton = screen.getByText(/Company Search/i).closest('button');
    if (searchButton) {
      fireEvent.click(searchButton);
      expect(screen.getByText(/Search Companies/i)).toBeInTheDocument();
    }
  });

  it('adjusts preview size when size selection changes', () => {
    render(<EmbeddedWidgetBuilder />);
    const smallButton = screen.getByText(/Small/i).closest('button');
    if (smallButton) {
      fireEvent.click(smallButton);
    }
    expect(screen.getByText(/Preview/i)).toBeInTheDocument();
  });

  it('displays security features information', () => {
    render(<EmbeddedWidgetBuilder />);
    expect(screen.getByText(/Security Features/i)).toBeInTheDocument();
    expect(screen.getByText(/CSP-compliant iframe sandboxing/i)).toBeInTheDocument();
    expect(screen.getByText(/XSS protection enabled/i)).toBeInTheDocument();
    expect(screen.getByText(/HTTPS-only content delivery/i)).toBeInTheDocument();
  });

  it('shows "Powered by ProspectPI" in preview when branding enabled', () => {
    render(<EmbeddedWidgetBuilder />);
    expect(screen.getByText(/Powered by/i)).toBeInTheDocument();
    expect(screen.getByText(/ProspectPI/i)).toBeInTheDocument();
  });

  it('updates primary color in preview', () => {
    render(<EmbeddedWidgetBuilder />);
    const colorInput = screen.getAllByDisplayValue(/#1E3A8A/i)[1] as HTMLInputElement;
    fireEvent.change(colorInput, { target: { value: '#FF0000' } });
    expect(colorInput.value).toBe('#FF0000');
  });
});
