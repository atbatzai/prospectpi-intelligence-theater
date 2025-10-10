/**
 * ProspectPI Intelligence Theater - Intelligence Coordinator Tests
 * Story 1.1: Three-Agent Orchestration System
 * 
 * Unit tests for Intelligence Coordinator agent
 */

import { IntelligenceCoordinator } from '@agents/IntelligenceCoordinator';
import { OptimizedUserInput } from '@interfaces/AgentTypes';

// Mock Anthropic SDK
jest.mock('@anthropic-ai/sdk');

describe('IntelligenceCoordinator', () => {
  let coordinator: IntelligenceCoordinator;
  let mockProgressCallback: jest.Mock;
  let mockUserInput: OptimizedUserInput;

  beforeEach(() => {
    mockProgressCallback = jest.fn();
    coordinator = new IntelligenceCoordinator(mockProgressCallback);
    
    mockUserInput = {
      companyName: 'Test Company Inc',
      // NEW REQUIRED FIELDS
      vendorName: 'Microsoft',
      productName: 'Azure Services',
      industry: 'Technology',
      primaryPainPoint: 'Cloud migration complexity',
      // EXISTING FIELDS  
      additionalContext: 'Software development company',
      priority: 'standard',
      outputFormat: 'full',
      confidenceThreshold: 'medium'
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
    coordinator.reset();
  });

  describe('initializeMission', () => {
    it('should initialize mission context with user input', async () => {
      const context = await coordinator.initializeMission(mockUserInput);
      
      expect(context).toBeDefined();
      expect(context.userInput).toEqual(mockUserInput);
      expect(context.requestId).toBeDefined();
      expect(context.startTime).toBeInstanceOf(Date);
      expect(context.qualityGates).toEqual([]);
    });

    it('should call progress callback during initialization', async () => {
      await coordinator.initializeMission(mockUserInput);
      
      expect(mockProgressCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          stage: 'planning',
          agent: 'coordinator',
          message: expect.stringContaining('Test Company Inc'),
          confidence: 0.9,
          estimatedTimeRemaining: 180,
          userCanInterrupt: true
        })
      );
    });
  });

  describe('validateQualityGate', () => {
    it('should handle validation errors gracefully', async () => {
      // Initialize mission first
      await coordinator.initializeMission(mockUserInput);
      
      const result = await coordinator.validateQualityGate(
        'test-gate',
        { test: 'data' },
        'test criteria'
      );
      
      expect(result).toBeDefined();
      expect(result.name).toBe('test-gate');
      expect(result.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('getContext', () => {
    it('should return null before mission initialization', () => {
      const context = coordinator.getContext();
      expect(context).toBeNull();
    });

    it('should return context after mission initialization', async () => {
      await coordinator.initializeMission(mockUserInput);
      const context = coordinator.getContext();
      
      expect(context).toBeDefined();
      expect(context?.userInput).toEqual(mockUserInput);
    });
  });

  describe('reset', () => {
    it('should reset context to null', async () => {
      await coordinator.initializeMission(mockUserInput);
      expect(coordinator.getContext()).toBeDefined();
      
      coordinator.reset();
      expect(coordinator.getContext()).toBeNull();
    });
  });

  describe('progress tracking', () => {
    it('should work without progress callback', () => {
      const coordinatorWithoutCallback = new IntelligenceCoordinator();
      expect(() => coordinatorWithoutCallback.reset()).not.toThrow();
    });
  });
});