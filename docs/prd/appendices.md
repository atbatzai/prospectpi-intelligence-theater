# Appendices

### Appendix A: User Interview Script

**Enterprise AE Interview Guide (30 minutes)**

**Current State Questions:**
1. Walk me through your typical account research process
2. What tools do you currently use for prospect research?
3. How long does it take to research a strategic account?
4. What's the most valuable insight you've ever discovered through research?
5. What's your biggest frustration with current research tools?

**Solution Validation:**
6. [Show ProspectPI dossier example] What's your first reaction?
7. Which sections would be most valuable for your sales process?
8. How would you share this with your team?
9. What concerns would you have about AI-generated insights?
10. What would you pay for this tool monthly?

### Appendix B: Technical Architecture Diagram

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Gateway   │    │   Backend       │
│                 │    │                 │    │                 │
│ • React/Next.js │◄──►│ • Rate Limiting │◄──►│ • Node.js/Fastify│
│ • Salesforce LC │    │ • Authentication│    │ • 3-Agent System │
│ • Slack App     │    │ • Load Balancing│    │ • PostgreSQL    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   External      │    │   Monitoring    │    │   Data Sources  │
│   Services      │    │                 │    │                 │
│                 │    │ • DataDog       │    │ • BuiltWith     │
│ • Auth0/Cognito │    │ • Error Tracking│    │ • MarketAux     │
│ • OpenPay       │    │ • Performance   │    │ • TheirStack    │
│ • Salesforce    │    │ • Usage Analytics│   │ • OpenAI/Claude │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Appendix C: Competitive Analysis

**Direct Alternatives Comparison**

| Solution | Time to Research | Cost per Dossier | Quality Score | Integration |
|----------|------------------|-------------------|---------------|-------------|
| **Manual Research** | 8-15 hours | $800-$3,000 | 8/10 | 2/10 |
| **ChatGPT + Manual** | 2-4 hours | $50-$200 | 6/10 | 3/10 |
| **Consultants** | 3-5 days | $5,000-$15,000 | 9/10 | 1/10 |
| **ProspectPI** | 10 minutes | $30-$50 | 8/10 | 9/10 |

**Key Differentiators:**
- 30x faster than nearest alternative
- Native Salesforce integration (competitors require copy/paste)
- Source citation and confidence scoring (builds trust)
- Purpose-built for B2B sales (not general research)

---
