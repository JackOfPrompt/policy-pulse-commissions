import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { 
  BarChart3, 
  Users, 
  FileText, 
  Calendar, 
  DollarSign,
  RefreshCw,
  Menu,
  X,
  Target,
  LogOut,
  CreditCard,
  TrendingUp,
  ShoppingCart
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const agentMenuItems = [
  {
    title: "Dashboard",
    icon: BarChart3,
    path: "/agent/dashboard"
  },
  {
    title: "Policy Purchase",
    icon: ShoppingCart,
    path: "/agent/policy-purchase"
  },
  {
    title: "My Customers",
    icon: Users,
    path: "/agent/customers"
  },
  {
    title: "Policies",
    icon: FileText,
    path: "/agent/policies"
  },
  {
    title: "My Commissions",
    icon: DollarSign,
    path: "/agent/commissions"
  },
  {
    title: "Payouts",
    icon: CreditCard,
    path: "/agent/payouts"
  },
  {
    title: "Renewals",
    icon: RefreshCw,
    path: "/agent/renewals"
  },
  {
    title: "Performance",
    icon: TrendingUp,
    path: "/agent/performance"
  }
];

export function AgentSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    signOut();
    navigate('/');
  };

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
              <Target className="h-8 w-8 text-sidebar-primary" />
              <h1 className="text-lg font-semibold text-sidebar-foreground">
                Agent Portal
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
            {agentMenuItems.map((item) => {
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
                    <span className="font-medium">{item.title}</span>
                  )}
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
            <LogOut className="h-4 w-4 flex-shrink-0" />
            {!isCollapsed && <span className="ml-2">Logout</span>}
          </Button>
          {!isCollapsed && (
            <div className="text-xs text-sidebar-foreground/60 text-center">
              Agent Portal v1.0
            </div>
          )}
        </div>
      </div>
    </div>
  );
}