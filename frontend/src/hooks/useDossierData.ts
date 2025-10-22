import { useState, useCallback } from 'react';
import { DossierData } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const useDossierData = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dossierData, setDossierData] = useState<DossierData | null>(null);

  const fetchDossier = useCallback(async (requestId: string): Promise<DossierData | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/research/${requestId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch dossier: ${response.statusText}`);
      }

      const data: DossierData = await response.json();
      setDossierData(data);
      return data;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch dossier';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const exportDossierPDF = useCallback(async (dossier: DossierData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/research/${dossier.id}/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ format: 'pdf' }),
      });

      if (!response.ok) {
        throw new Error('Failed to export PDF');
      }

      // Create download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${dossier.companyName}-intelligence-dossier.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export PDF';
      setError(errorMessage);
    }
  }, []);

  const createMockDossier = useCallback((companyName: string): DossierData => {
    return {
      id: `dossier-${Date.now()}`,
      companyName,
      vendorName: 'Demo Vendor',
      productName: 'Demo Product',
      industry: 'Technology',
      primaryPainPoint: 'Digital transformation',
      classification: 'BUSINESS INTELLIGENCE',
      generatedAt: new Date().toISOString(),
      confidence: 87,
      sourceCount: 12,
      solutionRelevanceScore: 75,
      executiveSummary: `Comprehensive intelligence analysis of ${companyName} reveals a technology-forward organization with strong market positioning and growth trajectory. Key findings indicate strategic focus on innovation, competitive advantages in core markets, and emerging expansion opportunities.`,
      structuredSections: {
        executiveSummary: {
          summary: `Comprehensive intelligence analysis of ${companyName} reveals a technology-forward organization with strong market positioning and growth trajectory.`,
          solutionRelevanceScore: 75,
          keyOpportunities: ['Digital transformation initiatives', 'Market expansion potential', 'Technology modernization'],
          criticalRisks: ['Market competition', 'Technology disruption', 'Implementation complexity']
        },
        painPointAlignment: {
          primaryPainPoint: {
            challenge: 'Digital transformation',
            evidence: ['Technology gaps identified', 'Process inefficiencies noted', 'Legacy system constraints'],
            solutionFit: 'High alignment with vendor capabilities',
            confidence: 'high'
          }
        },
        competitiveIntelligence: {
          currentVendors: [
            { vendor: 'Competitor A', products: ['Legacy Solution'], relationship: 'competitor' }
          ],
          competitorThreat: 'medium',
          competitiveAdvantages: ['Innovation focus', 'Customer satisfaction', 'Proven implementation'],
          threats: ['Market competition', 'Price pressure']
        },
        budgetIntelligence: {
          estimatedBudget: '500K-1M',
          budgetCycle: 'Q1 planning cycle',
          spendingPatterns: ['Technology modernization', 'Operational efficiency', 'Digital initiatives'],
          budgetFitAnalysis: 'Strong budget alignment with strategic priorities',
          decisionMakers: [
            { role: 'CTO', influence: 'high' },
            { role: 'CFO', influence: 'medium' }
          ]
        },
        technologyIntelligence: {
          currentStack: [
            { category: 'Infrastructure', technologies: ['Legacy systems', 'On-premise servers'] },
            { category: 'Cloud', technologies: ['AWS migration in progress', 'Hybrid architecture'] }
          ],
          modernizationSignals: ['Cloud migration initiatives', 'API development projects', 'DevOps adoption'],
          implementationReadiness: 'needs-prep',
          technicalRequirements: ['Cloud infrastructure', 'API development', 'Integration capabilities']
        },
        marketPosition: {
          industryContext: 'Leading position in technology sector with strong growth indicators',
          marketTrends: ['Digital adoption', 'Automation trends', 'Cloud-first strategies'],
          growthSignals: ['Revenue growth', 'Market expansion', 'Technology investments'],
          riskFactors: ['Market competition', 'Technology disruption', 'Economic uncertainty'],
          strategicInitiatives: ['Digital transformation', 'Market expansion', 'Innovation programs']
        },
        strategicRecommendations: {
          approachStrategy: 'Executive-focused approach emphasizing ROI and strategic alignment',
          keyMessaging: ['Focus on digital transformation ROI', 'Emphasize scalability benefits', 'Highlight competitive advantages'],
          stakeholderStrategy: [
            { role: 'CTO', approach: 'Technical deep dive', keyPoints: ['Architecture alignment', 'Implementation roadmap'] },
            { role: 'CFO', approach: 'Business case focus', keyPoints: ['ROI projections', 'Cost optimization'] }
          ],
          timeline: '30-60 days for decision cycle',
          nextSteps: ['Executive presentation', 'Technical deep dive', 'Proof of concept']
        }
      },
      sections: [
        {
          id: 'company-overview',
          title: 'Company Overview & Market Position',
          content: `${companyName} operates as a leading entity in their respective market segment, demonstrating consistent growth patterns and strategic market positioning. The organization exhibits strong operational capabilities and maintains competitive advantages through technology innovation and market expertise.`,
          confidence: 'high',
          sources: [
            {
              id: 'src-1',
              name: 'TheirStack Technology Profile',
              confidence: 92,
              freshness: '2 hours ago',
              type: 'theirstack',
              url: 'https://theirstack.com/example'
            },
            {
              id: 'src-2',
              name: 'Market Analysis Report',
              confidence: 85,
              freshness: '1 day ago',
              type: 'marketaux'
            }
          ],
          expandable: true
        },
        {
          id: 'financial-health',
          title: 'Financial Health & Performance',
          content: 'Financial indicators suggest stable revenue growth with strategic investments in key areas. The organization demonstrates prudent financial management and maintains healthy operational metrics across core business functions.',
          confidence: 'medium',
          sources: [
            {
              id: 'src-3',
              name: 'Financial Data Analysis',
              confidence: 78,
              freshness: '6 hours ago',
              type: 'marketaux'
            }
          ],
          expandable: true
        },
        {
          id: 'competitive-landscape',
          title: 'Competitive Analysis & Positioning',
          content: 'Market analysis reveals strong competitive positioning with clear differentiation factors. The organization maintains competitive advantages through strategic initiatives and operational excellence.',
          confidence: 'high',
          sources: [
            {
              id: 'src-4',
              name: 'Competitive Intelligence Report',
              confidence: 89,
              freshness: '4 hours ago',
              type: 'perplexity'
            }
          ],
          expandable: true
        }
      ]
    };
  }, []);

  return {
    dossierData,
    isLoading,
    error,
    fetchDossier,
    exportDossierPDF,
    createMockDossier,
    clearError: () => setError(null),
  };
};