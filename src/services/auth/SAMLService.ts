/**
 * SAML 2.0 Service for Enterprise SSO
 * Story 5.1: Enterprise Authentication
 */

import { DatabaseManager } from '../../database/DatabaseManager';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';

interface SAMLConfig {
  entityId: string;
  entryPoint: string;
  cert: string;
  issuer: string;
  callbackUrl: string;
}

interface SAMLResponse {
  nameID: string;
  email: string;
  firstName: string | undefined;
  lastName: string | undefined;
  attributes: Record<string, any>;
}

class SAMLService {
  private dbManager: DatabaseManager;
  private samlConfigs: Map<string, SAMLConfig> = new Map();

  constructor() {
    this.dbManager = DatabaseManager.getInstance();
    // Don't call async in constructor - call init() explicitly when needed
  }

  async init(): Promise<void> {
    await this.initializeDatabase();
  }

  private async initializeDatabase(): Promise<void> {
    await this.dbManager.execute(`
      CREATE TABLE IF NOT EXISTS saml_configs (
        id TEXT PRIMARY KEY,
        organization_id TEXT NOT NULL UNIQUE,
        entity_id TEXT NOT NULL,
        entry_point TEXT NOT NULL,
        certificate TEXT NOT NULL,
        issuer TEXT NOT NULL,
        callback_url TEXT NOT NULL,
        enabled BOOLEAN DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
      )
    `);
  }

  async registerSAMLProvider(organizationId: string, config: SAMLConfig): Promise<void> {
    // Ensure table exists
    await this.initializeDatabase();
    
    await this.dbManager.execute(`
      INSERT INTO saml_configs (id, organization_id, entity_id, entry_point, certificate, issuer, callback_url)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT (organization_id) DO UPDATE SET
        entity_id = excluded.entity_id,
        entry_point = excluded.entry_point,
        certificate = excluded.certificate,
        issuer = excluded.issuer,
        callback_url = excluded.callback_url,
        updated_at = CURRENT_TIMESTAMP
    `, [
      uuidv4(),
      organizationId,
      config.entityId,
      config.entryPoint,
      config.cert,
      config.issuer,
      config.callbackUrl
    ]);

    this.samlConfigs.set(organizationId, config);
  }

  async getSAMLConfig(organizationId: string): Promise<SAMLConfig | null> {
    // Check cache first
    if (this.samlConfigs.has(organizationId)) {
      return this.samlConfigs.get(organizationId)!;
    }

    // Fetch from database
    const row = await this.dbManager.get(
      'SELECT * FROM saml_configs WHERE organization_id = ? AND enabled = 1',
      [organizationId]
    );

    if (!row) {
      return null;
    }

    const config: SAMLConfig = {
      entityId: row.entity_id,
      entryPoint: row.entry_point,
      cert: row.certificate,
      issuer: row.issuer,
      callbackUrl: row.callback_url
    };

    this.samlConfigs.set(organizationId, config);
    return config;
  }

  generateSAMLRequest(config: SAMLConfig): string {
    const id = '_' + crypto.randomBytes(16).toString('hex');
    const issueInstant = new Date().toISOString();

    const samlRequest = `
      <samlp:AuthnRequest
        xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
        xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
        ID="${id}"
        Version="2.0"
        IssueInstant="${issueInstant}"
        Destination="${config.entryPoint}"
        AssertionConsumerServiceURL="${config.callbackUrl}"
        ProtocolBinding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST">
        <saml:Issuer>${config.issuer}</saml:Issuer>
      </samlp:AuthnRequest>
    `;

    // Base64 encode the SAML request
    return Buffer.from(samlRequest).toString('base64');
  }

  async verifySAMLResponse(samlResponseB64: string): Promise<SAMLResponse> {
    // Decode base64 SAML response
    const samlResponse = Buffer.from(samlResponseB64, 'base64').toString('utf8');

    // Basic XML parsing (in production, use xml2js or xmldom)
    const emailMatch = samlResponse.match(/<saml:Attribute Name="email"[^>]*>\s*<saml:AttributeValue>([^<]+)<\/saml:AttributeValue>/i);
    const nameIDMatch = samlResponse.match(/<saml:NameID[^>]*>([^<]+)<\/saml:NameID>/i);
    const firstNameMatch = samlResponse.match(/<saml:Attribute Name="firstName"[^>]*>\s*<saml:AttributeValue>([^<]+)<\/saml:AttributeValue>/i);
    const lastNameMatch = samlResponse.match(/<saml:Attribute Name="lastName"[^>]*>\s*<saml:AttributeValue>([^<]+)<\/saml:AttributeValue>/i);

    if (!emailMatch || !nameIDMatch) {
      throw new Error('Invalid SAML response: missing required attributes');
    }

    return {
      nameID: nameIDMatch[1],
      email: emailMatch[1],
      firstName: firstNameMatch?.[1],
      lastName: lastNameMatch?.[1],
      attributes: {}
    };
  }

  async disableSAML(organizationId: string): Promise<void> {
    await this.dbManager.execute(
      'UPDATE saml_configs SET enabled = 0 WHERE organization_id = ?',
      [organizationId]
    );
    this.samlConfigs.delete(organizationId);
  }
}

export const samlService = new SAMLService();
export { SAMLConfig, SAMLResponse };
