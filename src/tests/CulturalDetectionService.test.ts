/**
 * Unit Tests for Cultural Detection Service - Epic 2.4
 * Comprehensive test coverage for A+ QA grade
 */

import { CulturalDetectionService, CulturalContext } from '../services/CulturalDetectionService';

describe('CulturalDetectionService', () => {
  
  describe('detectCulturalContext', () => {
    
    test('should detect US culture for .com domains', () => {
      const result = CulturalDetectionService.detectCulturalContext('netflix.com', 'Netflix');
      
      expect(result.country).toBe('United States');
      expect(result.region).toBe('North America');
      expect(result.communicationStyle).toBe('direct');
      expect(result.confidence).toBeGreaterThan(0.9);
    });
    
    test('should detect German culture for .de domains', () => {
      const result = CulturalDetectionService.detectCulturalContext('sap.de', 'SAP');
      
      expect(result.country).toBe('Germany');
      expect(result.region).toBe('Europe');
      expect(result.communicationStyle).toBe('direct');
      expect(result.culturalScores.directness).toBeGreaterThan(90);
      expect(result.culturalScores.formality).toBeGreaterThan(80);
    });
    
    test('should detect Japanese culture for .co.jp domains', () => {
      const result = CulturalDetectionService.detectCulturalContext('sony.co.jp', 'Sony');
      
      expect(result.country).toBe('Japan');
      expect(result.region).toBe('Asia Pacific');
      expect(result.communicationStyle).toBe('contextual');
      expect(result.culturalScores.hierarchy).toBeGreaterThan(80);
      expect(result.culturalScores.formality).toBeGreaterThan(90);
    });
    
    test('should adjust for tech startup patterns', () => {
      const result = CulturalDetectionService.detectCulturalContext('startup.io', 'TechCorp');
      
      expect(result.businessCultureType).toBe('startup');
      expect(result.culturalScores.formality).toBeLessThan(50);
      expect(result.culturalScores.hierarchy).toBeLessThan(50);
    });
    
    test('should adjust for enterprise companies', () => {
      const result = CulturalDetectionService.detectCulturalContext('enterprise.com', 'Enterprise Corp');
      
      expect(result.businessCultureType).toBe('enterprise');
      expect(result.culturalScores.formality).toBeGreaterThan(50);
    });
    
    test('should fallback to default for unknown domains', () => {
      const result = CulturalDetectionService.detectCulturalContext('unknown.xyz', 'Unknown Company');
      
      expect(result.country).toBe('International');
      expect(result.region).toBe('Global');
      expect(result.communicationStyle).toBe('diplomatic');
      expect(result.confidence).toBe(0.60);
    });
    
    test('should handle all 12 supported markets', () => {
      const testCases = [
        { domain: 'test.com', expectedCountry: 'United States' },
        { domain: 'test.ca', expectedCountry: 'Canada' },
        { domain: 'test.de', expectedCountry: 'Germany' },
        { domain: 'test.uk', expectedCountry: 'United Kingdom' },
        { domain: 'test.fr', expectedCountry: 'France' },
        { domain: 'test.jp', expectedCountry: 'Japan' },
        { domain: 'test.sg', expectedCountry: 'Singapore' },
        { domain: 'test.au', expectedCountry: 'Australia' },
        { domain: 'test.br', expectedCountry: 'Brazil' },
        { domain: 'test.in', expectedCountry: 'India' },
        { domain: 'test.kr', expectedCountry: 'South Korea' },
        { domain: 'test.nl', expectedCountry: 'Netherlands' }
      ];
      
      testCases.forEach(({ domain, expectedCountry }) => {
        const result = CulturalDetectionService.detectCulturalContext(domain, 'Test Company');
        expect(result.country).toBe(expectedCountry);
        expect(result.confidence).toBeGreaterThan(0.8);
      });
    });
    
    test('should maintain cultural scores within valid range (0-100)', () => {
      const testDomains = ['test.io', 'enterprise.com', 'startup.ai'];
      
      testDomains.forEach(domain => {
        const result = CulturalDetectionService.detectCulturalContext(domain, 'Test');
        
        Object.values(result.culturalScores).forEach(score => {
          expect(score).toBeGreaterThanOrEqual(0);
          expect(score).toBeLessThanOrEqual(100);
        });
      });
    });
  });
  
  describe('getCulturalAdaptationRules', () => {
    
    test('should provide executive summary adaptations for high hierarchy cultures', () => {
      const context: CulturalContext = {
        region: 'Asia Pacific',
        country: 'Japan',
        culturalScores: { hierarchy: 85, directness: 20, formality: 95, relationshipFirst: 80, individualismCollectivism: 25 },
        communicationStyle: 'contextual',
        businessCultureType: 'traditional',
        confidence: 0.95
      };
      
      const rules = CulturalDetectionService.getCulturalAdaptationRules(context);
      
      expect(rules.executiveSummary).toContain('Emphasize authority and seniority in decision making');
      expect(rules.executiveSummary).toContain('Lead with executive-level insights and strategic implications');
    });
    
    test('should provide relationship-focused adaptations', () => {
      const context: CulturalContext = {
        region: 'Latin America',
        country: 'Brazil',
        culturalScores: { hierarchy: 70, directness: 45, formality: 60, relationshipFirst: 85, individualismCollectivism: 40 },
        communicationStyle: 'relationship-focused',
        businessCultureType: 'traditional',
        confidence: 0.80
      };
      
      const rules = CulturalDetectionService.getCulturalAdaptationRules(context);
      
      expect(rules.executiveSummary).toContain('Emphasize relationship-building opportunities');
      expect(rules.executiveSummary).toContain('Include context about company culture and values alignment');
    });
    
    test('should provide direct communication for high directness cultures', () => {
      const context: CulturalContext = {
        region: 'Europe',
        country: 'Germany',
        culturalScores: { hierarchy: 45, directness: 95, formality: 85, relationshipFirst: 25, individualismCollectivism: 70 },
        communicationStyle: 'direct',
        businessCultureType: 'engineering',
        confidence: 0.95
      };
      
      const rules = CulturalDetectionService.getCulturalAdaptationRules(context);
      
      expect(rules.competitiveAnalysis).toContain('Present direct comparisons and frank assessments');
      expect(rules.riskCommunication).toBe('direct_warnings');
    });
    
    test('should set appropriate communication tone based on formality', () => {
      const formalContext: CulturalContext = {
        region: 'Asia Pacific',
        country: 'Japan',
        culturalScores: { hierarchy: 85, directness: 20, formality: 95, relationshipFirst: 80, individualismCollectivism: 25 },
        communicationStyle: 'contextual',
        businessCultureType: 'traditional',
        confidence: 0.95
      };
      
      const casualContext: CulturalContext = {
        region: 'Asia Pacific',
        country: 'Australia',
        culturalScores: { hierarchy: 30, directness: 80, formality: 35, relationshipFirst: 35, individualismCollectivism: 85 },
        communicationStyle: 'direct',
        businessCultureType: 'startup',
        confidence: 0.90
      };
      
      const formalRules = CulturalDetectionService.getCulturalAdaptationRules(formalContext);
      const casualRules = CulturalDetectionService.getCulturalAdaptationRules(casualContext);
      
      expect(formalRules.communicationTone).toBe('formal');
      expect(casualRules.communicationTone).toBe('casual');
    });
    
    test('should provide diplomatic competitive analysis for low directness cultures', () => {
      const context: CulturalContext = {
        region: 'Asia Pacific',
        country: 'Japan',
        culturalScores: { hierarchy: 85, directness: 20, formality: 95, relationshipFirst: 80, individualismCollectivism: 25 },
        communicationStyle: 'contextual',
        businessCultureType: 'traditional',
        confidence: 0.95
      };
      
      const rules = CulturalDetectionService.getCulturalAdaptationRules(context);
      
      expect(rules.competitiveAnalysis).toContain('Frame comparisons diplomatically');
      expect(rules.competitiveAnalysis).toContain('Focus on differentiation rather than superiority');
      expect(rules.riskCommunication).toBe('contextual_implications');
    });
  });
  
  describe('Edge Cases and Error Handling', () => {
    
    test('should handle empty domain gracefully', () => {
      const result = CulturalDetectionService.detectCulturalContext('', 'Test Company');
      
      expect(result.country).toBe('International');
      expect(result.confidence).toBe(0.60);
    });
    
    test('should handle malformed domains', () => {
      const result = CulturalDetectionService.detectCulturalContext('not-a-domain', 'Test Company');
      
      expect(result.country).toBe('International');
      expect(result.region).toBe('Global');
    });
    
    test('should handle special TLD cases', () => {
      const result = CulturalDetectionService.detectCulturalContext('test.co.uk', 'British Company');
      
      expect(result.country).toBe('United Kingdom');
      expect(result.region).toBe('Europe');
    });
  });
  
  describe('Performance and Scalability', () => {
    
    test('should perform cultural detection quickly', () => {
      const start = performance.now();
      
      for (let i = 0; i < 100; i++) {
        CulturalDetectionService.detectCulturalContext(`test${i}.com`, `Test Company ${i}`);
      }
      
      const end = performance.now();
      const averageTime = (end - start) / 100;
      
      expect(averageTime).toBeLessThan(1); // Should be under 1ms per detection
    });
    
    test('should generate adaptation rules quickly', () => {
      const context: CulturalContext = {
        region: 'North America',
        country: 'United States',
        culturalScores: { hierarchy: 25, directness: 85, formality: 40, relationshipFirst: 30, individualismCollectivism: 90 },
        communicationStyle: 'direct',
        businessCultureType: 'enterprise',
        confidence: 0.95
      };
      
      const start = performance.now();
      
      for (let i = 0; i < 100; i++) {
        CulturalDetectionService.getCulturalAdaptationRules(context);
      }
      
      const end = performance.now();
      const averageTime = (end - start) / 100;
      
      expect(averageTime).toBeLessThan(0.5); // Should be under 0.5ms per rule generation
    });
  });
});