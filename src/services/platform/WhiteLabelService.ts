/**
 * White-Label Platform Service
 * Story 7.4: White-Label Platform
 */

import { DatabaseManager } from '../../database/DatabaseManager';
import { v4 as uuidv4 } from 'uuid';

export interface BrandingConfig {
  id: string;
  organizationId: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  companyName: string;
  subdomain?: string;
  customDomain?: string;
  emailTemplates: EmailTemplateConfig;
  favicon?: string;
  enabled: boolean;
  createdAt: string;
}

export interface EmailTemplateConfig {
  welcomeEmail?: string;
  dossierCompleteEmail?: string;
  reportEmail?: string;
  fromName?: string;
  fromEmail?: string;
}

class WhiteLabelService {
  private dbManager: DatabaseManager;

  constructor() {
    this.dbManager = DatabaseManager.getInstance();
  }

  async init(): Promise<void> {
    await this.initializeDatabase();
  }

  private async initializeDatabase(): Promise<void> {
    await this.dbManager.execute(`
      CREATE TABLE IF NOT EXISTS branding_configs (
        id TEXT PRIMARY KEY,
        organization_id TEXT NOT NULL UNIQUE,
        logo_url TEXT,
        primary_color TEXT DEFAULT '#3B82F6',
        secondary_color TEXT DEFAULT '#1E40AF',
        accent_color TEXT DEFAULT '#10B981',
        company_name TEXT NOT NULL,
        subdomain TEXT,
        custom_domain TEXT,
        email_templates TEXT,
        favicon TEXT,
        enabled BOOLEAN DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
      )
    `);

    await this.dbManager.execute('CREATE INDEX IF NOT EXISTS idx_branding_org ON branding_configs(organization_id)');
    await this.dbManager.execute('CREATE INDEX IF NOT EXISTS idx_branding_subdomain ON branding_configs(subdomain)');
  }

  async createBranding(
    organizationId: string,
    companyName: string,
    config: Partial<BrandingConfig>
  ): Promise<BrandingConfig> {
    await this.initializeDatabase();

    const id = uuidv4();
    const now = new Date().toISOString();

    const emailTemplates = config.emailTemplates || {
      fromName: companyName,
      fromEmail: 'noreply@prospectpi.com'
    };

    await this.dbManager.execute(`
      INSERT INTO branding_configs (
        id, organization_id, company_name, logo_url, primary_color, 
        secondary_color, accent_color, subdomain, custom_domain, 
        email_templates, favicon
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      organizationId,
      companyName,
      config.logoUrl || null,
      config.primaryColor || '#3B82F6',
      config.secondaryColor || '#1E40AF',
      config.accentColor || '#10B981',
      config.subdomain || null,
      config.customDomain || null,
      JSON.stringify(emailTemplates),
      config.favicon || null
    ]);

    return {
      id,
      organizationId,
      companyName,
      primaryColor: config.primaryColor || '#3B82F6',
      secondaryColor: config.secondaryColor || '#1E40AF',
      accentColor: config.accentColor || '#10B981',
      emailTemplates,
      enabled: true,
      createdAt: now,
      ...(config.logoUrl ? { logoUrl: config.logoUrl } : {}),
      ...(config.subdomain ? { subdomain: config.subdomain } : {}),
      ...(config.customDomain ? { customDomain: config.customDomain } : {}),
      ...(config.favicon ? { favicon: config.favicon } : {})
    };
  }

  async getBranding(organizationId: string): Promise<BrandingConfig | null> {
    const row = await this.dbManager.get(
      'SELECT * FROM branding_configs WHERE organization_id = ?',
      [organizationId]
    );

    if (!row) return null;

    return {
      id: row.id,
      organizationId: row.organization_id,
      companyName: row.company_name,
      primaryColor: row.primary_color,
      secondaryColor: row.secondary_color,
      accentColor: row.accent_color,
      emailTemplates: JSON.parse(row.email_templates),
      enabled: row.enabled === 1,
      createdAt: row.created_at,
      ...(row.logo_url ? { logoUrl: row.logo_url } : {}),
      ...(row.subdomain ? { subdomain: row.subdomain } : {}),
      ...(row.custom_domain ? { customDomain: row.custom_domain } : {}),
      ...(row.favicon ? { favicon: row.favicon } : {})
    };
  }

  async updateBranding(
    organizationId: string,
    updates: Partial<BrandingConfig>
  ): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.logoUrl !== undefined) {
      fields.push('logo_url = ?');
      values.push(updates.logoUrl);
    }
    if (updates.primaryColor) {
      fields.push('primary_color = ?');
      values.push(updates.primaryColor);
    }
    if (updates.secondaryColor) {
      fields.push('secondary_color = ?');
      values.push(updates.secondaryColor);
    }
    if (updates.accentColor) {
      fields.push('accent_color = ?');
      values.push(updates.accentColor);
    }
    if (updates.subdomain !== undefined) {
      fields.push('subdomain = ?');
      values.push(updates.subdomain);
    }
    if (updates.customDomain !== undefined) {
      fields.push('custom_domain = ?');
      values.push(updates.customDomain);
    }
    if (updates.emailTemplates) {
      fields.push('email_templates = ?');
      values.push(JSON.stringify(updates.emailTemplates));
    }

    if (fields.length === 0) return;

    values.push(organizationId);

    await this.dbManager.execute(
      `UPDATE branding_configs SET ${fields.join(', ')} WHERE organization_id = ?`,
      values
    );
  }

  async getBrandingBySubdomain(subdomain: string): Promise<BrandingConfig | null> {
    const row = await this.dbManager.get(
      'SELECT * FROM branding_configs WHERE subdomain = ? AND enabled = 1',
      [subdomain]
    );

    if (!row) return null;

    return {
      id: row.id,
      organizationId: row.organization_id,
      companyName: row.company_name,
      primaryColor: row.primary_color,
      secondaryColor: row.secondary_color,
      accentColor: row.accent_color,
      emailTemplates: JSON.parse(row.email_templates),
      enabled: row.enabled === 1,
      createdAt: row.created_at,
      ...(row.logo_url ? { logoUrl: row.logo_url } : {}),
      ...(row.subdomain ? { subdomain: row.subdomain } : {}),
      ...(row.custom_domain ? { customDomain: row.custom_domain } : {}),
      ...(row.favicon ? { favicon: row.favicon } : {})
    };
  }
}

export const whiteLabelService = new WhiteLabelService();
