# SPRINT 1 TEST MATRIX
# Comprehensive Testing Plan for Epic 8 + Story 9.1 Skeleton
# Prepared by: Quinn (Test Architect)

## TEST EXECUTION SCHEDULE (2-week sprint)

### WEEK 1: Integration + Performance Baseline

#### 8.1 Predictive Intelligence Engine Tests

**Unit Tests** (Days 1-2, 4 hours)
-  Model initialization with valid weights
-  Prediction with valid input (company, opportunity data)
-  Confidence scoring algorithm
-  Feature extraction (24+ features from company data)
-  Cost tracking within budget

**Integration Tests** (Days 2-3, 6 hours)
-  End-to-end: API request  ML prediction  result returned
-  WebSocket: Real-time prediction updates to frontend
-  Database: Prediction results persisted and retrievable
-  Monitoring: Prediction metrics exported to Prometheus

**Performance Tests** (Days 4-5, 8 hours)
-  Single prediction latency: < 2 seconds (p95)
-  Batch predictions (10 companies): < 15 seconds
-  Concurrent users (100): No degradation
-  Memory usage: < 512 MB per 100 concurrent requests
-  CPU usage: < 80% under 100 RPS

**Load Test** (Day 5, 6 hours)
- Target: 1000 RPS (company predictions)
- Duration: 15 minutes sustained
- Ramp: 100 RPS per minute
- Success: p95 latency < 5s, error rate < 1%

#### 8.2 AI Competitive Analysis Tests

**Unit Tests** (Days 1-2, 4 hours)
-  SWOT generation from company data
-  Competitor identification (top 5)
-  Market position scoring
-  Claude API integration (mock)

**Integration Tests** (Days 2-3, 6 hours)
-  End-to-end: Company input  Claude analysis  SWOT results
-  Cost tracking (Claude tokens): Within budget
-  Rate limiting: < 50 req/min enforced
-  Result caching: Duplicate requests served from cache

**Rate Limiting Tests** (Days 3-4, 6 hours)
- Burst test: 100 requests in 1 minute  50 succeed, 50 rate-limited
- Sustained test: 30 RPS for 10 minutes  consistent 50 req/min cap
- Recovery: After 1 minute of no requests  limit reset

**Cost Optimization Tests** (Day 4, 4 hours)
- Token counting: Actual vs. estimated
- Prompt optimization: < 500 tokens per request
- Caching hit rate: > 60% for repeated companies

#### 8.3 Intelligent Dossier Enhancement Tests

**Unit Tests** (Days 1-2, 4 hours)
-  Preference learning from dossier views
-  Personalization ML model initialization
-  Section ranking based on user profile
-  Feature extraction from user history

**Integration Tests** (Days 2-3, 6 hours)
-  End-to-end: User views dossier  preferences learned  next dossier personalized
-  WebSocket: Real-time dossier updates with personalized sections
-  Database: User preferences persisted

**Personalization Performance Tests** (Days 3-4, 8 hours)
- Latency: < 500 ms to generate personalized dossier
- Accuracy: User satisfaction score > 4.0/5 (survey)
- Cold start: First dossier uses sensible defaults, no errors

**A/B Testing Setup** (Days 4-5, 6 hours)
- Control: Generic dossier ordering
- Variant A: Personalized ordering
- Sample: 100 users per variant
- Metric: Time spent, sections read, repeat usage

---

### WEEK 2: Security + Staging Deployment + Optional 9.1

#### Security Tests (All Stories) (Days 6-7, 12 hours)

**Authentication/Authorization** (RBAC - Story 9.3 foundation)
-  Unauthenticated request  401 Unauthorized
-  Expired token  401 Unauthorized
-  Invalid token  401 Unauthorized
-  Valid token, insufficient permissions  403 Forbidden

**Input Validation**
-  SQL injection (company_name): Blocked
-  XSS (dossier content): Sanitized
-  Large payloads (> 10 MB): Rejected
-  Malformed JSON: Rejected with 400

**Data Protection**
-  Dossier data encrypted at rest
-  API responses: No sensitive data in logs
-  WebSocket: Encrypted connection (WSS)

#### Monitoring & Observability Tests (Story 8.1) (Days 7-8, 8 hours)

**Prometheus Integration**
-  Metrics exported: latency, error rate, prediction accuracy
-  Scrape target responding on :9090
-  Custom metrics: prospectpi_prediction_latency_ms, prospectpi_predictions_total

**Grafana Dashboards**
-  Dashboard 1: Real-time prediction metrics (latency, throughput)
-  Dashboard 2: Error rates and failure breakdown
-  Dashboard 3: Resource usage (CPU, memory, DB connections)

**Alert Rules**
-  Alert: Latency p95 > 5s for 5 minutes
-  Alert: Error rate > 2% for 5 minutes
-  Alert: Prediction accuracy < 70% (if available)
-  Alert: CPU usage > 80% for 10 minutes

#### Staging Deployment & Smoke Tests (Days 8-9, 8 hours)

**Pre-Deployment**
-  All unit tests passing (100%)
-  All integration tests passing (100%)
-  Type checking: 	sc --noEmit clean
-  Linting: eslint clean

**Deployment to Staging**
-  Build Docker image
-  Push to staging registry
-  Deploy to k8s staging cluster
-  Database migrations applied

**Smoke Tests (Post-Deployment)**
-  Health endpoint responding (GET /health  200)
-  API endpoints responding:
  - POST /api/v1/research/generate-dossier  200
  - GET /api/v1/dossier/{id}  200
  - WebSocket /ws/research/{requestId}  connection established
-  Database connectivity: SELECT 1  success
-  Cache connectivity: Redis PING  PONG
-  External APIs: Claude API, TheirStack  connectivity OK

**Staging Validation** (24 hour soak)
-  No errors in logs for 24 hours
-  Performance metrics stable (p95 latency consistent)
-  Monitoring alerts not firing

#### OPTIONAL: Story 9.1 CRM Skeleton Tests (Days 9-10, if parallel assigned)

**OAuth Flow Tests** (Salesforce example)

**Unit Tests**
-  AuthorizationUrl generation with valid state
-  Token exchange with valid code
-  User profile retrieval with valid token
-  Token refresh with valid refresh_token

**Integration Tests**
-  End-to-end: CRM OAuth  Token received  User provisioned
-  User created in ProspectPI database with CRM reference
-  Multiple CRM connections per user (Salesforce + HubSpot)

**Error Handling Tests**
-  Invalid code  error response
-  Expired token  refresh triggered
-  CRM API down  graceful degradation
-  Invalid provider  400 Bad Request

---

## TEST INFRASTRUCTURE SETUP (Week 1, Day 1)

**Tools Required**
- Jest: Unit + integration tests
- k6 or Apache JMeter: Load testing
- Prometheus: Metrics collection
- Grafana: Dashboards
- Postman/Insomnia: Manual API testing
- GitHub Actions: CI/CD pipeline

**Data Fixtures**
- Test company data (50+ companies)
- Test user profiles (100+ users)
- Mock Claude API responses
- Mock prediction data

**Environments**
- Local (Developer machines)
- CI (GitHub Actions)
- Staging (K8s cluster)

---

## TEST METRICS & REPORTING (Daily)

**Daily Standup Report** (5 PM each day)
- Tests run: X / Y passed (% pass rate)
- Coverage: X% of code
- Blockers: [list]
- Next day focus: [focus areas]

**Sprint Review Report** (Day 10)
- Total tests written: 150+
- Coverage: > 85% for critical paths
- Performance metrics: [table of latencies, RPS]
- Security scan: 0 critical issues
- Load test results: [peak RPS achieved, error rate]

---

## RISK & CONTINGENCY

**Risk**: Latency > 2s for 8.1
Contingency: Model optimization or caching layer

**Risk**: Rate limiting ineffective on 8.2
Contingency: Token bucket algorithm hardening

**Risk**: Personalization accuracy < 4.0/5
Contingency: Hybrid recommendation (blend generic + personalized)

**Risk**: Staging deployment fails
Contingency: Rollback to previous stable version, debug in dev

---

## SUCCESS CRITERIA FOR SPRINT 1

 Epic 8 ready for production (high confidence)
 150+ tests passing, > 85% coverage
 Performance targets met (latencies, RPS)
 Security: 0 critical vulnerabilities
 Monitoring: Fully functional dashboards
 Staging validation: 24-hour soak clean
 (Optional) Story 9.1 skeleton: OAuth providers working

