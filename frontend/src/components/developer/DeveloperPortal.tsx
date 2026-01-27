/**
 * Story 7.1: Public API Platform & Developer Portal
 * 
 * REST API documentation, API key management, rate limiting configuration,
 * SDK downloads, interactive API explorer
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Code, Key, Download, Book, Play, Copy, CheckCircle } from 'lucide-react';

interface APIKey {
  id: string;
  name: string;
  key: string;
  rateLimit: number;
  requestsToday: number;
  created: string;
  lastUsed: string;
}

export const DeveloperPortal: React.FC = () => {
  const [apiKeys, setApiKeys] = useState<APIKey[]>([
    {
      id: '1',
      name: 'Production API',
      key: 'pk_live_abc123***************************',
      rateLimit: 10000,
      requestsToday: 3421,
      created: '2025-01-15',
      lastUsed: '2 minutes ago'
    },
    {
      id: '2',
      name: 'Development API',
      key: 'pk_test_xyz789***************************',
      rateLimit: 1000,
      requestsToday: 147,
      created: '2025-12-10',
      lastUsed: '3 hours ago'
    }
  ]);

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopyKey = (keyId: string, key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(keyId);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleGenerateKey = () => {
    const newKey: APIKey = {
      id: String(apiKeys.length + 1),
      name: 'New API Key',
      key: `pk_live_${Math.random().toString(36).substring(2, 15)}***************************`,
      rateLimit: 5000,
      requestsToday: 0,
      created: new Date().toISOString().split('T')[0],
      lastUsed: 'Never'
    };
    setApiKeys([...apiKeys, newKey]);
  };

  const endpointExamples = [
    {
      method: 'POST',
      endpoint: '/api/v1/research/generate-dossier',
      description: 'Generate a new intelligence dossier for a company'
    },
    {
      method: 'GET',
      endpoint: '/api/v1/dossiers/:id',
      description: 'Retrieve a completed dossier by ID'
    },
    {
      method: 'GET',
      endpoint: '/api/v1/health',
      description: 'Check API health and status'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-detective-primary flex items-center gap-2">
          <Code className="h-6 w-6" />
          Developer Portal
        </h2>
        <p className="text-gray-600 mt-1">Build integrations with the ProspectPI API</p>
      </div>

      {/* Quick Start */}
      <Card className="border-detective-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Book className="h-5 w-5" />
            Getting Started
          </CardTitle>
          <CardDescription>Integrate ProspectPI intelligence into your applications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-auto flex-col items-start p-4">
              <Book className="h-5 w-5 mb-2" />
              <div className="font-semibold mb-1">API Documentation</div>
              <div className="text-xs text-gray-600 text-left">Complete API reference and guides</div>
            </Button>
            <Button variant="outline" className="h-auto flex-col items-start p-4">
              <Download className="h-5 w-5 mb-2" />
              <div className="font-semibold mb-1">Download SDK</div>
              <div className="text-xs text-gray-600 text-left">JavaScript, Python, Ruby, Go</div>
            </Button>
            <Button variant="outline" className="h-auto flex-col items-start p-4">
              <Play className="h-5 w-5 mb-2" />
              <div className="font-semibold mb-1">Try Interactive API</div>
              <div className="text-xs text-gray-600 text-left">Test API calls in your browser</div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* API Keys */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                API Keys
              </CardTitle>
              <CardDescription>Manage your API authentication keys</CardDescription>
            </div>
            <Button onClick={handleGenerateKey}>
              <Key className="h-4 w-4 mr-2" />
              Generate New Key
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {apiKeys.map((apiKey) => {
              const usagePercent = (apiKey.requestsToday / apiKey.rateLimit) * 100;
              return (
                <div key={apiKey.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="font-semibold">{apiKey.name}</div>
                      <div className="text-sm text-gray-600">Created {apiKey.created}</div>
                    </div>
                    <Badge variant="outline">Last used: {apiKey.lastUsed}</Badge>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <Input
                      value={apiKey.key}
                      readOnly
                      className="font-mono text-sm bg-gray-50"
                    />
                    <Button
                      onClick={() => handleCopyKey(apiKey.id, apiKey.key)}
                      size="sm"
                      variant="outline"
                    >
                      {copiedKey === apiKey.id ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Usage Today</span>
                      <span className="font-semibold">
                        {apiKey.requestsToday.toLocaleString()} / {apiKey.rateLimit.toLocaleString()} requests
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          usagePercent > 80 ? 'bg-red-600' : usagePercent > 50 ? 'bg-yellow-600' : 'bg-green-600'
                        }`}
                        style={{ width: `${usagePercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* API Endpoints */}
      <Card>
        <CardHeader>
          <CardTitle>API Endpoints</CardTitle>
          <CardDescription>Available REST API endpoints</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {endpointExamples.map((endpoint, index) => (
              <div key={index} className="p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3 mb-2">
                  <Badge
                    className={
                      endpoint.method === 'POST'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-blue-100 text-blue-800'
                    }
                  >
                    {endpoint.method}
                  </Badge>
                  <code className="text-sm font-mono text-detective-primary">{endpoint.endpoint}</code>
                </div>
                <div className="text-sm text-gray-600">{endpoint.description}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
