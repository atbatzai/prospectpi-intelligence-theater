'use client';

import { AgentTheaterProps } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { StopCircle, Eye, Activity, Database } from 'lucide-react';
import { useEffect, useState } from 'react';
import { 
  useAdaptivePerformance, 
  useAdaptiveAnimation, 
  useAdaptiveRendering, 
  useAdaptiveLoading 
} from '@/lib/adaptive-performance';

/**
 * Task 5.1: Enhanced Adaptive Agent Progress Theater with Performance Architecture
 * Implements device-aware animations and comprehensive performance budgets
 */

export const AgentProgressTheater: React.FC<AgentTheaterProps> = ({
  progress,
  canInterrupt,
  onInterrupt,
  estimatedCompletion
}) => {
  // Task 5.1: Use new adaptive performance system
  const { 
    isEmergencyMode, 
    performanceTier, 
    connectionQuality,
    enableProgressiveEnhancement,
    isInitialized 
  } = useAdaptivePerformance();
  
  const { shouldAnimate, getAnimationDuration, animationClass } = useAdaptiveAnimation(2); // Medium complexity animations
  const { shouldRenderComponent, shouldUseSimplifiedVersion } = useAdaptiveRendering('AgentProgressTheater');
  const { getLoadingComponent } = useAdaptiveLoading();

  // Task 5.1: Performance tracking with adaptive monitoring
  const [renderCount, setRenderCount] = useState(0);
  const [lastProgressUpdate, setLastProgressUpdate] = useState(Date.now());
  
  // Optimize progress updates to reduce re-renders
  useEffect(() => {
    const now = Date.now();
    if (now - lastProgressUpdate > 100) { // Throttle updates to max 10fps
      setRenderCount(prev => prev + 1);
      setLastProgressUpdate(now);
    }
  }, [progress, lastProgressUpdate]);

  // Show loading state while adaptive performance is initializing
  if (!isInitialized) {
    return (
      <div className="max-w-6xl mx-auto p-4">
        <div className="animate-pulse">
          <p className="text-center text-gray-500">Initializing Intelligence Theater...</p>
        </div>
      </div>
    );
  }

  // Task 5.1: Adaptive animation configuration
  const getAnimationClasses = () => {
    if (isEmergencyMode()) return 'transition-none';
    if (!shouldAnimate) return 'transition-none';
    
    const baseDuration = getAnimationDuration(500); // 500ms base duration
    
    switch (performanceTier) {
      case 'low':
        return `transition-opacity duration-[${Math.max(200, baseDuration)}ms]`;
      case 'medium':
        return `transition-all duration-[${baseDuration}ms] ease-in-out`;
      case 'high':
        return `transition-all duration-[${baseDuration}ms] ease-in-out hover:scale-105`;
      default:
        return 'transition-none';
    }
  };

  // Task 5.1: Progressive enhancement for mobile layout detection
  const isMobileLayout = performanceTier === 'low' || 
                        (typeof window !== 'undefined' && window.innerWidth < 768);

  // Task 5.1: Enhanced emergency fallback with performance-aware rendering
  if (isEmergencyMode()) {
    return (
      <div className="max-w-6xl mx-auto p-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-yellow-800 mb-2">
            🚨 Emergency Performance Mode - Intelligence Analysis
          </h2>
          <div className="space-y-2 text-sm text-yellow-700">
            {progress.map((agent, index) => (
              <div key={agent.id || index} className="border-l-2 border-yellow-300 pl-3">
                <p className="font-medium">{agent.name.toUpperCase()}: {agent.status}</p>
                <p>{agent.currentAction}</p>
                <p>Progress: {Math.round(agent.progress * 100)}%</p>
                {agent.metadata?.confidenceScore && 
                  <p>Confidence: {Math.round(agent.metadata.confidenceScore * 100)}%</p>}
              </div>
            ))}
          </div>
          {estimatedCompletion > 0 && (
            <p className="mt-3 text-xs text-yellow-600">
              ETA: {Math.round(estimatedCompletion / 1000)}s
            </p>
          )}
          {canInterrupt && (
            <button 
              onClick={onInterrupt}
              className="mt-3 px-3 py-1 bg-yellow-200 text-yellow-800 rounded text-sm hover:bg-yellow-300"
            >
              Stop Analysis
            </button>
          )}
        </div>
      </div>
    );
  }

  // Task 5.1: Loading state during initialization
  if (!isInitialized) {
    const loadingType = getLoadingComponent('simple');
    return (
      <div className="max-w-6xl mx-auto p-4">
        <div className="animate-pulse">
          {loadingType === 'text' ? (
            <p className="text-center text-gray-500">Initializing Intelligence Theater...</p>
          ) : (
            <div className="bg-gray-200 h-32 rounded-lg"></div>
          )}
        </div>
      </div>
    );
  }

  // Task 5.1: Skip rendering if component shouldn't render
  if (!shouldRenderComponent) {
    return null;
  }

  return (
    <div 
      className={`max-w-6xl mx-auto ${getAnimationClasses()}`}
      role="main"
      aria-label="Intelligence Theater Operations"
    >
      <Card className={`border-2 border-slate-200 shadow-lg ${isMobileLayout ? 'mx-2' : ''}`}>
        <CardHeader className={`text-center ${isMobileLayout ? 'pb-2 px-2' : 'pb-4'}`}>
          <CardTitle 
            className={`${isMobileLayout ? 'text-lg' : 'text-2xl'} font-bold text-slate-900 flex items-center justify-center gap-2`}
            id="theater-title"
          >
            <Activity 
              className={`${isMobileLayout ? 'h-4 w-4' : 'h-6 w-6'} text-green-600`}
              aria-hidden="true"
            />
            {isMobileLayout ? 'Intel Theater' : 'Intelligence Theater - Live Operations'}
          </CardTitle>
          <div 
            className={`flex items-center justify-center ${isMobileLayout ? 'gap-2 flex-col' : 'gap-4'} mt-2`}
            role="status"
            aria-label="Theater status indicators"
          >
            <Badge 
              variant="outline" 
              className="text-green-700 border-green-300"
              aria-label={`${progress.length} agents currently active`}
            >
              <Eye className="h-3 w-3 mr-1" aria-hidden="true" />
              {progress.length} Agents Active
            </Badge>
            <Badge 
              variant="outline" 
              className="text-blue-700 border-blue-300"
              aria-label="Multi-source intelligence gathering active"
            >
              <Database className="h-3 w-3 mr-1" aria-hidden="true" />
              Multi-Source Intel
            </Badge>
            {estimatedCompletion > 0 && (
              <Badge 
                variant="outline" 
                className="text-purple-700 border-purple-300"
                aria-label={`Estimated time to completion: ${Math.ceil(estimatedCompletion / 60)} minutes ${estimatedCompletion % 60} seconds`}
              >
                ETA: {Math.ceil(estimatedCompletion / 60)}m {estimatedCompletion % 60}s
              </Badge>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Task 5.1: Adaptive Agent Display with Enhanced Performance Architecture */}
          <div 
            className={`grid ${isMobileLayout ? 'grid-cols-1 gap-2' : 'md:grid-cols-3 gap-6'}`}
            role="region"
            aria-labelledby="theater-title"
            aria-live="polite"
            aria-relevant="text"
          >
            {progress.map((agent, index) => {
              // Task 5.1: Use adaptive animation system
              const cardAnimationClass = shouldAnimate ? `hover:shadow-md ${getAnimationClasses()}` : '';
              const animationDelay = shouldAnimate && enableProgressiveEnhancement ? index * 100 : 0;
              
              return (
                <Card 
                  key={agent.id || `agent-${index}`} 
                  className={`border border-slate-200 ${cardAnimationClass} ${isMobileLayout ? 'mx-1' : ''}`}
                  style={{
                    // Task 5.1: Progressive enhancement for animation delays
                    animationDelay: `${animationDelay}ms`
                  }}
                  role="article"
                  aria-labelledby={`agent-${index}-title`}
                  tabIndex={0}
                >
                  <CardHeader className={`${isMobileLayout ? 'pb-2 px-3' : 'pb-3'}`}>
                    <div className={`flex items-center ${isMobileLayout ? 'justify-start gap-3' : 'justify-between'}`}>
                      <div className="flex items-center gap-2">
                        <span 
                          className={`${isMobileLayout ? 'text-lg' : 'text-2xl'}`}
                          aria-hidden="true"
                        >
                          {agent.avatar}
                        </span>
                        <div>
                          <CardTitle 
                            className={`${isMobileLayout ? 'text-sm' : 'text-lg'} capitalize`}
                            id={`agent-${index}-title`}
                          >
                            {agent.name}
                          </CardTitle>
                          <Badge 
                            variant={agent.status === 'working' ? 'default' : agent.status === 'completed' ? 'secondary' : 'destructive'}
                            className={`${isMobileLayout ? 'text-xs px-1' : 'text-xs'}`}
                            aria-label={`Agent status: ${agent.status}`}
                          >
                            {agent.status}
                          </Badge>
                        </div>
                      </div>
                      {!isMobileLayout && (
                        <div className="text-right">
                          <div className="text-sm text-slate-500">Sources: {agent.metadata?.sourceCount || 0}</div>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                
                <CardContent className="space-y-3">
                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span id={`agent-${index}-progress-label`}>Progress</span>
                      <span>{agent.progress}%</span>
                    </div>
                    <Progress 
                      value={agent.progress} 
                      className="h-2"
                      aria-labelledby={`agent-${index}-progress-label`}
                      aria-valuenow={agent.progress}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      role="progressbar"
                    />
                  </div>
                  
                  {/* Current Action */}
                  <div className="text-sm">
                    <p className="font-medium text-slate-700 mb-1">Current Action:</p>
                    <p className="text-slate-600">{agent.currentAction}</p>
                  </div>
                  
                  {/* Metadata */}
                  {agent.metadata && (
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {agent.metadata.sourceCount !== undefined && (
                        <div className="bg-slate-50 p-2 rounded">
                          <div className="font-medium">Sources</div>
                          <div className="text-slate-600">{agent.metadata.sourceCount}</div>
                        </div>
                      )}
                      {agent.metadata.insightsCount !== undefined && (
                        <div className="bg-slate-50 p-2 rounded">
                          <div className="font-medium">Insights</div>
                          <div className="text-slate-600">{agent.metadata.insightsCount}</div>
                        </div>
                      )}
                      {agent.metadata.confidenceScore !== undefined && (
                        <div className="bg-slate-50 p-2 rounded col-span-2">
                          <div className="font-medium">Confidence Score</div>
                          <div className="text-slate-600">{agent.metadata.confidenceScore}%</div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
              );
            })}
          </div>
          
          {/* Task 5.1: Adaptive Interrupt Control with Performance Awareness */}
          {canInterrupt && (
            <div className={`text-center pt-4 border-t border-slate-200 ${isMobileLayout ? 'px-2' : ''}`}>
              <Button
                variant="destructive"
                onClick={onInterrupt}
                className={`flex items-center gap-2 ${isMobileLayout ? 'w-full text-sm min-h-11' : ''} ${getAnimationClasses()}`}
                aria-label="Stop intelligence generation process"
                aria-describedby="interrupt-help-text"
                type="button"
              >
                <StopCircle className="h-4 w-4" aria-hidden="true" />
                {shouldUseSimplifiedVersion || isMobileLayout ? 'Stop Analysis' : 'Stop Intelligence Generation'}
              </Button>
              {!shouldUseSimplifiedVersion && (
                <p 
                  className="text-sm text-slate-500 mt-2"
                  id="interrupt-help-text"
                >
                  You can interrupt the process and review partial results
                </p>
              )}
            </div>
          )}
          
          {/* Empty State */}
          {progress.length === 0 && (
            <div 
              className="text-center py-8"
              role="status"
              aria-live="polite"
            >
              <Activity 
                className="h-12 w-12 text-slate-400 mx-auto mb-4" 
                aria-hidden="true"
              />
              <p className="text-slate-600">Waiting for intelligence agents to begin analysis...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};