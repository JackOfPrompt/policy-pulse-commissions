import React from "react";
import SystemAdminModulePage from "@/components/admin/SystemAdminModulePage";
import PlansSection from "@/components/admin/plans/PlansSection";

export default function SubscriptionPlans() {
  return (
    <SystemAdminModulePage slug="SubscriptionPlans" title="SubscriptionPlans" description="Create and edit subscription plans.">
      <PlansSection />
    </SystemAdminModulePage>
  );
}
