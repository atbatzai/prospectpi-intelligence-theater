/**
 * API Key Management Service
 * Story 7.1: Public API - API Key Management
 */

import { DatabaseManager } from '../../database/DatabaseManager';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';
const bcrypt = require('bcrypt');

export interface ApiKey {
  id: string;
  userId: string;
  organizationId: string;
  name: string;
  keyPrefix: string;
  lastUsed?: string;
  expiresAt?: string;
  scopes: string[];
  rateLimit: number;
  enabled: boolean;
  createdAt: string;
}

class ApiKeyService {
  private dbManager: DatabaseManager;

  constructor() {
    this.dbManager = DatabaseManager.getInstance();
  }

  async init(): Promise<void> {
    await this.initializeDatabase();
  }

  private async initializeDatabase(): Promise<void> {
    await this.dbManager.execute(`
      CREATE TABLE IF NOT EXISTS api_keys (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        organization_id TEXT NOT NULL,
        name TEXT NOT NULL,
        key_hash TEXT NOT NULL,
        key_prefix TEXT NOT NULL,
        scopes TEXT NOT NULL,
        rate_limit INTEGER DEFAULT 1000,
        enabled BOOLEAN DEFAULT 1,
        last_used TEXT,
        expires_at TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
      )
    `);

    await this.dbManager.execute('CREATE INDEX IF NOT EXISTS idx_apikeys_user ON api_keys(user_id)');
    await this.dbManager.execute('CREATE INDEX IF NOT EXISTS idx_apikeys_org ON api_keys(organization_id)');
    await this.dbManager.execute('CREATE INDEX IF NOT EXISTS idx_apikeys_prefix ON api_keys(key_prefix)');
  }

  async createApiKey(
    userId: string,
    organizationId: string,
    name: string,
    scopes: string[],
    expiresInDays?: number
  ): Promise<{ apiKey: string; keyData: ApiKey }> {
    await this.initializeDatabase();

    // Generate API key: ppi_live_<random32chars>
    const randomBytes = crypto.randomBytes(24).toString('hex');
    const apiKey = `ppi_live_${randomBytes}`;
    const keyPrefix = apiKey.substring(0, 12); // ppi_live_xxx

    // Hash the API key for storage
    const keyHash = await bcrypt.hash(apiKey, 10);

    // Calculate expiration
    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
      : null;

    const id = uuidv4();
    const now = new Date().toISOString();

    await this.dbManager.execute(`
      INSERT INTO api_keys (id, user_id, organization_id, name, key_hash, key_prefix, scopes, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [id, userId, organizationId, name, keyHash, keyPrefix, JSON.stringify(scopes), expiresAt]);

    const keyData: ApiKey = {
      id,
      userId,
      organizationId,
      name,
      keyPrefix,
      scopes,
      rateLimit: 1000,
      enabled: true,
      ...(expiresAt ? { expiresAt } : {}),
      createdAt: now
    };

    return { apiKey, keyData };
  }

  async validateApiKey(apiKey: string): Promise<ApiKey | null> {
    const keyPrefix = apiKey.substring(0, 12);

    const row = await this.dbManager.get(
      'SELECT * FROM api_keys WHERE key_prefix = ? AND enabled = 1',
      [keyPrefix]
    );

    if (!row) return null;

    // Verify hash
    const isValid = await bcrypt.compare(apiKey, row.key_hash);
    if (!isValid) return null;

    // Check expiration
    if (row.expires_at && new Date(row.expires_at) < new Date()) {
      return null;
    }

    // Update last_used
    await this.dbManager.execute(
      'UPDATE api_keys SET last_used = ? WHERE id = ?',
      [new Date().toISOString(), row.id]
    );

    return {
      id: row.id,
      userId: row.user_id,
      organizationId: row.organization_id,
      name: row.name,
      keyPrefix: row.key_prefix,
      scopes: JSON.parse(row.scopes),
      rateLimit: row.rate_limit,
      enabled: row.enabled === 1,
      lastUsed: row.last_used,
      expiresAt: row.expires_at,
      createdAt: row.created_at
    };
  }

  async listApiKeys(userId: string, organizationId: string): Promise<ApiKey[]> {
    const rows = await this.dbManager.all(
      'SELECT * FROM api_keys WHERE user_id = ? AND organization_id = ? ORDER BY created_at DESC',
      [userId, organizationId]
    );

    return rows.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      organizationId: row.organization_id,
      name: row.name,
      keyPrefix: row.key_prefix,
      scopes: JSON.parse(row.scopes),
      rateLimit: row.rate_limit,
      enabled: row.enabled === 1,
      lastUsed: row.last_used,
      expiresAt: row.expires_at,
      createdAt: row.created_at
    }));
  }

  async revokeApiKey(keyId: string, userId: string): Promise<void> {
    await this.dbManager.execute(
      'UPDATE api_keys SET enabled = 0 WHERE id = ? AND user_id = ?',
      [keyId, userId]
    );
  }

  async deleteApiKey(keyId: string, userId: string): Promise<void> {
    await this.dbManager.execute(
      'DELETE FROM api_keys WHERE id = ? AND user_id = ?',
      [keyId, userId]
    );
  }
}

export const apiKeyService = new ApiKeyService();
