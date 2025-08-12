import React from "react";
import SystemAdminModulePage from "@/components/admin/SystemAdminModulePage";
import MdmCrudPage from "@/components/admin/mdm/MdmCrudPage";

export default function VehicleData() {
  return (
    <SystemAdminModulePage slug="MDM/vehicle-data" title="Vehicle Data" description="Manage vehicle make, model, variant, year, and fuel type">
      <MdmCrudPage
        table="mdm_vehicles"
        title="Vehicles"
        columns={[
          { key: "code", label: "Code" },
          { key: "name", label: "Name" },
          { key: "make", label: "Make" },
          { key: "model", label: "Model" },
          { key: "year", label: "Year" },
          { key: "fuel_type", label: "Fuel" },
        ]}
        formFields={[
          { name: "code", label: "Code", type: "text", required: true },
          { name: "name", label: "Name", type: "text", required: true },
          { name: "vehicle_type_id", label: "Vehicle Type", type: "select", required: true, optionsSource: { table: "mdm_vehicle_types", valueField: "id", labelField: "vehicle_type_name", orderBy: "vehicle_type_name" } },
          { name: "make", label: "Make", type: "text" },
          { name: "model", label: "Model", type: "text" },
          { name: "variant", label: "Variant", type: "text" },
          { name: "year", label: "Year", type: "number" },
          { name: "fuel_type", label: "Fuel Type", type: "text" },
          { name: "description", label: "Description", type: "textarea" },
        ]}
        searchKeys={["name", "code", "make", "model", "fuel_type"]}
      />
    </SystemAdminModulePage>
  );
}

