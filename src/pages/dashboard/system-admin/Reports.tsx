import React from "react";
import SystemAdminModulePage from "@/components/admin/SystemAdminModulePage";

export default function Reports() {
  return (
    <SystemAdminModulePage slug="Reports" title="Reports" description="Analytics and reporting.">
      <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">Charts will be added here.</div>
    </SystemAdminModulePage>
  );
}
