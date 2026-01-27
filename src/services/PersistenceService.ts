/**
 * ProspectPI Intelligence Theater - Persistence Service
 * Handles database connection recovery, session persistence, and data integrity
 */

import winston from 'winston';
import { DatabaseManager } from '../database/DatabaseManager';

interface PersistenceConfig {
  maxRetries: number;
  retryDelay: number;
  connectionTimeout: number;
  idleTimeout: number;
  healthCheckInterval: number;
}

interface ConnectionState {
  isConnected: boolean;
  lastConnectAttempt: Date | null;
  lastSuccessfulConnection: Date | null;
  failureCount: number;
  connectionDuration: number;
}

export class PersistenceService {
  private static instance: PersistenceService;
  private config: PersistenceConfig;
  private connectionState: ConnectionState;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private logger: winston.Logger;
  private dbManager: DatabaseManager;

  private constructor(logger: winston.Logger) {
    this.logger = logger;
    this.dbManager = DatabaseManager.getInstance();
    this.config = {
      maxRetries: 5,
      retryDelay: 2000,
      connectionTimeout: 30000,
      idleTimeout: 15 * 60 * 1000,
      healthCheckInterval: 30000
    };
    this.connectionState = {
      isConnected: false,
      lastConnectAttempt: null,
      lastSuccessfulConnection: null,
      failureCount: 0,
      connectionDuration: 0
    };
  }

  public static getInstance(logger?: winston.Logger): PersistenceService {
    if (!PersistenceService.instance && logger) {
      PersistenceService.instance = new PersistenceService(logger);
    }
    return PersistenceService.instance!;
  }

  public async initialize(): Promise<void> {
    try {
      this.logger.info('Initializing Persistence Service');
      await this.establishConnectionWithRetry();
      this.startHealthCheckMonitor();
      this.setupRecoveryHandlers();
      this.logger.info('Persistence Service initialized successfully');
    } catch (error: any) {
      this.logger.error('Failed to initialize Persistence Service', { error: error.message });
      throw error;
    }
  }

  private async establishConnectionWithRetry(retries: number = this.config.maxRetries): Promise<void> {
    this.connectionState.lastConnectAttempt = new Date();

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        this.logger.info(\Attempting database connection (\/\)\);
        const connectionPromise = DatabaseManager.initialize();
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Connection timeout')), this.config.connectionTimeout)
        );
        await Promise.race([connectionPromise, timeoutPromise]);
        this.connectionState.isConnected = true;
        this.connectionState.lastSuccessfulConnection = new Date();
        this.connectionState.failureCount = 0;
        this.logger.info('Database connection established successfully', {
          attemptNumber: attempt,
          connectionDuration: Date.now() - this.connectionState.lastConnectAttempt!.getTime()
        });
        return;
      } catch (error: any) {
        this.connectionState.failureCount++;
        this.logger.warn(\Database connection attempt \ failed\, {
          error: error.message,
          attemptsRemaining: retries - attempt
        });

        if (attempt === retries) {
          this.connectionState.isConnected = false;
          throw new Error(\Failed to establish database connection after \ attempts\);
        }

        const delayMs = this.config.retryDelay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }

  private startHealthCheckMonitor(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.performHealthCheck();
      } catch (error: any) {
        this.logger.error('Health check failed', { error: error.message });
        if (!this.connectionState.isConnected) {
          this.logger.warn('Connection lost, initiating recovery');
          this.attemptConnectionRecovery();
        }
      }
    }, this.config.healthCheckInterval);
  }

  private async performHealthCheck(): Promise<void> {
    try {
      const connectionUptime = this.connectionState.lastSuccessfulConnection 
        ? Date.now() - this.connectionState.lastSuccessfulConnection.getTime()
        : 0;
      
      this.connectionState.connectionDuration = connectionUptime;

      if (connectionUptime > this.config.idleTimeout) {
        this.logger.warn('Connection idle timeout approaching, will refresh soon', {
          uptime: connectionUptime,
          threshold: this.config.idleTimeout
        });
      }
    } catch (error: any) {
      this.logger.error('Health check query failed', { error: error.message });
      this.connectionState.isConnected = false;
    }
  }

  private async attemptConnectionRecovery(): Promise<void> {
    try {
      this.logger.info('Attempting connection recovery');
      await this.establishConnectionWithRetry(3);
      this.logger.info('Connection recovery successful');
    } catch (error: any) {
      this.logger.error('Connection recovery failed', { error: error.message });
    }
  }

  private setupRecoveryHandlers(): void {
    process.on('SIGTERM', async () => {
      await this.gracefulShutdown();
    });

    process.on('SIGINT', async () => {
      await this.gracefulShutdown();
    });
  }

  public async gracefulShutdown(): Promise<void> {
    try {
      this.logger.info('Initiating graceful shutdown of Persistence Service');
      if (this.healthCheckInterval) {
        clearInterval(this.healthCheckInterval);
      }
      this.logger.info('Persistence Service shutdown completed');
    } catch (error: any) {
      this.logger.error('Error during shutdown', { error: error.message });
    }
  }

  public getConnectionState(): Readonly<ConnectionState> {
    return Object.freeze({ ...this.connectionState });
  }

  public getConfiguration(): Readonly<PersistenceConfig> {
    return Object.freeze({ ...this.config });
  }

  public updateConfiguration(partial: Partial<PersistenceConfig>): void {
    this.config = { ...this.config, ...partial };
    this.logger.info('Persistence configuration updated', { config: this.config });
  }
}

export default PersistenceService;