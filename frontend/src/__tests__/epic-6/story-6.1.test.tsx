/**
 * QA Test Suite: Story 6.1 - Usage Analytics
 * 
 * Test Coverage:
 * - DAU/WAU/MAU metrics display
 * - Feature adoption tracking
 * - Conversion funnel visualization
 * - Engagement metrics
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UsageAnalyticsDashboard } from '@/components/analytics/UsageAnalyticsDashboard';

describe('Story 6.1: Usage Analytics & Insights Dashboard', () => {
  it('renders usage analytics dashboard', () => {
    render(<UsageAnalyticsDashboard />);
    expect(screen.getByText(/Usage Analytics & Insights/i)).toBeInTheDocument();
  });

  it('displays Daily Active Users (DAU) metric', () => {
    render(<UsageAnalyticsDashboard />);
    expect(screen.getByText(/Daily Active Users/i)).toBeInTheDocument();
    expect(screen.getByText(/1,247/)).toBeInTheDocument();
  });

  it('displays Weekly Active Users (WAU) metric', () => {
    render(<UsageAnalyticsDashboard />);
    expect(screen.getByText(/Weekly Active Users/i)).toBeInTheDocument();
    expect(screen.getByText(/5,893/)).toBeInTheDocument();
  });

  it('displays Monthly Active Users (MAU) metric', () => {
    render(<UsageAnalyticsDashboard />);
    expect(screen.getByText(/Monthly Active Users/i)).toBeInTheDocument();
    expect(screen.getByText(/18,432/)).toBeInTheDocument();
  });

  it('shows dossiers generated count', () => {
    render(<UsageAnalyticsDashboard />);
    expect(screen.getByText(/Dossiers Generated/i)).toBeInTheDocument();
    expect(screen.getByText(/3,421/)).toBeInTheDocument();
  });

  it('displays feature adoption rates section', () => {
    render(<UsageAnalyticsDashboard />);
    expect(screen.getByText(/Feature Adoption Rates/i)).toBeInTheDocument();
  });

  it('shows cultural intelligence adoption rate', () => {
    render(<UsageAnalyticsDashboard />);
    expect(screen.getByText(/Cultural Intelligence/i)).toBeInTheDocument();
    expect(screen.getByText(/34%/)).toBeInTheDocument();
  });

  it('displays conversion funnel visualization', () => {
    render(<UsageAnalyticsDashboard />);
    expect(screen.getByText(/Conversion Funnel/i)).toBeInTheDocument();
    expect(screen.getByText(/Signup/i)).toBeInTheDocument();
    expect(screen.getByText(/First Dossier/i)).toBeInTheDocument();
    expect(screen.getByText(/Paid Conversion/i)).toBeInTheDocument();
  });

  it('shows conversion rates for each funnel stage', () => {
    render(<UsageAnalyticsDashboard />);
    expect(screen.getByText(/100%/)).toBeInTheDocument(); // Signup
    expect(screen.getByText(/85%/)).toBeInTheDocument();  // First Dossier
    expect(screen.getByText(/41%/)).toBeInTheDocument();  // Paid Conversion
  });
});
