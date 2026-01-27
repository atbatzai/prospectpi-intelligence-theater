#  BATCH 1 IMPLEMENTATION PLAN - FOUNDATION SPRINT

**Status:** READY TO EXECUTE
**Timeline:** Days 1-5 (January 1-5, 2026)
**Stories:** 7 parallel stories, 84 points
**QA:** Standard gates per story

---

## TRACK A: Core UX Foundation (Dev Agent #1)

### Story 2.1.1: Magic Entry Interface (13 pts)
**Files to Create/Modify:**
- \rontend/src/components/research/SmartCompanyInput.tsx\
- \rontend/src/hooks/useCompanyAutocomplete.ts\  
- \rontend/src/app/page.tsx\ (update with magic entry)

**Implementation:**
- Large branded input field with ProspectPI navy/purple theme
- Autocomplete with debounced company search
- "Try Netflix" demo button for instant value
- POST to \/api/v1/research/generate-dossier\
- Error handling with helpful suggestions

**QA Checklist:**
- [ ] <300ms autocomplete response
- [ ] Screen reader compatible
- [ ] 44px touch targets mobile
- [ ] Input sanitization validated
- [ ] Demo button generates within 2s

---

### Story 2.1.2: ProspectPI Brand Integration (8 pts)
**Files to Create/Modify:**
- \rontend/tailwind.config.ts\ (update colors)
- \rontend/src/app/globals.css\ (add ProspectPI theme)
- \rontend/src/components/ui/\*\ (update Shadcn variants)

**Implementation:**
- Navy (#1E3A8A) and purple (#8B5CF6) color system
- Detective mascot SVG integration
- Consistent button/card/input styling
- Professional enterprise credibility theme

**QA Checklist:**
- [ ] Marketing team brand approval
- [ ] Color contrast WCAG AA
- [ ] Detective theme consistent
- [ ] All components themed
- [ ] Visual hierarchy professional

---

### Story 2.1.4: Progressive Dossier Reveal (8 pts)
**Files to Create/Modify:**
- \rontend/src/components/dossier/DossierViewer.tsx\
- \rontend/src/components/dossier/ExecutiveSummary.tsx\
- \rontend/src/components/dossier/ExpandableSection.tsx\

**Implementation:**
- Executive summary displays first
- Progressive disclosure UI pattern
- Expandable sections with confidence scores
- Mobile-optimized progressive reveal
- Share/Export/Generate actions

**QA Checklist:**
- [ ] Executive summary <45s
- [ ] Mobile progressive disclosure
- [ ] Keyboard navigation works
- [ ] Expand/collapse smooth
- [ ] Actions clearly visible

---

## TRACK B: Mobile + Performance (Dev Agent #2)

### Story 2.1.5: Mobile-First Implementation (21 pts)
**Files to Create/Modify:**
- \rontend/next.config.mjs\ (PWA plugin)
- \rontend/public/manifest.json\
- \rontend/src/service-worker.ts\
- All components responsive breakpoints

**Implementation:**
- PWA installation capability
- <3s load time on 4G
- Touch-optimized (44px targets)
- Swipe gestures for navigation
- Voice-to-text input integration
- Complete mobile/desktop parity

**QA Checklist:**
- [ ] PWA installable iOS/Android
- [ ] <3s load on 4G tested
- [ ] Touch gestures functional
- [ ] Voice input works
- [ ] 100% feature parity
- [ ] Lighthouse mobile >90

---

### Story 2.2.1: Advanced Animations (8 pts)
**Files to Create/Modify:**
- \rontend/package.json\ (add framer-motion)
- \rontend/src/lib/animations.ts\
- Update all components with motion

**Implementation:**
- Framer Motion integration
- Page transition animations
- Loading micro-interactions
- Hover effects and feedback
- prefers-reduced-motion support
- <16ms animation frame rate

**QA Checklist:**
- [ ] Animations smooth 60fps
- [ ] Reduced motion respected
- [ ] No layout shift
- [ ] Performance budget met
- [ ] Accessibility maintained

---

## TRACK C: Enterprise Foundation (Dev Agent #3)

### Story 2.3.1: Power User Mode Toggle (13 pts)
**Files to Create/Modify:**
- \rontend/src/components/settings/UserPreferences.tsx\
- \rontend/src/stores/preferenceStore.ts\
- \rontend/src/components/PowerUserMode.tsx\

**Implementation:**
- Simple/Advanced mode toggle
- Advanced data fields revealed
- Keyboard shortcuts system
- Bulk operations interface
- Advanced filtering/search
- CSV/JSON export options

**QA Checklist:**
- [ ] Mode persists in settings
- [ ] Keyboard shortcuts work
- [ ] Bulk ops functional
- [ ] Export formats correct
- [ ] UI adapts seamlessly

---

### Story 2.4.1: Cultural Detection Engine (13 pts)
**Files to Create/Modify:**
- \ackend/src/services/CulturalDetectionService.ts\
- \ackend/src/database/migrations/cultural_contexts.sql\
- \rontend/src/components/settings/CulturalSettings.tsx\

**Implementation:**
- Domain TLD  cultural region mapping
- 12 market cultural database
- 5-dimension cultural scoring
- User preference overrides
- Cultural context metadata display
- A/B testing framework hooks

**QA Checklist:**
- [ ] Detects 12 markets correctly
- [ ] User overrides work
- [ ] Metadata displays clearly
- [ ] No performance regression
- [ ] Fallback to standard works

---

##  AUTOMATED QA PIPELINE

### Per-Story Test Suite:
\\\ash
# Run on each story completion
npm run test:unit          # Unit tests
npm run test:integration   # API integration tests
npm run test:e2e          # Playwright critical paths
npm run test:a11y         # axe-core accessibility
npm run build             # Production build check
npm run lighthouse        # Performance audit
\\\

### Quality Gates:
- **Code Coverage:** >90% for new code
- **Performance:** Lighthouse >90
- **Accessibility:** Zero axe violations
- **Security:** No high/critical vulns
- **Build:** Production build succeeds

---

##  EXECUTION CHECKLIST

### Pre-Implementation:
- [ ] Feature branches created (batch-1-track-a, track-b, track-c)
- [ ] Backend APIs validated operational
- [ ] Test automation configured
- [ ] Dev environments ready

### During Implementation:
- [ ] Daily standups for blockers
- [ ] Parallel track coordination
- [ ] Continuous integration tests
- [ ] Real-time status updates

### Post-Implementation:
- [ ] All 7 stories QA passed
- [ ] Integration testing complete
- [ ] Merge to staging branch
- [ ] Staging deployment validated
- [ ] Batch 2 preparation started

---

##  READY TO START BATCH 1

**Next Command:** Transform to Dev Agent and begin Track A implementation

**Estimated Completion:** January 5, 2026 (5 days)
