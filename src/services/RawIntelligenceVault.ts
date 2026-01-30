/**
 * ProspectPI Intelligence Theater - Raw Intelligence Vault
 * 
 * PURPOSE: Store 100% of raw data from each source BEFORE detective synthesis.
 * This allows users to:
 * 1. See exactly what each source returned
 * 2. Review raw intelligence before dossier generation
 * 3. Guide the Detective with knowledge of what data is available
 * 
 * ARCHITECTURE:
 *   FieldResearcher → RawIntelligenceVault (per-source storage)
 *                           ↓
 *              User reviews raw data by source
 *                           ↓
 *              Detective synthesizes with user guidance
 */

import { DatabaseManager } from '../database/DatabaseManager';
import { ResearchData } from '../interfaces/AgentTypes';
import { v4 as uuidv4 } from 'uuid';

// Raw intelligence record as stored in database
export interface RawIntelligenceRecord {
  id: string;
  requestId: string;
  source: string;
  rawData: any;           // 100% unmodified source response
  dataSize: number;       // Size in bytes for monitoring
  confidence: number;
  apiCost: number;
  responseTimeMs: number;
  fetchedAt: Date;
  status: 'success' | 'partial' | 'error' | 'timeout';
  errorMessage?: string;
  metadata: {
    endpoint?: string;
    queryParams?: any;
    headers?: any;
    rateLimitRemaining?: number;
    paginationInfo?: any;
  };
}

// Summary of all sources for a request
export interface IntelligenceSummary {
  requestId: string;
  companyName: string;
  totalSources: number;
  successfulSources: number;
  failedSources: number;
  totalDataSize: number;
  totalCost: number;
  sources: SourceSummary[];
  collectedAt: Date;
  readyForSynthesis: boolean;
}

export interface SourceSummary {
  source: string;
  status: 'success' | 'partial' | 'error' | 'timeout';
  dataSize: number;
  confidence: number;
  cost: number;
  responseTimeMs: number;
  recordCount?: number;    // If data is an array, how many items
  keyFields?: string[];    // Top-level fields in the data
  previewSnippet?: string; // First 500 chars of JSON for quick preview
}

export class RawIntelligenceVault {
  private static instance: RawIntelligenceVault;
  private dbManager: DatabaseManager;

  private constructor() {
    this.dbManager = DatabaseManager.getInstance();
  }

  public static getInstance(): RawIntelligenceVault {
    if (!RawIntelligenceVault.instance) {
      RawIntelligenceVault.instance = new RawIntelligenceVault();
    }
    return RawIntelligenceVault.instance;
  }

  /**
   * Initialize the raw_intelligence table
   */
  public async initialize(): Promise<void> {
    console.log('📦 Initializing Raw Intelligence Vault...');
    await this.createTable();
    console.log('✅ Raw Intelligence Vault ready');
  }

  private async createTable(): Promise<void> {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS raw_intelligence (
        id TEXT PRIMARY KEY,
        request_id TEXT NOT NULL,
        source TEXT NOT NULL,
        raw_data TEXT NOT NULL,
        data_size INTEGER NOT NULL,
        confidence REAL NOT NULL,
        api_cost REAL NOT NULL,
        response_time_ms INTEGER,
        fetched_at TEXT NOT NULL,
        status TEXT NOT NULL,
        error_message TEXT,
        metadata TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(request_id, source)
      )
    `;

    const createIndexSQL = `
      CREATE INDEX IF NOT EXISTS idx_raw_intelligence_request 
      ON raw_intelligence(request_id)
    `;

    await this.dbManager.run(createTableSQL);
    await this.dbManager.run(createIndexSQL);
  }

  /**
   * Store raw intelligence from a single source
   * Called by FieldIntelligenceResearcher after each API call
   */
  public async storeRawIntelligence(
    requestId: string,
    researchData: ResearchData,
    metadata?: RawIntelligenceRecord['metadata']
  ): Promise<string> {
    const id = uuidv4();
    const rawDataJson = JSON.stringify(researchData.data, null, 2);
    const dataSize = Buffer.byteLength(rawDataJson, 'utf8');

    // Determine status based on data content
    let status: RawIntelligenceRecord['status'] = 'success';
    let errorMessage: string | undefined;

    if (researchData.data?.error) {
      status = 'error';
      errorMessage = researchData.data.error;
    } else if (researchData.data?.status === 'unavailable') {
      status = 'error';
      errorMessage = researchData.data.note || 'Source unavailable';
    } else if (researchData.confidence < 0.3) {
      status = 'partial';
    }

    const sql = `
      INSERT OR REPLACE INTO raw_intelligence 
      (id, request_id, source, raw_data, data_size, confidence, api_cost, 
       response_time_ms, fetched_at, status, error_message, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await this.dbManager.run(sql, [
      id,
      requestId,
      researchData.source,
      rawDataJson,
      dataSize,
      researchData.confidence,
      researchData.cost,
      researchData.responseTime || 0,
      researchData.timestamp.toISOString(),
      status,
      errorMessage || null,
      metadata ? JSON.stringify(metadata) : null
    ]);

    console.log(`📦 Stored raw intelligence: ${researchData.source} (${(dataSize / 1024).toFixed(1)}KB, confidence: ${(researchData.confidence * 100).toFixed(0)}%)`);

    return id;
  }

  /**
   * Store all research data from a completed research run
   */
  public async storeAllIntelligence(
    requestId: string,
    allResearchData: ResearchData[]
  ): Promise<{ stored: number; failed: number }> {
    let stored = 0;
    let failed = 0;

    for (const data of allResearchData) {
      try {
        await this.storeRawIntelligence(requestId, data);
        stored++;
      } catch (error: any) {
        console.error(`Failed to store ${data.source}: ${error.message}`);
        failed++;
      }
    }

    console.log(`📦 Vault storage complete: ${stored} sources stored, ${failed} failed`);
    return { stored, failed };
  }

  /**
   * Get raw intelligence for a specific source
   * Returns 100% of the original data
   */
  public async getRawIntelligence(
    requestId: string,
    source: string
  ): Promise<RawIntelligenceRecord | null> {
    const sql = `
      SELECT * FROM raw_intelligence 
      WHERE request_id = ? AND source = ?
    `;

    const row = await this.dbManager.get(sql, [requestId, source]);
    if (!row) return null;

    return this.rowToRecord(row);
  }

  /**
   * Get ALL raw intelligence for a request
   * This is what you asked for - see 100% of what came from each source
   */
  public async getAllRawIntelligence(requestId: string): Promise<RawIntelligenceRecord[]> {
    const sql = `
      SELECT * FROM raw_intelligence 
      WHERE request_id = ?
      ORDER BY source ASC
    `;

    const rows = await this.dbManager.all(sql, [requestId]);
    return rows.map((row: any) => this.rowToRecord(row));
  }

  /**
   * Get a summary of all sources without the full raw data
   * Useful for UI overview before drilling into specific sources
   */
  public async getIntelligenceSummary(
    requestId: string,
    companyName?: string
  ): Promise<IntelligenceSummary> {
    const records = await this.getAllRawIntelligence(requestId);

    const sources: SourceSummary[] = records.map(record => {
      const data = record.rawData;
      let recordCount: number | undefined;
      let keyFields: string[] = [];

      // Analyze the data structure
      if (Array.isArray(data)) {
        recordCount = data.length;
      } else if (data && typeof data === 'object') {
        keyFields = Object.keys(data).slice(0, 10); // Top 10 fields
        // Check for nested arrays
        for (const key of keyFields) {
          if (Array.isArray(data[key])) {
            recordCount = (recordCount || 0) + data[key].length;
          }
        }
      }

      // Create preview snippet
      const previewSnippet = JSON.stringify(data, null, 2).substring(0, 500);

      return {
        source: record.source,
        status: record.status,
        dataSize: record.dataSize,
        confidence: record.confidence,
        cost: record.apiCost,
        responseTimeMs: record.responseTimeMs,
        recordCount,
        keyFields,
        previewSnippet: previewSnippet + (previewSnippet.length >= 500 ? '...' : '')
      };
    });

    const successfulSources = sources.filter(s => s.status === 'success' || s.status === 'partial');

    return {
      requestId,
      companyName: companyName || 'Unknown',
      totalSources: sources.length,
      successfulSources: successfulSources.length,
      failedSources: sources.length - successfulSources.length,
      totalDataSize: sources.reduce((sum, s) => sum + s.dataSize, 0),
      totalCost: sources.reduce((sum, s) => sum + s.cost, 0),
      sources,
      collectedAt: records[0]?.fetchedAt || new Date(),
      readyForSynthesis: successfulSources.length >= 3 // At least 3 good sources
    };
  }

  /**
   * Get raw data formatted for display (pretty JSON)
   */
  public async getRawDataForDisplay(
    requestId: string,
    source: string
  ): Promise<{ source: string; formattedJson: string; metadata: any } | null> {
    const record = await this.getRawIntelligence(requestId, source);
    if (!record) return null;

    return {
      source: record.source,
      formattedJson: JSON.stringify(record.rawData, null, 2),
      metadata: {
        status: record.status,
        confidence: record.confidence,
        cost: record.apiCost,
        responseTimeMs: record.responseTimeMs,
        dataSize: record.dataSize,
        fetchedAt: record.fetchedAt,
        errorMessage: record.errorMessage
      }
    };
  }

  /**
   * Export all raw intelligence as a single JSON file
   * Useful for debugging or manual review
   */
  public async exportAllAsJson(requestId: string): Promise<string> {
    const records = await this.getAllRawIntelligence(requestId);
    
    const exportData = {
      requestId,
      exportedAt: new Date().toISOString(),
      totalSources: records.length,
      sources: records.map(r => ({
        source: r.source,
        status: r.status,
        confidence: r.confidence,
        cost: r.apiCost,
        fetchedAt: r.fetchedAt,
        data: r.rawData
      }))
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Delete raw intelligence for a request (cleanup)
   */
  public async deleteRawIntelligence(requestId: string): Promise<number> {
    const sql = `DELETE FROM raw_intelligence WHERE request_id = ?`;
    const result = await this.dbManager.run(sql, [requestId]);
    return (result as any).changes || 0;
  }

  /**
   * Get list of all request IDs with raw intelligence
   */
  public async listRequests(limit: number = 50): Promise<{
    requestId: string;
    sourceCount: number;
    totalSize: number;
    collectedAt: string;
  }[]> {
    const sql = `
      SELECT 
        request_id,
        COUNT(*) as source_count,
        SUM(data_size) as total_size,
        MAX(fetched_at) as collected_at
      FROM raw_intelligence
      GROUP BY request_id
      ORDER BY collected_at DESC
      LIMIT ?
    `;

    const rows = await this.dbManager.all(sql, [limit]);
    return rows.map((row: any) => ({
      requestId: row.request_id,
      sourceCount: row.source_count,
      totalSize: row.total_size,
      collectedAt: row.collected_at
    }));
  }

  private rowToRecord(row: any): RawIntelligenceRecord {
    return {
      id: row.id,
      requestId: row.request_id,
      source: row.source,
      rawData: JSON.parse(row.raw_data),
      dataSize: row.data_size,
      confidence: row.confidence,
      apiCost: row.api_cost,
      responseTimeMs: row.response_time_ms,
      fetchedAt: new Date(row.fetched_at),
      status: row.status,
      errorMessage: row.error_message || undefined,
      metadata: row.metadata ? JSON.parse(row.metadata) : {}
    };
  }
}
