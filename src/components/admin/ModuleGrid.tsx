import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { LayoutDashboard, Database, Building2, BadgeDollarSign, Users2, BarChart3, Shield, Settings } from "lucide-react";
import { Link } from "react-router-dom";

const modules = [
  { title: "Overview", to: "/dashboard/system-admin/Overview", icon: LayoutDashboard },
  { title: "MDM", to: "/dashboard/system-admin/MDM", icon: Database },
  { title: "Tenant Management", to: "/dashboard/system-admin/TenantManagement", icon: Building2 },
  { title: "Subscription Plans", to: "/dashboard/system-admin/SubscriptionPlans", icon: BadgeDollarSign },
  { title: "Roles & Permissions", to: "/dashboard/system-admin/RolesPermissions", icon: Users2 },
  { title: "Reports", to: "/dashboard/system-admin/Reports", icon: BarChart3 },
  { title: "Security", to: "/dashboard/system-admin/Security", icon: Shield },
  { title: "Settings", to: "/dashboard/system-admin/Settings", icon: Settings },
];

export default function ModuleGrid() {
  return (
    <section aria-label="Modules" className="animate-fade-in">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {modules.map((m) => {
          const Icon = m.icon;
          const display = m.title.replace(/\s+/g, "");
          return (
            <Link
              key={m.title}
              to={m.to}
              aria-label={`Go to ${display}`}
              className="block group focus:outline-none focus:ring-2 focus:ring-primary rounded-lg"
            >
              <Card className="hover-scale transition-shadow shadow-sm group-hover:shadow-md h-28">
                <CardContent className="h-full p-4 flex flex-col items-center justify-center gap-2">
                  <Icon className="h-7 w-7 text-primary" aria-hidden="true" />
                  <span className="font-medium tracking-tight">{display}</span>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
