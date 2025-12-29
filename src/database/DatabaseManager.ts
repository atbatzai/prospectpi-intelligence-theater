/**
 * ProspectPI Intelligence Theater - Database Connection Manager
 * Story 1.4: Database Schema & User Management
 */

import sqlite3 from 'sqlite3';
import { Pool } from 'pg';
import path from 'path';
import fs from 'fs';

// Migration interface
export interface Migration {
  version: string;
  description: string;
  up: (manager: DatabaseManager) => Promise<void>;
  down: (manager: DatabaseManager) => Promise<void>;
}

interface DatabaseConfig {
  type: 'sqlite' | 'postgresql';
  sqlite?: {
    path: string;
  };
  postgresql?: {
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
    ssl?: boolean;
    max?: number;
  };
}

export class DatabaseManager {
  private static instance: DatabaseManager;
  private config: DatabaseConfig;
  private sqliteDb: sqlite3.Database | null = null;
  private pgPool: Pool | null = null;

  private constructor() {
    this.config = this.loadConfig();
  }

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  public static async initialize(): Promise<void> {
    const instance = DatabaseManager.getInstance();
    await instance.connect();
    await instance.createTables();
  }

  private loadConfig(): DatabaseConfig {
    // Check environment for PostgreSQL connection
    if (process.env.DATABASE_URL || process.env.PGHOST) {
      // Parse DATABASE_URL if provided (e.g., postgresql://user:password@host:port/database)
      if (process.env.DATABASE_URL) {
        try {
          const url = new URL(process.env.DATABASE_URL);
          return {
            type: 'postgresql',
            postgresql: {
              host: url.hostname,
              port: parseInt(url.port) || 5432,
              database: url.pathname.slice(1), // Remove leading slash
              username: url.username,
              password: url.password,
              ssl: process.env.NODE_ENV === 'production',
              max: 20 // Connection pool size
            }
          };
        } catch (error) {
          console.error('Invalid DATABASE_URL format:', error);
          // Fallback to individual environment variables
        }
      }

      // Use individual environment variables as fallback
      return {
        type: 'postgresql',
        postgresql: {
          host: process.env.PGHOST || 'localhost',
          port: parseInt(process.env.PGPORT || '5432'),
          database: process.env.PGDATABASE || 'prospectpi',
          username: process.env.PGUSER || 'postgres',
          password: process.env.PGPASSWORD || '',
          ssl: process.env.NODE_ENV === 'production',
          max: 20 // Connection pool size
        }
      };
    } else {
      // Default to SQLite for development
      return {
        type: 'sqlite',
        sqlite: {
          path: path.join(process.cwd(), 'data', 'prospectpi.db')
        }
      };
    }
  }

  private async connect(): Promise<void> {
    if (this.config.type === 'postgresql' && this.config.postgresql) {
      this.pgPool = new Pool({
        host: this.config.postgresql.host,
        port: this.config.postgresql.port,
        database: this.config.postgresql.database,
        user: this.config.postgresql.username,
        password: this.config.postgresql.password,
        ssl: this.config.postgresql.ssl,
        max: this.config.postgresql.max
      });

      // Test connection
      try {
        const client = await this.pgPool.connect();
        console.log('Connected to PostgreSQL database');
        client.release();
      } catch (error) {
        console.error('Failed to connect to PostgreSQL:', error);
        throw error;
      }
    } else {
      // SQLite connection
      return new Promise((resolve, reject) => {
        const dbPath = this.config.sqlite!.path;
        
        // Ensure data directory exists
        const dataDir = path.dirname(dbPath);
        if (!fs.existsSync(dataDir)) {
          fs.mkdirSync(dataDir, { recursive: true });
        }

        this.sqliteDb = new sqlite3.Database(dbPath, (err) => {
          if (err) {
            reject(err);
          } else {
            console.log('Connected to SQLite database');
            resolve();
          }
        });
      });
    }
  }

  private async createTables(): Promise<void> {
    if (this.config.type === 'postgresql') {
      await this.createPostgreSQLTables();
    } else {
      await this.createSQLiteTables();
    }

    console.log('Database tables created successfully');
    
    // Create default development organization for testing if it doesn't exist
    if (this.sqliteDb) {
      await new Promise<void>((resolve, reject) => {
        this.sqliteDb!.run(`
          INSERT OR IGNORE INTO organizations (id, name, subscription_tier, max_users, created_at, updated_at)
          VALUES ('dev-org-id', 'Development Organization', 'enterprise', 100, ?, ?)
        `, [new Date().toISOString(), new Date().toISOString()], function(err) {
          if (err) reject(err);
          else resolve();
        });
      });
      console.log('Default development organization ensured');
    }
  }

  private async createPostgreSQLTables(): Promise<void> {
    if (!this.pgPool) throw new Error('PostgreSQL not connected');

    const client = await this.pgPool.connect();
    try {
      // Enable UUID extension
      await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

      // Organizations table
      await client.query(`
        CREATE TABLE IF NOT EXISTS organizations (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          name VARCHAR(200) NOT NULL,
          domain VARCHAR(100) UNIQUE NOT NULL,
          slug VARCHAR(100) UNIQUE NOT NULL,
          subscription_tier VARCHAR(50) DEFAULT 'starter',
          max_users INTEGER DEFAULT 5,
          max_teams INTEGER DEFAULT 3,
          max_requests_per_month INTEGER DEFAULT 100,
          settings JSONB DEFAULT '{}',
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          is_active BOOLEAN DEFAULT true,
          billing_email VARCHAR(255),
          salesforce_org_id VARCHAR(100)
        )
      `);

      // PHASE 1: Department table (must come before users table)
      await client.query(`
        CREATE TABLE IF NOT EXISTS departments (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
          name VARCHAR(100) NOT NULL,
          description TEXT,
          head_user_id UUID, -- Will add foreign key constraint later
          budget_allocated DECIMAL(10,2) DEFAULT 0,
          settings JSONB DEFAULT '{}',
          created_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(organization_id, name)
        )
      `);

      // Users table with enhanced fields and SaaS subscription management
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          first_name VARCHAR(100) NOT NULL,
          last_name VARCHAR(100) NOT NULL,
          role VARCHAR(50) DEFAULT 'user',
          organization_id UUID REFERENCES organizations(id),
          -- PHASE 1: Organization Structure Fields
          department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
          organization_role VARCHAR(50) DEFAULT 'member',
          hire_date DATE,
          manager_user_id UUID, -- Will add foreign key constraint later
          -- SaaS Subscription Fields
          subscription_plan VARCHAR(50) DEFAULT 'starter',
          subscription_status VARCHAR(50) DEFAULT 'trial',
          stripe_customer_id VARCHAR(255),
          stripe_subscription_id VARCHAR(255),
          trial_ends_at TIMESTAMP,
          current_period_start TIMESTAMP,
          current_period_end TIMESTAMP,
          dossiers_used_this_month INTEGER DEFAULT 0,
          dossier_limit INTEGER DEFAULT 3,
          -- End SaaS Fields
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          last_login TIMESTAMP,
          is_active BOOLEAN DEFAULT true,
          email_verified BOOLEAN DEFAULT false,
          email_verification_token VARCHAR(255),
          password_reset_token VARCHAR(255),
          password_reset_expires TIMESTAMP,
          -- GDPR Compliance Fields
          consent_marketing BOOLEAN DEFAULT false,
          consent_analytics BOOLEAN DEFAULT false,
          data_processing_consent BOOLEAN DEFAULT true,
          gdpr_consent_date TIMESTAMP,
          data_region VARCHAR(10) DEFAULT 'US',
          gdpr_export_requested_at TIMESTAMP,
          gdpr_deletion_requested_at TIMESTAMP
        )
      `);

      // JWT session management
      await client.query(`
        CREATE TABLE IF NOT EXISTS user_sessions (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          token_hash VARCHAR(255) NOT NULL,
          expires_at TIMESTAMP NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          last_used TIMESTAMP DEFAULT NOW(),
          user_agent TEXT,
          ip_address INET,
          is_revoked BOOLEAN DEFAULT false
        )
      `);

      // Research requests with full Lovable frontend fields
      await client.query(`
        CREATE TABLE IF NOT EXISTS research_requests (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          request_id VARCHAR(50) UNIQUE NOT NULL,
          user_id UUID NOT NULL REFERENCES users(id),
          organization_id UUID NOT NULL REFERENCES organizations(id),
          company_name VARCHAR(200) NOT NULL,
          company_url VARCHAR(500),
          linkedin_url VARCHAR(500),
          crm_notes TEXT,
          organization_focus VARCHAR(100),
          location_of_interest VARCHAR(100),
          context_links JSON,
          additional_context TEXT,
          status VARCHAR(20) DEFAULT 'processing',
          priority VARCHAR(20) DEFAULT 'standard',
          created_at TIMESTAMP DEFAULT NOW(),
          started_at TIMESTAMP,
          completed_at TIMESTAMP,
          estimated_completion INTEGER,
          actual_processing_time INTEGER,
          error_message TEXT,
          retry_count INTEGER DEFAULT 0
        )
      `);

      // Agent progress tracking
      await client.query(`
        CREATE TABLE IF NOT EXISTS agent_progress (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          request_id VARCHAR(50) NOT NULL REFERENCES research_requests(request_id),
          agent VARCHAR(50) NOT NULL,
          stage VARCHAR(50) NOT NULL,
          message TEXT NOT NULL,
          confidence INTEGER,
          estimated_time_remaining INTEGER,
          data_sources_active JSON,
          insights_discovered INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Dossiers main document
      await client.query(`
        CREATE TABLE IF NOT EXISTS dossiers (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          request_id VARCHAR(50) UNIQUE NOT NULL REFERENCES research_requests(request_id),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          company_name VARCHAR(200) NOT NULL,
          confidence_score INTEGER NOT NULL,
          source_count INTEGER NOT NULL,
          generated_at TIMESTAMP DEFAULT NOW(),
          last_updated TIMESTAMP DEFAULT NOW(),
          classification VARCHAR(50) DEFAULT 'PROPRIETARY',
          export_count INTEGER DEFAULT 0,
          is_archived BOOLEAN DEFAULT false
        )
      `);

      // Dossier content storage (full JSON)
      await client.query(`
        CREATE TABLE IF NOT EXISTS dossier_content (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          dossier_id UUID NOT NULL REFERENCES dossiers(id) ON DELETE CASCADE,
          request_id VARCHAR(50) NOT NULL REFERENCES research_requests(request_id),
          content_json JSONB NOT NULL,
          generated_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(dossier_id, request_id)
        )
      `);

      // Intelligence sections
      await client.query(`
        CREATE TABLE IF NOT EXISTS intelligence_sections (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          dossier_id UUID NOT NULL REFERENCES dossiers(id) ON DELETE CASCADE,
          section_type VARCHAR(50) NOT NULL,
          title VARCHAR(200) NOT NULL,
          confidence_score INTEGER NOT NULL,
          last_updated TIMESTAMP DEFAULT NOW(),
          is_expanded BOOLEAN DEFAULT false,
          display_order INTEGER NOT NULL
        )
      `);

      // Intelligence insights
      await client.query(`
        CREATE TABLE IF NOT EXISTS intelligence_insights (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          section_id UUID NOT NULL REFERENCES intelligence_sections(id) ON DELETE CASCADE,
          finding TEXT NOT NULL,
          evidence JSON,
          confidence VARCHAR(20) NOT NULL,
          actionable_recommendation TEXT,
          sources JSON,
          display_order INTEGER NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Data sources attribution
      await client.query(`
        CREATE TABLE IF NOT EXISTS data_sources (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          dossier_id UUID NOT NULL REFERENCES dossiers(id) ON DELETE CASCADE,
          name VARCHAR(100) NOT NULL,
          type VARCHAR(50) NOT NULL,
          last_updated TIMESTAMP NOT NULL,
          reliability DECIMAL(3,2) NOT NULL,
          url VARCHAR(500),
          api_response_time INTEGER,
          data_freshness_hours INTEGER
        )
      `);

      // DEV AGENT: Dossier Sharing & Permissions (PostgreSQL)
      await client.query(`
        CREATE TABLE IF NOT EXISTS dossier_shares (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          dossier_id UUID NOT NULL REFERENCES dossiers(id) ON DELETE CASCADE,
          shared_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          shared_with_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          shared_with_organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
          permission_level VARCHAR(20) NOT NULL CHECK (permission_level IN ('read', 'comment', 'export', 'admin')),
          expires_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT NOW(),
          is_active BOOLEAN DEFAULT true,
          CONSTRAINT check_share_target CHECK (
            (shared_with_user_id IS NOT NULL AND shared_with_organization_id IS NULL) OR
            (shared_with_user_id IS NULL AND shared_with_organization_id IS NOT NULL)
          )
        )
      `);

      // PHASE 1: Team Management (PostgreSQL) - departments already created above
      await client.query(`
        CREATE TABLE IF NOT EXISTS teams (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
          department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
          name VARCHAR(100) NOT NULL,
          description TEXT,
          lead_user_id UUID, -- Will add foreign key constraint later
          max_members INTEGER DEFAULT 10,
          team_type VARCHAR(20) NOT NULL DEFAULT 'custom' CHECK (team_type IN ('sales', 'marketing', 'research', 'executive', 'custom')),
          status VARCHAR(20) DEFAULT 'active',
          settings JSONB DEFAULT '{}',
          created_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(organization_id, name)
        )
      `);

      // API usage tracking
      await client.query(`
        CREATE TABLE IF NOT EXISTS api_usage (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID NOT NULL REFERENCES users(id),
          organization_id UUID NOT NULL REFERENCES organizations(id),
          request_id VARCHAR(50),
          endpoint VARCHAR(100) NOT NULL,
          method VARCHAR(10) NOT NULL,
          status_code INTEGER NOT NULL,
          processing_time_ms INTEGER,
          created_at TIMESTAMP DEFAULT NOW(),
          ip_address INET,
          user_agent TEXT,
          request_size_bytes INTEGER,
          response_size_bytes INTEGER
        )
      `);

      // WebSocket connections
      await client.query(`
        CREATE TABLE IF NOT EXISTS websocket_connections (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          connection_id VARCHAR(100) UNIQUE NOT NULL,
          user_id UUID NOT NULL REFERENCES users(id),
          request_id VARCHAR(50) NOT NULL,
          connected_at TIMESTAMP DEFAULT NOW(),
          last_ping TIMESTAMP DEFAULT NOW(),
          disconnected_at TIMESTAMP,
          disconnect_reason VARCHAR(100),
          message_count INTEGER DEFAULT 0
        )
      `);

      // WebSocket messages
      await client.query(`
        CREATE TABLE IF NOT EXISTS websocket_messages (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          request_id VARCHAR(50) NOT NULL,
          connection_id VARCHAR(100),
          message_type VARCHAR(50) NOT NULL,
          agent VARCHAR(50),
          stage VARCHAR(50),
          message_content TEXT NOT NULL,
          confidence DECIMAL(3,2),
          estimated_time_remaining INTEGER,
          data_sources_active JSON,
          insights_discovered INTEGER,
          created_at TIMESTAMP DEFAULT NOW(),
          delivered_at TIMESTAMP
        )
      `);

      // Migration: Fix confidence column type to support decimal values
      try {
        await client.query(`
          ALTER TABLE websocket_messages 
          ALTER COLUMN confidence TYPE DECIMAL(3,2)
        `);
      } catch (error: any) {
        // This might fail if the column is already the correct type or if there's data
        console.log('Note: Confidence column migration skipped (table may already be correct)');
      }

      // System performance monitoring
      await client.query(`
        CREATE TABLE IF NOT EXISTS system_performance (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          metric_name VARCHAR(100) NOT NULL,
          metric_value DECIMAL(10,2) NOT NULL,
          metric_unit VARCHAR(20),
          recorded_at TIMESTAMP DEFAULT NOW(),
          metadata JSON
        )
      `);

      // MACK CONSULTATION AGENT: Consultation sessions
      await client.query(`
        CREATE TABLE IF NOT EXISTS consultation_sessions (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
          team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
          status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned', 'error')),
          conversation_context JSONB NOT NULL DEFAULT '{}',
          business_context JSONB NOT NULL DEFAULT '{}',
          research_plan JSONB,
          created_at TIMESTAMP DEFAULT NOW(),
          completed_at TIMESTAMP,
          consultation_quality_score DECIMAL(3,2),
          CONSTRAINT valid_quality_score CHECK (consultation_quality_score >= 0 AND consultation_quality_score <= 1)
        )
      `);

      // MACK CONSULTATION AGENT: Consultation analytics and tracking
      await client.query(`
        CREATE TABLE IF NOT EXISTS consultation_analytics (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          session_id UUID NOT NULL REFERENCES consultation_sessions(id) ON DELETE CASCADE,
          completion_rate DECIMAL(3,2) NOT NULL,
          conversation_quality_score DECIMAL(3,2) NOT NULL,
          business_context_completeness DECIMAL(3,2) NOT NULL,
          research_relevance_correlation DECIMAL(3,2),
          user_satisfaction_score INTEGER CHECK (user_satisfaction_score >= 1 AND user_satisfaction_score <= 10),
          professional_credibility_rating INTEGER CHECK (professional_credibility_rating >= 1 AND professional_credibility_rating <= 10),
          performance_metrics JSONB DEFAULT '{}',
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // MACK CONSULTATION AGENT: User feedback and optimization
      await client.query(`
        CREATE TABLE IF NOT EXISTS consultation_feedback (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          session_id UUID NOT NULL REFERENCES consultation_sessions(id) ON DELETE CASCADE,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          feedback_type VARCHAR(50) NOT NULL CHECK (feedback_type IN ('satisfaction', 'credibility', 'relevance', 'experience')),
          rating INTEGER CHECK (rating >= 1 AND rating <= 10),
          feedback_text TEXT,
          improvement_suggestions TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Audit log
      await client.query(`
        CREATE TABLE IF NOT EXISTS audit_log (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID REFERENCES users(id),
          action VARCHAR(100) NOT NULL,
          resource_type VARCHAR(50) NOT NULL,
          resource_id VARCHAR(100),
          details JSON,
          ip_address INET,
          user_agent TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);

      await this.createPostgreSQLIndexes(client);
    } finally {
      client.release();
    }
  }

  private async createPostgreSQLIndexes(client: any): Promise<void> {
    // Performance indexes
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
      'CREATE INDEX IF NOT EXISTS idx_users_organization ON users(organization_id)',
      // PHASE 1: Organization Structure Indexes
      'CREATE INDEX IF NOT EXISTS idx_users_department ON users(department_id)',
      'CREATE INDEX IF NOT EXISTS idx_users_manager ON users(manager_user_id)',
      'CREATE INDEX IF NOT EXISTS idx_departments_organization ON departments(organization_id)',
      'CREATE INDEX IF NOT EXISTS idx_departments_head ON departments(head_user_id)',
      'CREATE INDEX IF NOT EXISTS idx_teams_department ON teams(department_id)',
      'CREATE INDEX IF NOT EXISTS idx_teams_lead ON teams(lead_user_id)',
      // End Phase 1 indexes
      'CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at)',
      'CREATE INDEX IF NOT EXISTS idx_research_requests_user ON research_requests(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_research_requests_status ON research_requests(status)',
      'CREATE INDEX IF NOT EXISTS idx_research_requests_created ON research_requests(created_at)',
      'CREATE INDEX IF NOT EXISTS idx_research_requests_company ON research_requests(company_name)',
      'CREATE INDEX IF NOT EXISTS idx_dossiers_request ON dossiers(request_id)',
      'CREATE INDEX IF NOT EXISTS idx_dossiers_user ON dossiers(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_intelligence_sections_dossier ON intelligence_sections(dossier_id)',
      'CREATE INDEX IF NOT EXISTS idx_intelligence_insights_section ON intelligence_insights(section_id)',
      'CREATE INDEX IF NOT EXISTS idx_data_sources_dossier ON data_sources(dossier_id)',
      'CREATE INDEX IF NOT EXISTS idx_api_usage_user ON api_usage(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_api_usage_created ON api_usage(created_at)',
      'CREATE INDEX IF NOT EXISTS idx_websocket_messages_request ON websocket_messages(request_id)',
      'CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at)',
      // MACK CONSULTATION AGENT: Consultation indexes
      'CREATE INDEX IF NOT EXISTS idx_consultation_sessions_user ON consultation_sessions(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_consultation_sessions_org ON consultation_sessions(organization_id)',
      'CREATE INDEX IF NOT EXISTS idx_consultation_sessions_status ON consultation_sessions(status)',
      'CREATE INDEX IF NOT EXISTS idx_consultation_sessions_created ON consultation_sessions(created_at)',
      'CREATE INDEX IF NOT EXISTS idx_consultation_analytics_session ON consultation_analytics(session_id)',
      'CREATE INDEX IF NOT EXISTS idx_consultation_feedback_session ON consultation_feedback(session_id)',
      'CREATE INDEX IF NOT EXISTS idx_consultation_feedback_user ON consultation_feedback(user_id)'
    ];

    for (const index of indexes) {
      await client.query(index);
    }
  }

  private async createSQLiteTables(): Promise<void> {
    if (!this.sqliteDb) throw new Error('SQLite not connected');

    const runAsync = (query: string) => {
      return new Promise<void>((resolve, reject) => {
        this.sqliteDb!.run(query, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    };

    // Organizations table (PHASE 1: Enhanced for enterprise)
    await runAsync(`
      CREATE TABLE IF NOT EXISTS organizations (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        domain TEXT UNIQUE NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        subscription_tier TEXT DEFAULT 'starter',
        max_users INTEGER DEFAULT 5,
        max_teams INTEGER DEFAULT 3,
        max_requests_per_month INTEGER DEFAULT 100,
        settings TEXT DEFAULT '{}',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT 1,
        billing_email TEXT,
        salesforce_org_id TEXT
      )
    `);

    // Users table with enhanced fields and SaaS subscription management
    await runAsync(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        organization_id TEXT REFERENCES organizations(id),
        -- PHASE 1: Organization Structure Fields  
        department_id TEXT REFERENCES departments(id),
        organization_role TEXT DEFAULT 'member',
        hire_date DATE,
        manager_user_id TEXT REFERENCES users(id),
        -- SaaS Subscription Fields
        subscription_plan TEXT DEFAULT 'starter',
        subscription_status TEXT DEFAULT 'trial',
        stripe_customer_id TEXT,
        stripe_subscription_id TEXT,
        trial_ends_at DATETIME,
        current_period_start DATETIME,
        current_period_end DATETIME,
        dossiers_used_this_month INTEGER DEFAULT 0,
        dossier_limit INTEGER DEFAULT 3,
        -- End SaaS Fields
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login DATETIME,
        is_active BOOLEAN DEFAULT 1,
        email_verified BOOLEAN DEFAULT 0,
        email_verification_token TEXT,
        password_reset_token TEXT,
        password_reset_expires DATETIME,
        -- GDPR Compliance Fields
        consent_marketing BOOLEAN DEFAULT 0,
        consent_analytics BOOLEAN DEFAULT 0,
        data_processing_consent BOOLEAN DEFAULT 1,
        gdpr_consent_date DATETIME,
        data_region TEXT DEFAULT 'US',
        gdpr_export_requested_at DATETIME,
        gdpr_deletion_requested_at DATETIME
      )
    `);

    // PHASE 1: Departments table
    await runAsync(`
      CREATE TABLE IF NOT EXISTS departments (
        id TEXT PRIMARY KEY,
        organization_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        head_user_id TEXT,
        budget_allocated DECIMAL(10,2) DEFAULT 0,
        settings TEXT DEFAULT '{}',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (organization_id) REFERENCES organizations(id),
        FOREIGN KEY (head_user_id) REFERENCES users(id)
      )
    `);

    // PHASE 1: Teams table
    await runAsync(`
      CREATE TABLE IF NOT EXISTS teams (
        id TEXT PRIMARY KEY,
        department_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        lead_user_id TEXT,
        max_members INTEGER DEFAULT 10,
        team_type TEXT DEFAULT 'project',
        status TEXT DEFAULT 'active',
        settings TEXT DEFAULT '{}',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (department_id) REFERENCES departments(id),
        FOREIGN KEY (lead_user_id) REFERENCES users(id)
      )
    `);

    // Continue with other tables adapted for SQLite...
    await runAsync(`
      CREATE TABLE IF NOT EXISTS research_requests (
        id TEXT PRIMARY KEY,
        request_id TEXT UNIQUE NOT NULL,
        user_id TEXT NOT NULL,
        organization_id TEXT NOT NULL,
        company_name TEXT NOT NULL,
        company_url TEXT,
        linkedin_url TEXT,
        crm_notes TEXT,
        organization_focus TEXT,
        location_of_interest TEXT,
        context_links TEXT,
        additional_context TEXT,
        status TEXT DEFAULT 'processing',
        priority TEXT DEFAULT 'standard',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        started_at DATETIME,
        completed_at DATETIME,
        estimated_completion INTEGER,
        actual_processing_time INTEGER,
        error_message TEXT,
        retry_count INTEGER DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (organization_id) REFERENCES organizations (id)
      )
    `);

    // JWT session management
    await runAsync(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        token_hash TEXT NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_used DATETIME DEFAULT CURRENT_TIMESTAMP,
        user_agent TEXT,
        ip_address TEXT,
        is_revoked BOOLEAN DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    // Agent progress tracking
    await runAsync(`
      CREATE TABLE IF NOT EXISTS agent_progress (
        id TEXT PRIMARY KEY,
        request_id TEXT NOT NULL,
        agent TEXT NOT NULL,
        stage TEXT NOT NULL,
        message TEXT NOT NULL,
        confidence INTEGER,
        estimated_time_remaining INTEGER,
        data_sources_active TEXT,
        insights_discovered INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (request_id) REFERENCES research_requests (request_id)
      )
    `);

    // YOLO: Add dossiers table for SQLite with user ownership
    await runAsync(`
      CREATE TABLE IF NOT EXISTS dossiers (
        id TEXT PRIMARY KEY,
        request_id TEXT UNIQUE NOT NULL,
        user_id TEXT NOT NULL,
        company_name TEXT NOT NULL,
        confidence_score INTEGER NOT NULL,
        source_count INTEGER NOT NULL,
        generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
        classification TEXT DEFAULT 'PROPRIETARY',
        export_count INTEGER DEFAULT 0,
        is_archived BOOLEAN DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (request_id) REFERENCES research_requests (request_id)
      )
    `);

    // Dossier content storage (full JSON) - SQLite version
    await runAsync(`
      CREATE TABLE IF NOT EXISTS dossier_content (
        id TEXT PRIMARY KEY,
        dossier_id TEXT NOT NULL,
        request_id TEXT NOT NULL,
        content_json TEXT NOT NULL,
        generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (dossier_id) REFERENCES dossiers (id) ON DELETE CASCADE,
        FOREIGN KEY (request_id) REFERENCES research_requests (request_id),
        UNIQUE(dossier_id, request_id)
      )
    `);

    // DEV AGENT: Dossier Sharing & Permissions Table
    await runAsync(`
      CREATE TABLE IF NOT EXISTS dossier_shares (
        id TEXT PRIMARY KEY,
        dossier_id TEXT NOT NULL,
        shared_by_user_id TEXT NOT NULL,
        shared_with_user_id TEXT,
        shared_with_organization_id TEXT,
        permission_level TEXT NOT NULL CHECK (permission_level IN ('read', 'comment', 'export', 'admin')),
        expires_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT 1,
        FOREIGN KEY (dossier_id) REFERENCES dossiers (id) ON DELETE CASCADE,
        FOREIGN KEY (shared_by_user_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (shared_with_user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `);

    // Add other essential tables for SQLite development
    await runAsync(`
      CREATE TABLE IF NOT EXISTS api_usage (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        organization_id TEXT NOT NULL,
        request_id TEXT,
        endpoint TEXT NOT NULL,
        method TEXT NOT NULL,
        status_code INTEGER NOT NULL,
        processing_time_ms INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        ip_address TEXT,
        user_agent TEXT,
        request_size_bytes INTEGER,
        response_size_bytes INTEGER,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (organization_id) REFERENCES organizations (id)
      )
    `);

    // WebSocket messages for persistence and replay
    await runAsync(`
      CREATE TABLE IF NOT EXISTS websocket_messages (
        id TEXT PRIMARY KEY,
        request_id TEXT NOT NULL,
        connection_id TEXT,
        message_type TEXT NOT NULL,
        agent TEXT,
        stage TEXT,
        message_content TEXT NOT NULL,
        confidence REAL,
        estimated_time_remaining INTEGER,
        data_sources_active TEXT,
        insights_discovered INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        delivered_at DATETIME
      )
    `);

    // WebSocket connections for tracking
    await runAsync(`
      CREATE TABLE IF NOT EXISTS websocket_connections (
        id TEXT PRIMARY KEY,
        connection_id TEXT UNIQUE NOT NULL,
        user_id TEXT NOT NULL,
        request_id TEXT NOT NULL,
        connected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_ping DATETIME DEFAULT CURRENT_TIMESTAMP,
        disconnected_at DATETIME,
        disconnect_reason TEXT,
        message_count INTEGER DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    // MACK CONSULTATION AGENT: Consultation sessions
    await runAsync(`
      CREATE TABLE IF NOT EXISTS consultation_sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        organization_id TEXT,
        team_id TEXT,
        status TEXT NOT NULL DEFAULT 'active',
        conversation_context TEXT NOT NULL DEFAULT '{}',
        business_context TEXT NOT NULL DEFAULT '{}',
        research_plan TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        completed_at DATETIME,
        consultation_quality_score DECIMAL(3,2),
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (organization_id) REFERENCES organizations (id),
        FOREIGN KEY (team_id) REFERENCES teams (id)
      )
    `);

    // MACK CONSULTATION AGENT: Consultation analytics
    await runAsync(`
      CREATE TABLE IF NOT EXISTS consultation_analytics (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        completion_rate DECIMAL(3,2) NOT NULL,
        conversation_quality_score DECIMAL(3,2) NOT NULL,
        business_context_completeness DECIMAL(3,2) NOT NULL,
        research_relevance_correlation DECIMAL(3,2),
        user_satisfaction_score INTEGER,
        professional_credibility_rating INTEGER,
        performance_metrics TEXT DEFAULT '{}',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES consultation_sessions (id)
      )
    `);

    // MACK CONSULTATION AGENT: User feedback
    await runAsync(`
      CREATE TABLE IF NOT EXISTS consultation_feedback (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        feedback_type TEXT NOT NULL,
        rating INTEGER,
        feedback_text TEXT,
        improvement_suggestions TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES consultation_sessions (id),
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    // Audit log
    await runAsync(`
      CREATE TABLE IF NOT EXISTS audit_log (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        action TEXT NOT NULL,
        resource_type TEXT NOT NULL,
        resource_id TEXT,
        details TEXT,
        ip_address TEXT,
        user_agent TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    // Create indexes for SQLite performance
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
      'CREATE INDEX IF NOT EXISTS idx_users_organization_id ON users(organization_id)',
      // PHASE 1: Organization Structure Indexes
      'CREATE INDEX IF NOT EXISTS idx_users_department_id ON users(department_id)',
      'CREATE INDEX IF NOT EXISTS idx_users_manager_user_id ON users(manager_user_id)',
      'CREATE INDEX IF NOT EXISTS idx_departments_organization_id ON departments(organization_id)',
      'CREATE INDEX IF NOT EXISTS idx_departments_head_user_id ON departments(head_user_id)',
      'CREATE INDEX IF NOT EXISTS idx_teams_department_id ON teams(department_id)',
      'CREATE INDEX IF NOT EXISTS idx_teams_lead_user_id ON teams(lead_user_id)',
      // End Phase 1 indexes
      'CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at)',
      'CREATE INDEX IF NOT EXISTS idx_research_requests_user_id ON research_requests(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_research_requests_status ON research_requests(status)',
      'CREATE INDEX IF NOT EXISTS idx_research_requests_created_at ON research_requests(created_at)',
      'CREATE INDEX IF NOT EXISTS idx_dossiers_request_id ON dossiers(request_id)',
      'CREATE INDEX IF NOT EXISTS idx_dossiers_user_id ON dossiers(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_dossier_shares_dossier_id ON dossier_shares(dossier_id)',
      'CREATE INDEX IF NOT EXISTS idx_dossier_shares_shared_with_user_id ON dossier_shares(shared_with_user_id)',
      'CREATE INDEX IF NOT EXISTS idx_api_usage_user_id ON api_usage(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_api_usage_created_at ON api_usage(created_at)',
      'CREATE INDEX IF NOT EXISTS idx_websocket_messages_request_id ON websocket_messages(request_id)',
      'CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at)',
      // MACK CONSULTATION AGENT: SQLite indexes
      'CREATE INDEX IF NOT EXISTS idx_consultation_sessions_user_id ON consultation_sessions(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_consultation_sessions_organization_id ON consultation_sessions(organization_id)',
      'CREATE INDEX IF NOT EXISTS idx_consultation_sessions_status ON consultation_sessions(status)',
      'CREATE INDEX IF NOT EXISTS idx_consultation_sessions_created_at ON consultation_sessions(created_at)',
      'CREATE INDEX IF NOT EXISTS idx_consultation_analytics_session_id ON consultation_analytics(session_id)',
      'CREATE INDEX IF NOT EXISTS idx_consultation_feedback_session_id ON consultation_feedback(session_id)',
      'CREATE INDEX IF NOT EXISTS idx_consultation_feedback_user_id ON consultation_feedback(user_id)'
    ];

    for (const index of indexes) {
      await runAsync(index);
    }
  }

  // Unified database operations interface
  public async query(sql: string, params: any[] = []): Promise<any[]> {
    if (this.config.type === 'postgresql') {
      if (!this.pgPool) throw new Error('PostgreSQL not connected');
      const client = await this.pgPool.connect();
      try {
        // Convert ? placeholders to $1, $2, etc. for PostgreSQL
        let convertedSql = sql;
        for (let i = 0; i < params.length; i++) {
          convertedSql = convertedSql.replace('?', `$${i + 1}`);
        }
        
        const result = await client.query(convertedSql, params);
        return result.rows;
      } finally {
        client.release();
      }
    } else {
      if (!this.sqliteDb) throw new Error('SQLite not connected');
      return new Promise((resolve, reject) => {
        this.sqliteDb!.all(sql, params, (err: Error | null, rows: any[]) => {
          if (err) reject(err);
          else resolve(rows || []);
        });
      });
    }
  }

  public async queryOne(sql: string, params: any[] = []): Promise<any | null> {
    if (this.config.type === 'postgresql') {
      if (!this.pgPool) throw new Error('PostgreSQL not connected');
      const client = await this.pgPool.connect();
      try {
        // Convert ? placeholders to $1, $2, etc. for PostgreSQL
        let convertedSql = sql;
        for (let i = 0; i < params.length; i++) {
          convertedSql = convertedSql.replace('?', `$${i + 1}`);
        }
        
        const result = await client.query(convertedSql, params);
        return result.rows[0] || null;
      } finally {
        client.release();
      }
    } else {
      if (!this.sqliteDb) throw new Error('SQLite not connected');
      return new Promise((resolve, reject) => {
        this.sqliteDb!.get(sql, params, (err: Error | null, row: any) => {
          if (err) reject(err);
          else resolve(row || null);
        });
      });
    }
  }

  public async execute(sql: string, params: any[] = []): Promise<any> {
    if (this.config.type === 'postgresql') {
      if (!this.pgPool) throw new Error('PostgreSQL not connected');
      const client = await this.pgPool.connect();
      try {
        // Convert ? placeholders to $1, $2, etc. for PostgreSQL
        let convertedSql = sql;
        for (let i = 0; i < params.length; i++) {
          convertedSql = convertedSql.replace('?', `$${i + 1}`);
        }
        
        const result = await client.query(convertedSql, params);
        return result;
      } finally {
        client.release();
      }
    } else {
      if (!this.sqliteDb) throw new Error('SQLite not connected');
      return new Promise((resolve, reject) => {
        this.sqliteDb!.run(sql, params, function(this: any, err: Error | null) {
          if (err) reject(err);
          else resolve({ lastID: this.lastID, changes: this.changes });
        });
      });
    }
  }

  // Transaction support
  public async transaction<T>(callback: (tx: any) => Promise<T>): Promise<T> {
    if (this.config.type === 'postgresql') {
      if (!this.pgPool) throw new Error('PostgreSQL not connected');
      const client = await this.pgPool.connect();
      try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } else {
      if (!this.sqliteDb) throw new Error('SQLite not connected');
      return new Promise((resolve, reject) => {
        this.sqliteDb!.serialize(async () => {
          try {
            this.sqliteDb!.run('BEGIN TRANSACTION');
            const result = await callback(this.sqliteDb);
            this.sqliteDb!.run('COMMIT');
            resolve(result);
          } catch (error) {
            this.sqliteDb!.run('ROLLBACK');
            reject(error);
          }
        });
      });
    }
  }

  public getConfig(): DatabaseConfig {
    return this.config;
  }

  public async close(): Promise<void> {
    if (this.pgPool) {
      await this.pgPool.end();
      console.log('PostgreSQL connection pool closed');
    }
    if (this.sqliteDb) {
      return new Promise((resolve, reject) => {
        this.sqliteDb!.close((err: Error | null) => {
          if (err) {
            reject(err);
          } else {
            console.log('SQLite database connection closed');
            resolve();
          }
        });
      });
    }
  }

  // Legacy methods for backward compatibility
  public getDatabase(): sqlite3.Database {
    if (!this.sqliteDb) {
      throw new Error('SQLite database not connected or PostgreSQL is being used');
    }
    return this.sqliteDb;
  }

  public async run(query: string, params: any[] = []): Promise<void> {
    await this.execute(query, params);
  }

  public async all(query: string, params: any[] = []): Promise<any[]> {
    return this.query(query, params);
  }

  public async get(query: string, params: any[] = []): Promise<any> {
    return this.queryOne(query, params);
  }

  // Migration management
  public async runMigrations(): Promise<void> {
    // Create migrations table if it doesn't exist
    if (this.config.type === 'postgresql') {
      await this.execute(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
          version VARCHAR(255) PRIMARY KEY,
          applied_at TIMESTAMP DEFAULT NOW()
        )
      `);
    } else {
      await this.execute(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
          version TEXT PRIMARY KEY,
          applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
    }

    // Get applied migrations
    const appliedMigrations = await this.query('SELECT version FROM schema_migrations ORDER BY version');
    const appliedVersions = new Set(appliedMigrations.map(m => m.version));

    // Load and run pending migrations
    const migrationsDir = path.join(__dirname, 'migrations');
    if (fs.existsSync(migrationsDir)) {
      const migrationFiles = fs.readdirSync(migrationsDir)
        .filter(file => file.endsWith('.ts') || file.endsWith('.js'))
        .sort();

      for (const file of migrationFiles) {
        const version = file.replace(/\.(ts|js)$/, '');
        if (!appliedVersions.has(version)) {
          console.log(`Running migration: ${version}`);
          const migrationPath = path.join(migrationsDir, file);
          const migration = require(migrationPath);
          
          if (migration.up) {
            await migration.up(this);
            await this.execute(
              'INSERT INTO schema_migrations (version) VALUES (?)',
              [version]
            );
            console.log(`Migration ${version} completed`);
          }
        }
      }
    }
  }

  public async rollbackMigration(version?: string): Promise<void> {
    if (!version) {
      // Rollback the latest migration
      const latest = await this.queryOne(
        'SELECT version FROM schema_migrations ORDER BY version DESC LIMIT 1'
      );
      if (!latest) {
        console.log('No migrations to rollback');
        return;
      }
      version = latest.version;
    }

    console.log(`Rolling back migration: ${version}`);
    const migrationPath = path.join(__dirname, 'migrations', `${version}.ts`);
    
    if (fs.existsSync(migrationPath)) {
      const migration = require(migrationPath);
      if (migration.down) {
        await migration.down(this);
        await this.execute('DELETE FROM schema_migrations WHERE version = ?', [version]);
        console.log(`Migration ${version} rolled back`);
      }
    } else {
      console.error(`Migration file not found: ${version}`);
    }
  }
}