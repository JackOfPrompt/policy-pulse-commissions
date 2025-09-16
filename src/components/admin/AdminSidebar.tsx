import { Users, Building2, UserCheck, Briefcase, ShoppingCart, Settings, FileText, Shield, DollarSign } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const navigationItems = [
  { title: "Dashboard", url: "/admin", icon: Settings },
  { title: "Customers", url: "/admin/customers", icon: Users },
  { title: "Agents", url: "/admin/agents", icon: UserCheck },
  { title: "Employees", url: "/admin/employees", icon: Users },
  { title: "Branches", url: "/admin/branches", icon: Building2 },
  { title: "MISP Management", url: "/admin/misp-management", icon: Briefcase },
  { title: "Policies", url: "/admin/policies", icon: Shield },
  { title: "Policy Upload", url: "/admin/policy-upload", icon: FileText },
  { title: "Policy Review", url: "/admin/policy-review", icon: FileText },
  { title: "Commissions", url: "/admin/unified-commissions", icon: DollarSign },
  
];

export function AdminSidebar() {
  const location = useLocation();
  const currentPath = location.pathname;
  const { state } = useSidebar();

  const isActive = (path: string) => {
    if (path === "/admin") {
      return currentPath === path;
    }
    return currentPath.startsWith(path);
  };
  
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-muted text-primary font-medium" : "hover:bg-muted/50";

  return (
    <Sidebar className={state === "collapsed" ? "w-14" : "w-60"} collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Management</SidebarGroupLabel>
          
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end={item.url === "/admin"}
                      className={({ isActive: navIsActive }) => getNavCls({ isActive: isActive(item.url) })}
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {state !== "collapsed" && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}