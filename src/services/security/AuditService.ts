/**
 * Audit Logging Service
 * Story 5.2: Security Hardening - Audit Trails
 */

import { DatabaseManager } from '../../database/DatabaseManager';
import { v4 as uuidv4 } from 'uuid';

export enum AuditAction {
  USER_LOGIN = 'user.login',
  USER_LOGOUT = 'user.logout',
  USER_CREATE = 'user.create',
  USER_UPDATE = 'user.update',
  USER_DELETE = 'user.delete',
  ROLE_ASSIGN = 'role.assign',
  ROLE_REVOKE = 'role.revoke',
  DOSSIER_CREATE = 'dossier.create',
  DOSSIER_VIEW = 'dossier.view',
  DOSSIER_DELETE = 'dossier.delete',
  DOSSIER_SHARE = 'dossier.share',
  API_KEY_CREATE = 'apikey.create',
  API_KEY_REVOKE = 'apikey.revoke',
  CONFIG_UPDATE = 'config.update'
}

export enum AuditSeverity {
  INFO = 'info',
  WARNING = 'warning',
  CRITICAL = 'critical'
}

interface AuditLogEntry {
  id: string;
  userId: string;
  organizationId?: string;
  action: AuditAction;
  resourceType: string;
  resourceId?: string;
  severity: AuditSeverity;
  ipAddress?: string;
  userAgent?: string;
  metadata?: any;
  createdAt: string;
}

class AuditService {
  private dbManager: DatabaseManager;

  constructor() {
    this.dbManager = DatabaseManager.getInstance();
  }

  async init(): Promise<void> {
    await this.initializeDatabase();
  }

  private async initializeDatabase(): Promise<void> {
    await this.dbManager.execute(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        organization_id TEXT,
        action TEXT NOT NULL,
        resource_type TEXT NOT NULL,
        resource_id TEXT,
        severity TEXT NOT NULL,
        ip_address TEXT,
        user_agent TEXT,
        metadata TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Index for performance
    await this.dbManager.execute('CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id)');
    await this.dbManager.execute('CREATE INDEX IF NOT EXISTS idx_audit_logs_org ON audit_logs(organization_id)');
    await this.dbManager.execute('CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action)');
    await this.dbManager.execute('CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at)');
  }

  async log(
    userId: string,
    action: AuditAction,
    resourceType: string,
    severity: AuditSeverity = AuditSeverity.INFO,
    options?: {
      resourceId?: string;
      organizationId?: string;
      ipAddress?: string;
      userAgent?: string;
      metadata?: any;
    }
  ): Promise<void> {
    await this.initializeDatabase();

    await this.dbManager.execute(`
      INSERT INTO audit_logs (id, user_id, organization_id, action, resource_type, resource_id, severity, ip_address, user_agent, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      uuidv4(),
      userId,
      options?.organizationId,
      action,
      resourceType,
      options?.resourceId,
      severity,
      options?.ipAddress,
      options?.userAgent,
      options?.metadata ? JSON.stringify(options.metadata) : null
    ]);
  }

  async getAuditLogs(
    userId?: string,
    organizationId?: string,
    action?: AuditAction,
    limit: number = 100
  ): Promise<AuditLogEntry[]> {
    let query = 'SELECT * FROM audit_logs WHERE 1=1';
    const params: any[] = [];

    if (userId) {
      query += ' AND user_id = ?';
      params.push(userId);
    }

    if (organizationId) {
      query += ' AND organization_id = ?';
      params.push(organizationId);
    }

    if (action) {
      query += ' AND action = ?';
      params.push(action);
    }

    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(limit);

    const rows = await this.dbManager.all(query, params);

    return rows.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      organizationId: row.organization_id,
      action: row.action as AuditAction,
      resourceType: row.resource_type,
      resourceId: row.resource_id,
      severity: row.severity as AuditSeverity,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      metadata: row.metadata ? JSON.parse(row.metadata) : null,
      createdAt: row.created_at
    }));
  }

  async getSecurityEvents(organizationId?: string, days: number = 7): Promise<AuditLogEntry[]> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const query = organizationId
      ? `SELECT * FROM audit_logs 
         WHERE organization_id = ? AND severity IN ('warning', 'critical') AND created_at > ?
         ORDER BY created_at DESC`
      : `SELECT * FROM audit_logs 
         WHERE severity IN ('warning', 'critical') AND created_at > ?
         ORDER BY created_at DESC`;

    const params = organizationId ? [organizationId, since] : [since];
    const rows = await this.dbManager.all(query, params);

    return rows.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      organizationId: row.organization_id,
      action: row.action as AuditAction,
      resourceType: row.resource_type,
      resourceId: row.resource_id,
      severity: row.severity as AuditSeverity,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      metadata: row.metadata ? JSON.parse(row.metadata) : null,
      createdAt: row.created_at
    }));
  }
}

export const auditService = new AuditService();
