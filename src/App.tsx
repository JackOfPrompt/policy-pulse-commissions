import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Login from "./pages/Login";
import Auth from "./pages/Auth";
import SuperAdminDashboard from "./pages/dashboards/SuperAdminDashboard";
import AdminDashboard from "./pages/dashboards/AdminDashboard";
import EmployeeDashboard from "./pages/dashboards/EmployeeDashboard";
import EmployeeCustomers from "./pages/employee/Customers";
import EmployeePolicies from "./pages/employee/Policies";
import EmployeeAgents from "./pages/employee/Agents";
import EmployeePolicyUpload from "./pages/employee/PolicyUpload";
import AgentDashboard from "./pages/dashboards/AgentDashboard";
import AgentPolicies from "./pages/agent/Policies";
import AgentCommissions from "./pages/agent/Commissions";
import AgentCommissionsManagement from "./pages/agent/AgentCommissions";
import CustomerDashboard from "./pages/customer/CustomerDashboard";
import CustomerPolicies from "./pages/customer/CustomerPolicies";
import CustomerDocuments from "./pages/customer/CustomerDocuments";
import Organizations from "./pages/superadmin/Organizations";
import SuperAdminUsers from "./pages/superadmin/Users";
import AuditLogs from "./pages/superadmin/AuditLogs";
import Plans from "./pages/superadmin/Plans";
import Subscriptions from "./pages/superadmin/Subscriptions";
import SubscriptionRequests from "./pages/superadmin/SubscriptionRequests";
import TenantManagement from "./pages/superadmin/TenantManagement";
import PlanConditions from "./pages/superadmin/PlanConditions";
import MasterData from "./pages/superadmin/MasterData";
import MasterDataEditor from "./pages/superadmin/MasterDataEditor";
import PolicyExtraction from "./pages/PolicyExtraction";
import AdminCustomers from "./pages/admin/Customers";
import AdminPolicies from "./pages/admin/Policies";
import PolicyUpload from "./pages/admin/PolicyUpload";
import PolicyList from "./pages/admin/PolicyList";
import PolicyReview from "./pages/admin/PolicyReview";
import UnifiedCommissions from "./pages/admin/UnifiedCommissions";
import CommissionReports from "./pages/admin/CommissionReports";
import AdminEmployees from "./pages/admin/Employees";
import AdminAgents from "./pages/admin/Agents";
import CommissionTiers from "./pages/admin/CommissionTiers";

import BranchManagement from "./pages/admin/BranchManagement";
import MispManagement from "./pages/admin/MispManagement";
import Subscription from "./pages/admin/Subscription";
import SubscriptionUpgrade from "./pages/admin/SubscriptionUpgrade";
import PolicyIssuance from "./pages/employee/PolicyIssuance";
import AgentEarningsTracker from "./pages/agent/EarningsTracker";
import NotFound from "./pages/NotFound";
import { CSVParserDemo } from "./components/CSVParserDemo";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
          <Route path="/" element={<Auth />} />
          <Route path="/login" element={<Auth />} />
          <Route path="/auth" element={<Auth />} />
          
          {/* Super Admin Routes */}
          <Route path="/superadmin" element={
            <ProtectedRoute requiredRole="super_admin">
              <SuperAdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/superadmin/dashboard" element={
            <ProtectedRoute requiredRole="super_admin">
              <SuperAdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/superadmin/orgs" element={
            <ProtectedRoute requiredRole="super_admin">
              <Organizations />
            </ProtectedRoute>
          } />
          <Route path="/superadmin/users" element={
            <ProtectedRoute requiredRole="super_admin">
              <SuperAdminUsers />
            </ProtectedRoute>
          } />
          <Route path="/superadmin/audit" element={
            <ProtectedRoute requiredRole="super_admin">
              <AuditLogs />
            </ProtectedRoute>
          } />
          <Route path="/superadmin/plans" element={
            <ProtectedRoute requiredRole="super_admin">
              <Plans />
            </ProtectedRoute>
          } />
          <Route path="/superadmin/subscriptions" element={
            <ProtectedRoute requiredRole="super_admin">
              <Subscriptions />
            </ProtectedRoute>
          } />
          <Route path="/superadmin/subscription-requests" element={
            <ProtectedRoute requiredRole="super_admin">
              <SubscriptionRequests />
            </ProtectedRoute>
          } />
          <Route path="/superadmin/tenants" element={
            <ProtectedRoute requiredRole="super_admin">
              <TenantManagement />
            </ProtectedRoute>
          } />
          <Route path="/superadmin/plan-conditions" element={
            <ProtectedRoute requiredRole="super_admin">
              <PlanConditions />
            </ProtectedRoute>
          } />
          <Route path="/superadmin/master-data" element={
            <ProtectedRoute requiredRole="super_admin">
              <MasterData />
            </ProtectedRoute>
          } />
          <Route path="/superadmin/master-data/:datasetName" element={
            <ProtectedRoute requiredRole="super_admin">
              <MasterDataEditor />
            </ProtectedRoute>
          } />
          
          {/* Policy Management Routes */}
          <Route path="/policy-extraction" element={<PolicyExtraction />} />
          <Route path="/csv-parser" element={<CSVParserDemo />} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/dashboard" element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/customers" element={
            <ProtectedRoute requiredRole="admin">
              <AdminCustomers />
            </ProtectedRoute>
          } />
          <Route path="/admin/policies" element={
            <ProtectedRoute requiredRole="admin">
              <AdminPolicies />
            </ProtectedRoute>
          } />
          <Route path="/admin/policies/upload" element={
            <ProtectedRoute requiredRole="admin">
              <PolicyUpload />
            </ProtectedRoute>
          } />
          <Route path="/admin/policies/list" element={
            <ProtectedRoute requiredRole="admin">
              <PolicyList />
            </ProtectedRoute>
          } />
          <Route path="/admin/policies/review/:policyId" element={
            <ProtectedRoute requiredRole="admin">
              <PolicyReview />
            </ProtectedRoute>
          } />
          <Route path="/admin/policy-extraction" element={
            <ProtectedRoute allowedRoles={['admin', 'employee', 'agent']}>
              <PolicyExtraction />
            </ProtectedRoute>
          } />
          <Route path="/admin/commission-reports" element={
            <ProtectedRoute requiredRole="admin">
              <CommissionReports />
            </ProtectedRoute>
          } />
          <Route path="/admin/commissions" element={
            <ProtectedRoute requiredRole="admin">
              <UnifiedCommissions />
            </ProtectedRoute>
          } />
          <Route path="/admin/employees" element={
            <ProtectedRoute requiredRole="admin">
              <AdminEmployees />
            </ProtectedRoute>
          } />
          <Route path="/admin/agents" element={
            <ProtectedRoute requiredRole="admin">
              <AdminAgents />
            </ProtectedRoute>
          } />
          <Route path="/admin/commission-tiers" element={
            <ProtectedRoute requiredRole="admin">
              <CommissionTiers />
            </ProtectedRoute>
          } />
          <Route path="/admin/branches" element={
            <ProtectedRoute requiredRole="admin">
              <BranchManagement />
            </ProtectedRoute>
          } />
          <Route path="/admin/subscription" element={
            <ProtectedRoute requiredRole="admin">
              <Subscription />
            </ProtectedRoute>
          } />
          <Route path="/admin/subscription/upgrade" element={
            <ProtectedRoute requiredRole="admin">
              <SubscriptionUpgrade />
            </ProtectedRoute>
          } />
          
          {/* Employee Routes */}
          <Route path="/employee/dashboard" element={
            <ProtectedRoute requiredRole="employee">
              <EmployeeDashboard />
            </ProtectedRoute>
          } />
          <Route path="/employee/customers" element={
            <ProtectedRoute requiredRole="employee">
              <EmployeeCustomers />
            </ProtectedRoute>
          } />
          <Route path="/employee/policies" element={
            <ProtectedRoute requiredRole="employee">
              <EmployeePolicies />
            </ProtectedRoute>
          } />
          <Route path="/employee/policies/upload" element={
            <ProtectedRoute requiredRole="employee">
              <EmployeePolicyUpload />
            </ProtectedRoute>
          } />
          <Route path="/employee/policy-issuance" element={
            <ProtectedRoute requiredRole="employee">
              <PolicyIssuance />
            </ProtectedRoute>
          } />
          <Route path="/employee/policy-extraction" element={
            <ProtectedRoute allowedRoles={['admin', 'employee', 'agent']}>
              <PolicyExtraction />
            </ProtectedRoute>
          } />
          <Route path="/employee/agents" element={
            <ProtectedRoute requiredRole="employee">
              <EmployeeAgents />
            </ProtectedRoute>
          } />
          
          {/* Agent Routes */}
          <Route path="/agent" element={
            <ProtectedRoute requiredRole="agent">
              <AgentDashboard />
            </ProtectedRoute>
          } />
          <Route path="/agent/dashboard" element={
            <ProtectedRoute requiredRole="agent">
              <AgentDashboard />
            </ProtectedRoute>
          } />
          <Route path="/agent/policies" element={
            <ProtectedRoute requiredRole="agent">
              <AgentPolicies />
            </ProtectedRoute>
          } />
          <Route path="/agent/policy-extraction" element={
            <ProtectedRoute allowedRoles={['admin', 'employee', 'agent']}>
              <PolicyExtraction />
            </ProtectedRoute>
          } />
          <Route path="/agent/commissions" element={
            <ProtectedRoute requiredRole="agent">
              <AgentCommissions />
            </ProtectedRoute>
          } />
          <Route path="/agent/earnings" element={
            <ProtectedRoute requiredRole="agent">
              <AgentEarningsTracker />
            </ProtectedRoute>
          } />
          <Route path="/agents/commissions" element={
            <ProtectedRoute allowedRoles={['admin', 'agent']}>
              <AgentCommissionsManagement />
            </ProtectedRoute>
          } />
          
          {/* Customer Routes */}
          <Route path="/customer" element={
            <ProtectedRoute requiredRole="customer">
              <CustomerDashboard />
            </ProtectedRoute>
          } />
          <Route path="/customer/dashboard" element={
            <ProtectedRoute requiredRole="customer">
              <CustomerDashboard />
            </ProtectedRoute>
          } />
          <Route path="/customer/policies" element={
            <ProtectedRoute requiredRole="customer">
              <CustomerPolicies />
            </ProtectedRoute>
          } />
          <Route path="/customer/docs" element={
            <ProtectedRoute requiredRole="customer">
              <CustomerDocuments />
            </ProtectedRoute>
          } />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
