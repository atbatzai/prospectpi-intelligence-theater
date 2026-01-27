/**
 * YOLO User Dashboard - Complete SaaS Dossier Management
 */
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
// import { Separator } from "@/components/ui/separator";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
import { Calendar, FileText, TrendingUp, User, Archive, Download, Share2, Users, Lock, Eye, Edit, Shield } from "lucide-react";

interface Dossier {
  id: string;
  request_id: string;
  company_name: string;
  confidence_score: number;
  source_count: number;
  generated_at: string;
  classification: string;
  export_count: number;
  is_archived: boolean;
  // UX EXPERT: Sharing & collaboration fields
  permission_level?: string;
  shared_by_email?: string;
  is_shared?: boolean;
  share_count?: number;
}

interface UserStats {
  subscription_plan: string;
  subscription_status: string;
  dossiers_used_this_month: number;
  dossier_limit: number;
  trial_ends_at?: string;
}

export const UserDashboard = () => {
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [sharedDossiers, setSharedDossiers] = useState<Dossier[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'my-dossiers' | 'shared-with-me'>('my-dossiers');

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      
      const [profileRes, dossiersRes, sharedRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/v1/auth/profile`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch(`${API_BASE_URL}/api/v1/research/dossiers`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch(`${API_BASE_URL}/api/v1/research/shared`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
      ]);

      if (!profileRes.ok || !dossiersRes.ok) {
        throw new Error('Failed to fetch user data');
      }

      const [profile, dossiersData, sharedData] = await Promise.all([
        profileRes.json(),
        dossiersRes.json(),
        sharedRes.ok ? sharedRes.json() : { data: { dossiers: [] } }
      ]);

      setUserStats(profile.user);
      setDossiers(dossiersData.data.dossiers);
      setSharedDossiers(sharedData.data.dossiers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getUsagePercentage = () => {
    if (!userStats) return 0;
    return (userStats.dossiers_used_this_month / userStats.dossier_limit) * 100;
  };

  const getSubscriptionBadge = () => {
    if (!userStats) return null;
    
    const colors = {
      starter: 'bg-blue-100 text-blue-800',
      professional: 'bg-green-100 text-green-800',
      enterprise: 'bg-purple-100 text-purple-800'
    };

    return (
      <Badge className={colors[userStats.subscription_plan as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {userStats.subscription_plan.charAt(0).toUpperCase() + userStats.subscription_plan.slice(1)}
      </Badge>
    );
  };

  // UX EXPERT: Permission level visualization
  const getPermissionIcon = (level?: string) => {
    switch(level) {
      case 'admin': return <Shield className="h-4 w-4 text-purple-600" />;
      case 'export': return <Download className="h-4 w-4 text-green-600" />;
      case 'comment': return <Edit className="h-4 w-4 text-blue-600" />;
      case 'read': return <Eye className="h-4 w-4 text-gray-600" />;
      default: return <Lock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getPermissionLabel = (level?: string) => {
    switch(level) {
      case 'admin': return 'Full Access';
      case 'export': return 'Can Export';
      case 'comment': return 'Can Comment';
      case 'read': return 'View Only';
      default: return 'Owner';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="text-red-800">
              <h3 className="font-semibold mb-2">Error Loading Dashboard</h3>
              <p>{error}</p>
              <Button onClick={fetchUserData} className="mt-4" variant="outline">
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage your intelligence dossiers and account</p>
        </div>
        {getSubscriptionBadge()}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usage This Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userStats?.dossiers_used_this_month || 0} / {userStats?.dossier_limit || 0}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${Math.min(getUsagePercentage(), 100)}%` }}
              ></div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {Math.round(getUsagePercentage())}% of monthly limit used
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Dossiers</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dossiers.length}</div>
            <p className="text-xs text-muted-foreground">
              {dossiers.filter(d => !d.is_archived).length} active, {dossiers.filter(d => d.is_archived).length} archived
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shared With Me</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sharedDossiers.length}</div>
            <p className="text-xs text-muted-foreground">
              Collaborative intelligence reports
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Account Status</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{userStats?.subscription_status || 'Unknown'}</div>
            {userStats?.trial_ends_at && userStats.subscription_status === 'trial' && (
              <p className="text-xs text-muted-foreground">
                Trial ends {formatDate(userStats.trial_ends_at)}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* UX EXPERT: Enhanced Tabbed Interface */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Intelligence Dossiers</CardTitle>
              <CardDescription>
                Manage your generated reports and collaborative workspace
              </CardDescription>
            </div>
            
            {/* Tab Navigation */}
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('my-dossiers')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'my-dossiers'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  My Dossiers ({dossiers.length})
                </div>
              </button>
              <button
                onClick={() => setActiveTab('shared-with-me')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'shared-with-me'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Shared ({sharedDossiers.length})
                </div>
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* UX EXPERT: Tab Content */}
          {activeTab === 'my-dossiers' && (
            <>
              {dossiers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="mx-auto h-12 w-12 mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium mb-2">No dossiers yet</h3>
                  <p className="mb-4">Generate your first intelligence dossier to get started</p>
                  <Button>Generate Dossier</Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {dossiers.map((dossier) => (
                    <div key={dossier.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-lg">{dossier.company_name}</h3>
                            <Badge variant={dossier.is_archived ? 'secondary' : 'default'}>
                              {dossier.is_archived ? 'Archived' : 'Active'}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {dossier.classification}
                            </Badge>
                            {getPermissionIcon()}
                            <span className="text-xs text-gray-500">{getPermissionLabel()}</span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {formatDate(dossier.generated_at)}
                            </div>
                            <div>Confidence: {dossier.confidence_score}%</div>
                            <div>Sources: {dossier.source_count}</div>
                            <div>Downloads: {dossier.export_count}</div>
                            {dossier.share_count && (
                              <div className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                Shared with {dossier.share_count}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            <Share2 className="h-4 w-4 mr-1" />
                            Share
                          </Button>
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                          {!dossier.is_archived && (
                            <Button variant="outline" size="sm">
                              <Archive className="h-4 w-4 mr-1" />
                              Archive
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Shared Dossiers Tab */}
          {activeTab === 'shared-with-me' && (
            <>
              {sharedDossiers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="mx-auto h-12 w-12 mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium mb-2">No shared dossiers</h3>
                  <p className="mb-4">Dossiers shared with you will appear here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sharedDossiers.map((dossier) => (
                    <div key={dossier.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors border-l-4 border-l-blue-400">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-lg">{dossier.company_name}</h3>
                            <Badge variant="outline" className="text-blue-700 border-blue-200 bg-blue-50">
                              Shared
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {dossier.classification}
                            </Badge>
                            {getPermissionIcon(dossier.permission_level)}
                            <span className="text-xs text-gray-500">{getPermissionLabel(dossier.permission_level)}</span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {formatDate(dossier.generated_at)}
                            </div>
                            <div>Confidence: {dossier.confidence_score}%</div>
                            <div>Sources: {dossier.source_count}</div>
                            {dossier.shared_by_email && (
                              <div className="flex items-center gap-1">
                                <User className="h-4 w-4" />
                                Shared by {dossier.shared_by_email}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {['export', 'admin'].includes(dossier.permission_level || '') && (
                            <Button variant="outline" size="sm">
                              <Download className="h-4 w-4 mr-1" />
                              Download
                            </Button>
                          )}
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};