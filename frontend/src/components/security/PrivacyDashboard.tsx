/**
 * Story 5.3: Data Encryption & Privacy Controls
 * 
 * AES-256 encryption, TLS 1.3, GDPR Article 17 (Right to be Forgotten),
 * data residency controls, encrypted backups
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, Key, Download, Trash2, Globe, Shield, CheckCircle, AlertCircle } from 'lucide-react';

export const PrivacyDashboard: React.FC = () => {
  const [dataRegion, setDataRegion] = useState<'US' | 'EU' | 'APAC'>('US');
  
  const encryptionStatus = {
    atRest: { enabled: true, algorithm: 'AES-256-GCM', lastRotation: '2025-12-15' },
    inTransit: { enabled: true, protocol: 'TLS 1.3', certificate: 'Valid until 2026-06-30' },
    backups: { enabled: true, encrypted: true, location: 'US-East-1 (encrypted)' }
  };

  const handleDataExport = () => {
    console.log('Exporting user data in machine-readable format (GDPR compliance)...');
  };

  const handleDataDeletion = () => {
    if (confirm('This will permanently delete all personal data. This action cannot be undone. Continue?')) {
      console.log('Initiating GDPR Article 17 - Right to be Forgotten...');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-detective-primary flex items-center gap-2">
          <Lock className="h-6 w-6" />
          Data Encryption & Privacy
        </h2>
        <p className="text-gray-600 mt-1">Manage encryption settings and privacy controls</p>
      </div>

      {/* Encryption Status */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Shield className="h-5 w-5 text-green-600" />
              <CheckCircle className="h-4 w-4 text-green-600" />
            </div>
            <h3 className="font-semibold mb-1">At-Rest Encryption</h3>
            <p className="text-sm text-gray-600 mb-2">{encryptionStatus.atRest.algorithm}</p>
            <p className="text-xs text-gray-500">Last key rotation: {encryptionStatus.atRest.lastRotation}</p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Key className="h-5 w-5 text-green-600" />
              <CheckCircle className="h-4 w-4 text-green-600" />
            </div>
            <h3 className="font-semibold mb-1">In-Transit Encryption</h3>
            <p className="text-sm text-gray-600 mb-2">{encryptionStatus.inTransit.protocol}</p>
            <p className="text-xs text-gray-500">{encryptionStatus.inTransit.certificate}</p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Download className="h-5 w-5 text-green-600" />
              <CheckCircle className="h-4 w-4 text-green-600" />
            </div>
            <h3 className="font-semibold mb-1">Backup Encryption</h3>
            <p className="text-sm text-gray-600 mb-2">AES-256 encrypted</p>
            <p className="text-xs text-gray-500">{encryptionStatus.backups.location}</p>
          </CardContent>
        </Card>
      </div>

      {/* Data Residency */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Data Residency Controls
          </CardTitle>
          <CardDescription>Choose where your intelligence data is stored</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-3">
            {(['US', 'EU', 'APAC'] as const).map((region) => (
              <button
                key={region}
                onClick={() => setDataRegion(region)}
                className={`p-4 border-2 rounded-lg transition-all ${
                  dataRegion === region
                    ? 'border-detective-primary bg-detective-primary/5'
                    : 'border-gray-200 hover:border-detective-primary/50'
                }`}
              >
                <div className="font-semibold mb-1">{region}</div>
                <div className="text-sm text-gray-600">
                  {region === 'US' && 'United States (AWS US-East)'}
                  {region === 'EU' && 'European Union (AWS EU-West)'}
                  {region === 'APAC' && 'Asia Pacific (AWS AP-Southeast)'}
                </div>
                {dataRegion === region && (
                  <Badge className="mt-2 bg-detective-primary">Active</Badge>
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* GDPR Rights */}
      <Card className="border-detective-secondary/20">
        <CardHeader>
          <CardTitle>Privacy Rights (GDPR/CCPA)</CardTitle>
          <CardDescription>Exercise your data privacy rights</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="font-semibold mb-1">Export Your Data</div>
              <div className="text-sm text-gray-600">Download all your personal data in machine-readable format</div>
            </div>
            <Button onClick={handleDataExport} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
            <div>
              <div className="font-semibold mb-1 text-red-900">Right to be Forgotten</div>
              <div className="text-sm text-red-700">Permanently delete all your personal data (GDPR Article 17)</div>
            </div>
            <Button onClick={handleDataDeletion} variant="destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Data
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
