/**
 * Cultural Detection Service Unit Tests
 * Epic 2.4: Cultural Intelligence Dossiers
 * A+ Grade: Comprehensive test coverage for cultural detection
 */

import { CulturalDetectionService, CulturalContext } from '../../services/CulturalDetectionService';

describe('CulturalDetectionService', () => {
  let service: CulturalDetectionService;

  beforeEach(() => {
    service = new CulturalDetectionService();
  });

  describe('Cultural Detection Tests', () => {
    test('should detect US culture from .com domain', async () => {
      const context = await service.detectCulturalContext('microsoft.com', 'Microsoft Corporation');
      
      expect(context.region).toBe('North America');
      expect(context.country).toBe('United States');
      expect(context.culturalScores.directness).toBeGreaterThanOrEqual(75);
      expect(context.culturalScores.individualismCollectivism).toBeGreaterThanOrEqual(80);
      expect(context.confidence).toBeGreaterThanOrEqual(0.9);
    });

    test('should detect German culture from .de domain', async () => {
      const context = await service.detectCulturalContext('sap.de', 'SAP SE');
      
      expect(context.region).toBe('Europe');
      expect(context.country).toBe('Germany');
      expect(context.culturalScores.formality).toBeGreaterThanOrEqual(80);
      expect(context.culturalScores.directness).toBeGreaterThanOrEqual(90);
      expect(context.businessCultureType).toBe('engineering');
    });

    test('should detect Japanese culture from .co.jp domain', async () => {
      const context = await service.detectCulturalContext('toyota.co.jp', 'Toyota Motor Corporation');
      
      expect(context.region).toBe('Asia Pacific');
      expect(context.country).toBe('Japan');
      expect(context.culturalScores.hierarchy).toBeGreaterThanOrEqual(80);
      expect(context.culturalScores.relationshipFirst).toBeGreaterThanOrEqual(75);
      expect(context.communicationStyle).toBe('contextual');
    });

    test('should handle Singapore multi-cultural environment', async () => {
      const context = await service.detectCulturalContext('grab.com.sg', 'Grab Holdings');
      
      expect(context.region).toBe('Asia Pacific');
      expect(context.country).toBe('Singapore');
      expect(context.culturalScores.directness).toBeGreaterThanOrEqual(60);
      expect(context.businessCultureType).toBe('startup');
    });

    test('should provide fallback for unknown domain', async () => {
      const context = await service.detectCulturalContext('example.xyz', 'Unknown Company');
      
      expect(context.region).toBe('Global');
      expect(context.country).toBe('International');
      expect(context.confidence).toBeLessThan(0.7);
      expect(context.communicationStyle).toBe('diplomatic');
    });
  });

  describe('Cultural Adaptation Rules Tests', () => {
    test('should generate high-hierarchy adaptation rules for Japanese context', () => {
      const context: CulturalContext = {
        region: 'Asia Pacific',
        country: 'Japan',
        culturalScores: {
          hierarchy: 85,
          directness: 25,
          formality: 95,
          relationshipFirst: 80,
          individualismCollectivism: 30
        },
        communicationStyle: 'contextual',
        businessCultureType: 'traditional',
        confidence: 0.95
      };

      const rules = service.getCulturalAdaptationRules(context);
      
      expect(rules.communicationAdjustments.formalityLevel).toBe('very-high');
      expect(rules.communicationAdjustments.directnessLevel).toBe('indirect');
      expect(rules.structuralAdjustments.hierarchyEmphasis).toBe('high');
      expect(rules.contentAdjustments.relationshipEmphasis).toBe('high');
    });

    test('should generate direct communication rules for German context', () => {
      const context: CulturalContext = {
        region: 'Europe',
        country: 'Germany',
        culturalScores: {
          hierarchy: 45,
          directness: 95,
          formality: 85,
          relationshipFirst: 25,
          individualismCollectivism: 70
        },
        communicationStyle: 'direct',
        businessCultureType: 'engineering',
        confidence: 0.95
      };

      const rules = service.getCulturalAdaptationRules(context);
      
      expect(rules.communicationAdjustments.directnessLevel).toBe('very-direct');
      expect(rules.contentAdjustments.technicalDepth).toBe('high');
      expect(rules.structuralAdjustments.hierarchyEmphasis).toBe('medium');
    });

    test('should generate relationship-focused rules for collectivist cultures', () => {
      const context: CulturalContext = {
        region: 'Asia Pacific',
        country: 'South Korea',
        culturalScores: {
          hierarchy: 75,
          directness: 40,
          formality: 70,
          relationshipFirst: 85,
          individualismCollectivism: 25
        },
        communicationStyle: 'relationship-focused',
        businessCultureType: 'traditional',
        confidence: 0.90
      };

      const rules = service.getCulturalAdaptationRules(context);
      
      expect(rules.contentAdjustments.relationshipEmphasis).toBe('very-high');
      expect(rules.contentAdjustments.collectivismFocus).toBe('high');
      expect(rules.communicationAdjustments.contextualElements).toBe('high');
    });
  });

  describe('Performance Tests', () => {
    test('should detect culture within 100ms', async () => {
      const startTime = Date.now();
      await service.detectCulturalContext('apple.com', 'Apple Inc.');
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(100);
    });

    test('should handle batch cultural detection efficiently', async () => {
      const companies = [
        { domain: 'microsoft.com', name: 'Microsoft' },
        { domain: 'sap.de', name: 'SAP' },
        { domain: 'toyota.co.jp', name: 'Toyota' },
        { domain: 'samsung.co.kr', name: 'Samsung' },
        { domain: 'shopee.com.sg', name: 'Shopee' }
      ];

      const startTime = Date.now();
      const promises = companies.map(c => service.detectCulturalContext(c.domain, c.name));
      const results = await Promise.all(promises);
      const endTime = Date.now();
      
      expect(results).toHaveLength(5);
      expect(endTime - startTime).toBeLessThan(500); // Should complete batch in <500ms
      results.forEach(result => {
        expect(result.confidence).toBeGreaterThan(0.5);
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle malformed domains gracefully', async () => {
      const context = await service.detectCulturalContext('not-a-domain', 'Test Company');
      
      expect(context.region).toBe('Global');
      expect(context.confidence).toBeLessThan(0.7);
    });

    test('should handle empty company names', async () => {
      const context = await service.detectCulturalContext('example.com', '');
      
      expect(context).toBeDefined();
      expect(context.confidence).toBeLessThan(0.8);
    });

    test('should maintain cultural score bounds (0-100)', async () => {
      const context = await service.detectCulturalContext('test.com', 'Test Corp');
      
      Object.values(context.culturalScores).forEach(score => {
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
      });
    });
  });
});