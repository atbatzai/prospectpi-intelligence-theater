/**
 * Migration 001: Initial Schema
 * Story 1.4: Database Schema & User Management
 */

import { DatabaseManager, Migration } from '../DatabaseManager';

export const up = async (manager: DatabaseManager): Promise<void> => {
  console.log('Creating initial schema...');
  
  const config = manager.getConfig();
  
  if (config.type === 'postgresql') {
    // Enable UUID extension
    await manager.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    
    // Create initial tables with full schema
    await manager.execute(`
      CREATE TABLE organizations (
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
  } else {
    // SQLite version
    await manager.execute(`
      CREATE TABLE organizations (
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
  }
  
  console.log('Initial schema created successfully');
};

export const down = async (manager: DatabaseManager): Promise<void> => {
  console.log('Rolling back initial schema...');
  
  await manager.execute('DROP TABLE IF EXISTS organizations CASCADE');
  
  console.log('Initial schema rollback completed');
};

export const migration: Migration = {
  version: '001',
  description: 'Initial database schema with organizations',
  up,
  down
};