import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, FileText } from "lucide-react";
import { usePolicyExtraction, PolicyData } from "@/hooks/usePolicyExtraction";
import { PolicyReviewFormAdvanced } from "@/components/policy/PolicyReviewFormAdvanced";
import { toast } from "sonner";
import policySchema from "@/data/policy_schema.json";

export default function PolicyReview() {
  const { policyId } = useParams();
  const navigate = useNavigate();
  const { getPolicyById, finalizePolicyData } = usePolicyExtraction();
  const [policy, setPolicy] = useState<PolicyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (policyId) {
      const foundPolicy = getPolicyById(policyId);
      if (foundPolicy) {
        setPolicy(foundPolicy);
      } else {
        toast.error("Policy not found");
        navigate("/admin/policies/list");
      }
    }
    setLoading(false);
  }, [policyId, getPolicyById, navigate]);

  const handleSaveDraft = (data: any) => {
    if (policy) {
      // Update the policy data but keep it as draft
      const updatedPolicy = {
        ...policy,
        extractedData: data,
        updatedAt: new Date().toISOString()
      };
      
      // Save to localStorage
      const existing = JSON.parse(localStorage.getItem("policies") || "[]");
      const policyIndex = existing.findIndex((p: PolicyData) => p.id === policy.id);
      if (policyIndex !== -1) {
        existing[policyIndex] = updatedPolicy;
        localStorage.setItem("policies", JSON.stringify(existing));
        setPolicy(updatedPolicy);
      }
      
      toast.success("Policy draft saved successfully");
    }
  };

  const handleFinalize = (data: any) => {
    if (policy) {
      finalizePolicyData(policy.id, data);
      toast.success("Policy finalized successfully");
      navigate("/admin/policies/list");
    }
  };

  const handleCancel = () => {
    navigate("/admin/policies/list");
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-32 bg-muted rounded"></div>
          <div className="h-96 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!policy) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="text-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Policy not found</h3>
            <p className="text-muted-foreground mb-4">
              The policy you're looking for doesn't exist.
            </p>
            <Button onClick={() => navigate("/admin/policies/list")}>
              Back to Policy List
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => navigate("/admin/policies/list")}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to List
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Review Policy</h1>
          <p className="text-muted-foreground">
            Policy ID: {policy.id} • {policy.policyNumber}
          </p>
        </div>
      </div>

      {/* Policy Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Policy Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Policy Number</label>
              <p className="font-mono">{policy.policyNumber}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Customer Name</label>
              <p>{policy.customerName}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Product Type</label>
              <Badge>{policy.productType.toUpperCase()}</Badge>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Status</label>
              <Badge variant={policy.status === 'finalized' ? 'default' : 'secondary'}>
                {policy.status.toUpperCase()}
              </Badge>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Created Date</label>
              <p>{new Date(policy.createdAt).toLocaleDateString()}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">File Name</label>
              <p>{policy.metadata.fileName}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Uploaded By</label>
              <p>{policy.metadata.uploadedBy}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Role</label>
              <p>{policy.metadata.role}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Review Form */}
      <PolicyReviewFormAdvanced
        schema={policySchema as any}
        extractedData={policy.extractedData}
        metadata={policy.metadata}
        productType={policy.productType}
        onSave={handleFinalize}
        onSaveDraft={handleSaveDraft}
        onCancel={handleCancel}
      />
    </div>
  );
}
