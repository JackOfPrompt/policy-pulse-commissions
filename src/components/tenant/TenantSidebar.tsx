import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  BarChart3,
  MapPin,
  UserCheck,
  Users,
  FileText,
  Target,
  RefreshCw,
  DollarSign,
  CreditCard,
  Menu,
  X,
  Shield,
  Package,
  Wrench,
  CheckSquare,
  TrendingUp,
  PieChart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { usePermissions } from "@/hooks/usePermissions";
import { useSimpleAuth } from "@/components/auth/SimpleAuthContext";

const tenantMenuItems = [
  {
    title: "Overview",
    icon: BarChart3,
    path: "/tenant/overview",
    module: "dashboard",
  },
  {
    title: "Branches",
    icon: MapPin,
    path: "/tenant/branches",
    module: "branches",
  },
  {
    title: "Employees",
    icon: UserCheck,
    path: "/tenant/employees",
    module: "employees",
  },
  {
    title: "Agents",
    icon: Users,
    path: "/tenant/agents",
    module: "agents",
  },
  {
    title: "Policies",
    icon: FileText,
    path: "/tenant/policies",
    module: "policies",
  },
  {
    title: "Document Validation",
    icon: CheckSquare,
    path: "/tenant/document-validation",
    module: "document-validation",
  },
  {
    title: "Leads",
    icon: Target,
    path: "/tenant/leads",
    module: "leads",
  },
  {
    title: "Renewals",
    icon: RefreshCw,
    path: "/tenant/renewals",
    module: "renewals",
  },
  {
    title: "Commissions",
    icon: DollarSign,
    path: "/tenant/commissions",
    module: "commissions",
  },
  {
    title: "Payouts",
    icon: CreditCard,
    path: "/tenant/payouts",
    module: "payouts",
  },
  {
    title: "Finance",
    icon: DollarSign,
    path: "/tenant/finance",
    module: "finance",
  },
  {
    title: "Revenue",
    icon: TrendingUp,
    path: "/tenant/revenue",
    module: "revenue",
  },
  {
    title: "Business",
    icon: Target,
    path: "/tenant/business",
    module: "business",
  },
  {
    title: "Reports",
    icon: PieChart,
    path: "/tenant/reports",
    module: "reports",
  },
  {
    title: "Catalog",
    icon: Package,
    path: "/tenant/catalog",
    module: "products",
  },
  {
    title: "Overrides",
    icon: Wrench,
    path: "/tenant/catalog/overrides",
    module: "products",
  },
];

export function TenantSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { canAccessModule, loading } = usePermissions();
  const { logout } = useSimpleAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div
      className={cn(
        "bg-sidebar border-r border-sidebar-border transition-all duration-300",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-sidebar-primary" />
              <h1 className="text-lg font-semibold text-sidebar-foreground">
                Tenant Admin
              </h1>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-sidebar-foreground hover:text-sidebar-primary"
          >
            {isCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
          </Button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto p-2">
          <div className="space-y-1">
            {tenantMenuItems
              .filter((item) => loading || canAccessModule(item.module))
              .map((item) => {
                const IconComponent = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                        "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                        isActive
                          ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                          : "text-sidebar-foreground"
                      )
                    }
                    title={isCollapsed ? item.title : undefined}
                  >
                    <IconComponent className="h-4 w-4 flex-shrink-0" />
                    {!isCollapsed && <span className="font-medium">{item.title}</span>}
                  </NavLink>
                );
              })}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-sidebar-border space-y-2">
          <Button
            variant="ghost"
            size={isCollapsed ? "sm" : "default"}
            onClick={handleLogout}
            className="w-full text-sidebar-foreground hover:text-sidebar-primary hover:bg-sidebar-accent justify-start"
            title={isCollapsed ? "Logout" : undefined}
          >
            {/* Using the same icon for simplicity */}
            <span className="sr-only">Logout</span>
          </Button>
          {!isCollapsed && (
            <div className="text-xs text-sidebar-foreground/60 text-center">
              Tenant Admin v1.0
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
