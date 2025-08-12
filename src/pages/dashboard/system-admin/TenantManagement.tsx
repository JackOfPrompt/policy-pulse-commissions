import React from "react";
import SystemAdminModulePage from "@/components/admin/SystemAdminModulePage";
import TenantsSection from "@/components/admin/tenants/TenantsSection";

export default function TenantManagement() {
  return (
    <SystemAdminModulePage slug="TenantManagement" title="TenantManagement" description="Manage tenants and organizations.">
      <TenantsSection />
    </SystemAdminModulePage>
  );
}
