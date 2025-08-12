import React from "react";
import SystemAdminModulePage from "@/components/admin/SystemAdminModulePage";
import { Link } from "react-router-dom";

export default function MDM() {
  return (
    <SystemAdminModulePage slug="MDM" title="Master Data Management" description="Master Data Management (MDM)">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {["Insurance Providers","Products","Policy Types","Add-ons","Vehicle Types","Cities & Pincodes"].map((t) => (
          <div key={t} className="p-4 rounded-lg border bg-card text-card-foreground hover-scale">{t}</div>
        ))}
      </div>
      <h2 className="mt-6 text-xl font-semibold">Supporting Data</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
        {[
          { label: "Vehicle Types", to: "/dashboard/system-admin/MDM/vehicle-types" },
          { label: "Vehicle Data", to: "/dashboard/system-admin/MDM/vehicle-data" },
          { label: "Cities & Pincodes", to: "/dashboard/system-admin/MDM/cities-pincodes" },
          { label: "Relationship Codes", to: "/dashboard/system-admin/MDM/relationship-codes" },
          { label: "Health Conditions", to: "/dashboard/system-admin/MDM/health-conditions" },
          { label: "Business Categories", to: "/dashboard/system-admin/MDM/business-categories" },
          { label: "Occupations", to: "/dashboard/system-admin/MDM/occupations" },
          { label: "Departments", to: "/dashboard/system-admin/MDM/departments" },
        ].map((item) => (
          <Link key={item.to} to={item.to} className="p-4 rounded-lg border bg-card text-card-foreground hover-scale focus:outline-none focus:ring-2 focus:ring-primary">
            {item.label}
          </Link>
        ))}
      </div>
    </SystemAdminModulePage>
  );
}
