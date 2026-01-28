'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Search, 
  Eye, 
  Shield, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  TrendingUp,
  Building2,
  Users,
  DollarSign,
  Zap
} from 'lucide-react';
import { InvestigationStatus, EvidenceBadge } from './ProspectPIHeader';

interface AgentUpdate {
  agentName: string;
  phase: string;
  message: string;
  progress: number;
  status: 'investigating' | 'analyzing' | 'complete' | 'alert';
  timestamp: string;
  details?: string[];
  evidence?: string[];
}

interface NoviceIntelligenceTheaterProps {
  companyName: string;
  isActive: boolean;
  onComplete?: () => void;
  showDetailedProgress?: boolean;
}

export function NoviceIntelligenceTheater({
  companyName,
  isActive,
  onComplete,
  showDetailedProgress = false
}: NoviceIntelligenceTheaterProps) {
  const [currentPhase, setCurrentPhase] = useState(0);
  const [overallProgress, setOverallProgress] = useState(0);
  const [agentUpdates, setAgentUpdates] = useState<AgentUpdate[]>([]);
  const [discoveredClues, setDiscoveredClues] = useState<string[]>([]);
  const [databasesChecked, setDatabasesChecked] = useState(0);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState(45);

  // Novice-friendly investigation phases
  const investigationPhases = [
    {
      name: 'Company Discovery',
      agent: 'Intelligence Coordinator',
      icon: <Search className="h-5 w-5" />,
      description: 'Finding basic company information',
      plainEnglish: 'Looking up who they are and what they do',
      estimatedTime: '15-30 seconds',
      activities: [
        'Searching company websites',
        'Checking business directories', 
        'Verifying company details',
        'Gathering contact information'
      ]
    },
    {
      name: 'Market Research',
      agent: 'Field Researcher',
      icon: <TrendingUp className="h-5 w-5" />,
      description: 'Investigating industry and competitive landscape',
      plainEnglish: 'Understanding their market and competition',
      estimatedTime: '30-45 seconds',
      activities: [
        'Analyzing industry trends',
        'Identifying key competitors',
        'Researching market position',
        'Evaluating growth metrics'
      ]
    },
    {
      name: 'Financial Analysis',
      agent: 'Intelligence Detective',
      icon: <DollarSign className="h-5 w-5" />,
      description: 'Analyzing financial health and performance',
      plainEnglish: 'Checking their financial situation',
      estimatedTime: '20-35 seconds',
      activities: [
        'Reviewing financial statements',
        'Checking credit ratings',
        'Analyzing revenue trends',
        'Assessing investment activity'
      ]
    },
    {
      name: 'Intelligence Synthesis',
      agent: 'Cultural Intelligence Agent',
      icon: <Shield className="h-5 w-5" />,
      description: 'Creating comprehensive intelligence dossier',
      plainEnglish: 'Putting together your complete report',
      estimatedTime: '10-20 seconds',
      activities: [
        'Synthesizing all findings',
        'Cross-referencing data points',
        'Generating insights',
        'Finalizing dossier'
      ]
    }
  ];

  // Simulate realistic investigation progress
  useEffect(() => {
    if (!isActive) return;

    const runInvestigation = async () => {
      setAgentUpdates([]);
      setDiscoveredClues([]);
      setOverallProgress(0);

      for (let phaseIndex = 0; phaseIndex < investigationPhases.length; phaseIndex++) {
        setCurrentPhase(phaseIndex);
        const phase = investigationPhases[phaseIndex];

        // Start phase
        const startUpdate: AgentUpdate = {
          agentName: phase.agent,
          phase: phase.name,
          message: `Starting ${phase.plainEnglish.toLowerCase()}`,
          progress: 0,
          status: 'investigating',
          timestamp: new Date().toISOString(),
          details: [phase.description]
        };
        setAgentUpdates(prev => [...prev, startUpdate]);

        // Simulate phase activities
        const activities = phase.activities;
        for (let i = 0; i < activities.length; i++) {
          await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
          
          const activityProgress = ((i + 1) / activities.length) * 100;
          const phaseUpdate: AgentUpdate = {
            agentName: phase.agent,
            phase: phase.name,
            message: activities[i],
            progress: activityProgress,
            status: 'analyzing',
            timestamp: new Date().toISOString(),
            details: [activities[i]]
          };
          
          setAgentUpdates(prev => [...prev.slice(-5), phaseUpdate]);
          setOverallProgress(((phaseIndex + (i + 1) / activities.length) / investigationPhases.length) * 100);

          // Add discovered clues
          if (Math.random() > 0.6) {
            const clues = generateRelevantClues(companyName, phase.name);
            setDiscoveredClues(prev => [...prev, ...clues.slice(0, 1)]);
          }
        }

        // Complete phase
        const completeUpdate: AgentUpdate = {
          agentName: phase.agent,
          phase: phase.name,
          message: `✅ Completed ${phase.plainEnglish.toLowerCase()}`,
          progress: 100,
          status: 'complete',
          timestamp: new Date().toISOString(),
          details: [`${phase.name} investigation complete`],
          evidence: [`Key insights discovered for ${companyName}`]
        };
        setAgentUpdates(prev => [...prev.slice(-5), completeUpdate]);
      }

      // Investigation complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      setOverallProgress(100);
      onComplete?.();
    };

    runInvestigation();
  }, [isActive, companyName, onComplete]);

  const generateRelevantClues = (company: string, phase: string): string[] => {
    const clueTemplates = {
      'Company Discovery': [
        `${company} headquarters located`,
        `Employee count estimated`,
        `Primary business model identified`,
        `Key contact information found`
      ],
      'Market Research': [
        `Major competitors identified`,
        `Market share data located`,
        `Industry growth trends found`,
        `Competitive advantages noted`
      ],
      'Financial Analysis': [
        `Revenue estimates calculated`,
        `Funding history discovered`,
        `Credit rating assessed`,
        `Investment activity tracked`
      ],
      'Intelligence Synthesis': [
        `Strategic insights generated`,
        `Risk factors identified`,
        `Growth opportunities mapped`,
        `Intelligence summary complete`
      ]
    };

    return clueTemplates[phase as keyof typeof clueTemplates] || ['Intelligence gathered'];
  };

  const currentPhaseData = investigationPhases[currentPhase];
  const latestUpdate = agentUpdates[agentUpdates.length - 1];

  return (
    <div className="space-y-6">
      {/* Investigation Header */}
      <Card className="detective-card">
        <div className="investigation-header">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6" />
              <div>
                <h2 className="text-xl font-bold">Investigating {companyName}</h2>
                <p className="text-blue-100">Gathering comprehensive business intelligence</p>
              </div>
            </div>
            <InvestigationStatus 
              status={overallProgress === 100 ? 'complete' : 'analyzing'} 
              message={overallProgress === 100 ? 'Investigation Complete' : 'Active Investigation'}
            />
          </div>
        </div>
      </Card>

      {/* Overall Progress */}
      <Card className="detective-card">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-brand-navy-900">Investigation Progress</h3>
              <span className="text-sm text-brand-navy-600">{Math.round(overallProgress)}% Complete</span>
            </div>
            
            <div className="space-y-3">
              <Progress 
                value={overallProgress} 
                className="h-3 bg-brand-navy-100 [&>div]:bg-gradient-to-r [&>div]:from-brand-navy-600 [&>div]:to-brand-purple-600" 
              />
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {investigationPhases.map((phase, index) => (
                  <div 
                    key={phase.name}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      index < currentPhase ? 'border-green-200 bg-green-50' :
                      index === currentPhase ? 'border-brand-purple-300 bg-brand-purple-50 investigating-animation' :
                      'border-brand-navy-100 bg-brand-navy-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {phase.icon}
                      <span className="font-medium text-sm">{phase.name}</span>
                    </div>
                    <p className="text-xs text-brand-navy-600">{phase.plainEnglish}</p>
                    <div className="flex items-center gap-1 mt-2">
                      <Clock className="h-3 w-3 text-brand-navy-400" />
                      <span className="text-xs text-brand-navy-500">{phase.estimatedTime}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Agent Activity */}
      {latestUpdate && (
        <Card className="detective-card">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-brand-navy-900">Current Activity</h3>
                <EvidenceBadge variant="important">{latestUpdate.agentName}</EvidenceBadge>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  {currentPhaseData.icon}
                  <div className="flex-1">
                    <p className="font-medium text-brand-navy-800">{latestUpdate.message}</p>
                    <p className="text-sm text-brand-navy-600">{currentPhaseData.description}</p>
                  </div>
                  <InvestigationStatus status={latestUpdate.status} />
                </div>
                
                {showDetailedProgress && latestUpdate.details && (
                  <div className="ml-8 space-y-1">
                    {latestUpdate.details.map((detail, index) => (
                      <div key={`detail-${index}-${detail.slice(0,10)}`} className="flex items-center gap-2 text-sm text-brand-navy-600">
                        <div className="w-2 h-2 bg-brand-purple-400 rounded-full"></div>
                        <span>{detail}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Discovered Intelligence */}
      {discoveredClues.length > 0 && (
        <Card className="detective-card">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-brand-navy-600" />
                <h3 className="font-semibold text-brand-navy-900">Intelligence Discovered</h3>
                <EvidenceBadge>{discoveredClues.length} clues found</EvidenceBadge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {discoveredClues.map((clue, index) => (
                  <div 
                    key={`clue-${index}-${clue.slice(0,10)}`}
                    className="flex items-center gap-2 p-3 bg-brand-navy-50 rounded-lg clue-animation"
                  >
                    <div className="clue-indicator">{index + 1}</div>
                    <span className="text-sm text-brand-navy-700">{clue}</span>
                    <CheckCircle className="h-4 w-4 text-green-500 ml-auto" />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Time Estimation */}
      <Card className="detective-card border-brand-navy-100">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-brand-navy-500" />
              <span className="text-sm text-brand-navy-600">Estimated completion time:</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-brand-navy-800">
                {overallProgress === 100 ? 'Complete!' : '1-2 minutes remaining'}
              </span>
              {overallProgress === 100 && <CheckCircle className="h-4 w-4 text-green-500" />}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}