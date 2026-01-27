/**
 * Story 6.3: Revenue & Cost Analytics
 * 
 * MRR/ARR tracking, customer LTV calculation, burn rate monitoring,
 * profitability metrics, revenue cohort analysis
 */

'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, Users, PieChart, Target, Calendar } from 'lucide-react';

export const RevenueAnalyticsDashboard: React.FC = () => {
  const metrics = {
    mrr: 147892,
    arr: 1774704,
    avgLTV: 8940,
    cac: 1250,
    ltvCacRatio: 7.15,
    burnRate: 45320,
    runway: 18,
    revenueGrowth: 23.4
  };

  const revenueByPlan = [
    { plan: 'Enterprise', revenue: 87450, customers: 12, color: 'bg-purple-600' },
    { plan: 'Professional', revenue: 45320, customers: 45, color: 'bg-blue-600' },
    { plan: 'Starter', revenue: 15122, customers: 134, color: 'bg-green-600' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-detective-primary flex items-center gap-2">
          <DollarSign className="h-6 w-6" />
          Revenue & Cost Analytics
        </h2>
        <p className="text-gray-600 mt-1">Track revenue, costs, and profitability metrics</p>
      </div>

      {/* Key Financial Metrics */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="border-detective-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="h-5 w-5 text-detective-primary" />
              <Badge className="bg-green-100 text-green-800">+23%</Badge>
            </div>
            <div className="text-2xl font-bold">${(metrics.mrr / 1000).toFixed(1)}K</div>
            <div className="text-sm text-gray-600">Monthly Recurring Revenue</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <Badge variant="outline">Annual</Badge>
            </div>
            <div className="text-2xl font-bold">${(metrics.arr / 1000000).toFixed(2)}M</div>
            <div className="text-sm text-gray-600">Annual Recurring Revenue</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Users className="h-5 w-5 text-blue-600" />
              <Badge className="bg-green-100 text-green-800">{metrics.ltvCacRatio.toFixed(1)}:1</Badge>
            </div>
            <div className="text-2xl font-bold">${(metrics.avgLTV / 1000).toFixed(1)}K</div>
            <div className="text-sm text-gray-600">Customer Lifetime Value</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Calendar className="h-5 w-5 text-purple-600" />
              <Badge variant="outline">{metrics.runway} months</Badge>
            </div>
            <div className="text-2xl font-bold">${(metrics.burnRate / 1000).toFixed(1)}K</div>
            <div className="text-sm text-gray-600">Monthly Burn Rate</div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue by Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Revenue Breakdown by Plan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {revenueByPlan.map((plan) => {
              const percentage = (plan.revenue / metrics.mrr) * 100;
              return (
                <div key={plan.plan}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${plan.color}`} />
                      <span className="font-medium">{plan.plan}</span>
                      <Badge variant="outline">{plan.customers} customers</Badge>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">${(plan.revenue / 1000).toFixed(1)}K</div>
                      <div className="text-sm text-gray-600">{percentage.toFixed(1)}%</div>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`${plan.color} h-2 rounded-full`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Unit Economics */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Unit Economics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span className="text-gray-600">Customer Acquisition Cost (CAC)</span>
                <span className="font-bold">${metrics.cac}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span className="text-gray-600">Customer Lifetime Value (LTV)</span>
                <span className="font-bold">${metrics.avgLTV}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded border border-green-200">
                <span className="text-gray-600 font-semibold">LTV:CAC Ratio</span>
                <Badge className="bg-green-100 text-green-800 text-lg">
                  {metrics.ltvCacRatio.toFixed(1)}:1
                </Badge>
              </div>
              <div className="text-sm text-gray-600 mt-2">
                Target: 3:1 minimum (Current: <span className="text-green-600 font-semibold">Excellent</span>)
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Growth Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span className="text-gray-600">MRR Growth Rate</span>
                <Badge className="bg-green-100 text-green-800">+{metrics.revenueGrowth}%</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span className="text-gray-600">New MRR This Month</span>
                <span className="font-bold text-green-600">+$12.4K</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span className="text-gray-600">Expansion MRR</span>
                <span className="font-bold text-blue-600">+$8.2K</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span className="text-gray-600">Churned MRR</span>
                <span className="font-bold text-red-600">-$1.8K</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
