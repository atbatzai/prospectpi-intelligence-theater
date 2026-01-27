/**
 * Reporting Service - Automated Report Generation
 * Story 6.3: Business Intelligence Reports
 */

import { DatabaseManager } from '../../database/DatabaseManager';
import { v4 as uuidv4 } from 'uuid';

export enum ReportType {
  EXECUTIVE_SUMMARY = 'executive_summary',
  QUALITY_METRICS = 'quality_metrics',
  COST_ANALYSIS = 'cost_analysis',
  USER_ACTIVITY = 'user_activity',
  CUSTOM = 'custom'
}

export enum ReportFormat {
  JSON = 'json',
  CSV = 'csv',
  PDF = 'pdf'
}

export interface ReportTemplate {
  id: string;
  name: string;
  type: ReportType;
  organizationId: string;
  config: any;
  schedule?: string; // cron expression
  enabled: boolean;
  createdAt: string;
}

export interface GeneratedReport {
  id: string;
  templateId: string;
  organizationId: string;
  format: ReportFormat;
  data: any;
  generatedAt: string;
  downloadUrl?: string;
}

class ReportingService {
  private dbManager: DatabaseManager;

  constructor() {
    this.dbManager = DatabaseManager.getInstance();
  }

  async init(): Promise<void> {
    await this.initializeDatabase();
  }

  private async initializeDatabase(): Promise<void> {
    await this.dbManager.execute(`
      CREATE TABLE IF NOT EXISTS report_templates (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        organization_id TEXT NOT NULL,
        config TEXT NOT NULL,
        schedule TEXT,
        enabled BOOLEAN DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
      )
    `);

    await this.dbManager.execute(`
      CREATE TABLE IF NOT EXISTS generated_reports (
        id TEXT PRIMARY KEY,
        template_id TEXT,
        organization_id TEXT NOT NULL,
        format TEXT NOT NULL,
        data TEXT NOT NULL,
        generated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        download_url TEXT,
        FOREIGN KEY (template_id) REFERENCES report_templates(id) ON DELETE SET NULL,
        FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
      )
    `);

    await this.dbManager.execute('CREATE INDEX IF NOT EXISTS idx_reports_org ON generated_reports(organization_id)');
    await this.dbManager.execute('CREATE INDEX IF NOT EXISTS idx_reports_template ON generated_reports(template_id)');
  }

  async createTemplate(
    name: string,
    type: ReportType,
    organizationId: string,
    config: any,
    schedule?: string
  ): Promise<ReportTemplate> {
    await this.initializeDatabase();

    const id = uuidv4();
    const now = new Date().toISOString();

    await this.dbManager.execute(`
      INSERT INTO report_templates (id, name, type, organization_id, config, schedule)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [id, name, type, organizationId, JSON.stringify(config), schedule || null]);

    return {
      id,
      name,
      type,
      organizationId,
      config,
      ...(schedule ? { schedule } : {}),
      enabled: true,
      createdAt: now
    };
  }

  async generateReport(
    templateId: string,
    format: ReportFormat = ReportFormat.JSON
  ): Promise<GeneratedReport> {
    const template = await this.getTemplate(templateId);

    if (!template) {
      throw new Error('Report template not found');
    }

    let data: any;

    switch (template.type) {
      case ReportType.EXECUTIVE_SUMMARY:
        data = await this.generateExecutiveSummary(template.organizationId, template.config);
        break;
      case ReportType.QUALITY_METRICS:
        data = await this.generateQualityReport(template.organizationId, template.config);
        break;
      case ReportType.COST_ANALYSIS:
        data = await this.generateCostAnalysis(template.organizationId, template.config);
        break;
      case ReportType.USER_ACTIVITY:
        data = await this.generateUserActivityReport(template.organizationId, template.config);
        break;
      default:
        data = { message: 'Custom report generation not yet implemented' };
    }

    const reportId = uuidv4();
    const now = new Date().toISOString();

    await this.dbManager.execute(`
      INSERT INTO generated_reports (id, template_id, organization_id, format, data, generated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [reportId, templateId, template.organizationId, format, JSON.stringify(data), now]);

    return {
      id: reportId,
      templateId,
      organizationId: template.organizationId,
      format,
      data,
      generatedAt: now
    };
  }

  private async generateExecutiveSummary(organizationId: string, config: any): Promise<any> {
    const period = config.period || 30; // days
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - period);

    const dossiers = await this.dbManager.get(
      'SELECT COUNT(*) as count, SUM(cost) as totalCost FROM dossiers WHERE organization_id = ? AND created_at >= ?',
      [organizationId, cutoffDate.toISOString()]
    );

    const quality = await this.dbManager.get(`
      SELECT AVG(qm.overall_score) as avgScore, AVG(qm.completion_time) as avgTime
      FROM quality_metrics qm
      JOIN dossiers d ON qm.dossier_id = d.id
      WHERE d.organization_id = ? AND qm.created_at >= ?
    `, [organizationId, cutoffDate.toISOString()]);

    return {
      reportType: 'Executive Summary',
      period: `Last ${period} days`,
      generatedAt: new Date().toISOString(),
      metrics: {
        dossiersGenerated: dossiers?.count || 0,
        totalCost: Math.round((dossiers?.totalCost || 0) * 100) / 100,
        averageQuality: Math.round((quality?.avgScore || 0) * 100) / 100,
        averageCompletionTime: Math.round(quality?.avgTime || 0)
      }
    };
  }

  private async generateQualityReport(organizationId: string, config: any): Promise<any> {
    const rows = await this.dbManager.all(`
      SELECT 
        d.company_name,
        qm.overall_score,
        qm.completeness_score,
        qm.accuracy_score,
        qm.freshness_score,
        qm.depth_score,
        qm.sla_compliance,
        qm.completion_time,
        qm.created_at
      FROM quality_metrics qm
      JOIN dossiers d ON qm.dossier_id = d.id
      WHERE d.organization_id = ?
      ORDER BY qm.created_at DESC
      LIMIT 100
    `, [organizationId]);

    return {
      reportType: 'Quality Metrics Report',
      generatedAt: new Date().toISOString(),
      dossiers: rows.map((row: any) => ({
        companyName: row.company_name,
        scores: {
          overall: row.overall_score,
          completeness: row.completeness_score,
          accuracy: row.accuracy_score,
          freshness: row.freshness_score,
          depth: row.depth_score
        },
        slaCompliant: row.sla_compliance === 1,
        completionTime: row.completion_time,
        date: row.created_at
      }))
    };
  }

  private async generateCostAnalysis(organizationId: string, config: any): Promise<any> {
    const monthlyCosts = await this.dbManager.all(`
      SELECT 
        strftime('%Y-%m', created_at) as month,
        COUNT(*) as count,
        SUM(cost) as totalCost,
        AVG(cost) as avgCost
      FROM dossiers
      WHERE organization_id = ?
      GROUP BY month
      ORDER BY month DESC
      LIMIT 12
    `, [organizationId]);

    return {
      reportType: 'Cost Analysis',
      generatedAt: new Date().toISOString(),
      monthlyBreakdown: monthlyCosts.map((row: any) => ({
        month: row.month,
        dossiersCreated: row.count,
        totalCost: Math.round(row.totalCost * 100) / 100,
        averageCost: Math.round(row.avgCost * 100) / 100
      }))
    };
  }

  private async generateUserActivityReport(organizationId: string, config: any): Promise<any> {
    const users = await this.dbManager.all(`
      SELECT 
        u.email,
        COUNT(DISTINCT CASE WHEN ue.event_type = 'dossier_created' THEN ue.id END) as dossiersCreated,
        COUNT(CASE WHEN ue.event_type = 'api_call' THEN ue.id END) as apiCalls,
        MAX(ue.created_at) as lastActive
      FROM users u
      LEFT JOIN usage_events ue ON u.id = ue.user_id
      WHERE u.organization_id = ?
      GROUP BY u.id, u.email
      ORDER BY dossiersCreated DESC
    `, [organizationId]);

    return {
      reportType: 'User Activity Report',
      generatedAt: new Date().toISOString(),
      users: users.map((row: any) => ({
        email: row.email,
        dossiersCreated: row.dossiersCreated || 0,
        apiCalls: row.apiCalls || 0,
        lastActive: row.lastActive || 'Never'
      }))
    };
  }

  async getTemplate(templateId: string): Promise<ReportTemplate | null> {
    const row = await this.dbManager.get(
      'SELECT * FROM report_templates WHERE id = ?',
      [templateId]
    );

    if (!row) return null;

    return {
      id: row.id,
      name: row.name,
      type: row.type as ReportType,
      organizationId: row.organization_id,
      config: JSON.parse(row.config),
      ...(row.schedule ? { schedule: row.schedule } : {}),
      enabled: row.enabled === 1,
      createdAt: row.created_at
    };
  }

  async listTemplates(organizationId: string): Promise<ReportTemplate[]> {
    const rows = await this.dbManager.all(
      'SELECT * FROM report_templates WHERE organization_id = ? ORDER BY created_at DESC',
      [organizationId]
    );

    return rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      type: row.type as ReportType,
      organizationId: row.organization_id,
      config: JSON.parse(row.config),
      ...(row.schedule ? { schedule: row.schedule } : {}),
      enabled: row.enabled === 1,
      createdAt: row.created_at
    }));
  }
}

export const reportingService = new ReportingService();
