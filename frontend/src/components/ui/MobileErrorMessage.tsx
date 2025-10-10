'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Wifi, WifiOff, RefreshCw, Smartphone, Signal } from 'lucide-react';
import { usePerformanceStore } from '@/store/intelligenceStore';

export interface MobileErrorMessageProps {
  error: {
    code?: string;
    message: string;
    networkError?: boolean;
    retryCount?: number;
  };
  onRetry: () => void;
  onDismiss?: () => void;
  isRetrying?: boolean;
}

/**
 * Task 3.3: Mobile-friendly error messages with touch-optimized retry buttons
 * Provides mobile-optimized error display with network awareness
 */
export const MobileErrorMessage: React.FC<MobileErrorMessageProps> = ({
  error,
  onRetry,
  onDismiss,
  isRetrying = false
}) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [networkQuality, setNetworkQuality] = useState<string>('unknown');
  const { deviceCapabilities } = usePerformanceStore();
  
  const isMobile = deviceCapabilities?.performanceTier === 'low' || window.innerWidth < 768;

  // Task 3.3: Network status monitoring
  useEffect(() => {
    const updateOnlineStatus = () => setIsOnline(navigator.onLine);
    const updateNetworkQuality = () => {
      const connection = (navigator as any).connection;
      if (connection) {
        setNetworkQuality(connection.effectiveType || 'unknown');
      }
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    
    updateNetworkQuality();
    
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  // Task 3.3: Error type classification for mobile users
  const getErrorInfo = () => {
    if (!isOnline) {
      return {
        type: 'offline',
        icon: WifiOff,
        title: 'No Internet Connection',
        description: 'Please check your network settings and try again.',
        color: 'red',
        showNetworkInfo: true
      };
    }

    if (error.networkError || error.code === 'NETWORK_ERROR') {
      return {
        type: 'network',
        icon: Signal,
        title: 'Connection Issues',
        description: `Network problems detected${networkQuality !== 'unknown' ? ` on ${networkQuality.toUpperCase()}` : ''}. This might be temporary.`,
        color: 'yellow',
        showNetworkInfo: true
      };
    }

    if (error.code === 'TIMEOUT' || error.message.includes('timeout')) {
      return {
        type: 'timeout',
        icon: RefreshCw,
        title: 'Request Timeout',
        description: 'The request took too long to complete. This often happens on slower connections.',
        color: 'orange',
        showNetworkInfo: false
      };
    }

    return {
      type: 'general',
      icon: AlertTriangle,
      title: 'Something Went Wrong',
      description: error.message || 'An unexpected error occurred.',
      color: 'red',
      showNetworkInfo: false
    };
  };

  const errorInfo = getErrorInfo();
  const ErrorIcon = errorInfo.icon;

  // Task 3.3: Touch-optimized retry button sizing
  const buttonClasses = isMobile 
    ? 'w-full min-h-[48px] text-base font-medium px-6 py-3'
    : 'px-4 py-2 text-sm';

  const cardClasses = isMobile
    ? 'mx-2 border-2 rounded-lg shadow-lg'
    : 'border shadow-md';

  return (
    <Card className={`${cardClasses} ${errorInfo.color === 'red' ? 'border-red-300' : errorInfo.color === 'yellow' ? 'border-yellow-300' : 'border-orange-300'}`}>
      <CardHeader className={`${isMobile ? 'pb-3 px-4' : 'pb-4'}`}>
        <CardTitle className={`flex items-center gap-3 ${isMobile ? 'text-lg' : 'text-xl'}`}>
          <ErrorIcon className={`${isMobile ? 'h-5 w-5' : 'h-6 w-6'} ${errorInfo.color === 'red' ? 'text-red-600' : errorInfo.color === 'yellow' ? 'text-yellow-600' : 'text-orange-600'}`} />
          {errorInfo.title}
          {isMobile && (
            <Smartphone className="h-4 w-4 ml-auto text-slate-400" />
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className={`space-y-4 ${isMobile ? 'px-4 pb-4' : ''}`}>
        <p className={`${isMobile ? 'text-sm' : 'text-base'} text-slate-700 leading-relaxed`}>
          {errorInfo.description}
        </p>

        {/* Task 3.3: Network status indicators for mobile users */}
        {errorInfo.showNetworkInfo && (
          <div className={`flex items-center gap-2 ${isMobile ? 'flex-wrap' : ''}`}>
            <div className="flex items-center gap-1">
              {isOnline ? (
                <Wifi className="h-4 w-4 text-green-600" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-600" />
              )}
              <span className="text-xs text-slate-600">
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            
            {networkQuality !== 'unknown' && (
              <Badge variant="outline" className="text-xs">
                {networkQuality.toUpperCase()} Network
              </Badge>
            )}
            
            {error.retryCount && error.retryCount > 0 && (
              <Badge variant="outline" className="text-xs">
                Retry {error.retryCount}
              </Badge>
            )}
          </div>
        )}

        {/* Task 3.3: Touch-optimized action buttons */}
        <div className={`flex gap-3 ${isMobile ? 'flex-col' : 'flex-row'}`}>
          <Button
            onClick={onRetry}
            disabled={isRetrying}
            className={`${buttonClasses} bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white transition-colors duration-200`}
          >
            {isRetrying ? (
              <>
                <RefreshCw className={`${isMobile ? 'h-4 w-4' : 'h-3 w-3'} mr-2 animate-spin`} />
                Retrying...
              </>
            ) : (
              <>
                <RefreshCw className={`${isMobile ? 'h-4 w-4' : 'h-3 w-3'} mr-2`} />
                Try Again
              </>
            )}
          </Button>
          
          {onDismiss && (
            <Button
              onClick={onDismiss}
              variant="outline"
              className={`${buttonClasses} border-slate-300 hover:bg-slate-50 active:bg-slate-100`}
            >
              Dismiss
            </Button>
          )}
        </div>

        {/* Task 3.3: Mobile-specific help text */}
        {isMobile && (
          <div className="mt-3 p-3 bg-slate-50 rounded-lg">
            <p className="text-xs text-slate-600 leading-relaxed">
              💡 <strong>Mobile Tip:</strong> If problems persist, try switching between WiFi and mobile data, 
              or move to an area with better signal strength.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};