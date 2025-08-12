import React from "react";
import SystemAdminModulePage from "@/components/admin/SystemAdminModulePage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function VehicleTypes() {
  return (
    <SystemAdminModulePage slug="MDM/vehicle-types" title="Vehicle Types" description="Manage supported vehicle types">
      <Card>
        <CardHeader>
          <CardTitle>Vehicle Types</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          Supported values: car, bike, truck, bus.
        </CardContent>
      </Card>
    </SystemAdminModulePage>
  );
}
