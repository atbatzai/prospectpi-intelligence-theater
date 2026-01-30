## SOURCE FIX DETAILS - CODE PATTERNS

### 1. SEC EDGAR - Two-Step Lookup Pattern
```typescript
// Step 1: Find CIK using company name
const companySearchUrl = `https://www.sec.gov/cgi-bin/browse-edgar?company=${encodeURIComponent(companyName)}&action=getcompany&output=json`;
const companies = companySearchResponse.data?.results || [];
const cik = bestMatch.cik_str?.toString().padStart(10, "0");

// Step 2: Fetch filings using CIK
const companyInfoUrl = `https://data.sec.gov/submissions/CIK${cik}.json`;
const recentFilings = info.filings?.recent || {};
```

### 2. BUSINESSWIRE - Exact Query Search
```typescript
// Query format with exact company name in quotes
const bwSearchUrl = `https://www.businesswire.com/cgi-bin/open_news_search.cgi?query="${encodeURIComponent(cleanCompanyName)}"&sort=rating&date_select=last_30_days`;
```

### 3. COURTLISTENER - Exact Match Query
```typescript
// Exact match with quotes
const courtRes = await axios.get("https://www.courtlistener.com/api/rest/v3/search/", {
  params: { q: "\"stripe\"", type: "c" }
});
```

### 4. NVD-CVE - Product-Specific Search
```typescript
// Search for product name (lowercase), not company name
const nvdRes = await axios.get("https://services.nvd.nist.gov/rest/json/cves/1.0", {
  params: { keyword: productName.toLowerCase() }
});
```

### 5. FEDERAL REGISTER - Fixed API Parameter
```typescript
// Correct parameter format: search[query] not conditions[term]
const regRes = await axios.get("https://www.federalregister.gov/api/v1/documents", {
  params: { "search[query]": companyName, per_page: 5 }
});
```

### 6. CLOUD-ATTRIBUTION - Pattern Detection
```typescript
// Detect cloud/tech providers via regex pattern
const techPattern = /(AWS|Azure|GCP|Heroku|DigitalOcean|Stripe)/;
const detected = content.match(techPattern) ? true : false;
```

### 7. USASPENDING - SAM.gov Integration
```typescript
// Federal contractor lookup via SAM.gov
const samRes = await axios.get("https://api.sam.gov/prod/basis-for-award-api/v1/basis_for_award", {
  params: { keyword: companyName, api_key: process.env.SAM_GOV_API_KEY }
});
```

All sources implement:
 10-15 second timeout protection
 User-Agent header with bot identification
 Error handling with graceful fallback
 Confidence scoring based on result quality
 Cost tracking (FREE for all sources)
 Progress updates via updateProgress() callback

