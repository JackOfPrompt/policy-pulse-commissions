import React from "react";
import SystemAdminModulePage from "@/components/admin/SystemAdminModulePage";

export default function ProductTypes() {
  return (
    <SystemAdminModulePage
      slug="MDM/product-types"
      title="Product Types"
      description="Define product types and link them to Lines of Business"
    >
      <div className="text-sm text-muted-foreground">
        This section is under construction. Soon you'll be able to manage Product Types with dependent dropdowns (LOB → Product Type), search, sorting, pagination, and bulk actions.
      </div>
    </SystemAdminModulePage>
  );
}
