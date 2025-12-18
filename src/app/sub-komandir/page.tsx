import AuthGuard from '@/components/auth-guard';
import DashboardLayout from '@/components/dashboard-layout';

export default function SubCommanderPage() {
  return (
    <AuthGuard requiredRole="sub-commander">
      <DashboardLayout />
    </AuthGuard>
  );
}
