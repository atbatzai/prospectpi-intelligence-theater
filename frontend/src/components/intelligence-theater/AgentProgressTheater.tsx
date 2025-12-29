'use client';

import { AgentTheaterProps } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { StopCircle, Eye, Activity, Database, Clock, Zap, CheckCircle, AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { 
  useAdaptivePerformance, 
  useAdaptiveAnimation, 
  useAdaptiveRendering, 
  useAdaptiveLoading 
} from '@/lib/adaptive-performance';

interface AgentStage {
  id: string;
  name: string;
  progress: number;
  status: 'pending' | 'active' | 'completed' | 'error';
  estimatedDuration: number;
  startTime?: number;
}

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
  
  // Enhanced progress simulation for better UX feedback - Epic 2.1.3
  const [detailedStages, setDetailedStages] = useState<AgentStage[]>([
    { id: 'planning', name: '🕵️ Detective Planning Mission', progress: 0, status: 'pending', estimatedDuration: 30 },
    { id: 'theirstack', name: '🔍 Investigating Technology Stack', progress: 0, status: 'pending', estimatedDuration: 45 },
    { id: 'marketaux', name: '💼 Gathering Financial Intelligence', progress: 0, status: 'pending', estimatedDuration: 35 },
    { id: 'coresignal', name: '🌐 Analyzing Professional Networks', progress: 0, status: 'pending', estimatedDuration: 40 },
    { id: 'perplexity', name: '📰 Real-time News Research', progress: 0, status: 'pending', estimatedDuration: 25 },
    { id: 'analysis', name: '🧠 Cross-referencing Evidence', progress: 0, status: 'pending', estimatedDuration: 60 },
    { id: 'synthesis', name: '📋 Compiling Intelligence Report', progress: 0, status: 'pending', estimatedDuration: 45 }
  ]);
  
  const [missionStarted, setMissionStarted] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);
  
  // Real-time progress updates from WebSocket data
  useEffect(() => {
    if (!progress || progress.length === 0) return;
    
    // Start mission when we receive first progress updates
    if (!missionStarted) {
      setMissionStarted(true);
    }
    
    // Get the latest progress update
    const latestProgress = progress[progress.length - 1];
    console.log('🎭 AgentProgressTheater received:', latestProgress);
    
    // Map agent names to stage IDs
    const agentToStageMap: { [key: string]: string } = {
      'coordinator': 'planning',
      'intelligence-coordinator': 'planning',
      'researcher': 'theirstack',
      'field-researcher': 'theirstack',
      'detective': 'analysis',
      'intelligence-detective': 'analysis',
      'system': 'synthesis'
    };
    
    // Update stages based on real agent progress
    setDetailedStages(prevStages => {
      const newStages = [...prevStages];
      const agentName = latestProgress.agent?.toLowerCase() || 'system';
      const stageId = agentToStageMap[agentName] || 'analysis';
      
      // Find the corresponding stage
      const stageIndex = newStages.findIndex(stage => stage.id === stageId);
      if (stageIndex !== -1) {
        const stage = { ...newStages[stageIndex] };
        
        // Update stage status based on agent activity
        if (latestProgress.stage === 'complete' || latestProgress.message?.includes('completed')) {
          stage.status = 'completed';
          stage.progress = 100;
        } else if (latestProgress.stage === 'working' || latestProgress.stage === 'active') {
          stage.status = 'active';
          // Use confidence as progress indicator (0.6-1.0 confidence = 60-100% progress)
          stage.progress = Math.round((latestProgress.confidence || 0.7) * 100);
        } else {
          stage.status = 'active';
          stage.progress = Math.min(stage.progress + 10, 95); // Incremental progress
        }
        
        newStages[stageIndex] = stage;
        
        // Mark previous stages as completed if current stage is active
        for (let i = 0; i < stageIndex; i++) {
          if (newStages[i].status === 'pending') {
            newStages[i].status = 'completed';
            newStages[i].progress = 100;
          }
        }
      }
      
      return newStages;
    });
    
    // Calculate overall progress based on actual progress data
    const completedStages = detailedStages.filter(s => s.status === 'completed').length;
    const activeStage = detailedStages.find(s => s.status === 'active');
    const activeProgress = activeStage ? activeStage.progress / 100 : 0;
    const newOverallProgress = Math.round(((completedStages + activeProgress) / detailedStages.length) * 100);
    setOverallProgress(newOverallProgress);
    
  }, [progress, missionStarted, detailedStages.length]);

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
            aria-live="polite"
          >
            {/* Epic 2.1.3: Data source badges for credibility */}
            <div className="flex flex-wrap gap-2 justify-center">
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                <Database className="h-3 w-3 mr-1" />
                12 Sources Active
              </Badge>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <Activity className="h-3 w-3 mr-1" />
                Live Intelligence
              </Badge>
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                <Eye className="h-3 w-3 mr-1" />
                Detective Mode
              </Badge>
            </div>
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
          {/* Enhanced Progress Bar with Real-Time Updates */}
          <div className="space-y-4">
            {/* Overall Mission Progress */}
            <div className="bg-gradient-to-r from-blue-50 to-violet-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-blue-900 flex items-center">
                  <Zap className="h-4 w-4 mr-2 text-blue-600" />
                  Intelligence Mission Progress
                </h3>
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="h-4 w-4 mr-1" />
                  {estimatedCompletion > 0 ? 
                    `${Math.ceil(estimatedCompletion / 60)}:${String(estimatedCompletion % 60).padStart(2, '0')} remaining` : 
                    'Calculating...'
                  }
                </div>
              </div>
              
              {/* Master Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Mission Status</span>
                  <span>{overallProgress}% Complete</span>
                </div>
                <Progress 
                  value={overallProgress} 
                  className="h-3 bg-gray-200" 
                />
              </div>
              
              {/* Detailed Stage Progress */}
              <div className="mt-4 space-y-1">
                <h4 className="text-xs font-medium text-gray-700 mb-2">Current Operations:</h4>
                <div className="max-h-24 overflow-y-auto space-y-1">
                  {detailedStages.map((stage) => (
                    <div key={stage.id} className="flex items-center justify-between text-xs py-1">
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${
                          stage.status === 'completed' ? 'bg-green-500' :
                          stage.status === 'active' ? 'bg-blue-500 animate-pulse' :
                          stage.status === 'error' ? 'bg-red-500' :
                          'bg-gray-300'
                        }`} />
                        <span className={`${
                          stage.status === 'active' ? 'text-blue-700 font-medium' :
                          stage.status === 'completed' ? 'text-green-700' :
                          'text-gray-500'
                        }`}>
                          {stage.name}
                        </span>
                      </div>
                      <span className={`text-xs ${
                        stage.status === 'active' ? 'text-blue-600 font-medium' :
                        stage.status === 'completed' ? 'text-green-600' :
                        'text-gray-400'
                      }`}>
                        {stage.status === 'active' ? `${Math.round(stage.progress)}%` :
                         stage.status === 'completed' ? '✓' :
                         stage.status === 'error' ? '✗' : '...'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Real-Time Status Indicators */}
              <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
                {progress.map((agent, index) => (
                  <div key={agent.id || index} className="flex items-center justify-center p-1 bg-white rounded border">
                    <span className="mr-1">{agent.avatar}</span>
                    {agent.status === 'working' ? (
                      <Activity className="h-3 w-3 text-green-500 animate-pulse" />
                    ) : agent.status === 'completed' ? (
                      <CheckCircle className="h-3 w-3 text-green-600" />
                    ) : (
                      <AlertCircle className="h-3 w-3 text-gray-400" />
                    )}
                    <span className="ml-1 text-gray-700 truncate">{agent.progress}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

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