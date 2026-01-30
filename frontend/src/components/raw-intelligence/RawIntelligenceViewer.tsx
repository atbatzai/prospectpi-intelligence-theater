/**
 * Raw Intelligence Viewer - BMad Option 3
 * 
 * Shows 100% of raw data from each source before synthesis.
 * Allows developers to see exactly what each API returned.
 */
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Database, 
  RefreshCw, 
  Download, 
  ChevronDown, 
  ChevronRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  FileJson,
  Layers,
  Search,
  ArrowLeft,
  ToggleLeft,
  ToggleRight,
  Code
} from "lucide-react";
import { SourceDataParser } from './SourceDataParsers';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface RawIntelligenceRequest {
  requestId: string;
  companyName: string;
  sourceCount: number;
  totalDataSize: number;
  createdAt: string;
}

interface SourceData {
  status: 'success' | 'error' | 'partial';
  confidence: number;
  dataSize: number;
  cost: number;
  responseTime: number;
  data: unknown;
  error?: string;
}

interface RawIntelligenceData {
  meta: {
    requestId: string;
    companyName: string;
    sourceCount: number;
    totalDataSize: number;
    totalDataSizeFormatted: string;
  };
  sources: Record<string, SourceData>;
}

// Source tier classification
const SOURCE_TIERS: Record<string, { tier: 'A' | 'B' | 'C'; label: string; color: string }> = {
  'greenhouse-jobs': { tier: 'A', label: 'Premium', color: 'bg-green-500' },
  'hackernews': { tier: 'A', label: 'Premium', color: 'bg-green-500' },
  'perplexity-deep': { tier: 'A', label: 'Premium', color: 'bg-green-500' },
  'builtwith': { tier: 'A', label: 'Premium', color: 'bg-green-500' },
  'github-repos': { tier: 'A', label: 'Premium', color: 'bg-green-500' },
  'stackexchange': { tier: 'B', label: 'Standard', color: 'bg-blue-500' },
  'google-news': { tier: 'B', label: 'Standard', color: 'bg-blue-500' },
  'bing-news': { tier: 'B', label: 'Standard', color: 'bg-blue-500' },
  'dnb-company': { tier: 'B', label: 'Standard', color: 'bg-blue-500' },
  'owler': { tier: 'B', label: 'Standard', color: 'bg-blue-500' },
  'coresignal': { tier: 'B', label: 'Standard', color: 'bg-blue-500' },
  'clearbit-company': { tier: 'C', label: 'Basic', color: 'bg-gray-500' },
  'wikipedia': { tier: 'C', label: 'Basic', color: 'bg-gray-500' },
  'securitytrails': { tier: 'C', label: 'Basic', color: 'bg-gray-500' },
  'shodan': { tier: 'C', label: 'Basic', color: 'bg-gray-500' },
};

export const RawIntelligenceViewer = () => {
  const [requests, setRequests] = useState<RawIntelligenceRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [rawData, setRawData] = useState<RawIntelligenceData | null>(null);
  const [expandedSources, setExpandedSources] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTier, setFilterTier] = useState<'all' | 'A' | 'B' | 'C'>('all');
  const [showParsedView, setShowParsedView] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await fetch(API_BASE_URL + '/api/v1/research/raw-intelligence/requests');
      const data = await res.json();
      
      if (data.success) {
        setRequests(data.requests || []);
      } else {
        setError(data.error?.message || 'Failed to fetch requests');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch requests');
    } finally {
      setLoading(false);
    }
  };

  const fetchRawData = async (requestId: string) => {
    try {
      setLoadingData(true);
      setSelectedRequest(requestId);
      
      const res = await fetch(API_BASE_URL + '/api/v1/research/' + requestId + '/raw-intelligence/all');
      const data = await res.json();
      
      if (data.success) {
        setRawData(data);
        const successful = Object.entries(data.sources)
          .filter(([, s]) => (s as SourceData).confidence > 0.5)
          .map(([name]) => name);
        setExpandedSources(new Set(successful.slice(0, 3)));
      } else {
        setError(data.error?.message || 'Failed to fetch raw data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch raw data');
    } finally {
      setLoadingData(false);
    }
  };

  const toggleSource = (sourceName: string) => {
    setExpandedSources(prev => {
      const next = new Set(prev);
      if (next.has(sourceName)) {
        next.delete(sourceName);
      } else {
        next.add(sourceName);
      }
      return next;
    });
  };

  const expandAll = () => {
    if (rawData) {
      setExpandedSources(new Set(Object.keys(rawData.sources)));
    }
  };

  const collapseAll = () => {
    setExpandedSources(new Set());
  };

  const downloadJson = () => {
    if (rawData) {
      const blob = new Blob([JSON.stringify(rawData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'raw-intelligence-' + rawData.meta.companyName + '-' + rawData.meta.requestId + '.json';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const getStatusIcon = (source: SourceData) => {
    if (source.confidence >= 0.7) return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    if (source.confidence >= 0.3) return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    return <XCircle className="h-5 w-5 text-red-500" />;
  };

  const getSourceTier = (sourceName: string) => {
    return SOURCE_TIERS[sourceName] || { tier: 'C', label: 'Unknown', color: 'bg-gray-400' };
  };

  const filteredSources = rawData ? Object.entries(rawData.sources)
    .filter(([name]) => {
      const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase());
      const tier = getSourceTier(name);
      const matchesTier = filterTier === 'all' || tier.tier === filterTier;
      return matchesSearch && matchesTier;
    })
    .sort((a, b) => {
      return (b[1] as SourceData).confidence - (a[1] as SourceData).confidence;
    }) : [];

  if (!selectedRequest) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Database className="h-8 w-8 text-blue-400" />
              Raw Intelligence Vault
            </h1>
            <p className="text-gray-400 mt-2">
              View 100% of raw data collected from each source before synthesis
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-400" />
              <span className="ml-3 text-lg">Loading requests...</span>
            </div>
          ) : error ? (
            <Card className="bg-red-900/20 border-red-500">
              <CardContent className="py-6">
                <p className="text-red-400">{error}</p>
                <Button onClick={fetchRequests} className="mt-4">Retry</Button>
              </CardContent>
            </Card>
          ) : requests.length === 0 ? (
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="py-12 text-center">
                <Database className="h-16 w-16 mx-auto text-gray-600 mb-4" />
                <p className="text-gray-400 text-lg">No raw intelligence data available</p>
                <p className="text-gray-500 mt-2">Generate a dossier to see raw source data here</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {requests.map(req => (
                <Card 
                  key={req.requestId}
                  className="bg-gray-800 border-gray-700 hover:border-blue-500 cursor-pointer transition-colors"
                  onClick={() => fetchRawData(req.requestId)}
                >
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-semibold text-white">{req.companyName}</h3>
                        <p className="text-gray-400 text-sm font-mono">{req.requestId}</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-4">
                          <Badge variant="outline" className="text-blue-400 border-blue-400">
                            <Layers className="h-3 w-3 mr-1" />
                            {req.sourceCount} sources
                          </Badge>
                          <Badge variant="outline" className="text-green-400 border-green-400">
                            <FileJson className="h-3 w-3 mr-1" />
                            {formatBytes(req.totalDataSize)}
                          </Badge>
                        </div>
                        <p className="text-gray-500 text-sm mt-2">
                          {new Date(req.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => { setSelectedRequest(null); setRawData(null); }}
            className="text-gray-400 hover:text-white mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to list
          </Button>
          
          {rawData && (
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">{rawData.meta.companyName}</h1>
                <p className="text-gray-400 font-mono">{rawData.meta.requestId}</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge className="bg-blue-600">
                  {rawData.meta.sourceCount} Sources
                </Badge>
                <Badge className="bg-green-600">
                  {rawData.meta.totalDataSizeFormatted}
                </Badge>
                <Button onClick={downloadJson} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export JSON
                </Button>
              </div>
            </div>
          )}
        </div>

        {loadingData ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-400" />
            <span className="ml-3 text-lg">Loading raw intelligence...</span>
          </div>
        ) : rawData && (
          <>
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search sources..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-sm">Tier:</span>
                {(['all', 'A', 'B', 'C'] as const).map(tier => (
                  <Button
                    key={tier}
                    size="sm"
                    variant={filterTier === tier ? 'default' : 'outline'}
                    onClick={() => setFilterTier(tier)}
                    className={filterTier === tier ? 'bg-blue-600' : ''}
                  >
                    {tier === 'all' ? 'All' : 'Tier ' + tier}
                  </Button>
                ))}
              </div>
              <Button onClick={expandAll} variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-1" />
                Expand All
              </Button>
              <Button onClick={collapseAll} variant="outline" size="sm">
                Collapse All
              </Button>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="py-4 text-center">
                  <div className="text-3xl font-bold text-green-400">
                    {Object.values(rawData.sources).filter(s => s.confidence >= 0.7).length}
                  </div>
                  <div className="text-gray-400 text-sm">High Confidence</div>
                </CardContent>
              </Card>
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="py-4 text-center">
                  <div className="text-3xl font-bold text-yellow-400">
                    {Object.values(rawData.sources).filter(s => s.confidence >= 0.3 && s.confidence < 0.7).length}
                  </div>
                  <div className="text-gray-400 text-sm">Medium Confidence</div>
                </CardContent>
              </Card>
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="py-4 text-center">
                  <div className="text-3xl font-bold text-red-400">
                    {Object.values(rawData.sources).filter(s => s.confidence < 0.3).length}
                  </div>
                  <div className="text-gray-400 text-sm">Low/Failed</div>
                </CardContent>
              </Card>
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="py-4 text-center">
                  <div className="text-3xl font-bold text-blue-400">
                    ${Object.values(rawData.sources).reduce((sum, s) => sum + s.cost, 0).toFixed(4)}
                  </div>
                  <div className="text-gray-400 text-sm">Total API Cost</div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-3">
              {filteredSources.map(([sourceName, source]) => {
                const tier = getSourceTier(sourceName);
                const isExpanded = expandedSources.has(sourceName);
                const sourceData = source as SourceData;
                
                return (
                  <Card key={sourceName} className="bg-gray-800 border-gray-700">
                    <CardHeader 
                      className="py-3 cursor-pointer hover:bg-gray-750"
                      onClick={() => toggleSource(sourceName)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {isExpanded ? (
                            <ChevronDown className="h-5 w-5 text-gray-400" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-gray-400" />
                          )}
                          {getStatusIcon(sourceData)}
                          <div>
                            <span className="font-semibold text-white text-lg">
                              {sourceName.toUpperCase().replace(/-/g, ' ')}
                            </span>
                            <span className={'ml-2 px-2 py-0.5 text-xs rounded ' + tier.color + ' text-white'}>
                              {tier.label}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge variant="outline" className={
                            sourceData.confidence >= 0.7 ? 'text-green-400 border-green-400' : 
                            sourceData.confidence >= 0.3 ? 'text-yellow-400 border-yellow-400' : 
                            'text-red-400 border-red-400'
                          }>
                            {(sourceData.confidence * 100).toFixed(0)}% confidence
                          </Badge>
                          <span className="text-gray-400 text-sm">
                            {formatBytes(sourceData.dataSize)}
                          </span>
                          <span className="text-gray-500 text-sm">
                            ${sourceData.cost.toFixed(4)}
                          </span>
                          <span className="text-gray-500 text-sm">
                            {sourceData.responseTime}ms
                          </span>
                        </div>
                      </div>
                    </CardHeader>
                    
                    {isExpanded && (
                      <CardContent className="pt-0 pb-4">
                        {sourceData.error && (
                          <div className="bg-red-900/30 border border-red-500 rounded p-3 mb-4">
                            <span className="text-red-400 font-semibold">Error: </span>
                            <span className="text-red-300">{sourceData.error}</span>
                          </div>
                        )}
                        
                        {/* Parsed View Toggle */}
                        <div className="flex items-center gap-2 mb-3">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); setShowParsedView(!showParsedView); }}
                            className="text-gray-400 hover:text-white"
                          >
                            {showParsedView ? (
                              <>
                                <ToggleRight className="h-4 w-4 mr-1 text-green-400" />
                                Parsed View
                              </>
                            ) : (
                              <>
                                <ToggleLeft className="h-4 w-4 mr-1" />
                                Raw JSON
                              </>
                            )}
                          </Button>
                          <span className="text-gray-600 text-xs">Click to toggle</span>
                        </div>
                        
                        {/* Parsed View (human-readable) */}
                        {showParsedView && (
                          <div className="bg-gray-900 rounded-lg p-4 mb-3">
                            <SourceDataParser sourceName={sourceName} data={sourceData.data} />
                          </div>
                        )}
                        
                        {/* Raw JSON View */}
                        {(!showParsedView || !SourceDataParser({ sourceName, data: sourceData.data })) && (
                          <div className="bg-gray-900 rounded-lg p-4 overflow-auto max-h-[500px]">
                            <div className="flex items-center gap-2 text-gray-500 text-xs mb-2">
                              <Code className="h-3 w-3" />
                              Raw JSON Data
                            </div>
                            <pre className="text-sm text-gray-300 font-mono whitespace-pre-wrap">
                              {JSON.stringify(sourceData.data, null, 2)}
                            </pre>
                          </div>
                        )}
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default RawIntelligenceViewer;
