#  Source Quality Report

**Company:** Stripe
**Analysis Date:** 2026-01-28
**Total Sources:** 25

##  TIER 1: Premium Intelligence Sources (11)

These sources provide **high-quality, structured data** ready for dossier sections.

### SEC-EDGAR

| Metric | Value |
|--------|-------|
| Confidence | 90% |
| Data Size | 6.0 KB |
| Value Score | 9/10 |
| Cost | $0.0000 |

**Best For Dossier Sections:** Company Overview, Financial Health, Public Filings

**Key Data Points:**
- Public company: Yes
- CIK: 0000949859
- Recent filings: 8

**Sample Data:**
`json
{
  "filings": [
    {
      "form": "8-K",
      "companyName": "CFC INTERNATIONAL INC  (CIK 0000949859)",
      "cik": "0000949859",
      "filedDate": "2006-04-03",
      "accessionNumber": "0001193125-06-070939",
      "filingUrl": "https://www.sec.gov/Archives/edgar/data/0000949859/000119312506070939",
      "description": ""
    },
    {
      "form": "8-K",
      "companyName": "Cardlytics, Inc.  (CDLX)  (CIK 0001666071)",
      "cik": "0001666071",
      "filedDate": "2022-07-20",
      "accessionNumber": "0001666071-22-000089",
      "filingUrl": "https://www.sec.gov/Archives/edgar/data/0001666071/000166607122000089",
      "description": ""
    }
  ],
  "companyDetails": {
    "name": "CFC INTERNATIONAL INC",
    "cik": "0000949859",
    "sic": "2891",
    "sicDescription": "Adhesives & Sealants",
    "fiscalYearEnd": "1231",
    "stateOfIncorporation": "DE",
    "exchanges": [],
    "tickers": [],
    "ein": "363434526",
    "recentFilingCount": 169
  },
  "isPublicCompany": true
}
`

### SEC-FORMD

| Metric | Value |
|--------|-------|
| Confidence | 90% |
| Data Size | 5.4 KB |
| Value Score | 9/10 |
| Cost | $0.0000 |

**Best For Dossier Sections:** Funding History, Financial Health, Investment Signals

**Key Data Points:**
- Funding signal: ACTIVE_FUNDRAISING
- Total Form D filings: 48
- Private funding: Yes

**Sample Data:**
`json
{
  "fundingRounds": [
    {
      "issuerName": "Stripe Milton LLC  (CIK 0002000934)",
      "cik": "0002000934",
      "filedDate": "2023-11-17",
      "accessionNumber": "0002000934-23-000001",
      "formType": "D",
      "filingUrl": "https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=0002000934&type=D&dateb=&owner=include&count=40"
    },
    {
      "issuerName": "Blue Stripe, LLC  (CIK 0001643255)",
      "cik": "0001643255",
      "filedDate": "2015-05-27",
      "accessionNumber": "0001643255-15-000001",
      "formType": "D",
      "filingUrl": "https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=0001643255&type=D&dateb=&owner=include&count=40"
    }
  ],
  "fundingDetails": [
    {
      "form": "D",
      "filingDate": "2023-11-17",
      "accessionNumber": "0002000934-23-000001",
      "isAmendment": false
    }
  ],
  "hasPrivateFunding": true
}
`

### WEB-FINGERPRINT

| Metric | Value |
|--------|-------|
| Confidence | 90% |
| Data Size | 0.4 KB |
| Value Score | 7/10 |
| Cost | $0.0000 |

**Best For Dossier Sections:** Technology Stack, Infrastructure

**Key Data Points:**
- Technologies detected: 2
- Server: nginx
- Frameworks: React

**Sample Data:**
`json
{
  "domain": "stripe.com",
  "technologies": [
    "React",
    "NGINX"
  ],
  "scripts": [
    "https://b.stripecdn.com/mkt-statics-srv/assets/imt-900017e925e86dd54d2710b23a21d380.js",
    "https://b.stripecdn.com/mkt-statics-srv/assets/v1-Bootstrapper-GS22CZ7X.js"
  ]
}
`

### NVD-CVE

| Metric | Value |
|--------|-------|
| Confidence | 85% |
| Data Size | 15.8 KB |
| Value Score | 8/10 |
| Cost | $0.0000 |

**Best For Dossier Sections:** Security Risk, Technology Assessment, Risk Analysis

**Key Data Points:**
- Total CVEs: 98
- Critical: 1, High: 9
- Risk level: critical

**Sample Data:**
`json
{
  "vulnerabilities": [
    {
      "cveId": "CVE-2007-4678",
      "published": "2007-11-15T01:46:00.000",
      "lastModified": "2025-04-09T00:30:58.490",
      "description": "AppleRAID in Apple Mac OS X 10.3.9 and 10.4 through 10.4.10 allows attackers to cause a denial of service (crash) via a crafted striped disk image, which triggers a NULL pointer dereference when it is mounted.",
      "severity": "HIGH",
      "baseScore": 7.1,
      "references": [
        "http://docs.info.apple.com/article.html?artnum=307041",
        "http://lists.apple.com/archives/security-announce/2007/Nov/msg00002.html",
        "http://secunia.com/advisories/27643"
      ]
    },
    {
      "cveId": "CVE-2014-7892",
      "published": "2015-03-09T17:59:04.907",
      "lastModified": "2025-04-12T10:46:40.837",
      "description": "The OLE Point of Sale (OPOS) drivers before 1.13.003 on HP Point of Sale Windows PCs allow remote attackers to execute arbitrary code via vectors involving OPOSMSR.ocx for Mini MSR magnetic stripe readers, Retail Integrated Dual-Head MSR magnetic stripe readers, Integrated Single Head MSR w/o SRED m",
      "severity": "HIGH",
      "baseScore": 10,
      "references": [
        "http://www.securitytracker.com/id/1031840",
        "https://h20564.www2.hp.com/portal/site/hpsc/public/kb/docDisplay?docId=emr_na-c04583185",
        "http://www.securitytracker.com/id/1031840"
      ]
    }
  ],
  "totalResults": 98,
  "severityDistribution": {
    "HIGH": 9,
    "MEDIUM": 10,
    "CRITICAL": 1
  }
}
`

### GITHUB

| Metric | Value |
|--------|-------|
| Confidence | 85% |
| Data Size | 10.5 KB |
| Value Score | 9/10 |
| Cost | $0.0000 |

**Best For Dossier Sections:** Technology Stack, Engineering Culture, Open Source Strategy

**Key Data Points:**
- Official org: Stripe with 82 public repos
- Top languages: TypeScript, JavaScript, Go
- Dev presence: strong

**Sample Data:**
`json
{
  "repositories": [
    {
      "name": "better-auth/better-auth",
      "description": "The most comprehensive authentication framework for TypeScript",
      "url": "https://github.com/better-auth/better-auth",
      "stars": 25677,
      "forks": 2193,
      "openIssues": 649,
      "language": "TypeScript",
      "topics": [
        "authentication",
        "iam",
        "oauth",
        "oauth2",
        "oidc",
        "sso",
        "stripe",
        "typescript"
      ],
      "createdAt": "2024-05-19T21:40:04Z",
      "updatedAt": "2026-01-28T08:55:10Z",
      "isOrg": true,
      "ownerName": "better-auth"
    },
    {
      "name": "nextjs/saas-starter",
      "description": "Get started quickly with Next.js, Postgres, Stripe, and shadcn/ui.",
      "url": "https://github.com/nextjs/saas-starter",
      "stars": 15307,
      "forks": 2533,
      "openIssues": 38,
      "language": "TypeScript",
      "topics": [
        "nextjs",
        "postgres",
        "shadcn-ui",
        "stripe"
      ],
      "createdAt": "2024-09-10T00:18:56Z",
      "updatedAt": "2026-01-28T02:37:46Z",
      "isOrg": true,
      "ownerName": "nextjs"
    }
  ],
  "totalResults": 67298,
  "officialOrg": {
    "login": "stripe",
    "name": "Stripe",
    "description": "",
    "publicRepos": 82,
    "followers": 2739,
    "blog": "https://stripe.dev",
    "location": "San Francisco, CA",
    "createdAt": "2011-06-17T15:42:37Z"
  }
}
`

### SEC-8K

| Metric | Value |
|--------|-------|
| Confidence | 85% |
| Data Size | 9.2 KB |
| Value Score | 8/10 |
| Cost | $0.0000 |

**Best For Dossier Sections:** Executive Changes, Material Events, Corporate Actions

**Key Data Points:**
- Material events: 15
- Executive changes: 3
- Recent exec changes: Yes

**Sample Data:**
`json
{
  "materialEvents": [
    {
      "companyName": "CFC INTERNATIONAL INC  (CIK 0000949859)",
      "cik": "0000949859",
      "filedDate": "2006-04-03",
      "accessionNumber": "0001193125-06-070939",
      "form": "8-K",
      "items": [
        "1.02",
        "8.01",
        "9.01"
      ],
      "filingUrl": "https://www.sec.gov/Archives/edgar/data/0000949859/000119312506070939"
    },
    {
      "companyName": "Cardlytics, Inc.  (CDLX)  (CIK 0001666071)",
      "cik": "0001666071",
      "filedDate": "2022-07-20",
      "accessionNumber": "0001666071-22-000089",
      "form": "8-K",
      "items": [
        "2.02",
        "5.02",
        "9.01"
      ],
      "filingUrl": "https://www.sec.gov/Archives/edgar/data/0001666071/000166607122000089"
    }
  ],
  "executiveChanges": [
    {
      "companyName": "Cardlytics, Inc.  (CDLX)  (CIK 0001666071)",
      "cik": "0001666071",
      "filedDate": "2022-07-20",
      "accessionNumber": "0001666071-22-000089",
      "form": "8-K",
      "items": [
        "2.02",
        "5.02",
        "9.01"
      ],
      "filingUrl": "https://www.sec.gov/Archives/edgar/data/0001666071/000166607122000089"
    },
    {
      "companyName": "Aurora Innovation, Inc.  (AUR, AUROW)  (CIK 0001828108)",
      "cik": "0001828108",
      "filedDate": "2022-01-19",
      "accessionNumber": "0001193125-22-012098",
      "form": "8-K",
      "items": [
        "5.02",
        "7.01",
        "9.01"
      ],
      "filingUrl": "https://www.sec.gov/Archives/edgar/data/0001828108/000119312522012098"
    }
  ],
  "acquisitions": [
    {
      "companyName": "I MANY INC  (CIK 0001104017)",
      "cik": "0001104017",
      "filedDate": "2009-06-03",
      "accessionNumber": "0001193125-09-124328",
      "form": "8-K",
      "items": [
        "1.01",
        "8.01",
        "9.01"
      ],
      "filingUrl": "https://www.sec.gov/Archives/edgar/data/0001104017/000119312509124328"
    },
    {
      "companyName": "VENTAS INC  (VTR)  (CIK 0000740260)",
      "cik": "0000740260",
      "filedDate": "2014-09-16",
      "accessionNumber": "0001047469-14-007666",
      "form": "8-K",
      "items": [
        "1.01",
        "9.01"
      ],
      "filingUrl": "https://www.sec.gov/Archives/edgar/data/0000740260/000104746914007666"
    }
  ]
}
`

### COURTLISTENER

| Metric | Value |
|--------|-------|
| Confidence | 85% |
| Data Size | 5.8 KB |
| Value Score | 8/10 |
| Cost | $0.0000 |

**Best For Dossier Sections:** Legal Risk, Litigation History, Risk Analysis

**Key Data Points:**
- Total cases: 9552
- Risk level: high
- Litigation signals: {"patent":0,"employment":0,"contract":0,"securities":1,"antitrust":0}

**Sample Data:**
`json
{
  "cases": [
    {
      "caseName": "Commercial Club Building v. Global Rescue",
      "court": "Court of Appeals of Utah",
      "dateFiled": "2026-01-23",
      "dateArgued": null,
      "status": "Published",
      "docketNumber": "Case No. 20240124-CA",
      "suitNature": "",
      "absoluteUrl": "https://www.courtlistener.com/opinion/10779192/commercial-club-building-v-global-rescue/"
    },
    {
      "caseName": "United States v. Steven Tilden Fellmy",
      "court": "Court of Appeals for the Sixth Circuit",
      "dateFiled": "2026-01-23",
      "dateArgued": null,
      "status": "Published",
      "docketNumber": "25-5381",
      "suitNature": "",
      "absoluteUrl": "https://www.courtlistener.com/opinion/10778901/united-states-v-steven-tilden-fellmy/"
    }
  ],
  "totalResults": 9552,
  "litigationSignals": {
    "patent": 0,
    "employment": 0,
    "contract": 0,
    "securities": 1,
    "antitrust": 0
  }
}
`

### GREENHOUSE-JOBS

| Metric | Value |
|--------|-------|
| Confidence | 85% |
| Data Size | 2.7 KB |
| Value Score | 8/10 |
| Cost | $0.0000 |

**Best For Dossier Sections:** Hiring Trends, Technology Stack, Growth Signals

**Key Data Points:**
- Active job openings: 582
- Detected tech: Go
- Tech categories: Go

**Sample Data:**
`json
{
  "totalJobs": 582,
  "jobs": [
    {
      "title": "Account Executive, Benelux & Nordics - Existing Business",
      "location": "Dublin",
      "updatedAt": "2026-01-20T17:44:31-05:00"
    },
    {
      "title": "Account Executive, Benelux - Startups (Dutch Speaking)",
      "location": "Amsterdam",
      "updatedAt": "2026-01-20T17:44:33-05:00"
    }
  ],
  "detectedTechnologies": [
    "Go"
  ]
}
`

### HACKERNEWS

| Metric | Value |
|--------|-------|
| Confidence | 85% |
| Data Size | 1.3 KB |
| Value Score | 7/10 |
| Cost | $0.0000 |

**Best For Dossier Sections:** Market Sentiment, Industry Perception, Brand Analysis

**Key Data Points:**
- Total stories: 14074
- Avg engagement: 1582 points
- Community sentiment: has_presence

**Sample Data:**
`json
{
  "totalStories": 14074,
  "topDiscussions": [
    {
      "title": "Accepted and ghosted: interviewing for a leadership position at Stripe",
      "points": 1703,
      "comments": 655,
      "date": "2021-11-30T00:30:59Z",
      "hnUrl": "https://news.ycombinator.com/item?id=29387264"
    },
    {
      "title": "Shirt Without Stripes",
      "url": "https://github.com/elsamuko/Shirt-without-Stripes",
      "points": 1676,
      "comments": 617,
      "date": "2020-04-20T16:00:40Z",
      "hnUrl": "https://news.ycombinator.com/item?id=22925087"
    }
  ],
  "sentiment": "has_presence"
}
`

### WIKIDATA

| Metric | Value |
|--------|-------|
| Confidence | 85% |
| Data Size | 0.6 KB |
| Value Score | 8/10 |
| Cost | $0.0000 |

**Best For Dossier Sections:** Company Overview, Executive Summary, Basic Facts

**Key Data Points:**
- Company: Stripe
- Description: Irish-American payment technology company
- Has CEO data: Yes

**Sample Data:**
`json
{
  "companyInfo": {
    "wikidataId": "Q7624104",
    "name": "Stripe",
    "description": "Irish-American payment technology company",
    "founded": "2010-01-01T00:00:00Z",
    "headquarters": "San Francisco",
    "industry": "financial services",
    "ceo": "Patrick Collison",
    "employees": 2500,
    "revenue": null,
    "website": "https://stripe.com",
    "foundedBy": "Patrick Collison"
  },
  "found": true,
  "structuredData": {
    "hasFoundingDate": true,
    "hasHeadquarters": true,
    "hasIndustry": true,
    "hasCeo": true,
    "hasEmployeeCount": true,
    "hasRevenue": false,
    "isPublicCompany": false
  }
}
`

### GOOGLENEWS

| Metric | Value |
|--------|-------|
| Confidence | 80% |
| Data Size | 8.6 KB |
| Value Score | 7/10 |
| Cost | $0.0000 |

**Best For Dossier Sections:** Recent News, Market Position, PR Analysis

**Key Data Points:**
- Recent articles: 15
- Sentiment: positive
- Topic signals: {"hiring":0,"funding":0,"product":2,"partnership":1,"leadership":2}

**Sample Data:**
`json
{
  "totalArticles": 15,
  "articles": [
    {
      "title": "IU basketball game against Purdue will be a stripe out - The Daily Hoosier",
      "url": "https://news.google.com/rss/articles/CBMikAFBVV95cUxNUHJsMzNvTk5JNmR6OEtZSkx2a1RLNWFkNnNkYzU0Y0o1M0FmRmhKS3dxclZGRUVjWkpwY1E2bFNJQ0o0TXdyM0hkSDdBOFRYOHpqeFZBaGtMUG52Z0tJdTJoX1F6Q1FqZzBxUmhjU2dyaV9MLXZqS3BybVZRdEdQRkR5UTJ2Z3d2WjJyMk1iR0U?oc=5",
      "publishedAt": "2026-01-26T19:52:45.000Z",
      "source": "The Daily Hoosier",
      "sentiment": "neutral"
    },
    {
      "title": "Motion's Test Score, One Stripe Go 1-2 in Pegasus Turf - BloodHorse",
      "url": "https://news.google.com/rss/articles/CBMirAFBVV95cUxPTzhOSFRTcEJPcXdMdXA0RDdxQ0JDcnRfalFnRmI1aWE0bG9UR2k4Wld5X3hxNGtfQ2dEVW1za2I4RGN1MWRvZzhuYjJFdy16b2lzSGxRMmZyZ3dMbnUydS04Tnh2X3JtTHJlM0lfR2EyeDNNTVI0aUlLYnJBQWI3Si1YNzhacjZCSkc0OHlMUXRCMnVpUEFweGdEbWRCOVdicXJrTTVFaHVvUS0x?oc=5",
      "publishedAt": "2026-01-25T00:10:24.000Z",
      "source": "BloodHorse",
      "sentiment": "neutral"
    }
  ],
  "topicSignals": {
    "hiring": 0,
    "funding": 0,
    "product": 2,
    "partnership": 1,
    "leadership": 2
  }
}
`

##  TIER 2: Supporting Intelligence Sources (6)

These sources provide **useful supplementary data** for context and validation.

### GDELT

- **Confidence:** 85% | **Value:** 6/10 | **Size:** 14.3 KB
- **Best For:** Global Media Coverage, International Presence
- **Key Points:** Total articles: 50; Media sentiment: neutral

### MARKETAUX

- **Confidence:** 85% | **Value:** 6/10 | **Size:** 5.2 KB
- **Best For:** Financial News, Market Sentiment
- **Key Points:** News articles: 5413; API status: Working

### FEDERALREGISTER

- **Confidence:** 80% | **Value:** 5/10 | **Size:** 16.4 KB
- **Best For:** Regulatory Exposure, Compliance Risk
- **Key Points:** Regulatory docs: 449; Exposure level: high

### OPENALEX

- **Confidence:** 80% | **Value:** 5/10 | **Size:** 14.4 KB
- **Best For:** Research & Innovation, Academic Presence
- **Key Points:** Publications: 230810; Academic presence: strong

### STACKEXCHANGE

- **Confidence:** 80% | **Value:** 6/10 | **Size:** 11.2 KB
- **Best For:** Developer Sentiment, Product Pain Points
- **Key Points:** Questions: 15; Pain signals: {"integration":3,"migration":0,"performance":0,"bugs":6,"howTo":2}

### WIKIMEDIA-PAGEVIEWS

- **Confidence:** 80% | **Value:** 4/10 | **Size:** 2.0 KB
- **Best For:** Public Interest, Brand Awareness
- **Key Points:** Pageviews (90d): 6377; Public interest: low

##  TIER 3: Failed or Low-Value Sources (8)

These sources failed, returned no data, or provide limited value.

| Source | Status | Issue |
|--------|--------|-------|
| cloud-attribution | success | Low confidence / minimal data |
| prnewswire | success | Low confidence / minimal data |
| businesswire | success | Low confidence / minimal data |
| globenewswire | success | Low confidence / minimal data |
| sec-xbrl | partial | Low confidence / minimal data |
| sam-gov | partial | SAM.gov requires API key - register FREE at https: |
| usaspending | error | Request failed with status code 422 |
| openai-realtime | error | aborted |

##  Recommendations for Detective

### Dossier Section Mapping

| Dossier Section | Primary Sources | Supporting Sources |
|-----------------|-----------------|-------------------|
| Company Overview | wikidata, sec-edgar | googlenews, marketaux |
| Technology Stack | github, web-fingerprint, greenhouse-jobs | stackexchange |
| Financial Health | sec-formd, sec-edgar, sec-8k | marketaux |
| Risk Assessment | nvd-cve, courtlistener | sec-8k |
| Market Position | gdelt, googlenews, hackernews | openalex, federalregister |
| Hiring/Growth | greenhouse-jobs | wikimedia-pageviews |
| Executive Intelligence | sec-8k | hackernews |
