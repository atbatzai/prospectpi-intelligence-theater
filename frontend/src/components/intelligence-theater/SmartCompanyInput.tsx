'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Sparkles, Building2, TrendingUp, Clock } from 'lucide-react';

interface Company {
  name: string;
  domain: string;
  industry: string;
  size: string;
  description: string;
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

  const loading = isGenerating || isLoading;
  const handleSubmit = onGenerate || onSubmit || (() => {});

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

        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          disabled={!input.trim() || loading}
          size="lg"
          className="w-full py-4 text-lg detective-button-primary rounded-xl"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Generating Intelligence...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Generate Sales Dossier
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