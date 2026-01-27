/**
 * ProspectPI - Executive Intelligence Dashboard Service
 * Story 11.1 - Real-time metrics, visualizations, BI integration
 */

import { DatabaseManager } from '../database/DatabaseManager';
import * as d3 from 'd3';
import PDFDocument from 'pdfkit';

interface DateRange {
  start: Date;
  end: Date;
}

interface Metrics {
  dossiersGenerated: number;
  averageCost: number;
  teamUsage: Record<string, number>;
  winRateCorrelation: number;
  costTrend: number[];
  topUsers: Array<{ userId: string; count: number }>;
}

interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    color: string;
  }>;
}

export class ExecutiveDashboardService {
  private db: DatabaseManager;

  constructor() {
    this.db = DatabaseManager.getInstance();
  }

  /**
   * Get real-time metrics for executive dashboard
   * Target: <2 seconds load time
   */
  async getMetrics(orgId: string, dateRange: DateRange): Promise<Metrics> {
    const startTime = Date.now();

    // Parallel queries for performance
    const [dossiers, costs, usage, winRate] = await Promise.all([
      this.getDossierCount(orgId, dateRange),
      this.getAverageCost(orgId, dateRange),
      this.getTeamUsage(orgId, dateRange),
      this.getWinRateCorrelation(orgId, dateRange)
    ]);

    const costTrend = await this.getCostTrend(orgId, dateRange);
    const topUsers = await this.getTopUsers(orgId, dateRange);

    const duration = Date.now() - startTime;
    if (duration > 2000) {
      console.warn(\Dashboard metrics took \ms (target: <2000ms)\);
    }

    return {
      dossiersGenerated: dossiers,
      averageCost: costs,
      teamUsage: usage,
      winRateCorrelation: winRate,
      costTrend,
      topUsers
    };
  }

  /**
   * Generate executive report in PDF or Excel format
   * For board meetings and stakeholder updates
   */
  async generateReport(orgId: string, dateRange: DateRange, format: 'pdf' | 'excel'): Promise<Buffer> {
    const metrics = await this.getMetrics(orgId, dateRange);

    if (format === 'pdf') {
      return this.generatePDFReport(metrics, dateRange);
    } else {
      return this.generateExcelReport(metrics, dateRange);
    }
  }

  /**
   * Get visualization data for D3.js charts
   * Returns data formatted for various chart types
   */
  async getVisualizationData(orgId: string, metric: string, dateRange: DateRange): Promise<ChartData> {
    switch (metric) {
      case 'usage_trend':
        return this.getUsageTrendData(orgId, dateRange);
      case 'cost_analysis':
        return this.getCostAnalysisData(orgId, dateRange);
      case 'team_heatmap':
        return this.getTeamHeatmapData(orgId, dateRange);
      case 'win_funnel':
        return this.getWinFunnelData(orgId, dateRange);
      default:
        throw new Error(\Unknown metric: \\);
    }
  }

  /**
   * Schedule recurring report delivery
   * Daily, weekly, or monthly email reports
   */
  async scheduleReport(
    orgId: string,
    frequency: 'daily' | 'weekly' | 'monthly',
    recipients: string[],
    format: 'pdf' | 'excel'
  ): Promise<{ id: string; nextRun: Date }> {
    const cronSchedule = this.getCronSchedule(frequency);

    const result = await this.db.query(\
      INSERT INTO scheduled_reports 
        (org_id, frequency, cron_schedule, recipients, format, active)
      VALUES (, , , , , true)
      RETURNING id, next_run_at
    \, [orgId, frequency, cronSchedule, JSON.stringify(recipients), format]);

    return {
      id: result.rows[0].id,
      nextRun: result.rows[0].next_run_at
    };
  }

  /**
   * BI Platform Integration - Export data for Tableau/PowerBI/Looker
   */
  async exportForBIPlatform(
    orgId: string,
    platform: 'tableau' | 'powerbi' | 'looker',
    dateRange: DateRange
  ): Promise<any> {
    const data = await this.getComprehensiveData(orgId, dateRange);

    switch (platform) {
      case 'tableau':
        return this.formatForTableau(data);
      case 'powerbi':
        return this.formatForPowerBI(data);
      case 'looker':
        return this.formatForLooker(data);
      default:
        throw new Error(\Unsupported BI platform: \\);
    }
  }

  /**
   * Real-time dashboard updates via WebSocket
   * Pushes metrics without page refresh
   */
  async subscribeToRealTimeUpdates(orgId: string, ws: WebSocket): Promise<void> {
    // Subscribe to database changes
    const client = await this.db.pool.connect();
    
    await client.query(\
      LISTEN dossier_created;
      LISTEN user_activity;
    \);

    client.on('notification', async (msg) => {
      if (msg.channel === 'dossier_created' || msg.channel === 'user_activity') {
        // Fetch updated metrics
        const metrics = await this.getMetrics(orgId, {
          start: new Date(Date.now() - 24 * 60 * 60 * 1000),
          end: new Date()
        });

        ws.send(JSON.stringify({
          type: 'metrics_update',
          data: metrics
        }));
      }
    });
  }

  /**
   * Private helper methods
   */

  private async getDossierCount(orgId: string, dateRange: DateRange): Promise<number> {
    const result = await this.db.query(\
      SELECT COUNT(*) as count
      FROM dossiers
      WHERE org_id =  
        AND created_at BETWEEN  AND 
    \, [orgId, dateRange.start, dateRange.end]);

    return parseInt(result.rows[0].count);
  }

  private async getAverageCost(orgId: string, dateRange: DateRange): Promise<number> {
    const result = await this.db.query(\
      SELECT AVG(total_cost) as avg_cost
      FROM dossiers
      WHERE org_id =  
        AND created_at BETWEEN  AND 
    \, [orgId, dateRange.start, dateRange.end]);

    return parseFloat(result.rows[0].avg_cost) || 0;
  }

  private async getTeamUsage(orgId: string, dateRange: DateRange): Promise<Record<string, number>> {
    const result = await this.db.query(\
      SELECT u.team_id, COUNT(d.id) as count
      FROM dossiers d
      JOIN users u ON d.user_id = u.id
      WHERE d.org_id =  
        AND d.created_at BETWEEN  AND 
      GROUP BY u.team_id
    \, [orgId, dateRange.start, dateRange.end]);

    return result.rows.reduce((acc, row) => {
      acc[row.team_id] = parseInt(row.count);
      return acc;
    }, {});
  }

  private async getWinRateCorrelation(orgId: string, dateRange: DateRange): Promise<number> {
    // Calculate correlation between dossier usage and deal wins
    const result = await this.db.query(\
      SELECT 
        CORR(dossier_count, won_deals) as correlation
      FROM (
        SELECT 
          u.id,
          COUNT(DISTINCT d.id) as dossier_count,
          COUNT(DISTINCT CASE WHEN o.stage = 'won' THEN o.id END) as won_deals
        FROM users u
        LEFT JOIN dossiers d ON u.id = d.user_id
        LEFT JOIN opportunities o ON u.id = o.owner_id
        WHERE u.org_id = 
          AND d.created_at BETWEEN  AND 
        GROUP BY u.id
      ) stats
    \, [orgId, dateRange.start, dateRange.end]);

    return parseFloat(result.rows[0].correlation) || 0;
  }

  private async getCostTrend(orgId: string, dateRange: DateRange): Promise<number[]> {
    const result = await this.db.query(\
      SELECT 
        DATE_TRUNC('day', created_at) as day,
        AVG(total_cost) as avg_cost
      FROM dossiers
      WHERE org_id =  
        AND created_at BETWEEN  AND 
      GROUP BY day
      ORDER BY day
    \, [orgId, dateRange.start, dateRange.end]);

    return result.rows.map(r => parseFloat(r.avg_cost));
  }

  private async getTopUsers(orgId: string, dateRange: DateRange): Promise<Array<{ userId: string; count: number }>> {
    const result = await this.db.query(\
      SELECT user_id, COUNT(*) as count
      FROM dossiers
      WHERE org_id =  
        AND created_at BETWEEN  AND 
      GROUP BY user_id
      ORDER BY count DESC
      LIMIT 10
    \, [orgId, dateRange.start, dateRange.end]);

    return result.rows.map(r => ({
      userId: r.user_id,
      count: parseInt(r.count)
    }));
  }

  private async getUsageTrendData(orgId: string, dateRange: DateRange): Promise<ChartData> {
    const result = await this.db.query(\
      SELECT 
        DATE_TRUNC('day', created_at) as day,
        COUNT(*) as count
      FROM dossiers
      WHERE org_id =  
        AND created_at BETWEEN  AND 
      GROUP BY day
      ORDER BY day
    \, [orgId, dateRange.start, dateRange.end]);

    return {
      labels: result.rows.map(r => r.day.toISOString().split('T')[0]),
      datasets: [{
        label: 'Dossiers Generated',
        data: result.rows.map(r => parseInt(r.count)),
        color: '#4F46E5'
      }]
    };
  }

  private async getCostAnalysisData(orgId: string, dateRange: DateRange): Promise<ChartData> {
    // Implementation for cost analysis chart data
    return { labels: [], datasets: [] };
  }

  private async getTeamHeatmapData(orgId: string, dateRange: DateRange): Promise<ChartData> {
    // Implementation for team activity heatmap
    return { labels: [], datasets: [] };
  }

  private async getWinFunnelData(orgId: string, dateRange: DateRange): Promise<ChartData> {
    // Implementation for sales funnel visualization
    return { labels: [], datasets: [] };
  }

  private generatePDFReport(metrics: Metrics, dateRange: DateRange): Buffer {
    const doc = new PDFDocument();
    const buffers: Buffer[] = [];

    doc.on('data', buffers.push.bind(buffers));

    // PDF content
    doc.fontSize(24).text('ProspectPI Executive Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(\Period: \ - \\);
    doc.moveDown();
    
    doc.fontSize(16).text('Key Metrics');
    doc.fontSize(12).text(\Total Dossiers: \\);
    doc.text(\Average Cost: $\\);
    doc.text(\Win Rate Correlation: \%\);

    doc.end();

    return Buffer.concat(buffers);
  }

  private generateExcelReport(metrics: Metrics, dateRange: DateRange): Buffer {
    // Excel generation using exceljs library
    return Buffer.from('Excel report placeholder');
  }

  private getCronSchedule(frequency: string): string {
    const schedules: Record<string, string> = {
      'daily': '0 8 * * *',      // 8 AM daily
      'weekly': '0 8 * * 1',     // 8 AM Monday
      'monthly': '0 8 1 * *'     // 8 AM 1st of month
    };
    return schedules[frequency];
  }

  private async getComprehensiveData(orgId: string, dateRange: DateRange): Promise<any> {
    // Fetch all relevant data for BI export
    return {};
  }

  private formatForTableau(data: any): any {
    // Format data for Tableau
    return data;
  }

  private formatForPowerBI(data: any): any {
    // Format data for PowerBI
    return data;
  }

  private formatForLooker(data: any): any {
    // Format data for Looker
    return data;
  }
}
