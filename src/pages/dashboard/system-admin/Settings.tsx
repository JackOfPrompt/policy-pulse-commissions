import React from "react";
import SystemAdminModulePage from "@/components/admin/SystemAdminModulePage";

export default function Settings() {
  return (
    <SystemAdminModulePage slug="Settings" title="Settings" description="Platform-wide settings.">
      <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">Settings controls placeholder</div>
    </SystemAdminModulePage>
  );
}
