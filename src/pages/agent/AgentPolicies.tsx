import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, Search, AlertTriangle, Clock, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import PolicyStatusBadge from "@/components/admin/PolicyStatusBadge";
import { PolicyStatusHistory } from "@/components/admin/PolicyStatusHistory";

const AgentPolicies = () => {
  const [policies, setPolicies] = useState<any[]>([]);
  const [filteredPolicies, setFilteredPolicies] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [selectedPolicyForHistory, setSelectedPolicyForHistory] = useState<string>("");
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchAgentPolicies();
  }, []);

  useEffect(() => {
    filterPolicies();
  }, [policies, searchTerm, statusFilter]);

  const fetchAgentPolicies = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "Please log in to view your policies",
          variant: "destructive",
        });
        return;
      }

      // Get agent information
      const { data: agent, error: agentError } = await supabase
        .from("agents")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (agentError || !agent) {
        console.error("Agent not found:", agentError);
        setLoading(false);
        return;
      }

      // Fetch policies for this agent
      const { data, error } = await supabase
        .from("policies_with_details")
        .select(`
          *,
          sum_insured,
          status_updated_at
        `)
        .eq("agent_id", agent.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPolicies(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch your policies",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterPolicies = () => {
    let filtered = policies;

    if (searchTerm) {
      filtered = filtered.filter(policy => 
        policy.policy_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        policy.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        policy.product_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter && statusFilter !== "all") {
      filtered = filtered.filter(policy => 
        (policy.policy_status || policy.status)?.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    setFilteredPolicies(filtered);
  };

  const handleViewHistory = (policyId: string) => {
    setSelectedPolicyForHistory(policyId);
    setIsHistoryModalOpen(true);
  };

  const getStatusBadgeIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'underwriting':
        return <Clock className="h-3 w-3 mr-1" />;
      case 'rejected':
      case 'free look cancellation':
        return <AlertTriangle className="h-3 w-3 mr-1" />;
      case 'issued':
        return <CheckCircle2 className="h-3 w-3 mr-1" />;
      default:
        return null;
    }
  };

  const shouldShowStatusBadge = (status: string) => {
    const alertStatuses = ['underwriting', 'rejected', 'free look cancellation'];
    return alertStatuses.includes(status?.toLowerCase());
  };

  // Calculate stats
  const totalPolicies = policies.length;
  const underwritingPolicies = policies.filter(p => (p.policy_status || p.status)?.toLowerCase() === 'underwriting').length;
  const issuedPolicies = policies.filter(p => (p.policy_status || p.status)?.toLowerCase() === 'issued').length;
  const alertPolicies = policies.filter(p => shouldShowStatusBadge(p.policy_status || p.status)).length;

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading your policies...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="border-b border-border pb-4">
        <h1 className="text-2xl font-bold text-foreground">My Policies</h1>
        <p className="text-muted-foreground">View and track all your policy applications</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Policies</p>
                <p className="text-2xl font-bold text-foreground">{totalPolicies}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">In Underwriting</p>
                <p className="text-2xl font-bold text-primary">{underwritingPolicies}</p>
              </div>
              <Clock className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Issued</p>
                <p className="text-2xl font-bold text-green-600">{issuedPolicies}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Needs Attention</p>
                <p className="text-2xl font-bold text-destructive">{alertPolicies}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex items-center gap-2 flex-1">
              <Search className="h-4 w-4" />
              <Input
                placeholder="Search policies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="underwriting">Underwriting</SelectItem>
                <SelectItem value="issued">Issued</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="free look cancellation">Free Look Cancellation</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Policies Table */}
      <Card>
        <CardHeader>
          <CardTitle>Policy Applications</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Policy Number</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Line of Business</TableHead>
                <TableHead>Current Status</TableHead>
                <TableHead>Premium</TableHead>
                <TableHead>Status History</TableHead>
                <TableHead>Next Steps</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPolicies.map((policy) => (
                <TableRow key={policy.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {policy.policy_number}
                      {shouldShowStatusBadge(policy.policy_status || policy.status) && (
                        <Badge variant="outline" className="text-xs">
                          {getStatusBadgeIcon(policy.policy_status || policy.status)}
                          Alert
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{policy.customer_name || "N/A"}</TableCell>
                  <TableCell>{policy.product_name}</TableCell>
                  <TableCell>{policy.line_of_business}</TableCell>
                  <TableCell>
                    <PolicyStatusBadge status={policy.policy_status || policy.status} />
                  </TableCell>
                  <TableCell>₹{policy.premium_amount?.toLocaleString()}</TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewHistory(policy.id)}
                      className="flex items-center gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      View Timeline
                    </Button>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {(policy.policy_status || policy.status)?.toLowerCase() === 'underwriting' && (
                        <span className="text-primary">Awaiting underwriting review</span>
                      )}
                      {(policy.policy_status || policy.status)?.toLowerCase() === 'rejected' && (
                        <span className="text-destructive">Application rejected</span>
                      )}
                      {(policy.policy_status || policy.status)?.toLowerCase() === 'issued' && (
                        <span className="text-green-600">Policy active</span>
                      )}
                      {(policy.policy_status || policy.status)?.toLowerCase() === 'free look cancellation' && (
                        <span className="text-destructive">Policy cancelled</span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredPolicies.length === 0 && (
            <div className="text-center py-8">
              <p className="text-lg font-medium">No policies found</p>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== "all" 
                  ? "Try adjusting your filters" 
                  : "You haven't created any policies yet"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Policy Status History Modal */}
      <PolicyStatusHistory
        policyId={selectedPolicyForHistory}
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
      />
    </div>
  );
};

export default AgentPolicies;