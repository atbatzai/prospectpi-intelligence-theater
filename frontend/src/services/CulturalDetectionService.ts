/**
 * Story 2.4.1: Cultural Detection & Calibration Engine
 * 
 * Automatic detection of company geographic/cultural context via domain analysis
 * Cultural calibration database for 12 primary markets
 */

export interface CulturalContext {
  region: string;
  country: string;
  culturalDimensions: {
    hierarchy: number; // 0-100: flat vs hierarchical
    directness: number; // 0-100: indirect vs direct communication
    formality: number; // 0-100: informal vs formal
    relationshipFirst: number; // 0-100: task-first vs relationship-first
    engineeringFocus: number; // 0-100: business vs technical focus
  };
  language: string;
  timezone: string;
}

export interface CulturalCalibration {
  marketCode: string;
  marketName: string;
  culturalScores: CulturalContext['culturalDimensions'];
  communicationStyle: string;
  businessEtiquette: string[];
}

// Story 2.4.1: Cultural calibration database for 12 primary markets
const CULTURAL_CALIBRATIONS: Record<string, CulturalCalibration> = {
  US: {
    marketCode: 'US',
    marketName: 'United States',
    culturalScores: {
      hierarchy: 30,
      directness: 75,
      formality: 40,
      relationshipFirst: 35,
      engineeringFocus: 60
    },
    communicationStyle: 'Direct, action-oriented, informal',
    businessEtiquette: ['Value time efficiency', 'Direct communication preferred', 'First-name basis common']
  },
  DE: {
    marketCode: 'DE',
    marketName: 'Germany',
    culturalScores: {
      hierarchy: 45,
      directness: 85,
      formality: 70,
      relationshipFirst: 25,
      engineeringFocus: 80
    },
    communicationStyle: 'Very direct, formal, engineering-focused',
    businessEtiquette: ['Punctuality critical', 'Formal titles important', 'Technical precision valued']
  },
  JP: {
    marketCode: 'JP',
    marketName: 'Japan',
    culturalScores: {
      hierarchy: 85,
      directness: 20,
      formality: 90,
      relationshipFirst: 80,
      engineeringFocus: 75
    },
    communicationStyle: 'Indirect, highly formal, relationship-focused',
    businessEtiquette: ['Consensus-driven', 'Avoid confrontation', 'Business cards ritual']
  },
  UK: {
    marketCode: 'UK',
    marketName: 'United Kingdom',
    culturalScores: {
      hierarchy: 40,
      directness: 50,
      formality: 55,
      relationshipFirst: 45,
      engineeringFocus: 50
    },
    communicationStyle: 'Polite indirectness, moderate formality',
    businessEtiquette: ['Understatement common', 'Politeness valued', 'Queue culture important']
  },
  SG: {
    marketCode: 'SG',
    marketName: 'Singapore',
    culturalScores: {
      hierarchy: 70,
      directness: 40,
      formality: 65,
      relationshipFirst: 60,
      engineeringFocus: 70
    },
    communicationStyle: 'Respectful, formal, efficiency-focused',
    businessEtiquette: ['Respect seniority', 'Meritocracy valued', 'Multicultural awareness']
  },
  CN: {
    marketCode: 'CN',
    marketName: 'China',
    culturalScores: {
      hierarchy: 90,
      directness: 25,
      formality: 75,
      relationshipFirst: 90,
      engineeringFocus: 65
    },
    communicationStyle: 'Relationship-first, face-saving critical',
    businessEtiquette: ['Guanxi essential', 'Hierarchy respect', 'Indirect communication']
  },
  FR: {
    marketCode: 'FR',
    marketName: 'France',
    culturalScores: {
      hierarchy: 65,
      directness: 60,
      formality: 75,
      relationshipFirst: 55,
      engineeringFocus: 50
    },
    communicationStyle: 'Intellectual debate, formal presentation',
    businessEtiquette: ['Formal greetings', 'Business meals important', 'Debate valued']
  },
  IN: {
    marketCode: 'IN',
    marketName: 'India',
    culturalScores: {
      hierarchy: 80,
      directness: 35,
      formality: 60,
      relationshipFirst: 75,
      engineeringFocus: 70
    },
    communicationStyle: 'Relationship-focused, respectful hierarchy',
    businessEtiquette: ['Build relationships first', 'Respect hierarchy', 'Flexibility valued']
  },
  BR: {
    marketCode: 'BR',
    marketName: 'Brazil',
    culturalScores: {
      hierarchy: 70,
      directness: 45,
      formality: 50,
      relationshipFirst: 85,
      engineeringFocus: 40
    },
    communicationStyle: 'Warm, relationship-driven, flexible',
    businessEtiquette: ['Personal connections key', 'Warmth expected', 'Flexibility important']
  },
  AU: {
    marketCode: 'AU',
    marketName: 'Australia',
    culturalScores: {
      hierarchy: 25,
      directness: 70,
      formality: 30,
      relationshipFirst: 40,
      engineeringFocus: 45
    },
    communicationStyle: 'Very informal, direct, egalitarian',
    businessEtiquette: ['Casual culture', 'Tall poppy syndrome', 'Work-life balance valued']
  },
  CA: {
    marketCode: 'CA',
    marketName: 'Canada',
    culturalScores: {
      hierarchy: 35,
      directness: 65,
      formality: 45,
      relationshipFirst: 40,
      engineeringFocus: 55
    },
    communicationStyle: 'Polite directness, moderate formality',
    businessEtiquette: ['Politeness valued', 'Bilingual awareness', 'Consensus-seeking']
  },
  NL: {
    marketCode: 'NL',
    marketName: 'Netherlands',
    culturalScores: {
      hierarchy: 30,
      directness: 90,
      formality: 35,
      relationshipFirst: 30,
      engineeringFocus: 60
    },
    communicationStyle: 'Extremely direct, informal, pragmatic',
    businessEtiquette: ['Bluntness normal', 'Consensus important', 'Pragmatism valued']
  }
};

// TLD to country code mapping
const TLD_TO_COUNTRY: Record<string, string> = {
  'com': 'US',
  'net': 'US',
  'org': 'US',
  'de': 'DE',
  'jp': 'JP',
  'co.jp': 'JP',
  'uk': 'UK',
  'co.uk': 'UK',
  'sg': 'SG',
  'com.sg': 'SG',
  'cn': 'CN',
  'com.cn': 'CN',
  'fr': 'FR',
  'in': 'IN',
  'co.in': 'IN',
  'br': 'BR',
  'com.br': 'BR',
  'au': 'AU',
  'com.au': 'AU',
  'ca': 'CA',
  'nl': 'NL'
};

export class CulturalDetectionService {
  /**
   * Story 2.4.1: Detect cultural context from company domain
   */
  static detectFromDomain(domain: string): CulturalContext {
    const tld = this.extractTLD(domain);
    const countryCode = TLD_TO_COUNTRY[tld] || 'US'; // Default to US
    const calibration = CULTURAL_CALIBRATIONS[countryCode] || CULTURAL_CALIBRATIONS['US'];

    return {
      region: this.getRegion(countryCode),
      country: calibration.marketName,
      culturalDimensions: calibration.culturalScores,
      language: this.getLanguage(countryCode),
      timezone: this.getTimezone(countryCode)
    };
  }

  /**
   * Get cultural calibration for a market code
   */
  static getCalibration(marketCode: string): CulturalCalibration | null {
    return CULTURAL_CALIBRATIONS[marketCode] || null;
  }

  /**
   * Get all available market calibrations
   */
  static getAllCalibrations(): CulturalCalibration[] {
    return Object.values(CULTURAL_CALIBRATIONS);
  }

  private static extractTLD(domain: string): string {
    const parts = domain.toLowerCase().split('.');
    if (parts.length >= 3 && parts[parts.length - 2].length === 2) {
      // Handle .co.uk, .com.au, etc.
      return `${parts[parts.length - 2]}.${parts[parts.length - 1]}`;
    }
    return parts[parts.length - 1];
  }

  private static getRegion(countryCode: string): string {
    const regions: Record<string, string> = {
      US: 'North America',
      CA: 'North America',
      UK: 'Europe',
      DE: 'Europe',
      FR: 'Europe',
      NL: 'Europe',
      JP: 'Asia Pacific',
      CN: 'Asia Pacific',
      SG: 'Asia Pacific',
      IN: 'Asia Pacific',
      AU: 'Asia Pacific',
      BR: 'Latin America'
    };
    return regions[countryCode] || 'Global';
  }

  private static getLanguage(countryCode: string): string {
    const languages: Record<string, string> = {
      US: 'English',
      UK: 'English',
      CA: 'English/French',
      AU: 'English',
      DE: 'German',
      FR: 'French',
      JP: 'Japanese',
      CN: 'Mandarin Chinese',
      SG: 'English/Mandarin/Malay/Tamil',
      IN: 'English/Hindi',
      BR: 'Portuguese',
      NL: 'Dutch'
    };
    return languages[countryCode] || 'English';
  }

  private static getTimezone(countryCode: string): string {
    const timezones: Record<string, string> = {
      US: 'America/New_York',
      UK: 'Europe/London',
      DE: 'Europe/Berlin',
      FR: 'Europe/Paris',
      JP: 'Asia/Tokyo',
      CN: 'Asia/Shanghai',
      SG: 'Asia/Singapore',
      IN: 'Asia/Kolkata',
      BR: 'America/Sao_Paulo',
      AU: 'Australia/Sydney',
      CA: 'America/Toronto',
      NL: 'Europe/Amsterdam'
    };
    return timezones[countryCode] || 'UTC';
  }
}
