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

**Desktop Dossier Generation Interface (Primary Experience)**
```
Layout: Sophisticated, professional, CIA-inspired design optimized for detailed analysis
- Header: ProspectPI logo, user menu, usage counter, quick actions
- Main Input: Large company name field + rich context editor with suggestions
- Progress: Full 3-agent Intelligence Theater with detailed real-time visualization
- Output: Comprehensive document viewer with advanced export and collaboration options

Visual Hierarchy:
- Company name input: Prominent with autocomplete and company detection
- Additional context: Rich text editor with smart suggestions and templates
- Generate button: Professional call-to-action with generation options
- Progress Theater: Immersive 3-column agent dashboard with detailed status
- Document Viewer: Multi-panel layout with sections, citations, and collaboration tools
```

**Mobile Intelligence Theater (Highly Useful Experience)**
```
Mobile Optimizations (Maintains Core Value):
- Streamlined single-column layout with smart navigation
- Touch-optimized input with voice-to-text capability
- Condensed but informative agent progress visualization
- Mobile-optimized document viewer with swipe navigation
- Essential sharing and export functions optimized for mobile workflow
- Salesforce mobile app integration with native feel

Feature Parity Strategy:
- Core dossier generation: 100% parity
- Agent progress visualization: Optimized but complete
- Document viewing: Mobile-optimized with full content access
- Sharing capabilities: 95% parity with mobile-specific enhancements
- Salesforce integration: Native mobile app experience
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
