/**
 * ProspectPI Intelligence Theater - Dossier Model
 * Story 1.4: Database Schema & User Management
 */

import { v4 as uuidv4 } from 'uuid';
import { DatabaseManager } from '../database/DatabaseManager';

export interface Dossier {
  id: string;
  request_id: string;
  user_id: string; // YOLO: Added user ownership
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

// DEV AGENT: Dossier Sharing & Permissions Model
export interface DossierShare {
  id: string;
  dossier_id: string;
  shared_by_user_id: string;
  shared_with_user_id: string | null; // Individual sharing
  shared_with_organization_id: string | null; // Organization sharing
  permission_level: 'read' | 'comment' | 'export' | 'admin';
  expires_at: string | null;
  created_at: string;
  is_active: boolean;
}

export interface DossierPermissions {
  can_read: boolean;
  can_comment: boolean;
  can_export: boolean;
  can_share: boolean;
  can_archive: boolean;
  is_owner: boolean;
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
    userId: string,
    companyName: string,
    confidenceScore: number,
    sourceCount: number
  ): Promise<Dossier> {
    const id = uuidv4();
    const now = new Date().toISOString();

    const dossier = await this.dbManager.queryOne(`
      INSERT INTO dossiers (
        id, request_id, user_id, company_name, confidence_score, source_count,
        generated_at, last_updated, classification, export_count, is_archived
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING *
    `, [
      id, requestId, userId, companyName, confidenceScore, sourceCount,
      now, now, 'PROPRIETARY', 0, false
    ]);

    if (!dossier) {
      // SQLite fallback
      return {
        id,
        request_id: requestId,
        user_id: userId,
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

  // YOLO: Critical SaaS Feature - User Dossier Retrieval
  async getUserDossiers(
    userId: string, 
    options: {
      limit?: number;
      offset?: number;
      includeArchived?: boolean;
      sortBy?: 'generated_at' | 'company_name' | 'confidence_score';
      sortOrder?: 'ASC' | 'DESC';
    } = {}
  ): Promise<{
    dossiers: Dossier[];
    total: number;
    hasMore: boolean;
  }> {
    const {
      limit = 20,
      offset = 0,
      includeArchived = false,
      sortBy = 'generated_at',
      sortOrder = 'DESC'
    } = options;

    // Build where clause
    const whereConditions = ['user_id = ?'];
    const whereParams = [userId];
    
    if (!includeArchived) {
      whereConditions.push('is_archived = false');
    }
    
    const whereClause = whereConditions.join(' AND ');

    // Get total count
    const countResult = await this.dbManager.queryOne(`
      SELECT COUNT(*) as total FROM dossiers WHERE ${whereClause}
    `, whereParams);
    
    const total = countResult?.total || 0;

    // Get dossiers with pagination
    const dossiers = await this.dbManager.query(`
      SELECT * FROM dossiers 
      WHERE ${whereClause}
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT ? OFFSET ?
    `, [...whereParams, limit, offset]);

    return {
      dossiers: dossiers || [],
      total,
      hasMore: (offset + limit) < total
    };
  }

  async getUserDossierById(userId: string, dossierId: string): Promise<Dossier | null> {
    return this.dbManager.queryOne(`
      SELECT * FROM dossiers 
      WHERE id = ? AND user_id = ?
    `, [dossierId, userId]);
  }

  // DEV AGENT: Dossier Sharing & Permissions Implementation
  async shareDossier(
    dossierId: string,
    sharedByUserId: string,
    options: {
      sharedWithUserId?: string;
      sharedWithOrganizationId?: string;
      permissionLevel: 'read' | 'comment' | 'export' | 'admin';
      expiresAt?: string;
    }
  ): Promise<DossierShare> {
    const id = uuidv4();
    const now = new Date().toISOString();

    // Verify user owns the dossier or has admin permission
    const dossier = await this.getUserDossierById(sharedByUserId, dossierId);
    if (!dossier) {
      throw new Error('Dossier not found or insufficient permissions');
    }

    const share = await this.dbManager.queryOne(`
      INSERT INTO dossier_shares (
        id, dossier_id, shared_by_user_id, shared_with_user_id, 
        shared_with_organization_id, permission_level, expires_at, 
        created_at, is_active
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING *
    `, [
      id, dossierId, sharedByUserId, options.sharedWithUserId || null,
      options.sharedWithOrganizationId || null, options.permissionLevel,
      options.expiresAt || null, now, true
    ]);

    if (!share) {
      return {
        id,
        dossier_id: dossierId,
        shared_by_user_id: sharedByUserId,
        shared_with_user_id: options.sharedWithUserId ?? null,
        shared_with_organization_id: options.sharedWithOrganizationId ?? null,
        permission_level: options.permissionLevel,
        expires_at: options.expiresAt ?? null,
        created_at: now,
        is_active: true
      };
    }

    return share;
  }

  async getUserDossierPermissions(userId: string, dossierId: string): Promise<DossierPermissions> {
    // Check if user is owner
    const ownedDossier = await this.getUserDossierById(userId, dossierId);
    if (ownedDossier) {
      return {
        can_read: true,
        can_comment: true,
        can_export: true,
        can_share: true,
        can_archive: true,
        is_owner: true
      };
    }

    // Check shared permissions
    const sharedAccess = await this.dbManager.queryOne(`
      SELECT permission_level, expires_at FROM dossier_shares 
      WHERE dossier_id = ? 
        AND (shared_with_user_id = ? OR shared_with_organization_id IN (
          SELECT organization_id FROM users WHERE id = ?
        ))
        AND is_active = true
        AND (expires_at IS NULL OR expires_at > ?)
    `, [dossierId, userId, userId, new Date().toISOString()]);

    if (!sharedAccess) {
      return {
        can_read: false,
        can_comment: false,
        can_export: false,
        can_share: false,
        can_archive: false,
        is_owner: false
      };
    }

    const level = sharedAccess.permission_level;
    return {
      can_read: true,
      can_comment: ['comment', 'export', 'admin'].includes(level),
      can_export: ['export', 'admin'].includes(level),
      can_share: level === 'admin',
      can_archive: level === 'admin',
      is_owner: false
    };
  }

  async getDossierWithPermissions(userId: string, dossierId: string): Promise<{
    dossier: Dossier;
    permissions: DossierPermissions;
    sections?: (IntelligenceSection & { insights: IntelligenceInsight[] })[];
    dataSources?: DataSource[];
  } | null> {
    const permissions = await this.getUserDossierPermissions(userId, dossierId);
    
    if (!permissions.can_read) {
      return null;
    }

    // Get dossier data
    const dossier = permissions.is_owner 
      ? await this.getUserDossierById(userId, dossierId)
      : await this.dbManager.queryOne('SELECT * FROM dossiers WHERE id = ?', [dossierId]);

    if (!dossier) return null;

    // Get full data if user has read permission
    const fullData = await this.getDossierWithSections(dossier.request_id);
    
    const result: {
      dossier: Dossier;
      permissions: DossierPermissions;
      sections?: (IntelligenceSection & { insights: IntelligenceInsight[] })[];
      dataSources?: DataSource[];
    } = {
      dossier: fullData?.dossier || dossier,
      permissions
    };

    if (fullData?.sections) {
      result.sections = fullData.sections;
    }
    
    if (fullData?.dataSources) {
      result.dataSources = fullData.dataSources;
    }

    return result;
  }

  async revokeDossierShare(shareId: string, userId: string): Promise<void> {
    await this.dbManager.execute(`
      UPDATE dossier_shares 
      SET is_active = false 
      WHERE id = ? AND shared_by_user_id = ?
    `, [shareId, userId]);
  }

  async getDossierShares(dossierId: string, ownerId: string): Promise<DossierShare[]> {
    return this.dbManager.query(`
      SELECT ds.*, u1.email as shared_by_email, u2.email as shared_with_email,
             o.name as organization_name
      FROM dossier_shares ds
      LEFT JOIN users u1 ON ds.shared_by_user_id = u1.id
      LEFT JOIN users u2 ON ds.shared_with_user_id = u2.id  
      LEFT JOIN organizations o ON ds.shared_with_organization_id = o.id
      WHERE ds.dossier_id = ? 
        AND ds.shared_by_user_id = ?
        AND ds.is_active = true
      ORDER BY ds.created_at DESC
    `, [dossierId, ownerId]);
  }

  async getSharedDossiers(userId: string): Promise<Dossier[]> {
    return this.dbManager.query(`
      SELECT d.*, ds.permission_level, ds.shared_by_user_id,
             u.email as shared_by_email
      FROM dossiers d
      JOIN dossier_shares ds ON d.id = ds.dossier_id
      LEFT JOIN users u ON ds.shared_by_user_id = u.id
      WHERE (ds.shared_with_user_id = ? OR ds.shared_with_organization_id IN (
        SELECT organization_id FROM users WHERE id = ?
      ))
      AND ds.is_active = true
      AND (ds.expires_at IS NULL OR ds.expires_at > ?)
      ORDER BY ds.created_at DESC
    `, [userId, userId, new Date().toISOString()]);
  }
}