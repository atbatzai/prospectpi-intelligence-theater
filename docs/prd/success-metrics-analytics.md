# Success Metrics & Analytics

### Product KPIs (MVP Focus)

**Primary Success Metrics**
```
Dossier Generation:
- Success Rate: >95% (target: 98%+)
- Average Generation Time: <10 minutes (target: <7 minutes)
- User Satisfaction: >4.5/5 rating per dossier
- Citation Accuracy: >85% verified sources

User Engagement:
- Weekly Active Users: >60% of paid seats
- Dossiers per User per Month: 
  * Starter: 2.5+ (approaching limit)
  * Professional: 8+ (healthy usage)
  * Enterprise: 25+ (power user adoption)
```

**Business Metrics**
```
Conversion & Retention:
- Trial-to-Paid: >70% (Starter tier)
- Monthly Churn: <5% (all tiers)
- Plan Upgrade Rate: >15% monthly (Starter → Professional)

Revenue:
- MRR Growth: 15%+ month-over-month
- ARPU: $500+ blended (weighted by tier)
- CAC Payback: <6 months blended
```

### Analytics Implementation

**Event Tracking (Required for MVP)**
```javascript
// Key Events to Track
analytics.track('dossier_generation_started', {
  company_name: 'hashed',
  user_plan: 'professional',
  additional_context_provided: true,
  source: 'salesforce' // or 'web_app', 'slack'
});

analytics.track('dossier_generation_completed', {
  dossier_id: 'dos_123',
  generation_time_seconds: 542,
  confidence_score: 0.87,
  sources_count: 12,
  user_satisfaction_rating: 5
});

analytics.track('dossier_shared', {
  dossier_id: 'dos_123',
  share_method: 'slack', // or 'pdf_download', 'link_copy'
  recipient_count: 3
});

analytics.track('plan_limit_reached', {
  current_plan: 'starter',
  upgrade_prompt_shown: true,
  user_action: 'upgraded' // or 'dismissed', 'ignored'
});
```

**A/B Testing Framework**
```
MVP A/B Tests:
- Dossier length: 10 sections vs 6 sections vs executive summary only
- Confidence display: Traffic lights vs star ratings vs percentage
- Additional context prompt: Always visible vs expandable vs optional
- Salesforce integration: Embedded panel vs new tab vs popup modal
```

---
