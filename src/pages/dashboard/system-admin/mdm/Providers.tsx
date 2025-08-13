import React from "react";
import SystemAdminModulePage from "@/components/admin/SystemAdminModulePage";
import MdmCrudPage from "@/components/admin/mdm/MdmCrudPage";

export default function Providers() {
  return (
    <SystemAdminModulePage
      slug="MDM/providers"
      title="Insurance Providers"
      description="Manage insurance providers: codes, contact information, and status"
    >
      <MdmCrudPage
        table="mdm_providers"
        title="Provider"
        columns={[
          { key: "provider_code", label: "Code" },
          { key: "provider_name", label: "Name" },
          { key: "contact_email", label: "Email" },
          { key: "phone_number", label: "Phone" },
          {
            key: "website_url",
            label: "Website",
            render: (row) =>
              row.website_url ? (
                <a
                  href={row.website_url}
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                >
                  {row.website_url}
                </a>
              ) : (
                "—"
              ),
          },
          { key: "status", label: "Status" },
        ]}
        formFields={[
          { name: "provider_code", label: "Code", type: "text", placeholder: "E.g. HDFC-ERGO", required: true },
          { name: "provider_name", label: "Name", type: "text", placeholder: "Provider name", required: true },
          { name: "contact_email", label: "Contact Email", type: "text", placeholder: "name@example.com" },
          { name: "phone_number", label: "Phone Number", type: "text", placeholder: "+91 98765 43210" },
          { name: "website_url", label: "Website URL", type: "text", placeholder: "https://provider.com" },
          { name: "address", label: "Address", type: "textarea", placeholder: "Address (optional)" },
          {
            name: "status",
            label: "Status",
            type: "select",
            options: [
              { label: "Active", value: "active" },
              { label: "Inactive", value: "inactive" },
            ],
          },
        ]}
        searchKeys={["provider_name", "provider_code", "contact_email", "phone_number"]}
        orderBy="updated_at"
      />
    </SystemAdminModulePage>
  );
}
