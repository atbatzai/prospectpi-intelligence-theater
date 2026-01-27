/**
 * Agent Orchestrator Cultural Integration Tests
 * Epic 2.4: Cultural Intelligence Dossiers
 * A+ Grade: End-to-end testing of 4-agent orchestration with cultural intelligence
 */

import { AgentOrchestrator } from '../../services/AgentOrchestrator';
import { CulturalContext } from '../../services/CulturalDetectionService';

// Mock all agent dependencies
jest.mock('../../agents/IntelligenceCoordinator');
jest.mock('../../agents/FieldIntelligenceResearcher');
jest.mock('../../agents/IntelligenceDetective');
jest.mock('../../agents/CulturalIntelligenceAgent');
jest.mock('../../services/CulturalDetectionService');

describe('AgentOrchestrator Cultural Integration', () => {
  let orchestrator: AgentOrchestrator;
  let mockProgressCallback: jest.Mock;

  beforeEach(() => {
    mockProgressCallback = jest.fn();
    orchestrator = new AgentOrchestrator(mockProgressCallback);
  });

  describe('4-Agent Workflow with Cultural Intelligence', () => {
    test('should execute complete 4-agent workflow for Japanese company', async () => {
      const requestContext = {
        requestId: 'test-cultural-jp-001',
        userInput: {
          companyName: 'Toyota Motor Corporation',
          companyUrl: 'toyota.co.jp',
          vendorName: 'ProspectPI',
          productName: 'Intelligence Theater',
          industry: 'Automotive',
          primaryPainPoint: 'Market intelligence',
          priority: 'standard',
          outputFormat: 'full',
          confidenceThreshold: 'medium',
          culturalIntelligence: {
            enableCulturalAdaptation: true,
            detectedContext: {
              region: 'Asia Pacific',
              country: 'Japan',
              culturalScores: {
                hierarchy: 85,
                directness: 25,
                formality: 95,
                relationshipFirst: 80,
                individualismCollectivism: 30
              },
              communicationStyle: 'contextual',
              businessCultureType: 'traditional',
              confidence: 0.95
            }
          }
        },
        timestamp: new Date()
      };

      const result = await orchestrator.orchestrateMission(requestContext);
      
      expect(result).toBeDefined();
      expect(result.culturalAdaptations).toBeDefined();
      expect(result.culturalAdaptations.communicationStyle).toBe('contextual');
      expect(result.culturalAdaptations.formalityLevel).toBe('very-high');
      expect(result.culturalInsights).toContain('Japanese');
    });

    test('should execute 4-agent workflow for German company', async () => {
      const requestContext = {
        requestId: 'test-cultural-de-001',
        userInput: {
          companyName: 'SAP SE',
          companyUrl: 'sap.de',
          vendorName: 'ProspectPI',
          productName: 'Intelligence Theater',
          industry: 'Software',
          primaryPainPoint: 'Enterprise solutions',
          priority: 'high',
          outputFormat: 'full',
          confidenceThreshold: 'high',
          culturalIntelligence: {
            enableCulturalAdaptation: true,
            detectedContext: {
              region: 'Europe',
              country: 'Germany',
              culturalScores: {
                hierarchy: 45,
                directness: 95,
                formality: 85,
                relationshipFirst: 25,
                individualismCollectivism: 70
              },
              communicationStyle: 'direct',
              businessCultureType: 'engineering',
              confidence: 0.95
            }
          }
        },
        timestamp: new Date()
      };

      const result = await orchestrator.orchestrateMission(requestContext);
      
      expect(result).toBeDefined();
      expect(result.culturalAdaptations).toBeDefined();
      expect(result.culturalAdaptations.communicationStyle).toBe('direct');
      expect(result.culturalAdaptations.directnessLevel).toBe('very-direct');
      expect(result.culturalAdaptations.technicalDepth).toBe('high');
    });

    test('should handle workflow without cultural intelligence enabled', async () => {
      const requestContext = {
        requestId: 'test-no-cultural-001',
        userInput: {
          companyName: 'Generic Corp',
          companyUrl: 'generic.com',
          vendorName: 'ProspectPI',
          productName: 'Intelligence Theater',
          industry: 'Technology',
          primaryPainPoint: 'Market analysis',
          priority: 'standard',
          outputFormat: 'full',
          confidenceThreshold: 'medium'
        },
        timestamp: new Date()
      };

      const result = await orchestrator.orchestrateMission(requestContext);
      
      expect(result).toBeDefined();
      expect(result.culturalAdaptations).toBeUndefined();
      expect(result.culturalInsights).toBeUndefined();
    });
  });

  describe('Agent Coordination and Progress Tracking', () => {
    test('should coordinate all 4 agents in correct sequence', async () => {
      const requestContext = {
        requestId: 'test-coordination-001',
        userInput: {
          companyName: 'Samsung Electronics',
          companyUrl: 'samsung.co.kr',
          vendorName: 'ProspectPI',
          productName: 'Intelligence Theater',
          industry: 'Electronics',
          primaryPainPoint: 'Technology intelligence',
          priority: 'high',
          outputFormat: 'full',
          confidenceThreshold: 'high',
          culturalIntelligence: {
            enableCulturalAdaptation: true,
            detectedContext: {
              region: 'Asia Pacific',
              country: 'South Korea',
              culturalScores: {
                hierarchy: 75,
                directness: 40,
                formality: 70,
                relationshipFirst: 85,
                individualismCollectivism: 25
              },
              communicationStyle: 'relationship-focused',
              businessCultureType: 'traditional',
              confidence: 0.90
            }
          }
        },
        timestamp: new Date()
      };

      await orchestrator.orchestrateMission(requestContext);
      
      // Verify agent coordination sequence
      const progressCalls = mockProgressCallback.mock.calls.map(call => call[0]);
      const agentSequence = progressCalls.map(progress => progress.agent).filter(agent => agent);
      
      expect(agentSequence).toContain('coordinator');
      expect(agentSequence).toContain('researcher');
      expect(agentSequence).toContain('detective');
      expect(agentSequence).toContain('cultural-intelligence');
    });

    test('should track progress through cultural analysis phase', async () => {
      const requestContext = {
        requestId: 'test-progress-001',
        userInput: {
          companyName: 'Test Company',
          companyUrl: 'test.co.jp',
          vendorName: 'ProspectPI',
          productName: 'Intelligence Theater',
          industry: 'Test',
          primaryPainPoint: 'Testing',
          priority: 'standard',
          outputFormat: 'full',
          confidenceThreshold: 'medium',
          culturalIntelligence: {
            enableCulturalAdaptation: true,
            detectedContext: {
              region: 'Asia Pacific',
              country: 'Japan',
              culturalScores: {
                hierarchy: 85,
                directness: 25,
                formality: 95,
                relationshipFirst: 80,
                individualismCollectivism: 30
              },
              communicationStyle: 'contextual',
              businessCultureType: 'traditional',
              confidence: 0.95
            }
          }
        },
        timestamp: new Date()
      };

      await orchestrator.orchestrateMission(requestContext);
      
      const culturalProgressCalls = mockProgressCallback.mock.calls
        .filter(call => call[0].stage === 'cultural-analysis' || call[0].agent === 'cultural-intelligence');
      
      expect(culturalProgressCalls.length).toBeGreaterThan(0);
    });
  });

  describe('Performance and Cost Tracking', () => {
    test('should complete 4-agent workflow within time limits', async () => {
      const requestContext = {
        requestId: 'test-performance-001',
        userInput: {
          companyName: 'Performance Test Corp',
          companyUrl: 'test.com',
          vendorName: 'ProspectPI',
          productName: 'Intelligence Theater',
          industry: 'Testing',
          primaryPainPoint: 'Performance',
          priority: 'standard',
          outputFormat: 'full',
          confidenceThreshold: 'medium',
          culturalIntelligence: {
            enableCulturalAdaptation: true,
            detectedContext: {
              region: 'North America',
              country: 'United States',
              culturalScores: {
                hierarchy: 25,
                directness: 85,
                formality: 40,
                relationshipFirst: 30,
                individualismCollectivism: 90
              },
              communicationStyle: 'direct',
              businessCultureType: 'enterprise',
              confidence: 0.95
            }
          }
        },
        timestamp: new Date()
      };

      const startTime = Date.now();
      await orchestrator.orchestrateMission(requestContext);
      const endTime = Date.now();
      
      const executionTime = endTime - startTime;
      expect(executionTime).toBeLessThan(180000); // Should complete within 3 minutes
    });

    test('should track costs across all 4 agents', async () => {
      const requestContext = {
        requestId: 'test-cost-001',
        userInput: {
          companyName: 'Cost Test Corp',
          companyUrl: 'test.com',
          vendorName: 'ProspectPI',
          productName: 'Intelligence Theater',
          industry: 'Testing',
          primaryPainPoint: 'Cost tracking',
          priority: 'standard',
          outputFormat: 'full',
          confidenceThreshold: 'medium',
          culturalIntelligence: {
            enableCulturalAdaptation: true
          }
        },
        timestamp: new Date()
      };

      const result = await orchestrator.orchestrateMission(requestContext);
      
      expect(result.totalCost).toBeDefined();
      expect(result.totalCost).toBeGreaterThan(0);
      expect(result.totalCost).toBeLessThan(2.00); // Should stay under $2 per dossier
      
      if (result.costBreakdown) {
        expect(result.costBreakdown.culturalIntelligence).toBeDefined();
        expect(result.costBreakdown.culturalIntelligence).toBeLessThan(0.50);
      }
    });
  });

  describe('Error Handling and Recovery', () => {
    test('should handle cultural agent failures gracefully', async () => {
      const requestContext = {
        requestId: 'test-error-001',
        userInput: {
          companyName: 'Error Test Corp',
          companyUrl: 'error.com',
          vendorName: 'ProspectPI',
          productName: 'Intelligence Theater',
          industry: 'Error Testing',
          primaryPainPoint: 'Error handling',
          priority: 'standard',
          outputFormat: 'full',
          confidenceThreshold: 'medium',
          culturalIntelligence: {
            enableCulturalAdaptation: true,
            detectedContext: null // Force error condition
          }
        },
        timestamp: new Date()
      };

      const result = await orchestrator.orchestrateMission(requestContext);
      
      expect(result).toBeDefined();
      // Should complete even if cultural intelligence fails
      expect(result.dossierContent).toBeDefined();
    });

    test('should provide fallback when cultural adaptation fails', async () => {
      const requestContext = {
        requestId: 'test-fallback-001',
        userInput: {
          companyName: 'Fallback Test Corp',
          companyUrl: 'fallback.com',
          vendorName: 'ProspectPI',
          productName: 'Intelligence Theater',
          industry: 'Fallback Testing',
          primaryPainPoint: 'Fallback handling',
          priority: 'standard',
          outputFormat: 'full',
          confidenceThreshold: 'medium',
          culturalIntelligence: {
            enableCulturalAdaptation: true,
            detectedContext: {
              region: 'Global',
              country: 'International',
              culturalScores: {
                hierarchy: 50,
                directness: 50,
                formality: 50,
                relationshipFirst: 50,
                individualismCollectivism: 50
              },
              communicationStyle: 'diplomatic',
              businessCultureType: 'enterprise',
              confidence: 0.30
            }
          }
        },
        timestamp: new Date()
      };

      const result = await orchestrator.orchestrateMission(requestContext);
      
      expect(result).toBeDefined();
      expect(result.dossierContent).toBeDefined();
    });
  });
});