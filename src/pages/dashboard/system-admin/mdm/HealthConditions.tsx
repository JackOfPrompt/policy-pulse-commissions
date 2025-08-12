import React from "react";
import SystemAdminModulePage from "@/components/admin/SystemAdminModulePage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function HealthConditions() {
  return (
    <SystemAdminModulePage slug="MDM/health-conditions" title="Health Conditions" description="Manage health conditions catalogue">
      <Card>
        <CardHeader>
          <CardTitle>Health Conditions</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          Columns: name, description.
        </CardContent>
      </Card>
    </SystemAdminModulePage>
  );
}
