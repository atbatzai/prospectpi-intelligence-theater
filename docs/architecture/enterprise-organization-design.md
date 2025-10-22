# Enterprise Organization & Team Architecture

**Document Version:** 1.0  
**Date:** October 10, 2025  
**Architecture Owner:** BMad Architect Agent  
**Status:** Design Phase - Implementation Ready

---

## **Executive Summary**

This document defines the enterprise-grade organizational architecture for ProspectPI's consultation-driven intelligence platform, supporting multi-tier organizations, team-based collaboration, and enterprise administration capabilities.

**Key Architectural Decisions:**
- **Hierarchical Organization Model**: Support for divisions → departments → teams
- **Role-Based Access Control (RBAC)**: Enterprise-grade permission management
- **Consultation-Aware Teams**: Team consultation workflows for complex research
- **Enterprise Analytics**: Organizational usage tracking and optimization

---

## **Core Architectural Components**

### **1. Organization Hierarchy Model**

```typescript
// ARCHITECT: Enterprise Organization Structure
export interface Organization {
  id: string;
  name: string;
  domain: string; // email domain for automatic user association
  subscription_plan: 'enterprise' | 'business' | 'professional';
  subscription_status: 'active' | 'trial' | 'cancelled';
  max_users: number;
  max_teams: number;
  max_dossiers_per_month: number;
  created_at: string;
  settings: OrganizationSettings;
}

export interface OrganizationSettings {
  allow_external_sharing: boolean;
  require_approval_for_sharing: boolean;
  data_retention_days: number;
  consultation_default_enabled: boolean;
  branding: {
    logo_url?: string;
    primary_color?: string;
    organization_name_in_dossiers: boolean;
  };
}

export interface Department {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  manager_user_id: string;
  budget_allocation?: number;
  created_at: string;
}

export interface Team {
  id: string;
  organization_id: string;
  department_id?: string;
  name: string;
  description?: string;
  team_lead_user_id: string;
  team_type: 'sales' | 'marketing' | 'research' | 'executive' | 'custom';
  consultation_settings: TeamConsultationSettings;
  created_at: string;
}

export interface TeamConsultationSettings {
  require_team_consultation: boolean;
  max_consultation_time_minutes: number;
  consultation_approval_required: boolean;
  default_research_focus: string[];
  preferred_mack_personality: 'professional' | 'detailed' | 'executive';
}
```

### **2. Enhanced User & Role Model**

```typescript
// ARCHITECT: Enterprise User Management
export interface User {
  // ... existing fields ...
  organization_id: string;
  department_id?: string;
  role: OrganizationRole;
  teams: string[]; // Array of team IDs
  hire_date?: string;
  manager_user_id?: string;
  permissions: UserPermissions;
}

export interface OrganizationRole {
  id: string;
  name: string; // 'org_admin' | 'dept_manager' | 'team_lead' | 'member' | 'viewer'
  organization_id: string;
  permissions: RolePermissions;
  is_default: boolean;
}

export interface RolePermissions {
  // Organization Management
  can_manage_organization: boolean;
  can_manage_users: boolean;
  can_view_all_dossiers: boolean;
  can_manage_teams: boolean;
  
  // Dossier Permissions  
  can_generate_dossiers: boolean;
  can_share_externally: boolean;
  can_export_dossiers: boolean;
  can_archive_dossiers: boolean;
  
  // Consultation Permissions
  can_use_consultation: boolean;
  can_bypass_consultation_limits: boolean;
  can_view_team_consultations: boolean;
  
  // Analytics & Reporting
  can_view_organization_analytics: boolean;
  can_view_team_analytics: boolean;
  can_export_usage_reports: boolean;
}

export interface TeamMembership {
  id: string;
  team_id: string;
  user_id: string;
  role: 'lead' | 'member' | 'viewer';
  joined_at: string;
  permissions: TeamPermissions;
}

export interface TeamPermissions {
  can_manage_team: boolean;
  can_invite_members: boolean;
  can_share_with_team: boolean;
  can_view_team_dossiers: boolean;
  can_use_team_consultation: boolean;
}
```

### **3. Enterprise Consultation Architecture**

```typescript
// ARCHITECT: Team-Based Consultation System
export interface TeamConsultation {
  id: string;
  team_id: string;
  initiated_by_user_id: string;
  participants: ConsultationParticipant[];
  consultation_type: 'individual' | 'collaborative' | 'approval_required';
  status: 'active' | 'completed' | 'pending_approval' | 'cancelled';
  mack_session_data: MackSessionData;
  research_focus: string[];
  estimated_cost: number;
  requires_approval: boolean;
  approved_by_user_id?: string;
  created_at: string;
  completed_at?: string;
}

export interface ConsultationParticipant {
  user_id: string;
  role: 'lead' | 'contributor' | 'observer';
  joined_at: string;
  contribution_level: number; // 0-100
}

export interface MackSessionData {
  conversation_id: string;
  business_context: BusinessContext;
  research_strategy: ResearchStrategy;
  quality_requirements: QualityRequirements;
  collaboration_notes: CollaborationNote[];
}

export interface CollaborationNote {
  user_id: string;
  timestamp: string;
  note_type: 'insight' | 'question' | 'requirement' | 'constraint';
  content: string;
  addressed: boolean;
}
```

### **4. Enterprise Analytics & Reporting**

```typescript
// ARCHITECT: Organization Analytics System
export interface OrganizationAnalytics {
  organization_id: string;
  reporting_period: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  date_range: {
    start_date: string;
    end_date: string;
  };
  
  usage_metrics: {
    total_dossiers_generated: number;
    total_consultations_completed: number;
    average_consultation_time_minutes: number;
    consultation_completion_rate: number;
    api_requests: number;
    storage_used_gb: number;
  };
  
  team_performance: TeamAnalytics[];
  cost_analytics: CostAnalytics;
  quality_metrics: QualityMetrics;
  user_engagement: UserEngagementMetrics;
}

export interface TeamAnalytics {
  team_id: string;
  team_name: string;
  dossiers_generated: number;
  consultations_completed: number;
  average_research_quality_score: number;
  collaboration_effectiveness: number;
  cost_per_dossier: number;
  roi_metrics: ROIMetrics;
}

export interface CostAnalytics {
  total_cost_usd: number;
  cost_per_dossier: number;
  cost_by_data_source: DataSourceCost[];
  consultation_cost_efficiency: number;
  predicted_monthly_cost: number;
}

export interface QualityMetrics {
  average_confidence_score: number;
  user_satisfaction_rating: number;
  research_relevance_score: number;
  consultation_effectiveness: number;
  mack_credibility_rating: number;
}
```

---

## **Database Schema Extensions**

### **Organization Tables (PostgreSQL)**

```sql
-- ARCHITECT: Enterprise Organization Schema
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    domain VARCHAR(100) UNIQUE NOT NULL,
    subscription_plan VARCHAR(20) NOT NULL CHECK (subscription_plan IN ('enterprise', 'business', 'professional')),
    subscription_status VARCHAR(20) NOT NULL CHECK (subscription_status IN ('active', 'trial', 'cancelled', 'suspended')),
    max_users INTEGER NOT NULL DEFAULT 100,
    max_teams INTEGER NOT NULL DEFAULT 10,
    max_dossiers_per_month INTEGER NOT NULL DEFAULT 1000,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    manager_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    budget_allocation DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(organization_id, name)
);

CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    team_lead_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    team_type VARCHAR(20) NOT NULL DEFAULT 'custom',
    consultation_settings JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(organization_id, name)
);

CREATE TABLE IF NOT EXISTS organization_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    permissions JSONB NOT NULL DEFAULT '{}',
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(organization_id, name)
);

CREATE TABLE IF NOT EXISTS team_memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL DEFAULT 'member' CHECK (role IN ('lead', 'member', 'viewer')),
    permissions JSONB DEFAULT '{}',
    joined_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(team_id, user_id)
);

-- Team Consultation System
CREATE TABLE IF NOT EXISTS team_consultations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    initiated_by_user_id UUID NOT NULL REFERENCES users(id),
    consultation_type VARCHAR(20) NOT NULL DEFAULT 'individual',
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    mack_session_data JSONB DEFAULT '{}',
    research_focus TEXT[],
    estimated_cost DECIMAL(8,2),
    requires_approval BOOLEAN DEFAULT false,
    approved_by_user_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS consultation_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consultation_id UUID NOT NULL REFERENCES team_consultations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL DEFAULT 'contributor' CHECK (role IN ('lead', 'contributor', 'observer')),
    joined_at TIMESTAMP DEFAULT NOW(),
    contribution_level INTEGER DEFAULT 0 CHECK (contribution_level >= 0 AND contribution_level <= 100),
    UNIQUE(consultation_id, user_id)
);

-- Organization Analytics
CREATE TABLE IF NOT EXISTS organization_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    reporting_period VARCHAR(20) NOT NULL,
    date_range JSONB NOT NULL,
    usage_metrics JSONB NOT NULL DEFAULT '{}',
    team_performance JSONB DEFAULT '[]',
    cost_analytics JSONB DEFAULT '{}',
    quality_metrics JSONB DEFAULT '{}',
    user_engagement JSONB DEFAULT '{}',
    generated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(organization_id, reporting_period, date_range)
);
```

### **Performance Indexes**

```sql
-- ARCHITECT: Enterprise Performance Optimization
CREATE INDEX idx_organizations_domain ON organizations(domain);
CREATE INDEX idx_organizations_subscription ON organizations(subscription_plan, subscription_status);

CREATE INDEX idx_departments_organization ON departments(organization_id);
CREATE INDEX idx_departments_manager ON departments(manager_user_id);

CREATE INDEX idx_teams_organization ON teams(organization_id);
CREATE INDEX idx_teams_department ON teams(department_id);
CREATE INDEX idx_teams_lead ON teams(team_lead_user_id);
CREATE INDEX idx_teams_type ON teams(team_type);

CREATE INDEX idx_team_memberships_team ON team_memberships(team_id);
CREATE INDEX idx_team_memberships_user ON team_memberships(user_id);
CREATE INDEX idx_team_memberships_role ON team_memberships(role);

CREATE INDEX idx_team_consultations_team ON team_consultations(team_id);
CREATE INDEX idx_team_consultations_status ON team_consultations(status);
CREATE INDEX idx_team_consultations_created ON team_consultations(created_at);

CREATE INDEX idx_consultation_participants_consultation ON consultation_participants(consultation_id);
CREATE INDEX idx_consultation_participants_user ON consultation_participants(user_id);

CREATE INDEX idx_organization_analytics_org ON organization_analytics(organization_id);
CREATE INDEX idx_organization_analytics_period ON organization_analytics(reporting_period, generated_at);

-- Enhanced dossier indexes for organization queries
CREATE INDEX idx_dossiers_organization ON dossiers(user_id) 
    WHERE user_id IN (SELECT id FROM users);
CREATE INDEX idx_dossier_shares_organization ON dossier_shares(shared_with_organization_id) 
    WHERE shared_with_organization_id IS NOT NULL;
```

---

## **API Architecture**

### **Organization Management APIs**

```typescript
// ARCHITECT: Enterprise API Design
// Organization Management
POST   /api/v1/organizations                    // Create organization
GET    /api/v1/organizations/:id               // Get organization details  
PUT    /api/v1/organizations/:id               // Update organization
DELETE /api/v1/organizations/:id               // Delete organization

// Department Management
POST   /api/v1/organizations/:id/departments   // Create department
GET    /api/v1/organizations/:id/departments   // List departments
PUT    /api/v1/departments/:id                 // Update department
DELETE /api/v1/departments/:id                 // Delete department

// Team Management  
POST   /api/v1/organizations/:id/teams         // Create team
GET    /api/v1/organizations/:id/teams         // List teams
PUT    /api/v1/teams/:id                       // Update team
DELETE /api/v1/teams/:id                       // Delete team

// Team Membership
POST   /api/v1/teams/:id/members               // Add team member
GET    /api/v1/teams/:id/members               // List team members
PUT    /api/v1/teams/:id/members/:userId       // Update member role
DELETE /api/v1/teams/:id/members/:userId       // Remove team member

// Team Consultation
POST   /api/v1/teams/:id/consultations         // Start team consultation
GET    /api/v1/teams/:id/consultations         // List team consultations
GET    /api/v1/consultations/:id               // Get consultation details
PUT    /api/v1/consultations/:id               // Update consultation
POST   /api/v1/consultations/:id/participants  // Add participant
DELETE /api/v1/consultations/:id               // Cancel consultation

// Organization Analytics
GET    /api/v1/organizations/:id/analytics     // Organization analytics
GET    /api/v1/teams/:id/analytics             // Team analytics  
GET    /api/v1/organizations/:id/usage         // Usage metrics
GET    /api/v1/organizations/:id/costs         // Cost analytics
POST   /api/v1/organizations/:id/reports       // Generate custom report
```

---

## **Implementation Phases**

### **Phase 1: Core Organization Structure (Week 1-2)**
1. **Database Schema**: Implement organization, department, team tables
2. **User Model Enhancement**: Add organization/team relationships  
3. **Basic Organization APIs**: CRUD operations for org/dept/team management
4. **Migration Scripts**: Convert existing users to organization model

### **Phase 2: Team Collaboration (Week 3-4)**
1. **Team Consultation System**: Multi-user Mack consultation workflows
2. **Team Dossier Sharing**: Automatic sharing within teams
3. **Team Permission Model**: Role-based access within teams
4. **Collaborative UI**: Team consultation interface

### **Phase 3: Enterprise Analytics (Week 5-6)**  
1. **Analytics Engine**: Usage tracking and metrics calculation
2. **Reporting APIs**: Organization and team analytics endpoints
3. **Admin Dashboard**: Organization management interface
4. **Cost Tracking**: Detailed cost analytics and optimization

### **Phase 4: Advanced Features (Week 7-8)**
1. **Advanced RBAC**: Custom roles and fine-grained permissions
2. **Enterprise Integrations**: SSO, SCIM, audit logging
3. **Advanced Analytics**: Predictive analytics and recommendations
4. **Enterprise Consultation**: Approval workflows and governance

---

## **Scalability & Performance Considerations**

### **Database Optimization**
- **Partitioning**: Partition large tables by organization_id  
- **Connection Pooling**: Organization-aware connection routing
- **Caching Strategy**: Redis caching for organization data
- **Read Replicas**: Separate analytics workloads

### **Multi-Tenancy Architecture**
- **Data Isolation**: Row-level security by organization  
- **Resource Limits**: Per-organization rate limiting
- **Cost Allocation**: Accurate cost tracking per organization
- **Performance Isolation**: Organization-specific resource pools

### **Security Framework**
- **Zero Trust Model**: Verify every access request
- **Audit Logging**: Comprehensive activity tracking
- **Data Encryption**: At-rest and in-transit encryption  
- **Compliance**: SOC2, GDPR, CCPA readiness

---

## **Success Metrics & Monitoring**

### **Technical Metrics**
- **API Response Time**: <200ms for organization queries
- **Database Performance**: <100ms for team/user lookups  
- **Scalability**: Support 10,000+ users per organization
- **Availability**: 99.9% uptime for enterprise features

### **Business Metrics**  
- **Team Adoption**: >80% of teams use collaborative consultation
- **Cost Efficiency**: <5% overhead for organization features
- **User Satisfaction**: >9/10 for enterprise functionality
- **Revenue Impact**: 25% increase in enterprise conversion

---

**Architecture Status**: ✅ **DESIGN COMPLETE - READY FOR IMPLEMENTATION**

This enterprise architecture provides a scalable foundation for ProspectPI's organizational features while maintaining the consultation-driven intelligence focus that differentiates the platform.

**Next Steps:**
1. **Dev Agent**: Implement Phase 1 core organization structure
2. **PM Agent**: Create enterprise feature roadmap and user stories  
3. **QA Agent**: Design testing strategy for multi-tenant scenarios