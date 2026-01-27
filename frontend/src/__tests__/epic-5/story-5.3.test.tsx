/**
 * QA Test Suite: Story 5.3 - Data Encryption & Privacy
 * 
 * Test Coverage:
 * - AES-256 encryption status display
 * - TLS 1.3 in-transit encryption
 * - Data residency controls (US/EU/APAC)
 * - GDPR Article 17 (Right to be Forgotten)
 * - Data export functionality
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PrivacyDashboard } from '@/components/security/PrivacyDashboard';

describe('Story 5.3: Data Encryption & Privacy Controls', () => {
  it('renders privacy dashboard', () => {
    render(<PrivacyDashboard />);
    expect(screen.getByText(/Data Encryption & Privacy/i)).toBeInTheDocument();
  });

  it('displays at-rest encryption status (AES-256)', () => {
    render(<PrivacyDashboard />);
    expect(screen.getByText(/At-Rest Encryption/i)).toBeInTheDocument();
    expect(screen.getByText(/AES-256/i)).toBeInTheDocument();
  });

  it('shows in-transit encryption status (TLS 1.3)', () => {
    render(<PrivacyDashboard />);
    expect(screen.getByText(/In-Transit Encryption/i)).toBeInTheDocument();
    expect(screen.getByText(/TLS 1.3/i)).toBeInTheDocument();
  });

  it('displays backup encryption status', () => {
    render(<PrivacyDashboard />);
    expect(screen.getByText(/Backup Encryption/i)).toBeInTheDocument();
    expect(screen.getByText(/AES-256 encrypted/i)).toBeInTheDocument();
  });

  it('renders data residency controls', () => {
    render(<PrivacyDashboard />);
    expect(screen.getByText(/Data Residency Controls/i)).toBeInTheDocument();
    expect(screen.getByText(/United States/i)).toBeInTheDocument();
    expect(screen.getByText(/European Union/i)).toBeInTheDocument();
    expect(screen.getByText(/Asia Pacific/i)).toBeInTheDocument();
  });

  it('shows GDPR data export option', () => {
    render(<PrivacyDashboard />);
    const exportButton = screen.getByRole('button', { name: /export/i });
    expect(exportButton).toBeInTheDocument();
  });

  it('displays right to be forgotten option', () => {
    render(<PrivacyDashboard />);
    expect(screen.getByText(/Right to be Forgotten/i)).toBeInTheDocument();
    expect(screen.getByText(/GDPR Article 17/i)).toBeInTheDocument();
  });

  it('confirms deletion with user prompt', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<PrivacyDashboard />);
    const deleteButton = screen.getByRole('button', { name: /delete data/i });
    fireEvent.click(deleteButton);
    expect(confirmSpy).toHaveBeenCalled();
  });
});
