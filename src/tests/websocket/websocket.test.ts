/**
 * ProspectPI Intelligence Theater - WebSocket System Tests
 * Story 1.3: WebSocket Real-Time Progress System
 */

import { createServer } from 'http';
import { WebSocket } from 'ws';
import winston from 'winston';
import jwt from 'jsonwebtoken';
import { WebSocketServer } from '../../websocket/WebSocketServer';
import { DatabaseManager } from '../../database/DatabaseManager';

describe('WebSocket Real-Time Progress System', () => {
  let server: any;
  let wsServer: WebSocketServer;
  let logger: winston.Logger;

  beforeAll(async () => {
    // Initialize test database
    await DatabaseManager.initialize();

    // Create test logger
    logger = winston.createLogger({
      level: 'error', // Minimize test output
      transports: [new winston.transports.Console({ silent: true })]
    });

    // Create HTTP server for WebSocket testing
    server = createServer();
    wsServer = new WebSocketServer(server, logger);

    return new Promise<void>((resolve) => {
      server.listen(0, resolve);
    });
  });

  afterAll(async () => {
    await wsServer.shutdown();
    await DatabaseManager.getInstance().close();
    
    return new Promise<void>((resolve) => {
      server.close(resolve);
    });
  });

  describe('Connection Management', () => {
    test('should reject connection without requestId', (done) => {
      const port = server.address().port;
      const ws = new WebSocket(`ws://localhost:${port}/ws/research/`);

      ws.on('error', () => {
        // Expected to fail connection
        done();
      });

      ws.on('open', () => {
        done(new Error('Connection should have been rejected'));
      });
    });

    test('should reject connection without authentication token', (done) => {
      const port = server.address().port;
      const requestId = 'test-request-123';
      const ws = new WebSocket(`ws://localhost:${port}/ws/research/${requestId}`);

      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());
        if (message.type === 'error' && message.data.code === 'AUTHENTICATION_FAILED') {
          ws.close();
          done();
        }
      });

      ws.on('error', () => {
        // Expected authentication failure
        done();
      });
    });

    test('should accept connection with valid JWT token', (done) => {
      const port = server.address().port;
      const requestId = 'test-request-456';
      
      // Create test JWT token
      const token = jwt.sign(
        { userId: 'test-user-123' },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: '1h' }
      );

      const ws = new WebSocket(`ws://localhost:${port}/ws/research/${requestId}?token=${token}`);

      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());
        if (message.type === 'connection_status' && message.data.status === 'authenticated') {
          ws.close();
          done();
        }
      });

      ws.on('error', (error) => {
        done(error);
      });
    });
  });

  describe('Message Broadcasting', () => {
    test('should broadcast agent progress to connected clients', (done) => {
      const port = server.address().port;
      const requestId = 'test-request-789';
      
      const token = jwt.sign(
        { userId: 'test-user-456' },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: '1h' }
      );

      const ws = new WebSocket(`ws://localhost:${port}/ws/research/${requestId}?token=${token}`);
      let authenticated = false;

      let testCompleted = false;

      ws.on('message', (data) => {
        if (testCompleted) return;
        
        const message = JSON.parse(data.toString());
        
        if (message.type === 'connection_status' && !authenticated) {
          authenticated = true;
          
          // Send test progress update via MessageBroker
          const messageBroker = wsServer.getMessageBroker();
          messageBroker.sendAgentProgress(requestId, {
            stage: 'researching',
            agent: 'field_researcher',
            message: 'Test progress message',
            confidence: 85,
            estimatedTimeRemaining: 120,
            userCanInterrupt: false,
            dataSourcesActive: ['theirstack'],
            insightsDiscovered: 42,
            timestamp: new Date()
          });
          
        } else if (message.type === 'agent_progress' && !testCompleted) {
          testCompleted = true;
          expect(message.data.agent).toBe('field_researcher');
          expect(message.data.message).toBe('Test progress message');
          expect(message.data.confidence).toBe(85);
          expect(message.data.insightsDiscovered).toBe(42);
          ws.close();
          done();
        }
      });

      ws.on('error', done);
    });
  });

  describe('Message Persistence and Replay', () => {
    test('should persist messages to database', async () => {
      const requestId = 'test-persistence-123';
      const messageBroker = wsServer.getMessageBroker();

      await messageBroker.sendAgentProgress(requestId, {
        stage: 'analyzing',
        agent: 'intelligence_detective',
        message: 'Analyzing test data',
        confidence: 92,
        estimatedTimeRemaining: 60,
        userCanInterrupt: false,
        dataSourcesActive: ['synthesis_engine'],
        insightsDiscovered: 15,
        timestamp: new Date()
      });

      // Check if message was persisted
      const history = await messageBroker.getMessageHistory(requestId, 10);
      expect(history.length).toBeGreaterThan(0);
      
      const lastMessage = history[history.length - 1];
      expect(lastMessage.type).toBe('agent_progress');
      expect((lastMessage.data as any).agent).toBe('intelligence_detective');
    });
  });

  describe('Error Handling', () => {
    test('should broadcast error messages with recovery instructions', (done) => {
      const port = server.address().port;
      const requestId = 'test-error-123';
      
      const token = jwt.sign(
        { userId: 'test-user-789' },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: '1h' }
      );

      const ws = new WebSocket(`ws://localhost:${port}/ws/research/${requestId}?token=${token}`);
      let authenticated = false;

      let testCompleted = false;

      ws.on('message', (data) => {
        if (testCompleted) return;
        
        const message = JSON.parse(data.toString());
        
        if (message.type === 'connection_status' && !authenticated) {
          authenticated = true;
          
          // Send test error
          const messageBroker = wsServer.getMessageBroker();
          messageBroker.sendError(requestId, {
            code: 'API_LIMIT_EXCEEDED',
            message: 'TheirStack API limit exceeded',
            recoverable: true,
            recovery_instructions: 'Please try again in 1 hour'
          });
          
        } else if (message.type === 'error' && !testCompleted) {
          testCompleted = true;
          expect(message.data.code).toBe('API_LIMIT_EXCEEDED');
          expect(message.data.recoverable).toBe(true);
          expect(message.data.recovery_instructions).toBe('Please try again in 1 hour');
          ws.close();
          done();
        }
      });

      ws.on('error', done);
    });
  });
});