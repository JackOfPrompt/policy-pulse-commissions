import React from "react";
import SystemAdminModulePage from "@/components/admin/SystemAdminModulePage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function RelationshipCodes() {
  return (
    <SystemAdminModulePage slug="MDM/relationship-codes" title="Relationship Codes" description="Manage relationship codes">
      <Card>
        <CardHeader>
          <CardTitle>Relationship Codes</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          Supported values: self, spouse, child, parent.
        </CardContent>
      </Card>
    </SystemAdminModulePage>
  );
}
