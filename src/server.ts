/**
 * ProspectPI Intelligence Theater - REST API Server
 * Story 1.2: REST API Endpoints & Request Handling
 * 
 * Express.js server providing REST API endpoints for Lovable frontend integration
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import dotenv from 'dotenv';
import winston from 'winston';

import { apiRouter } from './routes';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { rateLimiter } from './middleware/rateLimiter';
import { ApiConfig } from '@config/ApiConfig';
import { DatabaseManager } from './database/DatabaseManager';
import { specs, swaggerUi } from './docs/swagger';
import { WebSocketServer } from './websocket/WebSocketServer';

// Load environment variables
dotenv.config();

// Configure logger
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'prospectpi-api' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

class ApiServer {
  private app: express.Application;
  private server: any;
  private wss!: WebSocketServer;
  private port: number;

  constructor() {
    this.app = express();
    this.port = parseInt(process.env.PORT || '3001', 10);
    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSocket();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" }
    }));

    // CORS configuration for Lovable frontend
    this.app.use(cors({
      origin: [
        'http://localhost:3000',
        'https://lovable.dev',
        'https://*.lovable.dev',
        process.env.FRONTEND_URL || 'http://localhost:3000'
      ],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true
    }));

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // Request logging
    this.app.use(requestLogger(logger));

    // Rate limiting
    this.app.use(rateLimiter);
  }

  private setupRoutes(): void {
    // Health check endpoint
    this.app.get('/health', (_req, res) => {
      res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'ProspectPI Intelligence Theater API',
        version: '1.0.0'
      });
    });

    // OpenAPI/Swagger documentation
    this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

    // API routes
    this.app.use('/api/v1', apiRouter);

    // Catch-all for undefined routes
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Endpoint not found',
          details: { path: req.originalUrl }
        }
      });
    });
  }

  private setupWebSocket(): void {
    this.server = createServer(this.app);
    this.wss = new WebSocketServer(this.server, logger);
  }

  private setupErrorHandling(): void {
    this.app.use(errorHandler);
  }

  public async start(): Promise<void> {
    try {
      // Validate API configuration
      logger.info('Validating API configuration...');
      ApiConfig.validateConfiguration();
      logger.info('API configuration validated successfully');

      // Initialize database
      logger.info('Initializing database...');
      await DatabaseManager.initialize();
      logger.info('Database initialized successfully');

      // Start server
      this.server.listen(this.port, () => {
        logger.info(`🚀 ProspectPI Intelligence Theater API server running on port ${this.port}`);
        logger.info(`📡 WebSocket server running on ws://localhost:${this.port}/ws`);
        logger.info(`🏥 Health check available at http://localhost:${this.port}/health`);
      });

    } catch (error: any) {
      logger.error('Failed to start API server', { error: error.message });
      process.exit(1);
    }
  }

  public async stop(): Promise<void> {
    logger.info('Shutting down API server...');
    
    // Shutdown WebSocket server
    await this.wss.shutdown();
    
    // Close HTTP server
    return new Promise((resolve) => {
      this.server.close(() => {
        logger.info('HTTP server closed');
        resolve();
      });
    });
  }

  public getWebSocketServer(): WebSocketServer {
    return this.wss;
  }

  public getProgressPublisher() {
    return this.wss.getMessageBroker();
  }

  public getExpressApp(): express.Application {
    return this.app;
  }
}

// Start server if this file is run directly
if (require.main === module) {
  const server = new ApiServer();
  
  // Graceful shutdown handling
  process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, shutting down gracefully');
    await server.stop();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    logger.info('SIGINT received, shutting down gracefully');
    await server.stop();
    process.exit(0);
  });

  // Start the server
  server.start().catch((error) => {
    logger.error('Failed to start server', error);
    process.exit(1);
  });
}

export { ApiServer };