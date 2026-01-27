'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight, Share2, Download, Sparkles, TrendingUp, AlertCircle, CheckCircle, BookmarkPlus, RefreshCw } from 'lucide-react';

interface DossierSection {
  id: string;
  title: string;
  content: string;
  confidence: 'high' | 'medium' | 'low';
  priority: 'critical' | 'important' | 'supplemental';
  loadingState?: 'loading' | 'complete' | 'error';
}

interface ProgressiveDossierRevealProps {
  companyName: string;
  executiveSummary: string;
  sections: DossierSection[];
  onShare?: () => void;
  onExport?: () => void;
  onGenerateAnother?: () => void;
  isLoading?: boolean;
}

const ConfidenceBadge: React.FC<{ confidence: DossierSection['confidence'] }> = ({ confidence }) => {
  const config = {
    high: { icon: CheckCircle, color: 'bg-green-100 text-green-800', emoji: '🟢' },
    medium: { icon: AlertCircle, color: 'bg-yellow-100 text-yellow-800', emoji: '🟡' },
    low: { icon: AlertCircle, color: 'bg-red-100 text-red-800', emoji: '🔴' }
  };
  
  const { color, emoji } = config[confidence];
  
  return (
    <Badge className={`${color} font-semibold`}>
      {emoji} {confidence.toUpperCase()}
    </Badge>
  );
};

export const ProgressiveDossierReveal: React.FC<ProgressiveDossierRevealProps> = ({
  companyName,
  executiveSummary,
  sections = [],
  onShare,
  onExport,
  onGenerateAnother,
  isLoading = false
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [showFullReport, setShowFullReport] = useState(false);
  
  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };
  
  const criticalSections = sections.filter(s => s.priority === 'critical');
  const importantSections = sections.filter(s => s.priority === 'important');
  const supplementalSections = sections.filter(s => s.priority === 'supplemental');
  
  useEffect(() => {
    // Auto-expand critical sections
    const criticalIds = criticalSections.map(s => s.id);
    setExpandedSections(new Set(criticalIds));
  }, [sections]);
  
  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Executive Summary - Always Visible */}
      <Card className="border-brand-purple-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-brand-navy-50 to-brand-purple-50 rounded-t-lg">
          <CardTitle className="flex items-center gap-3 text-brand-navy-900">
            <TrendingUp className="h-6 w-6 text-brand-purple-600" />
            Executive Summary: {companyName}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="prose prose-gray max-w-none">
            <p className="text-lg leading-relaxed text-gray-700">
              {executiveSummary || 'Generating comprehensive intelligence summary...'}
            </p>
          </div>
          
          {!showFullReport && (
            <div className="mt-6 text-center">
              <Button 
                onClick={() => setShowFullReport(true)}
                className="detective-button-primary px-8 py-3 text-lg"
                disabled={isLoading}
              >
                <Sparkles className="h-5 w-5 mr-2" />
                Reveal Full Intelligence Report
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Progressive Disclosure - Full Report */}
      {showFullReport && (
        <div className="space-y-4">
          {/* Critical Insights */}
          {criticalSections.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xl font-bold text-brand-navy-900 mb-4 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                Critical Intelligence
              </h3>
              {criticalSections.map(section => (
                <SectionCard 
                  key={section.id}
                  section={section}
                  isExpanded={expandedSections.has(section.id)}
                  onToggle={() => toggleSection(section.id)}
                />
              ))}
            </div>
          )}
          
          {/* Important Insights */}
          {importantSections.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xl font-bold text-brand-navy-900 mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-500" />
                Important Intelligence
              </h3>
              {importantSections.map(section => (
                <SectionCard 
                  key={section.id}
                  section={section}
                  isExpanded={expandedSections.has(section.id)}
                  onToggle={() => toggleSection(section.id)}
                />
              ))}
            </div>
          )}
          
          {/* Supplemental Insights */}
          {supplementalSections.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xl font-bold text-brand-navy-900 mb-4">Additional Intelligence</h3>
              {supplementalSections.map(section => (
                <SectionCard 
                  key={section.id}
                  section={section}
                  isExpanded={expandedSections.has(section.id)}
                  onToggle={() => toggleSection(section.id)}
                />
              ))}
            </div>
          )}
          
          {/* Action Buttons */}
          <Card className="bg-gradient-to-r from-brand-navy-50 to-brand-purple-50">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  onClick={onShare}
                  variant="outline"
                  className="detective-button-secondary flex-1 sm:flex-none px-6 py-3"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Report
                </Button>
                
                <Button 
                  onClick={onExport}
                  variant="outline"
                  className="detective-button-secondary flex-1 sm:flex-none px-6 py-3"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export PDF
                </Button>
                
                <Button 
                  onClick={onGenerateAnother}
                  className="detective-button-primary flex-1 sm:flex-none px-6 py-3"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Another
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

const SectionCard: React.FC<{
  section: DossierSection;
  isExpanded: boolean;
  onToggle: () => void;
}> = ({ section, isExpanded, onToggle }) => {
  return (
    <Card className="hover:shadow-md transition-all duration-200 touch-target">
      <CardHeader 
        className="cursor-pointer py-4 hover:bg-gray-50 rounded-t-lg"
        onClick={onToggle}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggle();
          }
        }}
        style={{ minHeight: '44px' }} // Mobile touch target
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            {isExpanded ? (
              <ChevronDown className="h-5 w-5 text-brand-navy-600 rotate-0 transition-transform" />
            ) : (
              <ChevronRight className="h-5 w-5 text-brand-navy-600 transition-transform" />
            )}
            <CardTitle className="text-lg font-semibold text-brand-navy-900 flex-1">
              {section.title}
            </CardTitle>
          </div>
          <ConfidenceBadge confidence={section.confidence} />
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="pt-0 pb-4">
          <div className="prose prose-gray max-w-none ml-8">
            <div dangerouslySetInnerHTML={{ __html: section.content }} />
          </div>
        </CardContent>
      )}
    </Card>
  );
};