import React from "react";
import SystemAdminModulePage from "@/components/admin/SystemAdminModulePage";
import MdmCrudPage from "@/components/admin/mdm/MdmCrudPage";

export default function Departments() {
  return (
    <SystemAdminModulePage slug="MDM/departments" title="Departments" description="Manage departments">
      <MdmCrudPage
        table="mdm_departments"
        title="Departments"
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

