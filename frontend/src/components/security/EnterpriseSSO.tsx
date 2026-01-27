/**
 * Story 5.1: Enterprise Authentication & SSO
 * 
 * SAML 2.0 and OIDC SSO integration with Azure AD, Okta, Google Workspace
 * Automatic user provisioning, MFA enforcement, session management
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, Key, Users, Clock, AlertCircle, CheckCircle } from 'lucide-react';

interface SSOProvider {
  id: string;
  name: string;
  type: 'SAML' | 'OIDC';
  status: 'active' | 'inactive' | 'pending';
  userCount: number;
}

interface SSOConfiguration {
  provider: string;
  entityId: string;
  ssoUrl: string;
  certificate: string;
  mfaRequired: boolean;
  sessionTimeout: number;
  autoProvisioning: boolean;
}

export const EnterpriseSSO: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'providers' | 'configuration' | 'sessions'>('providers');
  const [selectedProvider, setSelectedProvider] = useState<string>('');

  const providers: SSOProvider[] = [
    { id: 'azure-ad', name: 'Azure Active Directory', type: 'SAML', status: 'active', userCount: 152 },
    { id: 'okta', name: 'Okta', type: 'SAML', status: 'inactive', userCount: 0 },
    { id: 'google', name: 'Google Workspace', type: 'OIDC', status: 'active', userCount: 87 }
  ];

  const [config, setConfig] = useState<SSOConfiguration>({
    provider: 'azure-ad',
    entityId: 'https://prospectpi.com/saml',
    ssoUrl: 'https://login.microsoftonline.com/...',
    certificate: '-----BEGIN CERTIFICATE-----\n...',
    mfaRequired: true,
    sessionTimeout: 480,
    autoProvisioning: true
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-detective-primary flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Enterprise SSO Configuration
          </h2>
          <p className="text-gray-600 mt-1">Manage single sign-on integrations and security policies</p>
        </div>
        <Button className="bg-detective-primary hover:bg-detective-primary/90">
          <Key className="h-4 w-4 mr-2" />
          Add SSO Provider
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {(['providers', 'configuration', 'sessions'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 capitalize ${
              activeTab === tab
                ? 'border-b-2 border-detective-primary text-detective-primary font-semibold'
                : 'text-gray-600 hover:text-detective-primary'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Providers Tab */}
      {activeTab === 'providers' && (
        <div className="grid gap-4">
          {providers.map((provider) => (
            <Card key={provider.id} className="border-detective-primary/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-detective-primary/10 rounded-lg flex items-center justify-center">
                      <Shield className="h-6 w-6 text-detective-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{provider.name}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {provider.type}
                        </Badge>
                        <span className="text-sm text-gray-600">
                          {provider.userCount} users
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      className={provider.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                    >
                      {provider.status === 'active' ? (
                        <><CheckCircle className="h-3 w-3 mr-1" /> Active</>
                      ) : (
                        <><AlertCircle className="h-3 w-3 mr-1" /> Inactive</>
                      )}
                    </Badge>
                    <Button variant="outline" size="sm">
                      Configure
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Configuration Tab */}
      {activeTab === 'configuration' && (
        <Card>
          <CardHeader>
            <CardTitle>SSO Configuration</CardTitle>
            <CardDescription>Configure SAML/OIDC settings and security policies</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">SSO Provider</label>
              <Select value={config.provider} onValueChange={(v) => setConfig({...config, provider: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {providers.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Entity ID</label>
              <Input value={config.entityId} onChange={(e) => setConfig({...config, entityId: e.target.value})} />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">SSO URL</label>
              <Input value={config.ssoUrl} onChange={(e) => setConfig({...config, ssoUrl: e.target.value})} />
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium">Require Multi-Factor Authentication</div>
                <div className="text-sm text-gray-600">Enforce MFA for all SSO users</div>
              </div>
              <input
                type="checkbox"
                checked={config.mfaRequired}
                onChange={(e) => setConfig({...config, mfaRequired: e.target.checked})}
                className="h-4 w-4"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium">Auto-Provisioning</div>
                <div className="text-sm text-gray-600">Automatically create user accounts</div>
              </div>
              <input
                type="checkbox"
                checked={config.autoProvisioning}
                onChange={(e) => setConfig({...config, autoProvisioning: e.target.checked})}
                className="h-4 w-4"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Session Timeout (minutes)</label>
              <Input
                type="number"
                value={config.sessionTimeout}
                onChange={(e) => setConfig({...config, sessionTimeout: parseInt(e.target.value)})}
              />
            </div>

            <Button className="w-full bg-detective-primary hover:bg-detective-primary/90">
              Save Configuration
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Sessions Tab */}
      {activeTab === 'sessions' && (
        <Card>
          <CardHeader>
            <CardTitle>Active SSO Sessions</CardTitle>
            <CardDescription>Monitor and manage active user sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Users className="h-4 w-4 text-gray-600" />
                    <div>
                      <div className="font-medium">user{i}@company.com</div>
                      <div className="text-sm text-gray-600 flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        Active for 2h {i * 15}m
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Revoke Session
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
