import { DashboardLayout } from "@/components/layout/dashboard-layout";
import SubscriptionUpgradeRequest from "@/components/admin/SubscriptionUpgradeRequest";
import users from "@/data/users.json";

export default function SubscriptionUpgrade() {
  const user = users.admin;

  return (
    <DashboardLayout role="admin" user={user}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Subscription Management</h1>
          <p className="text-muted-foreground">
            Request plan upgrades for your organization
          </p>
        </div>
        <SubscriptionUpgradeRequest />
      </div>
    </DashboardLayout>
  );
}