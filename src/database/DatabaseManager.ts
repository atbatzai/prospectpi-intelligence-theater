/**
 * ProspectPI Intelligence Theater - Database Manager
 * Story 1.2: REST API Endpoints & Request Handling
 */

import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

export class DatabaseManager {
  private static instance: DatabaseManager;
  private db: sqlite3.Database | null = null;

  private constructor() {}

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

  private async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const dbPath = path.join(process.cwd(), 'data', 'prospectpi.db');
      
      // Ensure data directory exists
      const dataDir = path.dirname(dbPath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      this.db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          reject(err);
        } else {
          console.log('Connected to SQLite database');
          resolve();
        }
      });
    });
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not connected');

    const runAsync = promisify(this.db.run.bind(this.db));

    // Users table
    await runAsync(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Research requests table
    await runAsync(`
      CREATE TABLE IF NOT EXISTS research_requests (
        id TEXT PRIMARY KEY,
        request_id TEXT UNIQUE NOT NULL,
        user_id TEXT NOT NULL,
        company_name TEXT NOT NULL,
        company_url TEXT,
        linkedin_url TEXT,
        crm_notes TEXT,
        organization_focus TEXT,
        location_of_interest TEXT,
        context_links TEXT, -- JSON string
        additional_context TEXT,
        status TEXT DEFAULT 'processing',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        completed_at DATETIME,
        estimated_completion INTEGER,
        error_message TEXT,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    // API usage tracking table
    await runAsync(`
      CREATE TABLE IF NOT EXISTS api_usage (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        request_id TEXT NOT NULL,
        endpoint TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        processing_time_ms INTEGER,
        success BOOLEAN,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    // WebSocket messages table for persistence and replay (Story 1.3)
    await runAsync(`
      CREATE TABLE IF NOT EXISTS websocket_messages (
        id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
        request_id TEXT NOT NULL,
        message_type TEXT NOT NULL,
        agent TEXT,
        stage TEXT,
        message_content TEXT NOT NULL,
        confidence INTEGER,
        estimated_time_remaining INTEGER,
        data_sources_active TEXT, -- JSON string
        insights_discovered INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        delivered_at DATETIME
      )
    `);

    // WebSocket connections table for connection tracking
    await runAsync(`
      CREATE TABLE IF NOT EXISTS websocket_connections (
        id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
        connection_id TEXT UNIQUE NOT NULL,
        user_id TEXT NOT NULL,
        request_id TEXT NOT NULL,
        connected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_ping DATETIME DEFAULT CURRENT_TIMESTAMP,
        disconnected_at DATETIME,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    console.log('Database tables created successfully');
  }

  public getDatabase(): sqlite3.Database {
    if (!this.db) {
      throw new Error('Database not connected');
    }
    return this.db;
  }

  // Async database operations for WebSocket functionality
  public async run(query: string, params: any[] = []): Promise<void> {
    if (!this.db) throw new Error('Database not connected');
    return new Promise((resolve, reject) => {
      this.db!.run(query, params, function(err) {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  public async all(query: string, params: any[] = []): Promise<any[]> {
    if (!this.db) throw new Error('Database not connected');
    return new Promise((resolve, reject) => {
      this.db!.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  public async get(query: string, params: any[] = []): Promise<any> {
    if (!this.db) throw new Error('Database not connected');
    return new Promise((resolve, reject) => {
      this.db!.get(query, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  public async close(): Promise<void> {
    if (this.db) {
      return new Promise((resolve, reject) => {
        this.db!.close((err) => {
          if (err) {
            reject(err);
          } else {
            console.log('Database connection closed');
            resolve();
          }
        });
      });
    }
  }
}