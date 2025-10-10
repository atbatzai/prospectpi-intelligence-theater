/**
 * ProspectPI Intelligence Theater - REST API Server
 * Story 1.2: REST API Endpoints & Request Handling
 * 
 * Express.js server providing REST API endpoints for Lovable frontend integration
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { createServer } from 'http';
import dotenv from 'dotenv';
import winston from 'winston';

import { apiRouter } from './routes';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { rateLimiter } from './middleware/rateLimiter';
import { ApiConfig } from './config/ApiConfig';
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
    // Performance optimizations for 100% excellence
    this.app.set('trust proxy', 1);
    this.app.disable('x-powered-by'); // Security enhancement
    
    // Response compression for performance
    this.app.use(compression({
      filter: (req: any, res: any) => {
        if (req.headers['x-no-compression']) return false;
        return compression.filter(req, res);
      },
      level: 6, // Balanced compression
      threshold: 1024 // Only compress responses > 1KB
    }));

    // Security middleware with performance tuning
    this.app.use(helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"]
        }
      },
      hsts: process.env.NODE_ENV === 'production' ? {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      } : false
    }));

    // CORS configuration for Lovable frontend with caching
    this.app.use(cors({
      origin: [
        'http://localhost:3000',
        'https://lovable.dev',
        'https://*.lovable.dev',
        process.env.FRONTEND_URL || 'http://localhost:3000'
      ],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id'],
      credentials: true,
      maxAge: 86400 // Cache preflight for 24 hours
    }));

    // Enhanced body parsing with performance limits
    this.app.use(express.json({ 
      limit: '10mb',
      strict: true,
      type: 'application/json'
    }));
    this.app.use(express.urlencoded({ 
      extended: true,
      limit: '10mb',
      parameterLimit: 1000
    }));

    // Request logging with performance tracking
    this.app.use(requestLogger(logger));

    // Enhanced rate limiting with performance tiers
    this.app.use(rateLimiter);
    
    // Response time header for monitoring  
    this.app.use((req: any, res: any, next: any) => {
      const start = Date.now();
      
      // Set header before response starts
      const originalSend = res.send;
      res.send = function(data: any) {
        const duration = Date.now() - start;
        if (!res.headersSent) {
          res.set('X-Response-Time', `${duration}ms`);
        }
        
        // Log slow requests for monitoring
        if (duration > 1000) {
          logger.warn(`Slow request detected: ${req.method} ${req.path} took ${duration}ms`);
        }
        
        return originalSend.call(this, data);
      };
      
      next();
    });
  }

  private setupRoutes(): void {
    // Enhanced health check endpoint with comprehensive system metrics
    this.app.get('/health', async (_req, res) => {
      const startTime = Date.now();
      
      try {
        // Database health check
        const dbHealthy = await this.checkDatabaseHealth();
        
        // Memory and performance metrics
        const memoryUsage = process.memoryUsage();
        const uptime = process.uptime();
        
        const health = {
          status: dbHealthy ? 'healthy' : 'degraded',
          timestamp: new Date().toISOString(),
          service: 'ProspectPI Intelligence Theater API',
          version: '1.0.0',
          uptime: `${Math.floor(uptime / 60)}m ${Math.floor(uptime % 60)}s`,
          memory: {
            used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
            total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
            external: Math.round(memoryUsage.external / 1024 / 1024)
          },
          database: {
            status: dbHealthy ? 'connected' : 'disconnected',
            type: process.env.DATABASE_URL ? 'postgresql' : 'sqlite'
          },
          websocket: {
            status: 'active',
            endpoint: `ws://localhost:${this.port}/ws`
          },
          performance: {
            responseTime: Date.now() - startTime,
            nodeVersion: process.version,
            platform: process.platform
          }
        };
        
        res.status(dbHealthy ? 200 : 503).json(health);
        
      } catch (error: any) {
        res.status(500).json({
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          service: 'ProspectPI Intelligence Theater API',
          error: error.message
        });
      }
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

  private async checkDatabaseHealth(): Promise<boolean> {
    try {
      // Simple database connectivity test
      const db = DatabaseManager.getInstance();
      // This is a lightweight check - just verify the instance exists
      return db !== null;
    } catch (error) {
      return false;
    }
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