/**
 * ProspectPI Intelligence Theater - WebSocket Connection Manager
 * Story 1.3: WebSocket Real-Time Progress System
 * 
 * Manages WebSocket client connections, authentication, and message routing
 */

import { WebSocket } from 'ws';
import jwt from 'jsonwebtoken';
import winston from 'winston';
import { WebSocketMessage, ConnectionStatus } from '@interfaces/AgentTypes';

interface ClientConnection {
  id: string;
  ws: WebSocket;
  userId: string;
  requestId: string;
  authenticatedAt: Date;
  lastPing: Date;
  isAlive: boolean;
}

export class ConnectionManager {
  private connections: Map<string, ClientConnection> = new Map();
  private requestSubscriptions: Map<string, Set<string>> = new Map(); // requestId -> Set<connectionId>
  private logger: winston.Logger;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(logger: winston.Logger) {
    this.logger = logger;
    this.startHeartbeat();
  }

  /**
   * Authenticate and register a new WebSocket connection
   */
  async authenticateConnection(
    ws: WebSocket, 
    requestId: string, 
    token?: string
  ): Promise<{ success: boolean; connectionId?: string; error?: string }> {
    try {
      // DEVELOPMENT MODE: Allow connections without token for testing
      const isDevelopment = process.env.NODE_ENV !== 'production';
      let userId = 'dev-user';

      if (!isDevelopment) {
        if (!token) {
          return { success: false, error: 'Authentication token required' };
        }

        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
        userId = decoded.userId || decoded.sub;

        if (!userId) {
          return { success: false, error: 'Invalid token: missing user ID' };
        }
      } else {
        this.logger.debug('Development mode: Bypassing WebSocket authentication', { requestId });
      }

      // Generate unique connection ID
      const connectionId = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Create connection record
      const connection: ClientConnection = {
        id: connectionId,
        ws,
        userId,
        requestId,
        authenticatedAt: new Date(),
        lastPing: new Date(),
        isAlive: true
      };

      // Store connection
      this.connections.set(connectionId, connection);

      // Subscribe to requestId updates
      if (!this.requestSubscriptions.has(requestId)) {
        this.requestSubscriptions.set(requestId, new Set());
      }
      this.requestSubscriptions.get(requestId)!.add(connectionId);

      // Send authentication confirmation
      const authMessage: WebSocketMessage = {
        type: 'connection_status',
        requestId,
        timestamp: new Date().toISOString(),
        data: {
          status: 'authenticated',
          message: `Connected to research progress for request ${requestId}`
        } as ConnectionStatus
      };

      ws.send(JSON.stringify(authMessage));

      this.logger.info('WebSocket connection authenticated', { 
        connectionId, 
        userId, 
        requestId 
      });

      return { success: true, connectionId };

    } catch (error: any) {
      this.logger.error('WebSocket authentication failed', { error: error.message, requestId });
      return { success: false, error: 'Authentication failed' };
    }
  }

  /**
   * Remove a connection and clean up subscriptions
   */
  removeConnection(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    // Remove from request subscriptions
    const subscribers = this.requestSubscriptions.get(connection.requestId);
    if (subscribers) {
      subscribers.delete(connectionId);
      if (subscribers.size === 0) {
        this.requestSubscriptions.delete(connection.requestId);
      }
    }

    // Remove connection
    this.connections.delete(connectionId);

    this.logger.info('WebSocket connection removed', { 
      connectionId, 
      requestId: connection.requestId 
    });
  }

  /**
   * Broadcast message to all connections subscribed to a requestId
   */
  broadcastToRequest(requestId: string, message: WebSocketMessage): void {
    const subscribers = this.requestSubscriptions.get(requestId);
    if (!subscribers || subscribers.size === 0) {
      this.logger.debug('No subscribers for request', { requestId });
      return;
    }

    const messageStr = JSON.stringify(message);
    let successCount = 0;
    let failureCount = 0;

    subscribers.forEach(connectionId => {
      const connection = this.connections.get(connectionId);
      if (connection && connection.ws.readyState === WebSocket.OPEN) {
        try {
          connection.ws.send(messageStr);
          successCount++;
        } catch (error: any) {
          this.logger.error('Failed to send message to connection', { 
            connectionId, 
            error: error.message 
          });
          failureCount++;
          this.removeConnection(connectionId);
        }
      } else {
        // Clean up dead connection
        this.removeConnection(connectionId);
        failureCount++;
      }
    });

    this.logger.debug('Message broadcast completed', { 
      requestId, 
      successCount, 
      failureCount,
      messageType: message.type
    });
  }

  /**
   * Send message to specific connection
   */
  sendToConnection(connectionId: string, message: WebSocketMessage): boolean {
    const connection = this.connections.get(connectionId);
    if (!connection || connection.ws.readyState !== WebSocket.OPEN) {
      return false;
    }

    try {
      connection.ws.send(JSON.stringify(message));
      return true;
    } catch (error: any) {
      this.logger.error('Failed to send message to connection', { 
        connectionId, 
        error: error.message 
      });
      this.removeConnection(connectionId);
      return false;
    }
  }

  /**
   * Update connection ping timestamp
   */
  updatePing(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (connection) {
      connection.lastPing = new Date();
      connection.isAlive = true;
    }
  }

  /**
   * Get connection statistics
   */
  getStats(): { totalConnections: number; activeRequests: number; connectionsByRequest: Map<string, number> } {
    const connectionsByRequest = new Map<string, number>();
    
    this.requestSubscriptions.forEach((subscribers, requestId) => {
      connectionsByRequest.set(requestId, subscribers.size);
    });

    return {
      totalConnections: this.connections.size,
      activeRequests: this.requestSubscriptions.size,
      connectionsByRequest
    };
  }

  /**
   * Start heartbeat mechanism to detect dead connections
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      const now = new Date();
      const staleConnections: string[] = [];

      this.connections.forEach((connection, connectionId) => {
        const timeSinceLastPing = now.getTime() - connection.lastPing.getTime();
        
        if (timeSinceLastPing > 60000) { // 1 minute timeout
          staleConnections.push(connectionId);
        } else if (connection.ws.readyState === WebSocket.OPEN) {
          // Send ping
          try {
            connection.ws.ping();
            connection.isAlive = false; // Will be set to true on pong
          } catch (error) {
            staleConnections.push(connectionId);
          }
        }
      });

      // Clean up stale connections
      staleConnections.forEach(connectionId => {
        this.logger.info('Removing stale WebSocket connection', { connectionId });
        this.removeConnection(connectionId);
      });

    }, 30000); // Check every 30 seconds
  }

  /**
   * Stop heartbeat and clean up all connections
   */
  shutdown(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    // Close all connections
    this.connections.forEach((connection) => {
      try {
        connection.ws.close(1000, 'Server shutdown');
      } catch (error) {
        // Ignore errors during shutdown
      }
    });

    this.connections.clear();
    this.requestSubscriptions.clear();
    
    this.logger.info('WebSocket ConnectionManager shutdown completed');
  }
}