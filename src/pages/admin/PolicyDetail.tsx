import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, History, FileText, User, DollarSign, Calendar, Building, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PolicyStatusBadge } from "@/components/admin/PolicyStatusBadge";
import { PolicyStatusHistory } from "@/components/admin/PolicyStatusHistory";
import { PolicyStatusChangeModal } from "@/components/admin/PolicyStatusChangeModal";
import PolicyForm from "@/components/admin/PolicyForm";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const PolicyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [policy, setPolicy] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statusHistoryModal, setStatusHistoryModal] = useState(false);
  const [statusChangeModal, setStatusChangeModal] = useState(false);
  const [editModal, setEditModal] = useState(false);

  useEffect(() => {
    if (id) {
      fetchPolicyDetails();
    }
  }, [id]);

  const fetchPolicyDetails = async () => {
    try {
      const { data, error } = await supabase
        .from("policies_with_details")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setPolicy(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch policy details",
        variant: "destructive",
      });
      navigate("/admin/policies");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading policy details...</div>
        </div>
      </div>
    );
  }

  if (!policy) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Policy not found</div>
        </div>
      </div>
    );
  }

  const daysInStatus = policy.status_updated_at 
    ? Math.floor((new Date().getTime() - new Date(policy.status_updated_at).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate("/admin/policies")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Policies
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Policy Details</h1>
            <p className="text-muted-foreground">{policy.policy_number}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => setStatusHistoryModal(true)}
          >
            <History className="h-4 w-4 mr-2" />
            Status History
          </Button>
          <Button 
            variant="outline"
            onClick={() => setStatusChangeModal(true)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Change Status
          </Button>
          <Button 
            variant="outline"
            onClick={() => setEditModal(true)}
          >
            <Pencil className="h-4 w-4 mr-2" />
            Edit Policy
          </Button>
        </div>
      </div>

      {/* Policy Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Policy Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <PolicyStatusBadge 
              status={policy.policy_status || 'Underwriting'} 
              daysInStatus={daysInStatus}
              alertFlag={policy.alert_flag}
            />
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Days in current status</p>
              <p className={`text-lg font-semibold ${policy.alert_flag ? "text-destructive" : ""}`}>
                {daysInStatus} days
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Policy Information Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Policy Number</p>
              <p className="font-medium">{policy.policy_number}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Line of Business</p>
              <Badge variant="outline">{policy.line_of_business}</Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Policy Type</p>
              <p className="font-medium">{policy.policy_type || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Source</p>
              <p className="font-medium">{policy.policy_source || 'N/A'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Customer Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">{policy.customer_name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Phone</p>
              <p className="font-medium">{policy.customer_phone || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{policy.customer_email || 'N/A'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Financial Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Financial Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Premium Amount</p>
              <p className="font-medium text-lg">₹{policy.premium_amount?.toLocaleString() || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Sum Assured</p>
              <p className="font-medium">₹{policy.sum_assured?.toLocaleString() || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Payment Mode</p>
              <p className="font-medium">{policy.payment_mode || 'N/A'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Policy Dates */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Policy Dates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Start Date</p>
              <p className="font-medium">{policy.policy_start_date ? new Date(policy.policy_start_date).toLocaleDateString() : 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">End Date</p>
              <p className="font-medium">{policy.policy_end_date ? new Date(policy.policy_end_date).toLocaleDateString() : 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Created Date</p>
              <p className="font-medium">{policy.created_at ? new Date(policy.created_at).toLocaleDateString() : 'N/A'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Insurer Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Insurer Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Insurer</p>
              <p className="font-medium">{policy.insurer_name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Product</p>
              <p className="font-medium">{policy.product_name || 'N/A'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Created By</p>
              <p className="font-medium">{policy.created_by_type || 'N/A'}</p>
            </div>
            {policy.previous_policy_number && (
              <div>
                <p className="text-sm text-muted-foreground">Previous Policy</p>
                <p className="font-medium">{policy.previous_policy_number}</p>
              </div>
            )}
            {policy.remarks && (
              <div>
                <p className="text-sm text-muted-foreground">Remarks</p>
                <p className="font-medium">{policy.remarks}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Policy Status History Modal */}
      <PolicyStatusHistory
        policyId={policy.id}
        isOpen={statusHistoryModal}
        onClose={() => setStatusHistoryModal(false)}
      />

      {/* Policy Status Change Modal */}
      <PolicyStatusChangeModal
        policyId={policy.id}
        currentStatus={policy.policy_status || 'Underwriting'}
        isOpen={statusChangeModal}
        onClose={() => setStatusChangeModal(false)}
        onSuccess={() => {
          fetchPolicyDetails();
          setStatusChangeModal(false);
        }}
      />

      {/* Policy Edit Modal */}
      <Dialog open={editModal} onOpenChange={setEditModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <PolicyForm
            policy={policy}
            onClose={() => setEditModal(false)}
            onSuccess={() => {
              fetchPolicyDetails();
              setEditModal(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PolicyDetail;