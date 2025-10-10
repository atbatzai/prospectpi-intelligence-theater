import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Dashboard from '@/components/Dashboard';

export default function Home() {
  return (
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  );
}
