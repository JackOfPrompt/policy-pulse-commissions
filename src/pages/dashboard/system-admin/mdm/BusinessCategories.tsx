import React from "react";
import SystemAdminModulePage from "@/components/admin/SystemAdminModulePage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function BusinessCategories() {
  return (
    <SystemAdminModulePage slug="MDM/business-categories" title="Business Categories" description="Manage business categories">
      <Card>
        <CardHeader>
          <CardTitle>Business Categories</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          Columns: category_name, code.
        </CardContent>
      </Card>
    </SystemAdminModulePage>
  );
}
