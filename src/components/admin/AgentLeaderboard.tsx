import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Users, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface FilterState {
  branchId: string | null;
  startDate: Date | null;
  endDate: Date | null;
  policyType: string | null;
}

interface AgentLeaderboardProps {
  filters: FilterState;
}

interface AgentPerformance {
  agent_id: string;
  agent_name: string;
  policies_sold: number;
  total_premium: number;
}

export const AgentLeaderboard = ({ filters }: AgentLeaderboardProps) => {
  const [agentData, setAgentData] = useState<AgentPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAgentPerformance();
  }, [filters]);

  const fetchAgentPerformance = async () => {
    setLoading(true);
    try {
      let query = (supabase as any)
        .from('policies_new')
        .select(`
          agent_id,
          premium_amount,
          agents (full_name)
        `);

      // Apply filters
      if (filters.branchId) {
        query = query.eq('branch_id', filters.branchId);
      }
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

      // Group by agent and calculate totals
      const agentMap = new Map<string, AgentPerformance>();
      
      data?.forEach((policy: any) => {
        const agentId = policy.agent_id;
        const agentName = policy.agents?.full_name || 'Unknown Agent';
        const premium = policy.premium_amount || 0;

        if (agentMap.has(agentId)) {
          const existing = agentMap.get(agentId)!;
          existing.policies_sold += 1;
          existing.total_premium += premium;
        } else {
          agentMap.set(agentId, {
            agent_id: agentId,
            agent_name: agentName,
            policies_sold: 1,
            total_premium: premium
          });
        }
      });

      // Convert to array and sort by total premium
      const sortedAgents = Array.from(agentMap.values())
        .sort((a, b) => b.total_premium - a.total_premium);

      setAgentData(sortedAgents);
    } catch (error) {
      console.error('Error fetching agent performance:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    // Placeholder for export functionality
    console.log('Exporting agent performance to Excel...');
  };

  return (
    <Card className="shadow-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Agent Leaderboard
        </CardTitle>
        <Button variant="outline" size="sm" onClick={exportToExcel}>
          <Download className="h-4 w-4 mr-2" />
          Export to Excel
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading agent performance...</div>
        ) : agentData.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No agent data found for the selected filters
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>Agent Name</TableHead>
                <TableHead className="text-right">Policies Sold</TableHead>
                <TableHead className="text-right">Total Premium</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agentData.map((agent, index) => (
                <TableRow 
                  key={agent.agent_id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate(`/admin/agents/${agent.agent_id}`)}
                >
                  <TableCell className="font-medium">
                    #{index + 1}
                  </TableCell>
                  <TableCell>{agent.agent_name}</TableCell>
                  <TableCell className="text-right">
                    {agent.policies_sold.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ${agent.total_premium.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};