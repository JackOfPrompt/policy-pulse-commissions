import React from "react";
import SystemAdminModulePage from "@/components/admin/SystemAdminModulePage";
import MdmCrudPage from "@/components/admin/mdm/MdmCrudPage";

export default function CitiesPincodes() {
  return (
    <SystemAdminModulePage slug="MDM/cities-pincodes" title="Cities & Pincodes" description="Manage cities, pincodes, and regions">
      <MdmCrudPage
        table="mdm_cities"
        title="Cities & Pincodes"
        columns={[
          { key: "city_name", label: "City" },
          { key: "pincode", label: "Pincode" },
          { key: "state_name", label: "State" },
          { key: "country_code", label: "Country" },
        ]}
        formFields={[
          { name: "city_name", label: "City Name", type: "text", required: true },
          { name: "pincode", label: "Pincode", type: "text", required: true },
          { name: "state_name", label: "State", type: "text" },
          { name: "country_code", label: "Country Code", type: "text" },
          { name: "description", label: "Description", type: "textarea" },
        ]}
        searchKeys={["city_name", "pincode", "state_name", "country_code"]}
      />
    </SystemAdminModulePage>
  );
}

