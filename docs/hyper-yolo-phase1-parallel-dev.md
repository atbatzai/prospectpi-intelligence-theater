# Hyper YOLO Phase 1 – Parallel Development & Deployment Playbook

## Scope
- Phase 1: UX Foundation
- Epics: 2.1 (Novice-First), 2.2 (Advanced UX), 2.3 (Enterprise UX), 2.4 (Cultural Dossiers)
- Stories: 2.1.1–2.1.5, 2.2.1–2.2.2, 2.3.1–2.3.2, 2.4.1–2.4.3
- QA Source of Truth: docs/qa/phase-1-qa-framework.md

## Multi-Agent Squad
- Product / PO: Owns PRD & acceptance criteria (docs/prd/user-stories-epics.md)
- Frontend: Next.js/React UX implementation (Epic 2.1–2.2 focus)
- Backend: Node/Express + 3-agent system + cultural adapter (Epic 2.3–2.4 focus)
- QA: Owns phase-1-qa-framework + automation mapping
- DevOps: Owns docker-compose, start-* scripts, and deployment gates

## Parallel Development Lanes

### Lane A – Frontend UX (2.1.x + 2.2.x)
- Implement and wire:
  - SmartCompanyInput, DossierViewer, AgentProgressTheater, PWA/mobile shell
  - Advanced animations (2.2.1) with prefers-reduced-motion
  - Accessibility compliance (2.2.2) to WCAG 2.1 AA+
- Use API contracts already defined by backend; mock with bmad_server.js when real API is unavailable.

### Lane B – Backend & Agents (2.3.x + 2.4.x)
- Ensure:
  - Stable POST /api/v1/research/generate-dossier
  - Live WebSocket /ws/research/{requestId}
  - CulturalDetectionService + Cultural Adapter agent (2.4.1–2.4.2)
  - Adaptive dossier transformation pipeline (2.4.3)
- Maintain strict contract compatibility with existing frontend specs.

### Lane C – QA & Automation
- For every story in Phase 1:
  - Map Given/When/Then scenarios → Jest/Playwright tests
  - Enforce NFRs from phase-1-qa-framework (performance, accessibility, reliability)
  - Keep YAML gates in docs/qa/gates/ in sync with implementation state.

### Lane D – DevOps & Deployment
- Keep both projects runnable in parallel per simultaneous-development-guide:
  - ProspectPI frontend: http://localhost:3002
  - ProspectPI API: http://localhost:3001
- Use docker-compose and start-*.bat/ps1 for consistent local environments.
- Wire CI to fail on:
  - Failing QA scenarios for any Phase 1 story
  - Accessibility score below target
  - Performance budgets breached

## Definition of Ready (Story Level)
- Story appears in docs/prd/user-stories-epics.md with:
  - Clear acceptance criteria
  - PARALLEL DEVELOPMENT ARCHITECTURE section
  - Story points and priority
- Corresponding QA section exists in docs/qa/phase-1-qa-framework.md with:
  - QA GATE STATUS
  - Requirements traceability
  - Gherkin test scenarios
  - NFR validation + risk assessment

## Definition of Done (Story Level)
- Frontend:
  - Component behavior matches PRD and visual spec
  - Keyboard-only + screen reader flows verified
- Backend:
  - API/WebSocket contracts stable and documented
  - Logs, metrics, and error handling in place
- QA:
  - Automated tests exist for all listed scenarios
  - NFR checks green (performance, accessibility, reliability)
- DevOps:
  - Story included in CI quality gates
  - No regressions in previously passing Phase 1 stories

## Work Sequencing – Hyper YOLO Parallelization

1. Bootstrap
   - Ensure docker-compose stack is green for ProspectPI.
   - If full backend is blocked, run bmad_server.js as mock API for frontend progress.

2. Frontend / Backend Parallel Tracks
   - Frontend builds to the contracts defined in PRD + existing routes.
   - Backend can evolve independently as long as it preserves those contracts.

3. QA in Lockstep
   - QA never lags more than one story behind implementation.
   - Failing tests block deployment for that story’s scope.

4. Deployment
   - Deploy increments that span complete stories (not half-implemented UX).
   - Use CRITICAL-QUALITY-SPRINT principles for any customer-visible crisis.

## Operating Rhythm
- Daily:
  - 15-minute standup per lane, focused on blockers to QA PASS.
- Twice weekly:
  - Cross-lane integration check: API contracts, WebSocket behavior, accessibility status.
- End of sprint:
  - Verify every Phase 1 story in scope meets Definition of Done and passes its QA gate.
