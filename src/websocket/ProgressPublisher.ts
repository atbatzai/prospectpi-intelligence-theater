/**
 * ProspectPI Intelligence Theater - Progress Publisher
 * Story 1.3: WebSocket Real-Time Progress System
 * 
 * Publishes agent progress updates to WebSocket clients via MessageBroker
 */

import winston from 'winston';
import { MessageBroker } from './MessageBroker';
import { AgentProgress, ErrorInfo, CompletionInfo } from '@interfaces/AgentTypes';

export class ProgressPublisher {
  private messageBroker: MessageBroker;
  private logger: winston.Logger;

  constructor(messageBroker: MessageBroker, logger: winston.Logger) {
    this.messageBroker = messageBroker;
    this.logger = logger;
  }

  /**
   * Publish Intelligence Coordinator progress updates
   */
  async publishCoordinatorProgress(
    requestId: string,
    stage: 'planning' | 'analyzing' | 'synthesizing' | 'quality_check',
    message: string,
    confidence: number = 95,
    estimatedTimeRemaining: number = 420,
    userCanInterrupt: boolean = true,
    insightsDiscovered: number = 0
  ): Promise<void> {
    const progress: AgentProgress = {
      stage,
      agent: 'intelligence_coordinator',
      message,
      confidence,
      estimatedTimeRemaining,
      userCanInterrupt,
      dataSourcesActive: [],
      insightsDiscovered,
      timestamp: new Date()
    };

    await this.messageBroker.sendAgentProgress(requestId, progress);
    
    this.logger.debug('Coordinator progress published', {
      requestId,
      stage,
      confidence,
      message: message.substring(0, 100)
    });
  }

  /**
   * Publish Field Researcher progress updates
   */
  async publishResearcherProgress(
    requestId: string,
    stage: 'researching' | 'analyzing',
    message: string,
    confidence: number = 87,
    estimatedTimeRemaining: number = 240,
    dataSourcesActive: string[] = [],
    insightsDiscovered: number = 0
  ): Promise<void> {
    const progress: AgentProgress = {
      stage,
      agent: 'field_researcher',
      message,
      confidence,
      estimatedTimeRemaining,
      userCanInterrupt: false,
      dataSourcesActive,
      insightsDiscovered,
      timestamp: new Date()
    };

    await this.messageBroker.sendAgentProgress(requestId, progress);
    
    this.logger.debug('Researcher progress published', {
      requestId,
      stage,
      confidence,
      dataSourcesActive,
      insightsDiscovered,
      message: message.substring(0, 100)
    });
  }

  /**
   * Publish Intelligence Detective progress updates
   */
  async publishDetectiveProgress(
    requestId: string,
    stage: 'analyzing' | 'synthesizing' | 'quality_check',
    message: string,
    confidence: number = 92,
    estimatedTimeRemaining: number = 60,
    insightsDiscovered: number = 0
  ): Promise<void> {
    const progress: AgentProgress = {
      stage,
      agent: 'intelligence_detective',
      message,
      confidence,
      estimatedTimeRemaining,
      userCanInterrupt: false,
      dataSourcesActive: ['synthesis_engine'],
      insightsDiscovered,
      timestamp: new Date()
    };

    await this.messageBroker.sendAgentProgress(requestId, progress);
    
    this.logger.debug('Detective progress published', {
      requestId,
      stage,
      confidence,
      insightsDiscovered,
      message: message.substring(0, 100)
    });
  }

  /**
   * Publish generic agent progress (for backward compatibility)
   */
  async publishAgentProgress(requestId: string, progress: AgentProgress): Promise<void> {
    await this.messageBroker.sendAgentProgress(requestId, progress);
    
    this.logger.debug('Generic agent progress published', {
      requestId,
      agent: progress.agent,
      stage: progress.stage,
      confidence: progress.confidence
    });
  }

  /**
   * Publish error with recovery instructions
   */
  async publishError(
    requestId: string,
    code: string,
    message: string,
    recoverable: boolean = true,
    recoveryInstructions?: string
  ): Promise<void> {
    const error: ErrorInfo = {
      code,
      message,
      recoverable,
      ...(recoveryInstructions && { recovery_instructions: recoveryInstructions })
    };

    await this.messageBroker.sendError(requestId, error);
    
    this.logger.warn('Error published to WebSocket clients', {
      requestId,
      code,
      recoverable,
      message
    });
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
    const completion: CompletionInfo = {
      status,
      summary,
      ...(dossierUrl && { dossier_url: dossierUrl })
    };

    await this.messageBroker.sendCompletion(requestId, completion);
    
    this.logger.info('Completion published to WebSocket clients', {
      requestId,
      status,
      dossierUrl,
      summary: summary.substring(0, 100)
    });
  }

  /**
   * Enhanced progress updates matching Lovable frontend specifications
   */

  /**
   * Publish sophisticated Intelligence Coordinator updates
   */
  async publishAdvancedCoordinatorProgress(
    requestId: string,
    companyName: string,
    phase: 'initializing' | 'planning' | 'monitoring' | 'quality_gates' | 'handoff',
    estimatedTimeRemaining: number = 420
  ): Promise<void> {
    const messages = {
      initializing: `Initializing deep reconnaissance for enterprise SaaS target: ${companyName}...`,
      planning: `Creating multi-vector intelligence strategy for ${companyName}...`,
      monitoring: `Orchestrating three-agent intelligence mission for ${companyName}...`,
      quality_gates: `Validating intelligence quality gates for ${companyName}...`,
      handoff: `Handoff to Field Intelligence Researcher initiated for ${companyName}...`
    };

    await this.publishCoordinatorProgress(
      requestId,
      'planning',
      messages[phase],
      95,
      estimatedTimeRemaining,
      phase === 'initializing',
      0
    );
  }

  /**
   * Publish sophisticated Field Researcher updates with multi-source tracking
   */
  async publishAdvancedResearcherProgress(
    requestId: string,
    companyName: string,
    activeSource: 'theirstack' | 'marketaux' | 'coresignal' | 'perplexity',
    discoveredCount: number,
    insightsTotal: number
  ): Promise<void> {
    const messages = {
      theirstack: `TheirStack: Discovered ${discoveredCount.toLocaleString()} technology implementations across ${companyName} subsidiaries...`,
      marketaux: `MarketAux: Gathering financial intelligence signals for ${companyName}...`,
      coresignal: `Coresignal: Mapping professional networks and hiring patterns for ${companyName}...`,
      perplexity: `Perplexity: Real-time web reconnaissance discovering latest ${companyName} developments...`
    };

    const dataSources = ['theirstack', 'marketaux', 'coresignal', 'perplexity'];
    const activeIndex = dataSources.indexOf(activeSource);
    const activeSources = dataSources.slice(0, activeIndex + 1);

    await this.publishResearcherProgress(
      requestId,
      'researching',
      messages[activeSource],
      87,
      240,
      activeSources,
      insightsTotal
    );
  }

  /**
   * Publish sophisticated Intelligence Detective synthesis updates
   */
  async publishAdvancedDetectiveProgress(
    requestId: string,
    companyName: string,
    phase: 'triangulating' | 'cross_referencing' | 'pattern_analysis' | 'synthesis',
    confidenceLevel: number,
    insightsDiscovered: number
  ): Promise<void> {
    const messages = {
      triangulating: `Triangulating evidence patterns for ${companyName} intelligence dossier...`,
      cross_referencing: `Cross-referencing weak signals... Cloud migration pattern confirmed across 5 independent sources for ${companyName}...`,
      pattern_analysis: `Analyzing behavioral patterns and market positioning signals for ${companyName}...`,
      synthesis: `Synthesizing high-confidence intelligence insights for ${companyName} final dossier...`
    };

    await this.publishDetectiveProgress(
      requestId,
      'synthesizing',
      messages[phase],
      confidenceLevel,
      60,
      insightsDiscovered
    );
  }
}