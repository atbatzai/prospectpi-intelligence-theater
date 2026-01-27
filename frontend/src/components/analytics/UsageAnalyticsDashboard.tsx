/**
 * Story 6.1: Usage Analytics & Insights Dashboard
 * 
 * User engagement metrics (DAU/WAU/MAU), feature adoption tracking,
 * conversion funnel analytics, cohort analysis
 */

'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, TrendingUp, Activity, Target, Calendar, BarChart } from 'lucide-react';

export const UsageAnalyticsDashboard: React.FC = () => {
  const metrics = {
    dau: 1247,
    wau: 5893,
    mau: 18432,
    avgSessionDuration: '12m 34s',
    dossiersGenerated: 3421,
    featureAdoption: {
      culturalIntelligence: 34,
      teamCollaboration: 67,
      powerUserMode: 23,
      mobileApp: 45
    },
    conversionFunnel: [
      { stage: 'Signup', users: 1000, conversionRate: 100 },
      { stage: 'First Dossier', users: 850, conversionRate: 85 },
      { stage: 'Second Dossier', users: 680, conversionRate: 68 },
      { stage: 'Paid Conversion', users: 410, conversionRate: 41 }
    ]
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-detective-primary flex items-center gap-2">
          <BarChart className="h-6 w-6" />
          Usage Analytics & Insights
        </h2>
        <p className="text-gray-600 mt-1">Track user engagement and feature adoption</p>
      </div>

      {/* Engagement Metrics */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="border-detective-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Users className="h-5 w-5 text-detective-primary" />
              <Badge variant="outline">+12%</Badge>
            </div>
            <div className="text-2xl font-bold">{metrics.dau.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Daily Active Users</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <Badge variant="outline">+8%</Badge>
            </div>
            <div className="text-2xl font-bold">{metrics.wau.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Weekly Active Users</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Activity className="h-5 w-5 text-purple-600" />
              <Badge variant="outline">+15%</Badge>
            </div>
            <div className="text-2xl font-bold">{metrics.mau.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Monthly Active Users</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <Badge variant="outline">{metrics.avgSessionDuration}</Badge>
            </div>
            <div className="text-2xl font-bold">{metrics.dossiersGenerated.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Dossiers Generated (30d)</div>
          </CardContent>
        </Card>
      </div>

      {/* Feature Adoption */}
      <Card>
        <CardHeader>
          <CardTitle>Feature Adoption Rates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(metrics.featureAdoption).map(([feature, adoption]) => (
              <div key={feature} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="capitalize">{feature.replace(/([A-Z])/g, ' $1').trim()}</span>
                  <span className="font-semibold">{adoption}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-detective-primary h-2 rounded-full transition-all"
                    style={{ width: `${adoption}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Conversion Funnel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Conversion Funnel (Trial → Paid)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metrics.conversionFunnel.map((stage, index) => (
              <div key={stage.stage} className="relative">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-detective-primary text-white flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <span className="font-medium">{stage.stage}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-600">{stage.users} users</span>
                    <Badge className={stage.conversionRate >= 70 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                      {stage.conversionRate}%
                    </Badge>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-detective-primary to-detective-secondary h-3 rounded-full"
                    style={{ width: `${stage.conversionRate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
