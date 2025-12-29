/**
 * ProspectPI Intelligence Theater - User Model & Service
 * Story 1.4: Database Schema & User Management
 */

import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { DatabaseManager } from '../database/DatabaseManager';

export interface User {
  id: string;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  role: string;
  organization_id: string | null;
  // PHASE 1: Organization Structure Enhancement
  department_id: string | null;
  organization_role: string | null; // 'org_admin' | 'dept_manager' | 'team_lead' | 'member' | 'viewer'
  hire_date: string | null;
  manager_user_id: string | null;
  // SaaS Subscription Fields
  subscription_plan: 'starter' | 'professional' | 'enterprise';
  subscription_status: 'active' | 'cancelled' | 'past_due' | 'trial' | 'unpaid';
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  trial_ends_at: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  dossiers_used_this_month: number;
  dossier_limit: number;
  // End SaaS Fields
  created_at: string;
  updated_at: string;
  last_login: string | null;
  is_active: boolean;
  email_verified: boolean;
  email_verification_token: string | null;
  password_reset_token: string | null;
  password_reset_expires: string | null;
  // GDPR Compliance Fields
  consent_marketing: boolean;
  consent_analytics: boolean;
  data_processing_consent: boolean;
  gdpr_consent_date: string | null;
  data_region: 'US' | 'EU' | 'UK' | 'CA' | null;
  gdpr_export_requested_at: string | null;
  gdpr_deletion_requested_at: string | null;
}

export interface Organization {
  id: string;
  name: string;
  domain: string; // PHASE 1: Email domain for automatic user association
  slug: string;
  subscription_tier: string;
  max_users: number;
  max_teams: number; // PHASE 1: Team limit
  max_requests_per_month: number;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  billing_email: string | null;
  salesforce_org_id: string | null;
  // PHASE 1: Enterprise settings
  settings: OrganizationSettings;
}

// PHASE 1: Organization settings for consultation and collaboration
export interface OrganizationSettings {
  allow_external_sharing: boolean;
  require_approval_for_sharing: boolean;
  consultation_default_enabled: boolean;
  data_retention_days: number;
}

// PHASE 1: Department structure
export interface Department {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  manager_user_id: string | null;
  created_at: string;
}

// PHASE 1: Team structure for consultation workflows
export interface Team {
  id: string;
  organization_id: string;
  department_id: string | null;
  name: string;
  description: string | null;
  team_lead_user_id: string | null;
  team_type: 'sales' | 'marketing' | 'research' | 'executive' | 'custom';
  created_at: string;
}

export interface UserSession {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: string;
  created_at: string;
  last_used: string;
  user_agent: string | null;
  ip_address: string | null;
  is_revoked: boolean;
}

export interface CreateUserInput {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  organization_id?: string;
  // GDPR Consent
  consent_marketing?: boolean;
  consent_analytics?: boolean;
  data_processing_consent?: boolean;
  data_region?: 'US' | 'EU' | 'UK' | 'CA';
}

export interface UpdateUserInput {
  first_name?: string;
  last_name?: string;
  email?: string;
  role?: string;
  // GDPR Consent Management
  consent_marketing?: boolean;
  consent_analytics?: boolean;
  data_processing_consent?: boolean;
  data_region?: 'US' | 'EU' | 'UK' | 'CA';
}

// GDPR Data Export Interface
export interface UserDataExport {
  user_profile: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    created_at: string;
    last_login: string | null;
    data_region: string | null;
  };
  consent_records: {
    marketing: boolean;
    analytics: boolean;
    data_processing: boolean;
    consent_date: string | null;
  };
  activity_log: any[];
  dossier_requests: any[];
  api_usage: any[];
}

// GDPR Consent Update Interface
export interface ConsentUpdateInput {
  consent_marketing: boolean;
  consent_analytics: boolean;
  data_processing_consent: boolean;
}

export interface AuthResult {
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  organizationId: string | null;
  sessionId: string;
  iat: number;
  exp: number;
}

export interface CreateOrgInput {
  name: string;
  domain: string; // PHASE 1: Email domain for automatic user association  
  slug: string;
  subscription_tier?: string;
  billing_email?: string;
}

export class UserService {
  private dbManager = DatabaseManager.getInstance();
  private jwtSecret = process.env.JWT_SECRET || 'your-secret-key';

  async createUser(input: CreateUserInput): Promise<User> {
    const existingUser = await this.getUserByEmail(input.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    const id = uuidv4();
    const password_hash = await bcrypt.hash(input.password, 12);
    const now = new Date().toISOString();
    const emailVerificationToken = uuidv4();

    // Set default subscription values for new users (7-day trial)
    const trialEndDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    
    // GDPR defaults based on user region
    const gdpr_consent_date = input.data_processing_consent ? now : null;
    const data_region = input.data_region || 'US';
    
    const user = await this.dbManager.queryOne(`
      INSERT INTO users (
        id, email, password_hash, first_name, last_name, 
        organization_id, department_id, organization_role, hire_date, manager_user_id,
        subscription_plan, subscription_status,
        trial_ends_at, dossiers_used_this_month, dossier_limit,
        created_at, updated_at, email_verification_token, is_active, email_verified,
        consent_marketing, consent_analytics, data_processing_consent, 
        gdpr_consent_date, data_region, gdpr_export_requested_at, gdpr_deletion_requested_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING *
    `, [
      id, input.email, password_hash, input.first_name, input.last_name,
      input.organization_id || null, null, 'member', null, null,
      'starter', 'trial', 
      trialEndDate, 0, 3, now, now, emailVerificationToken, true, false,
      input.consent_marketing || false, input.consent_analytics || false, 
      input.data_processing_consent || true, gdpr_consent_date, data_region, null, null
    ]);

    if (!user) {
      // For SQLite compatibility, return the created user manually
      return {
        id,
        email: input.email,
        password_hash,
        first_name: input.first_name,
        last_name: input.last_name,
        role: 'user',
        organization_id: input.organization_id || null,
        // PHASE 1: Organization fields
        department_id: null,
        organization_role: 'member',
        hire_date: null,
        manager_user_id: null,
        // End Phase 1 fields
        subscription_plan: 'starter',
        subscription_status: 'trial',
        stripe_customer_id: null,
        stripe_subscription_id: null,
        trial_ends_at: trialEndDate,
        current_period_start: null,
        current_period_end: null,
        dossiers_used_this_month: 0,
        dossier_limit: 3,
        created_at: now,
        updated_at: now,
        last_login: null,
        is_active: true,
        email_verified: false,
        email_verification_token: emailVerificationToken,
        password_reset_token: null,
        password_reset_expires: null,
        // GDPR Compliance Fields
        consent_marketing: input.consent_marketing || false,
        consent_analytics: input.consent_analytics || false,
        data_processing_consent: input.data_processing_consent || true,
        gdpr_consent_date: input.data_processing_consent ? now : null,
        data_region: input.data_region || 'US',
        gdpr_export_requested_at: null,
        gdpr_deletion_requested_at: null
      };
    }

    return user;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return this.dbManager.queryOne('SELECT * FROM users WHERE email = ?', [email]);
  }

  async getUserById(id: string): Promise<User | null> {
    return this.dbManager.queryOne('SELECT * FROM users WHERE id = ?', [id]);
  }

  async updateUser(userId: string, updates: UpdateUserInput): Promise<User> {
    const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(updates), new Date().toISOString(), userId];
    
    await this.dbManager.execute(`
      UPDATE users 
      SET ${setClause}, updated_at = ?
      WHERE id = ?
    `, values);
    
    const updatedUser = await this.getUserById(userId);
    if (!updatedUser) throw new Error('User not found after update');
    return updatedUser;
  }

  async deactivateUser(userId: string): Promise<void> {
    await this.dbManager.execute(
      'UPDATE users SET is_active = ? WHERE id = ?',
      [false, userId]
    );
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  // Authentication methods
  async authenticateUser(email: string, password: string): Promise<AuthResult> {
    const user = await this.getUserByEmail(email);
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    if (!user.is_active) {
      return { success: false, error: 'Account is deactivated' };
    }

    const isValidPassword = await this.verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      return { success: false, error: 'Invalid password' };
    }

    // Update last login
    await this.dbManager.execute(
      'UPDATE users SET last_login = ? WHERE id = ?',
      [new Date().toISOString(), user.id]
    );

    const token = await this.generateJWT(user);
    return { success: true, user, token };
  }

  // SaaS Subscription Management Methods
  async canGenerateDossier(userId: string): Promise<{ canGenerate: boolean; reason?: string }> {
    const user = await this.getUserById(userId);
    if (!user) {
      return { canGenerate: false, reason: 'User not found' };
    }

    // Check subscription status
    if (user.subscription_status === 'cancelled' || user.subscription_status === 'past_due') {
      return { canGenerate: false, reason: 'Subscription inactive' };
    }

    // Check trial expiry
    if (user.subscription_status === 'trial' && user.trial_ends_at) {
      const trialEnd = new Date(user.trial_ends_at);
      if (trialEnd < new Date()) {
        return { canGenerate: false, reason: 'Trial expired' };
      }
    }

    // Check monthly limits
    if (user.dossiers_used_this_month >= user.dossier_limit) {
      return { canGenerate: false, reason: 'Monthly limit reached' };
    }

    return { canGenerate: true };
  }

  async incrementDossierUsage(userId: string): Promise<void> {
    await this.dbManager.execute(
      'UPDATE users SET dossiers_used_this_month = dossiers_used_this_month + 1 WHERE id = ?',
      [userId]
    );
  }

  async updateSubscription(userId: string, subscription: {
    plan: 'starter' | 'professional' | 'enterprise';
    status: 'active' | 'cancelled' | 'past_due' | 'trial' | 'unpaid';
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    currentPeriodStart?: string;
    currentPeriodEnd?: string;
  }): Promise<void> {
    const dossierLimits = {
      starter: 10,
      professional: 100, 
      enterprise: 1000
    };

    await this.dbManager.execute(`
      UPDATE users SET 
        subscription_plan = ?,
        subscription_status = ?,
        stripe_customer_id = ?,
        stripe_subscription_id = ?,
        current_period_start = ?,
        current_period_end = ?,
        dossier_limit = ?,
        updated_at = ?
      WHERE id = ?
    `, [
      subscription.plan,
      subscription.status,
      subscription.stripeCustomerId || null,
      subscription.stripeSubscriptionId || null,
      subscription.currentPeriodStart || null,
      subscription.currentPeriodEnd || null,
      dossierLimits[subscription.plan],
      new Date().toISOString(),
      userId
    ]);
  }

  async generateJWT(user: User): Promise<string> {
    const sessionId = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create session record
    await this.dbManager.execute(`
      INSERT INTO user_sessions (id, user_id, token_hash, expires_at)
      VALUES (?, ?, ?, ?)
    `, [sessionId, user.id, 'placeholder-hash', expiresAt.toISOString()]);

    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organization_id,
      sessionId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(expiresAt.getTime() / 1000)
    };

    const token = jwt.sign(payload, this.jwtSecret);
    
    // Update session with actual token hash
    const tokenHash = await bcrypt.hash(token, 10);
    await this.dbManager.execute(
      'UPDATE user_sessions SET token_hash = ? WHERE id = ?',
      [tokenHash, sessionId]
    );

    return token;
  }

  async validateJWT(token: string): Promise<JWTPayload> {
    return new Promise((resolve, reject) => {
      jwt.verify(token, this.jwtSecret, (err, decoded) => {
        if (err) reject(err);
        else resolve(decoded as JWTPayload);
      });
    });
  }

  async createSession(userId: string, userAgent: string, ipAddress: string): Promise<UserSession> {
    const sessionId = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const now = new Date().toISOString();

    const session = await this.dbManager.queryOne(`
      INSERT INTO user_sessions (
        id, user_id, token_hash, expires_at, user_agent, ip_address, created_at, last_used
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING *
    `, [sessionId, userId, 'temp-hash', expiresAt.toISOString(), userAgent, ipAddress, now, now]);

    return session;
  }

  async validateSession(tokenHash: string): Promise<UserSession | null> {
    return this.dbManager.queryOne(`
      SELECT * FROM user_sessions 
      WHERE token_hash = ? AND expires_at > ? AND is_revoked = false
    `, [tokenHash, new Date().toISOString()]);
  }

  async revokeSession(sessionId: string): Promise<void> {
    await this.dbManager.execute(
      'UPDATE user_sessions SET is_revoked = true WHERE id = ?',
      [sessionId]
    );
  }

  async cleanupExpiredSessions(): Promise<number> {
    const result = await this.dbManager.execute(
      'DELETE FROM user_sessions WHERE expires_at < ?',
      [new Date().toISOString()]
    );
    return result.changes || result.rowCount || 0;
  }

  // GDPR Compliance Methods
  
  async updateUserConsent(userId: string, consent: ConsentUpdateInput): Promise<void> {
    const now = new Date().toISOString();
    await this.dbManager.execute(`
      UPDATE users 
      SET consent_marketing = ?, consent_analytics = ?, data_processing_consent = ?,
          gdpr_consent_date = ?, updated_at = ?
      WHERE id = ?
    `, [
      consent.consent_marketing,
      consent.consent_analytics, 
      consent.data_processing_consent,
      now,
      now,
      userId
    ]);
  }

  async exportUserData(userId: string): Promise<UserDataExport> {
    // Update export request timestamp
    await this.dbManager.execute(
      'UPDATE users SET gdpr_export_requested_at = ? WHERE id = ?',
      [new Date().toISOString(), userId]
    );

    // Get user profile
    const user = await this.getUserById(userId);
    if (!user) throw new Error('User not found');

    // Get audit logs
    const { AuditService } = await import('../services/AuditService');
    const auditService = new AuditService();
    const activityLog = await auditService.getUserActivity(userId, 1000);

    // Get dossier requests
    const dossierRequests = await this.dbManager.query(`
      SELECT request_id, company_name, status, created_at
      FROM research_requests 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `, [userId]);

    // Get API usage
    const apiUsage = await this.dbManager.query(`
      SELECT endpoint, method, status_code, created_at
      FROM api_usage 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT 1000
    `, [userId]);

    return {
      user_profile: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        created_at: user.created_at,
        last_login: user.last_login,
        data_region: user.data_region
      },
      consent_records: {
        marketing: user.consent_marketing,
        analytics: user.consent_analytics,
        data_processing: user.data_processing_consent,
        consent_date: user.gdpr_consent_date
      },
      activity_log: activityLog,
      dossier_requests: dossierRequests || [],
      api_usage: apiUsage || []
    };
  }

  async requestAccountDeletion(userId: string): Promise<void> {
    const now = new Date().toISOString();
    await this.dbManager.execute(`
      UPDATE users 
      SET gdpr_deletion_requested_at = ?, is_active = false, updated_at = ?
      WHERE id = ?
    `, [now, now, userId]);
  }

  async deleteUserAccount(userId: string, force: boolean = false): Promise<void> {
    const user = await this.getUserById(userId);
    if (!user) throw new Error('User not found');

    if (!force && !user.gdpr_deletion_requested_at) {
      throw new Error('Account deletion must be requested first');
    }

    // Delete in order to maintain referential integrity
    await this.dbManager.execute('DELETE FROM user_sessions WHERE user_id = ?', [userId]);
    await this.dbManager.execute('DELETE FROM api_usage WHERE user_id = ?', [userId]);
    await this.dbManager.execute('UPDATE research_requests SET user_id = NULL WHERE user_id = ?', [userId]);
    await this.dbManager.execute('UPDATE dossiers SET user_id = NULL WHERE user_id = ?', [userId]);
    await this.dbManager.execute('DELETE FROM audit_log WHERE user_id = ?', [userId]);
    await this.dbManager.execute('DELETE FROM users WHERE id = ?', [userId]);
  }

  async setUserDataRegion(userId: string, region: 'US' | 'EU' | 'UK' | 'CA'): Promise<void> {
    await this.dbManager.execute(`
      UPDATE users SET data_region = ?, updated_at = ? WHERE id = ?
    `, [region, new Date().toISOString(), userId]);
  }
}

// Organization Service
export class OrganizationService {
  private dbManager = DatabaseManager.getInstance();

  async createOrganization(orgData: CreateOrgInput): Promise<Organization> {
    const existingOrg = await this.getOrganizationBySlug(orgData.slug);
    if (existingOrg) {
      throw new Error('Organization with this slug already exists');
    }

    const id = uuidv4();
    const now = new Date().toISOString();

    const organization = await this.dbManager.queryOne(`
      INSERT INTO organizations (
        id, name, domain, slug, subscription_tier, max_teams, billing_email, 
        settings, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING *
    `, [
      id, orgData.name, orgData.domain, orgData.slug, 
      orgData.subscription_tier || 'starter', 3,
      orgData.billing_email || null,
      JSON.stringify({
        allow_external_sharing: false,
        require_approval_for_sharing: true,
        consultation_default_enabled: true,
        data_retention_days: 365
      }),
      now, now
    ]);

    if (!organization) {
      // SQLite fallback
      return {
        id,
        name: orgData.name,
        domain: orgData.domain || `${orgData.slug}.company.com`,
        slug: orgData.slug,
        subscription_tier: orgData.subscription_tier || 'starter',
        max_users: 5,
        max_teams: 3, // PHASE 1: Default team limit
        max_requests_per_month: 100,
        created_at: now,
        updated_at: now,
        is_active: true,
        billing_email: orgData.billing_email || null,
        salesforce_org_id: null,
        // PHASE 1: Default organization settings
        settings: {
          allow_external_sharing: false,
          require_approval_for_sharing: true,
          consultation_default_enabled: true,
          data_retention_days: 365
        }
      };
    }

    return organization;
  }

  async getOrganizationById(id: string): Promise<Organization | null> {
    return this.dbManager.queryOne('SELECT * FROM organizations WHERE id = ?', [id]);
  }

  // PHASE 1: Department Management
  async createDepartment(orgId: string, name: string, description?: string, managerId?: string): Promise<Department> {
    const id = uuidv4();
    const now = new Date().toISOString();

    const department = await this.dbManager.queryOne(`
      INSERT INTO departments (id, organization_id, name, description, manager_user_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
      RETURNING *
    `, [id, orgId, name, description || null, managerId || null, now]);

    if (!department) {
      return {
        id,
        organization_id: orgId,
        name,
        description: description ?? null,
        manager_user_id: managerId || null,
        created_at: now
      };
    }

    return department;
  }

  async getDepartmentsByOrganization(orgId: string): Promise<Department[]> {
    return this.dbManager.query('SELECT * FROM departments WHERE organization_id = ? ORDER BY name', [orgId]);
  }

  // PHASE 1: Team Management 
  async createTeam(
    orgId: string, 
    name: string, 
    options: {
      departmentId?: string;
      description?: string;
      teamLeadId?: string;
      teamType?: 'sales' | 'marketing' | 'research' | 'executive' | 'custom';
    } = {}
  ): Promise<Team> {
    const id = uuidv4();
    const now = new Date().toISOString();

    const team = await this.dbManager.queryOne(`
      INSERT INTO teams (
        id, organization_id, department_id, name, description, 
        team_lead_user_id, team_type, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING *
    `, [
      id, orgId, options.departmentId || null, name, 
      options.description || null, options.teamLeadId || null,
      options.teamType || 'custom', now
    ]);

    if (!team) {
      return {
        id,
        organization_id: orgId,
        department_id: options.departmentId ?? null,
        name,
        description: options.description ?? null,
        team_lead_user_id: options.teamLeadId || null,
        team_type: options.teamType || 'custom',
        created_at: now
      };
    }

    return team;
  }

  async getTeamsByOrganization(orgId: string): Promise<Team[]> {
    return this.dbManager.query('SELECT * FROM teams WHERE organization_id = ? ORDER BY name', [orgId]);
  }

  async getUsersByOrganization(orgId: string): Promise<User[]> {
    return this.dbManager.query('SELECT * FROM users WHERE organization_id = ? ORDER BY first_name, last_name', [orgId]);
  }

  async getOrganizationBySlug(slug: string): Promise<Organization | null> {
    return this.dbManager.queryOne('SELECT * FROM organizations WHERE slug = ?', [slug]);
  }

  async addUserToOrganization(userId: string, orgId: string): Promise<void> {
    // Check if organization exists and has available slots
    const org = await this.getOrganizationById(orgId);
    if (!org) throw new Error('Organization not found');

    const userCount = await this.dbManager.queryOne(
      'SELECT COUNT(*) as count FROM users WHERE organization_id = ?',
      [orgId]
    );

    if (userCount.count >= org.max_users) {
      throw new Error('Organization has reached maximum user limit');
    }

    await this.dbManager.execute(
      'UPDATE users SET organization_id = ? WHERE id = ?',
      [orgId, userId]
    );
  }

  async getUserOrganization(userId: string): Promise<Organization | null> {
    const result = await this.dbManager.queryOne(`
      SELECT o.* FROM organizations o
      JOIN users u ON u.organization_id = o.id
      WHERE u.id = ?
    `, [userId]);

    return result;
  }

  async getOrganizationUsers(orgId: string): Promise<User[]> {
    return this.dbManager.query(
      'SELECT * FROM users WHERE organization_id = ? AND is_active = true',
      [orgId]
    );
  }

  // PHASE 1: Additional methods for organization management API
  async getOrganizationMembers(organizationId: string): Promise<User[]> {
    return this.dbManager.query(`
      SELECT 
        id, email, first_name, last_name, role, organization_role, 
        department_id, hire_date, manager_user_id, created_at, last_login
      FROM users 
      WHERE organization_id = ? AND is_active = true
      ORDER BY first_name, last_name
    `, [organizationId]);
  }

  async getTeamsByDepartment(departmentId: string): Promise<Team[]> {
    return this.dbManager.query(`
      SELECT * FROM teams 
      WHERE department_id = ? AND status = 'active'
      ORDER by name
    `, [departmentId]);
  }
}