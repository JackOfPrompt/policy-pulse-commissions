import React from "react";
import SystemAdminModulePage from "@/components/admin/SystemAdminModulePage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Departments() {
  return (
    <SystemAdminModulePage slug="MDM/departments" title="Departments" description="Manage departments">
      <Card>
        <CardHeader>
          <CardTitle>Departments</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          Columns: dept_name, code.
        </CardContent>
      </Card>
    </SystemAdminModulePage>
  );
}
