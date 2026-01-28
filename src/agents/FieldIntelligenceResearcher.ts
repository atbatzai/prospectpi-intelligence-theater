/**
 * ProspectPI Intelligence Theater - Field Intelligence Researcher Agent  
 * MINIMAL WORKING VERSION - QA-First Rebuild
 */

import { ApiConfig, ApiCostTracker } from '../config/ApiConfig';
import { 
  AgentProgress, 
  AgentContext, 
  ResearchData
} from '../interfaces/AgentTypes';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

export class FieldIntelligenceResearcher {
  private context: AgentContext | null = null;
  private progressCallback: ((progress: AgentProgress) => void) | undefined;
  private totalCost: number = 0;
  private costTracker: ApiCostTracker;
  private requestId: string;

  constructor(progressCallback?: (progress: AgentProgress) => void) {
    this.progressCallback = progressCallback;
    this.costTracker = ApiCostTracker.getInstance();
    this.requestId = uuidv4();
  }

  async initializeResearch(context: AgentContext): Promise<void> {
    this.context = context;
    this.totalCost = 0;
    
    await this.updateProgress({
      stage: 'researching',
      agent: 'researcher',
      message: `Starting field research for ${context.userInput.companyName}`,
      confidence: 0.8,
      estimatedTimeRemaining: 120,
      userCanInterrupt: true,
      // DISABLED BROKEN SOURCES: sam-gov, uspto, opencorporates, ukcompanieshouse, lever-jobs
      dataSourcesActive: ['marketaux', 'openai-realtime', 'hackernews', 'googlenews', 'sec-edgar', 'sec-formd', 'sec-8k', 'sec-xbrl', 'stackexchange', 'github', 'wikidata', 'gdelt', 'nvd-cve', 'openalex', 'federalregister', 'wikimedia-pageviews', 'prnewswire', 'businesswire', 'globenewswire', 'greenhouse-jobs', 'web-fingerprint', 'cloud-attribution', 'courtlistener', 'usaspending'],
      insightsDiscovered: 0,
      timestamp: new Date()
    });
  }

  async gatherIntelligence(): Promise<ResearchData[]> {
    if (!this.context) {
      throw new Error('Research context not initialized');
    }

    await this.updateProgress({
      stage: 'researching',
      agent: 'researcher',
      message: 'Gathering intelligence from data sources...',
      confidence: 0.7,
      estimatedTimeRemaining: 90,
      userCanInterrupt: false,
      // DISABLED BROKEN SOURCES: sam-gov, uspto, opencorporates, ukcompanieshouse, lever-jobs
      dataSourcesActive: ['marketaux', 'openai-realtime', 'hackernews', 'googlenews', 'sec-edgar', 'sec-formd', 'sec-8k', 'sec-xbrl', 'stackexchange', 'github', 'wikidata', 'gdelt', 'nvd-cve', 'openalex', 'federalregister', 'wikimedia-pageviews', 'prnewswire', 'businesswire', 'globenewswire', 'greenhouse-jobs', 'web-fingerprint', 'cloud-attribution', 'courtlistener', 'usaspending'],
      insightsDiscovered: 0,
      timestamp: new Date()
    });

    const results: ResearchData[] = [];
    const companyName = this.context.userInput.companyName;

    // ═══════════════════════════════════════════════════════════════════════
    // THEIRSTACK: DORMANT - Set ENABLE_THEIRSTACK=true in .env to activate
    // Reason: Replaced with FREE technographics (Greenhouse/Lever/web-fingerprint)
    // ═══════════════════════════════════════════════════════════════════════
    const enableTheirStack = process.env.ENABLE_THEIRSTACK === 'true';
    
    if (enableTheirStack) {
    // TheirStack: Comprehensive Intelligence (Company + Technologies + Jobs/Hiring)
    try {
      await this.updateProgress({
        stage: 'researching',
        agent: 'researcher',
        message: `Investigating ${companyName} via TheirStack (company, tech stack, hiring)...`,
        confidence: 0.75,
        estimatedTimeRemaining: 75,
        userCanInterrupt: false,
        dataSourcesActive: ['theirstack'],
        insightsDiscovered: 0,
        timestamp: new Date()
      });

      // Clean company name: remove LLC, Inc, Corp, etc. for better matching
      const cleanCompanyName = companyName
        .replace(/,?\s*(LLC|Inc\.?|Corp\.?|Corporation|Ltd\.?|Limited|Co\.?|Company)$/gi, '')
        .trim();
      
      // Generate potential domain from clean name
      const potentialDomain = cleanCompanyName.toLowerCase()
        .replace(/[^a-z0-9]/g, '') + '.com';
      
      console.log(`🔍 TheirStack: Searching for "${cleanCompanyName}" (domain guess: ${potentialDomain})`);

      // Step 1: Company Search to get company info and domain
      const companySearchResponse = await axios.post(
        `${ApiConfig.THEIRSTACK_BASE_URL}/companies/search`,
        {
          company_name_partial_match_or: [cleanCompanyName],
          company_name_case_insensitive_or: [cleanCompanyName],
          page: 0,
          limit: 5,
          order_by: [{ desc: true, field: 'employee_count' }],
          include_total_results: true
        },
        {
          headers: { 
            'Authorization': `Bearer ${ApiConfig.THEIRSTACK_JWT}`,
            'Content-Type': 'application/json'
          },
          timeout: ApiConfig.DEFAULT_TIMEOUT_MS
        }
      );

      console.log(`📊 TheirStack Company Search: Found ${companySearchResponse.data?.data?.length || 0} companies`);
      
      // Extract the best matching company and its domain
      let companyData = companySearchResponse.data?.data?.[0] || null;
      let discoveredDomain = companyData?.domain || potentialDomain;
      let technographicsData: any = null;
      let jobsData: any = null;

      // Step 2: Get Technographics (technology stack) using the discovered domain
      if (discoveredDomain) {
        try {
          console.log(`🔧 TheirStack: Fetching technographics for domain: ${discoveredDomain}`);
          const techResponse = await axios.post(
            `${ApiConfig.THEIRSTACK_BASE_URL}/companies/technologies`,
            {
              company_domain: discoveredDomain,
              company_name: cleanCompanyName,
              limit: 50,
              order_by: [{ desc: true, field: 'confidence' }, { desc: true, field: 'jobs' }]
            },
            {
              headers: { 
                'Authorization': `Bearer ${ApiConfig.THEIRSTACK_JWT}`,
                'Content-Type': 'application/json'
              },
              timeout: ApiConfig.DEFAULT_TIMEOUT_MS
            }
          );
          technographicsData = techResponse.data;
          console.log(`⚡ TheirStack Technographics: Found ${techResponse.data?.data?.length || 0} technologies`);
        } catch (techError: any) {
          console.warn(`⚠️ TheirStack Technographics failed: ${techError.message}`);
        }
      }

      // Step 3: Jobs Search - Get hiring signals, hiring team, tech from job descriptions
      try {
        console.log(`👔 TheirStack: Fetching jobs/hiring data for "${cleanCompanyName}"`);
        const jobsResponse = await axios.post(
          `${ApiConfig.THEIRSTACK_BASE_URL}/jobs/search`,
          {
            company_name_partial_match_or: [cleanCompanyName],
            company_domain_or: discoveredDomain ? [discoveredDomain] : [],
            posted_at_max_age_days: 60, // Last 60 days of job postings
            page: 0,
            limit: 25, // Get up to 25 recent jobs
            order_by: [{ desc: true, field: 'date_posted' }],
            include_total_results: true
          },
          {
            headers: { 
              'Authorization': `Bearer ${ApiConfig.THEIRSTACK_JWT}`,
              'Content-Type': 'application/json'
            },
            timeout: ApiConfig.DEFAULT_TIMEOUT_MS
          }
        );
        jobsData = jobsResponse.data;
        
        // Extract valuable hiring intelligence
        const jobs = jobsData?.data || [];
        const hiringTeam = jobs.flatMap((job: any) => job.hiring_team || []);
        const techFromJobs = [...new Set(jobs.flatMap((job: any) => job.technology_slugs || []))];
        const seniorityLevels = [...new Set(jobs.map((job: any) => job.seniority).filter(Boolean))];
        const salaryRanges = jobs
          .filter((job: any) => job.min_annual_salary_usd || job.max_annual_salary_usd)
          .map((job: any) => ({
            title: job.job_title,
            min: job.min_annual_salary_usd,
            max: job.max_annual_salary_usd,
            avg: job.avg_annual_salary_usd
          }));
        
        console.log(`👔 TheirStack Jobs: Found ${jobs.length} jobs, ${hiringTeam.length} hiring contacts, ${techFromJobs.length} technologies`);
        
        // Enrich jobsData with extracted intelligence
        jobsData.hiringIntelligence = {
          totalJobs: jobsData?.metadata?.total_results || jobs.length,
          recentJobs: jobs.slice(0, 10), // Top 10 most recent
          hiringTeam: hiringTeam.slice(0, 10), // Top 10 contacts
          technologiesFromJobs: techFromJobs,
          seniorityLevels,
          salaryRanges: salaryRanges.slice(0, 5),
          jobTitles: [...new Set(jobs.map((job: any) => job.job_title))].slice(0, 15)
        };
      } catch (jobsError: any) {
        console.warn(`⚠️ TheirStack Jobs Search failed: ${jobsError.message}`);
      }

      const theirStackCost = 0.15; // Slightly higher cost for 3 API calls
      this.totalCost += theirStackCost;
      this.costTracker.trackApiCost({
        source: 'theirstack',
        cost: theirStackCost,
        timestamp: new Date(),
        requestType: 'solution-focused',
        valueScore: 4.0, // Higher value with jobs data
        requestId: this.requestId,
        companyName: companyName
      });

      // Combine company info, technographics, and hiring intelligence
      const hasData = companyData || technographicsData || jobsData;
      results.push({
        source: 'theirstack',
        data: {
          company: companyData,
          technologies: technographicsData?.data || [],
          technographicsMetadata: technographicsData?.metadata || {},
          jobs: jobsData?.hiringIntelligence || {},
          searchResults: companySearchResponse.data?.data || []
        },
        confidence: hasData ? 0.9 : 0.3,
        timestamp: new Date(),
        cost: theirStackCost
      });
    } catch (error: any) {
      console.warn(`⚠️ TheirStack API failed: ${error.message}`);
      if (error.response) {
        console.warn(`   Status: ${error.response.status}, Body: ${JSON.stringify(error.response.data)?.substring(0, 200)}`);
      }
      results.push({
        source: 'theirstack',
        data: { error: error.message, status: 'unavailable' },
        confidence: 0.0,
        timestamp: new Date(),
        cost: 0
      });
    }
    } else {
      console.log('💤 TheirStack: DORMANT (set ENABLE_THEIRSTACK=true in .env to activate)');
      console.log('🆓 Using FREE technographics sources instead: greenhouse-jobs, lever-jobs, web-fingerprint');
    }

    // MarketAux: Financial intelligence
    try {
      await this.updateProgress({
        stage: 'researching',
        agent: 'researcher',
        message: `Gathering financial intelligence on ${companyName}...`,
        confidence: 0.80,
        estimatedTimeRemaining: 60,
        userCanInterrupt: false,
        dataSourcesActive: ['marketaux'],
        insightsDiscovered: results.length,
        timestamp: new Date()
      });

      // MarketAux API: Use 'search' parameter (not 'companies' which doesn't exist)
      // API docs: https://api.marketaux.com/v1/news/all?search=COMPANY&api_token=TOKEN
      const marketAuxResponse = await axios.get(
        `${ApiConfig.MARKETAUX_BASE_URL}/news/all?search=${encodeURIComponent(companyName)}&api_token=${ApiConfig.MARKETAUX_TOKEN}&limit=10&language=en`,
        { timeout: ApiConfig.DEFAULT_TIMEOUT_MS }
      );

      const marketAuxCost = 0.05;
      this.totalCost += marketAuxCost;
      this.costTracker.trackApiCost({
        source: 'marketaux',
        cost: marketAuxCost,
        timestamp: new Date(),
        requestType: 'solution-focused',
        valueScore: 2.5,
        requestId: this.requestId,
        companyName: companyName
      });

      results.push({
        source: 'marketaux',
        data: marketAuxResponse.data || { news: [], financials: [] },
        confidence: 0.85,
        timestamp: new Date(),
        cost: marketAuxCost
      });
    } catch (error: any) {
      console.warn(`⚠️ MarketAux API failed: ${error.message}`);
      results.push({
        source: 'marketaux',
        data: { error: error.message, status: 'unavailable' },
        confidence: 0.0,
        timestamp: new Date(),
        cost: 0
      });
    }

    // Note: Coresignal API removed - not configured

    // OpenAI GPT-4o: Real-time intelligence synthesis (replaced Perplexity)
    try {
      await this.updateProgress({
        stage: 'researching',
        agent: 'researcher',
        message: `Synthesizing real-time intelligence about ${companyName}...`,
        confidence: 0.90,
        estimatedTimeRemaining: 30,
        userCanInterrupt: false,
        dataSourcesActive: ['openai-realtime'],
        insightsDiscovered: results.length,
        timestamp: new Date()
      });

      const openaiResponse = await axios.post(
        `${ApiConfig.DEEPSEEK_BASE_URL}/chat/completions`,
        {
          model: 'deepseek-chat',
          messages: [{
            role: 'system',
            content: 'You are a business intelligence analyst. Provide factual, specific insights about companies based on your training data. Focus on verifiable information.'
          }, {
            role: 'user',
            content: `Provide current business intelligence about ${companyName}:\n\n1. Company Overview: What is their core business, size, and market position?\n2. Recent Developments: Any known strategic initiatives, partnerships, or changes?\n3. Technology Profile: What technologies and platforms are they known to use?\n4. Market Position: How do they compare to competitors?\n5. Key Challenges: What business challenges might they face?\n\nProvide specific, factual information. If uncertain about something, indicate your confidence level.`
          }],
          temperature: 0.3,
          max_tokens: 2000
        },
        {
          headers: { 
            'Authorization': `Bearer ${ApiConfig.DEEPSEEK_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: ApiConfig.DEFAULT_TIMEOUT_MS
        }
      );

      const deepseekCost = 0.008; // DeepSeek is ~10x cheaper than GPT-4o
      this.totalCost += deepseekCost;
      this.costTracker.trackApiCost({
        source: 'deepseek-realtime',
        cost: deepseekCost,
        timestamp: new Date(),
        requestType: 'solution-focused',
        valueScore: 5.0,
        requestId: this.requestId,
        companyName: companyName
      });

      // Extract the content from DeepSeek response
      const insights = openaiResponse.data?.choices?.[0]?.message?.content || '';
      
      results.push({
        source: 'deepseek-realtime',
        data: { 
          insights: insights,
          model: 'deepseek-chat',
          usage: openaiResponse.data?.usage
        },
        confidence: 0.90,
        timestamp: new Date(),
        cost: deepseekCost
      });
    } catch (error: any) {
      console.warn(`⚠️ DeepSeek Real-time API failed: ${error.message}`);
      results.push({
        source: 'openai-realtime',
        data: { error: error.message, status: 'unavailable' },
        confidence: 0.0,
        timestamp: new Date(),
        cost: 0
      });
    }

    // Hacker News API: FREE - Tech community sentiment and discussions
    try {
      await this.updateProgress({
        stage: 'researching',
        agent: 'researcher',
        message: `Searching Hacker News for ${companyName} discussions...`,
        confidence: 0.90,
        estimatedTimeRemaining: 20,
        userCanInterrupt: false,
        dataSourcesActive: ['hackernews'],
        insightsDiscovered: results.length,
        timestamp: new Date()
      });

      // Use Algolia's HN Search API (completely free, no auth needed)
      const hnSearchResponse = await axios.get(
        `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(companyName)}&tags=story&hitsPerPage=15`,
        { timeout: 10000 }
      );

      const hnStories = hnSearchResponse.data?.hits || [];
      
      // Get top stories with comments for sentiment analysis
      const topStories = hnStories
        .filter((story: any) => story.num_comments > 0)
        .slice(0, 5)
        .map((story: any) => ({
          title: story.title,
          url: story.url,
          points: story.points,
          comments: story.num_comments,
          date: story.created_at,
          hnUrl: `https://news.ycombinator.com/item?id=${story.objectID}`
        }));

      console.log(`🔶 Hacker News: Found ${hnStories.length} stories, ${topStories.length} with discussions`);

      // No cost for HN API
      results.push({
        source: 'hackernews',
        data: {
          totalStories: hnSearchResponse.data?.nbHits || 0,
          topDiscussions: topStories,
          sentiment: topStories.length > 0 ? 'has_presence' : 'no_presence',
          avgPoints: topStories.length > 0 
            ? Math.round(topStories.reduce((sum: number, s: any) => sum + s.points, 0) / topStories.length)
            : 0,
          totalComments: topStories.reduce((sum: number, s: any) => sum + s.comments, 0)
        },
        confidence: topStories.length > 0 ? 0.85 : 0.5,
        timestamp: new Date(),
        cost: 0 // FREE!
      });
    } catch (error: any) {
      console.warn(`⚠️ Hacker News API failed: ${error.message}`);
      results.push({
        source: 'hackernews',
        data: { error: error.message, status: 'unavailable' },
        confidence: 0.0,
        timestamp: new Date(),
        cost: 0
      });
    }

    // Google News RSS: FREE - News intelligence and company mentions
    // Uses Google News RSS feed (no API key needed, completely free)
    // Docs: https://news.google.com/rss/search?q=COMPANY
    try {
      await this.updateProgress({
        stage: 'researching',
        agent: 'researcher',
        message: `Searching Google News for ${companyName} coverage...`,
        confidence: 0.92,
        estimatedTimeRemaining: 15,
        userCanInterrupt: false,
        dataSourcesActive: ['googlenews'],
        insightsDiscovered: results.length,
        timestamp: new Date()
      });

      // Google News RSS - FREE, no API key needed
      // Format: https://news.google.com/rss/search?q=QUERY&hl=en-US&gl=US&ceid=US:en
      const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(companyName)}&hl=en-US&gl=US&ceid=US:en`;
      
      const rssResponse = await axios.get(rssUrl, { 
        timeout: 10000,
        headers: {
          'User-Agent': 'ProspectPI/1.0 (Business Intelligence Research)',
          'Accept': 'application/rss+xml, application/xml, text/xml'
        }
      });

      // Parse RSS XML to extract articles
      const rssXml = rssResponse.data;
      const articles: any[] = [];
      
      // Simple XML parsing for RSS items (no external dependency needed)
      const itemMatches = rssXml.match(/<item>([\s\S]*?)<\/item>/g) || [];
      
      for (const itemXml of itemMatches.slice(0, 15)) {
        const title = this.extractXmlTag(itemXml, 'title');
        const link = this.extractXmlTag(itemXml, 'link');
        const pubDate = this.extractXmlTag(itemXml, 'pubDate');
        const source = this.extractXmlTag(itemXml, 'source');
        
        if (title) {
          articles.push({
            title: this.decodeHtmlEntities(title),
            url: link || '',
            publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
            source: source ? this.decodeHtmlEntities(source) : 'Google News',
            sentiment: this.analyzeHeadlineSentiment(title)
          });
        }
      }

      // Categorize news by topic signals
      const topicCategories = {
        hiring: articles.filter((a: any) => /hiring|jobs|recruit|expansion/i.test(a.title)).length,
        funding: articles.filter((a: any) => /funding|investment|raise|series/i.test(a.title)).length,
        product: articles.filter((a: any) => /launch|release|product|feature|announce/i.test(a.title)).length,
        partnership: articles.filter((a: any) => /partner|alliance|integration|collaboration/i.test(a.title)).length,
        leadership: articles.filter((a: any) => /CEO|CTO|appoint|executive|leadership/i.test(a.title)).length
      };

      console.log(`📰 Google News RSS: Found ${articles.length} articles, topics: hiring=${topicCategories.hiring}, funding=${topicCategories.funding}`);

      // NO COST - Google News RSS is FREE
      results.push({
        source: 'googlenews',
        data: {
          totalArticles: articles.length,
          articles: articles,
          topicSignals: topicCategories,
          sentiment: this.calculateOverallSentiment(articles),
          recentHeadlines: articles.slice(0, 5).map((a: any) => a.title),
          sources: [...new Set(articles.map((a: any) => a.source))]
        },
        confidence: articles.length > 0 ? 0.80 : 0.4,
        timestamp: new Date(),
        cost: 0 // FREE!
      });
    } catch (error: any) {
      console.warn(`⚠️ Google News RSS failed: ${error.message}`);
      results.push({
        source: 'googlenews',
        data: { error: error.message, status: 'unavailable' },
        confidence: 0.0,
        timestamp: new Date(),
        cost: 0
      });
    }

    // SEC EDGAR: FREE - Public company financials, 10-K/10-Q filings
    // Only works for publicly traded US companies
    try {
      await this.updateProgress({
        stage: 'researching',
        agent: 'researcher',
        message: `Searching SEC EDGAR for ${companyName} filings...`,
        confidence: 0.93,
        estimatedTimeRemaining: 12,
        userCanInterrupt: false,
        dataSourcesActive: ['sec-edgar'],
        insightsDiscovered: results.length,
        timestamp: new Date()
      });

      // SEC EDGAR full-text search API (FREE, no auth)
      // Reference: https://www.sec.gov/search-filings
      const secSearchUrl = `https://efts.sec.gov/LATEST/search-index?q=${encodeURIComponent(companyName)}&dateRange=custom&startdt=2023-01-01&forms=10-K,10-Q,8-K&from=0&size=10`;
      
      const secResponse = await axios.get(secSearchUrl, {
        timeout: 15000,
        headers: {
          'User-Agent': 'ProspectPI Research Bot (research@prospectpi.com)',
          'Accept': 'application/json'
        }
      });

      const secHits = secResponse.data?.hits?.hits || [];
      const filings: any[] = [];

      for (const hit of secHits.slice(0, 10)) {
        const source = hit._source || {};
        filings.push({
          form: source.form || 'Unknown',
          companyName: source.display_names?.[0] || source.entity || companyName,
          cik: source.ciks?.[0] || '',
          filedDate: source.file_date || '',
          accessionNumber: source.adsh || '',
          filingUrl: source.adsh ? `https://www.sec.gov/Archives/edgar/data/${source.ciks?.[0]}/${source.adsh.replace(/-/g, '')}` : '',
          description: source.form_description || ''
        });
      }

      console.log(`📊 SEC EDGAR: Found ${filings.length} filings for potential matches`);

      // If filings found, try to get company details from CIK
      let companyDetails = null;
      if (filings.length > 0 && filings[0].cik) {
        try {
          const cikPadded = filings[0].cik.toString().padStart(10, '0');
          const companyInfoUrl = `https://data.sec.gov/submissions/CIK${cikPadded}.json`;
          const companyInfoResponse = await axios.get(companyInfoUrl, {
            timeout: 10000,
            headers: {
              'User-Agent': 'ProspectPI Research Bot (research@prospectpi.com)',
              'Accept': 'application/json'
            }
          });
          
          const info = companyInfoResponse.data;
          companyDetails = {
            name: info.name,
            cik: info.cik,
            sic: info.sic,
            sicDescription: info.sicDescription,
            fiscalYearEnd: info.fiscalYearEnd,
            stateOfIncorporation: info.stateOfIncorporation,
            exchanges: info.exchanges,
            tickers: info.tickers,
            ein: info.ein,
            recentFilingCount: info.filings?.recent?.form?.length || 0
          };
          console.log(`📊 SEC: Company match - ${companyDetails.name} (${companyDetails.tickers?.join(', ') || 'private'})`);
        } catch (e) {
          // CIK lookup failed, continue with search results
        }
      }

      results.push({
        source: 'sec-edgar' as any,
        data: {
          filings: filings,
          companyDetails: companyDetails,
          isPublicCompany: filings.length > 0,
          recentFilings: filings.filter(f => ['10-K', '10-Q', '8-K'].includes(f.form)),
          totalResults: secResponse.data?.hits?.total?.value || 0
        },
        confidence: filings.length > 0 ? 0.90 : 0.3,
        timestamp: new Date(),
        cost: 0 // FREE!
      });
    } catch (error: any) {
      console.warn(`⚠️ SEC EDGAR search failed: ${error.message}`);
      results.push({
        source: 'sec-edgar' as any,
        data: { error: error.message, status: 'unavailable', note: 'Company may be private or non-US' },
        confidence: 0.0,
        timestamp: new Date(),
        cost: 0
      });
    }

    // SEC Form D: FREE - Private funding rounds (Reg D exemptions)
    // This is the "magic" behind PitchBook/Crunchbase for private company funding!
    // Reference: https://www.sec.gov/data-research/sec-markets-data/form-d-data-sets
    try {
      await this.updateProgress({
        stage: 'researching',
        agent: 'researcher',
        message: `Searching SEC Form D for ${companyName} private funding...`,
        confidence: 0.93,
        estimatedTimeRemaining: 10,
        userCanInterrupt: false,
        dataSourcesActive: ['sec-formd'],
        insightsDiscovered: results.length,
        timestamp: new Date()
      });

      // Search SEC EDGAR for Form D filings specifically
      const formDSearchUrl = `https://efts.sec.gov/LATEST/search-index?q=${encodeURIComponent(companyName)}&forms=D&from=0&size=20`;
      
      const formDResponse = await axios.get(formDSearchUrl, {
        timeout: 15000,
        headers: {
          'User-Agent': 'ProspectPI Research Bot (research@prospectpi.com)',
          'Accept': 'application/json'
        }
      });

      const formDHits = formDResponse.data?.hits?.hits || [];
      const fundingRounds: any[] = [];

      for (const hit of formDHits.slice(0, 15)) {
        const source = hit._source || {};
        fundingRounds.push({
          issuerName: source.display_names?.[0] || source.entity || companyName,
          cik: source.ciks?.[0] || '',
          filedDate: source.file_date || '',
          accessionNumber: source.adsh || '',
          formType: source.form || 'D',
          filingUrl: source.adsh ? `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${source.ciks?.[0]}&type=D&dateb=&owner=include&count=40` : ''
        });
      }

      // If we found Form D filings, try to get more details from the CIK
      let fundingDetails: any[] = [];
      if (fundingRounds.length > 0 && fundingRounds[0].cik) {
        try {
          const cikPadded = fundingRounds[0].cik.toString().padStart(10, '0');
          const submissionsUrl = `https://data.sec.gov/submissions/CIK${cikPadded}.json`;
          const submissionsResponse = await axios.get(submissionsUrl, {
            timeout: 10000,
            headers: {
              'User-Agent': 'ProspectPI Research Bot (research@prospectpi.com)',
              'Accept': 'application/json'
            }
          });
          
          const recentFilings = submissionsResponse.data?.filings?.recent || {};
          const forms = recentFilings.form || [];
          const dates = recentFilings.filingDate || [];
          const accessions = recentFilings.accessionNumber || [];
          
          // Extract Form D filings with dates
          for (let i = 0; i < forms.length && fundingDetails.length < 10; i++) {
            if (forms[i] === 'D' || forms[i] === 'D/A') {
              fundingDetails.push({
                form: forms[i],
                filingDate: dates[i],
                accessionNumber: accessions[i],
                isAmendment: forms[i] === 'D/A'
              });
            }
          }
        } catch (e) {
          // CIK lookup failed, continue with search results
        }
      }

      const hasPrivateFunding = fundingRounds.length > 0;
      console.log(`💰 SEC Form D: Found ${fundingRounds.length} private funding filings`);

      results.push({
        source: 'sec-formd' as any,
        data: {
          fundingRounds: fundingRounds,
          fundingDetails: fundingDetails,
          hasPrivateFunding: hasPrivateFunding,
          totalFilings: formDResponse.data?.hits?.total?.value || 0,
          fundingSignal: hasPrivateFunding ? 'ACTIVE_FUNDRAISING' : 'NO_REG_D_FILINGS',
          // Sales insight: Recent Form D = company has budget from fundraising!
          salesInsight: hasPrivateFunding ? 'Company has raised private capital - likely has budget for new solutions' : 'No recent private fundraising detected'
        },
        confidence: hasPrivateFunding ? 0.90 : 0.4,
        timestamp: new Date(),
        cost: 0 // FREE!
      });
    } catch (error: any) {
      console.warn(`⚠️ SEC Form D search failed: ${error.message}`);
      results.push({
        source: 'sec-formd' as any,
        data: { error: error.message, status: 'unavailable' },
        confidence: 0.0,
        timestamp: new Date(),
        cost: 0
      });
    }

    // SEC 8-K Executive Changes: FREE - CEO/CFO/Officer appointments & departures
    // Item 5.02 = Changes in Officers - canonical record for leadership changes
    // Reference: https://www.sec.gov/search-filings
    try {
      await this.updateProgress({
        stage: 'researching',
        agent: 'researcher',
        message: `Searching SEC 8-K for ${companyName} executive changes...`,
        confidence: 0.93,
        estimatedTimeRemaining: 9,
        userCanInterrupt: false,
        dataSourcesActive: ['sec-8k'],
        insightsDiscovered: results.length,
        timestamp: new Date()
      });

      // Search for 8-K filings (material events including exec changes)
      const eightKSearchUrl = `https://efts.sec.gov/LATEST/search-index?q=${encodeURIComponent(companyName)}&forms=8-K&from=0&size=20`;
      
      const eightKResponse = await axios.get(eightKSearchUrl, {
        timeout: 15000,
        headers: {
          'User-Agent': 'ProspectPI Research Bot (research@prospectpi.com)',
          'Accept': 'application/json'
        }
      });

      const eightKHits = eightKResponse.data?.hits?.hits || [];
      const materialEvents: any[] = [];

      for (const hit of eightKHits.slice(0, 15)) {
        const source = hit._source || {};
        materialEvents.push({
          companyName: source.display_names?.[0] || source.entity || companyName,
          cik: source.ciks?.[0] || '',
          filedDate: source.file_date || '',
          accessionNumber: source.adsh || '',
          form: source.form || '8-K',
          items: source.items || [], // 8-K item numbers (5.02 = officer changes)
          filingUrl: source.adsh && source.ciks?.[0] ? 
            `https://www.sec.gov/Archives/edgar/data/${source.ciks[0]}/${source.adsh.replace(/-/g, '')}` : ''
        });
      }

      // Categorize 8-K events
      const executiveChanges = materialEvents.filter(e => 
        e.items?.some((item: string) => item.includes('5.02') || item.includes('5.01'))
      );
      const acquisitions = materialEvents.filter(e => 
        e.items?.some((item: string) => item.includes('2.01') || item.includes('1.01'))
      );
      const financialEvents = materialEvents.filter(e => 
        e.items?.some((item: string) => item.includes('2.02') || item.includes('2.06'))
      );

      console.log(`📋 SEC 8-K: Found ${materialEvents.length} material events, ${executiveChanges.length} exec changes`);

      results.push({
        source: 'sec-8k' as any,
        data: {
          materialEvents: materialEvents,
          executiveChanges: executiveChanges,
          acquisitions: acquisitions,
          financialEvents: financialEvents,
          totalEvents: eightKResponse.data?.hits?.total?.value || 0,
          hasRecentExecChanges: executiveChanges.length > 0,
          // Sales insight: New executives = new decision makers = new opportunities!
          salesInsight: executiveChanges.length > 0 ? 
            'Recent executive changes detected - new decision makers may be open to new solutions' : 
            'Stable leadership - existing relationships may be key'
        },
        confidence: materialEvents.length > 0 ? 0.85 : 0.4,
        timestamp: new Date(),
        cost: 0 // FREE!
      });
    } catch (error: any) {
      console.warn(`⚠️ SEC 8-K search failed: ${error.message}`);
      results.push({
        source: 'sec-8k' as any,
        data: { error: error.message, status: 'unavailable' },
        confidence: 0.0,
        timestamp: new Date(),
        cost: 0
      });
    }

    // SEC XBRL API: FREE - Machine-readable financials (revenue, margins, etc.)
    // Reference: https://www.sec.gov/search-filings/edgar-application-programming-interfaces
    try {
      await this.updateProgress({
        stage: 'researching',
        agent: 'researcher',
        message: `Fetching SEC XBRL financials for ${companyName}...`,
        confidence: 0.93,
        estimatedTimeRemaining: 8,
        userCanInterrupt: false,
        dataSourcesActive: ['sec-xbrl'],
        insightsDiscovered: results.length,
        timestamp: new Date()
      });

      // First, we need to find the CIK from our earlier SEC EDGAR search
      // Look in existing results for SEC EDGAR data
      const secEdgarResult = results.find(r => r.source === 'sec-edgar');
      const cik = secEdgarResult?.data?.companyDetails?.cik || secEdgarResult?.data?.filings?.[0]?.cik;
      
      let financialData: any = null;
      
      if (cik) {
        const cikPadded = cik.toString().padStart(10, '0');
        
        // Get company concept data for key financial metrics
        // Revenue (Revenues or RevenueFromContractWithCustomerExcludingAssessedTax)
        try {
          const revenueUrl = `https://data.sec.gov/api/xbrl/companyconcept/CIK${cikPadded}/us-gaap/Revenues.json`;
          const revenueResponse = await axios.get(revenueUrl, {
            timeout: 10000,
            headers: {
              'User-Agent': 'ProspectPI Research Bot (research@prospectpi.com)',
              'Accept': 'application/json'
            }
          });
          
          const units = revenueResponse.data?.units?.USD || [];
          const annualRevenue = units.filter((u: any) => u.form === '10-K').slice(-5);
          const quarterlyRevenue = units.filter((u: any) => u.form === '10-Q').slice(-8);
          
          financialData = {
            entityName: revenueResponse.data?.entityName,
            cik: cik,
            revenues: {
              annual: annualRevenue.map((r: any) => ({
                period: r.fy,
                value: r.val,
                filed: r.filed
              })),
              quarterly: quarterlyRevenue.map((r: any) => ({
                period: `${r.fy} Q${r.fp?.replace('Q', '')}`,
                value: r.val,
                filed: r.filed
              }))
            }
          };
          
          // Calculate revenue growth if we have enough data
          if (annualRevenue.length >= 2) {
            const latestRev = annualRevenue[annualRevenue.length - 1]?.val || 0;
            const priorRev = annualRevenue[annualRevenue.length - 2]?.val || 1;
            financialData.revenueGrowthYoY = ((latestRev - priorRev) / priorRev * 100).toFixed(1) + '%';
            financialData.latestRevenue = latestRev;
            financialData.latestRevenueFormatted = (latestRev / 1000000000).toFixed(2) + 'B';
          }
        } catch (e) {
          // Revenue concept not found, try alternative
        }
        
        // Try to get Net Income
        if (financialData) {
          try {
            const netIncomeUrl = `https://data.sec.gov/api/xbrl/companyconcept/CIK${cikPadded}/us-gaap/NetIncomeLoss.json`;
            const netIncomeResponse = await axios.get(netIncomeUrl, {
              timeout: 10000,
              headers: {
                'User-Agent': 'ProspectPI Research Bot (research@prospectpi.com)',
                'Accept': 'application/json'
              }
            });
            
            const niUnits = netIncomeResponse.data?.units?.USD || [];
            const annualNI = niUnits.filter((u: any) => u.form === '10-K').slice(-5);
            
            financialData.netIncome = {
              annual: annualNI.map((r: any) => ({
                period: r.fy,
                value: r.val,
                filed: r.filed
              }))
            };
            
            if (annualNI.length > 0) {
              const latestNI = annualNI[annualNI.length - 1]?.val || 0;
              financialData.latestNetIncome = latestNI;
              financialData.isProfitable = latestNI > 0;
            }
          } catch (e) {
            // Net income not found
          }
        }
        
        // Try to get Assets (company size indicator)
        if (financialData) {
          try {
            const assetsUrl = `https://data.sec.gov/api/xbrl/companyconcept/CIK${cikPadded}/us-gaap/Assets.json`;
            const assetsResponse = await axios.get(assetsUrl, {
              timeout: 10000,
              headers: {
                'User-Agent': 'ProspectPI Research Bot (research@prospectpi.com)',
                'Accept': 'application/json'
              }
            });
            
            const assetUnits = assetsResponse.data?.units?.USD || [];
            const annualAssets = assetUnits.filter((u: any) => u.form === '10-K').slice(-3);
            
            if (annualAssets.length > 0) {
              const latestAssets = annualAssets[annualAssets.length - 1]?.val || 0;
              financialData.totalAssets = latestAssets;
              financialData.totalAssetsFormatted = (latestAssets / 1000000000).toFixed(2) + 'B';
              financialData.companySize = latestAssets > 10000000000 ? 'Large Cap' : 
                                         latestAssets > 1000000000 ? 'Mid Cap' : 'Small Cap';
            }
          } catch (e) {
            // Assets not found
          }
        }
      }

      const hasFinancials = financialData !== null;
      console.log(`📈 SEC XBRL: ${hasFinancials ? 'Retrieved financial metrics' : 'No XBRL data (likely private company)'}`);

      results.push({
        source: 'sec-xbrl' as any,
        data: {
          financials: financialData,
          hasXBRLData: hasFinancials,
          // Sales insight: Financial health indicators
          salesInsight: hasFinancials ? 
            `${financialData.isProfitable ? 'Profitable company' : 'Growth-stage company'} - ${financialData.revenueGrowthYoY ? `Revenue growth: ${financialData.revenueGrowthYoY}` : 'Financial data available'}` :
            'Private company - financial data not publicly available'
        },
        confidence: hasFinancials ? 0.90 : 0.2,
        timestamp: new Date(),
        cost: 0 // FREE!
      });
    } catch (error: any) {
      console.warn(`⚠️ SEC XBRL API failed: ${error.message}`);
      results.push({
        source: 'sec-xbrl' as any,
        data: { error: error.message, status: 'unavailable' },
        confidence: 0.0,
        timestamp: new Date(),
        cost: 0
      });
    }

    // Stack Exchange API: FREE - Developer pain points and technical discussions
    // Searches Stack Overflow and related sites for company/product mentions
    try {
      await this.updateProgress({
        stage: 'researching',
        agent: 'researcher',
        message: `Searching Stack Exchange for ${companyName} technical discussions...`,
        confidence: 0.93,
        estimatedTimeRemaining: 10,
        userCanInterrupt: false,
        dataSourcesActive: ['stackexchange'],
        insightsDiscovered: results.length,
        timestamp: new Date()
      });

      // Stack Exchange API - FREE (throttled to 300 requests/day without key)
      // Reference: https://api.stackexchange.com/docs
      const seSearchUrl = `https://api.stackexchange.com/2.3/search/advanced?order=desc&sort=relevance&q=${encodeURIComponent(companyName)}&site=stackoverflow&filter=withbody&pagesize=15`;
      
      const seResponse = await axios.get(seSearchUrl, {
        timeout: 10000,
        headers: {
          'Accept-Encoding': 'gzip, deflate'
        }
      });

      const questions = (seResponse.data?.items || []).map((q: any) => ({
        title: q.title,
        questionId: q.question_id,
        link: q.link,
        score: q.score,
        answerCount: q.answer_count,
        viewCount: q.view_count,
        isAnswered: q.is_answered,
        createdDate: new Date(q.creation_date * 1000).toISOString(),
        tags: q.tags || [],
        // Extract pain point signals from body
        bodyPreview: q.body ? q.body.replace(/<[^>]*>/g, '').substring(0, 200) : ''
      }));

      // Analyze questions for pain point patterns
      const painPointSignals = {
        integration: questions.filter((q: any) => /integrat|connect|api|sdk|library/i.test(q.title)).length,
        migration: questions.filter((q: any) => /migrat|upgrade|convert|switch/i.test(q.title)).length,
        performance: questions.filter((q: any) => /slow|performance|timeout|memory|cpu/i.test(q.title)).length,
        bugs: questions.filter((q: any) => /error|bug|issue|problem|fail|crash/i.test(q.title)).length,
        howTo: questions.filter((q: any) => /how to|how do|can i|possible to/i.test(q.title)).length
      };

      // Get common tags (tech stack signals)
      const allTags = questions.flatMap((q: any) => q.tags);
      const tagCounts = allTags.reduce((acc: any, tag: string) => {
        acc[tag] = (acc[tag] || 0) + 1;
        return acc;
      }, {});
      const topTags = Object.entries(tagCounts)
        .sort((a: any, b: any) => b[1] - a[1])
        .slice(0, 10)
        .map(([tag, count]) => ({ tag, count }));

      console.log(`💬 Stack Exchange: Found ${questions.length} questions, pain signals: bugs=${painPointSignals.bugs}, integration=${painPointSignals.integration}`);

      results.push({
        source: 'stackexchange' as any,
        data: {
          questions: questions,
          totalResults: seResponse.data?.total || questions.length,
          painPointSignals: painPointSignals,
          topTags: topTags,
          hasQuota: seResponse.data?.has_more !== undefined,
          quotaRemaining: seResponse.data?.quota_remaining || 'unknown',
          devCommunityPresence: questions.length > 0 ? 'active' : 'minimal'
        },
        confidence: questions.length > 0 ? 0.80 : 0.4,
        timestamp: new Date(),
        cost: 0 // FREE!
      });
    } catch (error: any) {
      console.warn(`⚠️ Stack Exchange API failed: ${error.message}`);
      results.push({
        source: 'stackexchange' as any,
        data: { error: error.message, status: 'unavailable' },
        confidence: 0.0,
        timestamp: new Date(),
        cost: 0
      });
    }

    // GitHub API: FREE - Developer ecosystem signals, repos, issues
    // Rate limited: 60 requests/hour unauthenticated
    try {
      await this.updateProgress({
        stage: 'researching',
        agent: 'researcher',
        message: `Searching GitHub for ${companyName} repositories and activity...`,
        confidence: 0.94,
        estimatedTimeRemaining: 8,
        userCanInterrupt: false,
        dataSourcesActive: ['github'],
        insightsDiscovered: results.length,
        timestamp: new Date()
      });

      // GitHub Search API - FREE (rate limited)
      // Reference: https://docs.github.com/en/rest/search
      const ghSearchUrl = `https://api.github.com/search/repositories?q=${encodeURIComponent(companyName)}&sort=stars&order=desc&per_page=15`;
      
      const ghResponse = await axios.get(ghSearchUrl, {
        timeout: 10000,
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'ProspectPI-Research-Bot'
        }
      });

      const repos = (ghResponse.data?.items || []).map((repo: any) => ({
        name: repo.full_name,
        description: repo.description,
        url: repo.html_url,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        openIssues: repo.open_issues_count,
        language: repo.language,
        topics: repo.topics || [],
        createdAt: repo.created_at,
        updatedAt: repo.updated_at,
        isOrg: repo.owner?.type === 'Organization',
        ownerName: repo.owner?.login
      }));

      // Try to find official org account
      let orgInfo = null;
      const cleanName = companyName.toLowerCase().replace(/[^a-z0-9]/g, '');
      const potentialOrgNames = [cleanName, cleanName.replace(/inc|llc|corp|ltd/g, '').trim()];
      
      for (const orgName of potentialOrgNames) {
        if (!orgName) continue;
        try {
          const orgResponse = await axios.get(`https://api.github.com/orgs/${orgName}`, {
            timeout: 5000,
            headers: {
              'Accept': 'application/vnd.github.v3+json',
              'User-Agent': 'ProspectPI-Research-Bot'
            }
          });
          
          if (orgResponse.data) {
            orgInfo = {
              login: orgResponse.data.login,
              name: orgResponse.data.name,
              description: orgResponse.data.description,
              publicRepos: orgResponse.data.public_repos,
              followers: orgResponse.data.followers,
              blog: orgResponse.data.blog,
              location: orgResponse.data.location,
              createdAt: orgResponse.data.created_at
            };
            console.log(`🐙 GitHub: Found official org - ${orgInfo.login} with ${orgInfo.publicRepos} public repos`);
            break;
          }
        } catch (e) {
          // Org not found with this name, continue
        }
      }

      // Analyze tech signals
      const languages = repos.map((r: any) => r.language).filter(Boolean);
      const languageCounts = languages.reduce((acc: any, lang: string) => {
        acc[lang] = (acc[lang] || 0) + 1;
        return acc;
      }, {});
      
      const allTopics = repos.flatMap((r: any) => r.topics);
      const topicCounts = allTopics.reduce((acc: any, topic: string) => {
        acc[topic] = (acc[topic] || 0) + 1;
        return acc;
      }, {});

      console.log(`🐙 GitHub: Found ${repos.length} repos, org=${orgInfo?.login || 'not found'}`);

      results.push({
        source: 'github',
        data: {
          repositories: repos,
          totalResults: ghResponse.data?.total_count || 0,
          officialOrg: orgInfo,
          techSignals: {
            topLanguages: Object.entries(languageCounts).sort((a: any, b: any) => b[1] - a[1]).slice(0, 5),
            topTopics: Object.entries(topicCounts).sort((a: any, b: any) => b[1] - a[1]).slice(0, 10),
            totalStars: repos.reduce((sum: number, r: any) => sum + r.stars, 0),
            totalForks: repos.reduce((sum: number, r: any) => sum + r.forks, 0),
            openSourceActivity: repos.filter((r: any) => r.updatedAt > new Date(Date.now() - 90*24*60*60*1000).toISOString()).length
          },
          devEcosystemPresence: orgInfo || repos.length > 5 ? 'strong' : repos.length > 0 ? 'moderate' : 'minimal'
        },
        confidence: (orgInfo || repos.length > 0) ? 0.85 : 0.4,
        timestamp: new Date(),
        cost: 0 // FREE!
      });
    } catch (error: any) {
      console.warn(`⚠️ GitHub API failed: ${error.message}`);
      results.push({
        source: 'github',
        data: { error: error.message, status: 'unavailable' },
        confidence: 0.0,
        timestamp: new Date(),
        cost: 0
      });
    }

    // SAM.gov API: FREE - Federal government contracts and awards
    // Valuable for companies selling to government or with gov contracts
    // API Key: Register FREE at https://open.gsa.gov/ - takes 10 minutes
    const samApiKey = process.env.SAM_GOV_API_KEY;
    if (samApiKey) {
      try {
        await this.updateProgress({
          stage: 'researching',
          agent: 'researcher',
          message: `Searching SAM.gov for ${companyName} federal contracts...`,
          confidence: 0.94,
          estimatedTimeRemaining: 6,
          userCanInterrupt: false,
          dataSourcesActive: ['sam-gov'],
          insightsDiscovered: results.length,
          timestamp: new Date()
        });

        // SAM.gov Entity API v3 - FREE with registered API key
        // Reference: https://open.gsa.gov/api/entity-api/
        // Use api-alpha.sam.gov per OpenAPI spec
        const samSearchUrl = `https://api.sam.gov/entity-information/v3/entities?api_key=${samApiKey}&legalBusinessName=${encodeURIComponent(companyName)}&registrationStatus=A&size=10`;
      
      const samResponse = await axios.get(samSearchUrl, {
        timeout: 15000,
        headers: {
          'Accept': 'application/json'
        }
      });

      const entities = (samResponse.data?.entityData || []).map((entity: any) => ({
        ueiSAM: entity.entityRegistration?.ueiSAM,
        legalBusinessName: entity.entityRegistration?.legalBusinessName,
        dbaName: entity.entityRegistration?.dbaName,
        cageCode: entity.entityRegistration?.cageCode,
        registrationStatus: entity.entityRegistration?.registrationStatus,
        registrationDate: entity.entityRegistration?.registrationDate,
        expirationDate: entity.entityRegistration?.registrationExpirationDate,
        physicalAddress: entity.coreData?.physicalAddress,
        mailingAddress: entity.coreData?.mailingAddress,
        congressionalDistrict: entity.coreData?.congressionalDistrict,
        businessTypes: entity.coreData?.businessTypes?.businessTypeList?.map((bt: any) => bt.businessTypeDesc) || [],
        naicsCode: entity.coreData?.entityInformation?.entityStartDate,
        purposeOfRegistration: entity.coreData?.generalInformation?.purposeOfRegistrationDesc,
        entityStructure: entity.coreData?.generalInformation?.entityStructureDesc,
        organizationStructure: entity.coreData?.generalInformation?.organizationStructureDesc,
        stateOfIncorporation: entity.coreData?.generalInformation?.stateOfIncorporationCode,
        fiscalYearEndCloseDate: entity.coreData?.generalInformation?.fiscalYearEndCloseDate
      }));

      // Check for contract opportunities too
      let opportunities: any[] = [];
      try {
        const oppUrl = `https://api.sam.gov/opportunities/v2/search?api_key=${samApiKey}&q=${encodeURIComponent(companyName)}&limit=10`;
        const oppResponse = await axios.get(oppUrl, { timeout: 10000 });
        opportunities = (oppResponse.data?.opportunitiesData || []).map((opp: any) => ({
          title: opp.title,
          solicitationNumber: opp.solicitationNumber,
          type: opp.type,
          postedDate: opp.postedDate,
          responseDeadline: opp.responseDeadLine,
          department: opp.department,
          subtier: opp.subtier,
          naicsCode: opp.naicsCode,
          setAside: opp.typeOfSetAside
        }));
      } catch (e) {
        // Opportunities search failed, continue with entity data
      }

      console.log(`🏛️ SAM.gov: Found ${entities.length} entities, ${opportunities.length} opportunities`);

      results.push({
        source: 'sam-gov' as any,
        data: {
          entities: entities,
          opportunities: opportunities,
          isGovContractor: entities.length > 0,
          totalEntities: samResponse.data?.totalRecords || entities.length,
          businessTypes: entities.flatMap((e: any) => e.businessTypes || []),
          hasActiveRegistration: entities.some((e: any) => e.registrationStatus === 'Active')
        },
        confidence: entities.length > 0 ? 0.90 : 0.3,
        timestamp: new Date(),
        cost: 0 // FREE!
      });
      } catch (error: any) {
        console.warn(`⚠️ SAM.gov API failed: ${error.message}`);
        results.push({
          source: 'sam-gov' as any,
          data: { error: error.message, status: 'unavailable', note: 'Company may not have federal contracts' },
          confidence: 0.0,
          timestamp: new Date(),
          cost: 0
        });
      }
    } else {
      // No API key configured - skip SAM.gov with note
      console.log('🏛️ SAM.gov: Skipped - no SAM_GOV_API_KEY configured (get FREE key at https://open.gsa.gov/)');
      results.push({
        source: 'sam-gov' as any,
        data: { note: 'SAM.gov requires API key - register FREE at https://open.gsa.gov/' },
        confidence: 0.0,
        timestamp: new Date(),
        cost: 0
      });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // USPTO: DISABLED - API endpoint returns 404 (endpoint may have changed)
    // Re-enable when PatentsView API is working again
    // ═══════════════════════════════════════════════════════════════════════
    if (false) { // DISABLED - USPTO API broken
    try {
      await this.updateProgress({
        stage: 'researching',
        agent: 'researcher',
        message: `Searching USPTO for ${companyName} patents...`,
        confidence: 0.95,
        estimatedTimeRemaining: 5,
        userCanInterrupt: false,
        dataSourcesActive: ['uspto'],
        insightsDiscovered: results.length,
        timestamp: new Date()
      });

      // USPTO PatentsView API - FREE, no auth
      // Reference: https://patentsview.org/apis/api-endpoints
      const cleanCompanyName = companyName.replace(/,?\s*(LLC|Inc\.?|Corp\.?|Corporation|Ltd\.?|Limited|Co\.?|Company)$/gi, '').trim();
      
      const usptoUrl = `https://api.patentsview.org/patents/query?q={"_and":[{"_or":[{"assignee_organization":"${cleanCompanyName}"},{"_text_any":{"patent_title":"${cleanCompanyName}"}}]}]}&f=["patent_number","patent_title","patent_date","patent_abstract","assignee_organization","inventor_first_name","inventor_last_name","cpc_group_title"]&o={"per_page":15,"page":1}`;
      
      const usptoResponse = await axios.get(usptoUrl, {
        timeout: 15000,
        headers: {
          'Accept': 'application/json'
        }
      });

      const patents = (usptoResponse.data?.patents || []).map((patent: any) => ({
        patentNumber: patent.patent_number,
        title: patent.patent_title,
        date: patent.patent_date,
        abstract: patent.patent_abstract?.substring(0, 300),
        assignee: patent.assignees?.[0]?.assignee_organization,
        inventors: patent.inventors?.map((inv: any) => `${inv.inventor_first_name} ${inv.inventor_last_name}`).slice(0, 3),
        cpcCategories: patent.cpcs?.map((cpc: any) => cpc.cpc_group_title).slice(0, 3)
      }));

      // Analyze patent categories for tech focus
      const allCategories = patents.flatMap((p: any) => p.cpcCategories || []);
      const categoryCounts = allCategories.reduce((acc: any, cat: string) => {
        if (cat) acc[cat] = (acc[cat] || 0) + 1;
        return acc;
      }, {});
      const topCategories = Object.entries(categoryCounts)
        .sort((a: any, b: any) => b[1] - a[1])
        .slice(0, 5);

      console.log(`📜 USPTO: Found ${patents.length} patents for "${cleanCompanyName}"`);

      results.push({
        source: 'uspto' as any,
        data: {
          patents: patents,
          totalPatents: usptoResponse.data?.total_patent_count || patents.length,
          hasPatents: patents.length > 0,
          innovationSignals: {
            patentCount: patents.length,
            topCategories: topCategories,
            recentPatents: patents.filter((p: any) => new Date(p.date) > new Date(Date.now() - 365*24*60*60*1000)).length,
            uniqueInventors: [...new Set(patents.flatMap((p: any) => p.inventors || []))].length
          },
          rdActivity: patents.length > 10 ? 'high' : patents.length > 0 ? 'moderate' : 'minimal'
        },
        confidence: patents.length > 0 ? 0.85 : 0.4,
        timestamp: new Date(),
        cost: 0 // FREE!
      });
    } catch (error: any) {
      console.warn(`⚠️ USPTO API failed: ${error.message}`);
      results.push({
        source: 'uspto' as any,
        data: { error: error.message, status: 'unavailable' },
        confidence: 0.0,
        timestamp: new Date(),
        cost: 0
      });
    }
    } // END DISABLED USPTO

    // Wikidata SPARQL: FREE - Structured company data (founding, HQ, industry, subsidiaries)
    // Reference: https://query.wikidata.org/
    try {
      await this.updateProgress({
        stage: 'researching',
        agent: 'researcher',
        message: `Querying Wikidata for ${companyName} structured data...`,
        confidence: 0.95,
        estimatedTimeRemaining: 4,
        userCanInterrupt: false,
        dataSourcesActive: ['wikidata'],
        insightsDiscovered: results.length,
        timestamp: new Date()
      });

      // Wikidata SPARQL endpoint - FREE, no auth
      const cleanCompanyName = companyName.replace(/,?\s*(LLC|Inc\.?|Corp\.?|Corporation|Ltd\.?|Limited|Co\.?|Company)$/gi, '').trim();
      
      // SPARQL query for company information
      const sparqlQuery = `
        SELECT ?company ?companyLabel ?description ?inception ?hqLabel ?industryLabel ?ceo ?ceoLabel 
               ?employees ?revenue ?website ?stockExchange ?tickerSymbol ?parentLabel ?foundedByLabel
        WHERE {
          ?company rdfs:label "${cleanCompanyName}"@en .
          ?company wdt:P31/wdt:P279* wd:Q4830453 .  # instance of business/subclass
          
          OPTIONAL { ?company schema:description ?description . FILTER(LANG(?description) = "en") }
          OPTIONAL { ?company wdt:P571 ?inception . }
          OPTIONAL { ?company wdt:P159 ?hq . }
          OPTIONAL { ?company wdt:P452 ?industry . }
          OPTIONAL { ?company wdt:P169 ?ceo . }
          OPTIONAL { ?company wdt:P1128 ?employees . }
          OPTIONAL { ?company wdt:P2139 ?revenue . }
          OPTIONAL { ?company wdt:P856 ?website . }
          OPTIONAL { ?company wdt:P414 ?stockExchange . }
          OPTIONAL { ?company wdt:P249 ?tickerSymbol . }
          OPTIONAL { ?company wdt:P749 ?parent . }
          OPTIONAL { ?company wdt:P112 ?foundedBy . }
          
          SERVICE wikibase:label { bd:serviceParam wikibase:language "en" . }
        }
        LIMIT 5
      `;

      const wikidataUrl = `https://query.wikidata.org/sparql?query=${encodeURIComponent(sparqlQuery)}&format=json`;
      
      const wikiResponse = await axios.get(wikidataUrl, {
        timeout: 15000,
        headers: {
          'Accept': 'application/json',
          // Wikidata requires a descriptive User-Agent with contact info per their policy
          'User-Agent': 'ProspectPI/1.0 (https://prospectpi.com; research@prospectpi.com) axios/1.6'
        }
      });

      const bindings = wikiResponse.data?.results?.bindings || [];
      
      let companyData = null;
      if (bindings.length > 0) {
        const b = bindings[0];
        companyData = {
          wikidataId: b.company?.value?.split('/').pop(),
          name: b.companyLabel?.value,
          description: b.description?.value,
          founded: b.inception?.value,
          headquarters: b.hqLabel?.value,
          industry: b.industryLabel?.value,
          ceo: b.ceoLabel?.value,
          employees: b.employees?.value ? parseInt(b.employees.value) : null,
          revenue: b.revenue?.value ? parseFloat(b.revenue.value) : null,
          website: b.website?.value,
          stockExchange: b.stockExchangeLabel?.value,
          tickerSymbol: b.tickerSymbol?.value,
          parentCompany: b.parentLabel?.value,
          foundedBy: b.foundedByLabel?.value
        };
      }

      // Also try text search if exact match failed
      if (!companyData) {
        try {
          const searchUrl = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(cleanCompanyName)}&language=en&type=item&limit=5&format=json`;
          const searchResponse = await axios.get(searchUrl, { timeout: 10000 });
          
          const searchResults = (searchResponse.data?.search || []).filter((r: any) => 
            r.description?.toLowerCase().includes('company') || 
            r.description?.toLowerCase().includes('business') ||
            r.description?.toLowerCase().includes('corporation')
          );
          
          if (searchResults.length > 0) {
            companyData = {
              wikidataId: searchResults[0].id,
              name: searchResults[0].label,
              description: searchResults[0].description,
              searchMatch: true,
              alternativeMatches: searchResults.slice(1, 3).map((r: any) => ({
                id: r.id,
                label: r.label,
                description: r.description
              }))
            };
          }
        } catch (e) {
          // Search fallback failed
        }
      }

      console.log(`📚 Wikidata: ${companyData ? `Found "${companyData.name}"` : 'No match found'}`);

      results.push({
        source: 'wikidata' as any,
        data: {
          companyInfo: companyData,
          found: !!companyData,
          structuredData: companyData ? {
            hasFoundingDate: !!companyData.founded,
            hasHeadquarters: !!companyData.headquarters,
            hasIndustry: !!companyData.industry,
            hasCeo: !!companyData.ceo,
            hasEmployeeCount: !!companyData.employees,
            hasRevenue: !!companyData.revenue,
            isPublicCompany: !!companyData.stockExchange || !!companyData.tickerSymbol
          } : null
        },
        confidence: companyData ? 0.85 : 0.3,
        timestamp: new Date(),
        cost: 0 // FREE!
      });
    } catch (error: any) {
      console.warn(`⚠️ Wikidata query failed: ${error.message}`);
      results.push({
        source: 'wikidata' as any,
        data: { error: error.message, status: 'unavailable' },
        confidence: 0.0,
        timestamp: new Date(),
        cost: 0
      });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // TIER 1: HIGH-SIGNAL FREE SOURCES
    // ═══════════════════════════════════════════════════════════════════════

    // ═══════════════════════════════════════════════════════════════════════
    // COURTLISTENER: FREE - Litigation, legal risk, docket activity
    // API v4 with Token Authentication (5,000 req/hour)
    // Reference: https://www.courtlistener.com/api/rest/v4/
    // ═══════════════════════════════════════════════════════════════════════
    const courtlistenerToken = process.env.COURTLISTENER_TOKEN;
    if (courtlistenerToken) {
    try {
      await this.updateProgress({
        stage: 'researching',
        agent: 'researcher',
        message: `Searching CourtListener for ${companyName} litigation...`,
        confidence: 0.95,
        estimatedTimeRemaining: 3,
        userCanInterrupt: false,
        dataSourcesActive: ['courtlistener'],
        insightsDiscovered: results.length,
        timestamp: new Date()
      });

      const cleanCompanyName = companyName.replace(/,?\s*(LLC|Inc\.?|Corp\.?|Corporation|Ltd\.?|Limited|Co\.?|Company)$/gi, '').trim();
      
      // CourtListener v4 Search API with token auth
      // Search for dockets/cases mentioning the company
      const clSearchUrl = `https://www.courtlistener.com/api/rest/v4/search/?q=${encodeURIComponent(cleanCompanyName)}&type=o&order_by=dateFiled+desc`;
      
      const clResponse = await axios.get(clSearchUrl, {
        timeout: 15000,
        headers: {
          'Accept': 'application/json',
          'Authorization': `Token ${courtlistenerToken}`
        }
      });

      const cases = (clResponse.data?.results || []).slice(0, 15).map((c: any) => ({
        caseName: c.caseName,
        court: c.court,
        dateFiled: c.dateFiled,
        dateArgued: c.dateArgued,
        status: c.status,
        docketNumber: c.docketNumber,
        suitNature: c.suitNature,
        snippet: c.snippet?.replace(/<[^>]*>/g, '').substring(0, 300),
        absoluteUrl: c.absolute_url ? `https://www.courtlistener.com${c.absolute_url}` : null
      }));

      // Categorize litigation by type
      const litigationSignals = {
        patent: cases.filter((c: any) => /patent|intellectual property/i.test(c.caseName + ' ' + c.suitNature)).length,
        employment: cases.filter((c: any) => /employment|discrimination|wrongful/i.test(c.caseName + ' ' + c.suitNature)).length,
        contract: cases.filter((c: any) => /contract|breach|agreement/i.test(c.caseName + ' ' + c.suitNature)).length,
        securities: cases.filter((c: any) => /securities|fraud|investor/i.test(c.caseName + ' ' + c.suitNature)).length,
        antitrust: cases.filter((c: any) => /antitrust|monopoly|competition/i.test(c.caseName + ' ' + c.suitNature)).length
      };

      console.log(`⚖️ CourtListener: Found ${cases.length} cases`);

      results.push({
        source: 'courtlistener' as any,
        data: {
          cases: cases,
          totalResults: clResponse.data?.count || cases.length,
          litigationSignals: litigationSignals,
          hasLitigation: cases.length > 0,
          recentCases: cases.filter((c: any) => c.dateFiled && new Date(c.dateFiled) > new Date(Date.now() - 365*24*60*60*1000)).length,
          riskLevel: cases.length > 10 ? 'high' : cases.length > 3 ? 'moderate' : cases.length > 0 ? 'low' : 'minimal'
        },
        confidence: cases.length > 0 ? 0.85 : 0.5,
        timestamp: new Date(),
        cost: 0 // FREE!
      });
    } catch (error: any) {
      console.warn(`⚠️ CourtListener API failed: ${error.message}`);
      results.push({
        source: 'courtlistener' as any,
        data: { error: error.message, status: 'unavailable' },
        confidence: 0.0,
        timestamp: new Date(),
        cost: 0
      });
    }
    } else {
      console.log('⚠️ CourtListener skipped - No COURTLISTENER_TOKEN in .env');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // USASPENDING: FREE - Federal contract awards, grants, loans (revenue signal)
    // API v2: https://api.usaspending.gov/docs/endpoints
    // No authentication required! Award types: A,B,C,D=Contracts, 02-10=Grants
    // ═══════════════════════════════════════════════════════════════════════
    try {
      await this.updateProgress({
        stage: 'researching',
        agent: 'researcher',
        message: `Searching USAspending for ${companyName} federal awards...`,
        confidence: 0.95,
        estimatedTimeRemaining: 3,
        userCanInterrupt: false,
        dataSourcesActive: ['usaspending'],
        insightsDiscovered: results.length,
        timestamp: new Date()
      });

      const cleanCompanyName = companyName.replace(/,?\s*(LLC|Inc\.?|Corp\.?|Corporation|Ltd\.?|Limited|Co\.?|Company)$/gi, '').trim();
      
      // USAspending v2 API - search federal contracts and grants
      const usaSpendingUrl = `https://api.usaspending.gov/api/v2/search/spending_by_award/`;
      
      // Award type codes: A,B,C,D = Contracts, 02-10 = Grants, 06-09 = Loans
      const usaResponse = await axios.post(usaSpendingUrl, {
        filters: {
          recipient_search_text: [cleanCompanyName],
          time_period: [{ start_date: "2020-01-01", end_date: new Date().toISOString().split('T')[0] }],
          award_type_codes: ["A", "B", "C", "D", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11"]
        },
        fields: ["Award ID", "Recipient Name", "Award Amount", "Awarding Agency", "Award Type", "Start Date", "End Date", "Description"],
        limit: 20,
        page: 1
      }, {
        timeout: 15000,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      const awards = (usaResponse.data?.results || []).map((a: any) => ({
        awardId: a['Award ID'],
        recipientName: a['Recipient Name'],
        amount: a['Award Amount'],
        awardingAgency: a['Awarding Agency'],
        awardType: a['Award Type'],
        startDate: a['Start Date'],
        endDate: a['End Date'],
        description: a['Description']?.substring(0, 300)
      }));

      const totalAwardValue = awards.reduce((sum: number, a: any) => sum + (parseFloat(a.amount) || 0), 0);
      
      // Categorize by agency
      const agencyCounts = awards.reduce((acc: any, a: any) => {
        const agency = a.awardingAgency || 'Unknown';
        acc[agency] = (acc[agency] || 0) + 1;
        return acc;
      }, {});

      console.log(`💵 USAspending: Found ${awards.length} awards, total value: $${(totalAwardValue/1000000).toFixed(2)}M`);

      results.push({
        source: 'usaspending' as any,
        data: {
          awards: awards,
          totalAwards: usaResponse.data?.page_metadata?.total || awards.length,
          totalAwardValue: totalAwardValue,
          isGovContractor: awards.length > 0,
          topAgencies: Object.entries(agencyCounts).sort((a: any, b: any) => b[1] - a[1]).slice(0, 5),
          recentAwards: awards.filter((a: any) => a.startDate && new Date(a.startDate) > new Date(Date.now() - 365*24*60*60*1000)).length,
          governmentRevenue: totalAwardValue > 10000000 ? 'significant' : totalAwardValue > 1000000 ? 'moderate' : totalAwardValue > 0 ? 'minimal' : 'none'
        },
        confidence: awards.length > 0 ? 0.90 : 0.4,
        timestamp: new Date(),
        cost: 0 // FREE!
      });
    } catch (error: any) {
      console.warn(`⚠️ USAspending API failed: ${error.message}`);
      results.push({
        source: 'usaspending' as any,
        data: { error: error.message, status: 'unavailable' },
        confidence: 0.0,
        timestamp: new Date(),
        cost: 0
      });
    }

    // GDELT DOC API: FREE - Massive news/article monitoring
    // Reference: https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/
    try {
      await this.updateProgress({
        stage: 'researching',
        agent: 'researcher',
        message: `Searching GDELT for ${companyName} global media coverage...`,
        confidence: 0.95,
        estimatedTimeRemaining: 3,
        userCanInterrupt: false,
        dataSourcesActive: ['gdelt'],
        insightsDiscovered: results.length,
        timestamp: new Date()
      });

      const cleanCompanyName = companyName.replace(/,?\s*(LLC|Inc\.?|Corp\.?|Corporation|Ltd\.?|Limited|Co\.?|Company)$/gi, '').trim();
      
      // GDELT DOC 2.0 API - FREE, massive scale
      const gdeltUrl = `https://api.gdeltproject.org/api/v2/doc/doc?query="${encodeURIComponent(cleanCompanyName)}"&mode=artlist&maxrecords=50&format=json&sort=datedesc`;
      
      const gdeltResponse = await axios.get(gdeltUrl, {
        timeout: 20000,
        headers: {
          'Accept': 'application/json'
        }
      });

      const articles = (gdeltResponse.data?.articles || []).map((a: any) => ({
        title: a.title,
        url: a.url,
        urlMobile: a.urlmobile,
        seenDate: a.seendate,
        source: a.domain,
        sourceName: a.sourcecountry,
        language: a.language,
        socialImage: a.socialimage,
        tone: a.tone ? parseFloat(a.tone) : null
      }));

      // Analyze sentiment/tone distribution
      const tones = articles.filter((a: any) => a.tone !== null).map((a: any) => a.tone);
      const avgTone = tones.length > 0 ? tones.reduce((a: number, b: number) => a + b, 0) / tones.length : 0;
      
      // Source diversity
      const sourceCounts = articles.reduce((acc: any, a: any) => {
        acc[a.source] = (acc[a.source] || 0) + 1;
        return acc;
      }, {});
      const topSources = Object.entries(sourceCounts).sort((a: any, b: any) => b[1] - a[1]).slice(0, 10);

      // Language distribution (global reach signal)
      const langCounts = articles.reduce((acc: any, a: any) => {
        acc[a.language || 'en'] = (acc[a.language || 'en'] || 0) + 1;
        return acc;
      }, {});

      console.log(`🌐 GDELT: Found ${articles.length} articles, avg tone: ${avgTone.toFixed(2)}`);

      results.push({
        source: 'gdelt' as any,
        data: {
          articles: articles.slice(0, 25), // Keep top 25 for storage
          totalArticles: articles.length,
          sentiment: {
            averageTone: avgTone,
            positive: articles.filter((a: any) => a.tone > 1).length,
            negative: articles.filter((a: any) => a.tone < -1).length,
            neutral: articles.filter((a: any) => a.tone >= -1 && a.tone <= 1).length,
            overall: avgTone > 1 ? 'positive' : avgTone < -1 ? 'negative' : 'neutral'
          },
          mediaCoverage: {
            topSources: topSources,
            uniqueSources: Object.keys(sourceCounts).length,
            languageDistribution: langCounts,
            globalReach: Object.keys(langCounts).length > 3 ? 'global' : Object.keys(langCounts).length > 1 ? 'regional' : 'local'
          },
          recentHeadlines: articles.slice(0, 10).map((a: any) => a.title)
        },
        confidence: articles.length > 0 ? 0.85 : 0.4,
        timestamp: new Date(),
        cost: 0 // FREE!
      });
    } catch (error: any) {
      console.warn(`⚠️ GDELT API failed: ${error.message}`);
      results.push({
        source: 'gdelt' as any,
        data: { error: error.message, status: 'unavailable' },
        confidence: 0.0,
        timestamp: new Date(),
        cost: 0
      });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // TIER 2: ENTITY & REGULATORY SOURCES
    // ═══════════════════════════════════════════════════════════════════════

    // ═══════════════════════════════════════════════════════════════════════
    // OPENCORPORATES: DISABLED - Returns 401 (now requires API key)
    // Re-enable when API key is configured
    // ═══════════════════════════════════════════════════════════════════════
    if (false) { // DISABLED - OpenCorporates 401
    try {
      await this.updateProgress({
        stage: 'researching',
        agent: 'researcher',
        message: `Searching OpenCorporates for ${companyName} entity data...`,
        confidence: 0.95,
        estimatedTimeRemaining: 3,
        userCanInterrupt: false,
        dataSourcesActive: ['opencorporates'],
        insightsDiscovered: results.length,
        timestamp: new Date()
      });

      const cleanCompanyName = companyName.replace(/,?\s*(LLC|Inc\.?|Corp\.?|Corporation|Ltd\.?|Limited|Co\.?|Company)$/gi, '').trim();
      
      // OpenCorporates search - free tier (rate limited)
      const ocSearchUrl = `https://api.opencorporates.com/v0.4/companies/search?q=${encodeURIComponent(cleanCompanyName)}&format=json&per_page=10`;
      
      const ocResponse = await axios.get(ocSearchUrl, {
        timeout: 15000,
        headers: {
          'Accept': 'application/json'
        }
      });

      const companies = (ocResponse.data?.results?.companies || []).map((c: any) => ({
        name: c.company?.name,
        companyNumber: c.company?.company_number,
        jurisdiction: c.company?.jurisdiction_code,
        incorporationDate: c.company?.incorporation_date,
        companyType: c.company?.company_type,
        registryUrl: c.company?.registry_url,
        opencorporatesUrl: c.company?.opencorporates_url,
        currentStatus: c.company?.current_status,
        registeredAddress: c.company?.registered_address_in_full,
        agentName: c.company?.agent_name,
        officers: c.company?.officers?.slice(0, 5)
      }));

      // Analyze jurisdictions
      const jurisdictions = companies.map((c: any) => c.jurisdiction).filter(Boolean);
      const jurisdictionCounts = jurisdictions.reduce((acc: any, j: string) => {
        acc[j] = (acc[j] || 0) + 1;
        return acc;
      }, {});

      console.log(`🏢 OpenCorporates: Found ${companies.length} entities across ${Object.keys(jurisdictionCounts).length} jurisdictions`);

      results.push({
        source: 'opencorporates' as any,
        data: {
          companies: companies,
          totalResults: ocResponse.data?.results?.total_count || companies.length,
          jurisdictions: jurisdictionCounts,
          isMultiJurisdiction: Object.keys(jurisdictionCounts).length > 1,
          activeEntities: companies.filter((c: any) => c.currentStatus?.toLowerCase().includes('active')).length,
          entityTypes: [...new Set(companies.map((c: any) => c.companyType).filter(Boolean))]
        },
        confidence: companies.length > 0 ? 0.85 : 0.4,
        timestamp: new Date(),
        cost: 0 // FREE tier
      });
    } catch (error: any) {
      console.warn(`⚠️ OpenCorporates API failed: ${error.message}`);
      results.push({
        source: 'opencorporates' as any,
        data: { error: error.message, status: 'unavailable' },
        confidence: 0.0,
        timestamp: new Date(),
        cost: 0
      });
    }
    } // END DISABLED OPENCORPORATES

    // ═══════════════════════════════════════════════════════════════════════
    // UK COMPANIES HOUSE: DISABLED - Returns 401 (requires API key)
    // Get free key at: https://developer.company-information.service.gov.uk/
    // ═══════════════════════════════════════════════════════════════════════
    if (false) { // DISABLED - UK Companies House 401
    // UK Companies House API: FREE - UK entity filings and officer changes
    // Reference: https://developer.company-information.service.gov.uk/
    try {
      await this.updateProgress({
        stage: 'researching',
        agent: 'researcher',
        message: `Searching UK Companies House for ${companyName}...`,
        confidence: 0.95,
        estimatedTimeRemaining: 2,
        userCanInterrupt: false,
        dataSourcesActive: ['ukcompanieshouse'],
        insightsDiscovered: results.length,
        timestamp: new Date()
      });

      const cleanCompanyName = companyName.replace(/,?\s*(LLC|Inc\.?|Corp\.?|Corporation|Ltd\.?|Limited|Co\.?|Company)$/gi, '').trim();
      
      // UK Companies House search (basic search works without API key)
      const ukchSearchUrl = `https://api.company-information.service.gov.uk/search/companies?q=${encodeURIComponent(cleanCompanyName)}&items_per_page=10`;
      
      // Note: Full API requires API key, but basic search may work
      const ukchResponse = await axios.get(ukchSearchUrl, {
        timeout: 15000,
        headers: {
          'Accept': 'application/json'
        }
      });

      const ukCompanies = (ukchResponse.data?.items || []).map((c: any) => ({
        title: c.title,
        companyNumber: c.company_number,
        companyStatus: c.company_status,
        companyType: c.company_type,
        dateOfCreation: c.date_of_creation,
        registeredOfficeAddress: c.registered_office_address,
        snippet: c.snippet,
        addressSnippet: c.address_snippet
      }));

      console.log(`🇬🇧 UK Companies House: Found ${ukCompanies.length} UK entities`);

      results.push({
        source: 'ukcompanieshouse' as any,
        data: {
          companies: ukCompanies,
          totalResults: ukchResponse.data?.total_results || ukCompanies.length,
          hasUkPresence: ukCompanies.length > 0,
          activeUkEntities: ukCompanies.filter((c: any) => c.companyStatus === 'active').length,
          companyTypes: [...new Set(ukCompanies.map((c: any) => c.companyType).filter(Boolean))]
        },
        confidence: ukCompanies.length > 0 ? 0.85 : 0.3,
        timestamp: new Date(),
        cost: 0 // FREE!
      });
    } catch (error: any) {
      console.warn(`⚠️ UK Companies House API failed: ${error.message}`);
      results.push({
        source: 'ukcompanieshouse' as any,
        data: { error: error.message, status: 'unavailable', note: 'May require API key for full access' },
        confidence: 0.0,
        timestamp: new Date(),
        cost: 0
      });
    }
    } // END DISABLED UK COMPANIES HOUSE

    // NVD/NIST CVE API: FREE - Security vulnerabilities
    // Reference: https://nvd.nist.gov/developers/vulnerabilities
    try {
      await this.updateProgress({
        stage: 'researching',
        agent: 'researcher',
        message: `Searching NVD for ${companyName} security vulnerabilities...`,
        confidence: 0.95,
        estimatedTimeRemaining: 2,
        userCanInterrupt: false,
        dataSourcesActive: ['nvd-cve'],
        insightsDiscovered: results.length,
        timestamp: new Date()
      });

      const cleanCompanyName = companyName.replace(/,?\s*(LLC|Inc\.?|Corp\.?|Corporation|Ltd\.?|Limited|Co\.?|Company)$/gi, '').trim();
      
      // NVD CVE API 2.0 - FREE (rate limited)
      const nvdUrl = `https://services.nvd.nist.gov/rest/json/cves/2.0?keywordSearch=${encodeURIComponent(cleanCompanyName)}&resultsPerPage=20`;
      
      const nvdResponse = await axios.get(nvdUrl, {
        timeout: 20000,
        headers: {
          'Accept': 'application/json'
        }
      });

      const vulnerabilities = (nvdResponse.data?.vulnerabilities || []).map((v: any) => ({
        cveId: v.cve?.id,
        published: v.cve?.published,
        lastModified: v.cve?.lastModified,
        description: v.cve?.descriptions?.find((d: any) => d.lang === 'en')?.value?.substring(0, 300),
        severity: v.cve?.metrics?.cvssMetricV31?.[0]?.cvssData?.baseSeverity || 
                  v.cve?.metrics?.cvssMetricV30?.[0]?.cvssData?.baseSeverity ||
                  v.cve?.metrics?.cvssMetricV2?.[0]?.baseSeverity || 'UNKNOWN',
        baseScore: v.cve?.metrics?.cvssMetricV31?.[0]?.cvssData?.baseScore || 
                   v.cve?.metrics?.cvssMetricV30?.[0]?.cvssData?.baseScore ||
                   v.cve?.metrics?.cvssMetricV2?.[0]?.cvssData?.baseScore,
        exploitabilityScore: v.cve?.metrics?.cvssMetricV31?.[0]?.exploitabilityScore,
        references: v.cve?.references?.slice(0, 3).map((r: any) => r.url)
      }));

      // Severity distribution
      const severityCounts = vulnerabilities.reduce((acc: any, v: any) => {
        acc[v.severity] = (acc[v.severity] || 0) + 1;
        return acc;
      }, {});

      const criticalCount = severityCounts['CRITICAL'] || 0;
      const highCount = severityCounts['HIGH'] || 0;

      console.log(`🔒 NVD: Found ${vulnerabilities.length} CVEs (${criticalCount} critical, ${highCount} high)`);

      results.push({
        source: 'nvd-cve' as any,
        data: {
          vulnerabilities: vulnerabilities,
          totalResults: nvdResponse.data?.totalResults || vulnerabilities.length,
          severityDistribution: severityCounts,
          securityPosture: {
            criticalCount: criticalCount,
            highCount: highCount,
            recentVulns: vulnerabilities.filter((v: any) => v.published && new Date(v.published) > new Date(Date.now() - 365*24*60*60*1000)).length,
            riskLevel: criticalCount > 0 ? 'critical' : highCount > 3 ? 'high' : vulnerabilities.length > 0 ? 'moderate' : 'low'
          }
        },
        confidence: vulnerabilities.length > 0 ? 0.85 : 0.5,
        timestamp: new Date(),
        cost: 0 // FREE!
      });
    } catch (error: any) {
      console.warn(`⚠️ NVD CVE API failed: ${error.message}`);
      results.push({
        source: 'nvd-cve' as any,
        data: { error: error.message, status: 'unavailable' },
        confidence: 0.0,
        timestamp: new Date(),
        cost: 0
      });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // TIER 3: RESEARCH & ATTENTION SIGNALS
    // ═══════════════════════════════════════════════════════════════════════

    // OpenAlex API: FREE - Academic/research publications
    // Reference: https://docs.openalex.org/
    try {
      await this.updateProgress({
        stage: 'researching',
        agent: 'researcher',
        message: `Searching OpenAlex for ${companyName} research publications...`,
        confidence: 0.95,
        estimatedTimeRemaining: 2,
        userCanInterrupt: false,
        dataSourcesActive: ['openalex'],
        insightsDiscovered: results.length,
        timestamp: new Date()
      });

      const cleanCompanyName = companyName.replace(/,?\s*(LLC|Inc\.?|Corp\.?|Corporation|Ltd\.?|Limited|Co\.?|Company)$/gi, '').trim();
      
      // OpenAlex works search
      const oaUrl = `https://api.openalex.org/works?search=${encodeURIComponent(cleanCompanyName)}&per_page=20&sort=publication_date:desc`;
      
      const oaResponse = await axios.get(oaUrl, {
        timeout: 15000,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'ProspectPI (research@prospectpi.com)'
        }
      });

      const works = (oaResponse.data?.results || []).map((w: any) => ({
        title: w.title,
        doi: w.doi,
        publicationDate: w.publication_date,
        citationCount: w.cited_by_count,
        openAccess: w.open_access?.is_oa,
        type: w.type,
        primaryTopic: w.primary_topic?.display_name,
        concepts: w.concepts?.slice(0, 5).map((c: any) => c.display_name),
        authorships: w.authorships?.slice(0, 3).map((a: any) => ({
          name: a.author?.display_name,
          institution: a.institutions?.[0]?.display_name
        }))
      }));

      // Research topic analysis
      const allTopics = works.flatMap((w: any) => w.concepts || []);
      const topicCounts = allTopics.reduce((acc: any, t: string) => {
        acc[t] = (acc[t] || 0) + 1;
        return acc;
      }, {});
      const topTopics = Object.entries(topicCounts).sort((a: any, b: any) => b[1] - a[1]).slice(0, 10);

      const totalCitations = works.reduce((sum: number, w: any) => sum + (w.citationCount || 0), 0);

      console.log(`📚 OpenAlex: Found ${works.length} publications, ${totalCitations} total citations`);

      results.push({
        source: 'openalex' as any,
        data: {
          publications: works,
          totalResults: oaResponse.data?.meta?.count || works.length,
          researchSignals: {
            totalCitations: totalCitations,
            avgCitations: works.length > 0 ? Math.round(totalCitations / works.length) : 0,
            recentPubs: works.filter((w: any) => w.publicationDate && new Date(w.publicationDate) > new Date(Date.now() - 365*24*60*60*1000)).length,
            topTopics: topTopics,
            openAccessRatio: works.filter((w: any) => w.openAccess).length / Math.max(works.length, 1)
          },
          academicPresence: works.length > 10 ? 'strong' : works.length > 0 ? 'moderate' : 'minimal'
        },
        confidence: works.length > 0 ? 0.80 : 0.4,
        timestamp: new Date(),
        cost: 0 // FREE!
      });
    } catch (error: any) {
      console.warn(`⚠️ OpenAlex API failed: ${error.message}`);
      results.push({
        source: 'openalex' as any,
        data: { error: error.message, status: 'unavailable' },
        confidence: 0.0,
        timestamp: new Date(),
        cost: 0
      });
    }

    // Federal Register API: FREE - US regulatory actions
    // Reference: https://www.federalregister.gov/developers/documentation/api/v1
    try {
      await this.updateProgress({
        stage: 'researching',
        agent: 'researcher',
        message: `Searching Federal Register for ${companyName} regulatory mentions...`,
        confidence: 0.95,
        estimatedTimeRemaining: 2,
        userCanInterrupt: false,
        dataSourcesActive: ['federalregister'],
        insightsDiscovered: results.length,
        timestamp: new Date()
      });

      const cleanCompanyName = companyName.replace(/,?\s*(LLC|Inc\.?|Corp\.?|Corporation|Ltd\.?|Limited|Co\.?|Company)$/gi, '').trim();
      
      // Federal Register API - FREE
      const frUrl = `https://www.federalregister.gov/api/v1/documents.json?conditions[term]="${encodeURIComponent(cleanCompanyName)}"&per_page=20&order=newest`;
      
      const frResponse = await axios.get(frUrl, {
        timeout: 15000,
        headers: {
          'Accept': 'application/json'
        }
      });

      const documents = (frResponse.data?.results || []).map((d: any) => ({
        title: d.title,
        type: d.type,
        documentNumber: d.document_number,
        publicationDate: d.publication_date,
        agencies: d.agencies?.map((a: any) => a.name),
        abstract: d.abstract?.substring(0, 300),
        htmlUrl: d.html_url,
        pdfUrl: d.pdf_url,
        significantDocument: d.significant,
        cfr_references: d.cfr_references
      }));

      // Categorize by document type
      const typeCounts = documents.reduce((acc: any, d: any) => {
        acc[d.type] = (acc[d.type] || 0) + 1;
        return acc;
      }, {});

      // Agency analysis
      const allAgencies = documents.flatMap((d: any) => d.agencies || []);
      const agencyCounts = allAgencies.reduce((acc: any, a: string) => {
        acc[a] = (acc[a] || 0) + 1;
        return acc;
      }, {});

      console.log(`📋 Federal Register: Found ${documents.length} regulatory documents`);

      results.push({
        source: 'federalregister' as any,
        data: {
          documents: documents,
          totalResults: frResponse.data?.count || documents.length,
          regulatorySignals: {
            documentTypes: typeCounts,
            topAgencies: Object.entries(agencyCounts).sort((a: any, b: any) => b[1] - a[1]).slice(0, 5),
            significantDocs: documents.filter((d: any) => d.significantDocument).length,
            recentDocs: documents.filter((d: any) => d.publicationDate && new Date(d.publicationDate) > new Date(Date.now() - 365*24*60*60*1000)).length
          },
          regulatoryExposure: documents.length > 10 ? 'high' : documents.length > 3 ? 'moderate' : documents.length > 0 ? 'low' : 'minimal'
        },
        confidence: documents.length > 0 ? 0.80 : 0.4,
        timestamp: new Date(),
        cost: 0 // FREE!
      });
    } catch (error: any) {
      console.warn(`⚠️ Federal Register API failed: ${error.message}`);
      results.push({
        source: 'federalregister' as any,
        data: { error: error.message, status: 'unavailable' },
        confidence: 0.0,
        timestamp: new Date(),
        cost: 0
      });
    }

    // Wikimedia Pageviews API: FREE - Attention/interest spikes
    // Reference: https://wikitech.wikimedia.org/wiki/Analytics/AQS/Pageviews
    try {
      await this.updateProgress({
        stage: 'researching',
        agent: 'researcher',
        message: `Fetching Wikipedia pageviews for ${companyName}...`,
        confidence: 0.95,
        estimatedTimeRemaining: 1,
        userCanInterrupt: false,
        dataSourcesActive: ['wikimedia-pageviews'],
        insightsDiscovered: results.length,
        timestamp: new Date()
      });

      const cleanCompanyName = companyName.replace(/,?\s*(LLC|Inc\.?|Corp\.?|Corporation|Ltd\.?|Limited|Co\.?|Company)$/gi, '').trim();
      const wikiTitle = cleanCompanyName.replace(/\s+/g, '_');
      
      // Get last 90 days of pageviews
      const endDate = new Date();
      const startDate = new Date(Date.now() - 90*24*60*60*1000);
      const formatDate = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, '');
      
      const pvUrl = `https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/en.wikipedia/all-access/all-agents/${encodeURIComponent(wikiTitle)}/daily/${formatDate(startDate)}/${formatDate(endDate)}`;
      
      const pvResponse = await axios.get(pvUrl, {
        timeout: 10000,
        headers: {
          'Accept': 'application/json',
          // Wikimedia REST API requires descriptive User-Agent per their policy
          'User-Agent': 'ProspectPI/1.0 (https://prospectpi.com; research@prospectpi.com) axios/1.6',
          'Api-User-Agent': 'ProspectPI/1.0 (research@prospectpi.com)'
        }
      });

      const pageviews = (pvResponse.data?.items || []).map((p: any) => ({
        date: p.timestamp,
        views: p.views
      }));

      const totalViews = pageviews.reduce((sum: number, p: any) => sum + p.views, 0);
      const avgViews = pageviews.length > 0 ? Math.round(totalViews / pageviews.length) : 0;
      
      // Detect spikes (views > 2x average)
      const spikes = pageviews.filter((p: any) => p.views > avgViews * 2);
      
      // Calculate trend (compare last 30 days to previous 30 days)
      const recentViews = pageviews.slice(-30).reduce((sum: number, p: any) => sum + p.views, 0);
      const olderViews = pageviews.slice(-60, -30).reduce((sum: number, p: any) => sum + p.views, 0);
      const trend = olderViews > 0 ? ((recentViews - olderViews) / olderViews * 100).toFixed(1) : 0;

      console.log(`📈 Wikimedia: ${totalViews} pageviews (90 days), ${spikes.length} spikes, ${trend}% trend`);

      results.push({
        source: 'wikimedia-pageviews' as any,
        data: {
          pageviews: pageviews.slice(-30), // Last 30 days for storage
          wikiTitle: wikiTitle,
          attentionSignals: {
            totalViews90d: totalViews,
            averageDailyViews: avgViews,
            spikeCount: spikes.length,
            spikeDates: spikes.slice(0, 5).map((s: any) => s.date),
            trend30d: parseFloat(trend as string),
            peakViews: Math.max(...pageviews.map((p: any) => p.views), 0)
          },
          publicInterest: avgViews > 1000 ? 'high' : avgViews > 100 ? 'moderate' : avgViews > 0 ? 'low' : 'minimal'
        },
        confidence: pageviews.length > 0 ? 0.80 : 0.3,
        timestamp: new Date(),
        cost: 0 // FREE!
      });
    } catch (error: any) {
      console.warn(`⚠️ Wikimedia Pageviews API failed: ${error.message}`);
      results.push({
        source: 'wikimedia-pageviews' as any,
        data: { error: error.message, status: 'unavailable', note: 'Company may not have Wikipedia article' },
        confidence: 0.0,
        timestamp: new Date(),
        cost: 0
      });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // TIER 4: PRESS RELEASES & ANNOUNCEMENTS (FREE RSS)
    // ═══════════════════════════════════════════════════════════════════════

    // PR Newswire RSS: FREE - Company press releases
    // Reference: https://www.prnewswire.com/rss/
    try {
      await this.updateProgress({
        stage: 'researching',
        agent: 'researcher',
        message: `Searching PR Newswire for ${companyName} press releases...`,
        confidence: 0.96,
        estimatedTimeRemaining: 2,
        userCanInterrupt: false,
        dataSourcesActive: ['prnewswire'],
        insightsDiscovered: results.length,
        timestamp: new Date()
      });

      const cleanCompanyName = companyName.replace(/,?\s*(LLC|Inc\.?|Corp\.?|Corporation|Ltd\.?|Limited|Co\.?|Company)$/gi, '').trim();
      
      // PR Newswire search RSS - general news feed filtered client-side
      const prnUrl = `https://www.prnewswire.com/rss/news-releases-list.rss`;
      
      const prnResponse = await axios.get(prnUrl, {
        timeout: 15000,
        headers: {
          'Accept': 'application/rss+xml, application/xml, text/xml',
          'User-Agent': 'Mozilla/5.0 ProspectPI Research Bot'
        }
      });

      const prnXml = prnResponse.data;
      const itemMatches = prnXml.match(/<item>[\s\S]*?<\/item>/gi) || [];
      
      const pressReleases = itemMatches
        .map((item: string) => {
          const title = this.extractXmlTag(item, 'title') || '';
          const description = this.extractXmlTag(item, 'description') || '';
          const link = this.extractXmlTag(item, 'link') || '';
          const pubDate = this.extractXmlTag(item, 'pubDate') || '';
          
          return {
            title: this.decodeHtmlEntities(title),
            description: this.decodeHtmlEntities(description).substring(0, 300),
            link,
            pubDate,
            source: 'PR Newswire'
          };
        })
        .filter((pr: any) => {
          const searchTerms = cleanCompanyName.toLowerCase().split(/\s+/);
          const content = `${pr.title} ${pr.description}`.toLowerCase();
          return searchTerms.some(term => term.length > 3 && content.includes(term));
        })
        .slice(0, 10);

      console.log(`📰 PR Newswire: Found ${pressReleases.length} press releases`);

      results.push({
        source: 'prnewswire' as any,
        data: {
          pressReleases: pressReleases,
          totalFound: pressReleases.length,
          prActivity: pressReleases.length > 5 ? 'high' : pressReleases.length > 0 ? 'moderate' : 'none'
        },
        confidence: pressReleases.length > 0 ? 0.85 : 0.3,
        timestamp: new Date(),
        cost: 0 // FREE RSS!
      });
    } catch (error: any) {
      console.warn(`⚠️ PR Newswire RSS failed: ${error.message}`);
      results.push({
        source: 'prnewswire' as any,
        data: { error: error.message, status: 'unavailable' },
        confidence: 0.0,
        timestamp: new Date(),
        cost: 0
      });
    }

    // Business Wire RSS: FREE - Company announcements
    // Reference: https://www.businesswire.com/help/feed-options
    try {
      await this.updateProgress({
        stage: 'researching',
        agent: 'researcher',
        message: `Searching Business Wire for ${companyName} announcements...`,
        confidence: 0.96,
        estimatedTimeRemaining: 2,
        userCanInterrupt: false,
        dataSourcesActive: ['businesswire'],
        insightsDiscovered: results.length,
        timestamp: new Date()
      });

      const cleanCompanyName = companyName.replace(/,?\s*(LLC|Inc\.?|Corp\.?|Corporation|Ltd\.?|Limited|Co\.?|Company)$/gi, '').trim();
      
      // Business Wire all news RSS
      const bwUrl = `https://feed.businesswire.com/rss/home/?rss=G1QFDERJXkJeEFpRWQ==`;
      
      const bwResponse = await axios.get(bwUrl, {
        timeout: 15000,
        headers: {
          'Accept': 'application/rss+xml, application/xml, text/xml',
          'User-Agent': 'Mozilla/5.0 ProspectPI Research Bot'
        }
      });

      const bwXml = bwResponse.data;
      const bwItemMatches = bwXml.match(/<item>[\s\S]*?<\/item>/gi) || [];
      
      const bwReleases = bwItemMatches
        .map((item: string) => {
          const title = this.extractXmlTag(item, 'title') || '';
          const description = this.extractXmlTag(item, 'description') || '';
          const link = this.extractXmlTag(item, 'link') || '';
          const pubDate = this.extractXmlTag(item, 'pubDate') || '';
          
          return {
            title: this.decodeHtmlEntities(title),
            description: this.decodeHtmlEntities(description).substring(0, 300),
            link,
            pubDate,
            source: 'Business Wire'
          };
        })
        .filter((pr: any) => {
          const searchTerms = cleanCompanyName.toLowerCase().split(/\s+/);
          const content = `${pr.title} ${pr.description}`.toLowerCase();
          return searchTerms.some(term => term.length > 3 && content.includes(term));
        })
        .slice(0, 10);

      console.log(`📰 Business Wire: Found ${bwReleases.length} press releases`);

      results.push({
        source: 'businesswire' as any,
        data: {
          pressReleases: bwReleases,
          totalFound: bwReleases.length,
          prActivity: bwReleases.length > 5 ? 'high' : bwReleases.length > 0 ? 'moderate' : 'none'
        },
        confidence: bwReleases.length > 0 ? 0.85 : 0.3,
        timestamp: new Date(),
        cost: 0 // FREE RSS!
      });
    } catch (error: any) {
      console.warn(`⚠️ Business Wire RSS failed: ${error.message}`);
      results.push({
        source: 'businesswire' as any,
        data: { error: error.message, status: 'unavailable' },
        confidence: 0.0,
        timestamp: new Date(),
        cost: 0
      });
    }

    // GlobeNewswire RSS: FREE - Corporate news
    // Reference: https://www.globenewswire.com/rss/list
    try {
      await this.updateProgress({
        stage: 'researching',
        agent: 'researcher',
        message: `Searching GlobeNewswire for ${companyName} news...`,
        confidence: 0.96,
        estimatedTimeRemaining: 1,
        userCanInterrupt: false,
        dataSourcesActive: ['globenewswire'],
        insightsDiscovered: results.length,
        timestamp: new Date()
      });

      const cleanCompanyName = companyName.replace(/,?\s*(LLC|Inc\.?|Corp\.?|Corporation|Ltd\.?|Limited|Co\.?|Company)$/gi, '').trim();
      
      // GlobeNewswire RSS - use their main news feed
      // Reference: https://www.globenewswire.com/Rss/List
      const gnUrl = `https://www.globenewswire.com/RssFeed/orgclass/1-Company-News/feedTitle/GlobeNewswire%20-%20Company%20News`;
      
      const gnResponse = await axios.get(gnUrl, {
        timeout: 15000,
        headers: {
          'Accept': 'application/rss+xml, application/xml, text/xml, */*',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });

      const gnXml = gnResponse.data;
      const gnItemMatches = gnXml.match(/<item>[\s\S]*?<\/item>/gi) || [];
      
      const gnReleases = gnItemMatches
        .map((item: string) => {
          const title = this.extractXmlTag(item, 'title') || '';
          const description = this.extractXmlTag(item, 'description') || '';
          const link = this.extractXmlTag(item, 'link') || '';
          const pubDate = this.extractXmlTag(item, 'pubDate') || '';
          
          return {
            title: this.decodeHtmlEntities(title),
            description: this.decodeHtmlEntities(description).substring(0, 300),
            link,
            pubDate,
            source: 'GlobeNewswire'
          };
        })
        .filter((pr: any) => {
          const searchTerms = cleanCompanyName.toLowerCase().split(/\s+/);
          const content = `${pr.title} ${pr.description}`.toLowerCase();
          return searchTerms.some(term => term.length > 3 && content.includes(term));
        })
        .slice(0, 10);

      console.log(`📰 GlobeNewswire: Found ${gnReleases.length} press releases`);

      results.push({
        source: 'globenewswire' as any,
        data: {
          pressReleases: gnReleases,
          totalFound: gnReleases.length,
          prActivity: gnReleases.length > 5 ? 'high' : gnReleases.length > 0 ? 'moderate' : 'none'
        },
        confidence: gnReleases.length > 0 ? 0.85 : 0.3,
        timestamp: new Date(),
        cost: 0 // FREE RSS!
      });
    } catch (error: any) {
      console.warn(`⚠️ GlobeNewswire RSS failed: ${error.message}`);
      results.push({
        source: 'globenewswire' as any,
        data: { error: error.message, status: 'unavailable' },
        confidence: 0.0,
        timestamp: new Date(),
        cost: 0
      });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // FREE TECHNOGRAPHICS DETECTION SOURCES
    // These replace TheirStack with $0 cost alternatives
    // ═══════════════════════════════════════════════════════════════════════

    // 1. Greenhouse Jobs API: FREE - Public job board API
    // Reference: https://developers.greenhouse.io/job-board.html
    // "Authentication is not required for Job Board endpoints"
    try {
      await this.updateProgress({
        stage: 'researching',
        agent: 'researcher',
        message: `Searching Greenhouse job boards for ${companyName} tech stack clues...`,
        confidence: 0.91,
        estimatedTimeRemaining: 8,
        userCanInterrupt: false,
        dataSourcesActive: ['greenhouse-jobs'],
        insightsDiscovered: results.length,
        timestamp: new Date()
      });

      // Try company name as board token (common pattern)
      const boardToken = companyName.toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .replace(/inc|llc|corp|ltd|limited|company|co$/gi, '');
      
      const greenhouseUrl = `https://boards-api.greenhouse.io/v1/boards/${boardToken}/jobs`;
      
      const ghResponse = await axios.get(greenhouseUrl, {
        timeout: 8000,
        headers: {
          'User-Agent': 'ProspectPI/1.0 (Business Intelligence Research)',
          'Accept': 'application/json'
        },
        validateStatus: (status) => status < 500 // Allow 404s gracefully
      });

      const ghJobs = ghResponse.data?.jobs || [];
      
      // Extract tech signals from job titles and departments
      const techSignals = this.extractTechFromJobs(ghJobs);
      
      console.log(`🌱 Greenhouse Jobs: Found ${ghJobs.length} jobs, ${techSignals.detectedTechs.length} tech signals`);

      results.push({
        source: 'greenhouse-jobs' as any,
        data: {
          totalJobs: ghJobs.length,
          jobs: ghJobs.slice(0, 15).map((j: any) => ({
            title: j.title,
            location: j.location?.name,
            department: j.departments?.[0]?.name,
            updatedAt: j.updated_at
          })),
          detectedTechnologies: techSignals.detectedTechs,
          hiringDepartments: techSignals.departments,
          techCategories: techSignals.categories,
          boardToken: boardToken
        },
        confidence: ghJobs.length > 0 ? 0.85 : 0.2,
        timestamp: new Date(),
        cost: 0 // FREE!
      });
    } catch (error: any) {
      console.warn(`⚠️ Greenhouse Jobs failed: ${error.message}`);
      results.push({
        source: 'greenhouse-jobs' as any,
        data: { error: error.message, status: 'unavailable' },
        confidence: 0.0,
        timestamp: new Date(),
        cost: 0
      });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // LEVER JOBS: DISABLED - API appears deprecated (returns 404 for all companies)
    // Greenhouse Jobs still works for job-based tech detection
    // ═══════════════════════════════════════════════════════════════════════
    if (false) { // DISABLED - Lever API deprecated
    try {
      await this.updateProgress({
        stage: 'researching',
        agent: 'researcher',
        message: `Searching Lever job boards for ${companyName} tech stack clues...`,
        confidence: 0.92,
        estimatedTimeRemaining: 7,
        userCanInterrupt: false,
        dataSourcesActive: ['lever-jobs'],
        insightsDiscovered: results.length,
        timestamp: new Date()
      });

      const leverSite = companyName.toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .replace(/inc|llc|corp|ltd|limited|company|co$/gi, '');
      
      const leverUrl = `https://api.lever.co/v0/postings/${leverSite}`;
      
      const leverResponse = await axios.get(leverUrl, {
        timeout: 15000, // Increased timeout - Lever API can be slow
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ProspectPI/1.0; +https://prospectpi.com)',
          'Accept': 'application/json'
        },
        validateStatus: (status) => status < 500
      });

      const leverJobs = Array.isArray(leverResponse.data) ? leverResponse.data : [];
      
      // Extract tech signals from job content
      const leverTechSignals = this.extractTechFromLeverJobs(leverJobs);
      
      console.log(`🎯 Lever Jobs: Found ${leverJobs.length} jobs, ${leverTechSignals.detectedTechs.length} tech signals`);

      results.push({
        source: 'lever-jobs' as any,
        data: {
          totalJobs: leverJobs.length,
          jobs: leverJobs.slice(0, 15).map((j: any) => ({
            title: j.text,
            location: j.categories?.location,
            team: j.categories?.team,
            department: j.categories?.department,
            commitment: j.categories?.commitment
          })),
          detectedTechnologies: leverTechSignals.detectedTechs,
          teams: leverTechSignals.teams,
          techCategories: leverTechSignals.categories,
          leverSite: leverSite
        },
        confidence: leverJobs.length > 0 ? 0.85 : 0.2,
        timestamp: new Date(),
        cost: 0 // FREE!
      });
    } catch (error: any) {
      console.warn(`⚠️ Lever Jobs failed: ${error.message}`);
      results.push({
        source: 'lever-jobs' as any,
        data: { error: error.message, status: 'unavailable' },
        confidence: 0.0,
        timestamp: new Date(),
        cost: 0
      });
    }
    } // END DISABLED LEVER JOBS

    // 3. Web Fingerprint: FREE - Detect technologies from website scripts/headers
    // Uses Wappalyzer-style detection patterns from our tech taxonomy
    try {
      await this.updateProgress({
        stage: 'researching',
        agent: 'researcher',
        message: `Fingerprinting ${companyName} website for technology stack...`,
        confidence: 0.93,
        estimatedTimeRemaining: 6,
        userCanInterrupt: false,
        dataSourcesActive: ['web-fingerprint'],
        insightsDiscovered: results.length,
        timestamp: new Date()
      });

      // Try to determine company domain
      const domain = companyName.toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .replace(/inc|llc|corp|ltd|limited|company|co$/gi, '') + '.com';
      
      const webUrl = `https://${domain}`;
      
      const webResponse = await axios.get(webUrl, {
        timeout: 12000,
        headers: {
          // Full browser-like headers to avoid 403 blocks
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Cache-Control': 'max-age=0'
        },
        maxRedirects: 5,
        validateStatus: (status) => status < 500
      });

      const html = webResponse.data || '';
      const headers = webResponse.headers || {};
      
      // Detect technologies from HTML and headers
      const webTech = this.detectWebTechnologies(html, headers);
      
      console.log(`🔍 Web Fingerprint: Detected ${webTech.technologies.length} technologies on ${domain}`);

      results.push({
        source: 'web-fingerprint' as any,
        data: {
          domain: domain,
          technologies: webTech.technologies,
          scripts: webTech.scripts.slice(0, 20),
          cdnProviders: webTech.cdns,
          serverHeader: headers['server'],
          poweredBy: headers['x-powered-by'],
          detectedFrameworks: webTech.frameworks,
          analyticsTools: webTech.analytics,
          marketingTools: webTech.marketing,
          tier1Techs: webTech.tier1
        },
        confidence: webTech.technologies.length > 0 ? 0.90 : 0.2,
        timestamp: new Date(),
        cost: 0 // FREE!
      });
    } catch (error: any) {
      console.warn(`⚠️ Web Fingerprint failed: ${error.message}`);
      results.push({
        source: 'web-fingerprint' as any,
        data: { error: error.message, status: 'unavailable' },
        confidence: 0.0,
        timestamp: new Date(),
        cost: 0
      });
    }

    // 4. Cloud Attribution: FREE - Detect cloud provider from DNS/IP
    // Reference: AWS/Azure/GCP publish their IP ranges for this purpose
    try {
      await this.updateProgress({
        stage: 'researching',
        agent: 'researcher',
        message: `Analyzing ${companyName} cloud infrastructure...`,
        confidence: 0.94,
        estimatedTimeRemaining: 5,
        userCanInterrupt: false,
        dataSourcesActive: ['cloud-attribution'],
        insightsDiscovered: results.length,
        timestamp: new Date()
      });

      const domain = companyName.toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .replace(/inc|llc|corp|ltd|limited|company|co$/gi, '') + '.com';
      
      // Use DNS over HTTPS for CNAME lookup (free, no library needed)
      const dnsUrl = `https://dns.google/resolve?name=${domain}&type=CNAME`;
      
      const dnsResponse = await axios.get(dnsUrl, {
        timeout: 5000,
        headers: { 'Accept': 'application/dns-json' },
        validateStatus: (status) => status < 500
      });

      const dnsData = dnsResponse.data || {};
      const answers = dnsData.Answer || [];
      
      // Detect cloud providers from CNAME patterns
      const cloudAttribution = this.detectCloudProviders(answers, domain);
      
      console.log(`☁️ Cloud Attribution: ${cloudAttribution.primaryProvider || 'Unknown'} (${cloudAttribution.signals.length} signals)`);

      results.push({
        source: 'cloud-attribution' as any,
        data: {
          domain: domain,
          primaryProvider: cloudAttribution.primaryProvider,
          providers: cloudAttribution.providers,
          cdnProvider: cloudAttribution.cdn,
          dnsRecords: answers.slice(0, 5),
          signals: cloudAttribution.signals,
          tier1Cloud: cloudAttribution.tier1
        },
        confidence: cloudAttribution.primaryProvider ? 0.90 : 0.3,
        timestamp: new Date(),
        cost: 0 // FREE!
      });
    } catch (error: any) {
      console.warn(`⚠️ Cloud Attribution failed: ${error.message}`);
      results.push({
        source: 'cloud-attribution' as any,
        data: { error: error.message, status: 'unavailable' },
        confidence: 0.0,
        timestamp: new Date(),
        cost: 0
      });
    }

    await this.updateProgress({
      stage: 'researching',
      agent: 'researcher',
      message: `Intelligence gathered from ${results.filter(r => r.confidence > 0).length}/30 sources`,
      confidence: 0.95,
      estimatedTimeRemaining: 10,
      userCanInterrupt: false,
      dataSourcesActive: [],
      insightsDiscovered: results.length,
      timestamp: new Date()
    });

    return results;
  }

  // Helper: Analyze headline sentiment (simple keyword-based)
  private analyzeHeadlineSentiment(headline: string): 'positive' | 'negative' | 'neutral' {
    const positiveWords = /growth|success|win|partner|expand|launch|innovat|lead|award|record|strong/i;
    const negativeWords = /layoff|cut|loss|fail|struggle|decline|lawsuit|breach|hack|controversy/i;
    
    if (positiveWords.test(headline)) return 'positive';
    if (negativeWords.test(headline)) return 'negative';
    return 'neutral';
  }

  // Helper: Calculate overall news sentiment
  private calculateOverallSentiment(articles: any[]): { positive: number; negative: number; neutral: number; overall: string } {
    const counts = { positive: 0, negative: 0, neutral: 0 };
    articles.forEach(a => counts[a.sentiment as keyof typeof counts]++);
    
    const total = articles.length || 1;
    const overall = counts.positive > counts.negative ? 'positive' : 
                   counts.negative > counts.positive ? 'negative' : 'neutral';
    
    return {
      positive: Math.round((counts.positive / total) * 100),
      negative: Math.round((counts.negative / total) * 100),
      neutral: Math.round((counts.neutral / total) * 100),
      overall
    };
  }

  // Helper: Extract content from XML tag (simple regex-based for RSS parsing)
  private extractXmlTag(xml: string, tagName: string): string | null {
    // Handle CDATA sections: <![CDATA[content]]>
    const cdataPattern = new RegExp(`<${tagName}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tagName}>`, 'i');
    const cdataMatch = xml.match(cdataPattern);
    if (cdataMatch) return cdataMatch[1].trim();
    
    // Handle regular tags
    const pattern = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i');
    const match = xml.match(pattern);
    return match ? match[1].trim() : null;
  }

  // Helper: Decode HTML entities in RSS content
  private decodeHtmlEntities(text: string): string {
    return text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/&#x27;/g, "'")
      .replace(/&#x2F;/g, '/')
      .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num, 10)));
  }

  // ═══════════════════════════════════════════════════════════════════════
  // TECHNOGRAPHICS DETECTION HELPERS
  // Free replacement for TheirStack using job boards + web fingerprinting
  // ═══════════════════════════════════════════════════════════════════════

  // Helper: Extract tech signals from Greenhouse job postings
  private extractTechFromJobs(jobs: any[]): { 
    detectedTechs: string[]; 
    departments: string[];
    categories: { [key: string]: string[] } 
  } {
    const techPatterns: { [key: string]: RegExp } = {
      // Cloud
      'AWS': /\b(AWS|Amazon Web Services|EC2|S3|Lambda|EKS|ECS|CloudFormation)\b/i,
      'Azure': /\b(Azure|Microsoft Azure|AKS|Azure DevOps)\b/i,
      'GCP': /\b(GCP|Google Cloud|BigQuery|Cloud Run|GKE)\b/i,
      // DevOps
      'Kubernetes': /\b(Kubernetes|K8s|Helm|kubectl)\b/i,
      'Docker': /\b(Docker|Container|Dockerfile)\b/i,
      'Terraform': /\b(Terraform|IaC|Infrastructure as Code)\b/i,
      'Jenkins': /\b(Jenkins|CI\/CD)\b/i,
      'GitHub': /\b(GitHub|GitHub Actions)\b/i,
      'GitLab': /\b(GitLab|GitLab CI)\b/i,
      // Data
      'Snowflake': /\b(Snowflake)\b/i,
      'Databricks': /\b(Databricks|Delta Lake|Spark)\b/i,
      'PostgreSQL': /\b(PostgreSQL|Postgres)\b/i,
      'MongoDB': /\b(MongoDB|Mongo)\b/i,
      'Redis': /\b(Redis)\b/i,
      'Kafka': /\b(Kafka|Confluent)\b/i,
      'Elasticsearch': /\b(Elasticsearch|ELK|Elastic)\b/i,
      // Observability
      'Datadog': /\b(Datadog)\b/i,
      'Splunk': /\b(Splunk)\b/i,
      'New Relic': /\b(New Relic)\b/i,
      'Prometheus': /\b(Prometheus|Grafana)\b/i,
      'PagerDuty': /\b(PagerDuty)\b/i,
      // Languages/Frameworks
      'Python': /\b(Python|Django|Flask|FastAPI)\b/i,
      'JavaScript/TypeScript': /\b(JavaScript|TypeScript|Node\.js|React|Angular|Vue)\b/i,
      'Java': /\b(Java|Spring|Spring Boot)\b/i,
      'Go': /\b(Go|Golang)\b/i,
      'Rust': /\b(Rust)\b/i,
      // Identity
      'Okta': /\b(Okta|SSO|SAML)\b/i,
      'Auth0': /\b(Auth0)\b/i,
      // Security
      'CrowdStrike': /\b(CrowdStrike|Falcon)\b/i,
      // Business Apps
      'Salesforce': /\b(Salesforce|SFDC|Apex)\b/i,
      'HubSpot': /\b(HubSpot)\b/i,
      'ServiceNow': /\b(ServiceNow)\b/i,
      'Workday': /\b(Workday)\b/i,
      'SAP': /\b(SAP|S\/4HANA)\b/i
    };

    const detectedTechs: Set<string> = new Set();
    const departments: Set<string> = new Set();
    const categories: { [key: string]: Set<string> } = {
      cloud: new Set(),
      devops: new Set(),
      data: new Set(),
      observability: new Set(),
      languages: new Set(),
      security: new Set(),
      business: new Set()
    };

    for (const job of jobs) {
      const text = `${job.title || ''} ${job.departments?.[0]?.name || ''} ${job.content || ''}`;
      
      if (job.departments?.[0]?.name) {
        departments.add(job.departments[0].name);
      }

      for (const [tech, pattern] of Object.entries(techPatterns)) {
        if (pattern.test(text)) {
          detectedTechs.add(tech);
          // Categorize
          if (/AWS|Azure|GCP/.test(tech)) categories.cloud.add(tech);
          else if (/Kubernetes|Docker|Terraform|Jenkins|GitHub|GitLab/.test(tech)) categories.devops.add(tech);
          else if (/Snowflake|Databricks|PostgreSQL|MongoDB|Redis|Kafka|Elasticsearch/.test(tech)) categories.data.add(tech);
          else if (/Datadog|Splunk|New Relic|Prometheus|PagerDuty/.test(tech)) categories.observability.add(tech);
          else if (/Python|JavaScript|Java|Go|Rust/.test(tech)) categories.languages.add(tech);
          else if (/Okta|Auth0|CrowdStrike/.test(tech)) categories.security.add(tech);
          else categories.business.add(tech);
        }
      }
    }

    return {
      detectedTechs: Array.from(detectedTechs),
      departments: Array.from(departments),
      categories: Object.fromEntries(
        Object.entries(categories).map(([k, v]) => [k, Array.from(v)])
      )
    };
  }

  // Helper: Extract tech signals from Lever job postings
  private extractTechFromLeverJobs(jobs: any[]): { 
    detectedTechs: string[]; 
    teams: string[];
    categories: { [key: string]: string[] } 
  } {
    // Reuse same logic as Greenhouse
    const ghFormat = jobs.map(j => ({
      title: j.text,
      departments: [{ name: j.categories?.team || j.categories?.department }],
      content: j.descriptionPlain || j.description || ''
    }));
    
    const result = this.extractTechFromJobs(ghFormat);
    return {
      detectedTechs: result.detectedTechs,
      teams: result.departments,
      categories: result.categories
    };
  }

  // Helper: Detect technologies from website HTML and headers
  private detectWebTechnologies(html: string, headers: any): {
    technologies: string[];
    scripts: string[];
    cdns: string[];
    frameworks: string[];
    analytics: string[];
    marketing: string[];
    tier1: string[];
  } {
    const technologies: Set<string> = new Set();
    const scripts: Set<string> = new Set();
    const cdns: Set<string> = new Set();
    const frameworks: Set<string> = new Set();
    const analytics: Set<string> = new Set();
    const marketing: Set<string> = new Set();
    const tier1: Set<string> = new Set();

    // Extract script sources
    const scriptMatches = html.match(/<script[^>]+src=["']([^"']+)["']/gi) || [];
    for (const match of scriptMatches) {
      const srcMatch = match.match(/src=["']([^"']+)["']/i);
      if (srcMatch) scripts.add(srcMatch[1]);
    }

    // Detect from scripts
    const scriptDetection: { pattern: RegExp; tech: string; category: 'analytics' | 'marketing' | 'framework' | 'cdn' | 'tier1' }[] = [
      // Analytics (Tier 1)
      { pattern: /googletagmanager\.com|google-analytics\.com|gtag\(/i, tech: 'Google Analytics (GA4)', category: 'tier1' },
      { pattern: /cdn\.segment\.com|segment\.io/i, tech: 'Segment', category: 'tier1' },
      { pattern: /datadoghq\.com|dd-rum/i, tech: 'Datadog', category: 'tier1' },
      { pattern: /newrelic\.com|nr-data\.net/i, tech: 'New Relic', category: 'tier1' },
      { pattern: /sentry\.io|sentry-cdn\.com/i, tech: 'Sentry', category: 'tier1' },
      // Analytics (Tier 2)
      { pattern: /hotjar\.com/i, tech: 'Hotjar', category: 'analytics' },
      { pattern: /amplitude\.com/i, tech: 'Amplitude', category: 'analytics' },
      { pattern: /mixpanel\.com/i, tech: 'Mixpanel', category: 'analytics' },
      { pattern: /pendo\.io/i, tech: 'Pendo', category: 'analytics' },
      // Marketing
      { pattern: /js\.hs-scripts\.com|hubspot\.com/i, tech: 'HubSpot', category: 'tier1' },
      { pattern: /munchkin\.marketo\.net/i, tech: 'Marketo', category: 'marketing' },
      { pattern: /pardot\.com/i, tech: 'Pardot', category: 'marketing' },
      { pattern: /mailchimp\.com/i, tech: 'Mailchimp', category: 'marketing' },
      { pattern: /intercom\.io/i, tech: 'Intercom', category: 'marketing' },
      { pattern: /drift\.com/i, tech: 'Drift', category: 'marketing' },
      { pattern: /zdassets\.com|zendesk\.com/i, tech: 'Zendesk', category: 'tier1' },
      // Payments
      { pattern: /js\.stripe\.com/i, tech: 'Stripe', category: 'tier1' },
      // Identity
      { pattern: /okta\.com|oktacdn\.com/i, tech: 'Okta', category: 'tier1' },
      { pattern: /auth0\.com/i, tech: 'Auth0', category: 'tier1' },
      { pattern: /login\.microsoftonline\.com/i, tech: 'Azure AD (Entra ID)', category: 'tier1' },
      // CRM
      { pattern: /force\.com|salesforce\.com/i, tech: 'Salesforce', category: 'tier1' },
      // CDN
      { pattern: /cloudflare/i, tech: 'Cloudflare', category: 'tier1' },
      { pattern: /akamaized\.net|akamai/i, tech: 'Akamai', category: 'cdn' },
      { pattern: /fastly/i, tech: 'Fastly', category: 'cdn' },
      // Frameworks
      { pattern: /react|__NEXT_DATA__/i, tech: 'React', category: 'framework' },
      { pattern: /vue|nuxt/i, tech: 'Vue.js', category: 'framework' },
      { pattern: /angular|ng-app/i, tech: 'Angular', category: 'framework' },
      { pattern: /jquery/i, tech: 'jQuery', category: 'framework' },
      // CMS
      { pattern: /wp-content|wp-includes/i, tech: 'WordPress', category: 'framework' },
      { pattern: /cdn\.shopify\.com/i, tech: 'Shopify', category: 'tier1' }
    ];

    const allText = html + ' ' + JSON.stringify(scripts);
    
    for (const { pattern, tech, category } of scriptDetection) {
      if (pattern.test(allText)) {
        technologies.add(tech);
        switch (category) {
          case 'analytics': analytics.add(tech); break;
          case 'marketing': marketing.add(tech); break;
          case 'framework': frameworks.add(tech); break;
          case 'cdn': cdns.add(tech); break;
          case 'tier1': tier1.add(tech); break;
        }
      }
    }

    // Detect from headers
    const server = headers['server']?.toLowerCase() || '';
    const poweredBy = headers['x-powered-by']?.toLowerCase() || '';
    
    if (server.includes('cloudflare')) { technologies.add('Cloudflare'); tier1.add('Cloudflare'); }
    if (server.includes('nginx')) technologies.add('NGINX');
    if (server.includes('apache')) technologies.add('Apache');
    if (server.includes('vercel')) technologies.add('Vercel');
    if (server.includes('netlify')) technologies.add('Netlify');
    if (headers['cf-ray']) { technologies.add('Cloudflare'); tier1.add('Cloudflare'); }
    if (headers['x-vercel-id']) technologies.add('Vercel');
    if (headers['x-nf-request-id']) technologies.add('Netlify');

    return {
      technologies: Array.from(technologies),
      scripts: Array.from(scripts),
      cdns: Array.from(cdns),
      frameworks: Array.from(frameworks),
      analytics: Array.from(analytics),
      marketing: Array.from(marketing),
      tier1: Array.from(tier1)
    };
  }

  // Helper: Detect cloud providers from DNS CNAME records
  private detectCloudProviders(answers: any[], domain: string): {
    primaryProvider: string | null;
    providers: string[];
    cdn: string | null;
    signals: string[];
    tier1: string[];
  } {
    const providers: Set<string> = new Set();
    const signals: string[] = [];
    const tier1: Set<string> = new Set();
    let cdn: string | null = null;

    const cloudPatterns: { pattern: RegExp; provider: string; type: 'cloud' | 'cdn' }[] = [
      // AWS
      { pattern: /\.amazonaws\.com$/i, provider: 'AWS', type: 'cloud' },
      { pattern: /\.cloudfront\.net$/i, provider: 'AWS CloudFront', type: 'cdn' },
      { pattern: /\.awsglobalaccelerator\.com$/i, provider: 'AWS', type: 'cloud' },
      { pattern: /\.elb\.amazonaws\.com$/i, provider: 'AWS (ELB)', type: 'cloud' },
      // Azure
      { pattern: /\.azure\.com$/i, provider: 'Azure', type: 'cloud' },
      { pattern: /\.azurewebsites\.net$/i, provider: 'Azure App Service', type: 'cloud' },
      { pattern: /\.azureedge\.net$/i, provider: 'Azure CDN', type: 'cdn' },
      { pattern: /\.windows\.net$/i, provider: 'Azure', type: 'cloud' },
      { pattern: /\.blob\.core\.windows\.net$/i, provider: 'Azure Blob', type: 'cloud' },
      // GCP
      { pattern: /\.googleapis\.com$/i, provider: 'GCP', type: 'cloud' },
      { pattern: /\.googleusercontent\.com$/i, provider: 'GCP', type: 'cloud' },
      { pattern: /\.appspot\.com$/i, provider: 'GCP App Engine', type: 'cloud' },
      { pattern: /\.run\.app$/i, provider: 'GCP Cloud Run', type: 'cloud' },
      // CDNs
      { pattern: /\.cloudflare\.net$/i, provider: 'Cloudflare', type: 'cdn' },
      { pattern: /\.akamaiedge\.net$/i, provider: 'Akamai', type: 'cdn' },
      { pattern: /\.akamaized\.net$/i, provider: 'Akamai', type: 'cdn' },
      { pattern: /\.fastly\.net$/i, provider: 'Fastly', type: 'cdn' },
      // Hosting
      { pattern: /\.vercel\.app$/i, provider: 'Vercel', type: 'cloud' },
      { pattern: /\.netlify\.app$/i, provider: 'Netlify', type: 'cloud' },
      { pattern: /\.herokuapp\.com$/i, provider: 'Heroku', type: 'cloud' }
    ];

    for (const answer of answers) {
      const data = answer.data || '';
      for (const { pattern, provider, type } of cloudPatterns) {
        if (pattern.test(data)) {
          if (type === 'cloud') {
            providers.add(provider);
            signals.push(`CNAME → ${data} (${provider})`);
            // Mark Tier 1 clouds
            if (provider.startsWith('AWS') || provider.startsWith('Azure') || provider.startsWith('GCP')) {
              tier1.add(provider.split(' ')[0]); // Just AWS, Azure, or GCP
            }
          } else {
            cdn = provider;
            signals.push(`CDN: ${provider}`);
            if (provider === 'Cloudflare') tier1.add('Cloudflare');
          }
        }
      }
    }

    // Determine primary provider (most signals or first detected)
    const providerArray = Array.from(providers);
    const primaryProvider = providerArray.length > 0 ? providerArray[0] : null;

    return {
      primaryProvider,
      providers: providerArray,
      cdn,
      signals,
      tier1: Array.from(tier1)
    };
  }

  getTotalCost(): number {
    return this.totalCost;
  }

  isWithinCostTarget(): boolean {
    return this.totalCost <= ApiConfig.COST_TARGET_PER_DOSSIER;
  }

  async emergencyStop(): Promise<void> {
    console.log('Emergency stop requested');
  }

  reset(): void {
    this.context = null;
    this.totalCost = 0;
    this.requestId = uuidv4();
  }

  private async updateProgress(progress: AgentProgress): Promise<void> {
    if (this.progressCallback) {
      this.progressCallback(progress);
    }
  }
}
