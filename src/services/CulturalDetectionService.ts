/**
 * Cultural Detection Service - Epic 2.4
 * Detects company cultural context via domain analysis and provides cultural calibration
 */

export interface CulturalContext {
  region: string;
  country: string;
  culturalScores: {
    hierarchy: number; // 0-100 (flat vs hierarchical)
    directness: number; // 0-100 (indirect vs direct)
    formality: number; // 0-100 (informal vs formal)
    relationshipFirst: number; // 0-100 (task vs relationship focus)
    individualismCollectivism: number; // 0-100 (collectivist vs individualist)
  };
  communicationStyle: 'direct' | 'diplomatic' | 'contextual' | 'relationship-focused';
  businessCultureType: 'engineering' | 'sales' | 'enterprise' | 'startup' | 'traditional';
  confidence: number;
}

export class CulturalDetectionService {
  private static readonly CULTURAL_PROFILES = new Map<string, CulturalContext>([
    // North America
    ['US', {
      region: 'North America',
      country: 'United States',
      culturalScores: { hierarchy: 25, directness: 85, formality: 40, relationshipFirst: 30, individualismCollectivism: 90 },
      communicationStyle: 'direct',
      businessCultureType: 'enterprise',
      confidence: 0.95
    }],
    ['CA', {
      region: 'North America', 
      country: 'Canada',
      culturalScores: { hierarchy: 20, directness: 75, formality: 35, relationshipFirst: 40, individualismCollectivism: 80 },
      communicationStyle: 'diplomatic',
      businessCultureType: 'enterprise',
      confidence: 0.90
    }],
    
    // Europe
    ['DE', {
      region: 'Europe',
      country: 'Germany',
      culturalScores: { hierarchy: 45, directness: 95, formality: 85, relationshipFirst: 25, individualismCollectivism: 70 },
      communicationStyle: 'direct',
      businessCultureType: 'engineering',
      confidence: 0.95
    }],
    ['UK', {
      region: 'Europe',
      country: 'United Kingdom', 
      culturalScores: { hierarchy: 55, directness: 65, formality: 70, relationshipFirst: 35, individualismCollectivism: 85 },
      communicationStyle: 'diplomatic',
      businessCultureType: 'traditional',
      confidence: 0.92
    }],
    ['FR', {
      region: 'Europe',
      country: 'France',
      culturalScores: { hierarchy: 70, directness: 55, formality: 80, relationshipFirst: 45, individualismCollectivism: 75 },
      communicationStyle: 'contextual',
      businessCultureType: 'traditional',
      confidence: 0.88
    }],
    
    // Asia Pacific
    ['JP', {
      region: 'Asia Pacific',
      country: 'Japan',
      culturalScores: { hierarchy: 85, directness: 20, formality: 95, relationshipFirst: 80, individualismCollectivism: 25 },
      communicationStyle: 'contextual',
      businessCultureType: 'traditional',
      confidence: 0.95
    }],
    ['SG', {
      region: 'Asia Pacific',
      country: 'Singapore',
      culturalScores: { hierarchy: 65, directness: 60, formality: 75, relationshipFirst: 55, individualismCollectivism: 45 },
      communicationStyle: 'diplomatic',
      businessCultureType: 'enterprise',
      confidence: 0.85
    }],
    ['AU', {
      region: 'Asia Pacific',
      country: 'Australia', 
      culturalScores: { hierarchy: 30, directness: 80, formality: 35, relationshipFirst: 35, individualismCollectivism: 85 },
      communicationStyle: 'direct',
      businessCultureType: 'startup',
      confidence: 0.90
    }],
    
    // Additional markets
    ['BR', {
      region: 'Latin America',
      country: 'Brazil',
      culturalScores: { hierarchy: 70, directness: 45, formality: 60, relationshipFirst: 85, individualismCollectivism: 40 },
      communicationStyle: 'relationship-focused',
      businessCultureType: 'traditional',
      confidence: 0.80
    }],
    ['IN', {
      region: 'Asia Pacific',
      country: 'India',
      culturalScores: { hierarchy: 80, directness: 50, formality: 75, relationshipFirst: 70, individualismCollectivism: 35 },
      communicationStyle: 'contextual',
      businessCultureType: 'engineering',
      confidence: 0.85
    }],
    ['KR', {
      region: 'Asia Pacific',
      country: 'South Korea',
      culturalScores: { hierarchy: 90, directness: 30, formality: 90, relationshipFirst: 75, individualismCollectivism: 20 },
      communicationStyle: 'contextual',
      businessCultureType: 'traditional',
      confidence: 0.90
    }],
    ['NL', {
      region: 'Europe',
      country: 'Netherlands',
      culturalScores: { hierarchy: 25, directness: 90, formality: 45, relationshipFirst: 30, individualismCollectivism: 80 },
      communicationStyle: 'direct',
      businessCultureType: 'startup',
      confidence: 0.88
    }],
    
    // Default fallback
    ['DEFAULT', {
      region: 'Global',
      country: 'International',
      culturalScores: { hierarchy: 50, directness: 60, formality: 50, relationshipFirst: 50, individualismCollectivism: 60 },
      communicationStyle: 'diplomatic',
      businessCultureType: 'enterprise',
      confidence: 0.60
    }]
  ]);
  
  /**
   * Detect cultural context from company domain
   */
  static detectCulturalContext(companyDomain: string, companyName: string): CulturalContext {
    // Extract TLD and analyze domain patterns
    const tld = this.extractTLD(companyDomain);
    const countryCode = this.mapTLDToCountry(tld);
    
    // Get base cultural profile
    let culturalContext = this.CULTURAL_PROFILES.get(countryCode) || this.CULTURAL_PROFILES.get('DEFAULT')!;
    
    // Enhance with company-specific adjustments
    culturalContext = this.adjustForCompanyType(culturalContext, companyName, companyDomain);
    
    return culturalContext;
  }
  
  private static extractTLD(domain: string): string {
    const parts = domain.toLowerCase().split('.');
    return parts[parts.length - 1] || 'com';
  }
  
  private static mapTLDToCountry(tld: string): string {
    const tldMapping: Record<string, string> = {
      'com': 'US',
      'org': 'US', 
      'net': 'US',
      'io': 'US', // Tech startups often use .io
      'ai': 'US', // AI companies
      'co': 'US',
      'ca': 'CA',
      'de': 'DE',
      'uk': 'UK',
      'co.uk': 'UK',
      'fr': 'FR',
      'jp': 'JP',
      'co.jp': 'JP',
      'sg': 'SG',
      'com.sg': 'SG',
      'au': 'AU',
      'com.au': 'AU',
      'br': 'BR',
      'com.br': 'BR',
      'in': 'IN',
      'co.in': 'IN',
      'kr': 'KR',
      'co.kr': 'KR',
      'nl': 'NL'
    };
    
    return tldMapping[tld] || 'DEFAULT';
  }
  
  private static adjustForCompanyType(base: CulturalContext, companyName: string, domain: string): CulturalContext {
    const adjusted = { ...base, culturalScores: { ...base.culturalScores } };
    
    // Tech startup adjustments
    if (domain.includes('.io') || domain.includes('.ai') || companyName.toLowerCase().includes('tech')) {
      adjusted.businessCultureType = 'startup';
      adjusted.culturalScores.formality = Math.max(0, adjusted.culturalScores.formality - 20);
      adjusted.culturalScores.hierarchy = Math.max(0, adjusted.culturalScores.hierarchy - 15);
      adjusted.culturalScores.directness = Math.min(100, adjusted.culturalScores.directness + 10);
    }
    
    // Enterprise adjustments
    if (companyName.toLowerCase().includes('enterprise') || companyName.toLowerCase().includes('corp')) {
      adjusted.businessCultureType = 'enterprise';
      adjusted.culturalScores.formality = Math.min(100, adjusted.culturalScores.formality + 15);
      adjusted.culturalScores.hierarchy = Math.min(100, adjusted.culturalScores.hierarchy + 10);
    }
    
    return adjusted;
  }
  
  /**
   * Get cultural adaptation recommendations for dossier sections
   */
  static getCulturalAdaptationRules(context: CulturalContext): {
    executiveSummary: string[];
    competitiveAnalysis: string[];
    communicationTone: string;
    riskCommunication: string;
  } {
    const rules = {
      executiveSummary: [] as string[],
      competitiveAnalysis: [] as string[],
      communicationTone: '',
      riskCommunication: ''
    };
    
    // Executive Summary adaptations
    if (context.culturalScores.hierarchy > 70) {
      rules.executiveSummary.push('Emphasize authority and seniority in decision making');
      rules.executiveSummary.push('Lead with executive-level insights and strategic implications');
    } else {
      rules.executiveSummary.push('Focus on team collaboration and collective decision making');
      rules.executiveSummary.push('Present insights as team enablement opportunities');
    }
    
    if (context.culturalScores.relationshipFirst > 60) {
      rules.executiveSummary.push('Emphasize relationship-building opportunities');
      rules.executiveSummary.push('Include context about company culture and values alignment');
    }
    
    // Competitive Analysis adaptations
    if (context.culturalScores.directness > 70) {
      rules.competitiveAnalysis.push('Present direct comparisons and frank assessments');
      rules.competitiveAnalysis.push('Include clear winner/loser statements');
    } else {
      rules.competitiveAnalysis.push('Frame comparisons diplomatically');
      rules.competitiveAnalysis.push('Focus on differentiation rather than superiority');
    }
    
    // Communication tone
    if (context.culturalScores.formality > 70) {
      rules.communicationTone = 'formal';
    } else if (context.culturalScores.formality < 40) {
      rules.communicationTone = 'casual';
    } else {
      rules.communicationTone = 'professional';
    }
    
    // Risk communication
    if (context.culturalScores.directness > 70) {
      rules.riskCommunication = 'direct_warnings';
    } else {
      rules.riskCommunication = 'contextual_implications';
    }
    
    return rules;
  }
}