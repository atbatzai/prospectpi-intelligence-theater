# ProspectPI Intelligence Theater - Full-Stack Architecture Document

**Version:** 1.0  
**Date:** October 7, 2025  
**Architect:** Winston  
**Status:** ALIGNED - Frontend Stories + Lovable Integration Ready  

---

## Introduction

This document outlines the complete fullstack architecture for **ProspectPI Intelligence Theater MVP**, including backend systems, frontend implementation, and their integration. It serves as the single source of truth for AI-driven development, ensuring consistency across the entire technology stack.

This architecture is **fully aligned** with:
- ✅ **Lovable Frontend Specifications** (React/TypeScript/Tailwind)
- ✅ **Scrum Master Stories** (3-agent system, API endpoints, UX design)
- ✅ **Enterprise Requirements** (SQLite→PostgreSQL, pandas, Docker portability)

### Starter Template Decision

**Decision:** Custom architecture optimized for intelligence platform requirements rather than generic fullstack starter.
- **Rationale:** Lovable frontend + custom Python backend provides optimal developer experience
- **Frontend:** Lovable-generated React/TypeScript components
- **Backend:** Custom FastAPI services with pandas analytics
- **Integration:** Docker containerization for seamless Vercel deployment

### Change Log

| Date | Version | Description | Author |
|------|---------|-------------|---------|
| 2025-10-07 | 1.0 | Initial architecture aligned with frontend specs and stories | Winston (Architect) |

---

## High Level Architecture

### Technical Summary

ProspectPI employs a **frontend-first containerized architecture** where **Lovable-generated React components** interface with **Python FastAPI microservices** orchestrating the **3-agent intelligence system**. The frontend uses **TypeScript interfaces from Story 1.2**, the backend implements **pandas-based analytics from Story 1.1**, and the **UX follows Story 2.2 specifications**. **SQLite development** enables zero-setup with **PostgreSQL production migration**. **Docker containers** ensure **Vercel deployment compatibility**.

### Platform and Infrastructure Choice

**SELECTED: Hybrid Frontend-First + Container Services**

**Platform:** Vercel (Frontend) + Railway/Render (Backend Services)  
**Key Services:** Next.js App Router, FastAPI with pandas, SQLite→PostgreSQL, Redis  
**Deployment Regions:** Global edge (Vercel) + US-East (Railway)

**Rationale:** 
- **Frontend Excellence:** Vercel optimizes Lovable React components perfectly
- **Python AI Services:** Railway provides excellent Python container hosting  
- **Cost Optimization:** Free development tiers, affordable production scaling
- **Developer Experience:** Matches Lovable workflow and story requirements

### Repository Structure

**Structure:** Monorepo aligned with Lovable frontend + microservices  
**Organization:** Frontend app + Python services + shared types

```
prospectpi-intelligence/
├── apps/
│   ├── web/                    # Lovable-generated Next.js frontend
│   │   ├── components/         # Intelligence Theater components
│   │   │   ├── DossierGenerator.tsx    # Story 2.2 smart input
│   │   │   ├── AgentProgressTheater.tsx # Story 2.2 3-column theater  
│   │   │   └── DossierViewer.tsx        # Story 2.2 CIA document
│   │   └── types/              # Story 1.2 TypeScript interfaces
│   ├── api-gateway/           # FastAPI request routing
│   ├── dossier-service/       # Story 1.1 3-agent orchestration
│   ├── user-service/          # Authentication & billing
│   └── integration-service/   # External API management
├── packages/
│   ├── shared-types/          # Story 1.2 interfaces (TS + Python)
│   └── database/              # Prisma schema + SQLite
├── infrastructure/
│   ├── docker-compose.dev.yml # Development with SQLite
│   └── docker-compose.prod.yml # Production with PostgreSQL
└── data/
    └── sqlite/                # SQLite development databases
```

### Architecture Diagram

```mermaid
graph TB
    subgraph "Frontend (Vercel + Lovable)"
        A[Next.js App Router] --> B[Smart Input Interface]
        B --> C[Agent Progress Theater]  
        C --> D[CIA Document Viewer]
        D --> E[ProspectPI Branding]
    end
    
    subgraph "API Gateway (FastAPI)"
        F[Request Validation] --> G[Authentication JWT]
        G --> H[Rate Limiting]
        H --> I[Agent Orchestration]
    end
    
    subgraph "3-Agent System (Story 1.1)"
        J[Intelligence Coordinator] --> K[Claude 3.5 Sonnet]
        L[Field Researcher] --> M[DeepSeek + APIs]
        N[Intelligence Detective] --> O[Claude 3.5 Sonnet]
        M --> P[Pandas Analytics]
    end
    
    subgraph "Data Layer"
        Q[SQLite Dev] --> R[PostgreSQL Prod]  
        S[Redis Cache] --> T[Real-time Progress]
    end
    
    subgraph "External APIs (Story 1.1)"
        U[TheirStack JWT]
        V[MarketAux Token]
        W[Coresignal MCP]
        X[Perplexity API]
    end
    
    A --> F
    I --> J
    J --> L
    L --> N
    L --> U
    L --> V  
    L --> W
    L --> X
    N --> Q
    T --> A
```

### Architectural Patterns

- **Frontend-First Development:** Lovable React components drive backend API design (Story 2.2)
- **3-Agent Orchestration:** State machine coordination with real-time progress (Story 1.1)
- **API-First Integration:** Story 1.2 TypeScript interfaces define backend contracts
- **Pandas Analytics Pipeline:** Python data science for intelligence confidence scoring
- **Container-Native Services:** Docker enables consistent dev/prod environments
- **Progressive Enhancement:** SQLite→PostgreSQL migration path without code changes

---

## Tech Stack (DEFINITIVE - ALIGNED WITH STORIES)

| Category | Technology | Version | Purpose | Story Alignment |
|----------|------------|---------|---------|-----------------|
| **Frontend Language** | TypeScript | 5.3.3 | Lovable-generated components | Story 2.2 + Lovable specs |
| **Frontend Framework** | Next.js | 14.2.0 | React with App Router | Lovable requirement |
| **UI Components** | Shadcn/ui + Tailwind | Latest | ProspectPI brand theme | Story 2.2 Navy/Violet branding |
| **State Management** | Zustand | 4.4.7 | Real-time agent progress | Story 2.2 progress theater |
| **Backend Language** | Python | 3.11 | AI agents + pandas analytics | Story 1.1 agent implementation |
| **Backend Framework** | FastAPI | 0.104.0 | Story 1.2 API endpoints | REST + WebSocket support |
| **API Architecture** | REST + WebSocket | HTTP/WS | Story 1.2 + real-time progress | Matches Lovable integration |
| **Database** | SQLite → PostgreSQL | 3.45 → 15 | Zero-setup → production scale | Your SQLite requirement |
| **Cache & Messaging** | Redis | 7.2 | Agent coordination + progress | Story 1.1 orchestration |
| **Data Analytics** | Pandas + NumPy | 2.1.4 | Intelligence processing | Your pandas requirement |
| **Authentication** | NextAuth.js | 4.24.0 | JWT tokens for API access | Story 1.2 security |
| **AI Models** | Claude 3.5 Sonnet | Latest | Coordinator + Detective agents | Story 1.1 specifications |
| **AI Cost Optimization** | DeepSeek | Latest | Field Researcher agent | Story 1.1 cost targets |
| **Containerization** | Docker + Compose | Latest | Vercel deployment ready | Your Docker requirement |
| **Testing Frontend** | Vitest + Testing Library | Latest | Lovable component testing | Frontend quality |
| **Testing Backend** | Pytest + FastAPI | Latest | Agent + API testing | Story 1.1 validation |
| **CI/CD** | GitHub Actions | Latest | Automated deployment | Story integration |

---

## Data Models (ALIGNED WITH STORY 1.2)

### TypeScript Interfaces (Story 1.2 Compliance)

```typescript
// Story 1.2: Frontend Form Data Interface (Lovable Integration)
interface ProspectResearchInput {
  companyName: string;                    // Required - Story 1.2
  companyUrl?: string;                    // Optional - Story 1.2
  linkedinUrl?: string;                   // Optional - Story 1.2  
  crmNotes?: string;                      // Optional - max 1000 chars
  organizationFocus?: string;             // Optional - Story 1.2
  locationOfInterest?: string;            // Optional - Story 1.2
  contextLinks?: string[];                // Optional - array of URLs
  additionalContext?: string;             // Optional - max 2000 chars
}

// Story 2.2: Agent Progress Interface (UX Theater)
interface AgentProgress {
  stage: 'planning' | 'researching' | 'analyzing' | 'synthesizing' | 'quality_check';
  agent: 'intelligence_coordinator' | 'field_researcher' | 'intelligence_detective';
  message: string;
  confidence: number;
  estimatedTimeRemaining: number;
  userCanInterrupt: boolean;
  dataSourcesActive: string[];
  insightsDiscovered: number;
}

// Story 1.2: API Response Interface
interface ResearchApiResponse {
  success: boolean;
  requestId: string;
  status: 'processing' | 'complete' | 'error';
  estimatedCompletion?: number;
  websocketUrl?: string;
  dossier?: IntelligenceDossier;
  error?: ApiError;
}
```

### Database Schema (SQLite → PostgreSQL)

```prisma
// User Management (Story Authentication)
model User {
  id          String   @id @default(cuid())
  email       String   @unique
  name        String?
  company     String?
  plan        String   @default("starter")
  createdAt   DateTime @default(now())
  
  dossiers    Dossier[]
  apiUsage    ApiUsage[]
}

// Dossier Generation (Story 1.1 + 1.2)
model Dossier {
  id              String   @id @default(cuid())
  requestId       String   @unique // Story 1.2 API requirement
  companyName     String
  status          String   // processing, completed, failed
  confidence      Float?
  sourceCount     Int      @default(0)
  generatedAt     DateTime @default(now())
  completedAt     DateTime?
  
  userId          String
  user            User     @relation(fields: [userId], references: [id])
  
  sections        DossierSection[]
  agentLogs       AgentLog[]      // Story 1.1 orchestration tracking
}

// Agent Orchestration Tracking (Story 1.1)
model AgentLog {
  id          String   @id @default(cuid())
  dossierId   String
  agent       String   // coordinator, researcher, detective
  stage       String   // planning, researching, analyzing, etc.
  message     String
  confidence  Float?
  timestamp   DateTime @default(now())
  
  dossier     Dossier  @relation(fields: [dossierId], references: [id])
}
```

### Python Data Models (Story 1.1 Analytics)

```python
# Pandas-based Intelligence Processing
import pandas as pd
from dataclasses import dataclass
from typing import List, Dict, Optional

@dataclass
class CompanyIntelligence:
    """Story 1.1: Field Researcher data structure"""
    company_name: str
    domain: str
    raw_data: pd.DataFrame
    processed_insights: pd.DataFrame
    confidence_scores: pd.Series
    api_metadata: Dict[str, any]
    
@dataclass
class AgentCoordinationState:
    """Story 1.1: Orchestration state management"""
    current_agent: str
    stage: str
    progress: float
    can_interrupt: bool
    quality_gates: List[str]
    error_state: Optional[str] = None
```

---

## Components (STORY-ALIGNED IMPLEMENTATION)

### Frontend Components (Lovable + Story 2.2)

**DossierGenerator (Story 2.2 Smart Input)**
```typescript
// Story 2.2: Smart Input Interface Implementation
interface DossierGeneratorProps {
  onSubmit: (input: ProspectResearchInput) => void;  // Story 1.2 interface
  isGenerating: boolean;
  previousCompanies: string[];
}

// Features aligned with Story 2.2:
// - Large company name input with autocomplete
// - Expandable context section with smart suggestions  
// - Priority toggle (standard/express)
// - ProspectPI Navy/Violet branding
```

**AgentProgressTheater (Story 2.2 Three-Column Theater)**
```typescript
// Story 2.2: Real-Time Agent Visualization
interface AgentProgressTheaterProps {
  agents: AgentProgress[];           // Story 1.1 orchestration
  estimatedTimeRemaining: number;
  onPause: () => void;
  canInterrupt: boolean;
}

// Features aligned with Story 2.2:
// - Intelligence Coordinator column (circular progress)
// - Field Researcher column (4 parallel API bars)  
// - Intelligence Detective column (confidence meter)
// - Real-time WebSocket updates from Story 1.1
```

**DossierViewer (Story 2.2 CIA Document)**
```typescript
// Story 2.2: Professional Intelligence Report
interface DossierViewerProps {
  dossier: IntelligenceDossier;
  onExportPDF: () => void;
}

// Features aligned with Story 2.2:
// - CIA-style header with ProspectPI branding
// - 8 expandable sections (Executive Summary, Technology, etc.)
// - Confidence indicators with Navy/Violet color coding
// - Source attribution on hover
```

### Backend Services (Story 1.1 Implementation)

**Intelligence Coordinator Service (Story 1.1 Agent 1)**
```python
# Story 1.1: Agent 1 Implementation
class IntelligenceCoordinator:
    def __init__(self):
        self.model = "claude-3-5-sonnet-20241022"  # Story 1.1 spec
        self.temperature = 0.1                     # Conservative quality
        self.api_key = "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"
        
    async def orchestrate_research(self, request: ProspectResearchInput) -> ResearchPlan:
        # Story 1.1: Workflow planning + quality gates + user interaction
        # Real-time progress updates via WebSocket to Story 2.2 theater
```

**Field Intelligence Researcher (Story 1.1 Agent 2)**  
```python
# Story 1.1: Agent 2 Implementation with API Keys
class FieldIntelligenceResearcher:
    def __init__(self):
        self.primary_model = "deepseek-chat"       # Cost optimization
        self.fallback_model = "gpt-4o-mini"       # Reliability
        self.api_keys = {
            "theirstack": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",  # Story 1.1
            "marketaux": "SDHJm2cJJmNaLBYREcEPWl0vkx3pb0AwyrOldDQU",   # Story 1.1  
            "coresignal": "d6JxXWhii1LRK6oTOQPihCAWrCEJoRBz",          # Story 1.1
            "perplexity": "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" # Story 1.1
        }
        
    async def gather_intelligence(self, company: str) -> pd.DataFrame:
        # Story 1.1: Parallel API calls + pandas processing + $0.70 cost target
        # Real-time progress to Story 2.2 4-source progress bars
```

**Intelligence Detective Service (Story 1.1 Agent 3)**
```python  
# Story 1.1: Agent 3 Implementation
class IntelligenceDetective:
    def __init__(self):
        self.model = "claude-3-5-sonnet-20241022"  # Story 1.1 spec
        self.temperature = 0.1                     # Evidence validation
        self.api_key = "sk-ant-api03-oRJGXPfD3qe2sLDD17Dbx_7USPSxgKPWVGqafJrBaipV0tX6c8QZ-NKnkLUBapVx4o7FG6Zd0vaH0LLKf6gjw-_F_rEgAA"
        
    async def synthesize_dossier(self, raw_data: pd.DataFrame) -> IntelligenceDossier:
        # Story 1.1: Triangulation + confidence scoring + CIA-format output
        # Confidence meter updates to Story 2.2 detective column
```

### API Implementation (Story 1.2 Compliance)

**Primary Dossier Endpoint (Story 1.2 Exact Specification)**
```python
# Story 1.2: POST /api/v1/research/generate-dossier
@app.post("/api/v1/research/generate-dossier")
async def generate_dossier(
    request: ProspectResearchInput,    # Story 1.2 interface
    current_user: User = Depends(get_current_user)
) -> ResearchApiResponse:           # Story 1.2 response format
    
    # Story 1.2: Request validation (required companyName, URL formats, char limits)
    # Story 1.1: Integration with 3-agent orchestration system
    # Story 2.2: Real-time WebSocket progress updates
    
    return ResearchApiResponse(
        success=True,
        requestId=f"req_{unique_id}",
        status="processing", 
        estimatedCompletion=480,  # Story 2.2 time estimate
        websocketUrl=f"ws://api.prospectpi.com/ws/research/{request_id}"
    )
```

---

## Docker Configuration (VERCEL-READY)

### Development Setup (SQLite)
```yaml
# docker-compose.dev.yml - Story alignment
version: '3.8'
services:
  web:
    build: ./apps/web                    # Lovable frontend
    ports: ["3000:3000"]
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8000
      - DATABASE_URL=sqlite:///data/dev.db
    
  api-gateway:
    build: ./apps/api-gateway           # Story 1.2 endpoints  
    ports: ["8000:8000"]
    environment:
      - DATABASE_URL=sqlite:///data/dev.db
      - REDIS_URL=redis://redis:6379
    volumes:
      - ./data:/app/data
      
  dossier-service:
    build: ./apps/dossier-service       # Story 1.1 agents
    environment:
      - ANTHROPIC_API_KEY=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
      - OPENAI_API_KEY=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
      - DEEPSEEK_API_KEY=sk-c5f01f01f3ef4c5ba694aeb8ce3da07a  
    volumes:
      - ./data:/app/data
      
  redis:
    image: redis:7.2-alpine
    ports: ["6379:6379"]
```

### Vercel Deployment Configuration
```json
{
  "version": 2,
  "name": "prospectpi-intelligence",
  "builds": [
    {
      "src": "apps/web/package.json",
      "use": "@vercel/next"
    },
    {
      "src": "apps/api-gateway/Dockerfile",
      "use": "@vercel/docker"  
    },
    {
      "src": "apps/dossier-service/Dockerfile",
      "use": "@vercel/docker"
    }
  ],
  "routes": [
    { "src": "/api/v1/(.*)", "dest": "/api-gateway/api/v1/$1" },
    { "src": "/ws/(.*)", "dest": "/api-gateway/ws/$1" },
    { "src": "/(.*)", "dest": "/web/$1" }
  ]
}
```

---

## 🎯 **ARCHITECTURE ALIGNMENT SUMMARY**

### ✅ **Story Compliance Matrix**

| Component | Story 1.1 (3-Agent) | Story 1.2 (API) | Story 2.2 (UX) | Lovable Frontend |
|-----------|---------------------|------------------|------------------|------------------|
| **Intelligence Coordinator** | ✅ Claude 3.5 Sonnet | ✅ API Integration | ✅ Progress Theater | ✅ React/TypeScript |
| **Field Researcher** | ✅ 4 APIs + pandas | ✅ Data Processing | ✅ 4-Source Progress | ✅ Real-time Updates |  
| **Intelligence Detective** | ✅ Synthesis + CIA | ✅ Response Format | ✅ Document Viewer | ✅ Tailwind Styling |
| **API Endpoints** | ✅ Orchestration | ✅ Exact Interface | ✅ WebSocket Progress | ✅ TypeScript Types |
| **Frontend Components** | ✅ Agent Integration | ✅ Form Validation | ✅ UX Specifications | ✅ Lovable Generated |

### ✅ **Technology Requirements Met**

- **Open Source Stack:** ✅ Python/FastAPI, React/Next.js, Redis, PostgreSQL
- **SQLite Development:** ✅ Zero-setup database with production migration  
- **Pandas Analytics:** ✅ Intelligence processing and confidence scoring
- **Docker Portability:** ✅ Vercel-ready containerization
- **Story Integration:** ✅ All interfaces, UX patterns, and agent specs aligned

### 🚀 **Ready for Implementation**

Your ProspectPI Intelligence Theater architecture is now **fully aligned** with frontend Lovable specifications and Scrum Master stories. Development teams can proceed with confidence knowing all components work together seamlessly.