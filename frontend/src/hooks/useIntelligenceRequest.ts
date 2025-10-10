import { useState, useCallback } from 'react';
import { OptimizedUserInput } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface ResearchApiResponse {
  success: boolean;
  requestId: string;
  status: 'processing' | 'complete' | 'error';
  estimatedCompletion?: number;
  websocketUrl?: string;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export const useIntelligenceRequest = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitResearchRequest = useCallback(async (input: OptimizedUserInput): Promise<ResearchApiResponse | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const payload = {
        companyName: input.companyName,
        additionalContext: Array.isArray(input.additionalContext) 
          ? input.additionalContext.join(', ') 
          : input.additionalContext,
        priority: input.priority,
        outputFormat: input.outputFormat
      };

      const response = await fetch(`${API_BASE_URL}/api/v1/research/generate-dossier`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data: ResearchApiResponse = await response.json();
      return data;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit research request';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    submitResearchRequest,
    isLoading,
    error,
    clearError: () => setError(null),
  };
};