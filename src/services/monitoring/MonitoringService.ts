/**
 * Monitoring Service - APM, Metrics, Alerts
 * Story 5.3: Monitoring Platform
 */

import { DatabaseManager } from '../../database/DatabaseManager';
import { v4 as uuidv4 } from 'uuid';

export interface SystemMetrics {
  cpu: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  uptime: number;
  activeConnections: number;
  requestsPerMinute: number;
  avgResponseTime: number;
  errorRate: number;
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: {
    database: boolean;
    websocket: boolean;
    apiKeys: boolean;
  };
  metrics: SystemMetrics;
  timestamp: string;
}

class MonitoringService {
  private dbManager: DatabaseManager;
  private requestCounter: Map<string, number[]> = new Map();
  private responseTimeTracker: number[] = [];
  private errorCounter: number = 0;
  private totalRequests: number = 0;

  constructor() {
    this.dbManager = DatabaseManager.getInstance();
    this.startMetricsCleanup();
  }

  async init(): Promise<void> {
    await this.initializeDatabase();
  }

  private async initializeDatabase(): Promise<void> {
    // Metrics table
    await this.dbManager.execute(`
      CREATE TABLE IF NOT EXISTS system_metrics (
        id TEXT PRIMARY KEY,
        metric_type TEXT NOT NULL,
        metric_value REAL NOT NULL,
        metadata TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Alerts table
    await this.dbManager.execute(`
      CREATE TABLE IF NOT EXISTS monitoring_alerts (
        id TEXT PRIMARY KEY,
        alert_type TEXT NOT NULL,
        severity TEXT NOT NULL,
        message TEXT NOT NULL,
        metadata TEXT,
        resolved BOOLEAN DEFAULT 0,
        resolved_at TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Indexes
    await this.dbManager.execute('CREATE INDEX IF NOT EXISTS idx_metrics_type ON system_metrics(metric_type)');
    await this.dbManager.execute('CREATE INDEX IF NOT EXISTS idx_metrics_created ON system_metrics(created_at)');
    await this.dbManager.execute('CREATE INDEX IF NOT EXISTS idx_alerts_resolved ON monitoring_alerts(resolved)');
  }

  private startMetricsCleanup(): void {
    // Clean up old metrics every 5 minutes
    setInterval(() => {
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
      
      // Clean request counter
      for (const [key, timestamps] of this.requestCounter.entries()) {
        const recent = timestamps.filter(t => t > fiveMinutesAgo);
        if (recent.length > 0) {
          this.requestCounter.set(key, recent);
        } else {
          this.requestCounter.delete(key);
        }
      }

      // Clean response time tracker (keep last 1000)
      if (this.responseTimeTracker.length > 1000) {
        this.responseTimeTracker = this.responseTimeTracker.slice(-1000);
      }
    }, 5 * 60 * 1000);
  }

  trackRequest(endpoint: string): void {
    this.totalRequests++;
    const now = Date.now();
    
    if (!this.requestCounter.has(endpoint)) {
      this.requestCounter.set(endpoint, []);
    }
    this.requestCounter.get(endpoint)!.push(now);
  }

  trackResponseTime(responseTime: number): void {
    this.responseTimeTracker.push(responseTime);
  }

  trackError(): void {
    this.errorCounter++;
  }

  getSystemMetrics(): SystemMetrics {
    const memUsage = process.memoryUsage();
    const uptime = process.uptime();

    // Calculate requests per minute
    const oneMinuteAgo = Date.now() - 60 * 1000;
    let recentRequests = 0;
    for (const timestamps of this.requestCounter.values()) {
      recentRequests += timestamps.filter(t => t > oneMinuteAgo).length;
    }

    // Calculate average response time
    const avgResponseTime = this.responseTimeTracker.length > 0
      ? this.responseTimeTracker.reduce((a, b) => a + b, 0) / this.responseTimeTracker.length
      : 0;

    // Calculate error rate
    const errorRate = this.totalRequests > 0
      ? (this.errorCounter / this.totalRequests) * 100
      : 0;

    return {
      cpu: 0, // TODO: Implement CPU tracking
      memory: {
        used: Math.round(memUsage.heapUsed / 1024 / 1024),
        total: Math.round(memUsage.heapTotal / 1024 / 1024),
        percentage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100)
      },
      uptime: Math.round(uptime),
      activeConnections: 0, // TODO: Track WebSocket connections
      requestsPerMinute: recentRequests,
      avgResponseTime: Math.round(avgResponseTime),
      errorRate: Math.round(errorRate * 100) / 100
    };
  }

  async recordMetric(metricType: string, value: number, metadata?: any): Promise<void> {
    await this.initializeDatabase();

    await this.dbManager.execute(`
      INSERT INTO system_metrics (id, metric_type, metric_value, metadata)
      VALUES (?, ?, ?, ?)
    `, [uuidv4(), metricType, value, metadata ? JSON.stringify(metadata) : null]);
  }

  async createAlert(alertType: string, severity: 'info' | 'warning' | 'critical', message: string, metadata?: any): Promise<void> {
    await this.initializeDatabase();

    await this.dbManager.execute(`
      INSERT INTO monitoring_alerts (id, alert_type, severity, message, metadata)
      VALUES (?, ?, ?, ?, ?)
    `, [uuidv4(), alertType, severity, message, metadata ? JSON.stringify(metadata) : null]);

    // Log to console for immediate visibility
    console.warn(`[${severity.toUpperCase()}] ${alertType}: ${message}`);
  }

  async getActiveAlerts(): Promise<any[]> {
    return await this.dbManager.all(
      'SELECT * FROM monitoring_alerts WHERE resolved = 0 ORDER BY created_at DESC',
      []
    );
  }

  async resolveAlert(alertId: string): Promise<void> {
    await this.dbManager.execute(
      'UPDATE monitoring_alerts SET resolved = 1, resolved_at = ? WHERE id = ?',
      [new Date().toISOString(), alertId]
    );
  }

  async checkHealth(): Promise<HealthStatus> {
    const checks = {
      database: false,
      websocket: true, // Assume healthy for now
      apiKeys: true // Assume healthy for now
    };

    // Check database
    try {
      await this.dbManager.get('SELECT 1', []);
      checks.database = true;
    } catch (error) {
      checks.database = false;
    }

    const allHealthy = Object.values(checks).every(v => v);
    const someUnhealthy = Object.values(checks).some(v => !v);

    const status = allHealthy ? 'healthy' : (someUnhealthy ? 'degraded' : 'unhealthy');

    return {
      status,
      checks,
      metrics: this.getSystemMetrics(),
      timestamp: new Date().toISOString()
    };
  }
}

export const monitoringService = new MonitoringService();
