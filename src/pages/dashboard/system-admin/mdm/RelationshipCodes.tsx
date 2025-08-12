import React from "react";
import SystemAdminModulePage from "@/components/admin/SystemAdminModulePage";
import MdmCrudPage from "@/components/admin/mdm/MdmCrudPage";

export default function RelationshipCodes() {
  return (
    <SystemAdminModulePage slug="MDM/relationship-codes" title="Relationship Codes" description="Manage relationship codes">
      <MdmCrudPage
        table="mdm_relationship_codes"
        title="Relationship Codes"
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

