/**
 * ProspectPI Intelligence Theater - Enhanced WebSocket Server
 * Story 1.3: WebSocket Real-Time Progress System
 * 
 * Main WebSocket server with authentication, connection management, and message broadcasting
 */

import { WebSocketServer as WSServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { URL } from 'url';
import winston from 'winston';
import { ConnectionManager } from './ConnectionManager';
import { MessageBroker } from './MessageBroker';
import { WebSocketMessage, ErrorInfo } from '../interfaces/AgentTypes';

export class WebSocketServer {
  private wss: WSServer;
  private connectionManager: ConnectionManager;
  private messageBroker: MessageBroker;
  private logger: winston.Logger;

  constructor(server: any, logger: winston.Logger) {
    this.logger = logger;
    this.connectionManager = new ConnectionManager(logger);
    this.messageBroker = new MessageBroker(this.connectionManager, logger);

    // Create WebSocket server with proper path routing
    this.wss = new WSServer({
      server,
      verifyClient: this.verifyClient.bind(this)
    });

    this.setupEventHandlers();
    this.logger.info('Enhanced WebSocket server initialized');
  }

  private verifyClient(info: { origin: string; secure: boolean; req: IncomingMessage }): boolean {
    try {
      const url = new URL(info.req.url!, `http://${info.req.headers.host}`);
      const requestId = this.extractRequestId(url.pathname);
      const isDevelopment = process.env.NODE_ENV !== 'production';
      
      this.logger.debug('WebSocket connection verification', {
        path: url.pathname,
        requestId,
        origin: info.origin,
        isDevelopment
      });
      
      if (!requestId && !isDevelopment) {
        this.logger.warn('WebSocket connection rejected: missing requestId', {
          path: url.pathname,
          origin: info.origin
        });
        return false;
      }

      return true;
    } catch (error: any) {
      this.logger.error('WebSocket client verification failed', { 
        error: error.message,
        url: info.req.url,
        headers: info.req.headers
      });
      return false;
    }
  }

  private setupEventHandlers(): void {
    this.wss.on('connection', this.handleConnection.bind(this));
    
    this.wss.on('error', (error) => {
      this.logger.error('WebSocket server error', { error: error.message });
    });
  }

  private async handleConnection(ws: WebSocket, req: IncomingMessage): Promise<void> {
    try {
      const url = new URL(req.url!, `http://${req.headers.host}`);
      const requestId = this.extractRequestId(url.pathname) || 'dev-request';
      const token = url.searchParams.get('token') || this.extractTokenFromHeaders(req.headers);
      const isDevelopment = process.env.NODE_ENV !== 'production';

      if (!requestId && !isDevelopment) {
        this.sendErrorAndClose(ws, 'INVALID_REQUEST', 'Missing requestId in URL path');
        return;
      }

      // Authenticate connection
      const authResult = await this.connectionManager.authenticateConnection(ws, requestId, token);
      
      if (!authResult.success) {
        this.sendErrorAndClose(ws, 'AUTHENTICATION_FAILED', authResult.error || 'Authentication failed');
        return;
      }

      const connectionId = authResult.connectionId!;
      
      this.logger.info('WebSocket connection established', { 
        connectionId, 
        requestId,
        userAgent: req.headers['user-agent']
      });

      // Setup connection event handlers
      this.setupConnectionHandlers(ws, connectionId, requestId);

      // Replay message history for late-connecting clients
      await this.messageBroker.replayHistory(requestId, connectionId);

    } catch (error: any) {
      this.logger.error('Error handling WebSocket connection', { error: error.message });
      this.sendErrorAndClose(ws, 'CONNECTION_ERROR', 'Failed to establish connection');
    }
  }

  private setupConnectionHandlers(ws: WebSocket, connectionId: string, requestId: string): void {
    // Handle incoming messages
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleClientMessage(connectionId, requestId, message);
      } catch (error: any) {
        this.logger.error('Invalid message format from client', { 
          connectionId, 
          error: error.message 
        });
      }
    });

    // Handle ping/pong for heartbeat
    ws.on('pong', () => {
      this.connectionManager.updatePing(connectionId);
    });

    // Handle connection close
    ws.on('close', (code, reason) => {
      this.logger.info('WebSocket connection closed', { 
        connectionId, 
        requestId, 
        code, 
        reason: reason.toString() 
      });
      this.connectionManager.removeConnection(connectionId);
    });

    // Handle connection errors
    ws.on('error', (error) => {
      this.logger.error('WebSocket connection error', { 
        connectionId, 
        requestId, 
        error: error.message 
      });
      this.connectionManager.removeConnection(connectionId);
    });
  }

  private handleClientMessage(connectionId: string, requestId: string, message: any): void {
    this.logger.debug('Client message received', { 
      connectionId, 
      requestId, 
      messageType: message.type 
    });

    // Handle different message types from client
    switch (message.type) {
      case 'ping':
        this.connectionManager.updatePing(connectionId);
        break;
      
      case 'request_history':
        // Client requesting message history replay
        this.messageBroker.replayHistory(requestId, connectionId);
        break;
      
      default:
        this.logger.debug('Unknown client message type', { 
          connectionId, 
          messageType: message.type 
        });
    }
  }

  private extractRequestId(pathname: string): string | null {
    // Extract requestId from path like /ws/research/{requestId} or /ws/{requestId}
    let match = pathname.match(/^\/ws\/research\/([^/?]+)/);
    if (match) return match[1];
    
    // Also try /ws/{requestId} format
    match = pathname.match(/^\/ws\/([^/?]+)/);
    if (match) return match[1];
    
    // Development mode: accept /ws path and generate requestId
    if (pathname === '/ws' && process.env.NODE_ENV !== 'production') {
      return `dev_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    return null;
  }

  private extractTokenFromHeaders(headers: any): string | undefined {
    const authorization = headers.authorization || headers.Authorization;
    if (authorization && authorization.startsWith('Bearer ')) {
      return authorization.substring(7);
    }
    return undefined;
  }

  private sendErrorAndClose(ws: WebSocket, code: string, message: string): void {
    const errorMessage: WebSocketMessage = {
      type: 'error',
      requestId: 'unknown',
      timestamp: new Date().toISOString(),
      data: {
        code,
        message,
        recoverable: false
      } as ErrorInfo
    };

    try {
      ws.send(JSON.stringify(errorMessage));
      setTimeout(() => ws.close(1008, message), 100);
    } catch (error) {
      ws.close(1008, message);
    }
  }

  /**
   * Get the message broker for agent integration
   */
  public getMessageBroker(): MessageBroker {
    return this.messageBroker;
  }

  /**
   * Get connection statistics
   */
  public getStats(): any {
    return {
      ...this.connectionManager.getStats(),
      serverConnections: this.wss.clients.size
    };
  }

  /**
   * Shutdown WebSocket server
   */
  public shutdown(): Promise<void> {
    return new Promise((resolve) => {
      this.logger.info('Shutting down WebSocket server...');
      
      // Close all client connections
      this.wss.clients.forEach((ws) => {
        ws.close(1000, 'Server shutdown');
      });

      // Shutdown components
      this.connectionManager.shutdown();
      this.messageBroker.shutdown();

      // Close server
      this.wss.close(() => {
        this.logger.info('WebSocket server shutdown completed');
        resolve();
      });
    });
  }
}