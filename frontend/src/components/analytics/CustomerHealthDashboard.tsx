/**
 * Story 6.2: Customer Health Scoring & Retention Analytics
 * 
 * ML-based churn prediction, engagement scoring (0-100), at-risk customer alerts,
 * retention campaigns, customer lifecycle tracking
 */

'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, AlertTriangle, TrendingDown, Mail, Calendar, Target } from 'lucide-react';

interface Customer {
  id: string;
  company: string;
  healthScore: number;
  churnRisk: 'low' | 'medium' | 'high';
  lastActive: string;
  engagement: {
    dossiersThisMonth: number;
    avgSessionTime: string;
    featureUsage: number;
  };
}

export const CustomerHealthDashboard: React.FC = () => {
  const customers: Customer[] = [
    {
      id: '1',
      company: 'Acme Corp',
      healthScore: 92,
      churnRisk: 'low',
      lastActive: '2 hours ago',
      engagement: { dossiersThisMonth: 47, avgSessionTime: '18m', featureUsage: 85 }
    },
    {
      id: '2',
      company: 'TechStart Inc',
      healthScore: 45,
      churnRisk: 'high',
      lastActive: '12 days ago',
      engagement: { dossiersThisMonth: 2, avgSessionTime: '4m', featureUsage: 23 }
    },
    {
      id: '3',
      company: 'Global Ventures',
      healthScore: 68,
      churnRisk: 'medium',
      lastActive: '1 day ago',
      engagement: { dossiersThisMonth: 15, avgSessionTime: '11m', featureUsage: 56 }
    }
  ];

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'low':
        return <Badge className="bg-green-100 text-green-800">Low Risk</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800">Medium Risk</Badge>;
      case 'high':
        return <Badge className="bg-red-100 text-red-800">High Risk</Badge>;
      default:
        return null;
    }
  };

  const handleRetentionCampaign = (customerId: string) => {
    console.log(`Launching retention campaign for customer ${customerId}...`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-detective-primary flex items-center gap-2">
          <Heart className="h-6 w-6" />
          Customer Health & Retention
        </h2>
        <p className="text-gray-600 mt-1">Monitor customer engagement and predict churn risk</p>
      </div>

      {/* Health Score Summary */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Heart className="h-5 w-5 text-green-600" />
              <Badge className="bg-green-100 text-green-800">67%</Badge>
            </div>
            <div className="text-2xl font-bold">142</div>
            <div className="text-sm text-gray-600">Healthy Customers</div>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-yellow-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <Badge className="bg-yellow-100 text-yellow-800">24%</Badge>
            </div>
            <div className="text-2xl font-bold">51</div>
            <div className="text-sm text-gray-600">At Risk</div>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <TrendingDown className="h-5 w-5 text-red-600" />
              <Badge className="bg-red-100 text-red-800">9%</Badge>
            </div>
            <div className="text-2xl font-bold">19</div>
            <div className="text-sm text-gray-600">High Churn Risk</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Target className="h-5 w-5 text-purple-600" />
              <Badge variant="outline">+3% MoM</Badge>
            </div>
            <div className="text-2xl font-bold">94%</div>
            <div className="text-sm text-gray-600">Retention Rate</div>
          </CardContent>
        </Card>
      </div>

      {/* Customer Health Details */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Health Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {customers.map((customer) => (
              <div key={customer.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="font-semibold text-lg">{customer.company}</div>
                      <div className="text-sm text-gray-600">Last active: {customer.lastActive}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${getHealthColor(customer.healthScore)}`}>
                        {customer.healthScore}
                      </div>
                      <div className="text-xs text-gray-500">Health Score</div>
                    </div>
                    {getRiskBadge(customer.churnRisk)}
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-3 mb-3">
                  <div className="p-3 bg-gray-50 rounded">
                    <div className="text-sm text-gray-600">Dossiers This Month</div>
                    <div className="text-xl font-bold">{customer.engagement.dossiersThisMonth}</div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <div className="text-sm text-gray-600">Avg Session Time</div>
                    <div className="text-xl font-bold">{customer.engagement.avgSessionTime}</div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <div className="text-sm text-gray-600">Feature Usage</div>
                    <div className="text-xl font-bold">{customer.engagement.featureUsage}%</div>
                  </div>
                </div>

                {customer.churnRisk !== 'low' && (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleRetentionCampaign(customer.id)}
                      size="sm"
                      variant="outline"
                      className="text-sm"
                    >
                      <Mail className="h-3 w-3 mr-1" />
                      Launch Retention Campaign
                    </Button>
                    <Button size="sm" variant="outline" className="text-sm">
                      <Calendar className="h-3 w-3 mr-1" />
                      Schedule Check-in
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
