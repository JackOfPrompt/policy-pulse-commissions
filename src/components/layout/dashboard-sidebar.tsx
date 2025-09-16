import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { 
  BarChart3, 
  Building2, 
  ChevronDown,
  FileText,
  Home,
  Shield,
  Users,
  UserCheck,
  DollarSign,
  Activity,
  Upload,
  Eye,
  Menu,
  X,
  LayoutDashboard,
  CheckCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface NavigationItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface DashboardSidebarProps {
  role: string;
}

const roleNavigation: Record<string, NavigationItem[]> = {
  superadmin: [
    { title: "Dashboard", href: "/superadmin/dashboard", icon: LayoutDashboard },
    { title: "Tenant Management", href: "/superadmin/tenants", icon: Building2 },
    { title: "Organizations", href: "/superadmin/orgs", icon: Building2 },
    { title: "Users", href: "/superadmin/users", icon: Users },
    { title: "Master Data", href: "/superadmin/master-data", icon: FileText },
    { title: "Audit Logs", href: "/superadmin/audit", icon: Activity },
    { title: "Plans", href: "/superadmin/plans", icon: DollarSign },
    { title: "Subscriptions", href: "/superadmin/subscriptions", icon: Shield },
    { title: "Subscription Requests", href: "/superadmin/subscription-requests", icon: CheckCircle },
  ],
  admin: [
    { title: "Dashboard", href: "/admin/dashboard", icon: Home },
    { title: "Customers", href: "/admin/customers", icon: Users },
    { title: "Policies", href: "/admin/policies", icon: Shield },
    { title: "Commissions", href: "/admin/commissions", icon: DollarSign },
    { title: "Commission Reports", href: "/admin/commission-reports", icon: BarChart3 },
    { title: "Employees", href: "/admin/employees", icon: UserCheck },
    { title: "Agents", href: "/admin/agents", icon: Users },
    
    { title: "Branch Management", href: "/admin/branches", icon: Building2 },
    { title: "Subscription", href: "/admin/subscription", icon: Activity },
    { title: "Request Upgrade", href: "/admin/subscription/upgrade", icon: Upload },
  ],
  employee: [
    { title: "Dashboard", href: "/employee/dashboard", icon: Home },
    { title: "Customers", href: "/employee/customers", icon: Users },
    { title: "Policies", href: "/employee/policies", icon: Shield },
    { title: "Agent Management", href: "/employee/agents", icon: UserCheck },
  ],
  agent: [
    { title: "Dashboard", href: "/agent/dashboard", icon: Home },
    { title: "My Policies", href: "/agent/policies", icon: Shield },
    { title: "Commissions", href: "/agent/commissions", icon: DollarSign },
  ],
  customer: [
    { title: "Dashboard", href: "/customer/dashboard", icon: Home },
    { title: "My Policies", href: "/customer/policies", icon: Shield },
    { title: "Documents", href: "/customer/docs", icon: FileText },
  ],
};

export function DashboardSidebar({ role }: DashboardSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const navigation = roleNavigation[role] || [];

  return (
    <div className={cn(
      "flex h-full flex-col border-r bg-card transition-all duration-300",
      isCollapsed ? "w-16" : "w-64"
    )}>
      <div className="flex items-center justify-between p-4">
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <Shield className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">InsureTech</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-8 w-8 p-0"
        >
          {isCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
        </Button>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          const Icon = item.icon;
          
          return (
            <NavLink
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {!isCollapsed && <span>{item.title}</span>}
            </NavLink>
          );
        })}
      </nav>

      {!isCollapsed && (
        <div className="border-t p-4">
          <div className="text-xs text-muted-foreground">
            Role: <span className="font-medium text-foreground capitalize">{role}</span>
          </div>
        </div>
      )}
    </div>
  );
}