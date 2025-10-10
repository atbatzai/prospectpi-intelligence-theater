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
  created_at: string;
  updated_at: string;
  last_login: string | null;
  is_active: boolean;
  email_verified: boolean;
  email_verification_token: string | null;
  password_reset_token: string | null;
  password_reset_expires: string | null;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  subscription_tier: string;
  max_users: number;
  max_requests_per_month: number;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  billing_email: string | null;
  salesforce_org_id: string | null;
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
}

export interface UpdateUserInput {
  first_name?: string;
  last_name?: string;
  email?: string;
  role?: string;
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

    const user = await this.dbManager.queryOne(`
      INSERT INTO users (
        id, email, password_hash, first_name, last_name, 
        organization_id, created_at, updated_at, 
        email_verification_token, is_active, email_verified
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING *
    `, [
      id, input.email, password_hash, input.first_name, input.last_name,
      input.organization_id || null, now, now, 
      emailVerificationToken, true, false
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
        created_at: now,
        updated_at: now,
        last_login: null,
        is_active: true,
        email_verified: false,
        email_verification_token: emailVerificationToken,
        password_reset_token: null,
        password_reset_expires: null
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
        id, name, slug, subscription_tier, billing_email, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
      RETURNING *
    `, [
      id, orgData.name, orgData.slug, 
      orgData.subscription_tier || 'starter',
      orgData.billing_email || null,
      now, now
    ]);

    if (!organization) {
      // SQLite fallback
      return {
        id,
        name: orgData.name,
        slug: orgData.slug,
        subscription_tier: orgData.subscription_tier || 'starter',
        max_users: 5,
        max_requests_per_month: 100,
        created_at: now,
        updated_at: now,
        is_active: true,
        billing_email: orgData.billing_email || null,
        salesforce_org_id: null
      };
    }

    return organization;
  }

  async getOrganizationById(id: string): Promise<Organization | null> {
    return this.dbManager.queryOne('SELECT * FROM organizations WHERE id = ?', [id]);
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
}