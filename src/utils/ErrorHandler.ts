/**
 * ProspectPI Intelligence Theater - Centralized Error Handling
 * Story 1.1: Three-Agent Orchestration System
 * 
 * Centralized error handling with recovery strategies and logging
 */

import { AgentError } from '@interfaces/AgentTypes';

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum ErrorCategory {
  API_FAILURE = 'api_failure',
  VALIDATION_ERROR = 'validation_error',
  AUTHENTICATION_ERROR = 'authentication_error',
  RATE_LIMIT_ERROR = 'rate_limit_error',
  TIMEOUT_ERROR = 'timeout_error',
  PARSING_ERROR = 'parsing_error',
  ORCHESTRATION_ERROR = 'orchestration_error'
}

export interface EnhancedError extends AgentError {
  severity: ErrorSeverity;
  category: ErrorCategory;
  retryable: boolean;
  retryCount?: number;
  maxRetries?: number;
}

export class ErrorHandler {
  private static errorCounts: Map<string, number> = new Map();
  private static readonly MAX_RETRY_ATTEMPTS = 3;
  private static readonly RETRY_BACKOFF_MS = 1000;

  /**
   * Create enhanced error with categorization and retry logic
   */
  static createError(
    agent: 'coordinator' | 'researcher' | 'detective',
    error: string,
    category: ErrorCategory,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    context?: any
  ): EnhancedError {
    const errorKey = `${agent}-${category}`;
    const currentCount = this.errorCounts.get(errorKey) || 0;
    this.errorCounts.set(errorKey, currentCount + 1);

    return {
      agent,
      error,
      recoverable: this.isRecoverable(category, currentCount),
      timestamp: new Date(),
      context,
      severity,
      category,
      retryable: this.isRetryable(category),
      retryCount: currentCount,
      maxRetries: this.MAX_RETRY_ATTEMPTS
    };
  }

  /**
   * Determine if error is recoverable based on category and attempt count
   */
  private static isRecoverable(category: ErrorCategory, attemptCount: number): boolean {
    if (attemptCount >= this.MAX_RETRY_ATTEMPTS) {
      return false;
    }

    switch (category) {
      case ErrorCategory.API_FAILURE:
      case ErrorCategory.TIMEOUT_ERROR:
      case ErrorCategory.RATE_LIMIT_ERROR:
        return true;
      case ErrorCategory.AUTHENTICATION_ERROR:
        return false;
      case ErrorCategory.VALIDATION_ERROR:
      case ErrorCategory.PARSING_ERROR:
        return attemptCount < 1; // Only retry once for data issues
      case ErrorCategory.ORCHESTRATION_ERROR:
        return true;
      default:
        return false;
    }
  }

  /**
   * Determine if error should be retried automatically
   */
  private static isRetryable(category: ErrorCategory): boolean {
    return [
      ErrorCategory.API_FAILURE,
      ErrorCategory.TIMEOUT_ERROR,
      ErrorCategory.RATE_LIMIT_ERROR
    ].includes(category);
  }

  /**
   * Execute function with automatic retry logic
   */
  static async withRetry<T>(
    operation: () => Promise<T>,
    agent: 'coordinator' | 'researcher' | 'detective',
    operationName: string,
    category: ErrorCategory = ErrorCategory.API_FAILURE
  ): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < this.MAX_RETRY_ATTEMPTS; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;
        
        const enhancedError = this.createError(
          agent,
          `${operationName} failed (attempt ${attempt + 1}): ${error.message}`,
          category,
          ErrorSeverity.MEDIUM,
          { attempt, operationName }
        );

        // Log error
        console.error(`[${agent.toUpperCase()} - Attempt ${attempt + 1}]`, enhancedError);

        // Don't retry if not retryable or max attempts reached
        if (!enhancedError.retryable || attempt === this.MAX_RETRY_ATTEMPTS - 1) {
          throw enhancedError;
        }

        // Exponential backoff
        const backoffMs = this.RETRY_BACKOFF_MS * Math.pow(2, attempt);
        await this.sleep(backoffMs);
      }
    }

    throw this.createError(
      agent,
      `${operationName} failed after ${this.MAX_RETRY_ATTEMPTS} attempts: ${lastError?.message}`,
      category,
      ErrorSeverity.HIGH
    );
  }

  /**
   * Handle API-specific errors with appropriate categorization
   */
  static handleApiError(
    error: any,
    agent: 'coordinator' | 'researcher' | 'detective',
    apiName: string
  ): EnhancedError {
    let category = ErrorCategory.API_FAILURE;
    let severity = ErrorSeverity.MEDIUM;

    // Categorize based on error type/status
    if (error.response?.status === 401 || error.response?.status === 403) {
      category = ErrorCategory.AUTHENTICATION_ERROR;
      severity = ErrorSeverity.HIGH;
    } else if (error.response?.status === 429) {
      category = ErrorCategory.RATE_LIMIT_ERROR;
      severity = ErrorSeverity.MEDIUM;
    } else if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      category = ErrorCategory.TIMEOUT_ERROR;
      severity = ErrorSeverity.MEDIUM;
    }

    return this.createError(
      agent,
      `${apiName} API error: ${error.message}`,
      category,
      severity,
      {
        apiName,
        status: error.response?.status,
        code: error.code,
        response: error.response?.data
      }
    );
  }

  /**
   * Reset error counts for testing or new sessions
   */
  static resetErrorCounts(): void {
    this.errorCounts.clear();
  }

  /**
   * Get error statistics
   */
  static getErrorStats(): Record<string, number> {
    return Object.fromEntries(this.errorCounts.entries());
  }

  /**
   * Sleep utility for backoff
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}