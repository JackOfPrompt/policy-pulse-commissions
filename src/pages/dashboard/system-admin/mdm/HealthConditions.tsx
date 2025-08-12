import React from "react";
import SystemAdminModulePage from "@/components/admin/SystemAdminModulePage";
import MdmCrudPage from "@/components/admin/mdm/MdmCrudPage";

export default function HealthConditions() {
  return (
    <SystemAdminModulePage slug="MDM/health-conditions" title="Health Conditions" description="Manage health conditions catalogue">
      <MdmCrudPage
        table="mdm_health_conditions"
        title="Health Conditions"
        columns={[
          { key: "code", label: "Code" },
          { key: "name", label: "Name" },
          { key: "description", label: "Description" },
        ]}
        formFields={[
          { name: "code", label: "Code", type: "text", required: true },
          { name: "name", label: "Name", type: "text", required: true },
          { name: "description", label: "Description", type: "textarea" },
        ]}
        searchKeys={["code", "name"]}
      />
    </SystemAdminModulePage>
  );
}

