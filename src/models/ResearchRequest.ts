/**
 * ProspectPI Intelligence Theater - Research Request Model
 * Story 1.2: REST API Endpoints & Request Handling
 */

import { v4 as uuidv4 } from 'uuid';
import { DatabaseManager } from '../database/DatabaseManager';
import { ProspectResearchInput } from '@interfaces/AgentTypes';

export interface ResearchRequest {
  id: string;
  request_id: string;
  user_id: string;
  company_name: string;
  company_url?: string | undefined;
  linkedin_url?: string | undefined;
  crm_notes?: string | undefined;
  organization_focus?: string | undefined;
  location_of_interest?: string | undefined;
  context_links?: string | undefined; // JSON string
  additional_context?: string | undefined;
  status: 'processing' | 'complete' | 'error';
  created_at: string;
  completed_at?: string | undefined;
  estimated_completion?: number | undefined;
  error_message?: string | undefined;
}

export class ResearchRequestService {
  private db = DatabaseManager.getInstance().getDatabase();

  async createRequest(
    input: ProspectResearchInput, 
    userId: string, 
    requestId: string
  ): Promise<ResearchRequest> {
    const id = uuidv4();
    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO research_requests (
        id, request_id, user_id, company_name, company_url, linkedin_url,
        crm_notes, organization_focus, location_of_interest, context_links,
        additional_context, status, created_at, estimated_completion
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run([
      id,
      requestId,
      userId,
      input.companyName,
      input.companyUrl || null,
      input.linkedinUrl || null,
      input.crmNotes || null,
      input.organizationFocus || null,
      input.locationOfInterest || null,
      input.contextLinks ? JSON.stringify(input.contextLinks) : null,
      input.additionalContext || null,
      'processing',
      now,
      480 // 8 minutes
    ]);

    stmt.finalize();

    return {
      id,
      request_id: requestId,
      user_id: userId,
      company_name: input.companyName,
      company_url: input.companyUrl,
      linkedin_url: input.linkedinUrl,
      crm_notes: input.crmNotes,
      organization_focus: input.organizationFocus,
      location_of_interest: input.locationOfInterest,
      context_links: input.contextLinks ? JSON.stringify(input.contextLinks) : undefined,
      additional_context: input.additionalContext,
      status: 'processing',
      created_at: now,
      estimated_completion: 480
    };
  }

  async updateStatus(
    requestId: string, 
    status: 'processing' | 'complete' | 'error', 
    errorMessage?: string
  ): Promise<void> {
    const stmt = this.db.prepare(`
      UPDATE research_requests 
      SET status = ?, completed_at = ?, error_message = ?
      WHERE request_id = ?
    `);

    const completedAt = status !== 'processing' ? new Date().toISOString() : null;
    stmt.run([status, completedAt, errorMessage || null, requestId]);
    stmt.finalize();
  }

  async getRequestById(requestId: string): Promise<ResearchRequest | null> {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare('SELECT * FROM research_requests WHERE request_id = ?');
      
      stmt.get([requestId], (err: Error | null, row: ResearchRequest) => {
        stmt.finalize();
        if (err) {
          reject(err);
        } else {
          resolve(row || null);
        }
      });
    });
  }

  async getUserRequests(userId: string): Promise<ResearchRequest[]> {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        SELECT * FROM research_requests 
        WHERE user_id = ? 
        ORDER BY created_at DESC
      `);
      
      stmt.all([userId], (err: Error | null, rows: ResearchRequest[]) => {
        stmt.finalize();
        if (err) {
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  }
}