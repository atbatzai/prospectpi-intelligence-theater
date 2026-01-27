/**
 * Story 7.2: Workflow Automation & Integrations
 * 
 * Zapier integration, webhook configuration, Slack notifications,
 * CRM sync (Salesforce, HubSpot), email triggers
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Zap, Webhook, MessageSquare, Database, Mail, CheckCircle } from 'lucide-react';

interface Integration {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  connected: boolean;
  config?: Record<string, any>;
}

export const IntegrationSettings: React.FC = () => {
  const [integrations, setIntegrations] = useState<Integration[]>([
    {
      id: 'zapier',
      name: 'Zapier',
      icon: <Zap className="h-5 w-5 text-orange-600" />,
      description: 'Connect to 5000+ apps with automated workflows',
      connected: true,
      config: { activeZaps: 12 }
    },
    {
      id: 'slack',
      name: 'Slack',
      icon: <MessageSquare className="h-5 w-5 text-purple-600" />,
      description: 'Receive dossier notifications in Slack channels',
      connected: true,
      config: { channel: '#intelligence-alerts' }
    },
    {
      id: 'salesforce',
      name: 'Salesforce',
      icon: <Database className="h-5 w-5 text-blue-600" />,
      description: 'Sync intelligence with Salesforce accounts',
      connected: false
    },
    {
      id: 'hubspot',
      name: 'HubSpot',
      icon: <Database className="h-5 w-5 text-orange-500" />,
      description: 'Push dossiers to HubSpot contacts and companies',
      connected: false
    }
  ]);

  const [webhooks, setWebhooks] = useState([
    {
      id: '1',
      name: 'Dossier Complete Webhook',
      url: 'https://api.example.com/webhooks/dossier-complete',
      events: ['dossier.completed'],
      active: true
    }
  ]);

  const [newWebhookUrl, setNewWebhookUrl] = useState('');

  const handleToggleIntegration = (integrationId: string) => {
    setIntegrations(
      integrations.map((integration) =>
        integration.id === integrationId
          ? { ...integration, connected: !integration.connected }
          : integration
      )
    );
  };

  const handleAddWebhook = () => {
    if (newWebhookUrl) {
      setWebhooks([
        ...webhooks,
        {
          id: String(webhooks.length + 1),
          name: 'Custom Webhook',
          url: newWebhookUrl,
          events: ['dossier.completed'],
          active: true
        }
      ]);
      setNewWebhookUrl('');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-detective-primary flex items-center gap-2">
          <Zap className="h-6 w-6" />
          Integrations & Automation
        </h2>
        <p className="text-gray-600 mt-1">Connect ProspectPI to your workflow tools</p>
      </div>

      {/* Available Integrations */}
      <Card>
        <CardHeader>
          <CardTitle>Available Integrations</CardTitle>
          <CardDescription>Connect your favorite tools and automate workflows</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {integrations.map((integration) => (
              <div
                key={integration.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {integration.icon}
                  <div>
                    <div className="font-semibold flex items-center gap-2">
                      {integration.name}
                      {integration.connected && (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Connected
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">{integration.description}</div>
                    {integration.config && integration.connected && (
                      <div className="text-xs text-gray-500 mt-1">
                        {integration.id === 'zapier' && `${integration.config.activeZaps} active Zaps`}
                        {integration.id === 'slack' && `Channel: ${integration.config.channel}`}
                      </div>
                    )}
                  </div>
                </div>
                <Button
                  onClick={() => handleToggleIntegration(integration.id)}
                  variant={integration.connected ? 'outline' : 'default'}
                >
                  {integration.connected ? 'Disconnect' : 'Connect'}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Webhooks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Webhook className="h-5 w-5" />
            Webhooks
          </CardTitle>
          <CardDescription>Configure webhook endpoints for event notifications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Existing Webhooks */}
            {webhooks.map((webhook) => (
              <div key={webhook.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-semibold">{webhook.name}</div>
                  <Switch checked={webhook.active} />
                </div>
                <div className="text-sm font-mono text-gray-600 bg-gray-50 p-2 rounded mb-2">
                  {webhook.url}
                </div>
                <div className="flex items-center gap-2">
                  {webhook.events.map((event) => (
                    <Badge key={event} variant="outline" className="text-xs">
                      {event}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}

            {/* Add New Webhook */}
            <div className="p-4 border-2 border-dashed rounded-lg">
              <div className="font-semibold mb-2">Add New Webhook</div>
              <div className="flex gap-2">
                <Input
                  placeholder="https://your-domain.com/webhook"
                  value={newWebhookUrl}
                  onChange={(e) => setNewWebhookUrl(e.target.value)}
                />
                <Button onClick={handleAddWebhook}>
                  <Webhook className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email Triggers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Notifications
          </CardTitle>
          <CardDescription>Configure automatic email alerts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium">Dossier Completion</div>
                <div className="text-sm text-gray-600">Send email when intelligence dossier is ready</div>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium">High-Priority Alerts</div>
                <div className="text-sm text-gray-600">Critical intelligence findings and competitor moves</div>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium">Weekly Digest</div>
                <div className="text-sm text-gray-600">Summary of intelligence activity and insights</div>
              </div>
              <Switch />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
