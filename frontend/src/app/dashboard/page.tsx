/**
 * YOLO Dashboard Page - Next.js App Router
 */
import { UserDashboard } from '@/components/dashboard/UserDashboard';

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <UserDashboard />
    </div>
  );
}

export const metadata = {
  title: 'Dashboard | ProspectPI Intelligence',
  description: 'Manage your intelligence dossiers and account settings',
};