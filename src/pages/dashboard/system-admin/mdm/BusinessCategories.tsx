import React from "react";
import SystemAdminModulePage from "@/components/admin/SystemAdminModulePage";
import MdmCrudPage from "@/components/admin/mdm/MdmCrudPage";

export default function BusinessCategories() {
  return (
    <SystemAdminModulePage slug="MDM/business-categories" title="Business Categories" description="Manage business categories">
      <MdmCrudPage
        table="mdm_business_categories"
        title="Business Categories"
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

