/**
 * QA Test Suite: Story 5.1 - Enterprise SSO
 * 
 * Test Coverage:
 * - SAML/OIDC provider configuration (Azure AD, Okta, Google)
 * - MFA enforcement toggle
 * - Session management
 * - Active session monitoring
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EnterpriseSSO } from '@/components/security/EnterpriseSSO';

describe('Story 5.1: Enterprise SSO', () => {
  it('renders SSO configuration interface', () => {
    render(<EnterpriseSSO />);
    expect(screen.getByText(/Enterprise SSO Configuration/i)).toBeInTheDocument();
  });

  it('displays all SSO provider options', () => {
    render(<EnterpriseSSO />);
    expect(screen.getByText(/Azure AD/i)).toBeInTheDocument();
    expect(screen.getByText(/Okta/i)).toBeInTheDocument();
    expect(screen.getByText(/Google Workspace/i)).toBeInTheDocument();
  });

  it('shows MFA enforcement toggle', () => {
    render(<EnterpriseSSO />);
    const mfaToggle = screen.getByRole('checkbox', { name: /enforce mfa/i });
    expect(mfaToggle).toBeInTheDocument();
  });

  it('displays session timeout configuration', () => {
    render(<EnterpriseSSO />);
    expect(screen.getByText(/Session Timeout/i)).toBeInTheDocument();
    expect(screen.getByText(/8 hours/i)).toBeInTheDocument();
  });

  it('shows active session count', () => {
    render(<EnterpriseSSO />);
    expect(screen.getByText(/Active Sessions/i)).toBeInTheDocument();
  });

  it('displays SAML metadata URL', () => {
    render(<EnterpriseSSO />);
    expect(screen.getByText(/SAML Metadata URL/i)).toBeInTheDocument();
  });

  it('renders save configuration button', () => {
    render(<EnterpriseSSO />);
    const saveButton = screen.getByRole('button', { name: /save configuration/i });
    expect(saveButton).toBeInTheDocument();
  });
});
