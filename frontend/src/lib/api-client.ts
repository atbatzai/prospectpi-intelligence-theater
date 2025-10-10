// API Client for ProspectPI Backend Integration
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { PerformanceMonitor } from './utils';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Task 1.1 & 1.2: Mobile-optimized API client with performance monitoring and error handling
 */
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout for mobile networks
});

// Performance monitoring instance
const performanceMonitor = PerformanceMonitor.getInstance();

// Task 3.1: Mobile network quality detection and adaptive retry configuration
const getNetworkQuality = (): '2G' | '3G' | '4G' | 'wifi' => {
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  if (!connection) return 'wifi';
  
  const effectiveType = connection.effectiveType;
  if (effectiveType === 'slow-2g' || effectiveType === '2g') return '2G';
  if (effectiveType === '3g') return '3G';
  if (effectiveType === '4g') return '4G';
  return 'wifi';
};

// Task 3.1: Adaptive retry delays based on network conditions
const getRetryDelay = (attempt: number, networkQuality?: string): number => {
  // Base delays adjusted for mobile network conditions
  const baseDelays = {
    '2G': 3000,  // Slower networks need longer delays
    '3G': 2000,
    '4G': 1000,
    'wifi': 500
  };
  
  const baseDelay = baseDelays[networkQuality as keyof typeof baseDelays] || 1000;
  const jitter = Math.random() * 500;
  const exponentialDelay = baseDelay * Math.pow(2, attempt) + jitter;
  
  // Cap max delay based on network quality
  const maxDelays = { '2G': 15000, '3G': 12000, '4G': 8000, 'wifi': 5000 };
  const maxDelay = maxDelays[networkQuality as keyof typeof maxDelays] || 5000;
  
  return Math.min(exponentialDelay, maxDelay);
};

// Request interceptor with performance tracking and auth
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Track request start time for performance monitoring
    config.metadata = { startTime: Date.now() };
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor with mobile-optimized error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Track API response time
    if (response.config.metadata?.startTime) {
      const responseTime = Date.now() - response.config.metadata.startTime;
      performanceMonitor.trackMetric('api-response-time', responseTime);
    }
    
    return response;
  },
  async (error) => {
    // Handle authentication errors
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
      return Promise.reject(error);
    }
    
    // Task 3.1: Mobile network error recovery with network quality awareness
    const networkQuality = getNetworkQuality();
    const isOffline = !navigator.onLine;
    
    // Detect airplane mode or complete network loss
    if (isOffline || error.code === 'NETWORK_ERROR') {
      console.warn('🛜 Network connectivity lost - implementing mobile recovery strategy');
      
      // Wait for network to come back online
      await waitForNetworkRecovery();
      
      // Reset retry count after network recovery
      error.config._retryCount = 0;
    }
    
    // Mobile network error handling with adaptive retry logic
    if (shouldRetry(error, networkQuality) && !error.config._retryCount) {
      error.config._retryCount = 0;
    }
    
    // Adjust max retries based on network quality
    const maxRetries = networkQuality === '2G' ? 5 : networkQuality === '3G' ? 4 : 3;
    
    if (error.config._retryCount < maxRetries) {
      error.config._retryCount++;
      
      console.log(`📱 Mobile retry ${error.config._retryCount}/${maxRetries} on ${networkQuality} network`);
      
      // Track mobile retry metrics
      performanceMonitor.trackMetric(`mobile-retry-${networkQuality}`, error.config._retryCount);
      
      // Wait before retry with network-aware exponential backoff
      const delay = getRetryDelay(error.config._retryCount, networkQuality);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      return apiClient(error.config);
    }
    
    // Track mobile network failures
    performanceMonitor.trackMetric(`mobile-failure-${networkQuality}`, 1);
    
    return Promise.reject(error);
  }
);

// Task 3.1: Network recovery helper - waits for connectivity to return
async function waitForNetworkRecovery(): Promise<void> {
  return new Promise((resolve) => {
    const checkOnline = () => {
      if (navigator.onLine) {
        console.log('🌐 Network connectivity restored');
        resolve();
      } else {
        // Check every 2 seconds for network recovery
        setTimeout(checkOnline, 2000);
      }
    };
    
    // Listen for online event
    const handleOnline = () => {
      window.removeEventListener('online', handleOnline);
      resolve();
    };
    
    window.addEventListener('online', handleOnline);
    
    // Start checking immediately
    checkOnline();
  });
}

// Task 3.1: Enhanced retry logic with network quality awareness
function shouldRetry(error: any, networkQuality?: string): boolean {
  const isNetworkError = (
    !error.response || // Network error
    error.response.status >= 500 || // Server error
    error.response.status === 408 || // Request timeout
    error.code === 'ECONNABORTED' || // Axios timeout
    error.code === 'NETWORK_ERROR' // Network issues
  );
  
  // More aggressive retries for slower networks
  if (networkQuality === '2G' || networkQuality === '3G') {
    return isNetworkError || error.response?.status === 429; // Include rate limiting for slow networks
  }
  
  return isNetworkError;
}

// Declare module augmentation for metadata
declare module 'axios' {
  export interface AxiosRequestConfig {
    metadata?: {
      startTime: number;
    };
    _retryCount?: number;
  }
}

export default apiClient;