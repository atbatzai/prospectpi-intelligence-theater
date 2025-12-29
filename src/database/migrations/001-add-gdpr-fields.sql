-- GDPR Compliance Migration
-- Adds consent management and data subject rights fields to users table
-- ProspectPI Intelligence Theater - Minimal GDPR Enhancement

-- PostgreSQL version
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS consent_marketing BOOLEAN DEFAULT false;
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS consent_analytics BOOLEAN DEFAULT false;
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS data_processing_consent BOOLEAN DEFAULT true;
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS gdpr_consent_date TIMESTAMP;
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS data_region VARCHAR(10) DEFAULT 'US';
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS gdpr_export_requested_at TIMESTAMP;
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS gdpr_deletion_requested_at TIMESTAMP;

-- SQLite version (for development)
-- Note: SQLite doesn't support ADD COLUMN IF NOT EXISTS, so use this approach:

-- Create a backup table
DROP TABLE IF EXISTS users_backup;
CREATE TABLE users_backup AS SELECT * FROM users;

-- Create new users table with GDPR fields
DROP TABLE users;
CREATE TABLE users (
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
);

-- Migrate existing data
INSERT INTO users (
    id, email, password_hash, first_name, last_name, role, organization_id,
    department_id, organization_role, hire_date, manager_user_id,
    subscription_plan, subscription_status, stripe_customer_id, stripe_subscription_id,
    trial_ends_at, current_period_start, current_period_end, 
    dossiers_used_this_month, dossier_limit,
    created_at, updated_at, last_login, is_active, email_verified,
    email_verification_token, password_reset_token, password_reset_expires,
    -- Set default GDPR values for existing users
    consent_marketing, consent_analytics, data_processing_consent, 
    gdpr_consent_date, data_region, gdpr_export_requested_at, gdpr_deletion_requested_at
)
SELECT 
    id, email, password_hash, first_name, last_name, role, organization_id,
    department_id, organization_role, hire_date, manager_user_id,
    subscription_plan, subscription_status, stripe_customer_id, stripe_subscription_id,
    trial_ends_at, current_period_start, current_period_end,
    dossiers_used_this_month, dossier_limit,
    created_at, updated_at, last_login, is_active, email_verified,
    email_verification_token, password_reset_token, password_reset_expires,
    -- GDPR defaults for existing users
    0, 0, 1, datetime('now'), 'US', NULL, NULL
FROM users_backup;

-- Create indexes for GDPR fields
CREATE INDEX idx_users_data_region ON users(data_region);
CREATE INDEX idx_users_gdpr_export_requested ON users(gdpr_export_requested_at);
CREATE INDEX idx_users_gdpr_deletion_requested ON users(gdpr_deletion_requested_at);
CREATE INDEX idx_users_consent_date ON users(gdpr_consent_date);

-- Clean up
DROP TABLE users_backup;

-- Migration completed
INSERT INTO system_log (level, message, created_at) 
VALUES ('INFO', 'GDPR compliance fields migration completed successfully', datetime('now'));