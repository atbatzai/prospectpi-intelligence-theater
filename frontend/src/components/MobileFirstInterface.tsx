'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Mic, MicOff, Sparkles, ArrowRight, ArrowLeft } from 'lucide-react';
import { SmartCompanyInput } from './intelligence-theater/SmartCompanyInput';
import { ProgressiveDossierReveal } from './ProgressiveDossierReveal';

interface MobileFirstInterfaceProps {
  onGenerateIntelligence?: (data: any) => void;
  isGenerating?: boolean;
  currentDossier?: any;
}

export const MobileFirstInterface: React.FC<MobileFirstInterfaceProps> = ({
  onGenerateIntelligence,
  isGenerating = false,
  currentDossier
}) => {
  const [currentSection, setCurrentSection] = useState(0);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [voiceInput, setVoiceInput] = useState('');
  const [swipeStart, setSwipeStart] = useState({ x: 0, y: 0 });
  const [isOnline, setIsOnline] = useState(true);
  const recognitionRef = useRef<any>(null);
  
  // PWA & Offline Support
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOnline(navigator.onLine);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Voice-to-Text Input
  const startVoiceRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Voice recognition not supported in this browser');
      return;
    }
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    
    recognition.onstart = () => {
      setIsVoiceActive(true);
    };
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setVoiceInput(transcript);
      
      // Auto-trigger search if company name detected
      if (transcript.length > 2 && onGenerateIntelligence) {
        onGenerateIntelligence({
          companyName: transcript,
          vendorName: 'ProspectPI',
          productName: 'Intelligence Platform',
          industry: 'Unknown',
          primaryPainPoint: 'Market Intelligence'
        });
      }
    };
    
    recognition.onerror = (event: any) => {
      console.error('Voice recognition error:', event.error);
      setIsVoiceActive(false);
    };
    
    recognition.onend = () => {
      setIsVoiceActive(false);
    };
    
    recognition.start();
    recognitionRef.current = recognition;
  };
  
  const stopVoiceRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsVoiceActive(false);
  };
  
  // Swipe Gestures for Section Navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setSwipeStart({ x: touch.clientX, y: touch.clientY });
  };
  
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!currentDossier?.sections) return;
    
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - swipeStart.x;
    const deltaY = Math.abs(touch.clientY - swipeStart.y);
    
    // Horizontal swipe detection (ignore if too much vertical movement)
    if (Math.abs(deltaX) > 50 && deltaY < 100) {
      if (deltaX > 0 && currentSection > 0) {
        // Swipe right - previous section
        setCurrentSection(currentSection - 1);
      } else if (deltaX < 0 && currentSection < currentDossier.sections.length - 1) {
        // Swipe left - next section
        setCurrentSection(currentSection + 1);
      }
    }
  };
  
  // Mobile Performance Optimization
  const [performanceMode, setPerformanceMode] = useState<'full' | 'battery' | 'emergency'>('full');
  
  useEffect(() => {
    // Battery optimization detection
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        const updatePerformanceMode = () => {
          if (battery.level < 0.15) {
            setPerformanceMode('emergency');
          } else if (battery.level < 0.3 || !battery.charging) {
            setPerformanceMode('battery');
          } else {
            setPerformanceMode('full');
          }
        };
        
        battery.addEventListener('levelchange', updatePerformanceMode);
        battery.addEventListener('chargingchange', updatePerformanceMode);
        updatePerformanceMode();
      });
    }
    
    // Network detection for performance
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (connection) {
      const updateNetworkPerformance = () => {
        if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
          setPerformanceMode('emergency');
        }
      };
      connection.addEventListener('change', updateNetworkPerformance);
      updateNetworkPerformance();
    }
  }, []);
  
  const renderMobileOptimized = () => {
    if (performanceMode === 'emergency') {
      return (
        <div className="min-h-screen bg-white p-4">
          <Card className="mb-4">
            <CardContent className="pt-6 text-center">
              <h2 className="text-lg font-bold text-gray-900 mb-2">Emergency Performance Mode</h2>
              <p className="text-sm text-gray-600 mb-4">Optimized for low battery and slow connections</p>
              
              <div className="space-y-3">
                <Input 
                  placeholder="Company name..."
                  value={voiceInput}
                  onChange={(e) => setVoiceInput(e.target.value)}
                  className="text-lg py-4"
                />
                
                <Button 
                  onClick={() => onGenerateIntelligence?.({
                    companyName: voiceInput,
                    vendorName: 'ProspectPI',
                    productName: 'Intelligence Platform',
                    industry: 'Unknown',
                    primaryPainPoint: 'Market Intelligence'
                  })}
                  disabled={!voiceInput.trim() || isGenerating}
                  className="w-full py-4 text-lg"
                >
                  {isGenerating ? 'Generating...' : 'Generate Intelligence'}
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {currentDossier && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-bold text-lg mb-2">{currentDossier.companyName}</h3>
                <p className="text-sm text-gray-600">{currentDossier.executiveSummary}</p>
              </CardContent>
            </Card>
          )}
        </div>
      );
    }
    
    return (
      <div 
        className="min-h-screen bg-gradient-to-b from-brand-navy-50 to-white"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Mobile Status Bar */}
        <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                isOnline ? 'bg-green-500' : 'bg-red-500'
              }`} />
              <span className="text-xs font-medium">
                {isOnline ? 'Online' : 'Offline'}
              </span>
              <div className={`text-xs px-2 py-1 rounded ${
                performanceMode === 'full' ? 'bg-green-100 text-green-800' :
                performanceMode === 'battery' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {performanceMode.toUpperCase()}
              </div>
            </div>
            
            {currentDossier?.sections && (
              <div className="flex items-center gap-2">
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => setCurrentSection(Math.max(0, currentSection - 1))}
                  disabled={currentSection === 0}
                  className="touch-target"
                  style={{ minWidth: '44px', minHeight: '44px' }}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                
                <span className="text-xs font-medium px-2">
                  {currentSection + 1} / {currentDossier.sections.length}
                </span>
                
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => setCurrentSection(Math.min(currentDossier.sections.length - 1, currentSection + 1))}
                  disabled={currentSection >= currentDossier.sections.length - 1}
                  className="touch-target"
                  style={{ minWidth: '44px', minHeight: '44px' }}
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
        
        {/* Main Content */}
        <div className="px-4 py-6 pb-20">
          {!currentDossier ? (
            <div className="space-y-6">
              {/* Voice Input Button */}
              <Card className="shadow-lg">
                <CardContent className="pt-6 text-center">
                  <Button
                    onClick={isVoiceActive ? stopVoiceRecognition : startVoiceRecognition}
                    className={`w-24 h-24 rounded-full text-white font-bold ${
                      isVoiceActive 
                        ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                        : 'bg-brand-purple-600 hover:bg-brand-purple-700'
                    }`}
                    style={{ minHeight: '44px' }}
                  >
                    {isVoiceActive ? (
                      <MicOff className="h-8 w-8" />
                    ) : (
                      <Mic className="h-8 w-8" />
                    )}
                  </Button>
                  
                  <p className="text-sm text-gray-600 mt-3">
                    {isVoiceActive ? 'Listening... Speak a company name' : 'Tap to speak company name'}
                  </p>
                  
                  {voiceInput && (
                    <p className="text-lg font-semibold text-brand-navy-900 mt-2">
                      "{voiceInput}"
                    </p>
                  )}
                </CardContent>
              </Card>
              
              {/* Smart Company Input */}
              <SmartCompanyInput 
                onGenerate={onGenerateIntelligence}
                isGenerating={isGenerating}
              />
            </div>
          ) : (
            <ProgressiveDossierReveal 
              companyName={currentDossier.companyName}
              executiveSummary={currentDossier.executiveSummary}
              sections={currentDossier.sections}
              onGenerateAnother={() => window.location.reload()}
            />
          )}
        </div>
        
        {/* Install PWA Prompt */}
        {isOnline && (
          <div className="fixed bottom-4 left-4 right-4">
            <Card className="bg-brand-navy-900 text-white shadow-xl">
              <CardContent className="py-3 px-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium">Install ProspectPI</p>
                    <p className="text-xs text-gray-300">Work offline with full features</p>
                  </div>
                  <Button 
                    size="sm" 
                    className="bg-white text-brand-navy-900 hover:bg-gray-100 ml-3"
                    style={{ minHeight: '44px' }}
                  >
                    Install
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    );
  };
  
  return renderMobileOptimized();
};