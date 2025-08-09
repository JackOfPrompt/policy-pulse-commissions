// @ts-nocheck
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  UserCheck, 
  DollarSign, 
  TrendingUp, 
  CreditCard, 
  RotateCcw,
  Calendar,
  Shield,
  Target
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface FilterState {
  branchId: string | null;
  startDate: Date | null;
  endDate: Date | null;
  policyType: string | null;
  lineOfBusiness: string | null;
  agentId: string | null;
  productId: string | null;
  providerId: string | null;
}

interface EnhancedKPICardsProps {
  filters: FilterState;
}

interface KPIData {
  totalPolicies: number;
  activeAgents: number;
  totalPremiumCollected: number;
  totalCommissionEarned: number;
  totalAgentPayouts: number;
  leadsConvertedThisMonth: number;
  activePoliciesInForce: number;
  upcomingRenewals: number;
}

export const EnhancedKPICards = ({ filters }: EnhancedKPICardsProps) => {
  const [kpiData, setKpiData] = useState<KPIData>({
    totalPolicies: 0,
    activeAgents: 0,
    totalPremiumCollected: 0,
    totalCommissionEarned: 0,
    totalAgentPayouts: 0,
    leadsConvertedThisMonth: 0,
    activePoliciesInForce: 0,
    upcomingRenewals: 0
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchKPIData();
  }, [filters]);

  const fetchKPIData = async () => {
    setLoading(true);
    try {
      // Get current month start and end for some calculations
      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const next30Days = new Date(now);
      next30Days.setDate(now.getDate() + 30);

      // Build base queries with filters
      let policyQuery = supabase.from('policies_new').select('*');
      let agentQuery = supabase.from('agents').select('id').eq('status', 'Active');
      let commissionQuery = supabase.from('commissions').select('*');
      let payoutQuery = supabase.from('payout_transactions').select('*');
      let leadQuery = supabase.from('leads').select('*');

      // Apply filters to all relevant queries
      if (filters.branchId) {
        policyQuery = policyQuery.eq('branch_id', filters.branchId);
        agentQuery = agentQuery.eq('branch_id', filters.branchId);
        leadQuery = leadQuery.eq('branch_id', filters.branchId);
      }

      if (filters.lineOfBusiness) {
        policyQuery = policyQuery.eq('line_of_business', filters.lineOfBusiness);
        leadQuery = leadQuery.eq('line_of_business', filters.lineOfBusiness);
      }

      if (filters.agentId) {
        policyQuery = policyQuery.eq('agent_id', filters.agentId);
        commissionQuery = commissionQuery.eq('agent_id', filters.agentId);
        payoutQuery = payoutQuery.eq('agent_id', filters.agentId);
      }

      if (filters.productId) {
        policyQuery = policyQuery.eq('product_id', filters.productId);
      }

      if (filters.providerId) {
        policyQuery = policyQuery.eq('insurer_id', filters.providerId);
      }

      // Apply date filters
      if (filters.startDate) {
        policyQuery = policyQuery.gte('created_at', filters.startDate.toISOString());
        commissionQuery = commissionQuery.gte('created_at', filters.startDate.toISOString());
        payoutQuery = payoutQuery.gte('created_at', filters.startDate.toISOString());
        leadQuery = leadQuery.gte('created_at', filters.startDate.toISOString());
      }
      if (filters.endDate) {
        policyQuery = policyQuery.lte('created_at', filters.endDate.toISOString());
        commissionQuery = commissionQuery.lte('created_at', filters.endDate.toISOString());
        payoutQuery = payoutQuery.lte('created_at', filters.endDate.toISOString());
        leadQuery = leadQuery.lte('created_at', filters.endDate.toISOString());
      }

      // Execute all queries in parallel
      const [
        policiesResult,
        agentsResult,
        commissionsResult,
        payoutsResult,
        leadsResult,
        activePoliciesResult,
        upcomingRenewalsResult,
        thisMonthLeadsResult
      ] = await Promise.all([
        policyQuery,
        agentQuery,
        commissionQuery,
        payoutQuery,
        leadQuery,
        supabase.from('policies_new').select('*').eq('status', 'Active'),
        supabase.from('policies_new').select('*').gte('policy_end_date', now.toISOString().split('T')[0]).lte('policy_end_date', next30Days.toISOString().split('T')[0]),
        supabase.from('leads').select('*').eq('lead_status', 'Converted').gte('updated_at', currentMonthStart.toISOString()).lte('updated_at', currentMonthEnd.toISOString())
      ]);

      // Process results
      const totalPolicies = policiesResult.data?.length || 0;
      const activeAgents = agentsResult.data?.length || 0;
      const totalPremiumCollected = policiesResult.data?.reduce((sum, policy) => sum + (policy.premium_amount || 0), 0) || 0;
      const totalCommissionEarned = commissionsResult.data?.reduce((sum, commission) => sum + (commission.commission_amount || 0), 0) || 0;
      const totalAgentPayouts = payoutsResult.data?.reduce((sum, payout) => sum + (payout.payout_amount || 0), 0) || 0;
      const leadsConvertedThisMonth = thisMonthLeadsResult.data?.length || 0;
      const activePoliciesInForce = activePoliciesResult.data?.length || 0;
      const upcomingRenewals = upcomingRenewalsResult.data?.length || 0;

      setKpiData({
        totalPolicies,
        activeAgents,
        totalPremiumCollected,
        totalCommissionEarned,
        totalAgentPayouts,
        leadsConvertedThisMonth,
        activePoliciesInForce,
        upcomingRenewals
      });
    } catch (error) {
      console.error('Error fetching KPI data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const kpiCards = [
    {
      title: "Total Premium Collected",
      value: loading ? "..." : formatCurrency(kpiData.totalPremiumCollected),
      icon: DollarSign,
      color: "primary",
      onClick: () => navigate("/admin/policies")
    },
    {
      title: "Total Commission Earned",
      value: loading ? "..." : formatCurrency(kpiData.totalCommissionEarned),
      icon: TrendingUp,
      color: "success",
      onClick: () => navigate("/admin/commissions")
    },
    {
      title: "Total Agent Payouts",
      value: loading ? "..." : formatCurrency(kpiData.totalAgentPayouts),
      icon: CreditCard,
      color: "accent",
      onClick: () => navigate("/admin/payouts")
    },
    {
      title: "Leads Converted This Month",
      value: loading ? "..." : kpiData.leadsConvertedThisMonth.toLocaleString(),
      icon: Target,
      color: "primary",
      onClick: () => navigate("/admin/leads")
    },
    {
      title: "Active Policies In Force",
      value: loading ? "..." : kpiData.activePoliciesInForce.toLocaleString(),
      icon: Shield,
      color: "success",
      onClick: () => navigate("/admin/policies")
    },
    {
      title: "Upcoming Renewals (30 Days)",
      value: loading ? "..." : kpiData.upcomingRenewals.toLocaleString(),
      icon: RotateCcw,
      color: "warning",
      onClick: () => navigate("/admin/renewals")
    },
    {
      title: "Total Policies Sold",
      value: loading ? "..." : kpiData.totalPolicies.toLocaleString(),
      icon: FileText,
      color: "primary",
      onClick: () => navigate("/admin/policies")
    },
    {
      title: "Active Agents",
      value: loading ? "..." : kpiData.activeAgents.toLocaleString(),
      icon: UserCheck,
      color: "success",
      onClick: () => navigate("/admin/agents")
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {kpiCards.map((card) => {
        const IconComponent = card.icon;
        return (
          <Card 
            key={card.title} 
            className="shadow-card hover:shadow-lg transition-all cursor-pointer bg-gradient-to-br from-background to-muted/20"
            onClick={card.onClick}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <IconComponent className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground mb-2">{card.value}</div>
              <Badge variant="secondary" className="text-xs">
                Click to view details
              </Badge>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};