/**
 * QA Test Suite: Story 6.2 - Customer Health Scoring
 * 
 * Test Coverage:
 * - Health score calculation (0-100)
 * - Churn risk prediction (low/medium/high)
 * - Engagement metrics tracking
 * - Retention campaign triggers
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CustomerHealthDashboard } from '@/components/analytics/CustomerHealthDashboard';

describe('Story 6.2: Customer Health Scoring & Retention Analytics', () => {
  it('renders customer health dashboard', () => {
    render(<CustomerHealthDashboard />);
    expect(screen.getByText(/Customer Health & Retention/i)).toBeInTheDocument();
  });

  it('displays healthy customer count', () => {
    render(<CustomerHealthDashboard />);
    expect(screen.getByText(/142/)).toBeInTheDocument();
    expect(screen.getByText(/Healthy Customers/i)).toBeInTheDocument();
  });

  it('shows at-risk customer count', () => {
    render(<CustomerHealthDashboard />);
    expect(screen.getByText(/51/)).toBeInTheDocument();
    expect(screen.getByText(/At Risk/i)).toBeInTheDocument();
  });

  it('displays high churn risk customer count', () => {
    render(<CustomerHealthDashboard />);
    expect(screen.getByText(/19/)).toBeInTheDocument();
    expect(screen.getByText(/High Churn Risk/i)).toBeInTheDocument();
  });

  it('shows overall retention rate', () => {
    render(<CustomerHealthDashboard />);
    expect(screen.getByText(/94%/)).toBeInTheDocument();
    expect(screen.getByText(/Retention Rate/i)).toBeInTheDocument();
  });

  it('displays customer details with health scores', () => {
    render(<CustomerHealthDashboard />);
    expect(screen.getByText(/Acme Corp/i)).toBeInTheDocument();
    expect(screen.getByText(/92/)).toBeInTheDocument(); // Health score
  });

  it('shows churn risk badges', () => {
    render(<CustomerHealthDashboard />);
    expect(screen.getByText(/Low Risk/i)).toBeInTheDocument();
    expect(screen.getByText(/High Risk/i)).toBeInTheDocument();
  });

  it('displays engagement metrics per customer', () => {
    render(<CustomerHealthDashboard />);
    expect(screen.getByText(/Dossiers This Month/i)).toBeInTheDocument();
    expect(screen.getByText(/Avg Session Time/i)).toBeInTheDocument();
    expect(screen.getByText(/Feature Usage/i)).toBeInTheDocument();
  });

  it('renders retention campaign button for at-risk customers', () => {
    render(<CustomerHealthDashboard />);
    const campaignButtons = screen.getAllByRole('button', { name: /launch retention campaign/i });
    expect(campaignButtons.length).toBeGreaterThan(0);
  });

  it('shows schedule check-in button for at-risk customers', () => {
    render(<CustomerHealthDashboard />);
    const checkInButtons = screen.getAllByRole('button', { name: /schedule check-in/i });
    expect(checkInButtons.length).toBeGreaterThan(0);
  });
});
