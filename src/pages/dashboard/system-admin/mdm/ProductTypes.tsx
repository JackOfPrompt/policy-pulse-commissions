import React, { useMemo } from "react";
import SystemAdminModulePage from "@/components/admin/SystemAdminModulePage";
import MdmCrudPage from "@/components/admin/mdm/MdmCrudPage";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function ProductTypes() {
  const { data: lobs } = useQuery({
    queryKey: ["mdm", "lobs", "labels"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("mdm_lobs")
        .select("id, lob_name")
        .order("lob_name", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    staleTime: 60_000,
  });

  const lobMap = useMemo<Record<string, string>>(
    () => Object.fromEntries((lobs || []).map((l: any) => [l.id, l.lob_name])),
    [lobs]
  );

  return (
    <SystemAdminModulePage
      slug="MDM/product-types"
      title="Product Types"
      description="Define product types and link them to Lines of Business"
    >
      <MdmCrudPage
        table="mdm_product_types"
        title="Product Type"
        columns={[
          { key: "product_type_code", label: "Code" },
          { key: "product_type_name", label: "Name" },
          {
            key: "lob_id",
            label: "Line of Business",
            render: (row) => lobMap[row.lob_id] || row.lob_id || "—",
          },
          { key: "status", label: "Status" },
        ]}
        formFields={[
          { name: "product_type_code", label: "Code", type: "text", placeholder: "E.g. MOTOR-TP", required: true },
          { name: "product_type_name", label: "Name", type: "text", placeholder: "E.g. Motor Third Party", required: true },
          {
            name: "lob_id",
            label: "Line of Business",
            type: "select",
            placeholder: "Select LOB",
            required: true,
            optionsSource: { table: "mdm_lobs", labelField: "lob_name", valueField: "id", orderBy: "lob_name" },
          },
          { name: "description", label: "Description", type: "textarea", placeholder: "Optional" },
          {
            name: "status",
            label: "Status",
            type: "select",
            options: [
              { label: "Active", value: "active" },
              { label: "inactive", value: "inactive" },
            ],
          },
        ]}
        searchKeys={["product_type_name", "product_type_code"]}
        orderBy="updated_at"
      />
    </SystemAdminModulePage>
  );
}
