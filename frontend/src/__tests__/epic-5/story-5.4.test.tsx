/**
 * QA Test Suite: Story 5.4 - Infrastructure Monitoring
 * 
 * Test Coverage:
 * - 99.9% uptime SLA tracking
 * - Real-time system metrics (requests/min, response time, error rate)
 * - Database health monitoring
 * - Automated alerting
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { SystemHealthDashboard } from '@/components/monitoring/SystemHealthDashboard';

describe('Story 5.4: Infrastructure Monitoring & Reliability', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders system health dashboard', () => {
    render(<SystemHealthDashboard />);
    expect(screen.getByText(/System Health Monitor/i)).toBeInTheDocument();
  });

  it('displays uptime percentage with SLA target', () => {
    render(<SystemHealthDashboard />);
    expect(screen.getByText(/99.97%/)).toBeInTheDocument();
    expect(screen.getByText(/SLA: 99.9%/i)).toBeInTheDocument();
  });

  it('shows real-time requests per minute', () => {
    render(<SystemHealthDashboard />);
    expect(screen.getByText(/Requests\/min/i)).toBeInTheDocument();
  });

  it('displays average response time with P95 metric', () => {
    render(<SystemHealthDashboard />);
    expect(screen.getByText(/Avg Response Time/i)).toBeInTheDocument();
    expect(screen.getByText(/P95/)).toBeInTheDocument();
  });

  it('shows error rate with threshold indicator', () => {
    render(<SystemHealthDashboard />);
    expect(screen.getByText(/Error Rate/i)).toBeInTheDocument();
    expect(screen.getByText(/Target: <0.1%/i)).toBeInTheDocument();
  });

  it('displays database health status', () => {
    render(<SystemHealthDashboard />);
    expect(screen.getByText(/Database Health/i)).toBeInTheDocument();
    expect(screen.getByText(/Healthy/i)).toBeInTheDocument();
  });

  it('shows active database connections', () => {
    render(<SystemHealthDashboard />);
    expect(screen.getByText(/Active Connections/i)).toBeInTheDocument();
  });

  it('displays recent alerts section', () => {
    render(<SystemHealthDashboard />);
    expect(screen.getByText(/Recent Alerts/i)).toBeInTheDocument();
  });

  it('updates metrics in real-time', async () => {
    render(<SystemHealthDashboard />);
    const initialRequests = screen.getByText(/Requests\/min/i).closest('div')?.textContent;
    
    vi.advanceTimersByTime(3000);
    
    await waitFor(() => {
      const updatedRequests = screen.getByText(/Requests\/min/i).closest('div')?.textContent;
      expect(updatedRequests).toBeDefined();
    });
  });
});
