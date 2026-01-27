# Story 7.4: White-label & Partnership Platform

**Epic**: Epic 7 - API & Integration Ecosystem  
**Story ID**: 7.4  
**Priority**: P1 (High - Revenue Expansion)  
**Story Points**: 24  
**Status**: Ready for Development

---

## User Story

```
As a SaaS platform or consulting firm
I want to white-label ProspectPI intelligence as part of my product
So I can offer competitive intelligence to my customers under my brand
```

---

## Acceptance Criteria

### White-label Configuration
- [ ] Custom branding (logo, colors, fonts)
- [ ] Custom domain support (intelligence.partner.com)
- [ ] Branded emails and notifications
- [ ] Custom terminology and messaging
- [ ] Partner-specific feature toggles

### Multi-tenant Architecture
- [ ] Isolated partner environments
- [ ] Partner admin dashboard
- [ ] Sub-account management
- [ ] Usage analytics per partner
- [ ] Billing and revenue sharing

### Embedded Widget Platform
- [ ] iFrame embed for intelligence viewer
- [ ] JavaScript SDK for custom integration
- [ ] React component library
- [ ] Mobile SDK (iOS/Android)
- [ ] Customizable UI components

### Partner Management
- [ ] Partner onboarding portal
- [ ] API key management for partners
- [ ] Usage quota allocation
- [ ] Partner performance dashboard
- [ ] Revenue sharing reports

### Co-branding Options
- [ ] "Powered by ProspectPI" badges
- [ ] Co-branded intelligence reports
- [ ] Joint marketing materials
- [ ] Partner directory

### Reseller Program
- [ ] Tiered commission structure
- [ ] Lead registration system
- [ ] Deal management portal
- [ ] Marketing collateral library
- [ ] Sales training resources

### OEM Licensing
- [ ] Full white-label (zero ProspectPI branding)
- [ ] Custom feature development
- [ ] Dedicated infrastructure
- [ ] SLA guarantees

---

## Technical Implementation

### Multi-tenant Database Schema
```sql
CREATE TABLE partners (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  subdomain VARCHAR(100) UNIQUE,
  custom_domain VARCHAR(255),
  branding JSONB,  -- logo, colors, fonts
  features JSONB,   -- enabled features
  quota JSONB,      -- usage limits
  created_at TIMESTAMP
);

CREATE TABLE partner_customers (
  id UUID PRIMARY KEY,
  partner_id UUID REFERENCES partners(id),
  customer_data JSONB,
  usage_stats JSONB
);
```

### White-label Middleware
```typescript
// WhiteLabelMiddleware.ts
class WhiteLabelMiddleware {
  async identifyPartner(req: Request): Partner {
    const domain = req.hostname;
    return await Partner.findByDomain(domain);
  }
  
  async applyBranding(partner: Partner, response: Response) {
    response.locals.branding = partner.branding;
    response.locals.features = partner.features;
  }
}
```

### Embed Widget
```html
<!-- Partner embeds this in their site -->
<script src="https://cdn.prospectpi.com/embed.js"></script>
<div id="prospectpi-widget" 
     data-partner-key="pk_xxxxx"
     data-theme="custom">
</div>

<script>
  ProspectPI.init({
    partnerId: 'partner_123',
    branding: {
      primaryColor: '#0066CC',
      logo: 'https://partner.com/logo.png'
    }
  });
</script>
```

### Revenue Sharing Model
```typescript
interface RevenueSharingTier {
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  commission: number;  // percentage
  requirements: {
    monthlyRevenue: number;
    activeCustomers: number;
  };
}

const tiers: RevenueSharingTier[] = [
  { tier: 'bronze', commission: 20, requirements: { monthlyRevenue: 5000, activeCustomers: 10 }},
  { tier: 'silver', commission: 25, requirements: { monthlyRevenue: 20000, activeCustomers: 50 }},
  { tier: 'gold', commission: 30, requirements: { monthlyRevenue: 50000, activeCustomers: 150 }},
  { tier: 'platinum', commission: 35, requirements: { monthlyRevenue: 100000, activeCustomers: 500 }}
];
```

---

## Partner Types

### Type 1: Embedded Intelligence
**Example**: CRM adds ProspectPI as a feature tab  
**Model**: Per-seat licensing  
**Integration**: Widget embed

### Type 2: Reseller/VAR
**Example**: Consulting firm resells to clients  
**Model**: Revenue sharing (20-35%)  
**Integration**: White-label portal

### Type 3: OEM License
**Example**: Enterprise platform bundles intelligence  
**Model**: Annual license fee + volume pricing  
**Integration**: Full API access + custom development

---

## Success Metrics

- Partner signups: >20 in first year
- Partner-sourced revenue: $500K+ ARR
- Avg partner lifetime value: >$50K
- Partner satisfaction: >4.5/5
- White-label uptime: >99.9%

---

## Definition of Done

- [ ] Multi-tenant architecture operational
- [ ] White-label branding system complete
- [ ] Partner admin portal launched
- [ ] Embed widget SDK released
- [ ] 3+ pilot partners onboarded successfully
- [ ] Revenue sharing calculation automated
- [ ] Legal agreements and contracts finalized
- [ ] Winston's security isolation audit passed
- [ ] Quinn's partner testing approval

**Story Points**: 24 days  
**Dependencies**: Legal, finance, infrastructure

---

**Created**: December 31, 2025