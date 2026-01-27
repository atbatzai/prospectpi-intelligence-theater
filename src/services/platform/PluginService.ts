/**
 * Plugin/Integration Marketplace Service
 * Story 7.5: Integration Marketplace
 */

import { DatabaseManager } from '../../database/DatabaseManager';
import { v4 as uuidv4 } from 'uuid';

export enum PluginCategory {
  DATA_SOURCE = 'data_source',
  CRM = 'crm',
  AUTOMATION = 'automation',
  ANALYTICS = 'analytics',
  NOTIFICATION = 'notification'
}

export interface Plugin {
  id: string;
  name: string;
  description: string;
  category: PluginCategory;
  version: string;
  author: string;
  iconUrl?: string;
  configSchema: any;
  webhookUrl?: string;
  apiEndpoint?: string;
  verified: boolean;
  active: boolean;
  installs: number;
  rating: number;
  createdAt: string;
}

export interface PluginInstallation {
  id: string;
  pluginId: string;
  organizationId: string;
  config: any;
  enabled: boolean;
  installedAt: string;
}

class PluginService {
  private dbManager: DatabaseManager;

  constructor() {
    this.dbManager = DatabaseManager.getInstance();
  }

  async init(): Promise<void> {
    await this.initializeDatabase();
  }

  private async initializeDatabase(): Promise<void> {
    await this.dbManager.execute(`
      CREATE TABLE IF NOT EXISTS plugins (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        category TEXT NOT NULL,
        version TEXT NOT NULL,
        author TEXT NOT NULL,
        icon_url TEXT,
        config_schema TEXT NOT NULL,
        webhook_url TEXT,
        api_endpoint TEXT,
        verified BOOLEAN DEFAULT 0,
        active BOOLEAN DEFAULT 1,
        installs INTEGER DEFAULT 0,
        rating REAL DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await this.dbManager.execute(`
      CREATE TABLE IF NOT EXISTS plugin_installations (
        id TEXT PRIMARY KEY,
        plugin_id TEXT NOT NULL,
        organization_id TEXT NOT NULL,
        config TEXT NOT NULL,
        enabled BOOLEAN DEFAULT 1,
        installed_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (plugin_id) REFERENCES plugins(id) ON DELETE CASCADE,
        FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
        UNIQUE(plugin_id, organization_id)
      )
    `);

    await this.dbManager.execute('CREATE INDEX IF NOT EXISTS idx_plugins_category ON plugins(category)');
    await this.dbManager.execute('CREATE INDEX IF NOT EXISTS idx_installations_org ON plugin_installations(organization_id)');

    // Seed with default plugins
    await this.seedDefaultPlugins();
  }

  private async seedDefaultPlugins(): Promise<void> {
    const existingPlugins = await this.dbManager.get('SELECT COUNT(*) as count FROM plugins');
    
    if (existingPlugins?.count > 0) return;

    const defaultPlugins = [
      {
        id: 'plugin_slack_notifications',
        name: 'Slack Notifications',
        description: 'Send dossier completion notifications to Slack channels',
        category: PluginCategory.NOTIFICATION,
        version: '1.0.0',
        author: 'ProspectPI',
        configSchema: JSON.stringify({
          webhookUrl: { type: 'string', required: true, label: 'Slack Webhook URL' },
          channel: { type: 'string', required: false, label: 'Default Channel' }
        }),
        verified: true
      },
      {
        id: 'plugin_zapier',
        name: 'Zapier Integration',
        description: 'Connect ProspectPI to 5000+ apps via Zapier',
        category: PluginCategory.AUTOMATION,
        version: '1.0.0',
        author: 'ProspectPI',
        configSchema: JSON.stringify({
          apiKey: { type: 'string', required: true, label: 'Zapier API Key' }
        }),
        verified: true
      },
      {
        id: 'plugin_google_sheets',
        name: 'Google Sheets Export',
        description: 'Automatically export dossiers to Google Sheets',
        category: PluginCategory.ANALYTICS,
        version: '1.0.0',
        author: 'ProspectPI',
        configSchema: JSON.stringify({
          spreadsheetId: { type: 'string', required: true, label: 'Spreadsheet ID' },
          sheetName: { type: 'string', required: false, label: 'Sheet Name' }
        }),
        verified: true
      }
    ];

    for (const plugin of defaultPlugins) {
      await this.dbManager.execute(`
        INSERT OR IGNORE INTO plugins (
          id, name, description, category, version, author, config_schema, verified
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        plugin.id,
        plugin.name,
        plugin.description,
        plugin.category,
        plugin.version,
        plugin.author,
        plugin.configSchema,
        plugin.verified ? 1 : 0
      ]);
    }
  }

  async listPlugins(category?: PluginCategory): Promise<Plugin[]> {
    const query = category
      ? 'SELECT * FROM plugins WHERE active = 1 AND category = ? ORDER BY installs DESC'
      : 'SELECT * FROM plugins WHERE active = 1 ORDER BY installs DESC';

    const params = category ? [category] : [];
    const rows = await this.dbManager.all(query, params);

    return rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      category: row.category as PluginCategory,
      version: row.version,
      author: row.author,
      ...(row.icon_url ? { iconUrl: row.icon_url } : {}),
      configSchema: JSON.parse(row.config_schema),
      ...(row.webhook_url ? { webhookUrl: row.webhook_url } : {}),
      ...(row.api_endpoint ? { apiEndpoint: row.api_endpoint } : {}),
      verified: row.verified === 1,
      active: row.active === 1,
      installs: row.installs,
      rating: row.rating,
      createdAt: row.created_at
    }));
  }

  async installPlugin(
    pluginId: string,
    organizationId: string,
    config: any
  ): Promise<PluginInstallation> {
    const id = uuidv4();
    const now = new Date().toISOString();

    await this.dbManager.execute(`
      INSERT INTO plugin_installations (id, plugin_id, organization_id, config)
      VALUES (?, ?, ?, ?)
    `, [id, pluginId, organizationId, JSON.stringify(config)]);

    // Increment install count
    await this.dbManager.execute(
      'UPDATE plugins SET installs = installs + 1 WHERE id = ?',
      [pluginId]
    );

    return {
      id,
      pluginId,
      organizationId,
      config,
      enabled: true,
      installedAt: now
    };
  }

  async listInstallations(organizationId: string): Promise<PluginInstallation[]> {
    const rows = await this.dbManager.all(`
      SELECT pi.*, p.name, p.category
      FROM plugin_installations pi
      JOIN plugins p ON pi.plugin_id = p.id
      WHERE pi.organization_id = ?
      ORDER BY pi.installed_at DESC
    `, [organizationId]);

    return rows.map((row: any) => ({
      id: row.id,
      pluginId: row.plugin_id,
      organizationId: row.organization_id,
      config: JSON.parse(row.config),
      enabled: row.enabled === 1,
      installedAt: row.installed_at
    }));
  }

  async uninstallPlugin(installationId: string, organizationId: string): Promise<void> {
    await this.dbManager.execute(
      'DELETE FROM plugin_installations WHERE id = ? AND organization_id = ?',
      [installationId, organizationId]
    );
  }
}

export const pluginService = new PluginService();
