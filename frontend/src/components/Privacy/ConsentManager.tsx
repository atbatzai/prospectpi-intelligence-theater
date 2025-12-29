/**
 * ProspectPI Intelligence Theater - GDPR Consent Manager
 * Minimal GDPR Compliance - User Consent Dashboard
 */

import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';

interface ConsentPreferences {
  marketing: boolean;
  analytics: boolean;
  data_processing: boolean;
  consent_date: string | null;
  data_region: string | null;
}

interface ConsentManagerProps {
  userId?: string;
  onConsentUpdate?: (preferences: ConsentPreferences) => void;
}

export const ConsentManager: React.FC<ConsentManagerProps> = ({ 
  userId, 
  onConsentUpdate 
}) => {
  const [preferences, setPreferences] = useState<ConsentPreferences>({
    marketing: false,
    analytics: false,
    data_processing: true,
    consent_date: null,
    data_region: 'US'
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error' | null>(null);

  useEffect(() => {
    loadConsentPreferences();
  }, []);

  const loadConsentPreferences = async () => {
    try {
      const response = await fetch('/api/v1/privacy/consent', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setPreferences({
          marketing: data.consent.marketing,
          analytics: data.consent.analytics,
          data_processing: data.consent.data_processing,
          consent_date: data.consent.consent_date,
          data_region: data.consent.data_region
        });
      }
    } catch (error) {
      console.error('Failed to load consent preferences:', error);
    }
  };

  const updateConsent = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/v1/privacy/consent', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          consent_marketing: preferences.marketing,
          consent_analytics: preferences.analytics,
          data_processing_consent: preferences.data_processing
        })
      });

      if (response.ok) {
        setMessage('Consent preferences updated successfully');
        setMessageType('success');
        onConsentUpdate?.(preferences);
        
        // Reload to get updated consent_date
        await loadConsentPreferences();
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update consent');
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to update consent');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const updateDataRegion = async (region: string) => {
    try {
      const response = await fetch('/api/v1/privacy/region', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ region })
      });

      if (response.ok) {
        setPreferences(prev => ({ ...prev, data_region: region }));
        setMessage(`Data processing region updated to ${region}`);
        setMessageType('success');
      }
    } catch (error) {
      setMessage('Failed to update data region');
      setMessageType('error');
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span>🔒</span>
          <span>Privacy & Consent Preferences</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {message && (
          <div className={`p-3 rounded-md text-sm ${
            messageType === 'success' 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message}
          </div>
        )}

        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900">Data Processing Consent</h3>
          
          <div className="space-y-3">
            <label className="flex items-start space-x-3">
              <input
                type="checkbox"
                checked={preferences.data_processing}
                onChange={(e) => setPreferences(prev => ({ 
                  ...prev, 
                  data_processing: e.target.checked 
                }))}
                className="mt-1 h-4 w-4 text-blue-600"
              />
              <div>
                <span className="text-sm font-medium text-gray-900">
                  Essential Data Processing (Required)
                </span>
                <p className="text-xs text-gray-600">
                  Required for account management and B2B intelligence services. 
                  Includes: account data, research requests, security logs.
                </p>
              </div>
            </label>

            <label className="flex items-start space-x-3">
              <input
                type="checkbox"
                checked={preferences.analytics}
                onChange={(e) => setPreferences(prev => ({ 
                  ...prev, 
                  analytics: e.target.checked 
                }))}
                className="mt-1 h-4 w-4 text-blue-600"
              />
              <div>
                <span className="text-sm font-medium text-gray-900">
                  Analytics & Performance (Optional)
                </span>
                <p className="text-xs text-gray-600">
                  Help us improve the platform by analyzing usage patterns. 
                  All data is anonymized and aggregated.
                </p>
              </div>
            </label>

            <label className="flex items-start space-x-3">
              <input
                type="checkbox"
                checked={preferences.marketing}
                onChange={(e) => setPreferences(prev => ({ 
                  ...prev, 
                  marketing: e.target.checked 
                }))}
                className="mt-1 h-4 w-4 text-blue-600"
              />
              <div>
                <span className="text-sm font-medium text-gray-900">
                  Marketing Communications (Optional)
                </span>
                <p className="text-xs text-gray-600">
                  Receive product updates, feature announcements, and best practices. 
                  You can unsubscribe anytime.
                </p>
              </div>
            </label>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900">Data Processing Region</h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              { code: 'US', label: 'United States', framework: 'CCPA/SOC2' },
              { code: 'EU', label: 'European Union', framework: 'GDPR' },
              { code: 'UK', label: 'United Kingdom', framework: 'UK-GDPR' },
              { code: 'CA', label: 'Canada', framework: 'PIPEDA' }
            ].map(region => (
              <button
                key={region.code}
                onClick={() => updateDataRegion(region.code)}
                className={`p-2 text-left border rounded-md text-sm transition-colors ${
                  preferences.data_region === region.code
                    ? 'bg-blue-50 border-blue-300 text-blue-900'
                    : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="font-medium">{region.label}</div>
                <div className="text-xs text-gray-600">{region.framework}</div>
              </button>
            ))}
          </div>
        </div>

        {preferences.consent_date && (
          <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded-md">
            <strong>Last Updated:</strong> {new Date(preferences.consent_date).toLocaleString()}
          </div>
        )}

        <div className="flex justify-between items-center pt-4 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={loadConsentPreferences}
          >
            Reload Preferences
          </Button>
          
          <Button
            onClick={updateConsent}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? 'Updating...' : 'Save Preferences'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};