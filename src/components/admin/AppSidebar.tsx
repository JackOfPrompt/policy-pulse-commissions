import { useLocation, NavLink } from "react-router-dom";
import { LayoutDashboard, Database, Building2, BadgeDollarSign, Shield, Settings, Users2, BarChart3 } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const items = [
  { title: "Dashboard", url: "/dashboard/system-admin/Overview", icon: LayoutDashboard },
  { title: "Tenant Management", url: "/dashboard/system-admin/TenantManagement", icon: Building2 },
  { title: "Subscription Plans", url: "/dashboard/system-admin/SubscriptionPlans", icon: BadgeDollarSign },
  { title: "Roles & Permissions", url: "/dashboard/system-admin/RolesPermissions", icon: Users2 },
  { title: "Reports", url: "/dashboard/system-admin/Reports", icon: BarChart3 },
  { title: "Security", url: "/dashboard/system-admin/Security", icon: Shield },
  { title: "Settings", url: "/dashboard/system-admin/Settings", icon: Settings },
];

export function AppSidebar() {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>System Admin</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={currentPath === item.url}>
                    <NavLink to={item.url} end>
                      <item.icon className="mr-2 h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
<SidebarGroupLabel>Master Data Management (MDM)</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={currentPath === "/dashboard/system-admin/MDM"}>
                  <NavLink to="/dashboard/system-admin/MDM" end>
                    <Database className="mr-2 h-4 w-4" />
                    <span>Master Data Management</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={currentPath === "/dashboard/system-admin/MDM/lobs"}>
                  <NavLink to="/dashboard/system-admin/MDM/lobs" end>
                    <span>Line of Business</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={currentPath === "/dashboard/system-admin/MDM/product-types"}>
                  <NavLink to="/dashboard/system-admin/MDM/product-types" end>
                    <span>Product Types</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={currentPath === "/dashboard/system-admin/MDM/vehicle-types"}>
                  <NavLink to="/dashboard/system-admin/MDM/vehicle-types" end>
                    <span>Vehicle Types</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={currentPath === "/dashboard/system-admin/MDM/vehicle-data"}>
                  <NavLink to="/dashboard/system-admin/MDM/vehicle-data" end>
                    <span>Vehicle Data</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={currentPath === "/dashboard/system-admin/MDM/cities-pincodes"}>
                  <NavLink to="/dashboard/system-admin/MDM/cities-pincodes" end>
                    <span>Cities & Pincodes</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={currentPath === "/dashboard/system-admin/MDM/relationship-codes"}>
                  <NavLink to="/dashboard/system-admin/MDM/relationship-codes" end>
                    <span>Relationship Codes</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={currentPath === "/dashboard/system-admin/MDM/health-conditions"}>
                  <NavLink to="/dashboard/system-admin/MDM/health-conditions" end>
                    <span>Health Conditions</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={currentPath === "/dashboard/system-admin/MDM/business-categories"}>
                  <NavLink to="/dashboard/system-admin/MDM/business-categories" end>
                    <span>Business Categories</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={currentPath === "/dashboard/system-admin/MDM/occupations"}>
                  <NavLink to="/dashboard/system-admin/MDM/occupations" end>
                    <span>Occupations</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={currentPath === "/dashboard/system-admin/MDM/departments"}>
                  <NavLink to="/dashboard/system-admin/MDM/departments" end>
                    <span>Departments</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

