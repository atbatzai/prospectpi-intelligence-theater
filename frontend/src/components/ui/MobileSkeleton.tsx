'use client';

import { usePerformanceStore } from '@/store/intelligenceStore';

interface MobileSkeletonProps {
  className?: string;
  height?: string;
  width?: string;
  rounded?: boolean;
  animate?: boolean;
}

/**
 * Task 3.4: Mobile-optimized skeleton loader with performance budgets
 * Provides adaptive loading states based on device capabilities
 */
export const MobileSkeleton: React.FC<MobileSkeletonProps> = ({
  className = '',
  height = 'h-4',
  width = 'w-full',
  rounded = false,
  animate = true
}) => {
  const { deviceCapabilities, animationsEnabled } = usePerformanceStore();
  
  // Task 3.4: Adaptive animation based on device performance and user preferences
  const shouldAnimate = animate && 
                       animationsEnabled && 
                       deviceCapabilities?.performanceTier !== 'low' &&
                       !deviceCapabilities?.emergencyMode &&
                       !deviceCapabilities?.reducedMotion;

  const baseClasses = `bg-slate-200 ${height} ${width} ${rounded ? 'rounded-full' : 'rounded-md'} ${className}`;
  const animationClass = shouldAnimate ? 'animate-pulse' : '';

  return <div className={`${baseClasses} ${animationClass}`} />;
};

interface MobileSkeletonGroupProps {
  type: 'agent-theater' | 'dossier-section' | 'company-input' | 'list-item' | 'card';
  count?: number;
  className?: string;
}

/**
 * Task 3.4: Pre-built mobile skeleton patterns for common UI components
 */
export const MobileSkeletonGroup: React.FC<MobileSkeletonGroupProps> = ({
  type,
  count = 1,
  className = ''
}) => {
  const { deviceCapabilities } = usePerformanceStore();
  const isMobile = deviceCapabilities?.performanceTier === 'low' || window.innerWidth < 768;

  const renderSkeletonByType = () => {
    switch (type) {
      case 'agent-theater':
        return (
          <div className={`space-y-4 ${className}`}>
            {/* Mobile-optimized agent cards */}
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className={`p-4 border rounded-lg bg-white ${isMobile ? 'mx-2' : ''}`}>
                <div className="flex items-center gap-3 mb-3">
                  <MobileSkeleton height="h-8" width="w-8" rounded className="shrink-0" />
                  <div className="flex-1">
                    <MobileSkeleton height={isMobile ? "h-4" : "h-5"} width="w-24" className="mb-2" />
                    <MobileSkeleton height="h-3" width="w-16" />
                  </div>
                  <MobileSkeleton height="h-6" width="w-12" rounded />
                </div>
                <MobileSkeleton height={isMobile ? "h-2" : "h-3"} width="w-full" className="mb-2" />
                <MobileSkeleton height="h-8" width="w-full" />
              </div>
            ))}
          </div>
        );

      case 'dossier-section':
        return (
          <div className={`space-y-3 ${className}`}>
            {Array.from({ length: count }, (_, i) => (
              <div key={i} className={`p-4 border rounded-lg bg-white ${isMobile ? 'mx-2' : ''}`}>
                <div className="flex items-center justify-between mb-3">
                  <MobileSkeleton height={isMobile ? "h-5" : "h-6"} width="w-48" />
                  <div className="flex gap-2">
                    <MobileSkeleton height="h-5" width="w-16" rounded />
                    <MobileSkeleton height="h-5" width="w-20" rounded />
                  </div>
                </div>
                <div className="space-y-2">
                  <MobileSkeleton height="h-3" width="w-full" />
                  <MobileSkeleton height="h-3" width="w-5/6" />
                  <MobileSkeleton height="h-3" width="w-4/5" />
                </div>
              </div>
            ))}
          </div>
        );

      case 'company-input':
        return (
          <div className={`p-6 border rounded-lg bg-white ${isMobile ? 'mx-2' : ''} ${className}`}>
            <div className="text-center mb-6">
              <MobileSkeleton height={isMobile ? "h-6" : "h-8"} width="w-64" className="mx-auto mb-2" />
              <MobileSkeleton height="h-4" width="w-48" className="mx-auto" />
            </div>
            
            <div className="space-y-4">
              <div>
                <MobileSkeleton height="h-4" width="w-32" className="mb-2" />
                <MobileSkeleton height={isMobile ? "h-12" : "h-10"} width="w-full" />
              </div>
              
              {/* Priority and format selectors */}
              <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
                <div>
                  <MobileSkeleton height="h-4" width="w-20" className="mb-2" />
                  <MobileSkeleton height={isMobile ? "h-12" : "h-10"} width="w-full" />
                </div>
                <div>
                  <MobileSkeleton height="h-4" width="w-28" className="mb-2" />
                  <MobileSkeleton height={isMobile ? "h-12" : "h-10"} width="w-full" />
                </div>
              </div>
              
              <MobileSkeleton height={isMobile ? "h-12" : "h-10"} width="w-full" />
            </div>
          </div>
        );

      case 'list-item':
        return (
          <div className={`space-y-2 ${className}`}>
            {Array.from({ length: count }, (_, i) => (
              <div key={i} className={`flex items-center gap-3 p-3 ${isMobile ? 'min-h-[48px]' : ''}`}>
                <MobileSkeleton height="h-6" width="w-6" rounded />
                <div className="flex-1">
                  <MobileSkeleton height="h-4" width="w-3/4" className="mb-1" />
                  <MobileSkeleton height="h-3" width="w-1/2" />
                </div>
                <MobileSkeleton height="h-4" width="w-16" />
              </div>
            ))}
          </div>
        );

      case 'card':
        return (
          <div className={`space-y-4 ${className}`}>
            {Array.from({ length: count }, (_, i) => (
              <div key={i} className={`p-4 border rounded-lg bg-white ${isMobile ? 'mx-2' : ''}`}>
                <MobileSkeleton height={isMobile ? "h-5" : "h-6"} width="w-1/3" className="mb-3" />
                <div className="space-y-2">
                  <MobileSkeleton height="h-3" width="w-full" />
                  <MobileSkeleton height="h-3" width="w-4/5" />
                  <MobileSkeleton height="h-3" width="w-3/4" />
                </div>
                <div className="flex justify-between items-center mt-4">
                  <MobileSkeleton height="h-4" width="w-20" />
                  <MobileSkeleton height={isMobile ? "h-8" : "h-6"} width="w-16" />
                </div>
              </div>
            ))}
          </div>
        );

      default:
        return <MobileSkeleton className={className} />;
    }
  };

  return <div>{renderSkeletonByType()}</div>;
};