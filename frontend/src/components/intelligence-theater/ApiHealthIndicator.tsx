'use client';

import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface ApiSource {
  name: string;
  status: 'up' | 'down' | 'unknown';
  responseTime?: number;
  error?: string;
}

interface ApiHealthData {
  status: 'operational' | 'degraded' | 'critical';
  healthy: number;
  total: number;
  sources: ApiSource[];
}

interface ApiHealthIndicatorProps {
  refreshInterval?: number;
}

export const ApiHealthIndicator: React.FC<ApiHealthIndicatorProps> = ({ 
  refreshInterval = 30000 
}) => {
  const [healthData, setHealthData] = useState<ApiHealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchHealth = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      const data = await response.json();
      
      if (data.apiSources) {
        setHealthData(data.apiSources);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Failed to fetch API health:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'up':
        return <CheckCircle2 className='h-4 w-4 text-green-600' />;
      case 'down':
        return <XCircle className='h-4 w-4 text-red-600' />;
      default:
        return <AlertCircle className='h-4 w-4 text-gray-400' />;
    }
  };

  const getOverallBadge = () => {
    if (!healthData) return null;
    
    const variants = {
      operational: 'bg-green-100 text-green-800',
      degraded: 'bg-yellow-100 text-yellow-800',
      critical: 'bg-red-100 text-red-800'
    };
    
    return (
      <Badge className={`${variants[healthData.status]} text-xs`}>
        {healthData.healthy}/{healthData.total} Sources Active
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className='flex items-center gap-2 text-sm text-gray-500'>
        <Loader2 className='h-4 w-4 animate-spin' />
        <span>Checking API sources...</span>
      </div>
    );
  }

  if (!healthData) return null;

  return (
    <div className='space-y-3'>
      <div className='flex items-center justify-between'>
        <h4 className='text-sm font-medium text-gray-700'>Data Source Status</h4>
        {getOverallBadge()}
      </div>

      <div className='grid grid-cols-2 gap-2'>
        {healthData.sources.map((source) => (
          <div 
            key={source.name}
            className='flex items-center justify-between p-2 bg-gray-50 rounded border text-sm'
          >
            <div className='flex items-center gap-2'>
              {getStatusIcon(source.status)}
              <span className='font-medium text-gray-900'>{source.name}</span>
            </div>
            {source.responseTime && source.status === 'up' && (
              <span className='text-xs text-gray-500'>{source.responseTime}ms</span>
            )}
            {source.error && (
              <span className='text-xs text-red-600 truncate max-w-[100px]' title={source.error}>
                Error
              </span>
            )}
          </div>
        ))}
      </div>

      {lastUpdate && (
        <p className='text-xs text-gray-500 text-center'>
          Last checked: {lastUpdate.toLocaleTimeString()}
        </p>
      )}
    </div>
  );
};

export default ApiHealthIndicator;
