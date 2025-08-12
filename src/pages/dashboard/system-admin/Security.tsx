import React from "react";
import SystemAdminModulePage from "@/components/admin/SystemAdminModulePage";

export default function Security() {
  return (
    <SystemAdminModulePage slug="Security" title="Security" description="Security and compliance settings.">
      <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">Security tables placeholder</div>
    </SystemAdminModulePage>
  );
}
