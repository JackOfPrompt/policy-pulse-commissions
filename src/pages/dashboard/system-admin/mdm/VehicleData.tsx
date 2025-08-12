import React from "react";
import SystemAdminModulePage from "@/components/admin/SystemAdminModulePage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function VehicleData() {
  return (
    <SystemAdminModulePage slug="MDM/vehicle-data" title="Vehicle Data" description="Manage vehicle make, model, variant, year, and fuel type">
      <Card>
        <CardHeader>
          <CardTitle>Vehicle Data Schema</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          Columns: make, model, variant, year, fuel_type.
        </CardContent>
      </Card>
    </SystemAdminModulePage>
  );
}
