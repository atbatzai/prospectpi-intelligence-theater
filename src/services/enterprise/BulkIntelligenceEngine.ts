/**
 * ProspectPI - Bulk Intelligence Engine
 * Story 9.2: Distributed batch processing for enterprise scale
 */

import Bull, { Queue, Job } from 'bull';
import { DatabaseManager } from '../../database/DatabaseManager';
import { AgentOrchestrator } from '../AgentOrchestrator';
import { v4 as uuidv4 } from 'uuid';
import Redis from 'ioredis';

export interface CompanyEntry {
  name: string;
  domain?: string;
  priority?: 'high' | 'normal' | 'low';
}

export interface BatchJob {
  id: string;
  userId: string;
  organizationId: string;
  name: string;
  companies: CompanyEntry[];
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'paused';
  progress: BatchProgress;
  estimatedCost: number;
  actualCost: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export interface BatchProgress {
  total: number;
  completed: number;
  inProgress: number;
  failed: number;
  estimatedTimeRemaining: number;
}

export interface BatchJobItem {
  id: string;
  batchJobId: string;
  companyName: string;
  dossierId?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  errorMessage?: string;
  cost: number;
  processingTime?: number;
  retryCount: number;
}

export class BulkIntelligenceEngine {
  private dossierQueue: Queue;
  private dbManager: DatabaseManager;
  private redis: Redis.Redis;
  private readonly MAX_RETRIES = 3;
  private readonly WORKER_CONCURRENCY = 10;

  constructor() {
    this.dbManager = DatabaseManager.getInstance();
    
    // Initialize Redis connection
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD
    });

    // Initialize Bull queue
    this.dossierQueue = new Bull('dossier-generation', {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD
      },
      defaultJobOptions: {
        attempts: this.MAX_RETRIES,
        backoff: {
          type: 'exponential',
          delay: 2000
        },
        removeOnComplete: false,
        removeOnFail: false
      }
    });

    // Register worker processor
    this.initializeWorker();
  }

  /**
   * AC1: Create bulk batch job with validation
   */
  async createBatchJob(
    companies: CompanyEntry[],
    userId: string,
    organizationId: string,
    jobName?: string
  ): Promise<BatchJob> {
    console.log(\ Creating batch job for \ companies...\);

    // Validate company list
    const validatedCompanies = await this.validateCompanies(companies);

    // Calculate estimated cost
    const estimatedCost = this.calculateEstimatedCost(validatedCompanies.length);

    // Check user quota
    await this.checkUserQuota(userId, organizationId, validatedCompanies.length);

    // Create batch job record
    const jobId = uuidv4();
    const batchJob: BatchJob = {
      id: jobId,
      userId,
      organizationId,
      name: jobName || \Batch Job \\,
      companies: validatedCompanies,
      status: 'pending',
      progress: {
        total: validatedCompanies.length,
        completed: 0,
        inProgress: 0,
        failed: 0,
        estimatedTimeRemaining: validatedCompanies.length * 120 // 2 min per company
      },
      estimatedCost,
      actualCost: 0,
      createdAt: new Date()
    };

    // Save to database
    await this.dbManager.query(\
      INSERT INTO batch_jobs (
        id, user_id, organization_id, name, total_companies,
        status, estimated_cost, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    \, [
      jobId, userId, organizationId, batchJob.name, 
      validatedCompanies.length, 'pending', estimatedCost, new Date()
    ]);

    // Create job items
    for (const company of validatedCompanies) {
      await this.dbManager.query(\
        INSERT INTO batch_job_items (
          id, batch_job_id, company_name, status
        ) VALUES (?, ?, ?, 'pending')
      \, [uuidv4(), jobId, company.name]);
    }

    return batchJob;
  }

  /**
   * AC2: Process batch with distributed queue
   */
  async processBatch(jobId: string): Promise<void> {
    console.log(\ Starting batch processing for job \...\);

    // Update job status
    await this.dbManager.query(\
      UPDATE batch_jobs 
      SET status = 'processing', started_at = NOW() 
      WHERE id = ?
    \, [jobId]);

    // Get all pending items
    const items = await this.dbManager.query(\
      SELECT * FROM batch_job_items 
      WHERE batch_job_id = ? AND status = 'pending'
      ORDER BY id
    \, [jobId]);

    // Add jobs to queue with priority
    for (const item of items) {
      await this.dossierQueue.add(
        'generate-dossier',
        {
          batchJobId: jobId,
          itemId: item.id,
          companyName: item.company_name
        },
        {
          priority: this.getPriority(item),
          jobId: item.id
        }
      );
    }

    console.log(\ Added \ companies to processing queue\);
  }

  /**
   * AC2: Initialize distributed worker
   */
  private initializeWorker(): void {
    this.dossierQueue.process(
      'generate-dossier',
      this.WORKER_CONCURRENCY,
      async (job: Job) => {
        const { batchJobId, itemId, companyName } = job.data;
        const startTime = Date.now();

        try {
          // Update item status
          await this.updateItemStatus(itemId, 'processing');

          // Generate dossier using orchestrator
          const orchestrator = new AgentOrchestrator();
          const result = await orchestrator.generateDossier({
            companyName,
            userInput: { companyName }
          });

          const processingTime = Date.now() - startTime;

          // Update item with success
          await this.dbManager.query(\
            UPDATE batch_job_items 
            SET status = 'completed', 
                dossier_id = ?, 
                cost = ?,
                processing_time = ?,
                updated_at = NOW()
            WHERE id = ?
          \, [result.dossierId, result.cost || 0, processingTime, itemId]);

          // Update batch job progress
          await this.updateBatchProgress(batchJobId);

          // Emit progress event
          await this.emitProgressUpdate(batchJobId);

          return { success: true, dossierId: result.dossierId };

        } catch (error: any) {
          console.error(\Failed to process \:\, error);

          // Update item with failure
          await this.dbManager.query(\
            UPDATE batch_job_items 
            SET status = 'failed',
                error_message = ?,
                retry_count = retry_count + 1,
                updated_at = NOW()
            WHERE id = ?
          \, [error.message, itemId]);

          // Update batch progress
          await this.updateBatchProgress(batchJobId);

          throw error; // Trigger Bull retry mechanism
        }
      }
    );

    console.log(\ Worker initialized with \ concurrent jobs\);
  }

  /**
   * AC3: Get real-time progress
   */
  async getProgress(jobId: string): Promise<BatchProgress> {
    const result = await this.dbManager.queryOne(\
      SELECT 
        total_companies as total,
        completed_count as completed,
        failed_count as failed,
        (SELECT COUNT(*) FROM batch_job_items 
         WHERE batch_job_id = ? AND status = 'processing') as in_progress
      FROM batch_jobs 
      WHERE id = ?
    \, [jobId, jobId]);

    const remaining = result.total - result.completed - result.failed;
    const avgTimePerCompany = 120; // 2 minutes

    return {
      total: result.total,
      completed: result.completed,
      inProgress: result.in_progress,
      failed: result.failed,
      estimatedTimeRemaining: remaining * avgTimePerCompany
    };
  }

  /**
   * AC4: Export batch results
   */
  async exportResults(
    jobId: string, 
    format: 'csv' | 'excel' | 'pdf'
  ): Promise<Buffer> {
    console.log(\ Exporting batch results as \...\);

    const items = await this.dbManager.query(\
      SELECT 
        bji.company_name,
        bji.status,
        bji.cost,
        bji.processing_time,
        d.id as dossier_id,
        d.confidence_score
      FROM batch_job_items bji
      LEFT JOIN dossiers d ON bji.dossier_id = d.id
      WHERE bji.batch_job_id = ?
      ORDER BY bji.company_name
    \, [jobId]);

    if (format === 'csv') {
      return this.exportToCSV(items);
    } else if (format === 'excel') {
      return this.exportToExcel(items);
    } else {
      return this.exportToPDF(items);
    }
  }

  /**
   * AC5: Track costs and enforce quotas
   */
  private async checkUserQuota(
    userId: string, 
    organizationId: string, 
    companyCount: number
  ): Promise<void> {
    const org = await this.dbManager.queryOne(\
      SELECT max_requests_per_month, 
             (SELECT COUNT(*) FROM dossiers 
              WHERE organization_id = ? 
              AND created_at > DATE_TRUNC('month', NOW())) as used_this_month
      FROM organizations 
      WHERE id = ?
    \, [organizationId, organizationId]);

    const remainingQuota = org.max_requests_per_month - org.used_this_month;

    if (companyCount > remainingQuota) {
      throw new Error(
        \Batch size (\) exceeds remaining quota (\)\
      );
    }
  }

  // Helper methods
  private async validateCompanies(companies: CompanyEntry[]): Promise<CompanyEntry[]> {
    return companies.filter(c => c.name && c.name.trim().length > 0);
  }

  private calculateEstimatedCost(count: number): number {
    const costPerDossier = 0.50; // .50 per dossier
    return count * costPerDossier;
  }

  private getPriority(item: any): number {
    // VIP/Priority logic
    return item.priority === 'high' ? 1 : 10;
  }

  private async updateItemStatus(itemId: string, status: string): Promise<void> {
    await this.dbManager.query(\
      UPDATE batch_job_items SET status = ?, updated_at = NOW() WHERE id = ?
    \, [status, itemId]);
  }

  private async updateBatchProgress(jobId: string): Promise<void> {
    await this.dbManager.query(\
      UPDATE batch_jobs 
      SET completed_count = (
        SELECT COUNT(*) FROM batch_job_items 
        WHERE batch_job_id = ? AND status = 'completed'
      ),
      failed_count = (
        SELECT COUNT(*) FROM batch_job_items 
        WHERE batch_job_id = ? AND status = 'failed'
      ),
      actual_cost = (
        SELECT COALESCE(SUM(cost), 0) FROM batch_job_items 
        WHERE batch_job_id = ?
      )
      WHERE id = ?
    \, [jobId, jobId, jobId, jobId]);

    // Check if job is complete
    const job = await this.dbManager.queryOne(\
      SELECT total_companies, completed_count, failed_count 
      FROM batch_jobs WHERE id = ?
    \, [jobId]);

    if (job.completed_count + job.failed_count >= job.total_companies) {
      await this.dbManager.query(\
        UPDATE batch_jobs 
        SET status = 'completed', completed_at = NOW() 
        WHERE id = ?
      \, [jobId]);
    }
  }

  private async emitProgressUpdate(jobId: string): Promise<void> {
    const progress = await this.getProgress(jobId);
    await this.redis.publish(\atch-progress:\\, JSON.stringify(progress));
  }

  private exportToCSV(items: any[]): Buffer {
    const csv = 'Company,Status,Cost,Processing Time,Dossier ID,Confidence\\n' +
      items.map(i => 
        \\,\,\,\,\,\\
      ).join('\\n');
    return Buffer.from(csv);
  }

  private exportToExcel(items: any[]): Buffer {
    // TODO: Implement Excel export with xlsx library
    return Buffer.from('Excel export not yet implemented');
  }

  private exportToPDF(items: any[]): Buffer {
    // TODO: Implement PDF export with pdfkit library
    return Buffer.from('PDF export not yet implemented');
  }

  /**
   * Pause batch job
   */
  async pauseJob(jobId: string): Promise<void> {
    await this.dossierQueue.pause();
    await this.dbManager.query(\
      UPDATE batch_jobs SET status = 'paused' WHERE id = ?
    \, [jobId]);
  }

  /**
   * Resume batch job
   */
  async resumeJob(jobId: string): Promise<void> {
    await this.dossierQueue.resume();
    await this.dbManager.query(\
      UPDATE batch_jobs SET status = 'processing' WHERE id = ?
    \, [jobId]);
  }

  /**
   * Cancel batch job
   */
  async cancelJob(jobId: string): Promise<void> {
    // Remove pending jobs from queue
    const items = await this.dbManager.query(\
      SELECT id FROM batch_job_items 
      WHERE batch_job_id = ? AND status IN ('pending', 'processing')
    \, [jobId]);

    for (const item of items) {
      await this.dossierQueue.removeJobs(item.id);
    }

    await this.dbManager.query(\
      UPDATE batch_jobs SET status = 'cancelled' WHERE id = ?
    \, [jobId]);
  }
}
