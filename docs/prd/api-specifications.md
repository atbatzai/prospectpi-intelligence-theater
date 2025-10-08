# API Specifications

### Core API Endpoints

**POST /api/v1/dossiers**
```json
Request:
{
  "company_name": "Acme Corp",
  "additional_context": "Focus on their recent cloud migration and competitor analysis vs Salesforce",
  "format": "standard", // or "executive_summary"
  "priority": "standard" // or "express" (future premium feature)
}

Response:
{
  "dossier_id": "dos_1234567890",
  "status": "generating",
  "estimated_completion": "2025-10-01T10:15:00Z",
  "progress": {
    "coordinator": "completed",
    "researcher": "in_progress", 
    "detective": "pending"
  }
}
```

**GET /api/v1/dossiers/{id}**
```json
Response:
{
  "id": "dos_1234567890",
  "company_name": "Acme Corp",
  "status": "completed",
  "generated_at": "2025-10-01T10:12:34Z",
  "confidence_score": 0.87,
  "sections": [
    {
      "title": "Executive Summary",
      "content": "...",
      "confidence": "STRONG_EVIDENCE",
      "sources": ["source_1", "source_2"]
    }
  ],
  "metadata": {
    "generation_time_seconds": 542,
    "sources_used": 12,
    "agent_version": "1.0.0"
  }
}
```

**Usage Tracking API**
```json
GET /api/v1/usage/current

Response:
{
  "plan": "professional",
  "period": "2025-10",
  "dossiers_used": 8,
  "dossiers_limit": 15,
  "reset_date": "2025-11-01T00:00:00Z",
  "overage_allowed": false
}
```

### Integration APIs

**Salesforce Lightning Component**
```javascript
// Lightning Component Interface
LightningComponentAPI.generateDossier({
  recordId: "0031234567890ABC", // Account ID
  companyName: "Acme Corp", // From Account.Name
  additionalContext: "", // From Account.Description or manual input
  callback: (result) => {
    // Handle dossier generation result
    // Auto-populate Account fields with insights
  }
});
```

**Slack Integration**
```javascript
// Slash Command Handler
/prospectpi Acme Corp

// Response: Rich message with dossier summary
{
  "blocks": [
    {
      "type": "section",
      "text": "🎯 ProspectPI Dossier: Acme Corp",
      "fields": [
        "Confidence: ⭐⭐⭐⭐ (Strong Evidence)",
        "Key Insight: Major cloud migration underway"
      ]
    },
    {
      "type": "actions", 
      "elements": [
        {"text": "View Full Dossier", "url": "..."},
        {"text": "Share with Team", "action": "share"}
      ]
    }
  ]
}
```

---
