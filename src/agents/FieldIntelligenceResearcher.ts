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
      dataSourcesActive: ['theirstack', 'marketaux', 'coresignal', 'openai-realtime'],
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
      dataSourcesActive: ['theirstack', 'marketaux', 'coresignal', 'openai-realtime'],
      insightsDiscovered: 0,
      timestamp: new Date()
    });

    const results: ResearchData[] = [];
    const companyName = this.context.userInput.companyName;

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

    // Coresignal: Professional network intelligence
    try {
      await this.updateProgress({
        stage: 'researching',
        agent: 'researcher',
        message: `Analyzing professional networks for ${companyName}...`,
        confidence: 0.85,
        estimatedTimeRemaining: 45,
        userCanInterrupt: false,
        dataSourcesActive: ['coresignal'],
        insightsDiscovered: results.length,
        timestamp: new Date()
      });

      const coresignalResponse = await axios.get(
        `${ApiConfig.CORESIGNAL_MCP_URL}/professional-network/company/search`,
        {
          params: { 
            title: companyName,
            company_name: companyName 
          },
          headers: { 
            'Authorization': `Bearer ${ApiConfig.CORESIGNAL_MCP_AUTH}`,
            'Content-Type': 'application/json'
          },
          timeout: ApiConfig.DEFAULT_TIMEOUT_MS
        }
      );

      const coresignalCost = 0.08;
      this.totalCost += coresignalCost;
      this.costTracker.trackApiCost({
        source: 'coresignal',
        cost: coresignalCost,
        timestamp: new Date(),
        requestType: 'solution-focused',
        valueScore: 4.0,
        requestId: this.requestId,
        companyName: companyName
      });

      results.push({
        source: 'coresignal',
        data: coresignalResponse.data || { employees: [], departments: [] },
        confidence: 0.88,
        timestamp: new Date(),
        cost: coresignalCost
      });
    } catch (error: any) {
      console.warn(`⚠️ Coresignal API failed: ${error.message}`);
      results.push({
        source: 'coresignal',
        data: { error: error.message, status: 'unavailable' },
        confidence: 0.0,
        timestamp: new Date(),
        cost: 0
      });
    }

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
        `${ApiConfig.OPENAI_BASE_URL}/chat/completions`,
        {
          model: 'gpt-4o',
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
            'Authorization': `Bearer ${ApiConfig.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: ApiConfig.DEFAULT_TIMEOUT_MS
        }
      );

      const openaiCost = 0.08; // GPT-4o is more cost-effective
      this.totalCost += openaiCost;
      this.costTracker.trackApiCost({
        source: 'openai-realtime',
        cost: openaiCost,
        timestamp: new Date(),
        requestType: 'solution-focused',
        valueScore: 5.0,
        requestId: this.requestId,
        companyName: companyName
      });

      // Extract the content from OpenAI response
      const insights = openaiResponse.data?.choices?.[0]?.message?.content || '';
      
      results.push({
        source: 'openai-realtime',
        data: { 
          insights: insights,
          model: 'gpt-4o',
          usage: openaiResponse.data?.usage
        },
        confidence: 0.90,
        timestamp: new Date(),
        cost: openaiCost
      });
    } catch (error: any) {
      console.warn(`⚠️ OpenAI Real-time API failed: ${error.message}`);
      results.push({
        source: 'openai-realtime',
        data: { error: error.message, status: 'unavailable' },
        confidence: 0.0,
        timestamp: new Date(),
        cost: 0
      });
    }

    await this.updateProgress({
      stage: 'researching',
      agent: 'researcher',
      message: `Intelligence gathered from ${results.filter(r => r.confidence > 0).length}/4 sources`,
      confidence: 0.95,
      estimatedTimeRemaining: 10,
      userCanInterrupt: false,
      dataSourcesActive: [],
      insightsDiscovered: results.length,
      timestamp: new Date()
    });

    return results;
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
