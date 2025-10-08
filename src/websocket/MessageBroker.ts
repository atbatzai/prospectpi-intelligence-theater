/**
 * ProspectPI Intelligence Theater - WebSocket Message Broker
 * Story 1.3: WebSocket Real-Time Progress System
 * 
 * Handles message queuing, persistence, and delivery guarantees for WebSocket communication
 */

import winston from 'winston';
import { DatabaseManager } from '../database/DatabaseManager';
import { WebSocketMessage, AgentProgress, ErrorInfo, CompletionInfo } from '@interfaces/AgentTypes';
import { ConnectionManager } from './ConnectionManager';

interface QueuedMessage {
  id: string;
  requestId: string;
  message: WebSocketMessage;
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
  nextRetry: Date;
}

export class MessageBroker {
  private connectionManager: ConnectionManager;
  private logger: winston.Logger;
  private messageQueue: Map<string, QueuedMessage> = new Map();
  private retryInterval: NodeJS.Timeout | null = null;

  constructor(connectionManager: ConnectionManager, logger: winston.Logger) {
    this.connectionManager = connectionManager;
    this.logger = logger;
    this.startRetryProcessor();
  }

  /**
   * Send agent progress update with persistence and retry
   */
  async sendAgentProgress(requestId: string, progress: AgentProgress): Promise<void> {
    const message: WebSocketMessage = {
      type: 'agent_progress',
      requestId,
      timestamp: new Date().toISOString(),
      data: progress
    };

    await this.sendMessage(requestId, message);
  }

  /**
   * Send error message with recovery instructions
   */
  async sendError(requestId: string, error: ErrorInfo): Promise<void> {
    const message: WebSocketMessage = {
      type: 'error',
      requestId,
      timestamp: new Date().toISOString(),
      data: error
    };

    await this.sendMessage(requestId, message);
  }

  /**
   * Send completion notification
   */
  async sendCompletion(requestId: string, completion: CompletionInfo): Promise<void> {
    const message: WebSocketMessage = {
      type: 'completion',
      requestId,
      timestamp: new Date().toISOString(),
      data: completion
    };

    await this.sendMessage(requestId, message);
  }

  /**
   * Core message sending with persistence and retry logic
   */
  private async sendMessage(requestId: string, message: WebSocketMessage): Promise<void> {
    try {
      // Persist message to database
      await this.persistMessage(message);

      // Try immediate delivery
      this.connectionManager.broadcastToRequest(requestId, message);

      // Log successful delivery attempt
      this.logger.debug('Message sent to WebSocket clients', {
        requestId,
        messageType: message.type,
        timestamp: message.timestamp
      });

    } catch (error: any) {
      this.logger.error('Failed to send WebSocket message', {
        requestId,
        messageType: message.type,
        error: error.message
      });

      // Queue for retry if delivery fails
      await this.queueForRetry(message);
    }
  }

  /**
   * Persist message to database for replay functionality
   */
  private async persistMessage(message: WebSocketMessage): Promise<void> {
    try {
      const db = DatabaseManager.getInstance();
      
      // Extract agent progress data if applicable
      const agentData = message.type === 'agent_progress' ? message.data as AgentProgress : null;
      
      await db.run(`
        INSERT INTO websocket_messages (
          request_id, message_type, agent, stage, message_content,
          confidence, estimated_time_remaining, data_sources_active,
          insights_discovered, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          message.requestId,
          message.type,
          agentData?.agent || null,
          agentData?.stage || null,
          agentData?.message || JSON.stringify(message.data),
          agentData?.confidence || null,
          agentData?.estimatedTimeRemaining || null,
          agentData?.dataSourcesActive ? JSON.stringify(agentData.dataSourcesActive) : null,
          agentData?.insightsDiscovered || null,
          new Date().toISOString()
        ]
      );

    } catch (error: any) {
      this.logger.error('Failed to persist WebSocket message', {
        requestId: message.requestId,
        error: error.message,
        stack: error.stack
      });
      // Don't throw the error - message persistence shouldn't break WebSocket functionality
    }
  }

  /**
   * Queue message for retry delivery
   */
  private async queueForRetry(message: WebSocketMessage): Promise<void> {
    const queueId = `retry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const queuedMessage: QueuedMessage = {
      id: queueId,
      requestId: message.requestId,
      message,
      attempts: 0,
      maxAttempts: 3,
      createdAt: new Date(),
      nextRetry: new Date(Date.now() + 5000) // Retry in 5 seconds
    };

    this.messageQueue.set(queueId, queuedMessage);
    
    this.logger.debug('Message queued for retry', {
      queueId,
      requestId: message.requestId,
      messageType: message.type
    });
  }

  /**
   * Get message history for a request (for late-connecting clients)
   */
  async getMessageHistory(requestId: string, limit: number = 50): Promise<WebSocketMessage[]> {
    const db = DatabaseManager.getInstance();
    
    try {
      const rows = await db.all(`
        SELECT * FROM websocket_messages 
        WHERE request_id = ? 
        ORDER BY created_at DESC 
        LIMIT ?`,
        [requestId, limit]
      );

      return rows.map((row: any) => this.reconstructMessage(row)).reverse();

    } catch (error: any) {
      this.logger.error('Failed to retrieve message history', {
        requestId,
        error: error.message
      });
      return [];
    }
  }

  /**
   * Replay message history to a newly connected client
   */
  async replayHistory(requestId: string, connectionId?: string): Promise<void> {
    try {
      const history = await this.getMessageHistory(requestId);
      
      this.logger.info('Replaying message history', {
        requestId,
        messageCount: history.length,
        connectionId
      });

      // Send historical messages with small delay to prevent overwhelming
      for (const message of history) {
        if (connectionId) {
          this.connectionManager.sendToConnection(connectionId, message);
        } else {
          this.connectionManager.broadcastToRequest(requestId, message);
        }
        
        // Small delay between messages
        await new Promise(resolve => setTimeout(resolve, 10));
      }

    } catch (error: any) {
      this.logger.error('Failed to replay message history', {
        requestId,
        error: error.message
      });
    }
  }

  /**
   * Reconstruct WebSocket message from database row
   */
  private reconstructMessage(row: any): WebSocketMessage {
    let data: any;

    if (row.message_type === 'agent_progress') {
      data = {
        stage: row.stage,
        agent: row.agent,
        message: row.message_content,
        confidence: row.confidence,
        estimatedTimeRemaining: row.estimated_time_remaining,
        userCanInterrupt: true, // Default value
        dataSourcesActive: row.data_sources_active ? JSON.parse(row.data_sources_active) : [],
        insightsDiscovered: row.insights_discovered || 0,
        timestamp: new Date(row.created_at)
      } as AgentProgress;
    } else {
      try {
        data = JSON.parse(row.message_content);
      } catch {
        data = { message: row.message_content };
      }
    }

    return {
      type: row.message_type as any,
      requestId: row.request_id,
      timestamp: row.created_at,
      data
    };
  }

  /**
   * Start background retry processor
   */
  private startRetryProcessor(): void {
    this.retryInterval = setInterval(() => {
      this.processRetryQueue();
    }, 5000); // Check every 5 seconds
  }

  /**
   * Process queued messages for retry
   */
  private async processRetryQueue(): Promise<void> {
    const now = new Date();
    const toRetry: QueuedMessage[] = [];

    // Find messages ready for retry
    this.messageQueue.forEach((queuedMessage) => {
      if (queuedMessage.nextRetry <= now && queuedMessage.attempts < queuedMessage.maxAttempts) {
        toRetry.push(queuedMessage);
      } else if (queuedMessage.attempts >= queuedMessage.maxAttempts) {
        // Remove failed messages
        this.messageQueue.delete(queuedMessage.id);
        this.logger.warn('Message retry exhausted', {
          queueId: queuedMessage.id,
          requestId: queuedMessage.requestId,
          attempts: queuedMessage.attempts
        });
      }
    });

    // Retry messages
    for (const queuedMessage of toRetry) {
      try {
        this.connectionManager.broadcastToRequest(queuedMessage.requestId, queuedMessage.message);
        
        // Remove from queue on successful delivery
        this.messageQueue.delete(queuedMessage.id);
        
        this.logger.debug('Message retry successful', {
          queueId: queuedMessage.id,
          requestId: queuedMessage.requestId,
          attempts: queuedMessage.attempts + 1
        });

      } catch (error: any) {
        // Update retry info
        queuedMessage.attempts++;
        queuedMessage.nextRetry = new Date(now.getTime() + (queuedMessage.attempts * 10000)); // Exponential backoff
        
        this.logger.debug('Message retry failed', {
          queueId: queuedMessage.id,
          requestId: queuedMessage.requestId,
          attempts: queuedMessage.attempts,
          error: error.message
        });
      }
    }
  }

  /**
   * Cleanup and shutdown
   */
  shutdown(): void {
    if (this.retryInterval) {
      clearInterval(this.retryInterval);
      this.retryInterval = null;
    }

    this.messageQueue.clear();
    this.logger.info('MessageBroker shutdown completed');
  }
}