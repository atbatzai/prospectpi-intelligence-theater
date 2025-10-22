# Technical Requirements

### Frontend-First Development Philosophy

**Core Principle:** Build lovable interfaces first, coordinate with UX Expert agent, then architect backend to support the user experience. Every component must be testable in isolation before backend integration.

**Frontend Architecture (Lovable-First)**
```
Tech Stack (Free/Affordable Focus):
- React 18+ with TypeScript (Free)
- Next.js 14+ (App Router) (Free)
- Tailwind CSS + Shadcn/ui (Free)
- Storybook for component development (Free)
- Framer Motion for micro-interactions (Free)
- Docker containers for development consistency (Free)

Key Components (Epic-Driven Development):
- DossierGenerator: Main input form with company name + context
- DossierViewer: CIA-formatted document viewer with PDF export
- UsageTracker: Real-time plan usage with upgrade prompts
- SalesforcePanel: Lightning Component wrapper
- AgentProgress: Real-time 3-agent orchestration visualization
```

**Backend Architecture (Container-First, API-Parallel)**
```
Tech Stack (Cost-Optimized):
- Node.js + Fastify (Free, high performance)
- TypeScript throughout (Free)
- Prisma ORM with PostgreSQL (Free tier available)
- Redis for caching and queues (Free tier available)
- BullMQ for async dossier generation (Free)
- Docker Compose for development (Free)
- Docker Swarm for production (Free alternative to K8s)

Services (Container-Based):
- dossier-generation-service: 3-agent orchestration with Claude Sonnet 4
- user-management-service: Authentication, RBAC
- billing-service: OpenPay integration, usage tracking
- integration-service: Salesforce, Slack APIs
- api-gateway: Rate limiting, routing, security
```

**3-Agent Intelligence System (Orchestration-Focused)**
```
Agent 1: Intelligence Coordinator (Claude Sonnet 4)
- Role: Orchestration + Quality Assurance + User Interaction
- Input: Company name + optional context from user
- Output: Workflow plan + quality gates + progress updates
- User Interaction: Natural language progress updates, clarification requests
- Best Practices: Conversational tone, transparent reasoning, error explanation

Agent 2: Field Intelligence Researcher (Production Configured)
- Role: Data collection from 4 premium sources + real-time web
- APIs: TheirStack (21K+ techs), MarketAux (financial), Coresignal MCP (professional), Perplexity (real-time)
- Tokens: JWT eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..., SDHJm2cJJmNaLBYREcEPWl0vkx3pb0AwyrOldDQU, d6JxXWhii1LRK6oTOQPihCAWrCEJoRBz, pplx-YOUR_PERPLEXITY_API_KEY_HERE
- Output: Raw data + source metadata + confidence scoring  
- Model: DeepSeek (cost-optimized) + GPT-4o-mini (fallback)
- Cost: $0.70/dossier (vs $4-7 with placeholders)

Agent 3: Prospect Intelligence Detective (Claude Sonnet 4)
- Role: Triangulation + confidence scoring + final synthesis
- Input: Raw research data + user context
- Output: CIA-formatted dossier with citations
- Quality Control: Conservative temperature (0.1-0.3), evidence validation
- User Feedback: Real-time synthesis progress, quality indicators
```

### Agent Orchestration & User Interaction

**Agent-to-User Communication Best Practices:**
```typescript
// Real-time progress updates following current best practices
interface AgentProgress {
  stage: 'planning' | 'researching' | 'analyzing' | 'synthesizing';
  agent: 'coordinator' | 'researcher' | 'detective';
  message: string;
  confidence: number;
  estimatedTimeRemaining: number;
  userCanInterrupt: boolean;
}

// Example user interaction flow
const progressUpdates = [
  { 
    agent: 'coordinator', 
    message: "🎯 Analyzing your request for Acme Corp. I'll focus on cloud migration signals based on your context.",
    userCanInterrupt: true 
  },
  { 
    agent: 'researcher', 
    message: "🔍 Gathering intelligence from 12 sources... Found interesting hiring patterns.",
    userCanInterrupt: false 
  },
  { 
    agent: 'detective', 
    message: "🧩 Synthesizing insights... High confidence on cloud migration timeline.",
    userCanInterrupt: true 
  }
];
```

**Agent Orchestration Workflow:**
```mermaid
graph TD
    A[User Input] --> B[Coordinator Agent]
    B --> C{Context Analysis}
    C -->|Clear Request| D[Research Plan]
    C -->|Needs Clarification| E[Ask User]
    E --> B
    D --> F[Researcher Agent]
    F --> G[Data Collection]
    G --> H[Quality Check]
    H -->|Pass| I[Detective Agent]
    H -->|Fail| J[Retry/Fallback]
    J --> F
    I --> K[Synthesis]
    K --> L[Confidence Scoring]
    L --> M{Quality Gate}
    M -->|High Quality| N[Deliver Dossier]
    M -->|Low Quality| O[Human Review Flag]
    O --> P[Enhanced Processing]
    P --> I
```

**Smooth Execution Protocols:**
```typescript
class AgentOrchestrator {
  async executeDossierGeneration(request: DossierRequest): Promise<DossierResult> {
    // 1. Coordinate with real-time user updates
    const coordinator = new IntelligenceCoordinator({
      model: 'claude-3-5-sonnet-20241022',
      temperature: 0.1,
      userUpdateCallback: this.sendProgressUpdate
    });
    
    // 2. Parallel API calls with error handling
    const researcher = new FieldIntelligenceResearcher({
      model: 'gpt-4o-mini', // Cost-optimized
      rateLimiter: this.rateLimiter,
      retryPolicy: this.exponentialBackoff
    });
    
    // 3. Quality-focused synthesis
    const detective = new ProspectIntelligenceDetective({
      model: 'claude-3-5-sonnet-20241022',
      temperature: 0.1,
      qualityGates: this.qualityValidation
    });
    
    // 4. Execute with proper error boundaries
    try {
      const plan = await coordinator.createResearchPlan(request);
      const data = await researcher.executeResearch(plan);
      const dossier = await detective.synthesizeDossier(data);
      
      return this.validateAndDeliver(dossier);
    } catch (error) {
      return this.handleFailureGracefully(error, request);
    }
  }
}
```

**User Input Optimization:**
```typescript
interface OptimizedUserInput {
  companyName: string; // Required
  additionalContext?: string; // "Focus on their cloud migration plans"
  priority: 'standard' | 'express'; // Time vs. thoroughness
  outputFormat: 'full' | 'executive' | 'custom';
  confidenceThreshold: 'high' | 'medium' | 'all'; // Filter low-confidence insights
}

// Smart input enhancement
class InputProcessor {
  async enhanceUserInput(raw: UserInput): Promise<OptimizedUserInput> {
    // Use Claude Sonnet 4 to understand intent and enhance context
    const enhanced = await this.coordinatorAgent.enhanceContext({
      input: raw,
      userHistory: this.getUserPreviousRequests(),
      industryContext: this.getIndustryInsights(raw.companyName)
    });
    
    return enhanced;
  }
}
```

### Data Sources & API Integration

**Production-Ready API Configuration (All Keys Available)**
```
Enterprise Intelligence Stack:
- TheirStack JWT: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJqZWZmLnR1cm5lckBhdGJhdHouYWkiLCJwZXJtaXNzaW9ucyI6InVzZXIiLCJjcmVhdGVkX2F0IjoiMjAyNS0xMC0wMVQyMjoyNDoyNy4zNDkxMDArMDA6MDAifQ.zqo5J7SxE5KvouPmzW0bovKAg9VSCIbLWWOAFQV0r9c
- MarketAux Token: SDHJm2cJJmNaLBYREcEPWl0vkx3pb0AwyrOldDQU
- Coresignal MCP: d6JxXWhii1LRK6oTOQPihCAWrCEJoRBz
- Perplexity Real-Time: pplx-YOUR_PERPLEXITY_API_KEY_HERE

Multi-AI Processing Pipeline:
- Claude 3.5 Sonnet: sk-YOUR_OPENAI_API_KEY_HERE
- OpenAI GPT-4o-mini: sk-YOUR_OPENAI_API_KEY_HERE
- DeepSeek Cost-Optimized: sk-c5f01f01f3ef4c5ba694aeb8ce3da07a
- Google Gemini: AIzaSyB8IheEO8fHh9ryGV11w-uyKh1f4dPxJbY

Professional Document Services:
- Google Cloud Vision: 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
- Adobe PDF Services: 5216ec5d545f4de1ae5a9a4feaaffed1

Optimized COGS: $2.55/dossier (70% cost reduction)
Revenue per dossier: $50-200
Gross margin: 95-98% (industry-leading)
```

**API Documentation Requirements for Launch**
```
Public API Endpoints:
POST /api/v1/dossiers
- Input: company_name (required), context (optional), user_preferences
- Output: dossier_id, status, estimated_completion_time

GET /api/v1/dossiers/{id}
- Output: Complete dossier JSON + metadata

GET /api/v1/dossiers/{id}/pdf
- Output: PDF download of formatted dossier

Rate Limits:
- Starter: 3 requests/month (hard cap)
- Professional: 15 requests/month (hard cap)  
- Enterprise: 50 requests/month (hard cap)
```

### Performance Requirements

**Dossier Generation SLA**
- **Target:** <10 minutes (95th percentile)
- **Maximum:** 15 minutes (hard timeout)
- **Success Rate:** >95%
- **Concurrent Users:** Support 100+ simultaneous generations

**System Performance**
- **Page Load:** <2 seconds (desktop), <3 seconds (mobile)
- **API Response:** <500ms for non-generation endpoints
- **Uptime:** 99.9% (excluding planned maintenance)

### Security & Compliance

**Enterprise Security (MVP Foundation)**
```
Authentication:
- OAuth 2.0 with JWT tokens
- Session management with Redis
- Basic RBAC (Admin/User roles)

Data Protection:
- Zero PII policy (no personal data ingestion)
- Encryption at rest (AES-256)
- TLS 1.3 for all communications
- Data retention: 90 days default

Audit & Monitoring:
- Basic audit logging (user actions, dossier generation)
- Error tracking and alerting
- Usage monitoring for billing

SOC 2 Preparation:
- Security controls framework
- Incident response procedures
- Regular security assessments
```

---

