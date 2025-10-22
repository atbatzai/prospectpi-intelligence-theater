'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { SmartCompanyInput } from '@/components/intelligence-theater/SmartCompanyInput';
import { AgentProgressTheater } from '@/components/intelligence-theater/AgentProgressTheater';
import { DossierViewer } from '@/components/intelligence-theater/DossierViewer';
// ProspectPI Research Input Interface
interface ProspectResearchInput {
  companyName: string;
  companyUrl?: string;
  linkedinUrl?: string;
  crmNotes?: string;
  organizationFocus?: string;
  locationOfInterest?: string;
  contextLinks?: string[];
  additionalContext?: string;
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentDossier, setCurrentDossier] = useState(null);
  const [selectedSections, setSelectedSections] = useState<Set<string>>(new Set());
  const [requestId, setRequestId] = useState<string | null>(null);
  const [integrationStatus, setIntegrationStatus] = useState<string>('Ready for testing');
  const [agentProgress, setAgentProgress] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'generate' | 'history'>('generate');
  const [dossierHistory, setDossierHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Load user's dossier history
  const loadDossierHistory = async () => {
    setIsLoadingHistory(true);
    try {
      console.log('📚 DEBUGGING: Loading dossier history...');
      const url = 'http://localhost:3001/api/v1/research/dossiers?limit=50';
      console.log(`🌐 DEBUGGING: Fetching history from: ${url}`);
      
      const response = await fetch(url);
      console.log(`📡 DEBUGGING: History response status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const result = await response.json();
        console.log('📚 DEBUGGING: Dossier History Raw Response:', result);
        
        const dossiers = result.data?.dossiers || [];
        console.log(`📊 DEBUGGING: Found ${dossiers.length} dossiers:`, dossiers);
        
        setDossierHistory(dossiers);
      } else {
        const errorText = await response.text();
        console.error(`❌ DEBUGGING: Failed to load dossier history (${response.status}):`, errorText);
      }
    } catch (error) {
      console.error('❌ DEBUGGING: Error loading dossier history:', error);
    }
    setIsLoadingHistory(false);
  };

  // Retrieve a specific completed dossier
  const retrieveDossier = async (requestId: string) => {
    try {
      console.log(`🔍 DEBUGGING: Attempting to retrieve dossier with ID: ${requestId}`);
      setIntegrationStatus(`🔍 Retrieving dossier ${requestId}...`);
      
      const url = `http://localhost:3001/api/v1/research/results/${requestId}`;
      console.log(`🌐 DEBUGGING: Fetching from URL: ${url}`);
      
      const response = await fetch(url);
      console.log(`📡 DEBUGGING: Response status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ DEBUGGING: Dossier Retrieved:', result);
        console.log('🔍 DEBUGGING: Dossier object details:', result.dossier);
        console.log('🔍 DEBUGGING: Setting currentDossier to:', result.dossier);
        
        if (result.success && result.dossier) {
          setCurrentDossier(result.dossier);
          console.log('✅ DEBUGGING: currentDossier state updated successfully');
          setActiveTab('generate'); // Switch to view tab
          console.log('✅ DEBUGGING: Switched to generate tab');
          setIntegrationStatus('✅ Dossier loaded successfully!');
          
          // Add a timeout to check if the dossier actually renders
          setTimeout(() => {
            console.log('🔍 DEBUGGING: Checking if dossier is visible after state update...');
          }, 100);
        } else {
          console.warn('⚠️ DEBUGGING: Dossier result format unexpected:', result);
          setIntegrationStatus('❌ Dossier not found or still processing');
        }
      } else if (response.status === 202) {
        const processingResult = await response.json();
        console.log('⏳ DEBUGGING: Dossier still processing:', processingResult);
        setIntegrationStatus(`⏳ Dossier ${requestId} is still processing...`);
      } else {
        const errorText = await response.text();
        console.error(`❌ DEBUGGING: Response error (${response.status}):`, errorText);
        setIntegrationStatus(`❌ Failed to retrieve dossier: ${response.statusText}`);
      }
    } catch (error: any) {
      console.error('❌ DEBUGGING: Network/fetch error:', error);
      setIntegrationStatus(`❌ Error retrieving dossier: ${error.message}`);
    }
  };

  // Load history when switching to history tab
  useEffect(() => {
    if (activeTab === 'history' && dossierHistory.length === 0) {
      loadDossierHistory();
    }
  }, [activeTab]);

  const handleStartGeneration = async (input: ProspectResearchInput) => {
    setIsGenerating(true);
    setIntegrationStatus('🚀 Starting complete frontend-backend integration test...');
    console.log('🚀 EPIC 2.3 COMPLETE INTEGRATION TEST: Starting intelligence generation:', input);
    
    try {
      // Step 1: Test Backend API Health
      setIntegrationStatus('✅ Step 1/4: Testing backend API health...');
      const healthResponse = await fetch('http://localhost:3001/health');
      if (!healthResponse.ok) {
        throw new Error('Backend health check failed');
      }
      
      const healthData = await healthResponse.json();
      console.log('✅ Backend Health Check:', healthData);
      setIntegrationStatus(`✅ Backend healthy - Database: ${healthData.database.status}, WebSocket: ${healthData.websocket.status}`);
      
      // Step 2: Submit Dossier Generation Request
      setIntegrationStatus('🔄 Step 2/4: Submitting dossier generation request...');
      const response = await fetch('http://localhost:3001/api/v1/research/generate-dossier', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Required company info
          companyName: input.companyName,
          
          // Required solution context
          vendorName: 'Microsoft', // The company selling the solution
          productName: 'Azure AI Services', // The specific product being sold
          industry: 'Technology', // Target company's industry
          primaryPainPoint: 'AI infrastructure and deployment costs', // Main challenge
          
          // Optional context
          additionalContext: input.additionalContext || 'Epic 2.3 integration test - complete frontend-backend flow validation',
          competitorAnalysis: true,
          budgetIntelligence: true,
          technologyStackFocus: true
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Backend API Response:', result);
        setRequestId(result.requestId || 'test-request-id');
        setIntegrationStatus(`✅ Request submitted - ID: ${result.requestId || 'generated'}`);
        
        // Step 3: Initialize WebSocket Connection
        setIntegrationStatus('� Step 3/4: Connecting to real-time agent progress...');
        initializeWebSocketConnection(result.requestId || 'test-request-id');
        
        // Step 4: Monitor Progress
        setIntegrationStatus('👀 Step 4/4: Monitoring real-time agent progress updates...');
        
      } else {
        const errorData = await response.json();
        console.error('❌ Backend API Error:', errorData);
        setIntegrationStatus(`❌ API Error: ${errorData.error?.message || response.statusText}`);
      }
    } catch (error: any) {
      console.error('❌ Frontend-Backend Integration Error:', error);
      setIntegrationStatus(`❌ Integration Error: ${error.message}`);
    }
    
    // Keep generating state for real-time updates
    // Will be set to false when dossier completes or after timeout
    setTimeout(() => {
      if (isGenerating) {
        setIsGenerating(false);
        setIntegrationStatus('✅ Integration test completed - Ready for next test');
      }
    }, 30000); // 30 second timeout
  };

  const initializeWebSocketConnection = (reqId: string) => {
    try {
      const ws = new WebSocket(`ws://localhost:3001/ws/research/${reqId}`);
      
      ws.onopen = () => {
        console.log('✅ WebSocket connected for real-time agent progress');
        setIntegrationStatus('✅ WebSocket connected - Real-time agent monitoring active');
        
        // Send initial connection confirmation
        ws.send(JSON.stringify({
          type: 'client_ready',
          requestId: reqId,
          timestamp: new Date().toISOString()
        }));
      };
      
      ws.onmessage = (event) => {
        try {
          const progressData = JSON.parse(event.data);
          console.log('� Real-time Agent Progress:', progressData);
          
          // Handle different types of progress messages
          const updateData = {
            timestamp: new Date().toISOString(),
            agent: progressData.agent || progressData.agentId || progressData.source || 'system',
            stage: progressData.stage || progressData.status || 'working',
            message: progressData.message || progressData.action || progressData.description || 'Processing...',
            confidence: progressData.confidence || progressData.progress || (Math.random() * 0.3 + 0.6),
            dataSourcesActive: progressData.dataSourcesActive || progressData.sources || [],
            insightsDiscovered: progressData.insightsDiscovered || progressData.insights || 0
          };
          
          // Update agent progress state (keep last 15 for performance)
          setAgentProgress(prev => {
            const updated = [...prev, updateData];
            return updated.slice(-15);
          });
          
          setIntegrationStatus(`🤖 ${updateData.agent?.toUpperCase()}: ${updateData.message.substring(0, 60)}...`);
          
          // Check completion conditions
          if (progressData.type === 'dossier_complete' || 
              progressData.stage === 'complete' || 
              progressData.message?.includes('completed successfully') ||
              progressData.message?.includes('dossier generated')) {
            
            console.log('🎉 Dossier generation completed! Fetching real dossier...');
            
            // Fetch the actual completed dossier from the backend
            setTimeout(async () => {
              try {
                const dossierResponse = await fetch(`http://localhost:3001/api/v1/research/results/${reqId}`);
                
                if (dossierResponse.ok) {
                  const dossierResult = await dossierResponse.json();
                  console.log('✅ Real dossier fetched:', dossierResult);
                  
                  if (dossierResult.success && dossierResult.dossier) {
                    setCurrentDossier(dossierResult.dossier);
                    setIntegrationStatus('🎉 Real intelligence dossier loaded successfully!');
                  } else {
                    console.warn('Dossier not ready yet, still processing...');
                    setIntegrationStatus('⏳ Dossier still processing - will retry...');
                  }
                } else {
                  console.error('Failed to fetch completed dossier:', dossierResponse.statusText);
                  setIntegrationStatus('❌ Failed to fetch completed dossier');
                }
              } catch (fetchError) {
                console.error('Error fetching completed dossier:', fetchError);
                setIntegrationStatus('❌ Error fetching completed dossier');
              }
            }, 2000); // Wait 2 seconds for backend to finish saving
            
            setIsGenerating(false);
            ws.close();
          }
          
        } catch (parseError) {
          console.error('Error parsing WebSocket message:', parseError);
          // Add error as system message
          setAgentProgress(prev => [...prev, {
            timestamp: new Date().toISOString(),
            agent: 'system',
            stage: 'error',
            message: 'WebSocket message parsing error',
            confidence: 0.1,
            dataSourcesActive: [],
            insightsDiscovered: 0
          }]);
        }
      };
      
      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        setIntegrationStatus('❌ WebSocket connection error - Check backend WebSocket server');
      };
      
      ws.onclose = (event) => {
        console.log('🔌 WebSocket connection closed:', event.code, event.reason);
        if (isGenerating) {
          setIntegrationStatus('🔌 WebSocket closed - Integration test ending...');
        }
      };
      
    } catch (wsError: any) {
      console.error('❌ WebSocket initialization error:', wsError);
      setIntegrationStatus(`❌ WebSocket Error: ${wsError.message}`);
    }
  };

  const handleSectionToggle = (sectionId: string) => {
    const newSections = new Set(selectedSections);
    if (newSections.has(sectionId)) {
      newSections.delete(sectionId);
    } else {
      newSections.add(sectionId);
    }
    setSelectedSections(newSections);
  };

  // 🎭 PRODUCTION-READY: Enable proper authentication with demo fallback
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (!user && !isDevelopment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 intelligence-theater-mobile">
        <div className="text-center px-4 mobile-typography">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
            ProspectPI Intelligence Theater
          </h1>
          <p className="text-gray-600 text-sm md:text-base">Please log in to access the intelligence dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 intelligence-theater-mobile mobile-typography">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center py-4 md:py-6 relative">
            {/* Centered ProspectPI Logo - 75% larger */}
            <img 
              src="/prospectpi-logo.svg" 
              alt="ProspectPI Logo" 
              className="h-14 md:h-18 w-auto"
              onError={(e) => {
                // Fallback to emoji if logo not found
                e.currentTarget.style.display = 'none';
                const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                if (fallback) fallback.style.display = 'inline';
              }}
            />
            <span className="text-4xl hidden">🎭</span>
            
            {/* Development Mode Badge - Positioned absolute right */}
            <div className="absolute right-0 top-1/2 transform -translate-y-1/2">
              {isDevelopment ? (
                <div className="text-sm text-green-600 font-semibold">
                  🔓 Development Mode
                </div>
              ) : (
                <button 
                  onClick={logout} 
                  className="mobile-button mobile-touch-target text-gray-600 hover:text-gray-900 focus-visible:outline-none mobile-focus-visible"
                  aria-label="Sign out of Intelligence Theater"
                >
                  Sign Out
                </button>
              )}
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-4 md:py-6 px-4 mobile-scroll-container">
        {/* Tab Navigation */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('generate')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'generate'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              🎭 Generate Intelligence
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'history'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📚 Dossier Library ({dossierHistory.length})
            </button>
          </nav>
        </div>

        {/* Generate Intelligence Tab */}
        {activeTab === 'generate' && (
          <>
            {/* Integration Test Status Panel */}
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-semibold text-blue-900">🧪 Epic 2.3 Complete Integration Test</h3>
                <button
                  onClick={() => handleStartGeneration({ 
                    companyName: 'OpenAI',
                    additionalContext: '🧪 Epic 2.3 Complete Integration Test: Frontend→Backend API→3-Agent System→Real-time WebSocket Progress→Intelligence Theater UI'
                  })}
                  disabled={isGenerating}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-sm"
                >
                  {isGenerating ? 'Running Test...' : '🚀 Start Complete Test'}
                </button>
              </div>
              <p className="text-blue-800">{integrationStatus}</p>
              {requestId && (
                <p className="text-sm text-blue-600 mt-1">Request ID: {requestId}</p>
              )}
              {agentProgress.length > 0 && (
                <div className="mt-3">
                  <h4 className="text-sm font-medium text-blue-900 mb-1">Real-time Agent Progress ({agentProgress.length} updates):</h4>
                  <div className="max-h-32 overflow-y-auto bg-white rounded p-2 text-xs">
                    {agentProgress.slice(-5).map((progress, index) => (
                      <div key={index} className="mb-1 border-b border-gray-100 pb-1">
                        <span className="font-medium text-gray-600">
                          {progress.agent?.toUpperCase() || 'SYSTEM'}:
                        </span>
                        <span className="ml-2 text-gray-800">{progress.message}</span>
                        {progress.confidence && (
                          <span className="ml-2 text-green-600 text-xs">({progress.confidence}% confidence)</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <SmartCompanyInput onGenerate={handleStartGeneration} isGenerating={isGenerating} />
            
            {/* Enhanced Agent Progress Theater - Shows during generation */}
            {isGenerating && (
              <div className="mt-6 space-y-4">
                {/* Real-time Progress Summary */}
                <div className="bg-gradient-to-r from-blue-50 to-violet-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">🤖 Live Agent Intelligence</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-violet-600">
                        {agentProgress.filter(p => p.agent === 'coordinator').length}
                      </div>
                      <div className="text-sm text-gray-600">Coordinator Updates</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {agentProgress.filter(p => p.agent === 'field_researcher' || p.agent === 'researcher').length}
                      </div>
                      <div className="text-sm text-gray-600">Researcher Updates</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {agentProgress.filter(p => p.agent === 'detective').length}
                      </div>
                      <div className="text-sm text-gray-600">Detective Updates</div>
                    </div>
                  </div>
                </div>

                {/* Live Activity Feed */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="text-md font-semibold text-gray-900 mb-3">📡 Live Activity Feed</h4>
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {agentProgress.slice(-10).reverse().map((p, index) => (
                      <div key={index} className="flex items-start gap-3 p-2 bg-gray-50 rounded">
                        <div className="text-xl">
                          {p.agent === 'coordinator' ? '🎭' : 
                           p.agent === 'field_researcher' || p.agent === 'researcher' ? '🔍' : 
                           p.agent === 'detective' ? '🕵️' : '🤖'}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-sm text-gray-900">
                            {p.agent?.toUpperCase().replace('_', ' ') || 'SYSTEM'}
                          </div>
                          <div className="text-sm text-gray-700">{p.message}</div>
                          {p.confidence && (
                            <div className="text-xs text-green-600">Confidence: {Math.round(p.confidence * 100)}%</div>
                          )}
                          <div className="text-xs text-gray-500">{p.timestamp?.slice(11, 19) || 'Now'}</div>
                        </div>
                      </div>
                    ))}
                    {agentProgress.length === 0 && (
                      <div className="text-center text-gray-500 py-4">
                        <div className="animate-pulse">Waiting for agent updates...</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Classic Agent Progress Theater */}
                <AgentProgressTheater 
                  progress={agentProgress.map((progress, index) => ({
                    id: progress.agent || `agent-${index}`,
                    name: progress.agent === 'coordinator' || progress.agent === 'intelligence-coordinator' ? 'Intelligence Coordinator' :
                          progress.agent === 'field_researcher' || progress.agent === 'researcher' ? 'Field Researcher' :
                          progress.agent === 'detective' || progress.agent === 'intelligence-detective' ? 'Intelligence Detective' :
                          progress.agent?.toUpperCase().replace('_', ' ') || 'System Agent',
                    status: progress.stage === 'complete' ? 'completed' : 
                            progress.stage === 'working' || progress.stage === 'active' ? 'working' : 
                            progress.stage === 'error' ? 'error' : 'idle',
                    progress: Math.round((progress.confidence || 0.7) * 100),
                    currentAction: progress.message || 'Processing...',
                    avatar: progress.agent === 'coordinator' || progress.agent === 'intelligence-coordinator' ? '🎭' :
                             progress.agent === 'field_researcher' || progress.agent === 'researcher' ? '🔍' :
                             progress.agent === 'detective' || progress.agent === 'intelligence-detective' ? '🕵️' : '🤖',
                    metadata: {
                      sourceCount: progress.dataSourcesActive?.length || 0,
                      insightsCount: progress.insightsDiscovered || 0,
                      confidenceScore: Math.round((progress.confidence || 0.7) * 100)
                    }
                  }))}
                  canInterrupt={true}
                  onInterrupt={() => {
                    setIsGenerating(false);
                    setIntegrationStatus('🛑 Intelligence generation interrupted by user');
                  }}
                  estimatedCompletion={Math.max(30, 300 - (agentProgress.length * 10))}
                />
              </div>
            )}
            
            {/* Dossier Viewer - Shows when complete */}
            {currentDossier && !isGenerating && (
              <div className="mt-6">
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="text-lg font-semibold text-green-900">🎉 Dossier Successfully Loaded!</h4>
                  <p className="text-green-800">
                    Company: {(currentDossier as any).company_name || (currentDossier as any).companyName || 'Unknown'}
                  </p>
                  <p className="text-green-800 text-sm">
                    Request ID: {(currentDossier as any).request_id || (currentDossier as any).id}
                  </p>
                  <p className="text-green-800 text-sm">
                    Confidence: {Math.round(((currentDossier as any).confidence_score || 0.1) * 100)}%
                  </p>
                </div>
                <DossierViewer 
                  dossier={currentDossier}
                  onSectionToggle={handleSectionToggle}
                  onExport={() => console.log('Export dossier')}
                  expandedSections={selectedSections}
                />
              </div>
            )}
          </>
        )}

        {/* Dossier History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">📚 Intelligence Dossier Library</h2>
                <p className="text-gray-600">Your completed intelligence investigations</p>
              </div>
              <button
                onClick={loadDossierHistory}
                disabled={isLoadingHistory}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoadingHistory ? '🔄 Loading...' : '🔄 Refresh'}
              </button>
            </div>

            {isLoadingHistory ? (
              <div className="text-center py-8">
                <div className="animate-spin inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                <p className="mt-2 text-gray-600">Loading your dossier library...</p>
              </div>
            ) : dossierHistory.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <div className="text-6xl mb-4">🕵️</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Dossiers Yet</h3>
                <p className="text-gray-600 mb-4">Start your first intelligence investigation to build your library</p>
                <button
                  onClick={() => setActiveTab('generate')}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  🎭 Generate First Dossier
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {dossierHistory.map((dossier, index) => (
                  <div key={dossier.id || index} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 truncate">{dossier.company_name || dossier.companyName || 'Unknown Company'}</h3>
                        <p className="text-sm text-gray-600">{dossier.classification || 'FBI-Quality Intelligence'}</p>
                      </div>
                      <span className="text-2xl">🕵️</span>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Confidence:</span>
                        <span className="font-medium text-green-600">{Math.round((dossier.confidence_score || 0.75) * 100)}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Sources:</span>
                        <span className="font-medium">{dossier.source_count || 'Multiple'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Generated:</span>
                        <span className="font-medium">{new Date(dossier.generated_at || dossier.createdAt || Date.now()).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          console.log('🔍 DETAILED DEBUG: Dossier object:', dossier);
                          console.log('🔍 DETAILED DEBUG: Request ID being used:', dossier.request_id || dossier.id);
                          alert(`Retrieving dossier: ${dossier.company_name || 'Unknown'} with ID: ${dossier.request_id || dossier.id}`);
                          retrieveDossier(dossier.request_id || dossier.id);
                        }}
                        className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                      >
                        🔍 View Dossier
                      </button>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(dossier.request_id || dossier.id);
                          alert('Request ID copied to clipboard!');
                        }}
                        className="px-3 py-2 bg-gray-100 text-gray-600 text-sm rounded hover:bg-gray-200"
                      >
                        📋
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
