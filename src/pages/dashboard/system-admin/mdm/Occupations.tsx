import React from "react";
import SystemAdminModulePage from "@/components/admin/SystemAdminModulePage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Occupations() {
  return (
    <SystemAdminModulePage slug="MDM/occupations" title="Occupations" description="Manage occupations">
      <Card>
        <CardHeader>
          <CardTitle>Occupations</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          Columns: occupation_name, code.
        </CardContent>
      </Card>
    </SystemAdminModulePage>
  );
}
