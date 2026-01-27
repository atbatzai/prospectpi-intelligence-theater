/**
 * ProspectPI - Partner Ecosystem Platform
 * Story 12.2 - API marketplace, webhooks, developer portal
 */

import { DatabaseManager } from '../database/DatabaseManager';
import * as crypto from 'crypto';
import axios from 'axios';

interface ApiKey {
  id: string;
  key: string;
  partnerId: string;
  tier: 'free' | 'pro' | 'enterprise';
  rateLimit: number;
  expiresAt?: Date;
}

interface WebhookConfig {
  url: string;
  events: string[];
  secret: string;
  retryPolicy: {
    maxRetries: number;
    backoffMultiplier: number;
  };
}

interface Integration {
  name: string;
  description: string;
  logoUrl: string;
  category: string;
  setupInstructions: string;
  configSchema: any;
  price: number;
}

interface UsageMetrics {
  totalCalls: number;
  successRate: number;
  averageLatency: number;
  errorsLast24h: number;
  quotaRemaining: number;
}

export class PartnerEcosystemPlatform {
  private db: DatabaseManager;
  private readonly WEBHOOK_EVENTS = [
    'dossier.completed',
    'dossier.failed',
    'user.created',
    'user.deleted',
    'quota.exceeded',
    'quota.warning',
    'payment.success',
    'payment.failed'
  ];

  constructor() {
    this.db = DatabaseManager.getInstance();
  }

  /**
   * Create API key for partner
   * With tier-based rate limiting
   */
  async createApiKey(partnerId: string, tier: 'free' | 'pro' | 'enterprise'): Promise<ApiKey> {
    const apiKeyValue = \sk_\\;
    const keyId = crypto.randomUUID();

    // Set rate limits based on tier
    const rateLimits: Record<string, number> = {
      'free': 100,       // 100 req/day
      'pro': 10000,      // 10k req/day
      'enterprise': -1   // Unlimited
    };

    const expiresAt = tier === 'free' 
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      : undefined;

    await this.db.query(\
      INSERT INTO api_keys 
        (id, partner_id, key_hash, tier, rate_limit, expires_at, created_at)
      VALUES (, , , , , , NOW())
    \, [
      keyId,
      partnerId,
      await this.hashKey(apiKeyValue),
      tier,
      rateLimits[tier],
      expiresAt
    ]);

    return {
      id: keyId,
      key: apiKeyValue,
      partnerId,
      tier,
      rateLimit: rateLimits[tier],
      expiresAt
    };
  }

  /**
   * Register webhook for partner
   * Event-driven integrations with retry logic
   */
  async registerWebhook(partnerId: string, webhook: WebhookConfig): Promise<{ id: string; secret: string }> {
    // Validate webhook URL
    await this.validateWebhookUrl(webhook.url);

    // Validate events
    const invalidEvents = webhook.events.filter(e => !this.WEBHOOK_EVENTS.includes(e));
    if (invalidEvents.length > 0) {
      throw new Error(\Invalid events: \\);
    }

    // Generate webhook secret for signature verification
    const secret = crypto.randomBytes(32).toString('hex');
    const webhookId = crypto.randomUUID();

    await this.db.query(\
      INSERT INTO partner_webhooks 
        (id, partner_id, url, events, secret, retry_policy, active, created_at)
      VALUES (, , , , , , true, NOW())
    \, [
      webhookId,
      partnerId,
      webhook.url,
      JSON.stringify(webhook.events),
      secret,
      JSON.stringify(webhook.retryPolicy || { maxRetries: 3, backoffMultiplier: 2 })
    ]);

    return { id: webhookId, secret };
  }

  /**
   * Trigger webhook event
   * With retry logic and exponential backoff
   */
  async triggerWebhook(partnerId: string, event: string, payload: any): Promise<void> {
    // Get active webhooks for this partner and event
    const webhooks = await this.db.query(\
      SELECT * FROM partner_webhooks
      WHERE partner_id =  
        AND active = true
        AND events @> ::jsonb
    \, [partnerId, JSON.stringify([event])]);

    // Trigger each webhook asynchronously
    for (const webhook of webhooks.rows) {
      this.sendWebhook(webhook, event, payload);
    }
  }

  /**
   * Publish integration to marketplace
   * For integration sharing/discovery
   */
  async publishIntegration(partnerId: string, integration: Integration): Promise<{ id: string; status: string }> {
    const integrationId = crypto.randomUUID();

    await this.db.query(\
      INSERT INTO marketplace_integrations 
        (id, partner_id, name, description, logo_url, category, setup_instructions, config_schema, price, status, created_at)
      VALUES (, , , , , , , , , 'pending_review', NOW())
    \, [
      integrationId,
      partnerId,
      integration.name,
      integration.description,
      integration.logoUrl,
      integration.category,
      integration.setupInstructions,
      JSON.stringify(integration.configSchema),
      integration.price
    ]);

    // Notify review team
    await this.notifyReviewTeam(integrationId);

    return {
      id: integrationId,
      status: 'pending_review'
    };
  }

  /**
   * Install marketplace integration
   * One-click integration install
   */
  async installIntegration(partnerId: string, integrationId: string, config: any): Promise<void> {
    // Get integration details
    const integration = await this.db.query(\
      SELECT * FROM marketplace_integrations WHERE id =  AND status = 'approved'
    \, [integrationId]);

    if (integration.rows.length === 0) {
      throw new Error('Integration not found or not approved');
    }

    // Validate config against schema
    this.validateConfig(config, integration.rows[0].config_schema);

    // Install integration
    await this.db.query(\
      INSERT INTO partner_integrations 
        (partner_id, integration_id, config, installed_at)
      VALUES (, , , NOW())
    \, [partnerId, integrationId, JSON.stringify(config)]);

    // Trigger setup webhook if defined
    const setupWebhook = integration.rows[0].setup_webhook;
    if (setupWebhook) {
      await axios.post(setupWebhook, {
        partnerId,
        integrationId,
        config
      });
    }
  }

  /**
   * Track API usage metrics
   * For analytics and quota enforcement
   */
  async trackApiUsage(apiKeyId: string, endpoint: string, latency: number, success: boolean): Promise<void> {
    await this.db.query(\
      INSERT INTO api_usage_events 
        (api_key_id, endpoint, latency_ms, success, timestamp)
      VALUES (, , , , NOW())
    \, [apiKeyId, endpoint, latency, success]);

    // Check rate limits
    await this.enforceRateLimit(apiKeyId);
  }

  /**
   * Get API usage metrics for partner portal
   */
  async getUsageMetrics(apiKeyId: string): Promise<UsageMetrics> {
    const [total, success, latency, errors, quota] = await Promise.all([
      this.getTotalCalls(apiKeyId),
      this.getSuccessRate(apiKeyId),
      this.getAverageLatency(apiKeyId),
      this.getErrorsLast24h(apiKeyId),
      this.getQuotaRemaining(apiKeyId)
    ]);

    return {
      totalCalls: total,
      successRate: success,
      averageLatency: latency,
      errorsLast24h: errors,
      quotaRemaining: quota
    };
  }

  /**
   * Test webhook delivery
   * For partner testing/debugging
   */
  async testWebhook(webhookId: string): Promise<{ success: boolean; response: any }> {
    const webhook = await this.db.query(\
      SELECT * FROM partner_webhooks WHERE id = 
    \, [webhookId]);

    if (webhook.rows.length === 0) {
      throw new Error('Webhook not found');
    }

    const testPayload = {
      event: 'webhook.test',
      timestamp: new Date().toISOString(),
      data: { message: 'This is a test webhook delivery' }
    };

    try {
      const response = await this.deliverWebhook(webhook.rows[0], testPayload);
      return { success: true, response: response.data };
    } catch (error: any) {
      return { success: false, response: error.message };
    }
  }

  /**
   * Replay failed webhook events
   * For recovery from transient failures
   */
  async replayWebhookEvents(webhookId: string, since: Date): Promise<number> {
    const failed = await this.db.query(\
      SELECT * FROM webhook_delivery_log
      WHERE webhook_id =  
        AND success = false
        AND created_at >= 
      ORDER BY created_at ASC
    \, [webhookId, since]);

    let replayedCount = 0;

    for (const event of failed.rows) {
      try {
        await this.sendWebhook(event.webhook, event.event_type, JSON.parse(event.payload));
        replayedCount++;
      } catch (error) {
        console.error(\Failed to replay event \:\, error);
      }
    }

    return replayedCount;
  }

  /**
   * Private helper methods
   */

  private async hashKey(key: string): Promise<string> {
    return crypto.createHash('sha256').update(key).digest('hex');
  }

  private async validateWebhookUrl(url: string): Promise<void> {
    // Validate URL format
    try {
      new URL(url);
    } catch {
      throw new Error('Invalid webhook URL');
    }

    // Ensure HTTPS
    if (!url.startsWith('https://')) {
      throw new Error('Webhook URL must use HTTPS');
    }

    // Test connectivity
    try {
      await axios.head(url, { timeout: 5000 });
    } catch (error) {
      throw new Error('Webhook URL is not reachable');
    }
  }

  private async sendWebhook(webhook: any, event: string, payload: any): Promise<void> {
    const retryPolicy = JSON.parse(webhook.retry_policy);
    let attempt = 0;

    while (attempt <= retryPolicy.maxRetries) {
      try {
        await this.deliverWebhook(webhook, { event, timestamp: new Date(), data: payload });
        
        // Log success
        await this.logWebhookDelivery(webhook.id, event, payload, true, null);
        break;

      } catch (error: any) {
        attempt++;
        
        if (attempt > retryPolicy.maxRetries) {
          // Log final failure
          await this.logWebhookDelivery(webhook.id, event, payload, false, error.message);
        } else {
          // Wait before retry (exponential backoff)
          const delay = Math.pow(retryPolicy.backoffMultiplier, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
  }

  private async deliverWebhook(webhook: any, payload: any): Promise<any> {
    // Generate signature
    const signature = crypto
      .createHmac('sha256', webhook.secret)
      .update(JSON.stringify(payload))
      .digest('hex');

    return await axios.post(webhook.url, payload, {
      headers: {
        'X-ProspectPI-Signature': signature,
        'X-ProspectPI-Event': payload.event,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
  }

  private async logWebhookDelivery(
    webhookId: string,
    event: string,
    payload: any,
    success: boolean,
    error: string | null
  ): Promise<void> {
    await this.db.query(\
      INSERT INTO webhook_delivery_log 
        (webhook_id, event_type, payload, success, error, delivered_at)
      VALUES (, , , , , NOW())
    \, [webhookId, event, JSON.stringify(payload), success, error]);
  }

  private validateConfig(config: any, schema: any): void {
    // Simple validation - production would use JSON Schema validator
    const requiredFields = schema.required || [];
    for (const field of requiredFields) {
      if (!(field in config)) {
        throw new Error(\Missing required field: \\);
      }
    }
  }

  private async notifyReviewTeam(integrationId: string): Promise<void> {
    // Send notification to review team
    console.log(\New integration \ submitted for review\);
  }

  private async enforceRateLimit(apiKeyId: string): Promise<void> {
    const key = await this.db.query(\SELECT * FROM api_keys WHERE id = \, [apiKeyId]);
    
    if (key.rows[0].rate_limit === -1) return; // Unlimited

    const today = await this.getTotalCalls(apiKeyId);
    
    if (today >= key.rows[0].rate_limit) {
      throw new Error('Rate limit exceeded');
    }
  }

  private async getTotalCalls(apiKeyId: string): Promise<number> {
    const result = await this.db.query(\
      SELECT COUNT(*) as count
      FROM api_usage_events
      WHERE api_key_id =  AND timestamp > NOW() - INTERVAL '24 hours'
    \, [apiKeyId]);
    return parseInt(result.rows[0].count);
  }

  private async getSuccessRate(apiKeyId: string): Promise<number> {
    const result = await this.db.query(\
      SELECT 
        COUNT(CASE WHEN success THEN 1 END)::FLOAT / COUNT(*)::FLOAT as rate
      FROM api_usage_events
      WHERE api_key_id =  AND timestamp > NOW() - INTERVAL '24 hours'
    \, [apiKeyId]);
    return parseFloat(result.rows[0].rate) || 0;
  }

  private async getAverageLatency(apiKeyId: string): Promise<number> {
    const result = await this.db.query(\
      SELECT AVG(latency_ms) as avg_latency
      FROM api_usage_events
      WHERE api_key_id =  AND timestamp > NOW() - INTERVAL '24 hours'
    \, [apiKeyId]);
    return parseFloat(result.rows[0].avg_latency) || 0;
  }

  private async getErrorsLast24h(apiKeyId: string): Promise<number> {
    const result = await this.db.query(\
      SELECT COUNT(*) as count
      FROM api_usage_events
      WHERE api_key_id =  
        AND success = false
        AND timestamp > NOW() - INTERVAL '24 hours'
    \, [apiKeyId]);
    return parseInt(result.rows[0].count);
  }

  private async getQuotaRemaining(apiKeyId: string): Promise<number> {
    const key = await this.db.query(\SELECT rate_limit FROM api_keys WHERE id = \, [apiKeyId]);
    
    if (key.rows[0].rate_limit === -1) return -1; // Unlimited

    const used = await this.getTotalCalls(apiKeyId);
    return Math.max(0, key.rows[0].rate_limit - used);
  }
}
