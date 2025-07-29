import { useState } from "react";
import { NavLink } from "react-router-dom";
import { 
  BarChart3, 
  Building2, 
  Package, 
  Users, 
  UserCheck, 
  MapPin, 
  FileText, 
  RefreshCw, 
  DollarSign, 
  CreditCard, 
  PieChart,
  Menu,
  X,
  Shield
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const adminMenuItems = [
  {
    title: "Overview",
    icon: BarChart3,
    path: "/admin/overview",
    description: "Dashboard overview and analytics"
  },
  {
    title: "Insurance Providers",
    icon: Building2,
    path: "/admin/providers",
    description: "Manage insurance companies"
  },
  {
    title: "Products",
    icon: Package,
    path: "/admin/products",
    description: "Insurance products and plans"
  },
  {
    title: "Agents",
    icon: Users,
    path: "/admin/agents",
    description: "Insurance agents management"
  },
  {
    title: "Employees",
    icon: UserCheck,
    path: "/admin/employees",
    description: "Employee management"
  },
  {
    title: "Branches",
    icon: MapPin,
    path: "/admin/branches",
    description: "Branch locations and details"
  },
  {
    title: "Policies",
    icon: FileText,
    path: "/admin/policies",
    description: "Insurance policies management"
  },
  {
    title: "Renewals",
    icon: RefreshCw,
    path: "/admin/renewals",
    description: "Policy renewals tracking"
  },
  {
    title: "Commissions",
    icon: DollarSign,
    path: "/admin/commissions",
    description: "Commission calculations"
  },
  {
    title: "Payouts",
    icon: CreditCard,
    path: "/admin/payouts",
    description: "Payout management"
  },
  {
    title: "Reports",
    icon: PieChart,
    path: "/admin/reports",
    description: "Analytics and reporting"
  }
];

export function AdminSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className={cn(
      "bg-sidebar border-r border-sidebar-border transition-all duration-300",
      isCollapsed ? "w-16" : "w-64"
    )}>
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-sidebar-primary" />
              <h1 className="text-lg font-semibold text-sidebar-foreground">
                Admin Portal
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
            {adminMenuItems.map((item) => {
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
                  {!isCollapsed && (
                    <div className="flex-1">
                      <div className="font-medium">{item.title}</div>
                      <div className="text-xs opacity-75 mt-0.5">
                        {item.description}
                      </div>
                    </div>
                  )}
                </NavLink>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-sidebar-border">
          {!isCollapsed && (
            <div className="text-xs text-sidebar-foreground/60 text-center">
              Admin Dashboard v1.0
            </div>
          )}
        </div>
      </div>
    </div>
  );
}