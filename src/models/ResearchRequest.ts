/**
 * ProspectPI Intelligence Theater - Research Request Model
 * Story 1.4: Database Schema & User Management
 */

import { v4 as uuidv4 } from 'uuid';
import { DatabaseManager } from '../database/DatabaseManager';
import { ProspectResearchInput } from '@interfaces/AgentTypes';

export interface ResearchRequest {
  id: string;
  request_id: string;
  user_id: string;
  organization_id: string;
  company_name: string;
  company_url?: string | null;
  linkedin_url?: string | null;
  crm_notes?: string | null;
  organization_focus?: string | null;
  location_of_interest?: string | null;
  context_links?: any | null; // JSON object or string
  additional_context?: string | null;
  status: 'processing' | 'complete' | 'error' | 'pending' | 'cancelled';
  priority: 'standard' | 'high' | 'urgent';
  created_at: string;
  started_at?: string | null;
  completed_at?: string | null;
  estimated_completion?: number | null;
  actual_processing_time?: number | null;
  error_message?: string | null;
  retry_count: number;
}

export interface AgentProgress {
  id: string;
  request_id: string;
  agent: string;
  stage: string;
  message: string;
  confidence?: number | null;
  estimated_time_remaining?: number | null;
  data_sources_active?: any | null;
  insights_discovered: number;
  created_at: string;
}

export class ResearchRequestService {
  private dbManager = DatabaseManager.getInstance();

  async createRequest(
    input: ProspectResearchInput, 
    userId: string, 
    organizationId: string,
    requestId: string,
    priority: 'standard' | 'high' | 'urgent' = 'standard'
  ): Promise<ResearchRequest> {
    const id = uuidv4();
    const now = new Date().toISOString();

    const request = await this.dbManager.queryOne(`
      INSERT INTO research_requests (
        id, request_id, user_id, organization_id, company_name, company_url,
        crm_notes, organization_focus, location_of_interest, context_links,
        additional_context, status, priority, created_at, estimated_completion, retry_count
      ) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING *
    `, [
      id, requestId, userId, organizationId,
      input.companyName,
      input.companyUrl || null,
      input.crmNotes || null,
      input.organizationFocus || null,
      input.locationOfInterest || null,
      input.contextLinks ? JSON.stringify(input.contextLinks) : null,
      input.additionalContext || null,
      'processing',
      priority,
      now,
      480, // 8 minutes
      0
    ]);

    if (!request) {
      // SQLite fallback
      return {
        id,
        request_id: requestId,
        user_id: userId,
        organization_id: organizationId,
        company_name: input.companyName,
        company_url: input.companyUrl || null,
        crm_notes: input.crmNotes || null,
        organization_focus: input.organizationFocus || null,
        location_of_interest: input.locationOfInterest || null,
        context_links: input.contextLinks || null,
        additional_context: input.additionalContext || null,
        status: 'processing',
        priority,
        created_at: now,
        estimated_completion: 480,
        retry_count: 0
      };
    }

    return request;
  }

  async updateStatus(
    requestId: string, 
    status: 'processing' | 'complete' | 'error' | 'pending' | 'cancelled', 
    errorMessage?: string,
    actualProcessingTime?: number
  ): Promise<void> {
    const updates: string[] = ['status = ?'];
    const values: any[] = [status];

    if (status !== 'processing' && status !== 'pending') {
      updates.push('completed_at = ?');
      values.push(new Date().toISOString());
    }

    if (status === 'processing' && !actualProcessingTime) {
      updates.push('started_at = ?');
      values.push(new Date().toISOString());
    }

    if (errorMessage) {
      updates.push('error_message = ?');
      values.push(errorMessage);
    }

    if (actualProcessingTime) {
      updates.push('actual_processing_time = ?');
      values.push(actualProcessingTime);
    }

    values.push(requestId);

    await this.dbManager.execute(`
      UPDATE research_requests 
      SET ${updates.join(', ')}
      WHERE request_id = ?
    `, values);
  }

  async incrementRetryCount(requestId: string): Promise<void> {
    await this.dbManager.execute(
      'UPDATE research_requests SET retry_count = retry_count + 1 WHERE request_id = ?',
      [requestId]
    );
  }

  async getRequestById(requestId: string): Promise<ResearchRequest | null> {
    return this.dbManager.queryOne('SELECT * FROM research_requests WHERE request_id = ?', [requestId]);
  }

  async getUserRequests(userId: string): Promise<ResearchRequest[]> {
    return this.dbManager.query(`
      SELECT * FROM research_requests 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `, [userId]);
  }

  async getOrganizationRequests(organizationId: string): Promise<ResearchRequest[]> {
    return this.dbManager.query(`
      SELECT * FROM research_requests 
      WHERE organization_id = ? 
      ORDER BY created_at DESC
    `, [organizationId]);
  }

  async getRequestsByStatus(status: string): Promise<ResearchRequest[]> {
    return this.dbManager.query(
      'SELECT * FROM research_requests WHERE status = ? ORDER BY created_at DESC',
      [status]
    );
  }

  // Agent Progress tracking
  async addAgentProgress(progress: Omit<AgentProgress, 'id' | 'created_at'>): Promise<AgentProgress> {
    const id = uuidv4();
    const now = new Date().toISOString();

    const result = await this.dbManager.queryOne(`
      INSERT INTO agent_progress (
        id, request_id, agent, stage, message, confidence, 
        estimated_time_remaining, data_sources_active, insights_discovered, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING *
    `, [
      id, progress.request_id, progress.agent, progress.stage, progress.message,
      progress.confidence || null,
      progress.estimated_time_remaining || null,
      progress.data_sources_active ? JSON.stringify(progress.data_sources_active) : null,
      progress.insights_discovered,
      now
    ]);

    if (!result) {
      // SQLite fallback
      return {
        id,
        request_id: progress.request_id,
        agent: progress.agent,
        stage: progress.stage,
        message: progress.message,
        confidence: progress.confidence || null,
        estimated_time_remaining: progress.estimated_time_remaining || null,
        data_sources_active: progress.data_sources_active || null,
        insights_discovered: progress.insights_discovered,
        created_at: now
      };
    }

    return result;
  }

  async getRequestProgress(requestId: string): Promise<AgentProgress[]> {
    return this.dbManager.query(
      'SELECT * FROM agent_progress WHERE request_id = ? ORDER BY created_at ASC',
      [requestId]
    );
  }
}