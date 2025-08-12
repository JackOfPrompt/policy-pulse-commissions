import React from "react";
import SystemAdminModulePage from "@/components/admin/SystemAdminModulePage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CitiesPincodes() {
  return (
    <SystemAdminModulePage slug="MDM/cities-pincodes" title="Cities & Pincodes" description="Manage cities, pincodes, and regions">
      <Card>
        <CardHeader>
          <CardTitle>Cities & Pincodes Schema</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          Columns: city_name, pincode, state, country.
        </CardContent>
      </Card>
    </SystemAdminModulePage>
  );
}
