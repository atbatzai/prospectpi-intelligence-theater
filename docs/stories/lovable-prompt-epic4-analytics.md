# Lovable Prompt Extension - Epic 4: Advanced Analytics & Admin Components

## **COPY THIS ENTIRE PROMPT EXTENSION FOR EPIC 4 COMPONENTS** 📋

---

## **Base Prompt Reference**
**IMPORTANT:** This is an EXTENSION to the base lovable-prompt.md (512 lines). Use the base prompt FIRST, then add these Epic 4 specific components.

**Base Components Already Covered:** Smart Company Input, Agent Progress Theater, CIA Dossier Viewer
**Epic 3 Components Available:** Salesforce Lightning, Team Collaboration, Slack Integration
**Epic 4 NEW Components:** Executive Analytics, Billing Portal, Admin Management

---

## **Epic 4 Component Extensions**

### **7. Executive Analytics Dashboard - C-Suite Business Intelligence** 📊

Create an **executive-grade analytics platform** suitable for C-suite presentations and business decision making:

#### **Dashboard Architecture:**
```typescript
interface ExecutiveDashboard {
  kpiMetrics: KPIWidget[];
  revenueAnalytics: RevenueWidget[];
  userAnalytics: UserBehaviorWidget[];
  operationalMetrics: OperationalWidget[];
  customReports: CustomReportWidget[];
}

interface KPIWidget {
  title: string;
  currentValue: number;
  previousValue: number;
  trend: 'up' | 'down' | 'stable';
  sparkline: DataPoint[];
  target?: number;
}
```

#### **Executive Dashboard Components:**

##### **KPI Overview Section:**
- **Monthly Recurring Revenue (MRR)** with growth trend and YoY comparison
- **Dossier Generation Success Rate** with quality confidence scoring
- **Customer Acquisition Cost (CAC)** and Lifetime Value (LTV) ratios
- **Team Productivity Metrics** showing dossiers per user and time savings
- **System Performance** with 99.9% uptime and response time indicators

##### **Revenue Intelligence:**
- **MRR Breakdown** by plan tier with expansion/contraction analysis
- **Cohort Analysis** showing customer retention and expansion patterns
- **Churn Prediction** with at-risk customers and intervention opportunities
- **Revenue Forecasting** with confidence intervals and scenario modeling

##### **User Behavior Analytics:**
- **Conversion Funnel** from trial signup to paid subscription
- **Feature Adoption** showing which Intelligence Theater features drive retention
- **Usage Patterns** identifying power users and expansion opportunities
- **Geographic Analysis** showing regional performance and expansion opportunities

#### **Visual Design Requirements:**
- **C-suite presentation quality:** Clean, professional charts suitable for board meetings
- **Interactive drill-down:** Click any metric to see detailed breakdowns and trends
- **Export capabilities:** PDF/PowerPoint export for executive presentations
- **Real-time updates:** Live dashboard with auto-refresh and change indicators
- **Mobile executive view:** Optimized mobile dashboard for executives on-the-go

### **8. Self-Service Billing Portal - Modern SaaS Subscription Management** 💳

Create a **Stripe-style billing interface** with intelligent usage management and seamless upgrade experiences:

#### **Billing Portal Architecture:**
```typescript
interface BillingPortal {
  subscriptionOverview: SubscriptionWidget;
  usageMonitoring: UsageWidget;
  paymentManagement: PaymentWidget;
  invoiceHistory: InvoiceWidget;
  planComparison: PlanComparisonWidget;
}

interface UsageWidget {
  currentUsage: UsageMetric[];
  projectedUsage: UsageProjection;
  usageLimits: PlanLimits;
  upgradeRecommendations: UpgradePrompt[];
}
```

#### **Billing Components:**

##### **Subscription Overview:**
- **Current Plan Display** with features, limits, and next billing date
- **Usage Visualization** with consumption charts and remaining allowances  
- **Billing History** with downloadable invoices and payment receipts
- **Plan Comparison** showing current vs. available plans with ROI analysis

##### **Intelligent Usage Management:**
- **Real-time Usage Tracking** with dossier generation consumption
- **Usage Projections** predicting monthly consumption based on current patterns
- **Smart Upgrade Prompts** triggered by usage patterns with cost-benefit analysis
- **Usage Optimization Tips** helping users maximize value within current plan

##### **Payment & Billing:**
- **Payment Method Management** with secure card storage and backup methods
- **Billing Preferences** including billing contacts, frequency, and notifications
- **Invoice Management** with automated downloads and accounting integration
- **Payment Failure Recovery** with gentle dunning and easy retry flows

#### **Visual Design Requirements:**
- **Modern SaaS aesthetic:** Clean, trustworthy design like Stripe, Notion, or Linear billing
- **Usage transparency:** Clear visualization of consumption vs. limits with no surprises
- **Frictionless upgrades:** Smooth plan change flow with prorated billing calculations
- **Mobile billing management:** Full billing functionality optimized for mobile devices

### **9. Admin Control Panel - Enterprise System Management** ⚙️

Create a **comprehensive admin interface** for user management, system configuration, and operational control:

#### **Admin Panel Architecture:**
```typescript
interface AdminControlPanel {
  userManagement: UserManagementWidget[];
  organizationSettings: OrgSettingsWidget[];
  systemConfiguration: SystemConfigWidget[];
  securityControls: SecurityWidget[];
  operationalMetrics: OperationalWidget[];
}

interface UserManagementWidget {
  userList: User[];
  roleManagement: Role[];
  accessControls: Permission[];
  provisioningWorkflows: ProvisioningRule[];
}
```

#### **Admin Components:**

##### **User & Organization Management:**
- **User Directory** with search, filtering, and bulk operations
- **Role-Based Access Control** with custom role creation and permission assignment
- **Organization Settings** including branding, security policies, and integrations
- **User Provisioning** with automated onboarding and deactivation workflows

##### **System Configuration:**
- **Integration Management** for Salesforce, Slack, and other enterprise tools
- **API Configuration** with rate limiting, authentication, and monitoring
- **Feature Flag Management** for controlled rollout of new features
- **Notification Settings** for system alerts and user communications

##### **Security & Compliance:**
- **Security Audit Log** showing all system access and configuration changes
- **Compliance Dashboard** with SOC 2, GDPR, and enterprise security metrics
- **Threat Detection** with unusual activity alerts and security recommendations
- **Data Management** with retention policies and export capabilities

#### **Visual Design Requirements:**
- **Enterprise admin aesthetic:** Professional, functional design suitable for IT administrators
- **Efficient workflows:** Bulk operations and keyboard shortcuts for power users
- **Clear hierarchy:** Organized navigation with role-appropriate access controls
- **Operational visibility:** Real-time system status with actionable alerts and recommendations

### **10. Performance Monitoring Dashboard - System Health & Operations** 🔍

Create **real-time operational dashboards** for system health monitoring and performance optimization:

#### **Performance Dashboard Components:**
- **System Health Overview** with service status, response times, and error rates
- **Agent Performance Monitoring** showing 3-agent system efficiency and bottlenecks
- **Database Performance** with query optimization and capacity planning metrics
- **API Performance** with endpoint response times and rate limiting analytics
- **Infrastructure Monitoring** with server health, scaling events, and cost optimization

#### **Visual Design Requirements:**
- **Operations center design:** Dark theme dashboard suitable for NOC (Network Operations Center) environments
- **Real-time monitoring:** Live updates with alerting and threshold indicators
- **Drill-down analysis:** Click any metric for detailed investigation and root cause analysis
- **Mobile ops dashboard:** Critical system health monitoring optimized for mobile incident response

---

## **Epic 4 Mock Data & Business Context**

### **Executive Analytics Scenarios:**
- **Monthly Board Meeting:** CEO reviews MRR growth, customer acquisition, and product usage trends
- **Quarterly Business Review:** CFO analyzes revenue forecasting and churn prediction models
- **Product Strategy Session:** CPO reviews feature adoption and user behavior analytics

### **Billing Portal Scenarios:**
- **Plan Upgrade:** Customer approaching usage limits receives intelligent upgrade recommendation
- **Payment Update:** Finance team updates payment method before renewal cycle
- **Invoice Management:** Accounting team downloads invoices for financial reporting

### **Admin Management Scenarios:**
- **New Employee Onboarding:** IT admin provisions new users with appropriate role assignments
- **Security Audit:** CISO reviews access logs and compliance metrics for quarterly audit
- **System Configuration:** Operations team configures new Salesforce integration settings

---

## **Epic 4 Technical Implementation Notes**

### **Analytics & Business Intelligence:**
- Implement **data warehouse** with ETL pipelines for analytics processing
- Use **time-series databases** for performance metrics and usage analytics
- Build **real-time dashboards** with WebSocket connections for live updates
- Support **custom reporting** with drag-and-drop report builder functionality

### **Billing & Subscription Management:**
- Integrate **Stripe Billing** for subscription lifecycle management
- Implement **usage metering** with real-time consumption tracking
- Build **intelligent upgrade prompts** based on usage patterns and predictive analytics
- Support **enterprise billing** with custom contracts and invoicing workflows

### **Admin & Operations:**
- Implement **role-based access control (RBAC)** with fine-grained permissions
- Build **audit logging** for security compliance and operational transparency
- Support **single sign-on (SSO)** integration with enterprise identity providers
- Implement **automated monitoring** with alerting and incident response workflows

---

## **Epic 4 Success Criteria**

### **Executive Analytics:**
- ✅ C-suite quality dashboard suitable for board presentations
- ✅ Real-time business intelligence with predictive analytics
- ✅ Customizable reports with export and sharing capabilities
- ✅ Mobile executive dashboard for on-the-go business monitoring

### **Billing & Subscription Management:**
- ✅ Self-service billing portal with automated subscription management
- ✅ Intelligent usage monitoring with proactive upgrade recommendations
- ✅ Seamless plan changes with prorated billing calculations
- ✅ Enterprise billing support with custom contracts and invoicing

### **Admin & Operations Management:**
- ✅ Comprehensive user and organization management interface
- ✅ Enterprise security controls with audit logging and compliance metrics
- ✅ System configuration management with feature flag controls
- ✅ Real-time operational monitoring with automated alerting

### **Performance & Scale:**
- ✅ Real-time system health monitoring with operational dashboards
- ✅ Performance optimization tools with automated scaling recommendations
- ✅ Enterprise-grade security with threat detection and response
- ✅ Operational excellence with automated monitoring and incident response

**Use this prompt extension AFTER the base lovable-prompt.md for all Epic 4 advanced analytics and admin components! 🚀**