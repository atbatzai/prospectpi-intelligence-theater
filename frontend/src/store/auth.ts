// Authentication store using Zustand
import { create } from 'zustand';
import { User, Organization, AuthRequest, RegisterRequest } from '@/types';
import apiClient from '@/lib/api-client';

/**
 * Task 1.4: JWT Token Refresh Logic with Mobile Battery Optimization
 */
class TokenManager {
  private refreshTimer: NodeJS.Timeout | null = null;
  private readonly REFRESH_BUFFER = 5 * 60 * 1000; // 5 minutes before expiry
  
  scheduleTokenRefresh(token: string) {
    // Clear existing timer
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }
    
    try {
      // Decode JWT to get expiry (simple base64 decode)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiryTime = payload.exp * 1000; // Convert to milliseconds
      const refreshTime = expiryTime - Date.now() - this.REFRESH_BUFFER;
      
      if (refreshTime > 0) {
        this.refreshTimer = setTimeout(() => {
          this.refreshToken();
        }, refreshTime);
      }
    } catch (error) {
      console.error('Failed to schedule token refresh:', error);
    }
  }
  
  private async refreshToken() {
    try {
      const response = await apiClient.post('/api/auth/refresh');
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      this.scheduleTokenRefresh(token);
      
      // Update auth store
      const authStore = useAuthStore.getState();
      authStore.updateUser(user);
      
    } catch (error) {
      console.error('Token refresh failed:', error);
      // Force logout on refresh failure
      const authStore = useAuthStore.getState();
      authStore.logout();
    }
  }
  
  clearTimer() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }
}

const tokenManager = new TokenManager();

interface AuthState {
  user: User | null;
  organization: Organization | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: AuthRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  updateUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  organization: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (credentials: AuthRequest) => {
    try {
      const response = await apiClient.post('/api/auth/login', credentials);
      const { token, user, organization } = response.data;
      
      localStorage.setItem('token', token);
      tokenManager.scheduleTokenRefresh(token);
      set({ user, organization, isAuthenticated: true, isLoading: false });
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  },

  register: async (data: RegisterRequest) => {
    try {
      const response = await apiClient.post('/api/auth/register', data);
      const { token, user, organization } = response.data;
      
      localStorage.setItem('token', token);
      tokenManager.scheduleTokenRefresh(token);
      set({ user, organization, isAuthenticated: true, isLoading: false });
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, organization: null, isAuthenticated: false, isLoading: false });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      set({ user: null, organization: null, isAuthenticated: false, isLoading: false });
      return;
    }

    try {
      const response = await apiClient.get('/api/auth/me');
      const { user, organization } = response.data;
      set({ user, organization, isAuthenticated: true, isLoading: false });
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('token');
      set({ user: null, organization: null, isAuthenticated: false, isLoading: false });
    }
    
    /* ORIGINAL AUTH CODE - DISABLED FOR UX TESTING
    const token = localStorage.getItem('token');
    if (!token) {
      set({ isLoading: false });
      return;
    }

    try {
      const response = await apiClient.get('/api/auth/me');
      const { user, organization } = response.data;
      const token = localStorage.getItem('token');
      
      set({ user, organization, isAuthenticated: true, isLoading: false });
      
      // Schedule token refresh for mobile battery optimization
      if (token) {
        tokenManager.scheduleTokenRefresh(token);
      }
    } catch (error) {
      localStorage.removeItem('token');
      tokenManager.clearTimer();
      set({ user: null, organization: null, isAuthenticated: false, isLoading: false });
    }
    */
  },

  updateUser: (user: User) => {
    set({ user });
  },
}));