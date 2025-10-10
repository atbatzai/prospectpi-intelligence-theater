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
          slug VARCHAR(100) UNIQUE NOT NULL,
          subscription_tier VARCHAR(50) DEFAULT 'starter',
          max_users INTEGER DEFAULT 5,
          max_requests_per_month INTEGER DEFAULT 100,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          is_active BOOLEAN DEFAULT true,
          billing_email VARCHAR(255),
          salesforce_org_id VARCHAR(100)
        )
      `);

      // Users table with enhanced fields
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          first_name VARCHAR(100) NOT NULL,
          last_name VARCHAR(100) NOT NULL,
          role VARCHAR(50) DEFAULT 'user',
          organization_id UUID REFERENCES organizations(id),
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          last_login TIMESTAMP,
          is_active BOOLEAN DEFAULT true,
          email_verified BOOLEAN DEFAULT false,
          email_verification_token VARCHAR(255),
          password_reset_token VARCHAR(255),
          password_reset_expires TIMESTAMP
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
          confidence INTEGER,
          estimated_time_remaining INTEGER,
          data_sources_active JSON,
          insights_discovered INTEGER,
          created_at TIMESTAMP DEFAULT NOW(),
          delivered_at TIMESTAMP
        )
      `);

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
      'CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at)',
      'CREATE INDEX IF NOT EXISTS idx_research_requests_user ON research_requests(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_research_requests_status ON research_requests(status)',
      'CREATE INDEX IF NOT EXISTS idx_research_requests_created ON research_requests(created_at)',
      'CREATE INDEX IF NOT EXISTS idx_research_requests_company ON research_requests(company_name)',
      'CREATE INDEX IF NOT EXISTS idx_dossiers_request ON dossiers(request_id)',
      'CREATE INDEX IF NOT EXISTS idx_intelligence_sections_dossier ON intelligence_sections(dossier_id)',
      'CREATE INDEX IF NOT EXISTS idx_intelligence_insights_section ON intelligence_insights(section_id)',
      'CREATE INDEX IF NOT EXISTS idx_data_sources_dossier ON data_sources(dossier_id)',
      'CREATE INDEX IF NOT EXISTS idx_api_usage_user ON api_usage(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_api_usage_created ON api_usage(created_at)',
      'CREATE INDEX IF NOT EXISTS idx_websocket_messages_request ON websocket_messages(request_id)',
      'CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at)'
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

    // Organizations table (simplified for SQLite)
    await runAsync(`
      CREATE TABLE IF NOT EXISTS organizations (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        subscription_tier TEXT DEFAULT 'starter',
        max_users INTEGER DEFAULT 5,
        max_requests_per_month INTEGER DEFAULT 100,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT 1,
        billing_email TEXT,
        salesforce_org_id TEXT
      )
    `);

    // Users table with enhanced fields
    await runAsync(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        organization_id TEXT REFERENCES organizations(id),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login DATETIME,
        is_active BOOLEAN DEFAULT 1,
        email_verified BOOLEAN DEFAULT 0,
        email_verification_token TEXT,
        password_reset_token TEXT,
        password_reset_expires DATETIME
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
        confidence INTEGER,
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
  }

  // Unified database operations interface
  public async query(sql: string, params: any[] = []): Promise<any[]> {
    if (this.config.type === 'postgresql') {
      if (!this.pgPool) throw new Error('PostgreSQL not connected');
      const client = await this.pgPool.connect();
      try {
        const result = await client.query(sql, params);
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
        const result = await client.query(sql, params);
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
        const result = await client.query(sql, params);
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