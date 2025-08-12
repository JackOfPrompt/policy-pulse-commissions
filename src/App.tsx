import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import SelectRole from "./pages/SelectRole";
import AuthPage from "./pages/Auth";
import SystemAdminDashboard from "./pages/dashboard/SystemAdmin";
import ITSupportDashboard from "./pages/dashboard/ITSupport";
import TenantAdminDashboard from "./pages/dashboard/TenantAdmin";
import EmployeeDashboard from "./pages/dashboard/Employee";
import AgentDashboard from "./pages/dashboard/Agent";
import CustomerDashboard from "./pages/dashboard/Customer";
import Overview from "./pages/dashboard/system-admin/Overview";
import MDM from "./pages/dashboard/system-admin/MDM";
import TenantManagement from "./pages/dashboard/system-admin/TenantManagement";
import SubscriptionPlans from "./pages/dashboard/system-admin/SubscriptionPlans";
import RolesPermissions from "./pages/dashboard/system-admin/RolesPermissions";
import Reports from "./pages/dashboard/system-admin/Reports";
import Security from "./pages/dashboard/system-admin/Security";
import Settings from "./pages/dashboard/system-admin/Settings";
import Lobs from "./pages/dashboard/system-admin/mdm/Lobs";
import ProductTypes from "./pages/dashboard/system-admin/mdm/ProductTypes";
import VehicleTypes from "./pages/dashboard/system-admin/mdm/VehicleTypes";
import VehicleData from "./pages/dashboard/system-admin/mdm/VehicleData";
import CitiesPincodes from "./pages/dashboard/system-admin/mdm/CitiesPincodes";
import RelationshipCodes from "./pages/dashboard/system-admin/mdm/RelationshipCodes";
import HealthConditions from "./pages/dashboard/system-admin/mdm/HealthConditions";
import BusinessCategories from "./pages/dashboard/system-admin/mdm/BusinessCategories";
import Occupations from "./pages/dashboard/system-admin/mdm/Occupations";
import Departments from "./pages/dashboard/system-admin/mdm/Departments";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/select-role" element={<SelectRole />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/dashboard/system-admin" element={<Navigate to="/dashboard/system-admin/Overview" replace />} />
            <Route path="/dashboard/system-admin/Overview" element={<Overview />} />
            <Route path="/dashboard/system-admin/MDM" element={<MDM />} />
            <Route path="/dashboard/system-admin/MDM/lobs" element={<Lobs />} />
            <Route path="/dashboard/system-admin/MDM/product-types" element={<ProductTypes />} />
            <Route path="/dashboard/system-admin/MDM/vehicle-types" element={<VehicleTypes />} />
            <Route path="/dashboard/system-admin/MDM/vehicle-data" element={<VehicleData />} />
            <Route path="/dashboard/system-admin/MDM/cities-pincodes" element={<CitiesPincodes />} />
            <Route path="/dashboard/system-admin/MDM/relationship-codes" element={<RelationshipCodes />} />
            <Route path="/dashboard/system-admin/MDM/health-conditions" element={<HealthConditions />} />
            <Route path="/dashboard/system-admin/MDM/business-categories" element={<BusinessCategories />} />
            <Route path="/dashboard/system-admin/MDM/occupations" element={<Occupations />} />
            <Route path="/dashboard/system-admin/MDM/departments" element={<Departments />} />
            <Route path="/dashboard/system-admin/TenantManagement" element={<TenantManagement />} />
            <Route path="/dashboard/system-admin/SubscriptionPlans" element={<SubscriptionPlans />} />
            <Route path="/dashboard/system-admin/RolesPermissions" element={<RolesPermissions />} />
            <Route path="/dashboard/system-admin/Reports" element={<Reports />} />
            <Route path="/dashboard/system-admin/Security" element={<Security />} />
            <Route path="/dashboard/system-admin/Settings" element={<Settings />} />
            <Route path="/dashboard/it-support" element={<ITSupportDashboard />} />
            <Route path="/dashboard/tenant-admin" element={<TenantAdminDashboard />} />
            <Route path="/dashboard/employee" element={<EmployeeDashboard />} />
            <Route path="/dashboard/agent" element={<AgentDashboard />} />
            <Route path="/dashboard/customer" element={<CustomerDashboard />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
