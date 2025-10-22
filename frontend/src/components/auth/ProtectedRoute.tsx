'use client';

import { useAuth } from '@/hooks/useAuth';
import LoginForm from '@/components/auth/LoginForm';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  // 🚀 TEMPORARY: Complete bypass for development access
  console.log('🔓 DEVELOPMENT: Authentication completely bypassed for Epic 2.5.2 testing');
  return <>{children}</>;

  /* Original authentication logic - commented out for development
  const { isAuthenticated, isLoading } = useAuth();

  // 🎭 DEVELOPMENT MODE: Bypass authentication for local development
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (isDevelopment) {
    console.log('🔓 Development Mode: Authentication bypassed');
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  return <>{children}</>;
  */
}
