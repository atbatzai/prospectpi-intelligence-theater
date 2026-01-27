/**
 * ProspectPI Startup Manager
 * Initializes all services with proper dependency ordering
 */

import winston from 'winston';
import { DatabaseManager } from './database/DatabaseManager';
import { PersistenceService } from './services/PersistenceService';
import { ConnectionPoolMonitor } from './services/ConnectionPoolMonitor';

export class StartupManager {
  private logger: winston.Logger;
  private persistenceService: PersistenceService;
  private poolMonitor: ConnectionPoolMonitor;

  constructor(logger: winston.Logger) {
    this.logger = logger;
    this.persistenceService = PersistenceService.getInstance(logger);
    this.poolMonitor = new ConnectionPoolMonitor(logger);
  }

  public async initialize(): Promise<void> {
    try {
      this.logger.info('=== ProspectPI Startup Sequence ===');
      
      // Step 1: Initialize persistence service
      this.logger.info('Step 1: Initializing Persistence Service');
      await this.persistenceService.initialize();
      
      // Step 2: Start connection pool monitoring
      this.logger.info('Step 2: Starting Connection Pool Monitor');
      this.poolMonitor.startMonitoring();
      
      // Step 3: Verify database health
      this.logger.info('Step 3: Verifying Database Health');
      const state = this.persistenceService.getConnectionState();
      if (state.isConnected) {
        this.logger.info(' Database connection verified');
      } else {
        this.logger.warn(' Database connection failed, but retries may succeed');
      }
      
      // Step 4: Log startup configuration
      this.logger.info('Step 4: Startup Configuration', {
        persistence: this.persistenceService.getConfiguration(),
        poolSize: this.poolMonitor.getStats().poolSize
      });
      
      this.logger.info('=== Startup Sequence Complete ===');
    } catch (error: any) {
      this.logger.error('Startup sequence failed', { error: error.message });
      throw error;
    }
  }

  public async shutdown(): Promise<void> {
    try {
      this.logger.info('=== ProspectPI Shutdown Sequence ===');
      
      this.logger.info('Step 1: Stopping Connection Pool Monitor');
      this.poolMonitor.stopMonitoring();
      
      this.logger.info('Step 2: Shutting down Persistence Service');
      await this.persistenceService.gracefulShutdown();
      
      this.logger.info('=== Shutdown Sequence Complete ===');
    } catch (error: any) {
      this.logger.error('Shutdown sequence error', { error: error.message });
    }
  }

  public getPoolStats() {
    return this.poolMonitor.getStats();
  }

  public getConnectionState() {
    return this.persistenceService.getConnectionState();
  }

  public getStatus() {
    return {
      connection: this.persistenceService.getConnectionState(),
      pool: this.poolMonitor.getStats(),
      persistence: this.persistenceService.getConfiguration()
    };
  }
}

export default StartupManager;