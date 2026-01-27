/**
 * Quality Metrics Service - Dossier Quality Scoring
 * Story 6.2: Quality Metrics & SLA Tracking
 */

import { DatabaseManager } from '../../database/DatabaseManager';
import { v4 as uuidv4 } from 'uuid';

export interface QualityScore {
  overall: number;
  completeness: number;
  accuracy: number;
  freshness: number;
  depth: number;
}

export interface QualityMetrics {
  dossierId: string;
  scores: QualityScore;
  slaCompliance: boolean;
  completionTime: number;
  dataSourcesUsed: string[];
  errorCount: number;
  warnings: string[];
  timestamp: string;
}

class QualityMetricsService {
  private dbManager: DatabaseManager;

  constructor() {
    this.dbManager = DatabaseManager.getInstance();
  }

  async init(): Promise<void> {
    await this.initializeDatabase();
  }

  private async initializeDatabase(): Promise<void> {
    await this.dbManager.execute(`
      CREATE TABLE IF NOT EXISTS quality_metrics (
        id TEXT PRIMARY KEY,
        dossier_id TEXT NOT NULL UNIQUE,
        overall_score REAL NOT NULL,
        completeness_score REAL NOT NULL,
        accuracy_score REAL NOT NULL,
        freshness_score REAL NOT NULL,
        depth_score REAL NOT NULL,
        sla_compliance BOOLEAN DEFAULT 1,
        completion_time INTEGER NOT NULL,
        data_sources TEXT NOT NULL,
        error_count INTEGER DEFAULT 0,
        warnings TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (dossier_id) REFERENCES dossiers(id) ON DELETE CASCADE
      )
    `);

    await this.dbManager.execute('CREATE INDEX IF NOT EXISTS idx_quality_dossier ON quality_metrics(dossier_id)');
    await this.dbManager.execute('CREATE INDEX IF NOT EXISTS idx_quality_overall ON quality_metrics(overall_score)');
  }

  async calculateQualityScore(dossier: any): Promise<QualityScore> {
    // Completeness: Check if key sections are present
    const completeness = this.calculateCompleteness(dossier);

    // Accuracy: Based on data source reliability
    const accuracy = this.calculateAccuracy(dossier);

    // Freshness: How recent is the data
    const freshness = this.calculateFreshness(dossier);

    // Depth: Amount and quality of information
    const depth = this.calculateDepth(dossier);

    // Overall: Weighted average
    const overall = (
      completeness * 0.3 +
      accuracy * 0.3 +
      freshness * 0.2 +
      depth * 0.2
    );

    return {
      overall: Math.round(overall * 100) / 100,
      completeness: Math.round(completeness * 100) / 100,
      accuracy: Math.round(accuracy * 100) / 100,
      freshness: Math.round(freshness * 100) / 100,
      depth: Math.round(depth * 100) / 100
    };
  }

  private calculateCompleteness(dossier: any): number {
    const requiredSections = [
      'company_overview',
      'executives',
      'technology_stack',
      'market_intelligence',
      'deal_winning_intelligence'
    ];

    let present = 0;
    const sections = dossier.sections || {};

    for (const section of requiredSections) {
      if (sections[section] && Object.keys(sections[section]).length > 0) {
        present++;
      }
    }

    return present / requiredSections.length;
  }

  private calculateAccuracy(dossier: any): number {
    const dataSources = dossier.data_sources || [];
    
    // Higher score for more reliable sources
    const sourceReliability: Record<string, number> = {
      'theirstack': 0.95,
      'perplexity': 0.90,
      'coresignal': 0.90,
      'marketaux': 0.85,
      'web_scraping': 0.70
    };

    if (dataSources.length === 0) return 0.5;

    const avgReliability = dataSources.reduce((sum: number, source: string) => {
      return sum + (sourceReliability[source] || 0.6);
    }, 0) / dataSources.length;

    return avgReliability;
  }

  private calculateFreshness(dossier: any): number {
    const createdAt = new Date(dossier.created_at || Date.now()).getTime();
    const now = Date.now();
    const ageInDays = (now - createdAt) / (1000 * 60 * 60 * 24);

    // Fresh data: 1.0 score
    // 7 days old: 0.8 score
    // 30 days old: 0.5 score
    // 90+ days old: 0.2 score
    if (ageInDays < 1) return 1.0;
    if (ageInDays < 7) return 0.8;
    if (ageInDays < 30) return 0.5;
    if (ageInDays < 90) return 0.3;
    return 0.2;
  }

  private calculateDepth(dossier: any): number {
    const sections = dossier.sections || {};
    let totalFields = 0;
    let populatedFields = 0;

    const countFields = (obj: any): void => {
      for (const key in obj) {
        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
          countFields(obj[key]);
        } else {
          totalFields++;
          if (obj[key] && (typeof obj[key] !== 'string' || obj[key].length > 0)) {
            populatedFields++;
          }
        }
      }
    };

    countFields(sections);

    return totalFields > 0 ? populatedFields / totalFields : 0;
  }

  async recordQualityMetrics(dossierId: string, metrics: QualityMetrics): Promise<void> {
    await this.initializeDatabase();

    await this.dbManager.execute(`
      INSERT OR REPLACE INTO quality_metrics (
        id, dossier_id, overall_score, completeness_score, accuracy_score, 
        freshness_score, depth_score, sla_compliance, completion_time, 
        data_sources, error_count, warnings
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      uuidv4(),
      dossierId,
      metrics.scores.overall,
      metrics.scores.completeness,
      metrics.scores.accuracy,
      metrics.scores.freshness,
      metrics.scores.depth,
      metrics.slaCompliance ? 1 : 0,
      metrics.completionTime,
      JSON.stringify(metrics.dataSourcesUsed),
      metrics.errorCount,
      JSON.stringify(metrics.warnings)
    ]);
  }

  async getQualityMetrics(dossierId: string): Promise<QualityMetrics | null> {
    const row = await this.dbManager.get(
      'SELECT * FROM quality_metrics WHERE dossier_id = ?',
      [dossierId]
    );

    if (!row) return null;

    return {
      dossierId: row.dossier_id,
      scores: {
        overall: row.overall_score,
        completeness: row.completeness_score,
        accuracy: row.accuracy_score,
        freshness: row.freshness_score,
        depth: row.depth_score
      },
      slaCompliance: row.sla_compliance === 1,
      completionTime: row.completion_time,
      dataSourcesUsed: JSON.parse(row.data_sources),
      errorCount: row.error_count,
      warnings: row.warnings ? JSON.parse(row.warnings) : [],
      timestamp: row.created_at
    };
  }

  async getAggregateQuality(organizationId?: string): Promise<any> {
    const query = organizationId
      ? `SELECT AVG(overall_score) as avg_score, AVG(completion_time) as avg_time,
         SUM(CASE WHEN sla_compliance = 1 THEN 1 ELSE 0 END) as sla_compliant,
         COUNT(*) as total
         FROM quality_metrics qm
         JOIN dossiers d ON qm.dossier_id = d.id
         WHERE d.organization_id = ?`
      : `SELECT AVG(overall_score) as avg_score, AVG(completion_time) as avg_time,
         SUM(CASE WHEN sla_compliance = 1 THEN 1 ELSE 0 END) as sla_compliant,
         COUNT(*) as total
         FROM quality_metrics`;

    const params = organizationId ? [organizationId] : [];
    const result = await this.dbManager.get(query, params);

    return {
      averageScore: result?.avg_score || 0,
      averageCompletionTime: result?.avg_time || 0,
      slaComplianceRate: result?.total > 0 ? (result.sla_compliant / result.total) * 100 : 0,
      totalDossiers: result?.total || 0
    };
  }
}

export const qualityMetricsService = new QualityMetricsService();
