import AuthGuard from '@/components/auth-guard';
import DashboardLayout from '@/components/dashboard-layout';

export default function CommanderPage() {
  return (
    <AuthGuard requiredRole="commander">
      <DashboardLayout />
    </AuthGuard>
  );
}
