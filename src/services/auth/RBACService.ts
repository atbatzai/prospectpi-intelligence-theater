/**
 * Role-Based Access Control (RBAC) Service
 * Story 5.1: Enterprise Authentication - RBAC
 */

import { DatabaseManager } from '../../database/DatabaseManager';
import { v4 as uuidv4 } from 'uuid';

export enum Permission {
  // User Management
  USER_READ = 'user:read',
  USER_WRITE = 'user:write',
  USER_DELETE = 'user:delete',
  
  // Organization Management
  ORG_READ = 'org:read',
  ORG_WRITE = 'org:write',
  ORG_DELETE = 'org:delete',
  
  // Research/Dossier Management
  RESEARCH_READ = 'research:read',
  RESEARCH_CREATE = 'research:create',
  RESEARCH_DELETE = 'research:delete',
  
  // API Key Management
  API_KEY_READ = 'apikey:read',
  API_KEY_WRITE = 'apikey:write',
  
  // Analytics Access
  ANALYTICS_READ = 'analytics:read',
  ANALYTICS_WRITE = 'analytics:write',
  ANALYTICS_EXPORT = 'analytics:export',
  
  // Admin Functions
  ADMIN_SETTINGS = 'admin:settings',
  ADMIN_FULL = 'admin:full'
}

export enum Role {
  SUPER_ADMIN = 'super_admin',
  ORG_ADMIN = 'org_admin',
  MANAGER = 'manager',
  ANALYST = 'analyst',
  VIEWER = 'viewer'
}

interface RolePermissions {
  role: Role;
  permissions: Permission[];
}

class RBACService {
  private dbManager: DatabaseManager;
  private rolePermissions: Map<Role, Permission[]> = new Map();

  constructor() {
    this.dbManager = DatabaseManager.getInstance();
    this.initializeRoles();
  }

  async init(): Promise<void> {
    await this.initializeDatabase();
  }

  private async initializeDatabase(): Promise<void> {
    // Roles table
    await this.dbManager.execute(`
      CREATE TABLE IF NOT EXISTS roles (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        permissions TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // User roles table (many-to-many)
    await this.dbManager.execute(`
      CREATE TABLE IF NOT EXISTS user_roles (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        role_id TEXT NOT NULL,
        organization_id TEXT,
        granted_by TEXT,
        granted_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
        UNIQUE(user_id, role_id, organization_id)
      )
    `);

    // Seed default roles
    await this.seedDefaultRoles();
  }

  private initializeRoles(): void {
    // Super Admin - all permissions
    this.rolePermissions.set(Role.SUPER_ADMIN, Object.values(Permission));

    // Org Admin - organization-level admin
    this.rolePermissions.set(Role.ORG_ADMIN, [
      Permission.USER_READ,
      Permission.USER_WRITE,
      Permission.ORG_READ,
      Permission.ORG_WRITE,
      Permission.RESEARCH_READ,
      Permission.RESEARCH_CREATE,
      Permission.RESEARCH_DELETE,
      Permission.API_KEY_READ,
      Permission.API_KEY_WRITE,
      Permission.ANALYTICS_READ,
      Permission.ANALYTICS_EXPORT
    ]);

    // Manager - team management
    this.rolePermissions.set(Role.MANAGER, [
      Permission.USER_READ,
      Permission.RESEARCH_READ,
      Permission.RESEARCH_CREATE,
      Permission.RESEARCH_DELETE,
      Permission.ANALYTICS_READ,
      Permission.ANALYTICS_EXPORT
    ]);

    // Analyst - research execution
    this.rolePermissions.set(Role.ANALYST, [
      Permission.RESEARCH_READ,
      Permission.RESEARCH_CREATE,
      Permission.ANALYTICS_READ
    ]);

    // Viewer - read-only
    this.rolePermissions.set(Role.VIEWER, [
      Permission.RESEARCH_READ,
      Permission.ANALYTICS_READ
    ]);
  }

  private async seedDefaultRoles(): Promise<void> {
    for (const [role, permissions] of this.rolePermissions.entries()) {
      await this.dbManager.execute(`
        INSERT OR IGNORE INTO roles (id, name, description, permissions)
        VALUES (?, ?, ?, ?)
      `, [
        uuidv4(),
        role,
        this.getRoleDescription(role),
        JSON.stringify(permissions)
      ]);
    }
  }

  private getRoleDescription(role: Role): string {
    const descriptions: Record<Role, string> = {
      [Role.SUPER_ADMIN]: 'Full system access across all organizations',
      [Role.ORG_ADMIN]: 'Organization administrator with full org-level access',
      [Role.MANAGER]: 'Team manager with research and analytics access',
      [Role.ANALYST]: 'Research analyst with execution permissions',
      [Role.VIEWER]: 'Read-only access to research and analytics'
    };
    return descriptions[role];
  }

  async assignRole(userId: string, role: Role, organizationId?: string, grantedBy?: string): Promise<void> {
    await this.initializeDatabase();

    const roleRecord = await this.dbManager.get(
      'SELECT id FROM roles WHERE name = ?',
      [role]
    );

    if (!roleRecord) {
      throw new Error(`Role ${role} not found`);
    }

    await this.dbManager.execute(`
      INSERT INTO user_roles (id, user_id, role_id, organization_id, granted_by)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT (user_id, role_id, organization_id) DO NOTHING
    `, [uuidv4(), userId, roleRecord.id, organizationId, grantedBy]);
  }

  async revokeRole(userId: string, role: Role, organizationId?: string): Promise<void> {
    const roleRecord = await this.dbManager.get(
      'SELECT id FROM roles WHERE name = ?',
      [role]
    );

    if (!roleRecord) {
      return;
    }

    await this.dbManager.execute(`
      DELETE FROM user_roles 
      WHERE user_id = ? AND role_id = ? AND organization_id IS ?
    `, [userId, roleRecord.id, organizationId]);
  }

  async getUserRoles(userId: string, organizationId?: string): Promise<Role[]> {
    const query = organizationId
      ? 'SELECT r.name FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = ? AND ur.organization_id = ?'
      : 'SELECT r.name FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = ?';
    
    const params = organizationId ? [userId, organizationId] : [userId];
    const rows = await this.dbManager.all(query, params);

    return rows.map((row: any) => row.name as Role);
  }

  async getUserPermissions(userId: string, organizationId?: string): Promise<Permission[]> {
    const roles = await this.getUserRoles(userId, organizationId);
    const permissionsSet = new Set<Permission>();

    for (const role of roles) {
      const rolePerms = this.rolePermissions.get(role) || [];
      rolePerms.forEach(perm => permissionsSet.add(perm));
    }

    return Array.from(permissionsSet);
  }

  async hasPermission(userId: string, permission: Permission, organizationId?: string): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId, organizationId);
    return permissions.includes(permission) || permissions.includes(Permission.ADMIN_FULL);
  }

  async hasRole(userId: string, role: Role, organizationId?: string): Promise<boolean> {
    const roles = await this.getUserRoles(userId, organizationId);
    return roles.includes(role);
  }
}

export const rbacService = new RBACService();
