/**
 * ProspectPI Intelligence Theater - Agent Progress Service
 * Story 1.3: WebSocket Real-Time Progress System
 * 
 * Bridge service between Three-Agent Orchestration System and WebSocket progress updates
 */

import winston from 'winston';
import { MessageBroker } from '../websocket/MessageBroker';
import { ProgressPublisher } from '../websocket/ProgressPublisher';
import { AgentProgress } from '@interfaces/AgentTypes';

export class AgentProgressService {
  private messageBroker: MessageBroker;
  private progressPublisher: ProgressPublisher;
  private logger: winston.Logger;
  private activeRequests: Map<string, { startTime: Date; lastUpdate: Date }> = new Map();

  constructor(messageBroker: MessageBroker, logger: winston.Logger) {
    this.messageBroker = messageBroker;
    this.progressPublisher = new ProgressPublisher(messageBroker, logger);
    this.logger = logger;
  }

  /**
   * Start tracking progress for a new research request
   */
  startTracking(requestId: string): void {
    this.activeRequests.set(requestId, {
      startTime: new Date(),
      lastUpdate: new Date()
    });

    this.logger.info('Started progress tracking for request', { requestId });
  }

  /**
   * Stop tracking progress for a completed request
   */
  stopTracking(requestId: string): void {
    const trackingInfo = this.activeRequests.get(requestId);
    if (trackingInfo) {
      const duration = Date.now() - trackingInfo.startTime.getTime();
      this.logger.info('Stopped progress tracking for request', { 
        requestId, 
        durationMs: duration 
      });
      this.activeRequests.delete(requestId);
    }
  }

  /**
   * Handle progress update from AgentOrchestrator
   */
  async handleAgentProgress(requestId: string, progress: AgentProgress): Promise<void> {
    try {
      // Update tracking info
      const trackingInfo = this.activeRequests.get(requestId);
      if (trackingInfo) {
        trackingInfo.lastUpdate = new Date();
      }

      // Send progress to WebSocket clients
      await this.messageBroker.sendAgentProgress(requestId, progress);

      this.logger.debug('Agent progress forwarded to WebSocket clients', {
        requestId,
        agent: progress.agent,
        stage: progress.stage,
        confidence: progress.confidence
      });

    } catch (error: any) {
      this.logger.error('Failed to handle agent progress', {
        requestId,
        error: error.message,
        agent: progress.agent,
        stage: progress.stage
      });
    }
  }

  /**
   * Intelligence Coordinator specific progress updates
   */
  async publishCoordinatorUpdate(
    requestId: string,
    companyName: string,
    phase: 'initializing' | 'planning' | 'monitoring' | 'quality_gates' | 'handoff',
    estimatedTimeRemaining: number = 420
  ): Promise<void> {
    await this.progressPublisher.publishAdvancedCoordinatorProgress(
      requestId,
      companyName,
      phase,
      estimatedTimeRemaining
    );
  }

  /**
   * Field Researcher specific progress updates
   */
  async publishResearcherUpdate(
    requestId: string,
    companyName: string,
    activeSource: 'theirstack' | 'marketaux' | 'coresignal' | 'perplexity' | 'openai-realtime',
    discoveredCount: number,
    insightsTotal: number
  ): Promise<void> {
    await this.progressPublisher.publishAdvancedResearcherProgress(
      requestId,
      companyName,
      activeSource,
      discoveredCount,
      insightsTotal
    );
  }

  /**
   * Intelligence Detective specific progress updates
   */
  async publishDetectiveUpdate(
    requestId: string,
    companyName: string,
    phase: 'triangulating' | 'cross_referencing' | 'pattern_analysis' | 'synthesis',
    confidenceLevel: number,
    insightsDiscovered: number
  ): Promise<void> {
    await this.progressPublisher.publishAdvancedDetectiveProgress(
      requestId,
      companyName,
      phase,
      confidenceLevel,
      insightsDiscovered
    );
  }

  /**
   * Publish error state with recovery instructions
   */
  async publishError(
    requestId: string,
    errorCode: string,
    errorMessage: string,
    recoverable: boolean = true,
    recoveryInstructions?: string
  ): Promise<void> {
    await this.progressPublisher.publishError(
      requestId,
      errorCode,
      errorMessage,
      recoverable,
      recoveryInstructions
    );
  }

  /**
   * Publish completion notification
   */
  async publishCompletion(
    requestId: string,
    status: 'complete' | 'failed',
    summary: string,
    dossierUrl?: string
  ): Promise<void> {
    await this.progressPublisher.publishCompletion(requestId, status, summary, dossierUrl);
    this.stopTracking(requestId);
  }

  /**
   * Get active request statistics
   */
  getActiveRequests(): { requestId: string; startTime: Date; lastUpdate: Date; durationMs: number }[] {
    const now = new Date();
    return Array.from(this.activeRequests.entries()).map(([requestId, info]) => ({
      requestId,
      startTime: info.startTime,
      lastUpdate: info.lastUpdate,
      durationMs: now.getTime() - info.startTime.getTime()
    }));
  }

  /**
   * Create progress callback function for AgentOrchestrator
   */
  createProgressCallback(requestId: string): (progress: AgentProgress) => void {
    return (progress: AgentProgress) => {
      this.handleAgentProgress(requestId, progress);
    };
  }
}