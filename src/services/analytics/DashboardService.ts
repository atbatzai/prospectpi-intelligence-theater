/**
 * Dashboard Service - Real-time Analytics Dashboard
 * Story 6.1: Customer Analytics Dashboard
 */

import { DatabaseManager } from '../../database/DatabaseManager';
import { analyticsService } from './AnalyticsService';
import { qualityMetricsService } from './QualityMetricsService';

export interface DashboardMetrics {
  overview: {
    totalDossiers: number;
    activeResearch: number;
    totalCost: number;
    averageQuality: number;
  };
  usage: {
    dossiersThisMonth: number;
    apiCallsToday: number;
    activeUsers: number;
    costThisMonth: number;
  };
  quality: {
    averageScore: number;
    slaCompliance: number;
    averageCompletionTime: number;
  };
  trends: {
    dossierGrowth: number;
    costTrend: number;
    qualityTrend: number;
  };
}

export interface ActivityHeatmap {
  hour: number;
  dayOfWeek: number;
  activityCount: number;
}

export interface UserActivity {
  userId: string;
  userName: string;
  lastActive: string;
  dossiersCreated: number;
  apiCalls: number;
}

class DashboardService {
  private dbManager: DatabaseManager;

  constructor() {
    this.dbManager = DatabaseManager.getInstance();
  }

  async getDashboardMetrics(organizationId: string): Promise<DashboardMetrics> {
    // Overview metrics
    const totalDossiers = await this.getTotalDossiers(organizationId);
    const activeResearch = await this.getActiveResearch(organizationId);
    const totalCost = await this.getTotalCost(organizationId);
    const qualityData = await qualityMetricsService.getAggregateQuality(organizationId);

    // Usage metrics
    const dossiersThisMonth = await this.getDossiersThisMonth(organizationId);
    const apiCallsToday = await this.getApiCallsToday(organizationId);
    const activeUsers = await this.getActiveUsers(organizationId);
    const costThisMonth = await this.getCostThisMonth(organizationId);

    // Trends
    const dossierGrowth = await this.getDossierGrowth(organizationId);
    const costTrend = await this.getCostTrend(organizationId);
    const qualityTrend = await this.getQualityTrend(organizationId);

    return {
      overview: {
        totalDossiers,
        activeResearch,
        totalCost: Math.round(totalCost * 100) / 100,
        averageQuality: Math.round(qualityData.averageScore * 100) / 100
      },
      usage: {
        dossiersThisMonth,
        apiCallsToday,
        activeUsers,
        costThisMonth: Math.round(costThisMonth * 100) / 100
      },
      quality: {
        averageScore: Math.round(qualityData.averageScore * 100) / 100,
        slaCompliance: Math.round(qualityData.slaComplianceRate * 10) / 10,
        averageCompletionTime: Math.round(qualityData.averageCompletionTime)
      },
      trends: {
        dossierGrowth: Math.round(dossierGrowth * 10) / 10,
        costTrend: Math.round(costTrend * 10) / 10,
        qualityTrend: Math.round(qualityTrend * 10) / 10
      }
    };
  }

  async getActivityHeatmap(organizationId: string, days: number = 30): Promise<ActivityHeatmap[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const rows = await this.dbManager.all(`
      SELECT 
        CAST(strftime('%H', created_at) AS INTEGER) as hour,
        CAST(strftime('%w', created_at) AS INTEGER) as dayOfWeek,
        COUNT(*) as activityCount
      FROM usage_events
      WHERE organization_id = ? AND created_at >= ?
      GROUP BY hour, dayOfWeek
      ORDER BY dayOfWeek, hour
    `, [organizationId, cutoffDate.toISOString()]);

    return rows.map((row: any) => ({
      hour: row.hour,
      dayOfWeek: row.dayOfWeek,
      activityCount: row.activityCount
    }));
  }

  async getUserActivity(organizationId: string, limit: number = 10): Promise<UserActivity[]> {
    const rows = await this.dbManager.all(`
      SELECT 
        u.id as userId,
        u.email as userName,
        MAX(ue.created_at) as lastActive,
        COUNT(DISTINCT CASE WHEN ue.event_type = 'dossier_created' THEN ue.id END) as dossiersCreated,
        COUNT(CASE WHEN ue.event_type = 'api_call' THEN ue.id END) as apiCalls
      FROM users u
      LEFT JOIN usage_events ue ON u.id = ue.user_id
      WHERE u.organization_id = ?
      GROUP BY u.id, u.email
      ORDER BY lastActive DESC
      LIMIT ?
    `, [organizationId, limit]);

    return rows.map((row: any) => ({
      userId: row.userId,
      userName: row.userName,
      lastActive: row.lastActive || 'Never',
      dossiersCreated: row.dossiersCreated || 0,
      apiCalls: row.apiCalls || 0
    }));
  }

  private async getTotalDossiers(organizationId: string): Promise<number> {
    const result = await this.dbManager.get(
      'SELECT COUNT(*) as count FROM dossiers WHERE organization_id = ?',
      [organizationId]
    );
    return result?.count || 0;
  }

  private async getActiveResearch(organizationId: string): Promise<number> {
    const result = await this.dbManager.get(
      "SELECT COUNT(*) as count FROM research_requests WHERE organization_id = ? AND status IN ('pending', 'processing')",
      [organizationId]
    );
    return result?.count || 0;
  }

  private async getTotalCost(organizationId: string): Promise<number> {
    const result = await this.dbManager.get(
      'SELECT SUM(cost) as total FROM dossiers WHERE organization_id = ?',
      [organizationId]
    );
    return result?.total || 0;
  }

  private async getDossiersThisMonth(organizationId: string): Promise<number> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const result = await this.dbManager.get(
      'SELECT COUNT(*) as count FROM dossiers WHERE organization_id = ? AND created_at >= ?',
      [organizationId, startOfMonth.toISOString()]
    );
    return result?.count || 0;
  }

  private async getApiCallsToday(organizationId: string): Promise<number> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const result = await this.dbManager.get(
      "SELECT COUNT(*) as count FROM api_usage WHERE organization_id = ? AND created_at >= ?",
      [organizationId, startOfDay.toISOString()]
    );
    return result?.count || 0;
  }

  private async getActiveUsers(organizationId: string): Promise<number> {
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const result = await this.dbManager.get(`
      SELECT COUNT(DISTINCT user_id) as count 
      FROM usage_events 
      WHERE organization_id = ? AND created_at >= ?
    `, [organizationId, last30Days.toISOString()]);
    return result?.count || 0;
  }

  private async getCostThisMonth(organizationId: string): Promise<number> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const result = await this.dbManager.get(
      'SELECT SUM(cost) as total FROM dossiers WHERE organization_id = ? AND created_at >= ?',
      [organizationId, startOfMonth.toISOString()]
    );
    return result?.total || 0;
  }

  private async getDossierGrowth(organizationId: string): Promise<number> {
    const thisMonth = await this.getDossiersThisMonth(organizationId);
    const lastMonth = await this.getDossiersLastMonth(organizationId);
    
    if (lastMonth === 0) return thisMonth > 0 ? 100 : 0;
    return ((thisMonth - lastMonth) / lastMonth) * 100;
  }

  private async getDossiersLastMonth(organizationId: string): Promise<number> {
    const startOfLastMonth = new Date();
    startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);
    startOfLastMonth.setDate(1);
    startOfLastMonth.setHours(0, 0, 0, 0);

    const endOfLastMonth = new Date(startOfLastMonth);
    endOfLastMonth.setMonth(endOfLastMonth.getMonth() + 1);

    const result = await this.dbManager.get(
      'SELECT COUNT(*) as count FROM dossiers WHERE organization_id = ? AND created_at >= ? AND created_at < ?',
      [organizationId, startOfLastMonth.toISOString(), endOfLastMonth.toISOString()]
    );
    return result?.count || 0;
  }

  private async getCostTrend(organizationId: string): Promise<number> {
    const thisMonth = await this.getCostThisMonth(organizationId);
    const lastMonth = await this.getCostLastMonth(organizationId);
    
    if (lastMonth === 0) return thisMonth > 0 ? 100 : 0;
    return ((thisMonth - lastMonth) / lastMonth) * 100;
  }

  private async getCostLastMonth(organizationId: string): Promise<number> {
    const startOfLastMonth = new Date();
    startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);
    startOfLastMonth.setDate(1);
    startOfLastMonth.setHours(0, 0, 0, 0);

    const endOfLastMonth = new Date(startOfLastMonth);
    endOfLastMonth.setMonth(endOfLastMonth.getMonth() + 1);

    const result = await this.dbManager.get(
      'SELECT SUM(cost) as total FROM dossiers WHERE organization_id = ? AND created_at >= ? AND created_at < ?',
      [organizationId, startOfLastMonth.toISOString(), endOfLastMonth.toISOString()]
    );
    return result?.total || 0;
  }

  private async getQualityTrend(organizationId: string): Promise<number> {
    // Calculate quality trend by comparing recent vs older dossiers
    const recent = await this.dbManager.get(`
      SELECT AVG(qm.overall_score) as avg
      FROM quality_metrics qm
      JOIN dossiers d ON qm.dossier_id = d.id
      WHERE d.organization_id = ? AND qm.created_at >= datetime('now', '-7 days')
    `, [organizationId]);

    const previous = await this.dbManager.get(`
      SELECT AVG(qm.overall_score) as avg
      FROM quality_metrics qm
      JOIN dossiers d ON qm.dossier_id = d.id
      WHERE d.organization_id = ? AND qm.created_at >= datetime('now', '-14 days') AND qm.created_at < datetime('now', '-7 days')
    `, [organizationId]);

    const recentAvg = recent?.avg || 0;
    const previousAvg = previous?.avg || 0;

    if (previousAvg === 0) return recentAvg > 0 ? 100 : 0;
    return ((recentAvg - previousAvg) / previousAvg) * 100;
  }
}

export const dashboardService = new DashboardService();
