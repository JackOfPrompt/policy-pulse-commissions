// @ts-nocheck
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, UserCheck, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface FilterState {
  branchId: string | null;
  startDate: Date | null;
  endDate: Date | null;
  policyType: string | null;
}

interface KPICardsProps {
  filters: FilterState;
}

interface KPIData {
  totalPolicies: number;
  activeAgents: number;
  monthlyRevenue: number;
}

export const KPICards = ({ filters }: KPICardsProps) => {
  const [kpiData, setKpiData] = useState<KPIData>({
    totalPolicies: 0,
    activeAgents: 0,
    monthlyRevenue: 0
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchKPIData();
  }, [filters]);

  const fetchKPIData = async () => {
    setLoading(true);
    try {
      // Build query filters
      let policyQuery = supabase.from('policies').select('id, premium_amount, created_at');
      let agentQuery = supabase.from('agents').select('id').eq('status', 'Active');
      let commissionQuery = supabase.from('commissions').select('commission_amount, created_at');

      // Apply branch filter
      if (filters.branchId) {
        policyQuery = policyQuery.eq('branch_id', filters.branchId);
        agentQuery = agentQuery.eq('branch_id', filters.branchId);
      }

      // Apply policy type filter
      if (filters.policyType) {
        policyQuery = policyQuery.eq('policy_type', filters.policyType);
      }

      // Apply date filters
      if (filters.startDate) {
        policyQuery = policyQuery.gte('created_at', filters.startDate.toISOString());
        commissionQuery = commissionQuery.gte('created_at', filters.startDate.toISOString());
      }
      if (filters.endDate) {
        policyQuery = policyQuery.lte('created_at', filters.endDate.toISOString());
        commissionQuery = commissionQuery.lte('created_at', filters.endDate.toISOString());
      }

      // Execute queries
      const [policiesResult, agentsResult, commissionsResult] = await Promise.all([
        policyQuery,
        agentQuery,
        commissionQuery
      ]);

      if (policiesResult.error) throw policiesResult.error;
      if (agentsResult.error) throw agentsResult.error;
      if (commissionsResult.error) throw commissionsResult.error;

      const totalPolicies = policiesResult.data?.length || 0;
      const activeAgents = agentsResult.data?.length || 0;
      const monthlyRevenue = commissionsResult.data?.reduce((sum, commission) => sum + (commission.commission_amount || 0), 0) || 0;

      setKpiData({
        totalPolicies,
        activeAgents,
        monthlyRevenue
      });
    } catch (error) {
      console.error('Error fetching KPI data:', error);
    } finally {
      setLoading(false);
    }
  };

  const kpiCards = [
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
    },
    {
      title: "Revenue This Month",
      value: loading ? "..." : `$${kpiData.monthlyRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: "accent",
      onClick: () => navigate("/admin/commissions")
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {kpiCards.map((card) => {
        const IconComponent = card.icon;
        return (
          <Card 
            key={card.title} 
            className="shadow-card hover:shadow-lg transition-all cursor-pointer"
            onClick={card.onClick}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <IconComponent className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{card.value}</div>
              <Badge variant="default" className="mt-2 bg-gradient-success">
                Click to view details
              </Badge>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};