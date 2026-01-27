/**
 * Frontend Emma - Guided Mode Wrapper
 * Story 2.1: Novice-First Foundation
 * 
 * Provides step-by-step guidance for first-time users
 */

import { useState, useEffect } from 'react';
import { SmartCompanyInput } from './SmartCompanyInput';
import { AgentProgressTheater } from './AgentProgressTheater';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, ArrowRight, CheckCircle } from 'lucide-react';

interface GuidedModeStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

interface GuidedModeWrapperProps {
  onComplete?: () => void;
  onSkip?: () => void;
}

export const GuidedModeWrapper: React.FC<GuidedModeWrapperProps> = ({
  onComplete,
  onSkip
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [showGuidance, setShowGuidance] = useState(true);
  const [steps, setSteps] = useState<GuidedModeStep[]>([
    {
      id: 'welcome',
      title: 'Welcome to ProspectPI Intelligence',
      description: 'Generate comprehensive business intelligence in under 2 minutes',
      completed: false
    },
    {
      id: 'input',
      title: 'Enter a Company Name',
      description: 'Try Netflix, Apple, or any company you are researching',
      completed: false
    },
    {
      id: 'generate',
      title: 'Watch the Intelligence Theater',
      description: 'Our AI agents gather and analyze data from 12+ sources',
      completed: false
    },
    {
      id: 'results',
      title: 'Review Your Dossier',
      description: 'Get actionable insights and export professional reports',
      completed: false
    }
  ]);

  const handleNextStep = () => {
    if (currentStep < steps.length - 1) {
      setSteps(prev => prev.map((step, idx) => 
        idx === currentStep ? { ...step, completed: true } : step
      ));
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete?.();
    }
  };

  const handleSkipGuidance = () => {
    setShowGuidance(false);
    onSkip?.();
  };

  if (!showGuidance) {
    return null;
  }

  return (
    <Card className="border-2 border-brand-purple-200 bg-gradient-to-br from-brand-purple-50 to-white mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Lightbulb className="h-6 w-6 text-brand-purple-600" />
            <CardTitle className="text-xl">First Time Here? Let Us Guide You!</CardTitle>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleSkipGuidance}
            className="text-gray-500 hover:text-gray-700"
          >
            Skip Guide
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-6">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full flex items-center justify-center border-2">
                  {step.completed ? <CheckCircle className="h-5 w-5" /> : index + 1}
                </div>
                <span className="text-xs mt-2 max-w-[80px] text-center">{step.title.split(' ')[0]}</span>
              </div>
              {index < steps.length - 1 && (
                <div className="h-0.5 w-16 mx-2" />
              )}
            </div>
          ))}
        </div>

        {/* Current Step Content */}
        <div className="bg-white rounded-lg p-6 border border-brand-purple-200">
          <Badge className="mb-3" variant="outline">
            Step {currentStep + 1} of {steps.length}
          </Badge>
          <h3 className="text-xl font-bold text-brand-navy-900 mb-2">
            {steps[currentStep].title}
          </h3>
          <p className="text-gray-600 mb-4">
            {steps[currentStep].description}
          </p>
          
          <Button 
            onClick={handleNextStep}
            className="detective-button-primary flex items-center gap-2"
          >
            {currentStep < steps.length - 1 ? (
              <>
                Next Step <ArrowRight className="h-4 w-4" />
              </>
            ) : (
              <>
                Start Using ProspectPI <CheckCircle className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>

        {/* Tips Section */}
        <div className="bg-brand-navy-50 rounded-lg p-4 border border-brand-navy-200">
          <h4 className="font-semibold text-brand-navy-900 mb-2 flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Pro Tip
          </h4>
          {currentStep === 0 && (
            <p className="text-sm text-gray-700">
              ProspectPI uses AI agents to gather intelligence from 12+ premium data sources automatically.
            </p>
          )}
          {currentStep === 1 && (
            <p className="text-sm text-gray-700">
              Try starting with a well-known company like Netflix to see our full capabilities.
            </p>
          )}
          {currentStep === 2 && (
            <p className="text-sm text-gray-700">
              Watch the Intelligence Theater to see which data sources are being analyzed in real-time.
            </p>
          )}
          {currentStep === 3 && (
            <p className="text-sm text-gray-700">
              Export your dossier as PDF or integrate with Salesforce for instant CRM updates.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
