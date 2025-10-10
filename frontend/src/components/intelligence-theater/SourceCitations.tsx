// SourceCitations Component for ProspectPI Intelligence Theater
'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Shield, Database } from 'lucide-react';

interface SourceCitation {
  id: string;
  name: string;
  url?: string;
  confidence: number;
  freshness: string;
  type: 'theirstack' | 'marketaux' | 'coresignal' | 'perplexity' | 'internal';
}

interface SourceCitationsProps {
  sources: SourceCitation[];
  maxVisible?: number;
}

export const SourceCitations: React.FC<SourceCitationsProps> = ({ 
  sources, 
  maxVisible = 5 
}) => {
  const visibleSources = sources.slice(0, maxVisible);
  const hasMore = sources.length > maxVisible;

  const getSourceIcon = (type: string) => {
    const icons = {
      theirstack: '',
      marketaux: '',
      coresignal: '',
      perplexity: '',
      internal: ''
    };
    return icons[type as keyof typeof icons] || '';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-100 text-green-800';
    if (confidence >= 0.6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
        <Database className="h-4 w-4" />
        Intelligence Sources
      </h4>
      
      <div className="space-y-2">
        {visibleSources.map((source) => (
          <div 
            key={source.id} 
            className="flex items-center justify-between p-2 bg-gray-50 rounded border"
          >
            <div className="flex items-center gap-2 flex-1">
              <span className="text-lg">{getSourceIcon(source.type)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {source.name}
                </p>
                <p className="text-xs text-gray-500">
                  {source.freshness}  {source.type}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge className="text-xs">
                {Math.round(source.confidence * 100)}%
              </Badge>
              {source.url && (
                <a 
                  href={source.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800"
                  aria-label="View source"
                >
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {hasMore && (
        <p className="text-xs text-gray-500 text-center">
          and {sources.length - maxVisible} more sources...
        </p>
      )}
    </div>
  );
};

export default SourceCitations;
