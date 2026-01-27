/**
 * Analytics Service - Usage Tracking & Metrics
 * Story 6.1: Customer Analytics & Usage Metrics
 */

import { DatabaseManager } from '../../database/DatabaseManager';
import { v4 as uuidv4 } from 'uuid';

export interface UsageMetrics {
  totalDossiers: number;
  totalCost: number;
  avgCostPerDossier: number;
  dossiersByStatus: Record<string, number>;
  costBySource: Record<string, number>;
  requestsLast30Days: number;
  uniqueUsers: number;
}

export interface DossierAnalytics {
  dossierId: string;
  companyName: string;
  status: string;
  cost: number;
  executionTime: number;
  dataSourcesUsed: string[];
  qualityScore: number;
  createdAt: string;
}

class AnalyticsService {
  private dbManager: DatabaseManager;

  constructor() {
    this.dbManager = DatabaseManager.getInstance();
  }

  async init(): Promise<void> {
    await this.initializeDatabase();
  }

  private async initializeDatabase(): Promise<void> {
    // Usage events table
    await this.dbManager.execute(`
      CREATE TABLE IF NOT EXISTS usage_events (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        organization_id TEXT,
        event_type TEXT NOT NULL,
        resource_type TEXT NOT NULL,
        resource_id TEXT,
        metadata TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // API usage tracking
    await this.dbManager.execute(`
      CREATE TABLE IF NOT EXISTS api_usage (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        organization_id TEXT,
        endpoint TEXT NOT NULL,
        method TEXT NOT NULL,
        response_time INTEGER,
        status_code INTEGER,
        cost REAL DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Dossier analytics
    await this.dbManager.execute(`
      CREATE TABLE IF NOT EXISTS dossier_analytics (
        id TEXT PRIMARY KEY,
        dossier_id TEXT NOT NULL UNIQUE,
        execution_time INTEGER,
        total_cost REAL,
        data_sources_used TEXT,
        quality_score REAL,
        error_count INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (dossier_id) REFERENCES dossiers(id) ON DELETE CASCADE
      )
    `);

    // Create indexes for performance
    await this.dbManager.execute('CREATE INDEX IF NOT EXISTS idx_usage_events_user ON usage_events(user_id)');
    await this.dbManager.execute('CREATE INDEX IF NOT EXISTS idx_usage_events_org ON usage_events(organization_id)');
    await this.dbManager.execute('CREATE INDEX IF NOT EXISTS idx_api_usage_user ON api_usage(user_id)');
    await this.dbManager.execute('CREATE INDEX IF NOT EXISTS idx_api_usage_created ON api_usage(created_at)');
  }

  async trackEvent(userId: string, eventType: string, resourceType: string, resourceId?: string, metadata?: any, organizationId?: string): Promise<void> {
    await this.initializeDatabase();

    await this.dbManager.execute(`
      INSERT INTO usage_events (id, user_id, organization_id, event_type, resource_type, resource_id, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      uuidv4(),
      userId,
      organizationId,
      eventType,
      resourceType,
      resourceId,
      metadata ? JSON.stringify(metadata) : null
    ]);
  }

  async trackAPICall(userId: string, endpoint: string, method: string, responseTime: number, statusCode: number, cost: number = 0, organizationId?: string): Promise<void> {
    await this.initializeDatabase();

    await this.dbManager.execute(`
      INSERT INTO api_usage (id, user_id, organization_id, endpoint, method, response_time, status_code, cost)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      uuidv4(),
      userId,
      organizationId,
      endpoint,
      method,
      responseTime,
      statusCode,
      cost
    ]);
  }

  async trackDossierAnalytics(dossierId: string, executionTime: number, totalCost: number, dataSources: string[], qualityScore: number, errorCount: number = 0): Promise<void> {
    await this.initializeDatabase();

    await this.dbManager.execute(`
      INSERT OR REPLACE INTO dossier_analytics (id, dossier_id, execution_time, total_cost, data_sources_used, quality_score, error_count)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      uuidv4(),
      dossierId,
      executionTime,
      totalCost,
      JSON.stringify(dataSources),
      qualityScore,
      errorCount
    ]);
  }

  async getUsageMetrics(organizationId?: string, days: number = 30): Promise<UsageMetrics> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    // Total dossiers
    const dossierQuery = organizationId
      ? 'SELECT COUNT(*) as count FROM dossiers WHERE organization_id = ?'
      : 'SELECT COUNT(*) as count FROM dossiers';
    const dossierParams = organizationId ? [organizationId] : [];
    const dossierCount = await this.dbManager.get(dossierQuery, dossierParams);

    // Total cost
    const costQuery = organizationId
      ? 'SELECT SUM(total_cost) as total FROM dossier_analytics da JOIN dossiers d ON da.dossier_id = d.id WHERE d.organization_id = ?'
      : 'SELECT SUM(total_cost) as total FROM dossier_analytics';
    const costParams = organizationId ? [organizationId] : [];
    const costResult = await this.dbManager.get(costQuery, costParams);

    const totalDossiers = dossierCount?.count || 0;
    const totalCost = costResult?.total || 0;

    // Dossiers by status
    const statusQuery = organizationId
      ? 'SELECT status, COUNT(*) as count FROM dossiers WHERE organization_id = ? GROUP BY status'
      : 'SELECT status, COUNT(*) as count FROM dossiers GROUP BY status';
    const statusParams = organizationId ? [organizationId] : [];
    const statusRows = await this.dbManager.all(statusQuery, statusParams);
    const dossiersByStatus: Record<string, number> = {};
    statusRows.forEach((row: any) => {
      dossiersByStatus[row.status] = row.count;
    });

    // Recent requests
    const recentQuery = organizationId
      ? 'SELECT COUNT(*) as count FROM usage_events WHERE organization_id = ? AND created_at > ?'
      : 'SELECT COUNT(*) as count FROM usage_events WHERE created_at > ?';
    const recentParams = organizationId ? [organizationId, since] : [since];
    const recentResult = await this.dbManager.get(recentQuery, recentParams);

    // Unique users
    const usersQuery = organizationId
      ? 'SELECT COUNT(DISTINCT user_id) as count FROM usage_events WHERE organization_id = ? AND created_at > ?'
      : 'SELECT COUNT(DISTINCT user_id) as count FROM usage_events WHERE created_at > ?';
    const usersParams = organizationId ? [organizationId, since] : [since];
    const usersResult = await this.dbManager.get(usersQuery, usersParams);

    return {
      totalDossiers,
      totalCost,
      avgCostPerDossier: totalDossiers > 0 ? totalCost / totalDossiers : 0,
      dossiersByStatus,
      costBySource: {}, // TODO: Implement cost by source tracking
      requestsLast30Days: recentResult?.count || 0,
      uniqueUsers: usersResult?.count || 0
    };
  }

  async getDossierAnalytics(organizationId?: string, limit: number = 100): Promise<DossierAnalytics[]> {
    const query = organizationId
      ? `SELECT d.id as dossier_id, d.company_name, d.status, da.total_cost as cost, 
         da.execution_time, da.data_sources_used, da.quality_score, d.created_at
         FROM dossiers d
         LEFT JOIN dossier_analytics da ON d.id = da.dossier_id
         WHERE d.organization_id = ?
         ORDER BY d.created_at DESC LIMIT ?`
      : `SELECT d.id as dossier_id, d.company_name, d.status, da.total_cost as cost,
         da.execution_time, da.data_sources_used, da.quality_score, d.created_at
         FROM dossiers d
         LEFT JOIN dossier_analytics da ON d.id = da.dossier_id
         ORDER BY d.created_at DESC LIMIT ?`;

    const params = organizationId ? [organizationId, limit] : [limit];
    const rows = await this.dbManager.all(query, params);

    return rows.map((row: any) => ({
      dossierId: row.dossier_id,
      companyName: row.company_name,
      status: row.status,
      cost: row.cost || 0,
      executionTime: row.execution_time || 0,
      dataSourcesUsed: row.data_sources_used ? JSON.parse(row.data_sources_used) : [],
      qualityScore: row.quality_score || 0,
      createdAt: row.created_at
    }));
  }

  async getAPIUsageStats(organizationId?: string, days: number = 7): Promise<any> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const query = organizationId
      ? `SELECT endpoint, method, COUNT(*) as count, AVG(response_time) as avg_time, SUM(cost) as total_cost
         FROM api_usage
         WHERE organization_id = ? AND created_at > ?
         GROUP BY endpoint, method
         ORDER BY count DESC`
      : `SELECT endpoint, method, COUNT(*) as count, AVG(response_time) as avg_time, SUM(cost) as total_cost
         FROM api_usage
         WHERE created_at > ?
         GROUP BY endpoint, method
         ORDER BY count DESC`;

    const params = organizationId ? [organizationId, since] : [since];
    return await this.dbManager.all(query, params);
  }
}

export const analyticsService = new AnalyticsService();
