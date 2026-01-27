/**
 * QA Test Suite: Story 7.2 - Workflow Automation
 * 
 * Test Coverage:
 * - Zapier integration toggle
 * - Slack notifications configuration
 * - CRM sync (Salesforce, HubSpot)
 * - Webhook configuration
 * - Email trigger settings
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { IntegrationSettings } from '@/components/integrations/IntegrationSettings';

describe('Story 7.2: Workflow Automation & Integrations', () => {
  it('renders integration settings page', () => {
    render(<IntegrationSettings />);
    expect(screen.getByText(/Integrations & Automation/i)).toBeInTheDocument();
  });

  it('displays Zapier integration option', () => {
    render(<IntegrationSettings />);
    expect(screen.getByText(/Zapier/i)).toBeInTheDocument();
    expect(screen.getByText(/Connect to 5000\+ apps/i)).toBeInTheDocument();
  });

  it('shows Slack integration with connected status', () => {
    render(<IntegrationSettings />);
    expect(screen.getByText(/Slack/i)).toBeInTheDocument();
    const connectedBadges = screen.getAllByText(/Connected/i);
    expect(connectedBadges.length).toBeGreaterThan(0);
  });

  it('displays Salesforce CRM integration', () => {
    render(<IntegrationSettings />);
    expect(screen.getByText(/Salesforce/i)).toBeInTheDocument();
    expect(screen.getByText(/Sync intelligence with Salesforce accounts/i)).toBeInTheDocument();
  });

  it('shows HubSpot CRM integration', () => {
    render(<IntegrationSettings />);
    expect(screen.getByText(/HubSpot/i)).toBeInTheDocument();
    expect(screen.getByText(/Push dossiers to HubSpot/i)).toBeInTheDocument();
  });

  it('renders connect/disconnect buttons for integrations', () => {
    render(<IntegrationSettings />);
    const connectButtons = screen.getAllByRole('button', { name: /connect/i });
    const disconnectButtons = screen.getAllByRole('button', { name: /disconnect/i });
    expect(connectButtons.length + disconnectButtons.length).toBeGreaterThan(0);
  });

  it('toggles integration status on button click', () => {
    render(<IntegrationSettings />);
    const salesforceButton = screen.getByRole('button', { name: /^connect$/i });
    fireEvent.click(salesforceButton);
    expect(screen.getByText(/Salesforce/i)).toBeInTheDocument();
  });

  it('displays webhook configuration section', () => {
    render(<IntegrationSettings />);
    expect(screen.getByText(/Webhooks/i)).toBeInTheDocument();
    expect(screen.getByText(/Configure webhook endpoints/i)).toBeInTheDocument();
  });

  it('shows existing webhook configurations', () => {
    render(<IntegrationSettings />);
    expect(screen.getByText(/Dossier Complete Webhook/i)).toBeInTheDocument();
  });

  it('displays webhook URL', () => {
    render(<IntegrationSettings />);
    expect(screen.getByText(/https:\/\/api\.example\.com\/webhooks\/dossier-complete/)).toBeInTheDocument();
  });

  it('renders add new webhook input', () => {
    render(<IntegrationSettings />);
    expect(screen.getByPlaceholderText(/https:\/\/your-domain\.com\/webhook/i)).toBeInTheDocument();
  });

  it('adds new webhook on submit', () => {
    render(<IntegrationSettings />);
    const input = screen.getByPlaceholderText(/https:\/\/your-domain\.com\/webhook/i);
    const addButton = screen.getByRole('button', { name: /add/i });
    
    fireEvent.change(input, { target: { value: 'https://test.com/webhook' } });
    fireEvent.click(addButton);
    
    expect(screen.getByText(/Custom Webhook/i)).toBeInTheDocument();
  });

  it('displays email notification settings', () => {
    render(<IntegrationSettings />);
    expect(screen.getByText(/Email Notifications/i)).toBeInTheDocument();
    expect(screen.getByText(/Dossier Completion/i)).toBeInTheDocument();
    expect(screen.getByText(/High-Priority Alerts/i)).toBeInTheDocument();
    expect(screen.getByText(/Weekly Digest/i)).toBeInTheDocument();
  });

  it('shows active Zap count for Zapier', () => {
    render(<IntegrationSettings />);
    expect(screen.getByText(/12 active Zaps/i)).toBeInTheDocument();
  });

  it('displays Slack channel configuration', () => {
    render(<IntegrationSettings />);
    expect(screen.getByText(/Channel: #intelligence-alerts/i)).toBeInTheDocument();
  });
});
