'use client';

import React from 'react';
import { Shield, Search, Eye, Zap } from 'lucide-react';
import '@/styles/brand.css';

interface ProspectPIHeaderProps {
  showNavigation?: boolean;
  showTagline?: boolean;
  variant?: 'full' | 'compact' | 'minimal';
}

export function ProspectPIHeader({ 
  showNavigation = false, 
  showTagline = true,
  variant = 'full' 
}: ProspectPIHeaderProps) {
  
  const renderLogo = () => (
    <div className="flex items-center gap-3">
      <div className="relative">
        <Shield className="h-8 w-8 text-brand-navy-600" />
        <div className="absolute -top-1 -right-1 z-10">
          <Search className="h-4 w-4 text-brand-purple-600" />
        </div>
      </div>
      <div className="flex flex-col">
        <h1 className="prospectpi-logo">ProspectPI</h1>
        {showTagline && variant !== 'minimal' && (
          <p className="prospectpi-tagline">Business Intelligence Detective</p>
        )}
      </div>
    </div>
  );

  const renderNavigation = () => (
    <nav className="flex items-center gap-6">
      <a 
        href="#generate" 
        className="flex items-center gap-2 text-brand-navy-600 hover:text-brand-purple-600 transition-colors font-medium"
      >
        <Zap className="h-4 w-4" />
        Generate Report
      </a>
      <a 
        href="#history" 
        className="flex items-center gap-2 text-brand-navy-600 hover:text-brand-purple-600 transition-colors font-medium"
      >
        <Eye className="h-4 w-4" />
        Case History
      </a>
      <button className="detective-button-primary text-sm px-4 py-2">
        New Investigation
      </button>
    </nav>
  );

  if (variant === 'minimal') {
    return (
      <div className="flex items-center justify-center py-4">
        {renderLogo()}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <header className="bg-white border-b-2 border-brand-navy-100 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          {renderLogo()}
          {showNavigation && renderNavigation()}
        </div>
      </header>
    );
  }

  return (
    <header className="bg-gradient-to-r from-brand-navy-50 to-brand-purple-50 border-b-2 border-brand-navy-100">
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          {renderLogo()}
          {showNavigation && renderNavigation()}
        </div>
        
        {variant === 'full' && (
          <div className="mt-6 flex items-center gap-8">
            <div className="flex items-center gap-2 text-brand-navy-600">
              <div className="clue-indicator">PI</div>
              <span className="font-medium">Professional Intelligence Platform</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-brand-navy-500">
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                <span>12+ Data Sources</span>
              </div>
              <div className="flex items-center gap-1">
                <Zap className="h-4 w-4" />
                <span>Sub-2min Reports</span>
              </div>
              <div className="flex items-center gap-1">
                <Shield className="h-4 w-4" />
                <span>Enterprise Security</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

// Investigation Status Badge Component
export function InvestigationStatus({ 
  status, 
  message 
}: { 
  status: 'investigating' | 'analyzing' | 'complete' | 'alert';
  message?: string;
}) {
  const getStatusConfig = () => {
    switch (status) {
      case 'investigating':
        return {
          className: 'status-investigating',
          icon: <Search className="h-4 w-4" />,
          text: message || 'Investigating...'
        };
      case 'analyzing':
        return {
          className: 'status-analyzing investigating-animation',
          icon: <Eye className="h-4 w-4" />,
          text: message || 'Analyzing Evidence'
        };
      case 'complete':
        return {
          className: 'status-complete',
          icon: <Shield className="h-4 w-4" />,
          text: message || 'Investigation Complete'
        };
      case 'alert':
        return {
          className: 'status-alert',
          icon: <Zap className="h-4 w-4" />,
          text: message || 'Requires Attention'
        };
      default:
        return {
          className: 'status-investigating',
          icon: <Search className="h-4 w-4" />,
          text: message || 'Ready'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className={`investigation-status ${config.className}`}>
      {config.icon}
      <span>{config.text}</span>
    </div>
  );
}

// Evidence Badge Component
export function EvidenceBadge({ 
  children, 
  variant = 'default' 
}: { 
  children: React.ReactNode;
  variant?: 'default' | 'important' | 'clue';
}) {
  const getVariantClass = () => {
    switch (variant) {
      case 'important':
        return 'bg-brand-purple-100 text-brand-purple-700 border-brand-purple-200';
      case 'clue':
        return 'bg-brand-navy-100 text-brand-navy-700 border-brand-navy-200';
      default:
        return 'evidence-badge';
    }
  };

  return (
    <span className={getVariantClass()}>
      {children}
    </span>
  );
}