import React from "react";
import SystemAdminModulePage from "@/components/admin/SystemAdminModulePage";
import MdmCrudPage from "@/components/admin/mdm/MdmCrudPage";

export default function VehicleTypes() {
  return (
    <SystemAdminModulePage slug="MDM/vehicle-types" title="Vehicle Types" description="Manage supported vehicle types">
      <MdmCrudPage
        table="mdm_vehicle_types"
        title="Vehicle Types"
        columns={[
          { key: "vehicle_type_code", label: "Code" },
          { key: "vehicle_type_name", label: "Name" },
          { key: "status", label: "Status" },
        ]}
        formFields={[
          { name: "vehicle_type_code", label: "Code", type: "text", required: true },
          { name: "vehicle_type_name", label: "Name", type: "text", required: true },
          { name: "description", label: "Description", type: "textarea" },
        ]}
        searchKeys={["vehicle_type_name", "vehicle_type_code"]}
      />
    </SystemAdminModulePage>
  );
}

