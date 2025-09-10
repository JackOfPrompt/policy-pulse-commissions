import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Building2,
  Users,
  FileText,
  BarChart3,
  UserCheck,
  DollarSign,
  User,
  Shield,
  Home,
} from 'lucide-react';
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
} from '@/components/ui/sidebar';
import { useAuth } from '@/hooks/useAuth';

const AppSidebar = () => {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { profile } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : "hover:bg-sidebar-accent/50";

  // Define navigation items based on user role
  const getNavigationItems = () => {
    if (!profile) return [];

    const baseItems = [
      { title: "Dashboard", url: "/dashboard", icon: Home },
    ];

    switch (profile.role) {
      case 'super_admin':
        return [
          ...baseItems,
          { title: "Organizations", url: "/organizations", icon: Building2 },
          { title: "Users", url: "/users", icon: Users },
          { title: "Reports", url: "/reports", icon: BarChart3 },
        ];
      
      case 'admin':
        return [
          ...baseItems,
          { title: "Customers", url: "/customers", icon: Users },
          { title: "Policies", url: "/policies", icon: FileText },
          { title: "Agents", url: "/agents", icon: UserCheck },
          { title: "Commissions", url: "/commissions", icon: DollarSign },
        ];
      
      case 'employee':
        return [
          ...baseItems,
          { title: "Customers", url: "/customers", icon: Users },
          { title: "Policies", url: "/policies", icon: FileText },
        ];
      
      case 'agent':
        return [
          ...baseItems,
          { title: "My Customers", url: "/my-customers", icon: Users },
          { title: "My Policies", url: "/my-policies", icon: FileText },
          { title: "My Commissions", url: "/my-commissions", icon: DollarSign },
        ];
      
      case 'customer':
        return [
          ...baseItems,
          { title: "My Policies", url: "/my-policies", icon: Shield },
          { title: "My Profile", url: "/profile", icon: User },
        ];
      
      default:
        return baseItems;
    }
  };

  const navigationItems = getNavigationItems();

  return (
    <Sidebar className={collapsed ? "w-14" : "w-60"} collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            {!collapsed && "Navigation"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavCls}>
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
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
};

export default AppSidebar;