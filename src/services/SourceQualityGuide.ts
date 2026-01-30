import { RawIntelligenceVault, RawIntelligenceRecord } from './RawIntelligenceVault';

/**
 * Source Quality Guide - Step 3 of Pipeline Improvement
 * Provides Detective with source quality hints and section mapping
 * for guided synthesis of better dossiers
 */

export interface SourceQualityTier {
  tier: 1 | 2 | 3;
  tierName: 'premium' | 'supporting' | 'failed';
  valueScore: number;
  confidence: number;
  bestForSections: string[];
  keyDataPoints: string[];
}

export interface DossierSectionGuide {
  sectionName: string;
  primarySources: string[];
  supportingSources: string[];
  requiredDataPoints: string[];
  qualityThreshold: number;
}

export interface GuidedSynthesisHints {
  requestId: string;
  companyName: string;
  totalSources: number;
  sourceTiers: Record<string, SourceQualityTier>;
  sectionGuides: DossierSectionGuide[];
  synthesisInstructions: string;
  skipSources: string[];
  prioritySources: string[];
}

// Source-to-Section mapping based on our quality analysis
const SOURCE_SECTION_MAP: Record<string, { sections: string[]; valueScore: number }> = {
  // TIER 1: Premium Sources (7-9 value)
  'sec-edgar': { sections: ['Company Overview', 'Financial Health', 'Public Filings'], valueScore: 9 },
  'sec-formd': { sections: ['Funding History', 'Financial Health', 'Investment Signals'], valueScore: 9 },
  'github': { sections: ['Technology Stack', 'Engineering Culture', 'Open Source Strategy'], valueScore: 9 },
  'nvd-cve': { sections: ['Security Risk', 'Technology Assessment', 'Risk Analysis'], valueScore: 8 },
  'sec-8k': { sections: ['Executive Changes', 'Material Events', 'Corporate Actions'], valueScore: 8 },
  'courtlistener': { sections: ['Legal Risk', 'Litigation History', 'Risk Analysis'], valueScore: 8 },
  'greenhouse-jobs': { sections: ['Hiring Trends', 'Technology Stack', 'Growth Signals'], valueScore: 8 },
  'wikidata': { sections: ['Company Overview', 'Executive Summary', 'Basic Facts'], valueScore: 8 },
  'hackernews': { sections: ['Market Sentiment', 'Industry Perception', 'Brand Analysis'], valueScore: 7 },
  'googlenews': { sections: ['Recent News', 'Market Position', 'PR Analysis'], valueScore: 7 },
  'web-fingerprint': { sections: ['Technology Stack', 'Infrastructure'], valueScore: 7 },
  // TIER 2: Supporting Sources (4-6 value)
  'gdelt': { sections: ['Global Media Coverage', 'International Presence'], valueScore: 6 },
  'marketaux': { sections: ['Financial News', 'Market Sentiment'], valueScore: 6 },
  'stackexchange': { sections: ['Developer Sentiment', 'Product Pain Points'], valueScore: 6 },
  'federalregister': { sections: ['Regulatory Exposure', 'Compliance Risk'], valueScore: 5 },
  'openalex': { sections: ['Research & Innovation', 'Academic Presence'], valueScore: 5 },
  'wikimedia-pageviews': { sections: ['Public Interest', 'Brand Awareness'], valueScore: 4 },
  // TIER 3: Failed/Low-Value (skip these)
  'cloud-attribution': { sections: [], valueScore: 2 },
  'prnewswire': { sections: [], valueScore: 2 },
  'businesswire': { sections: [], valueScore: 2 },
  'globenewswire': { sections: [], valueScore: 2 },
  'sec-xbrl': { sections: [], valueScore: 2 },
  'sam-gov': { sections: [], valueScore: 1 },
  'usaspending': { sections: [], valueScore: 1 },
  'openai-realtime': { sections: [], valueScore: 1 },
};

// Standard dossier sections with source requirements
const DOSSIER_SECTIONS: DossierSectionGuide[] = [
  {
    sectionName: 'Executive Summary',
    primarySources: ['wikidata', 'sec-edgar', 'googlenews'],
    supportingSources: ['hackernews', 'marketaux'],
    requiredDataPoints: ['company name', 'description', 'headquarters', 'employee count', 'industry'],
    qualityThreshold: 0.7
  },
  {
    sectionName: 'Company Overview',
    primarySources: ['wikidata', 'sec-edgar', 'sec-formd'],
    supportingSources: ['googlenews', 'marketaux'],
    requiredDataPoints: ['founded date', 'headquarters', 'CEO', 'employee count', 'revenue indicators'],
    qualityThreshold: 0.7
  },
  {
    sectionName: 'Technology Stack',
    primarySources: ['github', 'web-fingerprint', 'greenhouse-jobs'],
    supportingSources: ['stackexchange', 'nvd-cve'],
    requiredDataPoints: ['languages', 'frameworks', 'infrastructure', 'cloud provider'],
    qualityThreshold: 0.6
  },
  {
    sectionName: 'Financial Health',
    primarySources: ['sec-edgar', 'sec-formd', 'sec-8k'],
    supportingSources: ['marketaux', 'googlenews'],
    requiredDataPoints: ['funding status', 'revenue signals', 'recent filings'],
    qualityThreshold: 0.8
  },
  {
    sectionName: 'Risk Assessment',
    primarySources: ['nvd-cve', 'courtlistener', 'sec-8k'],
    supportingSources: ['federalregister', 'googlenews'],
    requiredDataPoints: ['security vulnerabilities', 'litigation', 'regulatory exposure'],
    qualityThreshold: 0.6
  },
  {
    sectionName: 'Market Position',
    primarySources: ['googlenews', 'hackernews', 'gdelt'],
    supportingSources: ['openalex', 'wikimedia-pageviews'],
    requiredDataPoints: ['media sentiment', 'industry perception', 'market signals'],
    qualityThreshold: 0.5
  },
  {
    sectionName: 'Hiring & Growth',
    primarySources: ['greenhouse-jobs'],
    supportingSources: ['googlenews', 'sec-8k'],
    requiredDataPoints: ['active job openings', 'hiring trends', 'growth indicators'],
    qualityThreshold: 0.7
  }
];

export class SourceQualityGuide {
  private vault: RawIntelligenceVault;
  
  constructor() {
    this.vault = RawIntelligenceVault.getInstance();
  }
  
  async initialize(): Promise<void> {
    await this.vault.initialize();
  }
  
  async generateSynthesisHints(requestId: string): Promise<GuidedSynthesisHints | null> {
    const allIntel = await this.vault.getAllRawIntelligence(requestId);
    if (!allIntel || allIntel.length === 0) {
      return null;
    }
    
    const companyName = 'Target Company';
    const sourceTiers: Record<string, SourceQualityTier> = {};
    const skipSources: string[] = [];
    const prioritySources: string[] = [];
    
    for (const intel of allIntel) {
      const mapping = SOURCE_SECTION_MAP[intel.source] || { sections: [], valueScore: 3 };
      const tier = this.calculateTier(intel.confidence, mapping.valueScore);
      
      sourceTiers[intel.source] = {
        tier,
        tierName: tier === 1 ? 'premium' : tier === 2 ? 'supporting' : 'failed',
        valueScore: mapping.valueScore,
        confidence: intel.confidence,
        bestForSections: mapping.sections,
        keyDataPoints: this.extractKeyDataPoints(intel)
      };
      
      if (tier === 1) {
        prioritySources.push(intel.source);
      } else if (tier === 3) {
        skipSources.push(intel.source);
      }
    }
    
    const synthesisInstructions = this.generateSynthesisInstructions(sourceTiers, prioritySources, skipSources);
    
    return {
      requestId,
      companyName,
      totalSources: allIntel.length,
      sourceTiers,
      sectionGuides: DOSSIER_SECTIONS,
      synthesisInstructions,
      skipSources,
      prioritySources
    };
  }
  
  private calculateTier(confidence: number, valueScore: number): 1 | 2 | 3 {
    if (confidence >= 0.8 && valueScore >= 7) return 1;
    if (confidence >= 0.5 && valueScore >= 4) return 2;
    return 3;
  }
  
  private extractKeyDataPoints(intel: RawIntelligenceRecord): string[] {
    try {
      const data = intel.rawData;
      const points: string[] = [];
      
      if (data.totalResults !== undefined) points.push(`Total results: ${data.totalResults}`);
      if (data.totalJobs !== undefined) points.push(`Job openings: ${data.totalJobs}`);
      if (data.companyInfo?.name) points.push(`Company: ${data.companyInfo.name}`);
      if (data.officialOrg?.publicRepos) points.push(`Public repos: ${data.officialOrg.publicRepos}`);
      if (data.isPublicCompany !== undefined) points.push(`Public company: ${data.isPublicCompany}`);
      if (data.hasPrivateFunding) points.push('Has private funding (Form D)');
      if (data.severityDistribution) {
        const sev = data.severityDistribution;
        points.push(`CVEs: ${sev.CRITICAL || 0} critical, ${sev.HIGH || 0} high`);
      }
      
      return points.slice(0, 5);
    } catch {
      return ['Data parsing error'];
    }
  }
  
  private generateSynthesisInstructions(
    tiers: Record<string, SourceQualityTier>,
    priority: string[],
    skip: string[]
  ): string {
    const priorityLines = priority.map(s => {
      const tier = tiers[s];
      return `- **${s.toUpperCase()}**: ${tier?.bestForSections.join(', ') || 'General'}`;
    }).join('\n');
    
    const skipLines = skip.map(s => `- ${s}: Low confidence or failed`).join('\n');
    
    return `
## GUIDED SYNTHESIS INSTRUCTIONS

### PRIORITY SOURCES (Tier 1 - Use First)
${priorityLines}

### SKIP SOURCES (Tier 3 - Ignore)
${skipLines}

### SECTION-BY-SECTION GUIDANCE
1. **Executive Summary**: Prioritize wikidata, sec-edgar, googlenews
2. **Technology Stack**: Prioritize github, web-fingerprint, greenhouse-jobs  
3. **Financial Health**: Prioritize sec-formd, sec-edgar, sec-8k
4. **Risk Assessment**: Prioritize nvd-cve, courtlistener, sec-8k
5. **Market Position**: Prioritize googlenews, hackernews, gdelt

### QUALITY RULES
- Never cite data from Tier 3 sources
- If primary sources have no data, state "Insufficient data"
- Cross-validate claims using at least 2 Tier 1/2 sources
`;
  }
  
  async getDetectivePromptHints(requestId: string): Promise<string> {
    const hints = await this.generateSynthesisHints(requestId);
    if (!hints) {
      return '## NO SOURCE QUALITY DATA AVAILABLE\nProceed with standard synthesis.';
    }
    
    let prompt = `
## SOURCE QUALITY GUIDE (GUIDED SYNTHESIS)

### Source Tiers for This Request
`;
    
    prompt += '\n**TIER 1 - PREMIUM (Use as Primary Sources):**\n';
    for (const [source, tier] of Object.entries(hints.sourceTiers)) {
      if (tier.tier === 1) {
        prompt += `- ${source.toUpperCase()}: ${(tier.confidence * 100).toFixed(0)}% conf, Value ${tier.valueScore}/10\n`;
        prompt += `  Best for: ${tier.bestForSections.join(', ')}\n`;
      }
    }
    
    prompt += '\n**TIER 2 - SUPPORTING (Use for Validation):**\n';
    for (const [source, tier] of Object.entries(hints.sourceTiers)) {
      if (tier.tier === 2) {
        prompt += `- ${source}: ${(tier.confidence * 100).toFixed(0)}% conf\n`;
      }
    }
    
    prompt += '\n**TIER 3 - SKIP (Do Not Cite):**\n';
    prompt += hints.skipSources.join(', ') + '\n';
    
    prompt += hints.synthesisInstructions;
    
    return prompt;
  }
}

export default SourceQualityGuide;
