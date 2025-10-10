# Epic 3: Salesforce Integration & Enterprise Features - Brownfield Enhancement

## Epic Goal
Implement Salesforce Lightning Component integration and enterprise-grade features that enable one-click dossier generation from CRM records, bidirectional data sync, and professional team collaboration capabilities.

## Epic Description

### Existing System Context
- **Current relevant functionality:** Complete Intelligence Theater system with backend APIs (Stories 1.1-1.4) and frontend interface (Epic 2)
- **Technology stack:** Node.js/TypeScript backend, React/TypeScript frontend, PostgreSQL database, JWT authentication
- **Integration points:** Existing user management system, dossier generation APIs, organization management from Story 1.4

### Enhancement Details
- **What's being added/changed:** Salesforce Lightning Component, OAuth integration, CRM data sync, team collaboration features, and usage management
- **How it integrates:** New Salesforce service layer connects to existing APIs, extends organization management for enterprise features
- **Success criteria:** 
  - One-click dossier generation from Salesforce Account pages
  - Bi-directional sync between dossiers and CRM records
  - Team sharing and collaboration features
  - Enterprise usage management and billing integration
  - Slack integration for team notifications

## Stories

### Story 3.1: Salesforce Lightning Component & OAuth Integration
**Goal:** Enable one-click dossier generation directly from Salesforce Account pages with native CRM UX  
**Description:** Build Salesforce Lightning Component with OAuth authentication and embedded Intelligence Theater interface optimized for CRM workflow.

**Key Deliverables:**
- **Salesforce Lightning Component** with Lightning Design System (SLDS) compliance
- **Native CRM UX:** 1-click dossier generation from Account page action button
- **OAuth 2.0 integration** with Salesforce APIs and ProspectPI authentication
- **Auto-populated form:** Account data (company name, website, description) pre-fills Intelligence Theater input
- **Embedded progress theater:** Mini Agent Progress Theater within Salesforce iframe
- **Salesforce ISV program compliance** and AppExchange readiness

**UX Requirements:**
- **Lightning Design System styling** for native Salesforce look and feel
- **Responsive iframe component** that works within Salesforce page layouts
- **Minimal context switching** - users stay in Salesforce throughout process
- **Status indicators** showing dossier generation progress in CRM sidebar

**UX Design Reference:** See detailed Lightning Component UX specifications in Story 3.2 UX Design document

### Story 3.2: CRM Bi-Directional Data Sync & Intelligence Integration
**Goal:** Seamlessly integrate dossier insights into Salesforce workflow with intelligent data presentation  
**Description:** Implement bi-directional sync with smart CRM data visualization and automated insight integration.

**Key Deliverables:**
- **Smart field mapping:** Dossier insights auto-populate relevant Salesforce fields (revenue, employees, tech stack)
- **Visual insight cards:** Key intelligence displayed as Lightning cards on Account page
- **Confidence scoring visualization:** Color-coded confidence indicators with tooltips

**UX Design Reference:** See detailed Salesforce UX specifications in Story 3.2 Lightning Component UX Design document
- **Contextual CRM integration:** Intelligence recommendations appear in Opportunity and Lead workflows
- **Automated note creation:** Structured intelligence summaries added to Activity Timeline
- **Real-time sync status:** Visual indicators showing data freshness and sync status

**UX Requirements:**
- **Native Lightning card components** for intelligence display
- **Progressive disclosure:** Expandable insight sections without overwhelming the CRM interface
- **Visual hierarchy:** High-confidence insights prominently displayed, lower confidence gracefully de-emphasized
- **Action-oriented presentation:** Intelligence formatted to support sales workflow decisions

### Story 3.3: Enterprise Team Collaboration & Slack Integration
**Goal:** Enable seamless team collaboration with intelligent sharing and notification systems  
**Description:** Build comprehensive team sharing capabilities, Slack integration, and enterprise collaboration workflows.

**Key Deliverables:**
- **Team sharing interface:** Role-based dossier access control with sharing permissions
- **Slack bot integration:** Intelligent dossier sharing and notifications in team channels
- **Collaborative annotations:** Team members can add notes and insights to shared dossiers
- **Enterprise user management:** Organization-level user provisioning and role management
- **Usage tracking dashboard:** Team usage analytics and plan limit monitoring
- **Notification system:** Smart alerts for dossier completion, sharing, and updates

**UX Requirements:**
- **Collaborative UX patterns:** Google Docs-style sharing interface with permission management
- **Slack-native experience:** Rich card previews and interactive buttons within Slack
- **Team workspace design:** Shared dossier library with search, filtering, and organization
- **Enterprise admin interface:** Clean management dashboard for user provisioning and usage monitoring
- **Mobile-friendly collaboration:** Team features work seamlessly on mobile devices

**Key Deliverables:**
- Team dossier sharing with access control
- Slack integration for dossier sharing and notifications
- Enterprise user management and role-based permissions
- Usage tracking and plan limit enforcement
- Team analytics and reporting dashboard

## Lovable Integration Strategy for Epic 3

### **Enterprise & CRM UX Components**
Epic 3 requires new Lovable-generated components specifically designed for Salesforce integration and team collaboration:

**New Lovable Component Categories:**
1. **Salesforce Lightning Components** - Native CRM interface components using Lightning Design System
2. **Team Collaboration Interfaces** - Sharing, permissions, and collaborative workspace components  
3. **Slack Integration Components** - Bot interfaces and interactive card components

### **Epic 3 Lovable Component Targets:**
1. **Salesforce Lightning Dossier Generator** - Native CRM component with SLDS styling
2. **Team Sharing & Permissions Interface** - Google Docs-style collaborative sharing UI
3. **Slack Bot Interface Components** - Rich card previews and interactive notifications
4. **Enterprise Admin Dashboard** - User management and usage monitoring interface

### **Lovable Integration Workflow for Epic 3:**
- **Story 3.1:** Dev Agent creates Salesforce APIs → Human generates Lightning components with Lovable → Dev Agent integrates
- **Story 3.2:** Dev Agent creates sync logic → Human generates CRM insight cards with Lovable → Dev Agent connects to Salesforce
- **Story 3.3:** Dev Agent creates team backend → Human generates collaboration UI with Lovable → Dev Agent adds Slack integration

**Note:** Epic 3 will require NEW Lovable prompts (see Epic 3 Lovable Extension document) in addition to the base 512-line prompt from Epic 2.

## Compatibility Requirements

- [x] **Existing APIs remain unchanged** - New Salesforce service layer extends existing system
- [x] **Database schema extensions are backward compatible** - Adds new tables for Salesforce integration
- [x] **Frontend changes are additive** - New enterprise features don't affect core functionality
- [x] **Performance impact is minimal** - Async background sync operations

## Risk Mitigation

- **Primary Risk:** Salesforce ISV program approval complexity and integration complexity
- **Mitigation:** Early engagement with Salesforce ISV program, Lightning Component prototype in first sprint, fallback Canvas app option
- **Rollback Plan:** Salesforce features can be disabled via feature flags without affecting core dossier generation

## Technical Architecture

### Salesforce Integration Stack
```typescript
// Salesforce Service Layer
interface SalesforceService {
  // OAuth & Authentication
  initiateOAuth(redirectUri: string): Promise<string>;
  exchangeCodeForTokens(code: string): Promise<SalesforceTokens>;
  refreshAccessToken(refreshToken: string): Promise<SalesforceTokens>;
  
  // Account Data Integration
  getAccountData(accountId: string): Promise<SalesforceAccount>;
  updateAccountWithDossier(accountId: string, dossierSummary: DossierSummary): Promise<void>;
  
  // Custom Fields Management
  createProspectPIFields(): Promise<void>;
  syncDossierInsights(accountId: string, insights: IntelligenceInsight[]): Promise<void>;
}

// Lightning Component Interface
interface LightningComponentAPI {
  generateDossier(params: {
    recordId: string; // Account ID
    companyName: string;
    additionalContext?: string;
  }): Promise<DossierGenerationResult>;
  
  getDossierStatus(requestId: string): Promise<DossierStatus>;
  viewFullDossier(dossierId: string): void;
}
```

### Enterprise Features Architecture
```typescript
// Team Management Service
interface TeamService {
  // Team Collaboration
  shareDossierWithTeam(dossierId: string, teamMembers: string[]): Promise<void>;
  getTeamDossiers(organizationId: string): Promise<TeamDossier[]>;
  
  // Access Control
  setDossierPermissions(dossierId: string, permissions: DossierPermissions): Promise<void>;
  checkUserAccess(userId: string, dossierId: string): Promise<boolean>;
}

// Slack Integration Service  
interface SlackService {
  shareToSlack(dossierId: string, channelId: string): Promise<void>;
  createSlashCommand(): SlashCommandHandler;
  formatDossierMessage(dossier: IntelligenceDossier): SlackMessage;
}

// Usage Management Service
interface UsageService {
  trackDossierGeneration(userId: string, organizationId: string): Promise<void>;
  checkUsageLimits(organizationId: string): Promise<UsageLimitStatus>;
  generateUsageReport(organizationId: string): Promise<UsageReport>;
}
```

### Database Schema Extensions
```sql
-- Salesforce Integration Tables
CREATE TABLE salesforce_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    salesforce_org_id VARCHAR(18) NOT NULL,
    access_token_hash VARCHAR(255) NOT NULL,
    refresh_token_hash VARCHAR(255) NOT NULL,
    instance_url VARCHAR(500) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_sync TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- CRM Account Mapping
CREATE TABLE crm_account_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dossier_id UUID NOT NULL REFERENCES dossiers(id),
    salesforce_account_id VARCHAR(18) NOT NULL,
    organization_id UUID NOT NULL REFERENCES organizations(id),
    last_synced TIMESTAMP DEFAULT NOW(),
    sync_status VARCHAR(20) DEFAULT 'pending'
);

-- Team Collaboration
CREATE TABLE dossier_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dossier_id UUID NOT NULL REFERENCES dossiers(id),
    shared_by UUID NOT NULL REFERENCES users(id),
    shared_with UUID NOT NULL REFERENCES users(id),
    permission_level VARCHAR(20) DEFAULT 'read', -- 'read', 'comment', 'edit'
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP
);

-- Slack Integration
CREATE TABLE slack_workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    slack_team_id VARCHAR(100) NOT NULL,
    access_token_hash VARCHAR(255) NOT NULL,
    webhook_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);
```

## Lovable Integration Strategy

### Enterprise UI Components
- **Phase 1:** Generate enterprise dashboard and team management interfaces
- **Phase 2:** Create Slack sharing modals and notification components  
- **Phase 3:** Build usage analytics and billing management interfaces

### Lovable Component Targets
1. **Enterprise Dashboard** - Team analytics, usage tracking, member management
2. **Dossier Sharing Modal** - Team collaboration and access control interface
3. **Slack Integration UI** - Channel selection and message preview
4. **Usage Management** - Plan limits, upgrade prompts, billing interface
5. **Salesforce Embedded Panel** - Lightning Component interface design

## Definition of Done

- [ ] All 3 stories completed with acceptance criteria met
- [ ] Salesforce Lightning Component approved by ISV program
- [ ] OAuth integration working with enterprise Salesforce orgs
- [ ] Bi-directional CRM sync functional and tested
- [ ] Team collaboration features working across organizations
- [ ] Slack integration tested with multiple workspace configurations
- [ ] Usage tracking and billing integration accurate
- [ ] No performance regression in core dossier generation
- [ ] **Enterprise Security:** SOC 2 compliance features implemented
- [ ] **Scalability Tested:** Multi-tenant isolation verified
- [ ] **Mobile Compatibility:** Salesforce mobile app integration working

## Enterprise Compliance & Security

### SOC 2 Type II Requirements
```typescript
// Audit Logging for Enterprise
interface EnterpriseAuditService {
  logSalesforceAccess(userId: string, action: string, accountId: string): Promise<void>;
  logDossierShare(shareEvent: DossierShareEvent): Promise<void>;
  logDataExport(exportEvent: DataExportEvent): Promise<void>;
  generateComplianceReport(organizationId: string): Promise<ComplianceReport>;
}

// Data Privacy Controls
interface DataPrivacyService {
  anonymizePII(dossierContent: string): Promise<string>;
  handleDataDeletionRequest(userId: string): Promise<void>;
  exportUserData(userId: string): Promise<UserDataExport>;
  validateDataRetention(): Promise<RetentionReport>;
}
```

### Enterprise Security Features
- **Multi-tenant Data Isolation:** Organization-level data segregation
- **Advanced Access Controls:** Role-based permissions with Salesforce integration
- **Audit Trail:** Complete action logging for compliance requirements
- **Data Encryption:** End-to-end encryption for sensitive intelligence data
- **API Rate Limiting:** Per-organization rate limits with intelligent scaling

## Integration Complexity Assessment

### Salesforce Integration Risks
- **ISV Program Approval:** 4-6 week review process
- **Lightning Component Complexity:** Modern Salesforce development patterns
- **OAuth Token Management:** Secure token refresh and revocation
- **Custom Field Creation:** Dynamic field management across orgs

### Mitigation Strategies
- **Early ISV Engagement:** Submit application in first week of development
- **Fallback Canvas App:** Alternative integration method if Lightning Component blocked
- **Comprehensive Testing:** Multiple Salesforce org configurations
- **Progressive Rollout:** Feature flags for gradual enterprise customer onboarding

## Agent Handoff Status

### **Architect Agent Handoff** ✅
**Status:** COMPLETED  
**Date:** October 8, 2025  
**Approval:** Salesforce integration architecture validated and approved  

#### **Integration Architecture Specifications**
```typescript
// Salesforce Integration Architecture
interface SalesforceIntegrationArchitecture {
  // OAuth 2.0 Flow
  authentication: {
    provider: 'Salesforce Connected App';
    flow: 'Authorization Code with PKCE';
    scopes: ['api', 'web', 'refresh_token'];
    tokenStorage: 'Encrypted Redis cache';
    sessionManagement: 'JWT with Salesforce User ID mapping';
  };
  
  // Lightning Component Architecture
  lightningComponent: {
    framework: 'Lightning Web Components (LWC)';
    designSystem: 'Salesforce Lightning Design System (SLDS)';
    deployment: 'Managed Package for AppExchange';
    security: 'CSP compliant, no eval() usage';
    performance: '<3s load time, <1MB bundle size';
  };
  
  // API Integration Patterns
  dataSync: {
    pattern: 'Event-driven bidirectional sync';
    reliability: 'Idempotent operations with retry logic';
    conflictResolution: 'Last-write-wins with user notification';
    performanceOptimization: 'Bulk operations, intelligent caching';
  };
  
  // Enterprise Security
  security: {
    dataIsolation: 'Salesforce Org-level tenant isolation';
    encryption: 'TLS 1.3 for all communications';
    auditLogging: 'All CRM interactions logged';
    compliance: 'SOC 2 Type II, GDPR compliant';
  };
}
```

#### **Technical Quality Gates**
- ✅ **Salesforce Connected App:** OAuth configuration and security review completed
- ✅ **Lightning Component Architecture:** Component structure and performance requirements defined
- ✅ **API Integration Patterns:** Bidirectional sync architecture with conflict resolution
- ✅ **Enterprise Security:** Multi-tenant isolation and compliance requirements documented
- ✅ **Performance Requirements:** <3s Lightning Component load, <1MB bundle size targets
- ✅ **Scalability Design:** Support for 1000+ concurrent Salesforce users per org

### **UX Expert Agent Handoff** ✅  
**Status:** COMPLETED  
**Date:** October 8, 2025  
**Approval:** Lightning Component UX design and enterprise workflows approved  

#### **Lightning Component UX Specifications**
```typescript
// UX Design Requirements for Salesforce Integration
interface LightningComponentUX {
  // Native Salesforce Experience
  designCompliance: {
    framework: 'Lightning Design System (SLDS)';
    components: 'lightning-card, lightning-button, lightning-progress-indicator';
    styling: 'SLDS utility classes, custom CSS minimal';
    responsive: 'Mobile-first responsive within Salesforce mobile app';
  };
  
  // User Journey Optimization
  workflow: {
    entry: 'Account page action button - prominent but non-intrusive';
    process: 'Embedded iframe OR modal overlay (user preference)';
    progress: 'Mini Agent Theater with SLDS progress components';
    completion: 'Automatic field population + user notification';
    exit: 'Seamless return to Account page with updated data';
  };
  
  // Enterprise User Experience
  collaboration: {
    sharing: 'Chatter integration for dossier sharing';
    notifications: 'Salesforce notifications + optional Slack integration';
    permissions: 'Salesforce user permissions respected';
    multiUser: 'Support multiple users generating dossiers simultaneously';
  };
}
```

#### **UX Quality Gates**
- ✅ **Lightning Design System:** Native Salesforce look and feel with SLDS compliance
- ✅ **User Journey Flow:** Minimal context switching, embedded experience optimized
- ✅ **Mobile Responsive:** Full functionality in Salesforce mobile app
- ✅ **Enterprise Collaboration:** Chatter integration and team sharing workflows
- ✅ **Accessibility:** WCAG 2.1 AA compliance within Salesforce context
- ✅ **Performance UX:** <3s perceived load time with progress indicators

### **Quality Gates Met**
- ✅ **Integration Architecture:** OAuth 2.0, Lightning Component, bidirectional sync patterns defined
- ✅ **Enterprise Security:** Multi-tenant isolation, audit logging, SOC 2 compliance
- ✅ **UX Design:** Native Salesforce experience with SLDS compliance
- ✅ **Performance Requirements:** <3s load times, <1MB bundle size targets
- ✅ **Scalability Planning:** Support for 1000+ concurrent users per Salesforce org

## Story Manager Handoff

"Please develop detailed user stories for this enterprise brownfield epic. Key considerations:

- This enhances the existing Intelligence Theater system with enterprise-grade integrations
- **Integration points:** Salesforce APIs, Slack APIs, existing organization management, billing systems
- **Existing patterns to follow:** Organization-based multi-tenancy from Story 1.4, existing API architecture patterns
- **Critical compatibility requirements:** Must not disrupt existing single-user workflows, maintain performance for core features
- **Enterprise Features:** Each story must address security, scalability, and compliance requirements
- **Lovable Integration:** Specify which enterprise UI components will be generated using Lovable AI

The epic should deliver enterprise-ready features while maintaining system integrity and providing clear value to sales teams through seamless CRM integration."

## Change Log
- **Created**: October 8, 2025 by Product Owner Sarah
- **Epic Type**: Brownfield Enhancement (Enterprise Integration)  
- **Dependencies**: Epic 1 (Backend Infrastructure), Epic 2 (Frontend Theater)
- **Architect Handoff**: October 8, 2025 - Salesforce integration architecture validated and approved
- **UX Expert Handoff**: October 8, 2025 - Lightning Component UX design and enterprise workflows approved
- **Status**: ✅ READY FOR STORY DEVELOPMENT - All agent handoffs completed
- **Target Market**: Enterprise sales teams using Salesforce CRM