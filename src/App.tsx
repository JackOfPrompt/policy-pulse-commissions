import React, { FC } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/AuthContext';
import { PermissionsProvider } from '@/hooks/usePermissions';
import { MasterDataProvider } from '@/contexts/MasterDataContext';
import { SimpleAuthProvider } from '@/components/auth/SimpleAuthContext';

// Pages
import RoleSelection from './pages/RoleSelection';
import Landing from './pages/marketing/Landing';
import AdminDashboard from './pages/admin/AdminDashboard';
import SystemOverview from './pages/admin/SystemOverview';
import ManualPurchase from './pages/admin/ManualPurchase';
import InsuranceProviders from './pages/admin/InsuranceProviders';
import ProviderDetail from './pages/admin/ProviderDetail';
import ProductManagement from './pages/admin/ProductManagement';
import ProductDetail from './pages/admin/ProductDetail';
import Agents from './pages/admin/Agents';
import Employees from './pages/admin/Employees';
import Branches from './pages/admin/Branches';
import PolicyDetail from './pages/admin/PolicyDetail';
import Policies from './pages/admin/Policies';
import Leads from './pages/admin/Leads';
import DocumentValidation from './pages/admin/DocumentValidation';
import Renewals from './pages/admin/Renewals';
import Commissions from './pages/admin/Commissions';
import Payouts from './pages/admin/Payouts';
import Finance from './pages/admin/Finance';
import Revenue from './pages/admin/Revenue';
import Business from './pages/admin/Business';
import Reports from './pages/admin/Reports';
import MasterData from './pages/admin/MasterData';
import RolesManagement from './pages/admin/RolesManagement';
import AgentDashboard from './pages/agent/AgentDashboard';
import EmployeeDashboard from './pages/employee/EmployeeDashboard';
import CustomerDashboard from './pages/customer/CustomerDashboard';
import TenantDashboard from './pages/tenant/TenantDashboard';
import TenantCatalog from './pages/tenant/Catalog';
import TenantOverrides from './pages/tenant/Overrides';
import TenantOverview from './pages/tenant/Overview';
import TenantManagement from './pages/admin/TenantManagement';
import { withPermission } from '@/hooks/usePermissions';
const ProtectedTenantManagement = withPermission(TenantManagement, 'tenant-management');
import TenantSelect from './pages/tenant/TenantSelect';
import AuthPage from './pages/auth/AuthPage';
import ChangePassword from './pages/auth/ChangePassword';
import NotFound from './pages/NotFound';
import { TenantAdminRoute } from '@/components/auth/TenantAdminRoute';
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App: FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <SimpleAuthProvider>
        <AuthProvider>
          <PermissionsProvider>
            <MasterDataProvider>
              <Router>
                <div className="min-h-screen bg-background">
                  <Routes>
                    <Route path="/" element={<Landing />} />
                    <Route path="/auth" element={<AuthPage />} />
                    <Route path="/auth/change-password" element={<TenantAdminRoute><ChangePassword /></TenantAdminRoute>} />
                    <Route path="/admin" element={<AdminDashboard />}>
                      <Route path="overview" element={<SystemOverview />} />
                      <Route path="manual-purchase" element={<ManualPurchase />} />
                      <Route path="providers" element={<InsuranceProviders />} />
                      <Route path="providers/:id" element={<ProviderDetail />} />
                      <Route path="product-management" element={<ProductManagement />} />
                      <Route path="products/:id" element={<ProductDetail />} />
                      <Route path="master-data" element={<MasterData />} />
                      <Route path="tenant-management" element={<ProtectedTenantManagement />} />
                      <Route path="roles" element={<RolesManagement />} />
                      <Route index element={<SystemOverview />} />
                    </Route>
                    <Route path="/agent/*" element={<AgentDashboard />} />
                    <Route path="/employee/*" element={<EmployeeDashboard />} />
                    <Route path="/customer/*" element={<CustomerDashboard />} />
                  <Route path="/tenant" element={<TenantAdminRoute><TenantDashboard /></TenantAdminRoute>}>
                    <Route path="overview" element={<TenantOverview />} />
                    <Route path="branches" element={<Branches />} />
                    <Route path="employees" element={<Employees />} />
                    <Route path="agents" element={<Agents />} />
                    <Route path="policies" element={<Policies />} />
                    <Route path="policies/:id" element={<PolicyDetail />} />
                    <Route path="leads" element={<Leads />} />
                    <Route path="document-validation" element={<DocumentValidation />} />
                    <Route path="renewals" element={<Renewals />} />
                    <Route path="commissions" element={<Commissions />} />
                    <Route path="payouts" element={<Payouts />} />
                    <Route path="finance" element={<Finance />} />
                    <Route path="revenue" element={<Revenue />} />
                    <Route path="business" element={<Business />} />
                    <Route path="reports" element={<Reports />} />
                    <Route path="catalog" element={<TenantCatalog />} />
                    <Route path="catalog/overrides" element={<TenantOverrides />} />
                    <Route index element={<TenantOverview />} />
                  </Route>
                    <Route path="/tenant-select" element={<TenantSelect />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                  <Toaster />
                </div>
              </Router>
            </MasterDataProvider>
          </PermissionsProvider>
        </AuthProvider>
      </SimpleAuthProvider>
    </QueryClientProvider>
  );
};

export default App;