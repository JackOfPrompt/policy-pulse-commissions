import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Products from "./pages/Products";
import About from "./pages/About";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ChangePassword from "./pages/ChangePassword";
import SystemAdminDashboard from "./pages/SystemAdminDashboard";
import TenantAdminDashboard from "./pages/dashboard/TenantAdminDashboard";
import EmployeeDashboard from "./pages/dashboard/EmployeeDashboard";
import AgentDashboard from "./pages/dashboard/AgentDashboard";
import CustomerDashboard from "./pages/dashboard/CustomerDashboard";
import ManageInsuranceProviders from "./pages/ManageInsuranceProviders";
import ManageLineOfBusiness from "./pages/ManageLineOfBusiness";
import ManageCitiesPincodes from "./pages/ManageCitiesPincodes";
import ManageLocations from "./pages/ManageLocations";
import ManageProductCategories from "./pages/ManageProductCategories";
import ManageAddons from "./pages/ManageAddons";
import ManageHealthConditions from "./pages/ManageHealthConditions";
import ManagePolicyTypes from "./pages/ManagePolicyTypes";
import ManagePlanTypes from "./pages/ManagePlanTypes";
import ManagePremiumFrequency from "./pages/ManagePremiumFrequency";
import ManagePremiumTypes from "./pages/ManagePremiumTypes";
import ManagePremiumTerms from "./pages/ManagePremiumTerms";
import ManagePolicyTenure from "./pages/ManagePolicyTenure";
import ManageProducts from "./pages/ManageProducts";
import ManageVehicleTypes from "./pages/ManageVehicleTypes";
import ManageRelationshipCodes from "./pages/ManageRelationshipCodes";
import ManageBusinessCategories from "./pages/ManageBusinessCategories";
import ManageOccupations from "./pages/ManageOccupations";
import TenantManagement from "./pages/TenantManagement";
import PlanComparison from "./pages/PlanComparison";
import ComparePlans from "./pages/ComparePlans";
import NotFound from "./pages/NotFound";

const App: React.FC = () => {
  // Create QueryClient inside the component to ensure proper React context
  const queryClient = React.useMemo(() => new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  }), []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Index />} />
              <Route path="/products" element={<Products />} />
              <Route path="/compare-plans" element={<ComparePlans />} />
              <Route path="/plan-comparison" element={<PlanComparison />} />
              <Route path="/about" element={<About />} />
              
              {/* Auth routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/change-password" element={<ChangePassword />} />
              
              {/* Dashboard routes (direct access) */}
              <Route path="/admin-dashboard" element={<SystemAdminDashboard />} />
              <Route path="/manage-insurance-providers" element={<ManageInsuranceProviders />} />
              <Route path="/admin/lines-of-business" element={<ManageLineOfBusiness />} />
              <Route path="/admin/cities-pincodes" element={<ManageCitiesPincodes />} />
              <Route path="/admin/locations" element={<ManageLocations />} />
              <Route path="/admin/subproducts" element={<ManageProductCategories />} />
              <Route path="/admin/sub-products" element={<ManageProductCategories />} />
              <Route path="/admin/add-ons" element={<ManageAddons />} />
              <Route path="/admin/health-conditions" element={<ManageHealthConditions />} />
              <Route path="/admin/policy-types" element={<ManagePolicyTypes />} />
              <Route path="/admin/plan-types" element={<ManagePlanTypes />} />
              <Route path="/admin/premium-frequency" element={<ManagePremiumFrequency />} />
              <Route path="/admin/premium-types" element={<ManagePremiumTypes />} />
              <Route path="/admin/premium-terms" element={<ManagePremiumTerms />} />
              <Route path="/admin/policy-tenure" element={<ManagePolicyTenure />} />
              <Route path="/admin/products" element={<ManageProducts />} />
              <Route path="/admin/vehicle-types" element={<ManageVehicleTypes />} />
              <Route path="/admin/relationship-codes" element={<ManageRelationshipCodes />} />
              <Route path="/admin/business-categories" element={<ManageBusinessCategories />} />
              <Route path="/admin/occupations" element={<ManageOccupations />} />
              <Route path="/admin/tenants" element={<TenantManagement />} />
              <Route path="/admin/create/tenant" element={<TenantManagement />} />
              
              <Route path="/tenant-admin-dashboard" element={<TenantAdminDashboard />} />
              <Route path="/employee-dashboard" element={<EmployeeDashboard />} />
              <Route path="/agent-dashboard" element={<AgentDashboard />} />
              <Route path="/customer-dashboard" element={<CustomerDashboard />} />
              
              {/* 404 route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;