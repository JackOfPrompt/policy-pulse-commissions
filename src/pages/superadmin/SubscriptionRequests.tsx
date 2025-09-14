import { DashboardLayout } from "@/components/layout/dashboard-layout";
import SubscriptionRequestsManagement from "@/components/superadmin/SubscriptionRequestsManagement";
import users from "@/data/users.json";

export default function SubscriptionRequests() {
  const user = users.superadmin || {
    id: "superadmin-1",
    name: "Super Admin",
    email: "superadmin@example.com",
    role: "superadmin"
  };

  return (
    <DashboardLayout role="superadmin" user={user}>
      <SubscriptionRequestsManagement />
    </DashboardLayout>
  );
}