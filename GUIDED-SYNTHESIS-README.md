# Pipeline Separation: Source Collection  Guided Synthesis

##  STEP 1: Raw Data Analysis (COMPLETE)
Created RawIntelligenceVault to store 100% of raw source data.

### Files Created:
- `src/services/RawIntelligenceVault.ts` - Stores all raw data per source
- `src/routes/research/rawIntelligence.ts` - API endpoints to view raw data

### API Endpoints:
- `GET /api/v1/research/:requestId/raw-intelligence` - Summary of all sources
- `GET /api/v1/research/:requestId/raw-intelligence/all` - 100% raw data from ALL sources
- `GET /api/v1/research/:requestId/raw-intelligence/source/:source` - Data from one source

---

##  STEP 2: Source Quality Report (COMPLETE)
Analyzed all 25 sources and categorized by quality tier.

### Results from Stripe Analysis:
- **TIER 1 (11 sources)**: Premium, high-confidence data ready for dossier
- **TIER 2 (6 sources)**: Supporting data for validation
- **TIER 3 (8 sources)**: Failed or low-value - should be skipped

### Report Generated:
- `source-quality-report.md` - Full analysis with section mapping

---

##  STEP 3: Guided Synthesis (COMPLETE)
Detective now receives source quality hints for better dossier synthesis.

### Files Created:
- `src/services/SourceQualityGuide.ts` - Source quality mapping and hints generation

### Modified Files:
- `src/agents/ProspectIntelligenceDetective.ts` - Now loads and uses source quality hints

### New API Endpoint:
- `GET /api/v1/research/:requestId/synthesis-guide` - Preview what hints Detective receives

### How It Works:
1. FieldResearcher collects data  stores in RawIntelligenceVault
2. SourceQualityGuide categorizes sources into tiers
3. Detective receives prompt with:
   - Priority sources for each dossier section
   - Which sources to skip (Tier 3)
   - Cross-validation requirements
4. Detective synthesizes with guidance instead of trying to parse everything

---

## Dossier Section  Source Mapping

| Dossier Section | Primary Sources | Supporting |
|-----------------|-----------------|------------|
| Executive Summary | wikidata, sec-edgar, googlenews | hackernews, marketaux |
| Technology Stack | github, web-fingerprint, greenhouse-jobs | stackexchange |
| Financial Health | sec-formd, sec-edgar, sec-8k | marketaux |
| Risk Assessment | nvd-cve, courtlistener, sec-8k | federalregister |
| Market Position | googlenews, hackernews, gdelt | openalex |
| Hiring & Growth | greenhouse-jobs | sec-8k |

---

## Quality Rules Injected into Detective Prompt

1. **Never cite Tier 3 sources** (failed, low confidence, or no data)
2. **Cross-validate with 2+ sources** for key claims
3. **State "Insufficient data"** if primary sources have no relevant data
4. **Prioritize Tier 1 sources** when multiple sources have same information

---

## Next Steps (Optional Enhancements)

1. **User Review UI**: Add frontend to browse raw data before synthesis
2. **Manual Guidance**: Let users mark which sources matter for their use case
3. **Section-by-Section Synthesis**: Generate one section at a time with approval
4. **Quality Scoring**: Score final dossier based on source tier coverage
