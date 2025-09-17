import { Shield, Upload, Search, Eye, Edit, Filter, FileSpreadsheet, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { StatusChip } from "@/components/ui/status-chip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PolicyBulkUploadModal } from "@/components/admin/PolicyBulkUploadModal";
import { EnhancedViewPolicyModal } from "@/components/admin/EnhancedViewPolicyModal";
import { EnhancedEditPolicyModal } from "@/components/admin/EnhancedEditPolicyModal";
import { DeletePolicyModal } from "@/components/admin/DeletePolicyModal";
import { usePolicies, Policy } from "@/hooks/usePolicies";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";

export default function AdminPolicies() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { policies, loading, updatePolicy, deletePolicy, fetchPolicies } = usePolicies();
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [viewPolicy, setViewPolicy] = useState<Policy | null>(null);
  const [editPolicy, setEditPolicy] = useState<Policy | null>(null);
  const [deletePolicyModal, setDeletePolicyModal] = useState<Policy | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'pending': return 'warning';
      case 'expired': return 'destructive';
      case 'cancelled': return 'secondary';
      default: return 'secondary';
    }
  };

  const getExtractionVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'processing': return 'info';
      case 'pending': return 'warning';
      case 'failed': return 'destructive';
      default: return 'secondary';
    }
  };

  const filteredPolicies = useMemo(() => {
    if (!searchTerm) return policies;
    return policies.filter(
      policy =>
        policy.policy_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        policy.provider?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        policy.customer?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        policy.customer?.last_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [policies, searchTerm]);

  const formatCurrency = (amount?: number) => {
    if (!amount) return "₹0";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  return (
    <DashboardLayout role="admin" user={{
      name: profile?.full_name || "Admin User",
      email: profile?.email || "",
      role: profile?.role || "admin"
    }}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Policies</h1>
            <p className="text-muted-foreground">
              Manage insurance policies and document processing
            </p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => setShowBulkUpload(true)}>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Bulk Upload
            </Button>
            <Button onClick={() => navigate('/admin/policy-extraction')}>
              <Upload className="mr-2 h-4 w-4" />
              Upload Policy
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Policy Management</CardTitle>
            <CardDescription>
              View and manage all insurance policies with AI extraction status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex space-x-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search policies..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
            </div>
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Policy Details</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Coverage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Premium</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Loading policies...
                    </TableCell>
                  </TableRow>
                ) : filteredPolicies.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      {searchTerm ? "No policies match your search." : "No policies found. Upload your first policy to get started."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPolicies.map((policy) => (
                    <TableRow key={policy.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <Shield className="h-4 w-4 text-primary" />
                            <span className="font-medium font-mono text-sm">{policy.policy_number}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {policy.provider} • {policy.plan_name || 'N/A'}
                          </div>
                          <div className="text-xs capitalize">
                            {policy.product_type?.category || policy.product_type?.name || "N/A"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">
                            {policy.customer ? `${policy.customer.first_name || ''} ${policy.customer.last_name || ''}`.trim() : "N/A"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {(policy.customer as any)?.email || 'No email'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 text-sm">
                          {policy.dynamic_details?.sum_assured && (
                            <div>SA: {formatCurrency(policy.dynamic_details.sum_assured)}</div>
                          )}
                          {policy.dynamic_details?.sum_insured && (
                            <div>SI: {formatCurrency(policy.dynamic_details.sum_insured)}</div>
                          )}
                          {policy.dynamic_details?.idv && (
                            <div>IDV: {formatCurrency(policy.dynamic_details.idv)}</div>
                          )}
                          {!policy.dynamic_details?.sum_assured && !policy.dynamic_details?.sum_insured && !policy.dynamic_details?.idv && (
                            <span className="text-muted-foreground">N/A</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusChip variant={getStatusVariant(policy.policy_status || 'active')}>
                          {policy.policy_status || 'active'}
                        </StatusChip>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-semibold">
                            {formatCurrency(policy.premium_with_gst || policy.premium_without_gst)}
                          </div>
                          {policy.dynamic_details?.premium_frequency && (
                            <div className="text-xs text-muted-foreground capitalize">
                              {policy.dynamic_details.premium_frequency}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {policy.agent && (
                            <div className="text-blue-600">Agent: {policy.agent.agent_name}</div>
                          )}
                          {policy.employee && (
                            <div className="text-green-600">Employee: {policy.employee.name}</div>
                          )}
                          {!policy.agent && !policy.employee && (
                            <span className="text-muted-foreground">Direct</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setViewPolicy(policy)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setEditPolicy(policy)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setDeletePolicyModal(policy)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      
      <PolicyBulkUploadModal
        open={showBulkUpload}
        onOpenChange={setShowBulkUpload}
        onUploadComplete={fetchPolicies}
      />

      <EnhancedViewPolicyModal
        open={!!viewPolicy}
        onOpenChange={(open) => !open && setViewPolicy(null)}
        policy={viewPolicy}
      />

      <EnhancedEditPolicyModal
        open={!!editPolicy}
        onOpenChange={(open) => !open && setEditPolicy(null)}
        policy={editPolicy}
        onSave={updatePolicy}
      />

      <DeletePolicyModal
        open={!!deletePolicyModal}
        onOpenChange={(open) => !open && setDeletePolicyModal(null)}
        policy={deletePolicyModal}
        onDelete={deletePolicy}
      />
    </DashboardLayout>
  );
}