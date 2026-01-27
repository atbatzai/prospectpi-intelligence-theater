/**
 * ProspectPI - RBAC Service
 * Story 9.3: Enterprise team management and role-based access control
 */

import { DatabaseManager } from '../../database/DatabaseManager';
import { v4 as uuidv4 } from 'uuid';

export interface Permission {
  resource: 'dossier' | 'user' | 'organization' | 'settings' | 'batch_job' | 'api_key';
  action: 'create' | 'read' | 'update' | 'delete' | 'share' | 'export' | 'manage';
  scope: 'own' | 'team' | 'department' | 'organization';
}

export interface Role {
  id: string;
  organizationId: string;
  name: string;
  permissions: Permission[];
  isSystemRole: boolean;
  createdAt: Date;
}

export interface Department {
  id: string;
  organizationId: string;
  name: string;
  parentDepartmentId?: string;
  managerUserId?: string;
  monthlyQuota: number;
  usedThisMonth: number;
}

export interface Team {
  id: string;
  departmentId: string;
  name: string;
  leadUserId?: string;
  monthlyQuota: number;
  members: string[]; // user IDs
}

export class RBACService {
  private dbManager: DatabaseManager;
  private permissionCache: Map<string, Permission[]>;

  constructor() {
    this.dbManager = DatabaseManager.getInstance();
    this.permissionCache = new Map();
  }

  /**
   * AC1: Check if user has permission
   */
  async checkPermission(
    userId: string,
    resource: string,
    action: string,
    resourceOwnerId?: string
  ): Promise<boolean> {
    try {
      const permissions = await this.getEffectivePermissions(userId);

      for (const perm of permissions) {
        if (perm.resource !== resource && perm.resource !== '*') continue;
        if (perm.action !== action && perm.action !== '*') continue;

        // Check scope
        if (perm.scope === 'own' && userId !== resourceOwnerId) continue;
        if (perm.scope === 'team') {
          const inSameTeam = await this.inSameTeam(userId, resourceOwnerId!);
          if (!inSameTeam) continue;
        }
        if (perm.scope === 'department') {
          const inSameDept = await this.inSameDepartment(userId, resourceOwnerId!);
          if (!inSameDept) continue;
        }

        return true; // Permission granted
      }

      return false; // No matching permission
    } catch (error) {
      console.error('Permission check error:', error);
      return false; // Fail closed
    }
  }

  /**
   * AC1: Get user's effective permissions (including inherited)
   */
  async getEffectivePermissions(userId: string): Promise<Permission[]> {
    // Check cache first
    const cacheKey = \user-perms:\\;
    if (this.permissionCache.has(cacheKey)) {
      return this.permissionCache.get(cacheKey)!;
    }

    // Query user roles and permissions
    const roles = await this.dbManager.query(\
      SELECT r.* FROM roles r
      INNER JOIN user_roles ur ON r.id = ur.role_id
      WHERE ur.user_id = ?
    \, [userId]);

    const allPermissions: Permission[] = [];
    for (const role of roles) {
      const perms = JSON.parse(role.permissions || '[]');
      allPermissions.push(...perms);
    }

    // Cache for 5 minutes
    this.permissionCache.set(cacheKey, allPermissions);
    setTimeout(() => this.permissionCache.delete(cacheKey), 5 * 60 * 1000);

    return allPermissions;
  }

  /**
   * AC1: Assign role to user
   */
  async assignRole(
    userId: string,
    roleId: string,
    assignedBy: string,
    departmentId?: string
  ): Promise<void> {
    await this.dbManager.query(\
      INSERT INTO user_roles (user_id, role_id, department_id, assigned_by, assigned_at)
      VALUES (?, ?, ?, ?, NOW())
      ON CONFLICT (user_id, role_id) DO NOTHING
    \, [userId, roleId, departmentId, assignedBy]);

    // Clear permission cache
    this.permissionCache.delete(\user-perms:\\);

    // Audit log
    await this.logAudit(assignedBy, 'assign_role', 'user', userId, {
      roleId,
      departmentId
    });
  }

  /**
   * AC1: Create custom role
   */
  async createCustomRole(
    organizationId: string,
    name: string,
    permissions: Permission[],
    createdBy: string
  ): Promise<Role> {
    const roleId = uuidv4();

    await this.dbManager.query(\
      INSERT INTO roles (id, organization_id, name, permissions, is_system_role)
      VALUES (?, ?, ?, ?, false)
    \, [roleId, organizationId, name, JSON.stringify(permissions)]);

    await this.logAudit(createdBy, 'create_role', 'role', roleId, { name, permissions });

    return {
      id: roleId,
      organizationId,
      name,
      permissions,
      isSystemRole: false,
      createdAt: new Date()
    };
  }

  /**
   * AC2: Create department
   */
  async createDepartment(
    organizationId: string,
    name: string,
    monthlyQuota: number,
    parentDepartmentId?: string,
    managerUserId?: string
  ): Promise<Department> {
    const deptId = uuidv4();

    await this.dbManager.query(\
      INSERT INTO departments (
        id, organization_id, name, parent_department_id, 
        manager_user_id, monthly_quota
      ) VALUES (?, ?, ?, ?, ?, ?)
    \, [deptId, organizationId, name, parentDepartmentId, managerUserId, monthlyQuota]);

    return {
      id: deptId,
      organizationId,
      name,
      parentDepartmentId,
      managerUserId,
      monthlyQuota,
      usedThisMonth: 0
    };
  }

  /**
   * AC2: Create team
   */
  async createTeam(
    departmentId: string,
    name: string,
    monthlyQuota: number,
    leadUserId?: string
  ): Promise<Team> {
    const teamId = uuidv4();

    await this.dbManager.query(\
      INSERT INTO teams (id, department_id, name, lead_user_id, monthly_quota)
      VALUES (?, ?, ?, ?, ?)
    \, [teamId, departmentId, name, leadUserId, monthlyQuota]);

    return {
      id: teamId,
      departmentId,
      name,
      leadUserId,
      monthlyQuota,
      members: []
    };
  }

  /**
   * AC2: Add user to team
   */
  async addTeamMember(teamId: string, userId: string): Promise<void> {
    await this.dbManager.query(\
      INSERT INTO team_members (team_id, user_id, joined_at)
      VALUES (?, ?, NOW())
      ON CONFLICT DO NOTHING
    \, [teamId, userId]);
  }

  /**
   * AC4: Check and enforce quota
   */
  async checkQuota(userId: string, organizationId: string): Promise<{
    allowed: boolean;
    remaining: number;
    limit: number;
  }> {
    // Get user's organization quota
    const org = await this.dbManager.queryOne(\
      SELECT 
        max_requests_per_month as limit,
        (SELECT COUNT(*) FROM dossiers 
         WHERE organization_id = ? 
         AND created_at >= DATE_TRUNC('month', NOW())) as used
      FROM organizations 
      WHERE id = ?
    \, [organizationId, organizationId]);

    const remaining = org.limit - org.used;
    const allowed = remaining > 0;

    if (!allowed) {
      await this.sendQuotaAlert(organizationId);
    }

    return {
      allowed,
      remaining,
      limit: org.limit
    };
  }

  /**
   * AC5: Log audit event
   */
  async logAudit(
    userId: string,
    action: string,
    resourceType: string,
    resourceId: string,
    details: any,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      const user = await this.dbManager.queryOne(\
        SELECT organization_id FROM users WHERE id = ?
      \, [userId]);

      await this.dbManager.query(\
        INSERT INTO audit_logs (
          id, organization_id, user_id, action, resource_type,
          resource_id, details, ip_address, user_agent, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      \, [
        uuidv4(),
        user?.organization_id,
        userId,
        action,
        resourceType,
        resourceId,
        JSON.stringify(details),
        ipAddress,
        userAgent
      ]);
    } catch (error) {
      console.error('Audit logging failed:', error);
      // Don't throw - audit failures shouldn't block operations
    }
  }

  /**
   * AC5: Export audit logs for compliance
   */
  async exportAuditLogs(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<any[]> {
    return await this.dbManager.query(\
      SELECT 
        al.*,
        u.email as user_email,
        u.name as user_name
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE al.organization_id = ?
        AND al.created_at >= ?
        AND al.created_at <= ?
      ORDER BY al.created_at DESC
    \, [organizationId, startDate, endDate]);
  }

  /**
   * Initialize system roles for organization
   */
  async initializeSystemRoles(organizationId: string): Promise<void> {
    const systemRoles = [
      {
        name: 'Admin',
        permissions: [
          { resource: '*', action: '*', scope: 'organization' }
        ]
      },
      {
        name: 'Manager',
        permissions: [
          { resource: 'dossier', action: '*', scope: 'department' },
          { resource: 'user', action: 'read', scope: 'department' },
          { resource: 'batch_job', action: '*', scope: 'department' }
        ]
      },
      {
        name: 'Analyst',
        permissions: [
          { resource: 'dossier', action: 'create', scope: 'organization' },
          { resource: 'dossier', action: 'read', scope: 'organization' },
          { resource: 'dossier', action: 'update', scope: 'own' },
          { resource: 'dossier', action: 'export', scope: 'own' }
        ]
      },
      {
        name: 'Viewer',
        permissions: [
          { resource: 'dossier', action: 'read', scope: 'organization' }
        ]
      }
    ];

    for (const role of systemRoles) {
      await this.dbManager.query(\
        INSERT INTO roles (id, organization_id, name, permissions, is_system_role)
        VALUES (?, ?, ?, ?, true)
        ON CONFLICT DO NOTHING
      \, [uuidv4(), organizationId, role.name, JSON.stringify(role.permissions)]);
    }
  }

  // Helper methods
  private async inSameTeam(userId1: string, userId2: string): Promise<boolean> {
    const result = await this.dbManager.queryOne(\
      SELECT COUNT(*) as count FROM team_members tm1
      INNER JOIN team_members tm2 ON tm1.team_id = tm2.team_id
      WHERE tm1.user_id = ? AND tm2.user_id = ?
    \, [userId1, userId2]);

    return result.count > 0;
  }

  private async inSameDepartment(userId1: string, userId2: string): Promise<boolean> {
    const result = await this.dbManager.queryOne(\
      SELECT COUNT(*) as count FROM users u1
      INNER JOIN users u2 ON u1.department_id = u2.department_id
      WHERE u1.id = ? AND u2.id = ?
    \, [userId1, userId2]);

    return result.count > 0;
  }

  private async sendQuotaAlert(organizationId: string): Promise<void> {
    // TODO: Send email/notification to org admins
    console.warn(\Quota exceeded for organization \\);
  }
}
