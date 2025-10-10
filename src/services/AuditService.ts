/**
 * ProspectPI Intelligence Theater - Audit Service
 * Story 1.4: Database Schema & User Management
 */

import { v4 as uuidv4 } from 'uuid';
import { DatabaseManager } from '../database/DatabaseManager';

export interface AuditLogEntry {
  id: string;
  user_id?: string | null;
  action: string;
  resource_type: string;
  resource_id?: string | null;
  details?: any | null;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at: string;
}

export interface APIUsageEntry {
  id: string;
  user_id: string;
  organization_id: string;
  request_id?: string | null;
  endpoint: string;
  method: string;
  status_code: number;
  processing_time_ms?: number | null;
  created_at: string;
  ip_address?: string | null;
  user_agent?: string | null;
  request_size_bytes?: number | null;
  response_size_bytes?: number | null;
}

export class AuditService {
  private dbManager = DatabaseManager.getInstance();

  async logAction(
    action: string,
    resourceType: string,
    userId?: string,
    resourceId?: string,
    details?: any,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuditLogEntry> {
    const id = uuidv4();
    const now = new Date().toISOString();

    const entry = await this.dbManager.queryOne(`
      INSERT INTO audit_log (
        id, user_id, action, resource_type, resource_id,
        details, ip_address, user_agent, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING *
    `, [
      id, userId || null, action, resourceType, resourceId || null,
      details ? JSON.stringify(details) : null,
      ipAddress || null, userAgent || null, now
    ]);

    if (!entry) {
      // SQLite fallback
      return {
        id,
        user_id: userId || null,
        action,
        resource_type: resourceType,
        resource_id: resourceId || null,
        details: details || null,
        ip_address: ipAddress || null,
        user_agent: userAgent || null,
        created_at: now
      };
    }

    return entry;
  }

  async logAPIUsage(
    userId: string,
    organizationId: string,
    endpoint: string,
    method: string,
    statusCode: number,
    processingTimeMs?: number,
    requestId?: string,
    ipAddress?: string,
    userAgent?: string,
    requestSizeBytes?: number,
    responseSizeBytes?: number
  ): Promise<APIUsageEntry> {
    const id = uuidv4();
    const now = new Date().toISOString();

    const entry = await this.dbManager.queryOne(`
      INSERT INTO api_usage (
        id, user_id, organization_id, request_id, endpoint, method,
        status_code, processing_time_ms, created_at, ip_address,
        user_agent, request_size_bytes, response_size_bytes
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING *
    `, [
      id, userId, organizationId, requestId || null, endpoint, method,
      statusCode, processingTimeMs || null, now, ipAddress || null,
      userAgent || null, requestSizeBytes || null, responseSizeBytes || null
    ]);

    if (!entry) {
      // SQLite fallback
      return {
        id,
        user_id: userId,
        organization_id: organizationId,
        request_id: requestId || null,
        endpoint,
        method,
        status_code: statusCode,
        processing_time_ms: processingTimeMs || null,
        created_at: now,
        ip_address: ipAddress || null,
        user_agent: userAgent || null,
        request_size_bytes: requestSizeBytes || null,
        response_size_bytes: responseSizeBytes || null
      };
    }

    return entry;
  }

  async getUserActivity(userId: string, limit: number = 50): Promise<AuditLogEntry[]> {
    return this.dbManager.query(`
      SELECT * FROM audit_log 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT ?
    `, [userId, limit]);
  }

  async getAPIUsageStats(
    organizationId: string,
    startDate?: string,
    endDate?: string
  ): Promise<{
    total_requests: number;
    average_response_time: number;
    success_rate: number;
    total_data_transferred: number;
  }> {
    let whereClause = 'WHERE organization_id = ?';
    const params: any[] = [organizationId];

    if (startDate) {
      whereClause += ' AND created_at >= ?';
      params.push(startDate);
    }

    if (endDate) {
      whereClause += ' AND created_at <= ?';
      params.push(endDate);
    }

    const stats = await this.dbManager.queryOne(`
      SELECT 
        COUNT(*) as total_requests,
        AVG(processing_time_ms) as average_response_time,
        (COUNT(CASE WHEN status_code < 400 THEN 1 END) * 100.0 / COUNT(*)) as success_rate,
        SUM(COALESCE(request_size_bytes, 0) + COALESCE(response_size_bytes, 0)) as total_data_transferred
      FROM api_usage
      ${whereClause}
    `, params);

    return {
      total_requests: parseInt(stats.total_requests) || 0,
      average_response_time: parseFloat(stats.average_response_time) || 0,
      success_rate: parseFloat(stats.success_rate) || 0,
      total_data_transferred: parseInt(stats.total_data_transferred) || 0
    };
  }

  async getSystemActivity(limit: number = 100): Promise<AuditLogEntry[]> {
    return this.dbManager.query(`
      SELECT * FROM audit_log 
      ORDER BY created_at DESC 
      LIMIT ?
    `, [limit]);
  }

  async cleanupOldAuditLogs(daysToKeep: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await this.dbManager.execute(
      'DELETE FROM audit_log WHERE created_at < ?',
      [cutoffDate.toISOString()]
    );

    return result.changes || result.rowCount || 0;
  }
}