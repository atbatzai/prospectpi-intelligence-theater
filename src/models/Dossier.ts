/**
 * ProspectPI Intelligence Theater - Dossier Model
 * Story 1.4: Database Schema & User Management
 */

import { v4 as uuidv4 } from 'uuid';
import { DatabaseManager } from '../database/DatabaseManager';

export interface Dossier {
  id: string;
  request_id: string;
  company_name: string;
  confidence_score: number;
  source_count: number;
  generated_at: string;
  last_updated: string;
  classification: string;
  export_count: number;
  is_archived: boolean;
}

export interface IntelligenceSection {
  id: string;
  dossier_id: string;
  section_type: string;
  title: string;
  confidence_score: number;
  last_updated: string;
  is_expanded: boolean;
  display_order: number;
}

export interface IntelligenceInsight {
  id: string;
  section_id: string;
  finding: string;
  evidence: any[]; // JSON array
  confidence: 'high' | 'medium' | 'limited';
  actionable_recommendation?: string | null;
  sources: any[]; // JSON array
  display_order: number;
  created_at: string;
}

export interface DataSource {
  id: string;
  dossier_id: string;
  name: string;
  type: 'api' | 'web_scraping' | 'social' | 'financial' | 'news';
  last_updated: string;
  reliability: number; // 0.00 to 1.00
  url?: string | null;
  api_response_time?: number | null;
  data_freshness_hours?: number | null;
}

// Standard Intelligence Sections from Lovable spec
export const INTELLIGENCE_SECTIONS = {
  EXECUTIVE_SUMMARY: 'executive_summary',
  TECHNOLOGY_INTELLIGENCE: 'technology_intelligence',
  MARKET_POSITIONING: 'market_positioning',
  COMPETITIVE_LANDSCAPE: 'competitive_landscape',
  FINANCIAL_INTELLIGENCE: 'financial_intelligence',
  LEADERSHIP_ANALYSIS: 'leadership_analysis',
  OPERATIONAL_INTELLIGENCE: 'operational_intelligence',
  RISK_ASSESSMENT: 'risk_assessment'
} as const;

export class DossierService {
  private dbManager = DatabaseManager.getInstance();

  async createDossier(
    requestId: string,
    companyName: string,
    confidenceScore: number,
    sourceCount: number
  ): Promise<Dossier> {
    const id = uuidv4();
    const now = new Date().toISOString();

    const dossier = await this.dbManager.queryOne(`
      INSERT INTO dossiers (
        id, request_id, company_name, confidence_score, source_count,
        generated_at, last_updated, classification, export_count, is_archived
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING *
    `, [
      id, requestId, companyName, confidenceScore, sourceCount,
      now, now, 'PROPRIETARY', 0, false
    ]);

    if (!dossier) {
      // SQLite fallback
      return {
        id,
        request_id: requestId,
        company_name: companyName,
        confidence_score: confidenceScore,
        source_count: sourceCount,
        generated_at: now,
        last_updated: now,
        classification: 'PROPRIETARY',
        export_count: 0,
        is_archived: false
      };
    }

    return dossier;
  }

  async getDossierByRequestId(requestId: string): Promise<Dossier | null> {
    return this.dbManager.queryOne('SELECT * FROM dossiers WHERE request_id = ?', [requestId]);
  }

  async createIntelligenceSection(
    dossierId: string,
    sectionType: string,
    title: string,
    confidenceScore: number,
    displayOrder: number
  ): Promise<IntelligenceSection> {
    const id = uuidv4();
    const now = new Date().toISOString();

    const section = await this.dbManager.queryOne(`
      INSERT INTO intelligence_sections (
        id, dossier_id, section_type, title, confidence_score,
        last_updated, is_expanded, display_order
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING *
    `, [
      id, dossierId, sectionType, title, confidenceScore,
      now, false, displayOrder
    ]);

    if (!section) {
      // SQLite fallback
      return {
        id,
        dossier_id: dossierId,
        section_type: sectionType,
        title,
        confidence_score: confidenceScore,
        last_updated: now,
        is_expanded: false,
        display_order: displayOrder
      };
    }

    return section;
  }

  async addIntelligenceInsight(
    sectionId: string,
    finding: string,
    evidence: any[],
    confidence: 'high' | 'medium' | 'limited',
    sources: any[],
    displayOrder: number,
    actionableRecommendation?: string
  ): Promise<IntelligenceInsight> {
    const id = uuidv4();
    const now = new Date().toISOString();

    const insight = await this.dbManager.queryOne(`
      INSERT INTO intelligence_insights (
        id, section_id, finding, evidence, confidence,
        actionable_recommendation, sources, display_order, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING *
    `, [
      id, sectionId, finding, JSON.stringify(evidence), confidence,
      actionableRecommendation || null, JSON.stringify(sources), displayOrder, now
    ]);

    if (!insight) {
      // SQLite fallback
      return {
        id,
        section_id: sectionId,
        finding,
        evidence,
        confidence,
        actionable_recommendation: actionableRecommendation || null,
        sources,
        display_order: displayOrder,
        created_at: now
      };
    }

    return insight;
  }

  async addDataSource(
    dossierId: string,
    name: string,
    type: 'api' | 'web_scraping' | 'social' | 'financial' | 'news',
    reliability: number,
    url?: string,
    apiResponseTime?: number,
    dataFreshnessHours?: number
  ): Promise<DataSource> {
    const id = uuidv4();
    const now = new Date().toISOString();

    const dataSource = await this.dbManager.queryOne(`
      INSERT INTO data_sources (
        id, dossier_id, name, type, last_updated, reliability,
        url, api_response_time, data_freshness_hours
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING *
    `, [
      id, dossierId, name, type, now, reliability,
      url || null, apiResponseTime || null, dataFreshnessHours || null
    ]);

    if (!dataSource) {
      // SQLite fallback
      return {
        id,
        dossier_id: dossierId,
        name,
        type,
        last_updated: now,
        reliability,
        url: url || null,
        api_response_time: apiResponseTime || null,
        data_freshness_hours: dataFreshnessHours || null
      };
    }

    return dataSource;
  }

  async getDossierWithSections(requestId: string): Promise<{
    dossier: Dossier;
    sections: (IntelligenceSection & { insights: IntelligenceInsight[] })[];
    dataSources: DataSource[];
  } | null> {
    const dossier = await this.getDossierByRequestId(requestId);
    if (!dossier) return null;

    const sections = await this.dbManager.query(
      'SELECT * FROM intelligence_sections WHERE dossier_id = ? ORDER BY display_order',
      [dossier.id]
    );

    const sectionsWithInsights = await Promise.all(
      sections.map(async (section: IntelligenceSection) => {
        const insights = await this.dbManager.query(
          'SELECT * FROM intelligence_insights WHERE section_id = ? ORDER BY display_order',
          [section.id]
        );
        return { ...section, insights };
      })
    );

    const dataSources = await this.dbManager.query(
      'SELECT * FROM data_sources WHERE dossier_id = ? ORDER BY reliability DESC',
      [dossier.id]
    );

    return {
      dossier,
      sections: sectionsWithInsights,
      dataSources
    };
  }

  async updateDossierExportCount(dossierId: string): Promise<void> {
    await this.dbManager.execute(
      'UPDATE dossiers SET export_count = export_count + 1 WHERE id = ?',
      [dossierId]
    );
  }

  async archiveDossier(dossierId: string): Promise<void> {
    await this.dbManager.execute(
      'UPDATE dossiers SET is_archived = true WHERE id = ?',
      [dossierId]
    );
  }
}