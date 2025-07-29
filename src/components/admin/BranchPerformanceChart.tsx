import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Building } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface FilterState {
  branchId: string | null;
  startDate: Date | null;
  endDate: Date | null;
  policyType: string | null;
}

interface BranchPerformanceChartProps {
  filters: FilterState;
}

interface BranchData {
  branch_name: string;
  total_premium: number;
  branch_id: string;
}

export const BranchPerformanceChart = ({ filters }: BranchPerformanceChartProps) => {
  const [chartData, setChartData] = useState<BranchData[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBranchPerformance();
  }, [filters]);

  const fetchBranchPerformance = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('policies')
        .select(`
          branch_id,
          premium_amount,
          branches (name)
        `);

      // Apply filters (excluding branch filter for comparison chart)
      if (filters.policyType) {
        query = query.eq('policy_type', filters.policyType);
      }
      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate.toISOString());
      }
      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;

      // Group by branch and calculate totals
      const branchMap = new Map<string, BranchData>();
      
      data?.forEach((policy: any) => {
        const branchId = policy.branch_id;
        const branchName = policy.branches?.name || 'Unknown Branch';
        const premium = policy.premium_amount || 0;

        if (branchMap.has(branchId)) {
          const existing = branchMap.get(branchId)!;
          existing.total_premium += premium;
        } else {
          branchMap.set(branchId, {
            branch_id: branchId,
            branch_name: branchName,
            total_premium: premium
          });
        }
      });

      // Convert to array and sort by total premium
      const sortedBranches = Array.from(branchMap.values())
        .sort((a, b) => b.total_premium - a.total_premium);

      setChartData(sortedBranches);
    } catch (error) {
      console.error('Error fetching branch performance:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBarClick = () => {
    navigate('/admin/branches');
  };

  const formatCurrency = (value: number) => {
    return `$${value.toLocaleString()}`;
  };

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building className="h-5 w-5 text-primary" />
          Branch Performance Comparison
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading branch performance...</div>
        ) : chartData.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No branch data found for the selected filters
          </div>
        ) : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="branch_name" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  interval={0}
                />
                <YAxis tickFormatter={formatCurrency} />
                <Tooltip 
                  formatter={(value) => [formatCurrency(value as number), 'Total Premium']}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                />
                <Bar 
                  dataKey="total_premium" 
                  fill="hsl(var(--primary))"
                  cursor="pointer"
                  onClick={handleBarClick}
                  className="hover:opacity-80"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};