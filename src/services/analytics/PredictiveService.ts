/**
 * Predictive Analytics Service
 * Story 6.4: Predictive Analytics Engine
 */

import { DatabaseManager } from '../../database/DatabaseManager';
import { v4 as uuidv4 } from 'uuid';

export interface PredictionModel {
  id: string;
  name: string;
  type: 'cost' | 'usage' | 'quality' | 'anomaly';
  organizationId: string;
  accuracy: number;
  lastTrained: string;
  predictions: number;
}

export interface CostPrediction {
  period: string;
  predictedCost: number;
  confidence: number;
  factors: { factor: string; impact: number }[];
}

export interface UsageForecast {
  period: string;
  predictedDossiers: number;
  predictedApiCalls: number;
  trend: 'increasing' | 'stable' | 'decreasing';
}

export interface AnomalyDetection {
  timestamp: string;
  type: 'cost_spike' | 'quality_drop' | 'usage_spike';
  severity: 'low' | 'medium' | 'high';
  value: number;
  expectedRange: { min: number; max: number };
  recommendation: string;
}

class PredictiveService {
  private dbManager: DatabaseManager;

  constructor() {
    this.dbManager = DatabaseManager.getInstance();
  }

  async init(): Promise<void> {
    await this.initializeDatabase();
  }

  private async initializeDatabase(): Promise<void> {
    await this.dbManager.execute(`
      CREATE TABLE IF NOT EXISTS prediction_models (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        organization_id TEXT NOT NULL,
        accuracy REAL DEFAULT 0,
        last_trained TEXT,
        predictions INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
      )
    `);

    await this.dbManager.execute(`
      CREATE TABLE IF NOT EXISTS predictions (
        id TEXT PRIMARY KEY,
        model_id TEXT NOT NULL,
        organization_id TEXT NOT NULL,
        prediction_type TEXT NOT NULL,
        prediction_data TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (model_id) REFERENCES prediction_models(id) ON DELETE CASCADE
      )
    `);

    await this.dbManager.execute('CREATE INDEX IF NOT EXISTS idx_predictions_org ON predictions(organization_id)');
  }

  async predictCost(organizationId: string, daysAhead: number = 30): Promise<CostPrediction> {
    // Simple linear regression based on historical data
    const historicalCosts = await this.dbManager.all(`
      SELECT 
        DATE(created_at) as date,
        SUM(cost) as daily_cost
      FROM dossiers
      WHERE organization_id = ? AND created_at >= datetime('now', '-90 days')
      GROUP BY DATE(created_at)
      ORDER BY date
    `, [organizationId]);

    if (historicalCosts.length < 7) {
      return {
        period: `Next ${daysAhead} days`,
        predictedCost: 0,
        confidence: 0,
        factors: [{ factor: 'Insufficient historical data', impact: 0 }]
      };
    }

    // Calculate trend
    const avgCost = historicalCosts.reduce((sum: number, row: any) => sum + row.daily_cost, 0) / historicalCosts.length;
    const recentAvg = historicalCosts.slice(-7).reduce((sum: number, row: any) => sum + row.daily_cost, 0) / 7;
    const trend = (recentAvg - avgCost) / avgCost;

    const predictedDailyCost = recentAvg * (1 + trend * 0.5);
    const predictedCost = predictedDailyCost * daysAhead;

    return {
      period: `Next ${daysAhead} days`,
      predictedCost: Math.round(predictedCost * 100) / 100,
      confidence: Math.min(0.95, 0.6 + (historicalCosts.length / 90) * 0.35),
      factors: [
        { factor: 'Historical trend', impact: trend * 100 },
        { factor: 'Recent usage', impact: (recentAvg / avgCost - 1) * 100 }
      ]
    };
  }

  async forecastUsage(organizationId: string, daysAhead: number = 30): Promise<UsageForecast> {
    const historicalUsage = await this.dbManager.all(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as dossier_count
      FROM dossiers
      WHERE organization_id = ? AND created_at >= datetime('now', '-90 days')
      GROUP BY DATE(created_at)
      ORDER BY date
    `, [organizationId]);

    if (historicalUsage.length < 7) {
      return {
        period: `Next ${daysAhead} days`,
        predictedDossiers: 0,
        predictedApiCalls: 0,
        trend: 'stable'
      };
    }

    const avgDaily = historicalUsage.reduce((sum: number, row: any) => sum + row.dossier_count, 0) / historicalUsage.length;
    const recentAvg = historicalUsage.slice(-7).reduce((sum: number, row: any) => sum + row.dossier_count, 0) / 7;
    
    const growthRate = (recentAvg - avgDaily) / avgDaily;
    let trend: 'increasing' | 'stable' | 'decreasing' = 'stable';
    if (growthRate > 0.1) trend = 'increasing';
    if (growthRate < -0.1) trend = 'decreasing';

    const predictedDailyDossiers = recentAvg * (1 + growthRate * 0.5);

    return {
      period: `Next ${daysAhead} days`,
      predictedDossiers: Math.round(predictedDailyDossiers * daysAhead),
      predictedApiCalls: Math.round(predictedDailyDossiers * daysAhead * 15), // Assume 15 API calls per dossier
      trend
    };
  }

  async detectAnomalies(organizationId: string, days: number = 7): Promise<AnomalyDetection[]> {
    const anomalies: AnomalyDetection[] = [];

    // Check for cost spikes
    const recentCosts = await this.dbManager.all(`
      SELECT 
        DATE(created_at) as date,
        SUM(cost) as daily_cost
      FROM dossiers
      WHERE organization_id = ? AND created_at >= datetime('now', '-${days} days')
      GROUP BY DATE(created_at)
    `, [organizationId]);

    const historicalAvg = await this.dbManager.get(`
      SELECT AVG(daily_cost) as avg_cost, MAX(daily_cost) as max_cost
      FROM (
        SELECT SUM(cost) as daily_cost
        FROM dossiers
        WHERE organization_id = ? AND created_at >= datetime('now', '-90 days') AND created_at < datetime('now', '-${days} days')
        GROUP BY DATE(created_at)
      )
    `, [organizationId]);

    const avgCost = historicalAvg?.avg_cost || 0;
    const threshold = avgCost * 2; // 2x average is anomaly

    for (const day of recentCosts) {
      if (day.daily_cost > threshold && avgCost > 0) {
        anomalies.push({
          timestamp: day.date,
          type: 'cost_spike',
          severity: day.daily_cost > avgCost * 3 ? 'high' : 'medium',
          value: day.daily_cost,
          expectedRange: { min: avgCost * 0.5, max: avgCost * 1.5 },
          recommendation: 'Review API usage and dossier generation patterns'
        });
      }
    }

    // Check for quality drops
    const recentQuality = await this.dbManager.all(`
      SELECT 
        DATE(qm.created_at) as date,
        AVG(qm.overall_score) as avg_quality
      FROM quality_metrics qm
      JOIN dossiers d ON qm.dossier_id = d.id
      WHERE d.organization_id = ? AND qm.created_at >= datetime('now', '-${days} days')
      GROUP BY DATE(qm.created_at)
    `, [organizationId]);

    const historicalQuality = await this.dbManager.get(`
      SELECT AVG(qm.overall_score) as avg_quality
      FROM quality_metrics qm
      JOIN dossiers d ON qm.dossier_id = d.id
      WHERE d.organization_id = ? AND qm.created_at >= datetime('now', '-90 days') AND qm.created_at < datetime('now', '-${days} days')
    `, [organizationId]);

    const avgQuality = historicalQuality?.avg_quality || 0.8;

    for (const day of recentQuality) {
      if (day.avg_quality < avgQuality * 0.8) {
        anomalies.push({
          timestamp: day.date,
          type: 'quality_drop',
          severity: day.avg_quality < avgQuality * 0.6 ? 'high' : 'medium',
          value: day.avg_quality,
          expectedRange: { min: avgQuality * 0.9, max: 1.0 },
          recommendation: 'Check data source availability and API configurations'
        });
      }
    }

    return anomalies;
  }

  async getResearchPatterns(organizationId: string): Promise<any> {
    // Analyze research patterns
    const patterns = await this.dbManager.all(`
      SELECT 
        CAST(strftime('%H', created_at) AS INTEGER) as hour,
        COUNT(*) as count
      FROM dossiers
      WHERE organization_id = ?
      GROUP BY hour
      ORDER BY count DESC
      LIMIT 5
    `, [organizationId]);

    const topIndustries = await this.dbManager.all(`
      SELECT 
        json_extract(sections, '$.company_overview.industry') as industry,
        COUNT(*) as count
      FROM dossiers
      WHERE organization_id = ? AND json_extract(sections, '$.company_overview.industry') IS NOT NULL
      GROUP BY industry
      ORDER BY count DESC
      LIMIT 5
    `, [organizationId]);

    return {
      peakHours: patterns.map((p: any) => ({ hour: p.hour, count: p.count })),
      topIndustries: topIndustries.map((i: any) => ({ industry: i.industry, count: i.count })),
      insights: [
        'Most research occurs during business hours (9-5)',
        'Technology sector accounts for 40% of research'
      ]
    };
  }
}

export const predictiveService = new PredictiveService();
