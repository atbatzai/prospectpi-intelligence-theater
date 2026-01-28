'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Sparkles, Building2, TrendingUp, Clock, MapPin, Users, Briefcase, Zap, Globe, AlertCircle, CheckCircle } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Company {
  name: string;
  domain: string;
  industry: string;
  size: string;
  description: string;
}

// Enhanced enrichment data from real-time lookup
interface CompanyEnrichment {
  name: string;
  domain?: string;
  industry?: string;
  employeeCount?: string;
  location?: string;
  recentNews?: string[];
  techStack?: string[];
  jobCount?: number;
  confidence: number;
  sources: string[];
  isLoading: boolean;
  error?: string;
}

interface ProspectResearchInput {
  companyName: string;
  vendorName: string;
  productName: string;
  industry: string;
  primaryPainPoint: string;
}

interface CompanyInputFormProps {
  onGenerate?: (data: ProspectResearchInput) => void;
  onSubmit?: (data: any) => void;
  isGenerating?: boolean;
  isLoading?: boolean;
  previousCompanies?: string[];
}

export const SmartCompanyInput: React.FC<CompanyInputFormProps> = ({
  onGenerate,
  onSubmit,
  isGenerating = false,
  isLoading = false,
  previousCompanies = []
}) => {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<Company[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  
  // Real-time company enrichment preview
  const [enrichment, setEnrichment] = useState<CompanyEnrichment | null>(null);
  const [hasMounted, setHasMounted] = useState(false);
  const enrichmentTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const loading = isGenerating || isLoading;
  const handleSubmit = onGenerate || onSubmit || (() => {});

  // Fix hydration by tracking mount state
  useEffect(() => {
    setHasMounted(true);
  }, []);

  // 🔍 Real-time company enrichment lookup (debounced)
  const fetchCompanyEnrichment = useCallback(async (companyName: string) => {
    if (companyName.length < 3) {
      setEnrichment(null);
      return;
    }

    // Set loading state
    setEnrichment(prev => ({
      name: companyName,
      confidence: 0,
      sources: [],
      isLoading: true,
      ...(prev || {})
    }));

    try {
      // Quick enrichment from Wikidata/SEC (free sources)
      const response = await fetch(`${API_BASE_URL}/api/v1/research/company/quick-enrich?name=${encodeURIComponent(companyName)}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setEnrichment({
            name: data.data.name || companyName,
            domain: data.data.domain,
            industry: data.data.industry,
            employeeCount: data.data.employeeCount,
            location: data.data.location,
            recentNews: data.data.recentNews || [],
            techStack: data.data.techStack || [],
            jobCount: data.data.jobCount,
            confidence: data.data.confidence || 0.7,
            sources: data.data.sources || ['wikidata'],
            isLoading: false
          });
          return;
        }
      }
      
      // Fallback: Use demo data or inferred data
      const inferredData = inferCompanyData(companyName);
      setEnrichment({
        ...inferredData,
        isLoading: false
      });
    } catch (error) {
      console.log('Enrichment API not available, using inference');
      const inferredData = inferCompanyData(companyName);
      setEnrichment({
        ...inferredData,
        isLoading: false
      });
    }
  }, []);

  // 🧠 Smart company data inference when API unavailable
  const inferCompanyData = (companyName: string): CompanyEnrichment => {
    const name = companyName.toLowerCase();
    
    // Known companies quick match
    const knownCompanies: Record<string, Partial<CompanyEnrichment>> = {
      'connectwise': { industry: 'IT Services & MSP', location: 'Tampa, FL', employeeCount: '3,000+', confidence: 0.9 },
      'salesforce': { industry: 'Enterprise Software', location: 'San Francisco, CA', employeeCount: '70,000+', confidence: 0.95 },
      'microsoft': { industry: 'Technology', location: 'Redmond, WA', employeeCount: '220,000+', confidence: 0.98 },
      'google': { industry: 'Technology', location: 'Mountain View, CA', employeeCount: '180,000+', confidence: 0.98 },
      'amazon': { industry: 'E-commerce & Cloud', location: 'Seattle, WA', employeeCount: '1,500,000+', confidence: 0.98 },
      'apple': { industry: 'Consumer Electronics', location: 'Cupertino, CA', employeeCount: '160,000+', confidence: 0.98 },
      'netflix': { industry: 'Entertainment & Media', location: 'Los Gatos, CA', employeeCount: '13,000+', confidence: 0.95 },
      'stripe': { industry: 'Fintech', location: 'San Francisco, CA', employeeCount: '8,000+', confidence: 0.9 },
      'airbnb': { industry: 'Travel & Hospitality', location: 'San Francisco, CA', employeeCount: '6,000+', confidence: 0.9 },
    };

    for (const [key, data] of Object.entries(knownCompanies)) {
      if (name.includes(key)) {
        return {
          name: companyName,
          ...data,
          sources: ['inferred'],
          isLoading: false
        } as CompanyEnrichment;
      }
    }

    // Generic inference
    return {
      name: companyName,
      industry: 'Technology',
      confidence: 0.5,
      sources: ['inferred'],
      isLoading: false
    };
  };

  // Debounced enrichment on input change
  useEffect(() => {
    if (enrichmentTimeoutRef.current) {
      clearTimeout(enrichmentTimeoutRef.current);
    }

    if (input.length >= 3) {
      enrichmentTimeoutRef.current = setTimeout(() => {
        fetchCompanyEnrichment(input);
      }, 500); // 500ms debounce
    } else {
      setEnrichment(null);
    }

    return () => {
      if (enrichmentTimeoutRef.current) {
        clearTimeout(enrichmentTimeoutRef.current);
      }
    };
  }, [input, fetchCompanyEnrichment]);

  // Demo companies for instant value demonstration
  const demoCompanies: Company[] = [
    {
      name: 'Netflix',
      domain: 'netflix.com',
      industry: 'Entertainment & Media',
      size: '15,000+ employees',
      description: 'Global streaming entertainment leader'
    },
    {
      name: 'Tesla',
      domain: 'tesla.com', 
      industry: 'Automotive & Clean Energy',
      size: '100,000+ employees',
      description: 'Electric vehicles and sustainable energy'
    },
    {
      name: 'Shopify',
      domain: 'shopify.com',
      industry: 'E-commerce Platform',
      size: '10,000+ employees', 
      description: 'Commerce platform for entrepreneurs'
    },
    {
      name: 'Zoom',
      domain: 'zoom.us',
      industry: 'Communications Technology',
      size: '8,000+ employees',
      description: 'Video communications platform'
    }
  ];

  // Smart autocomplete logic
  useEffect(() => {
    if (input.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Filter demo companies based on input
    const filtered = demoCompanies.filter(company => 
      company.name.toLowerCase().includes(input.toLowerCase()) ||
      company.domain.toLowerCase().includes(input.toLowerCase()) ||
      company.industry.toLowerCase().includes(input.toLowerCase())
    );

    // Add dynamic suggestions for real companies
    if (input.length >= 3) {
      const dynamicSuggestions = generateDynamicSuggestions(input);
      filtered.push(...dynamicSuggestions);
    }

    setSuggestions(filtered.slice(0, 5));
    setShowSuggestions(filtered.length > 0);
    setSelectedIndex(-1);
  }, [input]);

  const generateDynamicSuggestions = (query: string): Company[] => {
    // Simple heuristic-based suggestions for real companies
    const commonDomains = ['.com', '.io', '.co', '.ai', '.tech'];
    const suggestions: Company[] = [];

    // If input looks like a domain
    if (query.includes('.')) {
      suggestions.push({
        name: query.split('.')[0].charAt(0).toUpperCase() + query.split('.')[0].slice(1),
        domain: query,
        industry: 'Technology',
        size: 'Unknown',
        description: `Company at ${query}`
      });
    } else {
      // Generate domain suggestions
      commonDomains.forEach(domain => {
        suggestions.push({
          name: query.charAt(0).toUpperCase() + query.slice(1),
          domain: `${query.toLowerCase()}${domain}`,
          industry: 'Technology',
          size: 'Unknown', 
          description: `${query} company`
        });
      });
    }

    return suggestions.slice(0, 2);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleCompanySelect(suggestions[selectedIndex]);
        } else if (input.trim()) {
          handleGenerate();
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleCompanySelect = (company: Company) => {
    setInput(company.name);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    
    // Create ProspectResearchInput for backward compatibility
    const researchInput: ProspectResearchInput = {
      companyName: company.name,
      vendorName: 'ProspectPI',
      productName: 'Intelligence Platform',
      industry: company.industry,
      primaryPainPoint: 'Market Intelligence'
    };
    
    handleSubmit(researchInput);
  };

  const handleGenerate = () => {
    if (!input.trim()) return;

    // Create research input from simple company name
    const researchInput: ProspectResearchInput = {
      companyName: input.trim(),
      vendorName: 'ProspectPI',
      productName: 'Intelligence Platform', 
      industry: 'Unknown',
      primaryPainPoint: 'Market Intelligence'
    };

    handleSubmit(researchInput);
  };

  const handleDemoClick = (company: Company) => {
    setInput(company.name);
    
    // Create research input for demo company
    const researchInput: ProspectResearchInput = {
      companyName: company.name,
      vendorName: 'ProspectPI',
      productName: 'Intelligence Platform',
      industry: company.industry,
      primaryPainPoint: 'Market Intelligence'
    };
    
    handleSubmit(researchInput);
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Main Input Section */}
      <div className="space-y-4">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-brand-navy-900 prospectpi-logo">
            Generate Business Intelligence
          </h1>
          <p className="text-brand-navy-600 prospectpi-tagline">
            Enter any company name to get comprehensive intelligence in seconds
          </p>
        </div>

        {/* Smart Input with Autocomplete */}
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 z-10 pointer-events-none" />
            <Input
              ref={inputRef}
              type="text"
              placeholder="Enter company name or website..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => input.length >= 2 && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              className="pl-12 pr-4 py-4 text-lg detective-input focus:border-brand-purple-500 rounded-xl relative z-20 bg-white"
              disabled={loading}
            />
            {loading && (
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-brand-navy-600"></div>
              </div>
            )}
          </div>

          {/* Autocomplete Suggestions */}
          {showSuggestions && suggestions.length > 0 && (
            <Card 
              ref={suggestionsRef}
              className="absolute top-full left-0 right-0 mt-1 z-50 shadow-lg border-2 max-h-80 overflow-y-auto bg-white"
            >
              <CardContent className="p-0">
                {suggestions.map((company, index) => (
                  <div
                    key={`${company.name}-${company.domain}`}
                    className={`p-4 cursor-pointer border-b last:border-b-0 transition-colors ${
                      selectedIndex === index 
                        ? 'bg-brand-purple-50 border-brand-purple-200' 
                        : 'bg-white hover:bg-brand-navy-50'
                    }`}
                    onClick={() => handleCompanySelect(company)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Building2 className="h-4 w-4 text-brand-navy-600" />
                          <span className="font-semibold text-brand-navy-900">{company.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {company.industry}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">{company.description}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>{company.domain}</span>
                          <span>{company.size}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Intelligence Preview Placeholder */}
        {!enrichment && !loading && hasMounted && (
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Search className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="font-medium text-slate-800">Start typing to preview intelligence</div>
                <div className="text-slate-500 text-sm">We&apos;ll show company data as you type</div>
              </div>
            </div>
          </div>
        )}

        {/* Real-time Company Enrichment Preview */}
        {enrichment && !enrichment.isLoading && hasMounted && (
          <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-lg">
            <CardContent className="pt-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="h-5 w-5 text-blue-600" />
                    <span className="font-bold text-lg text-slate-900">{enrichment.name}</span>
                    <Badge variant="outline" className={`text-xs ${
                      enrichment.confidence >= 0.8 ? 'bg-blue-100 text-blue-700 border-blue-300' :
                      enrichment.confidence >= 0.5 ? 'bg-amber-100 text-amber-700 border-amber-300' :
                      'bg-gray-100 text-gray-600 border-gray-300'
                    }`}>
                      {enrichment.confidence >= 0.8 ? <CheckCircle className="h-3 w-3 mr-1" /> : 
                       enrichment.confidence >= 0.5 ? <AlertCircle className="h-3 w-3 mr-1" /> : null}
                      {Math.round(enrichment.confidence * 100)}% match
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {enrichment.location && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <MapPin className="h-4 w-4 text-blue-500" />
                        <span>{enrichment.location}</span>
                      </div>
                    )}
                    {enrichment.industry && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <Briefcase className="h-4 w-4 text-purple-500" />
                        <span>{enrichment.industry}</span>
                      </div>
                    )}
                    {enrichment.employeeCount && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <Users className="h-4 w-4 text-orange-500" />
                        <span>{enrichment.employeeCount} employees</span>
                      </div>
                    )}
                    {enrichment.domain && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <Globe className="h-4 w-4 text-cyan-500" />
                        <span>{enrichment.domain}</span>
                      </div>
                    )}
                  </div>

                  {/* Tech Stack Preview */}
                  {enrichment.techStack && enrichment.techStack.length > 0 && (
                    <div className="mt-3 flex items-center gap-2 flex-wrap">
                      <Zap className="h-4 w-4 text-amber-500" />
                      {enrichment.techStack.slice(0, 4).map((tech, i) => (
                        <Badge key={i} variant="secondary" className="text-xs bg-slate-100">
                          {tech}
                        </Badge>
                      ))}
                      {enrichment.techStack.length > 4 && (
                        <Badge variant="outline" className="text-xs">+{enrichment.techStack.length - 4} more</Badge>
                      )}
                    </div>
                  )}

                  {/* Job Count Signal */}
                  {enrichment.jobCount && enrichment.jobCount > 0 && (
                    <div className="mt-2 text-xs text-green-700 bg-green-100 rounded px-2 py-1 inline-block">
                      🔥 {enrichment.jobCount} open positions detected - actively hiring!
                    </div>
                  )}
                </div>
              </div>
              
              {/* Confidence Summary */}
              <div className="mt-3 pt-3 border-t border-blue-200">
                <div className="flex items-center gap-2 text-sm">
                  <Sparkles className="h-4 w-4 text-blue-500" />
                  <span className="text-slate-600">
                    {enrichment.confidence >= 0.8 
                      ? "High confidence match. Full dossier will include 12+ data sources."
                      : enrichment.confidence >= 0.5
                      ? "Partial match. Generate dossier for complete intelligence."
                      : "New company detected. Our AI will gather comprehensive data."}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading state for enrichment */}
        {enrichment?.isLoading && hasMounted && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-300 border-t-blue-600"></div>
              <span className="text-slate-600">Looking up company information...</span>
            </div>
          </div>
        )}

        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          disabled={!input.trim() || loading}
          size="lg"
          className="w-full py-4 text-lg bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Generating Intelligence...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              {enrichment ? 'Generate Full Dossier' : 'Generate Sales Dossier'}
            </div>
          )}
        </Button>
      </div>

      {/* Demo Section */}
      <div className="space-y-3">
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-3">
            Or try one of these examples for instant results:
          </p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {demoCompanies.map((company) => (
            <Button
              key={company.name}
              variant="outline"
              size="sm"
              onClick={() => handleDemoClick(company)}
              disabled={loading}
              className="h-auto p-3 detective-button-secondary transition-colors"
            >
              <div className="text-center space-y-1">
                <div className="font-medium text-brand-navy-900">{company.name}</div>
                <div className="text-xs text-gray-500">{company.industry}</div>
              </div>
            </Button>
          ))}
        </div>
      </div>

      {/* Value Props */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-gray-100">
        <div className="text-center space-y-2">
          <TrendingUp className="h-6 w-6 text-brand-navy-600 mx-auto" />
          <div className="text-sm">
            <div className="font-semibold text-brand-navy-900">Complete Intelligence</div>
            <div className="text-gray-600">Financial, competitive & strategic insights</div>
          </div>
        </div>
        <div className="text-center space-y-2">
          <Clock className="h-6 w-6 text-brand-navy-600 mx-auto" />
          <div className="text-sm">
            <div className="font-semibold text-brand-navy-900">Under 2 Minutes</div>
            <div className="text-gray-600">Comprehensive reports generated rapidly</div>
          </div>
        </div>
        <div className="text-center space-y-2">
          <Building2 className="h-6 w-6 text-brand-navy-600 mx-auto" />
          <div className="text-sm">
            <div className="font-semibold text-brand-navy-900">12+ Data Sources</div>
            <div className="text-gray-600">Premium databases & real-time intelligence</div>
          </div>
        </div>
      </div>
    </div>
  );
};