/**
 * ProspectPI Intelligence Theater - GDPR Data Export
 * Right to Access - Data Portability Component
 */

import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface UserDataExport {
  user_profile: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    created_at: string;
    last_login: string | null;
    data_region: string | null;
  };
  consent_records: {
    marketing: boolean;
    analytics: boolean;
    data_processing: boolean;
    consent_date: string | null;
  };
  activity_log: any[];
  dossier_requests: any[];
  api_usage: any[];
}

export const DataExport: React.FC = () => {
  const [exporting, setExporting] = useState(false);
  const [exportData, setExportData] = useState<UserDataExport | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error' | null>(null);

  const requestDataExport = async () => {
    setExporting(true);
    setMessage(null);
    setExportData(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/privacy/export`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setExportData(data.data);
        setMessage('Your data has been successfully exported. You can download it below.');
        setMessageType('success');
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to export data');
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to export data');
      setMessageType('error');
    } finally {
      setExporting(false);
    }
  };

  const downloadAsJSON = () => {
    if (!exportData) return;

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `prospectpi-data-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const generateDataSummary = () => {
    if (!exportData) return null;

    const {
      user_profile,
      consent_records,
      activity_log,
      dossier_requests,
      api_usage
    } = exportData;

    return (
      <div className="space-y-4 text-sm">
        <div className="bg-blue-50 p-4 rounded-md">
          <h4 className="font-semibold text-blue-900 mb-2">Data Export Summary</h4>
          <div className="grid grid-cols-2 gap-4 text-blue-800">
            <div>
              <span className="font-medium">Profile:</span> {user_profile.email}
            </div>
            <div>
              <span className="font-medium">Member Since:</span> {new Date(user_profile.created_at).toLocaleDateString()}
            </div>
            <div>
              <span className="font-medium">Research Requests:</span> {dossier_requests.length}
            </div>
            <div>
              <span className="font-medium">API Calls:</span> {api_usage.length}
            </div>
            <div>
              <span className="font-medium">Activity Records:</span> {activity_log.length}
            </div>
            <div>
              <span className="font-medium">Data Region:</span> {user_profile.data_region || 'US'}
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-gray-900 mb-2">Consent Status</h4>
          <div className="grid grid-cols-3 gap-2">
            <div className={`p-2 rounded text-xs text-center ${
              consent_records.data_processing ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              <div className="font-medium">Essential</div>
              <div>{consent_records.data_processing ? 'Granted' : 'Denied'}</div>
            </div>
            <div className={`p-2 rounded text-xs text-center ${
              consent_records.analytics ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
            }`}>
              <div className="font-medium">Analytics</div>
              <div>{consent_records.analytics ? 'Granted' : 'Denied'}</div>
            </div>
            <div className={`p-2 rounded text-xs text-center ${
              consent_records.marketing ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
            }`}>
              <div className="font-medium">Marketing</div>
              <div>{consent_records.marketing ? 'Granted' : 'Denied'}</div>
            </div>
          </div>
        </div>

        {dossier_requests.length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Recent Research Requests</h4>
            <div className="bg-gray-50 p-3 rounded-md max-h-40 overflow-y-auto">
              {dossier_requests.slice(0, 5).map((request: any, index: number) => (
                <div key={index} className="text-xs py-1 border-b last:border-b-0 border-gray-200">
                  <span className="font-medium">{request.company_name}</span>
                  <span className="text-gray-600 ml-2">
                    {new Date(request.created_at).toLocaleDateString()}
                  </span>
                  <span className={`ml-2 px-2 py-0.5 rounded text-xs ${
                    request.status === 'completed' ? 'bg-green-100 text-green-800' :
                    request.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {request.status}
                  </span>
                </div>
              ))}
              {dossier_requests.length > 5 && (
                <div className="text-xs text-gray-600 pt-2">
                  +{dossier_requests.length - 5} more requests in full export
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span>📥</span>
          <span>Export Your Data</span>
        </CardTitle>
        <p className="text-sm text-gray-600">
          Download all your personal data in a portable JSON format. 
          This includes your profile, research history, and activity logs.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {message && (
          <div className={`p-3 rounded-md text-sm ${
            messageType === 'success' 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message}
          </div>
        )}

        <div className="bg-gray-50 p-4 rounded-md">
          <h3 className="font-semibold text-gray-900 mb-2">What's Included</h3>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• User profile information (name, email, preferences)</li>
            <li>• Research request history and dossier metadata</li>
            <li>• Consent preferences and data processing records</li>
            <li>• Account activity logs and API usage statistics</li>
            <li>• Regional data processing information</li>
          </ul>
        </div>

        <div className="bg-blue-50 p-4 rounded-md">
          <h3 className="font-semibold text-blue-900 mb-2">🔐 Privacy & Security</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• No sensitive data included (passwords, payment info)</li>
            <li>• Company intelligence data is business-focused, not personal</li>
            <li>• Export request is logged for audit compliance</li>
            <li>• Data is provided in standard JSON format for portability</li>
          </ul>
        </div>

        {exportData && generateDataSummary()}

        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-xs text-gray-600">
            {exportData ? (
              <>Export completed on {new Date().toLocaleString()}</>
            ) : (
              <>No recent exports</>
            )}
          </div>
          
          <div className="space-x-2">
            {exportData && (
              <Button
                variant="outline"
                size="sm"
                onClick={downloadAsJSON}
                className="bg-green-50 hover:bg-green-100 text-green-700"
              >
                📄 Download JSON
              </Button>
            )}
            
            <Button
              onClick={requestDataExport}
              disabled={exporting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {exporting ? (
                <>⏳ Exporting...</>
              ) : (
                <>🚀 Export My Data</>
              )}
            </Button>
          </div>
        </div>

        <div className="text-xs text-gray-500 border-t pt-4">
          <strong>GDPR Article 15 & 20 Compliance:</strong> This export fulfills your right to access 
          and data portability under GDPR. The data is provided in a structured, commonly used, 
          machine-readable format. For questions, contact privacy@prospectpi.com
        </div>
      </CardContent>
    </Card>
  );
};