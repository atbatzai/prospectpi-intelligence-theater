/**
 * Webhook Service - Event Notifications
 * Story 7.3: Workflow Automation - Webhooks
 */

import { DatabaseManager } from '../../database/DatabaseManager';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

export enum WebhookEvent {
  DOSSIER_CREATED = 'dossier.created',
  DOSSIER_COMPLETED = 'dossier.completed',
  DOSSIER_FAILED = 'dossier.failed',
  RESEARCH_STARTED = 'research.started',
  RESEARCH_COMPLETED = 'research.completed',
  QUALITY_THRESHOLD = 'quality.threshold',
  COST_ALERT = 'cost.alert'
}

export interface Webhook {
  id: string;
  organizationId: string;
  url: string;
  events: WebhookEvent[];
  secret?: string;
  enabled: boolean;
  createdAt: string;
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  event: WebhookEvent;
  payload: any;
  status: 'pending' | 'success' | 'failed';
  attempts: number;
  lastAttemptAt?: string;
  errorMessage?: string;
  createdAt: string;
}

class WebhookService {
  private dbManager: DatabaseManager;
  private maxRetries = 3;

  constructor() {
    this.dbManager = DatabaseManager.getInstance();
  }

  async init(): Promise<void> {
    await this.initializeDatabase();
  }

  private async initializeDatabase(): Promise<void> {
    await this.dbManager.execute(`
      CREATE TABLE IF NOT EXISTS webhooks (
        id TEXT PRIMARY KEY,
        organization_id TEXT NOT NULL,
        url TEXT NOT NULL,
        events TEXT NOT NULL,
        secret TEXT,
        enabled BOOLEAN DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
      )
    `);

    await this.dbManager.execute(`
      CREATE TABLE IF NOT EXISTS webhook_deliveries (
        id TEXT PRIMARY KEY,
        webhook_id TEXT NOT NULL,
        event TEXT NOT NULL,
        payload TEXT NOT NULL,
        status TEXT NOT NULL,
        attempts INTEGER DEFAULT 0,
        last_attempt_at TEXT,
        error_message TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (webhook_id) REFERENCES webhooks(id) ON DELETE CASCADE
      )
    `);

    await this.dbManager.execute('CREATE INDEX IF NOT EXISTS idx_webhooks_org ON webhooks(organization_id)');
    await this.dbManager.execute('CREATE INDEX IF NOT EXISTS idx_deliveries_webhook ON webhook_deliveries(webhook_id)');
    await this.dbManager.execute('CREATE INDEX IF NOT EXISTS idx_deliveries_status ON webhook_deliveries(status)');
  }

  async createWebhook(
    organizationId: string,
    url: string,
    events: WebhookEvent[],
    secret?: string
  ): Promise<Webhook> {
    await this.initializeDatabase();

    const id = uuidv4();
    const now = new Date().toISOString();

    await this.dbManager.execute(`
      INSERT INTO webhooks (id, organization_id, url, events, secret)
      VALUES (?, ?, ?, ?, ?)
    `, [id, organizationId, url, JSON.stringify(events), secret || null]);

    return {
      id,
      organizationId,
      url,
      events,
      ...(secret ? { secret } : {}),
      enabled: true,
      createdAt: now
    };
  }

  async triggerEvent(
    organizationId: string,
    event: WebhookEvent,
    payload: any
  ): Promise<void> {
    // Find all webhooks subscribed to this event
    const webhooks = await this.dbManager.all(
      'SELECT * FROM webhooks WHERE organization_id = ? AND enabled = 1',
      [organizationId]
    );

    for (const webhook of webhooks) {
      const events = JSON.parse(webhook.events);
      
      if (events.includes(event)) {
        await this.deliverWebhook(webhook.id, event, payload, webhook.url, webhook.secret);
      }
    }
  }

  private async deliverWebhook(
    webhookId: string,
    event: WebhookEvent,
    payload: any,
    url: string,
    secret?: string
  ): Promise<void> {
    const deliveryId = uuidv4();
    const now = new Date().toISOString();

    // Create delivery record
    await this.dbManager.execute(`
      INSERT INTO webhook_deliveries (id, webhook_id, event, payload, status)
      VALUES (?, ?, ?, ?, 'pending')
    `, [deliveryId, webhookId, event, JSON.stringify(payload)]);

    // Attempt delivery
    try {
      const headers: any = {
        'Content-Type': 'application/json',
        'X-Webhook-Event': event,
        'X-Webhook-ID': deliveryId
      };

      if (secret) {
        // In production, use HMAC signature
        headers['X-Webhook-Secret'] = secret;
      }

      await axios.post(url, {
        event,
        data: payload,
        timestamp: now
      }, {
        headers,
        timeout: 10000
      });

      // Mark as successful
      await this.dbManager.execute(`
        UPDATE webhook_deliveries 
        SET status = 'success', attempts = 1, last_attempt_at = ?
        WHERE id = ?
      `, [now, deliveryId]);

    } catch (error: any) {
      // Mark as failed
      await this.dbManager.execute(`
        UPDATE webhook_deliveries 
        SET status = 'failed', attempts = 1, last_attempt_at = ?, error_message = ?
        WHERE id = ?
      `, [now, error.message, deliveryId]);

      // Schedule retry (in production, use job queue)
      console.error(`Webhook delivery failed: ${error.message}`);
    }
  }

  async listWebhooks(organizationId: string): Promise<Webhook[]> {
    const rows = await this.dbManager.all(
      'SELECT * FROM webhooks WHERE organization_id = ? ORDER BY created_at DESC',
      [organizationId]
    );

    return rows.map((row: any) => ({
      id: row.id,
      organizationId: row.organization_id,
      url: row.url,
      events: JSON.parse(row.events),
      ...(row.secret ? { secret: '***' } : {}),
      enabled: row.enabled === 1,
      createdAt: row.created_at
    }));
  }

  async getDeliveries(webhookId: string, limit: number = 50): Promise<WebhookDelivery[]> {
    const rows = await this.dbManager.all(
      'SELECT * FROM webhook_deliveries WHERE webhook_id = ? ORDER BY created_at DESC LIMIT ?',
      [webhookId, limit]
    );

    return rows.map((row: any) => ({
      id: row.id,
      webhookId: row.webhook_id,
      event: row.event as WebhookEvent,
      payload: JSON.parse(row.payload),
      status: row.status,
      attempts: row.attempts,
      ...(row.last_attempt_at ? { lastAttemptAt: row.last_attempt_at } : {}),
      ...(row.error_message ? { errorMessage: row.error_message } : {}),
      createdAt: row.created_at
    }));
  }

  async deleteWebhook(webhookId: string, organizationId: string): Promise<void> {
    await this.dbManager.execute(
      'DELETE FROM webhooks WHERE id = ? AND organization_id = ?',
      [webhookId, organizationId]
    );
  }
}

export const webhookService = new WebhookService();
