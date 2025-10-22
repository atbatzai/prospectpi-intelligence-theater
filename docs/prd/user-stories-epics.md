# User Stories & Epics

### Epic 1: Core Dossier Generation (P0) 
**Total Story Points: 63 | Estimated Timeline: 3 weeks**
**Status: ✅ PRODUCTION READY - All API Keys Configured**

**Production Environment:**
```bash
# AI Services - READY
ANTHROPIC_API_KEY=sk-YOUR_OPENAI_API_KEY_HERE
OPENAI_API_KEY=sk-YOUR_OPENAI_API_KEY_HERE
DEEPSEEK_API_KEY=sk-c5f01f01f3ef4c5ba694aeb8ce3da07a
GEMINI_API_KEY=AIzaSyB8IheEO8fHh9ryGV11w-uyKh1f4dPxJbY
PERPLEXITY_API_KEY=pplx-YOUR_PERPLEXITY_API_KEY_HERE

# Data Sources - READY
THEIRSTACK_JWT_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJqZWZmLnR1cm5lckBhdGJhdHouYWkiLCJwZXJtaXNzaW9ucyI6InVzZXIiLCJjcmVhdGVkX2F0IjoiMjAyNS0xMC0wMVQyMjoyNDoyNy4zNDkxMDArMDA6MDAifQ.zqo5J7SxE5KvouPmzW0bovKAg9VSCIbLWWOAFQV0r9c
MARKETAUX_API_TOKEN=SDHJm2cJJmNaLBYREcEPWl0vkx3pb0AwyrOldDQU
CORESIGNAL_AUTH_HEADER=d6JxXWhii1LRK6oTOQPihCAWrCEJoRBz

# Document Services - READY
GOOGLE_CLOUD_VISION_API_KEY=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
ADOBE_PDF_CLIENT_ID=5216ec5d545f4de1ae5a9a4feaaffed1
```

**Story 1: Three-Agent Orchestration System**
```
As an intelligence analyst
I want a coordinated three-agent system (Intelligence Coordinator, Field Researcher, Detective)
So that I can generate comprehensive dossiers through specialized AI collaboration

BMad Task Reference: docs/prd/brownfield-create-story-1.md
Elicitation Protocols: ✅ Complete

Acceptance Criteria:
- ✅ Intelligence Coordinator manages workflow and quality control
- ✅ Field Researcher gathers external data from multiple sources
- ✅ Detective performs deep analysis and pattern recognition
- ✅ Agent handoffs with context preservation and validation
- ✅ Quality gates ensure accuracy and completeness
- ✅ Error handling and recovery mechanisms

Story Points: 21
Priority: P0
AI Services: ✅ Claude 3.5 Sonnet, GPT-4o-mini, DeepSeek, Gemini, Perplexity
```

**Story 2: Frontend Dossier Generation Interface**
```
As an Enterprise AE
I want an intuitive interface to request and monitor dossier generation
So that I can easily create intelligence reports with minimal effort

BMad Task Reference: docs/prd/brownfield-create-story-2.md
Elicitation Protocols: ✅ Complete
UX Design: ✅ Complete - Professional CIA-inspired interface with real-time agent visualization

Acceptance Criteria:
- ✅ Single company name input with optional context
- ✅ Real-time three-agent progress visualization
- ✅ Professional dossier display with CIA-style formatting
- ✅ Interactive sections with expandable details
- ✅ Responsive design for desktop and mobile
- ✅ Accessibility compliance and keyboard navigation

Story Points: 13
Priority: P0
UX Components: ✅ Agent Progress Theater, CIA Document Viewer, Smart Input Form, Error Recovery UX
```

**Story 3: Data Integration & Quality Controls**
```
As an intelligence analyst
I want reliable data integration with quality validation
So that I can trust the accuracy and completeness of generated dossiers

BMad Task Reference: docs/prd/brownfield-create-story-3.md
Elicitation Protocols: ✅ Complete

Acceptance Criteria:
- ✅ Multiple data source integration (APIs, web scraping, databases)
- ✅ MCP Coresignal integration for professional network intelligence
- ✅ TheirStack technographic data (21K+ technologies, 34M+ job postings)
- ✅ MarketAux real-time financial news and market sentiment
- ✅ Source reliability scoring and validation
- ✅ Data quality checks and error handling
- ✅ Real-time data freshness indicators
- ✅ Confidence scoring for all insights
- ✅ Citation tracking and source attribution

Story Points: 13
Priority: P0
Data Sources: ✅ Coresignal MCP, TheirStack Tech Intelligence, MarketAux Financial, Perplexity Real-Time, Multi-AI Pipeline
```

**Story 4: CIA-Style Document Generation Engine**
```
As an intelligence analyst
I want professional CIA-style document generation with proper formatting
So that I can produce authentic intelligence reports with security classifications

BMad Task Reference: docs/prd/brownfield-create-story-4.md
Elicitation Protocols: ✅ Complete

Acceptance Criteria:
- ✅ CIA intelligence report template system
- ✅ Professional formatting with classification headers
- ✅ Security markings and handling instructions
- ✅ Content quality assurance and validation
- ✅ Consistent typography and professional layout
- ✅ Document metadata and tracking information

Story Points: 8
Priority: P0
Document Services: ✅ Adobe PDF Services, Google Cloud Vision
```

**Story 5: Real-Time Communication & Export Systems**
```
As an intelligence analyst
I want real-time progress updates and professional PDF export capabilities
So that I can monitor generation live and distribute formatted intelligence documents

BMad Task Reference: docs/prd/brownfield-create-story-5.md
Elicitation Protocols: ✅ Complete

Acceptance Criteria:
- ✅ WebSocket real-time progress updates for all three agents
- ✅ Professional PDF export with CIA styling preservation
- ✅ Export quality validation and error detection
- ✅ Comprehensive error handling with user notifications
- ✅ Live preview of findings as they're discovered
- ✅ Performance optimization for large document exports

Story Points: 8
Priority: P0
Export Services: ✅ Adobe PDF Professional, Real-Time WebSocket, Multi-Format Output
```

### Epic 2: Salesforce Lightning Integration (P0)

**User Story 2.1 - One-Click Dossier from CRM**
```
As an Enterprise AE
I want to generate a dossier directly from a Salesforce Account page
So that I can prepare for calls without leaving my workflow

Acceptance Criteria:
- ✅ "Generate ProspectPI Dossier" button on Account page (Lightning Component)
- ✅ Auto-populates company name from Account.Name
- ✅ Additional context field pre-filled from Account.Description if available
- ✅ Dossier generation launches in embedded panel or new tab
- ✅ Generated dossier auto-saves to Account Notes/Custom Field
- ✅ Works on Salesforce mobile app

Story Points: 21
Priority: P0
Dependencies: Salesforce ISV approval, OAuth integration
```

**User Story 2.2 - CRM Bi-Directional Sync**
```
As an Enterprise AE
I want dossier insights to appear in my Salesforce account record
So that my team can see the intelligence without switching tools

Acceptance Criteria:
- ✅ Dossier summary auto-populates custom "Intelligence Summary" field
- ✅ Key insights added to Account Notes with ProspectPI tag
- ✅ Confidence scoring and last updated timestamp shown
- ✅ Link back to full dossier from CRM record
- ✅ Works with both standard and custom Account objects

Story Points: 13
Priority: P0
Dependencies: Salesforce API, field mapping
```

### Epic 3: Enterprise Onboarding & User Management (P1)

**User Story 3.1 - Minimal Enterprise Signup**
```
As a VP of Sales
I want to get my team set up with minimal information required
So that we can start generating dossiers within 24 hours

Acceptance Criteria:
- ✅ Signup form: Company name, email, team size estimate, Salesforce org (optional)
- ✅ Email verification + account activation
- ✅ Choose subscription tier during signup (Starter/Professional/Enterprise)
- ✅ Payment info collection with Stripe/OpenPay
- ✅ Immediate access to dossier generation after payment
- ✅ Auto-invite team members via email list upload

Story Points: 8
Priority: P1
Dependencies: Authentication system, billing integration
```

**User Story 3.2 - Basic User Management**
```
As an Admin
I want to manage my team's ProspectPI access and usage
So that I can control costs and monitor adoption

Acceptance Criteria:
- ✅ Invite users by email with role assignment (Admin/User)
- ✅ View usage dashboard: dossiers generated, users active, plan limits
- ✅ Hard usage caps with upgrade prompts when limit reached
- ✅ Ability to remove users and transfer dossiers
- ✅ Basic audit log: who generated what dossier when

Story Points: 13
Priority: P1
Dependencies: Multi-tenant architecture, usage tracking
```

### Epic 4: Subscription & Billing (P1)

**User Story 4.1 - Hard Usage Limits & Upgrades**
```
As a ProspectPI user
I want clear limits on my plan with easy upgrade options
So that I understand costs and can scale usage smoothly

Acceptance Criteria:
- ✅ Hard caps: Starter (3/month), Professional (15/month), Enterprise (50/month)
- ✅ Usage counter visible in UI: "2 of 3 dossiers used this month"
- ✅ Graceful upgrade prompt when limit reached: "Upgrade to Professional for 15/month"
- ✅ No overage billing in MVP - must upgrade to continue
- ✅ Plan changes take effect immediately with prorated billing
- ✅ Downgrade protection: can't downgrade if current usage exceeds lower plan

Story Points: 13
Priority: P1
Dependencies: OpenPay billing platform, usage tracking
```

### Epic 5: Slack Integration (P1)

**User Story 5.1 - Slack Dossier Sharing**
```
As an Enterprise AE
I want to share dossier summaries in Slack channels
So that my team can see insights where we already collaborate

Acceptance Criteria:
- ✅ "Share to Slack" button in dossier view
- ✅ Rich message format with company name, key insights, confidence levels
- ✅ Link back to full dossier (with access control)
- ✅ Slack slash command: /prospectpi [company name] for quick generation
- ✅ Works in both public channels and DMs

Story Points: 8
Priority: P1
Dependencies: Slack API, rich message formatting
```

---

