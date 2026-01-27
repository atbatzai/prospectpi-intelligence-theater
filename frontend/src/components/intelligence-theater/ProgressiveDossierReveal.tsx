/**
 * Progressive Dossier Reveal Component
 * Story 2.1.4: Progressive disclosure for time-pressed users
 * 
 * Shows executive summary first, then reveals full report progressively
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, Download, Share2, RefreshCw, Sparkles } from 'lucide-react';

interface DossierSection {
  id: string;
  title: string;
  content: string;
  confidence: number;
  priority: 'high' | 'medium' | 'low';
  expandable: boolean;
}

interface ProgressiveDossierRevealProps {
  companyName: string;
  executiveSummary: string;
  sections: DossierSection[];
  onShare?: () => void;
  onExport?: () => void;
  onGenerateAnother?: () => void;
}

export const ProgressiveDossierReveal: React.FC<ProgressiveDossierRevealProps> = ({
  companyName,
  executiveSummary,
  sections,
  onShare,
  onExport,
  onGenerateAnother
}) => {
  const [showFullReport, setShowFullReport] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const getConfidenceBadgeVariant = (confidence: number) => {
    if (confidence >= 90) return 'default';
    if (confidence >= 75) return 'secondary';
    return 'outline';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-600';
    if (confidence >= 75) return 'text-blue-600';
    return 'text-yellow-600';
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Executive Summary - Always Visible */}
      <Card className="border-2 border-brand-purple-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-brand-purple-50 to-brand-navy-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="h-6 w-6 text-brand-purple-600" />
              <CardTitle className="text-2xl">
                {companyName} - Executive Intelligence Summary
              </CardTitle>
            </div>
            <Badge variant="default" className="bg-green-500">
              Ready
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="prose max-w-none">
            <p className="text-lg leading-relaxed text-gray-700">
              {executiveSummary}
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
            <Button 
              onClick={onExport}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export PDF
            </Button>
            <Button 
              onClick={onShare}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Share2 className="h-4 w-4" />
              Share
            </Button>
            <Button 
              onClick={onGenerateAnother}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Generate Another
            </Button>
            <Button 
              onClick={() => setShowFullReport(!showFullReport)}
              className="detective-button-primary flex items-center gap-2 ml-auto"
            >
              {showFullReport ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  Hide Full Report
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  Reveal Full Report
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Progressive Full Report Sections */}
      {showFullReport && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-brand-navy-900 flex items-center gap-2">
            <ChevronDown className="h-6 w-6" />
            Detailed Intelligence Sections
          </h2>
          
          {sections.map((section) => (
            <Card 
              key={section.id} 
              className="border transition-all"
            >
              <CardHeader 
                className="cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => section.expandable && toggleSection(section.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-lg">{section.title}</CardTitle>
                    <Badge 
                      variant={getConfidenceBadgeVariant(section.confidence)}
                      className={getConfidenceColor(section.confidence)}
                    >
                      {section.confidence}% confidence
                    </Badge>
                  </div>
                  {section.expandable && (
                    <Button variant="ghost" size="sm">
                      {expandedSections.has(section.id) ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              </CardHeader>
              
              {(!section.expandable || expandedSections.has(section.id)) && (
                <CardContent>
                  <div className="prose max-w-none">
                    <p className="text-gray-700 whitespace-pre-line">
                      {section.content}
                    </p>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
