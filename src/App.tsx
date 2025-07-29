import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/auth/Login";
import VerifyOTP from "./pages/auth/VerifyOTP";
import AdminDashboard from "./pages/admin/AdminDashboard";
import Overview from "./pages/admin/Overview";
import InsuranceProviders from "./pages/admin/InsuranceProviders";
import ProviderDetail from "./pages/admin/ProviderDetail";
import ProductDetail from "./pages/admin/ProductDetail";
import AgentDetail from "./pages/admin/AgentDetail";
import EmployeeDetail from "./pages/admin/EmployeeDetail";
import BranchDetail from "./pages/admin/BranchDetail";
import Products from "./pages/admin/Products";
import Agents from "./pages/admin/Agents";
import Employees from "./pages/admin/Employees";
import Branches from "./pages/admin/Branches";
import Policies from "./pages/admin/Policies";
import Renewals from "./pages/admin/Renewals";
import Commissions from "./pages/admin/Commissions";
import Payouts from "./pages/admin/Payouts";
import Reports from "./pages/admin/Reports";
import CommissionReports from "./pages/admin/CommissionReports";
import PayoutReports from "./pages/admin/PayoutReports";
import TransactionReports from "./pages/admin/TransactionReports";


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          {/* Authentication Routes */}
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/verify-otp" element={<VerifyOTP />} />
          {/* Admin Dashboard Routes - No Authentication Required */}
          <Route path="/admin" element={<AdminDashboard />}>
            <Route path="overview" element={<Overview />} />
            <Route path="providers/:id" element={<ProviderDetail />} />
            <Route path="providers" element={<InsuranceProviders />} />
            <Route path="products/:id" element={<ProductDetail />} />
            <Route path="products" element={<Products />} />
            <Route path="agents/:id" element={<AgentDetail />} />
            <Route path="agents" element={<Agents />} />
            <Route path="employees/:id" element={<EmployeeDetail />} />
            <Route path="employees" element={<Employees />} />
            <Route path="branches/:id" element={<BranchDetail />} />
            <Route path="branches" element={<Branches />} />
            <Route path="policies" element={<Policies />} />
            <Route path="renewals" element={<Renewals />} />
            <Route path="commissions" element={<Commissions />} />
            <Route path="payouts" element={<Payouts />} />
            <Route path="reports" element={<Reports />} />
            <Route path="reports/transactions" element={<TransactionReports />} />
            <Route path="reports/commissions/received" element={<CommissionReports />} />
            <Route path="reports/payouts" element={<PayoutReports />} />
          </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
