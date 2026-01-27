/**
 * Connection Pool Monitor - Tracks and manages database connection pool health
 */

import winston from 'winston';

interface PoolStats {
  poolSize: number;
  availableConnections: number;
  activeConnections: number;
  waitingConnections: number;
  totalRequests: number;
  totalWaits: number;
  averageWaitTime: number;
  lastRecycleTime: Date | null;
}

export class ConnectionPoolMonitor {
  private poolStats: PoolStats;
  private logger: winston.Logger;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private readonly POOL_SIZE = parseInt(process.env.DB_CONNECTION_POOL_SIZE || '20');

  constructor(logger: winston.Logger) {
    this.logger = logger;
    this.poolStats = {
      poolSize: this.POOL_SIZE,
      availableConnections: this.POOL_SIZE,
      activeConnections: 0,
      waitingConnections: 0,
      totalRequests: 0,
      totalWaits: 0,
      averageWaitTime: 0,
      lastRecycleTime: null
    };
  }

  public startMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    this.monitoringInterval = setInterval(() => {
      this.logPoolStats();
      this.checkPoolHealth();
    }, 60000); // Check every minute

    this.logger.info('Connection pool monitoring started', { poolSize: this.POOL_SIZE });
  }

  public stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      this.logger.info('Connection pool monitoring stopped');
    }
  }

  public recordConnectionAcquired(): void {
    this.poolStats.totalRequests++;
    this.poolStats.activeConnections++;
    this.poolStats.availableConnections = Math.max(0, this.poolStats.availableConnections - 1);
  }

  public recordConnectionReleased(): void {
    this.poolStats.activeConnections = Math.max(0, this.poolStats.activeConnections - 1);
    this.poolStats.availableConnections++;
  }

  public recordConnectionWait(waitTime: number): void {
    this.poolStats.totalWaits++;
    this.poolStats.waitingConnections++;
    this.poolStats.averageWaitTime = 
      (this.poolStats.averageWaitTime * (this.poolStats.totalWaits - 1) + waitTime) / this.poolStats.totalWaits;
  }

  private logPoolStats(): void {
    const utilizationPercent = ((this.poolStats.activeConnections / this.POOL_SIZE) * 100).toFixed(2);
    
    this.logger.info('Connection Pool Statistics', {
      poolSize: this.poolStats.poolSize,
      activeConnections: this.poolStats.activeConnections,
      availableConnections: this.poolStats.availableConnections,
      utilizationPercent,
      totalRequests: this.poolStats.totalRequests,
      averageWaitTime: \\ms\,
      lastRecycle: this.poolStats.lastRecycleTime?.toISOString()
    });
  }

  private checkPoolHealth(): void {
    const utilizationPercent = (this.poolStats.activeConnections / this.POOL_SIZE) * 100;

    if (utilizationPercent > 90) {
      this.logger.warn('Connection pool utilization critical', {
        utilizationPercent: \\%\,
        activeConnections: this.poolStats.activeConnections,
        poolSize: this.POOL_SIZE
      });
    } else if (utilizationPercent > 75) {
      this.logger.warn('Connection pool utilization high', {
        utilizationPercent: \\%\,
        activeConnections: this.poolStats.activeConnections
      });
    }

    // Alert on excessive wait time
    if (this.poolStats.averageWaitTime > 5000) {
      this.logger.warn('Connection pool wait time elevated', {
        averageWaitTime: \\ms\,
        totalWaits: this.poolStats.totalWaits
      });
    }
  }

  public getStats(): Readonly<PoolStats> {
    return Object.freeze({ ...this.poolStats });
  }

  public resetStats(): void {
    this.poolStats.totalRequests = 0;
    this.poolStats.totalWaits = 0;
    this.poolStats.averageWaitTime = 0;
    this.logger.info('Connection pool statistics reset');
  }

  public recycleConnections(): void {
    this.poolStats.lastRecycleTime = new Date();
    this.logger.info('Connection pool recycled', { 
      timestamp: this.poolStats.lastRecycleTime.toISOString()
    });
  }
}

export default ConnectionPoolMonitor;