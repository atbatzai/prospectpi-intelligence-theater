/**
 * Story 2.4.3: Adaptive Dossier Transformation
 * 
 * Culturally appropriate dossier presentation with executive summary adaptation,
 * competitive framing, risk communication style, and relationship context emphasis
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Globe, TrendingUp, AlertCircle, Users, Briefcase } from 'lucide-react';
import { CulturalContext } from '@/services/CulturalDetectionService';

interface AdaptiveDossierProps {
  culturalContext: CulturalContext;
  executiveSummary: string;
  competitiveAnalysis: string;
  risks: string[];
  opportunities: string[];
}

export const AdaptiveDossierTransformation: React.FC<AdaptiveDossierProps> = ({
  culturalContext,
  executiveSummary,
  competitiveAnalysis,
  risks,
  opportunities
}) => {
  const { culturalDimensions, country } = culturalContext;

  // Determine presentation style based on cultural dimensions
  const isHierarchical = culturalDimensions.hierarchy > 60;
  const isDirect = culturalDimensions.directness > 60;
  const isFormal = culturalDimensions.formality > 60;
  const isRelationshipFirst = culturalDimensions.relationshipFirst > 60;
  const isEngineeringFocused = culturalDimensions.engineeringFocus > 60;

  return (
    <div className="space-y-6">
      {/* Cultural Adaptation Badge */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between p-4 bg-gradient-to-r from-detective-primary/10 to-detective-secondary/10 rounded-lg border border-detective-primary/20"
      >
        <div className="flex items-center gap-3">
          <Globe className="h-5 w-5 text-detective-secondary" />
          <div>
            <div className="font-semibold text-detective-primary">
              Culturally Adapted for {country}
            </div>
            <div className="text-sm text-gray-600">
              {isDirect ? 'Direct' : 'Contextual'} communication •{' '}
              {isFormal ? 'Formal' : 'Informal'} presentation •{' '}
              {isRelationshipFirst ? 'Relationship-focused' : 'Task-focused'}
            </div>
          </div>
        </div>
        <Badge className="bg-detective-secondary text-white">
          Cultural Intelligence Applied
        </Badge>
      </motion.div>

      {/* Executive Summary - Adapted */}
      <Card className="border-detective-primary/20">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Briefcase className="h-5 w-5 text-detective-primary" />
            <h3 className="text-lg font-semibold text-detective-primary">
              {isHierarchical ? 'Executive Leadership Brief' : 'Summary Overview'}
            </h3>
          </div>
          
          {isHierarchical && (
            <div className="mb-4 p-3 bg-yellow-50 border-l-4 border-yellow-400 text-sm">
              <strong>Note for Senior Leadership:</strong> Hierarchical decision-making culture detected.
              This brief is tailored for executive stakeholders.
            </div>
          )}

          <p className={`${isFormal ? 'leading-relaxed' : 'leading-normal'} text-gray-700`}>
            {executiveSummary}
          </p>

          {isEngineeringFocused && (
            <Badge variant="outline" className="mt-2">
              Technical details emphasized for engineering-focused culture
            </Badge>
          )}
        </CardContent>
      </Card>

      {/* Competitive Analysis - Culturally Framed */}
      <Card className="border-detective-primary/20">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-detective-secondary" />
            <h3 className="text-lg font-semibold text-detective-primary">
              {isDirect ? 'Competitive Position' : 'Market Context & Positioning'}
            </h3>
          </div>

          <p className="text-gray-700">{competitiveAnalysis}</p>

          {!isDirect && (
            <div className="mt-3 p-3 bg-blue-50 border-l-4 border-blue-400 text-sm">
              <strong>Cultural Note:</strong> Competitive positioning presented with contextual nuance
              appropriate for indirect communication preference.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Risk Communication - Style Adapted */}
      <Card className="border-detective-primary/20">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            <h3 className="text-lg font-semibold text-detective-primary">
              {isDirect ? 'Risk Warnings' : 'Risk Considerations'}
            </h3>
          </div>

          <div className="space-y-3">
            {risks.map((risk, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg ${
                  isDirect
                    ? 'bg-red-50 border-l-4 border-red-500'
                    : 'bg-gray-50 border-l-4 border-gray-400'
                }`}
              >
                <div className="font-medium mb-1">
                  {isDirect ? '⚠️ Direct Warning:' : '💡 Consideration:'}
                </div>
                <p className="text-sm text-gray-700">{risk}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Relationship Context - Emphasized for Relationship-First Cultures */}
      {isRelationshipFirst && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="border-detective-secondary/40 bg-gradient-to-br from-detective-secondary/5 to-white">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Users className="h-5 w-5 text-detective-secondary" />
                <h3 className="text-lg font-semibold text-detective-secondary">
                  Relationship-Building Approach
                </h3>
              </div>

              <div className="space-y-3">
                <p className="text-gray-700">
                  <strong>Cultural Insight:</strong> {country} business culture values relationship-building
                  before transactional discussions. Recommended approach:
                </p>
                <ul className="list-disc list-inside space-y-2 text-sm text-gray-700 ml-4">
                  <li>Invest time in personal connection and trust-building</li>
                  <li>Demonstrate long-term commitment to the relationship</li>
                  <li>Show respect for hierarchy and decision-making processes</li>
                  <li>Be patient with consensus-building timelines</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Cultural Adaptation Success Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="Hierarchy"
          value={culturalDimensions.hierarchy}
          icon="📊"
        />
        <MetricCard
          label="Directness"
          value={culturalDimensions.directness}
          icon="💬"
        />
        <MetricCard
          label="Formality"
          value={culturalDimensions.formality}
          icon="👔"
        />
        <MetricCard
          label="Relationship Focus"
          value={culturalDimensions.relationshipFirst}
          icon="🤝"
        />
      </div>
    </div>
  );
};

interface MetricCardProps {
  label: string;
  value: number;
  icon: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, icon }) => (
  <div className="p-4 bg-white border border-gray-200 rounded-lg text-center">
    <div className="text-2xl mb-2">{icon}</div>
    <div className="text-sm text-gray-600 mb-1">{label}</div>
    <div className="text-lg font-bold text-detective-primary">{value}%</div>
  </div>
);
