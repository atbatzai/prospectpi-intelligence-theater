/**
 * CRM Integration Service
 * Story 7.2: CRM Integrations (Salesforce, HubSpot, Pipedrive)
 */

import { DatabaseManager } from '../../database/DatabaseManager';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

export enum CRMProvider {
  SALESFORCE = 'salesforce',
  HUBSPOT = 'hubspot',
  PIPEDRIVE = 'pipedrive'
}

export interface CRMConnection {
  id: string;
  organizationId: string;
  provider: CRMProvider;
  accessToken: string;
  refreshToken?: string;
  instanceUrl?: string;
  expiresAt?: string;
  enabled: boolean;
  createdAt: string;
}

export interface CRMContact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  title?: string;
}

export interface CRMAccount {
  id: string;
  name: string;
  website?: string;
  industry?: string;
}

class CRMService {
  private dbManager: DatabaseManager;

  constructor() {
    this.dbManager = DatabaseManager.getInstance();
  }

  async init(): Promise<void> {
    await this.initializeDatabase();
  }

  private async initializeDatabase(): Promise<void> {
    await this.dbManager.execute(`
      CREATE TABLE IF NOT EXISTS crm_connections (
        id TEXT PRIMARY KEY,
        organization_id TEXT NOT NULL,
        provider TEXT NOT NULL,
        access_token TEXT NOT NULL,
        refresh_token TEXT,
        instance_url TEXT,
        expires_at TEXT,
        enabled BOOLEAN DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
      )
    `);

    await this.dbManager.execute(`
      CREATE TABLE IF NOT EXISTS crm_sync_log (
        id TEXT PRIMARY KEY,
        connection_id TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        action TEXT NOT NULL,
        status TEXT NOT NULL,
        error_message TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (connection_id) REFERENCES crm_connections(id) ON DELETE CASCADE
      )
    `);

    await this.dbManager.execute('CREATE INDEX IF NOT EXISTS idx_crm_org ON crm_connections(organization_id)');
    await this.dbManager.execute('CREATE INDEX IF NOT EXISTS idx_crm_sync ON crm_sync_log(connection_id)');
  }

  async createConnection(
    organizationId: string,
    provider: CRMProvider,
    accessToken: string,
    refreshToken?: string,
    instanceUrl?: string,
    expiresIn?: number
  ): Promise<CRMConnection> {
    await this.initializeDatabase();

    const id = uuidv4();
    const now = new Date();
    const expiresAt = expiresIn
      ? new Date(now.getTime() + expiresIn * 1000).toISOString()
      : null;

    await this.dbManager.execute(`
      INSERT INTO crm_connections (id, organization_id, provider, access_token, refresh_token, instance_url, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [id, organizationId, provider, accessToken, refreshToken, instanceUrl, expiresAt]);

    return {
      id,
      organizationId,
      provider,
      accessToken,
      ...(refreshToken ? { refreshToken } : {}),
      ...(instanceUrl ? { instanceUrl } : {}),
      ...(expiresAt ? { expiresAt } : {}),
      enabled: true,
      createdAt: now.toISOString()
    };
  }

  async getConnection(organizationId: string, provider: CRMProvider): Promise<CRMConnection | null> {
    const row = await this.dbManager.get(
      'SELECT * FROM crm_connections WHERE organization_id = ? AND provider = ? AND enabled = 1',
      [organizationId, provider]
    );

    if (!row) return null;

    return {
      id: row.id,
      organizationId: row.organization_id,
      provider: row.provider as CRMProvider,
      accessToken: row.access_token,
      refreshToken: row.refresh_token,
      instanceUrl: row.instance_url,
      expiresAt: row.expires_at,
      enabled: row.enabled === 1,
      createdAt: row.created_at
    };
  }

  async syncDossierToCRM(
    connectionId: string,
    provider: CRMProvider,
    dossier: any
  ): Promise<{ success: boolean; crmId?: string; error?: string }> {
    try {
      const connection = await this.dbManager.get(
        'SELECT * FROM crm_connections WHERE id = ? AND enabled = 1',
        [connectionId]
      );

      if (!connection) {
        throw new Error('CRM connection not found or disabled');
      }

      let crmId: string | undefined;

      switch (provider) {
        case CRMProvider.SALESFORCE:
          crmId = await this.syncToSalesforce(connection, dossier);
          break;
        case CRMProvider.HUBSPOT:
          crmId = await this.syncToHubSpot(connection, dossier);
          break;
        case CRMProvider.PIPEDRIVE:
          crmId = await this.syncToPipedrive(connection, dossier);
          break;
        default:
          throw new Error(`Unsupported CRM provider: ${provider}`);
      }

      // Log successful sync
      await this.logSync(connectionId, 'account', dossier.id, 'create', 'success');

      return { success: true, crmId };
    } catch (error: any) {
      // Log failed sync
      await this.logSync(connectionId, 'account', dossier.id, 'create', 'failed', error.message);
      return { success: false, error: error.message };
    }
  }

  private async syncToSalesforce(connection: any, dossier: any): Promise<string> {
    // Salesforce API integration
    const response = await axios.post(
      `${connection.instance_url}/services/data/v57.0/sobjects/Account`,
      {
        Name: dossier.company_name,
        Website: dossier.website_url,
        Industry: dossier.sections?.company_overview?.industry,
        Description: `ProspectPI Intelligence Dossier\n\nKey Insights:\n${JSON.stringify(dossier.sections?.deal_winning_intelligence || {})}`
      },
      {
        headers: {
          'Authorization': `Bearer ${connection.access_token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.id;
  }

  private async syncToHubSpot(connection: any, dossier: any): Promise<string> {
    // HubSpot API integration
    const response = await axios.post(
      'https://api.hubapi.com/crm/v3/objects/companies',
      {
        properties: {
          name: dossier.company_name,
          domain: dossier.website_url,
          industry: dossier.sections?.company_overview?.industry,
          description: `ProspectPI Intelligence Dossier - ${dossier.id}`
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${connection.access_token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.id;
  }

  private async syncToPipedrive(connection: any, dossier: any): Promise<string> {
    // Pipedrive API integration
    const response = await axios.post(
      `${connection.instance_url}/v1/organizations`,
      {
        name: dossier.company_name,
        owner_id: null, // Set based on organization settings
        visible_to: 3 // Entire company
      },
      {
        params: {
          api_token: connection.access_token
        }
      }
    );

    return response.data.data.id.toString();
  }

  private async logSync(
    connectionId: string,
    entityType: string,
    entityId: string,
    action: string,
    status: string,
    errorMessage?: string
  ): Promise<void> {
    await this.dbManager.execute(`
      INSERT INTO crm_sync_log (id, connection_id, entity_type, entity_id, action, status, error_message)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [uuidv4(), connectionId, entityType, entityId, action, status, errorMessage || null]);
  }

  async getSyncHistory(connectionId: string, limit: number = 50): Promise<any[]> {
    const rows = await this.dbManager.all(
      'SELECT * FROM crm_sync_log WHERE connection_id = ? ORDER BY created_at DESC LIMIT ?',
      [connectionId, limit]
    );

    return rows;
  }
}

export const crmService = new CRMService();
