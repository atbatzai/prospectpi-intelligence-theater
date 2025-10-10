// Authentication hook
import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth';

export const useAuth = () => {
  const { user, organization, isAuthenticated, isLoading, checkAuth, login, register, logout } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return {
    user,
    organization,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
  };
};
