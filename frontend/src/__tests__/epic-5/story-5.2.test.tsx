/**
 * QA Test Suite: Story 5.2 - Security Audit Trail
 * 
 * Test Coverage:
 * - Audit log entry display
 * - Filter controls (action, status, time range)
 * - CSV export functionality
 * - GDPR/CCPA compliance indicators
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AuditTrailViewer } from '@/components/security/AuditTrailViewer';

describe('Story 5.2: Security Audit Trail', () => {
  it('renders audit trail viewer', () => {
    render(<AuditTrailViewer />);
    expect(screen.getByText(/Security Audit Trail/i)).toBeInTheDocument();
  });

  it('displays audit log entries', () => {
    render(<AuditTrailViewer />);
    expect(screen.getByText(/User Login/i)).toBeInTheDocument();
    expect(screen.getByText(/API Key Generated/i)).toBeInTheDocument();
  });

  it('shows filter controls', () => {
    render(<AuditTrailViewer />);
    expect(screen.getByText(/Filter by Action/i)).toBeInTheDocument();
    expect(screen.getByText(/Filter by Status/i)).toBeInTheDocument();
  });

  it('displays status icons for audit entries', () => {
    render(<AuditTrailViewer />);
    const successBadges = screen.getAllByText(/Success/i);
    expect(successBadges.length).toBeGreaterThan(0);
  });

  it('renders CSV export button', () => {
    render(<AuditTrailViewer />);
    const exportButton = screen.getByRole('button', { name: /export audit logs/i });
    expect(exportButton).toBeInTheDocument();
  });

  it('shows compliance badges', () => {
    render(<AuditTrailViewer />);
    expect(screen.getByText(/GDPR Compliant/i)).toBeInTheDocument();
    expect(screen.getByText(/CCPA Compliant/i)).toBeInTheDocument();
  });

  it('displays cryptographic verification info', () => {
    render(<AuditTrailViewer />);
    expect(screen.getByText(/Cryptographically Verified/i)).toBeInTheDocument();
  });
});
