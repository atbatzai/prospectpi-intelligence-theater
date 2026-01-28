'use client';

import { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import { DossierData, IntelligenceSection } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Download, Shield, Calendar, Database, ExternalLink, Star, Loader2, Eye, EyeOff } from 'lucide-react';
import { usePerformanceStore } from '@/store/intelligenceStore';
import { PerformanceMonitor } from '@/lib/utils';
import { useAdaptivePerformance, useAdaptiveAnimation, useAdaptiveRendering } from '@/lib/adaptive-performance';

// Lazy load heavy components for mobile optimization
const LazyIntelligenceChart = lazy(() => import('./IntelligenceChart'));
const LazySourceCitations = lazy(() => import('./SourceCitations'));

interface DossierViewerProps {
  dossier: DossierData;
  onSectionToggle: (sectionId: string) => void;
  onExport: () => void;
  expandedSections?: Set<string>;
}

export const DossierViewer: React.FC<DossierViewerProps> = ({
  dossier,
  onSectionToggle,
  onExport,
  expandedSections = new Set()
}) => {
  // Task 2.3: Progressive Loading State Management
  const [loadedSections, setLoadedSections] = useState<Set<string>>(new Set(['executive-summary']));
  const [isLoading, setIsLoading] = useState(false);
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set(['executive-summary']));
  
  // Enhanced Mobile Performance Detection & Optimization
  const performanceStore = usePerformanceStore();
  const { deviceCapabilities, animationsEnabled, initializePerformanceDetection } = performanceStore;
  const performanceMonitor = PerformanceMonitor.getInstance();
  
  // Adaptive Performance System Integration
  const { 
    isEmergencyMode, 
    performanceTier, 
    connectionQuality, 
    isInitialized 
  } = useAdaptivePerformance();
  
  const { shouldAnimate, getAnimationDuration } = useAdaptiveAnimation(1); // Low complexity for dossier
  const { shouldRenderComponent, shouldUseSimplifiedVersion } = useAdaptiveRendering('DossierViewer');
  
  const [isMobile, setIsMobile] = useState(false);
  const [renderStartTime] = useState(Date.now());
  
  // Safe sections array to prevent undefined access
  const safeSections = dossier?.sections || [];
  
  // Initialize performance detection and track render time
  useEffect(() => {
    const initializePerformance = async () => {
      if (!deviceCapabilities) {
        await initializePerformanceDetection();
      }
      
      // Track render time for performance monitoring
      const renderTime = Date.now() - renderStartTime;
      performanceMonitor.trackRenderTime('DossierViewer', renderTime);
      
      // Detect mobile layout
      const checkMobile = () => {
        setIsMobile(window.innerWidth < 768 || performanceTier === 'low');
      };
      
      checkMobile();
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
    };

    initializePerformance();
  }, [deviceCapabilities, initializePerformanceDetection, renderStartTime, performanceTier]);

  // Progressive section loading for mobile optimization
  const loadSectionOnDemand = useCallback((sectionId: string) => {
    if (!loadedSections.has(sectionId)) {
      setIsLoading(true);
      
      // Simulate processing time based on device capabilities
      const loadTime = performanceTier === 'low' ? 300 : 
                      performanceTier === 'medium' ? 150 : 50;
      
      setTimeout(() => {
        setLoadedSections(prev => new Set([...prev, sectionId]));
        setVisibleSections(prev => new Set([...prev, sectionId]));
        setIsLoading(false);
      }, loadTime);
    } else {
      setVisibleSections(prev => {
        const newSet = new Set(prev);
        if (newSet.has(sectionId)) {
          newSet.delete(sectionId);
        } else {
          newSet.add(sectionId);
        }
        return newSet;
      });
    }
  }, [loadedSections, performanceTier]);
  
  // Task 2.3: Progressive Loading Configuration (moved before early return)
  const maxSectionsPerBatch = useMemo(() => {
    if (!safeSections.length) return 0; // Safety check
    if (!isMobile) return safeSections.length; // Load all on desktop
    if (deviceCapabilities?.performanceTier === 'low') return 2; // Load 2 at a time on low-end mobile
    return 3; // Load 3 at a time on standard mobile
  }, [isMobile, deviceCapabilities, safeSections.length]);
  
  // Task 2.3: Mobile Device Detection
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768 || 
                    deviceCapabilities?.performanceTier === 'low' ||
                    /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      setIsMobile(mobile);
      
      // Load initial sections based on device capability
      if (!mobile) {
        // Desktop: Load all sections immediately
        const allSections = safeSections.map(s => s.id);
        setLoadedSections(new Set(['executive-summary', ...allSections]));
      } else {
        // Mobile: Load executive summary + first batch
        const initialSections = ['executive-summary', ...safeSections.slice(0, maxSectionsPerBatch).map(s => s.id)];
        setLoadedSections(new Set(initialSections));
        
        // Track mobile dossier load
        performanceMonitor.trackMetric('mobile-dossier-progressive-load', 1);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [safeSections, maxSectionsPerBatch, deviceCapabilities, performanceMonitor]);

  // Task 2.3: Progressive Section Loading Function
  const loadMoreSections = async () => {
    if (!isMobile || isLoading) return;
    
    setIsLoading(true);
    const startTime = performance.now();
    
    // Simulate async loading for performance measurement
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const currentlyLoaded = Array.from(loadedSections).filter(id => id !== 'executive-summary');
    const remainingSections = safeSections
      .filter(section => !loadedSections.has(section.id))
      .slice(0, maxSectionsPerBatch)
      .map(section => section.id);
    
    if (remainingSections.length > 0) {
      setLoadedSections(prev => new Set([...Array.from(prev), ...remainingSections]));
      
      // Track loading performance
      const loadTime = performance.now() - startTime;
      performanceMonitor.trackMetric('mobile-section-load-time', loadTime);
      
      console.log(`Progressive loading: Added ${remainingSections.length} sections in ${loadTime.toFixed(2)}ms`);
    }
    
    setIsLoading(false);
  };

  // Task 2.3: Check if more sections are available to load
  const hasMoreSections = useMemo(() => {
    return isMobile && safeSections.some(section => !loadedSections.has(section.id));
  }, [isMobile, safeSections, loadedSections]);
  const getConfidenceBadge = useCallback((confidence: 'high' | 'medium' | 'limited') => {
    const config = {
      high: { color: 'bg-green-100 text-green-800 border-green-300', icon: '🟢' },
      medium: { color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: '🟡' },
      limited: { color: 'bg-red-100 text-red-800 border-red-300', icon: '🔴' }
    };
    
    return config[confidence];
  }, []);

  // Optimized animation classes based on device capabilities
  const getTransitionConfig = useCallback(() => {
    if (isEmergencyMode() || !shouldAnimate) return { className: '', style: {} };
    
    const baseDuration = getAnimationDuration(200);
    if (baseDuration === 0) return { className: '', style: {} };
    
    switch (performanceTier) {
      case 'low':
        return { className: 'transition-opacity', style: { transitionDuration: '200ms' } };
      case 'medium':
        return { className: 'transition-all', style: { transitionDuration: `${baseDuration}ms` } };
      case 'high':
        return { className: 'transition-all ease-in-out', style: { transitionDuration: `${baseDuration}ms` } };
      default:
        return { className: '', style: {} };
    }
  }, [isEmergencyMode, shouldAnimate, getAnimationDuration, performanceTier]);

  // Mobile-optimized section renderer
  const MobileSectionRenderer = useCallback(({ section, index }: { section: IntelligenceSection; index: number }) => {
    const isVisible = visibleSections.has(section.id);
    const isLoaded = loadedSections.has(section.id);
    const transitionConfig = getTransitionConfig();
    
    if (!isLoaded && isMobile) {
      return null; // Don't render unloaded sections on mobile
    }

    return (
      <Card key={section.id} className={`mb-4 ${transitionConfig.className}`} style={transitionConfig.style}>
        <Collapsible 
          open={isVisible} 
          onOpenChange={() => loadSectionOnDemand(section.id)}
        >
          <CollapsibleTrigger asChild>
            <CardHeader 
              className="cursor-pointer hover:bg-gray-50 transition-colors p-4"
              role="button" 
              aria-expanded={isVisible}
              tabIndex={0}
              style={{ minHeight: '48px' }} // WCAG touch target requirement
            >
              <CardTitle className="flex items-center justify-between text-sm md:text-base">
                <span className="flex items-center gap-2">
                  {section.icon && <span>{section.icon}</span>}
                  {section.title}
                </span>
                <div className="flex items-center gap-2">
                  {section.confidence && !isEmergencyMode() && (
                    <Badge className={`text-xs ${getConfidenceBadge(section.confidence).color}`}>
                      <span className="sr-only">Confidence level: </span>
                      {getConfidenceBadge(section.confidence).icon} {section.confidence}
                    </Badge>
                  )}
                  <ChevronDown 
                    className={`h-4 w-4 transition-transform duration-200 ${
                      isVisible ? 'rotate-180' : ''
                    }`} 
                  />
                </div>
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          
          <CollapsibleContent className={transitionConfig.className} style={transitionConfig.style}>
            <CardContent className="pt-0 px-4 pb-4">
              {isEmergencyMode() ? (
                // Emergency mode: Text-only content
                <div className="space-y-2 text-sm">
                  {section.summary && <p><strong>Summary:</strong> {section.summary}</p>}
                  {section.keyPoints && (
                    <div>
                      <strong>Key Points:</strong>
                      <ul className="list-disc list-inside ml-4">
                        {section.keyPoints.map((point, idx) => (
                          <li key={`point-${idx}-${point.slice(0,15)}`}>{point}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : shouldUseSimplifiedVersion ? (
                // Simplified version for low-performance devices
                <div className="space-y-3">
                  {section.summary && (
                    <p className="text-sm leading-relaxed">{section.summary}</p>
                  )}
                  {section.keyPoints && section.keyPoints.length > 0 && (
                    <div className="space-y-1">
                      <h4 className="font-medium text-sm">Key Insights:</h4>
                      <ul className="space-y-1 text-sm">
                        {section.keyPoints.slice(0, 3).map((point, idx) => (
                          <li key={`kp-${idx}-${point.slice(0,15)}`} className="flex items-start gap-2">
                            <span className="text-blue-500 mt-1">•</span>
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                // Full version for high-performance devices
                <div className="space-y-4">
                  {section.summary && (
                    <p className="text-sm leading-relaxed">{section.summary}</p>
                  )}
                  {section.keyPoints && section.keyPoints.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Key Insights:</h4>
                      <ul className="space-y-2 text-sm">
                        {section.keyPoints.map((point, idx) => (
                          <li key={idx} className="flex items-start gap-2 p-2 rounded bg-gray-50">
                            <Star className="h-3 w-3 text-amber-500 mt-0.5 flex-shrink-0" />
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Lazy load heavy components only on high-performance devices */}
                  {section.charts && performanceTier === 'high' && (
                    <Suspense fallback={<div className="h-32 bg-gray-100 animate-pulse rounded" />}>
                      <LazyIntelligenceChart data={section.charts} />
                    </Suspense>
                  )}
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    );
  }, [visibleSections, loadedSections, isMobile, getTransitionConfig, loadSectionOnDemand, isEmergencyMode, getConfidenceBadge, shouldUseSimplifiedVersion, performanceTier]);

  // Show optimized loading state for different performance tiers
  if (!isInitialized) {
    const LoadingComponent = isEmergencyMode() ? (
      <div className="max-w-5xl mx-auto px-2 py-4" role="main" aria-label="Intelligence Dossier">
        <div className="bg-gray-50 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Loading Intelligence Dossier...</h2>
          <p className="text-sm text-gray-600">Optimizing for your device...</p>
        </div>
      </div>
    ) : (
      <div className="max-w-5xl mx-auto px-2" role="main" aria-label="Intelligence Dossier">
        <div className={shouldAnimate ? "animate-pulse" : ""}>
          <p className="text-center text-gray-500">Initializing Intelligence Theater...</p>
        </div>
      </div>
    );
    
    return LoadingComponent;
  }

  const getSourceTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      theirstack: '🏢',
      marketaux: '📈',
      'openai-realtime': '🤖',
      internal: '🔒'
    };
    return icons[type] || '📊';
  };

  // Task 2.5: Emergency text-only fallback mode for extremely low-end devices
  if (deviceCapabilities?.emergencyMode) {
    return (
      <div className="max-w-5xl mx-auto p-2" role="main" aria-label="Emergency mode intelligence dossier">
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <h1 className="text-xl font-bold text-slate-900 mb-2 border-b pb-2">
            INTELLIGENCE DOSSIER - <span>{dossier.companyName}</span>
          </h1>
          <div className="mb-3 text-sm text-slate-600" aria-label="Dossier metadata">
            Classification: {dossier.classification} | 
            Confidence: {dossier.confidence}% | 
            Sources: {dossier.sourceCount}
          </div>
          
          {/* Emergency mode executive summary */}
          <div className="mb-4" role="region" aria-labelledby="emergency-exec-summary">
            <h2 id="emergency-exec-summary" className="font-semibold text-slate-800 mb-2">EXECUTIVE SUMMARY</h2>
            <p className="text-sm text-slate-700 leading-relaxed">{dossier.executiveSummary}</p>
          </div>
          
          {/* Emergency mode sections - text only */}
          <div className="space-y-3" role="region" aria-label="Intelligence sections - emergency mode">
            {safeSections
              .filter(section => loadedSections.has(section.id))
              .map((section) => (
                <div key={section.id} className="border-l-2 border-slate-300 pl-3" role="article" aria-labelledby={`emergency-section-${section.id}`}>
                  <h3 id={`emergency-section-${section.id}`} className="font-medium text-slate-800 text-sm mb-1">
                    {section.title} ({section.confidence.toUpperCase()})
                  </h3>
                  <p className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed">
                    {section.content.substring(0, 300)}...
                  </p>
                </div>
              ))
            }
          </div>
          
          {hasMoreSections && (
            <button
              onClick={loadMoreSections}
              disabled={isLoading}
              className="mt-4 w-full p-2 text-sm bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded"
              aria-label={isLoading ? 'Loading more sections' : `Load ${Math.min(maxSectionsPerBatch, safeSections.filter(s => !loadedSections.has(s.id)).length)} more intelligence sections`}
            >
              {isLoading ? 'Loading...' : `Load ${Math.min(maxSectionsPerBatch, safeSections.filter(s => !loadedSections.has(s.id)).length)} More Sections`}
            </button>
          )}
          
          <div className="mt-4 pt-3 border-t border-slate-200 text-xs text-slate-500" role="status" aria-label="Emergency mode status">
            Emergency Performance Mode - Text-only display for optimal performance
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`max-w-5xl mx-auto ${isMobile ? 'px-2' : ''}`} role="main" aria-label="Intelligence Dossier">
      {/* Task 2.3: Mobile-Optimized CIA-Style Header */}
      <Card className={`border-2 border-slate-800 shadow-2xl mb-6 ${isMobile ? 'rounded-lg' : ''}`}>
        <CardHeader className={`bg-slate-900 text-white ${isMobile ? 'p-4' : ''}`} role="banner">
          <div className={`flex items-center justify-between ${isMobile ? 'flex-col gap-4' : ''}`}>
            <div className={`flex items-center gap-3 ${isMobile ? 'text-center' : ''}`}>
              <Shield className={`${isMobile ? 'h-6 w-6' : 'h-8 w-8'} text-blue-400`} aria-hidden="true" />
              <div>
                <CardTitle className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold`} id="dossier-title">INTELLIGENCE DOSSIER</CardTitle>
                <p className={`text-slate-300 ${isMobile ? 'text-sm' : ''}`} aria-label={`Classification level: ${dossier.classification}`}>{`Classification: ${dossier.classification}`}</p>
              </div>
            </div>
            <div className={`flex items-center gap-2 ${isMobile ? 'flex-wrap justify-center' : ''}`} role="group" aria-label="Dossier metadata and actions">
              <Badge className={`bg-blue-600 text-white ${isMobile ? 'text-xs px-2 py-1' : ''}`} aria-label={`Confidence level: ${dossier.confidence} percent`}>
                <Star className={`${isMobile ? 'h-2 w-2' : 'h-3 w-3'} mr-1`} aria-hidden="true" />
                {dossier.confidence}% Confidence
              </Badge>
              <Button 
                onClick={onExport}
                variant="outline"
                size={isMobile ? "sm" : "sm"}
                className={`bg-transparent border-white text-white hover:bg-white hover:text-slate-900 ${isMobile ? 'text-xs px-3 py-2 min-h-11' : ''}`}
              >
                <Download className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} mr-2`} aria-hidden="true" />
                Export PDF
              </Button>
            </div>
          </div>
          
          {/* Target Information */}
          <div className="mt-4 grid grid-cols-3 gap-4 pt-4 border-t border-slate-700" role="group" aria-labelledby="target-info-heading">
            <h2 id="target-info-heading" className="sr-only">Target Information Summary</h2>
            <div>
              <p className="text-sm text-slate-400">TARGET ORGANIZATION</p>
              <p className="font-bold text-lg" aria-label={`Target organization: ${dossier.companyName}`}>{dossier.companyName}</p>
            </div>
            <div>
              <p className="text-sm text-slate-400">GENERATED</p>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" aria-hidden="true" />
                <p className="font-medium" aria-label={`Generated on ${new Date(dossier.generatedAt).toLocaleDateString()}`}>{new Date(dossier.generatedAt).toLocaleDateString()}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-slate-400">SOURCES</p>
              <div className="flex items-center gap-1">
                <Database className="h-4 w-4" aria-hidden="true" />
                <p className="font-medium" aria-label={`${dossier.sourceCount} active intelligence sources`}>{dossier.sourceCount} Active Sources</p>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Executive Summary */}
      <Card className="border border-slate-300 shadow-lg mb-6" role="region" aria-labelledby="exec-summary-title">
        <CardHeader>
          <CardTitle id="exec-summary-title" className="text-xl flex items-center gap-2 text-slate-900">
            <Shield className="h-5 w-5 text-blue-600" aria-hidden="true" />
            EXECUTIVE SUMMARY
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-700 leading-relaxed text-lg" aria-label="Executive summary of intelligence findings">
            {dossier.executiveSummary}
          </p>
        </CardContent>
      </Card>

      {/* Optimized Mobile Sections Rendering */}
      <div className="space-y-4" role="region" aria-label="Intelligence sections">
        {isEmergencyMode() ? (
          // Emergency mode: Simple text-only sections
          <div className="space-y-3">
            {safeSections
              .filter(section => loadedSections.has(section.id))
              .map((section, index) => (
                <div key={section.id} className="bg-gray-50 p-4 rounded border">
                  <h3 className="font-semibold text-gray-800 mb-2">{section.title}</h3>
                  <p className="text-sm text-gray-700">{section.summary || section.content?.substring(0, 200) + '...'}</p>
                </div>
              ))
            }
          </div>
        ) : (
          // Use optimized mobile section renderer
          safeSections
            .filter(section => loadedSections.has(section.id))
            .map((section, index) => (
              <MobileSectionRenderer 
                key={section.id} 
                section={section} 
                index={index}
              />
            ))
        )}
      </div>

      {/* Task 2.3: Progressive Loading Control for Mobile */}
      {hasMoreSections && (
        <div className="mt-6 text-center" role="region" aria-label="Load more sections">
          <Button
            onClick={loadMoreSections}
            disabled={isLoading}
            variant="outline"
            size="lg"
            className={`${isMobile ? 'w-full py-3 min-h-[48px]' : 'px-8 py-2'} border-2 border-blue-300 text-blue-700 hover:bg-blue-50 active:bg-blue-100 transition-colors duration-200`}
            aria-describedby="load-more-help"
            aria-label={isLoading ? 'Loading more sections in progress' : `Load ${Math.min(maxSectionsPerBatch, safeSections.filter(s => !loadedSections.has(s.id)).length)} more intelligence sections`}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
                Loading More Sections...
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-2" aria-hidden="true" />
                Load {Math.min(maxSectionsPerBatch, safeSections.filter(s => !loadedSections.has(s.id)).length)} More Section{Math.min(maxSectionsPerBatch, safeSections.filter(s => !loadedSections.has(s.id)).length) !== 1 ? 's' : ''}
              </>
            )}
          </Button>
          
          {/* Task 2.3: Mobile Performance Indicator */}
          {isMobile && (
            <p id="load-more-help" className="text-xs text-slate-500 mt-2" aria-live="polite">
              Showing {loadedSections.size - 1} of {safeSections.length} sections
              {deviceCapabilities?.performanceTier === 'low' && ' • Optimized for your device'}
            </p>
          )}
        </div>
      )}

      {/* Footer */}
      <footer className="mt-8 p-4 bg-slate-100 rounded-lg text-center" role="contentinfo">
        <p className="text-sm text-slate-600">
          This intelligence dossier was generated by ProspectPI's 3-Agent Intelligence System
        </p>
        <p className="text-xs text-slate-500 mt-1">
          Generated on {new Date(dossier.generatedAt).toLocaleString()} • ID: {dossier.id}
        </p>
      </footer>
    </div>
  );
};