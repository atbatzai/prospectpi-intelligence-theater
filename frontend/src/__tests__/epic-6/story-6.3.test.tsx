/**
 * QA Test Suite: Story 6.3 - Revenue & Cost Analytics
 * 
 * Test Coverage:
 * - MRR/ARR tracking
 * - Customer LTV calculation
 * - LTV:CAC ratio monitoring
 * - Burn rate and runway metrics
 * - Revenue breakdown by plan
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RevenueAnalyticsDashboard } from '@/components/analytics/RevenueAnalyticsDashboard';

describe('Story 6.3: Revenue & Cost Analytics', () => {
  it('renders revenue analytics dashboard', () => {
    render(<RevenueAnalyticsDashboard />);
    expect(screen.getByText(/Revenue & Cost Analytics/i)).toBeInTheDocument();
  });

  it('displays Monthly Recurring Revenue (MRR)', () => {
    render(<RevenueAnalyticsDashboard />);
    expect(screen.getByText(/Monthly Recurring Revenue/i)).toBeInTheDocument();
    expect(screen.getByText(/\$147\.9K/)).toBeInTheDocument();
  });

  it('shows Annual Recurring Revenue (ARR)', () => {
    render(<RevenueAnalyticsDashboard />);
    expect(screen.getByText(/Annual Recurring Revenue/i)).toBeInTheDocument();
    expect(screen.getByText(/\$1\.77M/)).toBeInTheDocument();
  });

  it('displays Customer Lifetime Value (LTV)', () => {
    render(<RevenueAnalyticsDashboard />);
    expect(screen.getByText(/Customer Lifetime Value/i)).toBeInTheDocument();
    expect(screen.getByText(/\$8\.9K/)).toBeInTheDocument();
  });

  it('shows burn rate and runway', () => {
    render(<RevenueAnalyticsDashboard />);
    expect(screen.getByText(/Monthly Burn Rate/i)).toBeInTheDocument();
    expect(screen.getByText(/\$45\.3K/)).toBeInTheDocument();
    expect(screen.getByText(/18 months/)).toBeInTheDocument();
  });

  it('displays revenue breakdown by plan', () => {
    render(<RevenueAnalyticsDashboard />);
    expect(screen.getByText(/Revenue Breakdown by Plan/i)).toBeInTheDocument();
    expect(screen.getByText(/Enterprise/i)).toBeInTheDocument();
    expect(screen.getByText(/Professional/i)).toBeInTheDocument();
    expect(screen.getByText(/Starter/i)).toBeInTheDocument();
  });

  it('shows customer counts per plan', () => {
    render(<RevenueAnalyticsDashboard />);
    expect(screen.getByText(/12 customers/i)).toBeInTheDocument();
    expect(screen.getByText(/45 customers/i)).toBeInTheDocument();
    expect(screen.getByText(/134 customers/i)).toBeInTheDocument();
  });

  it('displays unit economics (CAC, LTV, LTV:CAC ratio)', () => {
    render(<RevenueAnalyticsDashboard />);
    expect(screen.getByText(/Unit Economics/i)).toBeInTheDocument();
    expect(screen.getByText(/Customer Acquisition Cost \(CAC\)/i)).toBeInTheDocument();
    expect(screen.getByText(/\$1250/)).toBeInTheDocument();
    expect(screen.getByText(/7\.1:1/)).toBeInTheDocument();
  });

  it('shows growth metrics section', () => {
    render(<RevenueAnalyticsDashboard />);
    expect(screen.getByText(/Growth Metrics/i)).toBeInTheDocument();
    expect(screen.getByText(/MRR Growth Rate/i)).toBeInTheDocument();
    expect(screen.getByText(/\+23\.4%/)).toBeInTheDocument();
  });

  it('displays expansion and churned MRR', () => {
    render(<RevenueAnalyticsDashboard />);
    expect(screen.getByText(/Expansion MRR/i)).toBeInTheDocument();
    expect(screen.getByText(/Churned MRR/i)).toBeInTheDocument();
  });
});
