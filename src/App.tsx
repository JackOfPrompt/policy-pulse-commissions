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
import AboutSystem from "./pages/AboutSystem";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ChangePassword from "./pages/ChangePassword";
import SystemAdminDashboard from "./pages/SystemAdminDashboard";
import TenantAdminDashboard from "./pages/dashboard/TenantAdminDashboard";
import EmployeeDashboard from "./pages/dashboard/EmployeeDashboard";
import AgentDashboard from "./pages/dashboard/AgentDashboard";
import CustomerDashboard from "./pages/dashboard/CustomerDashboard";
import TenantOrganizationManagement from "./pages/TenantOrganizationManagement";
import BranchManagementPage from "./pages/BranchManagementPage";
import { EmployeeManagement } from "@/components/EmployeeManagement";
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
import ManagePremiumTerms from "./pages/ManagePremiumTerms";
import ManagePolicyTenure from "./pages/ManagePolicyTenure";
import ManageProducts from "./pages/ManageProducts";
import ManageVehicleTypes from "./pages/ManageVehicleTypes";
import ManageRelationshipCodes from "./pages/ManageRelationshipCodes";
import ManageBusinessCategories from "./pages/ManageBusinessCategories";
import ManageOccupations from "./pages/ManageOccupations";
import ManageDepartments from "./pages/ManageDepartments";
import RolesPermissions from "./pages/RolesPermissions";
import { AgentManagement } from "./pages/AgentManagement";
import { AgentManagementLayout } from "./pages/tenant-admin/management/AgentManagementLayout";
import { AgentList } from "./pages/tenant-admin/management/agent-management/AgentList";
import { AgentCreate } from "./pages/tenant-admin/management/agent-management/AgentCreate";
import { AgentDetails } from "./pages/tenant-admin/management/agent-management/AgentDetails";
import { AgentApprovals } from "./pages/tenant-admin/management/agent-management/AgentApprovals";
import TenantManagement from "./pages/TenantManagement";
import SubscriptionManagement from "./pages/SubscriptionManagement";
import PlanComparison from "./pages/PlanComparison";
import ComparePlans from "./pages/ComparePlans";
import TenantAnalytics from "./pages/TenantAnalytics";
import CommissionManagement from "./pages/CommissionManagement";
import RevenueManagement from "./pages/RevenueManagement";
import OrganizationHierarchy from "./pages/revenue/OrganizationHierarchy";
import PremiumManagement from "./pages/revenue/PremiumManagement";
import CommissionEarnings from "./pages/revenue/CommissionEarnings";
import RevenueAllocation from "./pages/revenue/RevenueAllocation";
import SettlementManagement from "./pages/revenue/SettlementManagement";
import RevenueReports from "./pages/revenue/RevenueReports";
import FinanceDashboard from "./pages/finance/FinanceDashboard";
import GeneralLedger from "./pages/finance/GeneralLedger";
import JournalEntry from "./pages/finance/JournalEntry";
import AccountsWorkbench from "./pages/finance/AccountsWorkbench";
import SettlementsWorkbench from "./pages/finance/SettlementsWorkbench";
import PayoutManagement from "./pages/finance/PayoutManagement";
import VarianceWorkbench from "./pages/finance/VarianceWorkbench";
import BusinessManagementDashboard from "./pages/business/BusinessManagementDashboard";
import PolicyManagement from "./pages/PolicyManagement";
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
        <Route path="/about-system" element={<AboutSystem />} />
              
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
              <Route path="/admin/premium-terms" element={<ManagePremiumTerms />} />
              <Route path="/admin/policy-tenure" element={<ManagePolicyTenure />} />
              <Route path="/admin/products" element={<ManageProducts />} />
              <Route path="/admin/vehicle-types" element={<ManageVehicleTypes />} />
              <Route path="/admin/relationship-codes" element={<ManageRelationshipCodes />} />
              <Route path="/admin/business-categories" element={<ManageBusinessCategories />} />
              <Route path="/admin/occupations" element={<ManageOccupations />} />
              <Route path="/admin/departments" element={<ManageDepartments />} />
          <Route path="/admin/roles-permissions" element={<RolesPermissions />} />
          <Route path="/admin/agent-management" element={<AgentManagement />} />
          <Route path="/admin/policies" element={<PolicyManagement tenantId="default-tenant" />} />
              <Route path="/admin/tenants" element={<TenantManagement />} />
              <Route path="/admin/subscription-management" element={<SubscriptionManagement />} />
              <Route path="/admin/tenant-analytics" element={<TenantAnalytics />} />
              <Route path="/admin/create/tenant" element={<TenantManagement />} />
              
              {/* Commission Management Routes */}
              <Route path="/admin/commission-management" element={<CommissionManagement />} />
              <Route path="/admin/commission-rules" element={<CommissionManagement />} />
              <Route path="/admin/commission-compliance" element={<CommissionManagement />} />
              
              {/* Tenant Admin Routes */}
              <Route path="/tenant-admin-dashboard" element={<TenantAdminDashboard />} />
              <Route path="/admin/tenant-dashboard" element={<TenantAdminDashboard />} />
              
              {/* Tenant Organization Management Routes */}
              <Route path="/tenant-admin-dashboard/organization" element={<TenantOrganizationManagement />} />
              <Route path="/tenant-admin-dashboard/organization/employees" element={<EmployeeManagement />} />
              <Route path="/tenant-admin-dashboard/organization/branches" element={<BranchManagementPage />} />
              
              {/* Tenant Admin Management Routes */}
              <Route path="/tenant-admin-dashboard/management/agent-management" element={<AgentManagementLayout />}>
                <Route index element={<AgentList />} />
                <Route path="create" element={<AgentCreate />} />
                <Route path="details/:agentId" element={<AgentDetails />} />
                <Route path="approvals" element={<AgentApprovals />} />
              </Route>
              
              {/* Revenue Management Routes */}
              <Route path="/tenant-admin-dashboard/revenue" element={<RevenueManagement />} />
              <Route path="/tenant-admin-dashboard/revenue/hierarchy" element={<OrganizationHierarchy />} />
              <Route path="/tenant-admin-dashboard/revenue/premiums" element={<PremiumManagement />} />
              <Route path="/tenant-admin-dashboard/revenue/commission-earnings" element={<CommissionEarnings />} />
              <Route path="/tenant-admin-dashboard/revenue/allocation" element={<RevenueAllocation />} />
              <Route path="/tenant-admin-dashboard/revenue/settlements" element={<SettlementManagement />} />
              <Route path="/tenant-admin-dashboard/revenue/reports" element={<RevenueReports />} />
              
              {/* Finance & Business Management Routes */}
              <Route path="/tenant-admin-dashboard/finance" element={<FinanceDashboard />} />
              <Route path="/tenant-admin-dashboard/finance/general-ledger" element={<GeneralLedger />} />
              <Route path="/tenant-admin-dashboard/finance/journal-entry" element={<JournalEntry />} />
              <Route path="/tenant-admin-dashboard/finance/accounts" element={<AccountsWorkbench />} />
              <Route path="/tenant-admin-dashboard/finance/settlements" element={<SettlementsWorkbench />} />
              <Route path="/tenant-admin-dashboard/finance/payouts" element={<PayoutManagement />} />
              <Route path="/tenant-admin-dashboard/finance/variances" element={<VarianceWorkbench />} />
              <Route path="/tenant-admin-dashboard/business" element={<BusinessManagementDashboard />} />
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