# Open Questions & Decisions Needed

### Product Decisions Required

**1. Dossier Format Optimization**
- **Question:** 10-section CIA format vs 6-section executive format vs customizable?
- **Recommendation:** Start with 10-section, A/B test 6-section in Week 12
- **Decision Needed By:** Week 4 (before frontend development)

**2. Mobile App vs Mobile Web**
- **Question:** Native mobile apps or mobile-responsive web sufficient?
- **Recommendation:** Mobile-responsive web for MVP (90% feature parity)
- **Decision Needed By:** Week 2 (affects architecture decisions)

**3. Free Trial Structure**
- **Question:** How many free dossiers before payment required?
- **Recommendation:** 2 free dossiers (enough to see value, not enough to satisfy)
- **Decision Needed By:** Week 6 (affects billing implementation)

### Technical Decisions Required

**4. API Rate Limiting Strategy**
- **Question:** Hard caps vs soft caps with overage billing?
- **Recommendation:** Hard caps for MVP (simpler implementation)
- **Decision Needed By:** Week 3 (affects backend architecture)

**5. Data Retention Policy**  
- **Question:** How long to store generated dossiers?
- **Recommendation:** 90 days default, enterprise customers can extend
- **Decision Needed By:** Week 2 (affects database design)

### Go-to-Market Decisions Required

**6. Pricing Validation**
- **Question:** Current pricing competitive vs alternatives?
- **Recommendation:** Validate with 10+ customer interviews in Week 10-11
- **Decision Needed By:** Week 12 (before public launch)

---
