# User Experience & Design

### Minimal Onboarding Flow

**Enterprise Customer Journey (Target: <24 hours to first dossier)**

**Step 1: Signup (2 minutes)**
```
Form Fields:
- Work email (required)
- Company name (required)  
- Team size estimate (dropdown: 1-10, 11-50, 51-200, 200+)
- Salesforce org URL (optional, pre-fills integration)
- Plan selection (Starter/Professional/Enterprise)

Auto-actions:
- Email verification sent
- Payment processing (Stripe/OpenPay)
- Account provisioning
```

**Step 2: Quick Setup (5 minutes)**
```
Setup Wizard:
- Connect Salesforce (optional, guided OAuth flow)
- Invite team members (bulk email upload)
- Generate first test dossier (walk-through)

Success State:
- "Your first dossier is generating..."
- Tutorial overlay on key features
- Link to generate second dossier
```

**Step 3: First Value (10 minutes)**
```
First Dossier Experience:
- Real-time progress: "Agent 1 researching...", "Agent 2 analyzing...", "Agent 3 synthesizing..."  
- Preview mode shows sections as they complete
- PDF download available immediately when done
- Prompts to share with team or save to Salesforce
```

### Desktop-First UI/UX

**Dossier Generation Interface**
```
Layout: Clean, professional, CIA-inspired design
- Header: ProspectPI logo, user menu, usage counter
- Main Input: Large company name field + expandable context area
- Progress: 3-stage agent visualization during generation
- Output: Professional document viewer with export options

Visual Hierarchy:
- Company name input: Large, prominent
- Additional context: Subtle but discoverable  
- Generate button: Clear call-to-action
- Progress indicators: Informative but not intrusive
```

**Mobile Responsiveness**
```
Mobile Optimizations:
- Stack components vertically
- Larger touch targets (44px minimum)
- Swipe navigation for dossier sections
- Mobile-optimized PDF viewer
- Simplified Salesforce integration (redirect flow)

Desktop Priority:
- Full feature set on desktop
- 90% feature parity on mobile
- Progressive enhancement approach
```

### CIA-Style Dossier Design

**Professional Document Formatting**
```
Typography:
- Headers: Crimson Pro (serif, authoritative)
- Body: Inter (sans-serif, readable)
- Monospace: JetBrains Mono (data, citations)

Color Palette:
- Primary: Navy blue (#1e3a8a)
- Secondary: Slate gray (#475569)  
- Accent: Red for high-priority items (#dc2626)
- Background: Off-white (#fafafa)

Layout:
- Two-column format for readability
- Generous whitespace
- Clear section breaks
- Professional header/footer
- Watermark: "PROSPECTPI INTELLIGENCE ASSESSMENT"
```

---
