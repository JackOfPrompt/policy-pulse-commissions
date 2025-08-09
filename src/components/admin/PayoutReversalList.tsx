import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, ExternalLink } from "lucide-react";
import { format } from "date-fns";

interface PayoutReversalPolicy {
  id: string;
  policy_number: string;
  policy_status: string;
  customer_name: string;
  premium_amount: number;
  status_updated_at: string;
  agent_name: string;
  insurer_name: string;
  payout_amount?: number;
  payout_date?: string;
}

export const PayoutReversalList = () => {
  const [policies, setPolicies] = useState<PayoutReversalPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchPayoutReversals();
  }, []);

  const fetchPayoutReversals = async () => {
    try {
      const { data, error } = await supabase
        .from('policies_new')
        .select(`
          id,
          policy_number,
          policy_status,
          customer_name,
          premium_amount,
          status_updated_at,
          agent_id,
          insurer_id
        `)
        .eq('payout_reversal_required', true)
        .order('status_updated_at', { ascending: false });

      if (error) throw error;

      // Fetch related data separately
      const enrichedPolicies = await Promise.all(
        data.map(async (policy) => {
          let agent_name = 'N/A';
          let insurer_name = 'N/A';
          let payout_amount: number | undefined;
          let payout_date: string | undefined;

          // Get agent name
          if (policy.agent_id) {
            const { data: agentData } = await supabase
              .from('agents')
              .select('name')
              .eq('id', policy.agent_id)
              .single();
            if (agentData) agent_name = agentData.name;
          }

          // Get insurer name
          if (policy.insurer_id) {
            const { data: insurerData } = await supabase
              .from('insurance_providers')
              .select('provider_name')
              .eq('id', policy.insurer_id)
              .single();
            if (insurerData) insurer_name = insurerData.provider_name;
          }

          // Get payout data
          const { data: payoutData } = await supabase
            .from('payout_transactions')
            .select('payout_amount, payout_date')
            .eq('policy_id', policy.id)
            .single();
          
          if (payoutData) {
            payout_amount = payoutData.payout_amount;
            payout_date = payoutData.payout_date;
          }

          return {
            ...policy,
            agent_name,
            insurer_name,
            payout_amount,
            payout_date
          };
        })
      );

      setPolicies(enrichedPolicies);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch policies requiring payout reversal",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const markReversalProcessed = async (policyId: string) => {
    try {
      const { error } = await supabase
        .from('policies_new')
        .update({ payout_reversal_required: false })
        .eq('id', policyId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Payout reversal marked as processed"
      });

      // Refresh the list
      fetchPayoutReversals();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update payout reversal status",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          Policies Requiring Payout Reversal
          {policies.length > 0 && (
            <Badge variant="destructive" className="ml-2">
              {policies.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {policies.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No policies requiring payout reversal</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Policy Number</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>Insurer</TableHead>
                  <TableHead>Premium</TableHead>
                  <TableHead>Payout Amount</TableHead>
                  <TableHead>Status Changed</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {policies.map((policy) => (
                  <TableRow key={policy.id}>
                    <TableCell className="font-medium">
                      {policy.policy_number}
                    </TableCell>
                    <TableCell>{policy.customer_name}</TableCell>
                    <TableCell>{policy.agent_name}</TableCell>
                    <TableCell>{policy.insurer_name}</TableCell>
                    <TableCell>₹{policy.premium_amount?.toLocaleString()}</TableCell>
                    <TableCell>
                      {policy.payout_amount ? (
                        <div>
                          <div>₹{policy.payout_amount.toLocaleString()}</div>
                          {policy.payout_date && (
                            <div className="text-xs text-muted-foreground">
                              {format(new Date(policy.payout_date), 'MMM dd, yyyy')}
                            </div>
                          )}
                        </div>
                      ) : (
                        'N/A'
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <Badge variant="destructive">
                          {policy.policy_status}
                        </Badge>
                        <div className="text-xs text-muted-foreground mt-1">
                          {format(new Date(policy.status_updated_at), 'MMM dd, yyyy')}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => markReversalProcessed(policy.id)}
                        >
                          Mark Processed
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          asChild
                        >
                          <a 
                            href={`/admin/policies/${policy.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};