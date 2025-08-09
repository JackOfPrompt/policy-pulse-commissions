import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, Plus, Calendar, DollarSign, User, Filter, Search, Eye, Edit, Trash2, Upload, CheckSquare, History, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { usePermissions } from "@/hooks/usePermissions";
import PolicyForm from "@/components/admin/PolicyForm";
import BulkUploadModal from "@/components/admin/BulkUploadModal";
import { PolicyStatusBadge } from "@/components/admin/PolicyStatusBadge";
import { PolicyStatusHistory } from "@/components/admin/PolicyStatusHistory";
import { PolicyDetailsModal } from "@/components/admin/PolicyDetailsModal";
import { PolicyStatusChangeModal } from "@/components/admin/PolicyStatusChangeModal";
import { getTemplateColumns, getSampleData, validatePolicyRow, processPolicyRow } from "@/utils/policyBulkUpload";
import { generatePolicyUpdateTemplate, validatePolicyUpdateRow, processPolicyUpdateRow, getPolicyUpdateTemplateColumns } from "@/utils/policyBulkUpdate";
import BulkUpdateModal from "@/components/admin/BulkUpdateModal";

const Policies = () => {
  const [policies, setPolicies] = useState<any[]>([]);
  const [filteredPolicies, setFilteredPolicies] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    insurer: "",
    status: "",
    lineOfBusiness: "",
    policyStatus: "",
    dateRange: "",
  });
  const [selectedPolicies, setSelectedPolicies] = useState<string[]>([]);
  const [showBulkStatusUpdate, setShowBulkStatusUpdate] = useState(false);
  const [bulkStatus, setBulkStatus] = useState<string>("");
  const [reversalRequired, setReversalRequired] = useState(false);
  const [showPolicyForm, setShowPolicyForm] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<any>(null);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [bulkUploadModalOpen, setBulkUploadModalOpen] = useState(false);
  const [bulkUpdateModalOpen, setBulkUpdateModalOpen] = useState(false);
  const [bulkUploadLOB, setBulkUploadLOB] = useState<string>("");
  const [lineOfBusinessOptions, setLineOfBusinessOptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusHistoryModal, setStatusHistoryModal] = useState({ isOpen: false, policyId: "" });
  const [statusChangeModal, setStatusChangeModal] = useState({ 
    isOpen: false, 
    policyId: "", 
    currentStatus: "" 
  });
  const [detailsModal, setDetailsModal] = useState({ isOpen: false, policyId: "" });
  const { toast } = useToast();
  const { role } = usePermissions();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Check for status parameter in URL
    const searchParams = new URLSearchParams(location.search);
    const statusParam = searchParams.get('status');
    if (statusParam) {
      setFilters(prev => ({ ...prev, policyStatus: statusParam }));
    }
    
    fetchPolicies();
    fetchLineOfBusinessOptions();
  }, [location.search]);

  useEffect(() => {
    filterPolicies();
  }, [policies, activeTab, searchTerm, filters]);

  const fetchPolicies = async () => {
    try {
      const { data, error } = await supabase
        .from("policies_with_details")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPolicies(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch policies",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchLineOfBusinessOptions = async () => {
    try {
      const { data, error } = await supabase
        .from("line_of_business")
        .select("id, name, code")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      console.log('Policies page line of business options loaded:', data);
      setLineOfBusinessOptions(data || []);
      
      // Set default bulk upload LOB to first available option
      if (data && data.length > 0 && !bulkUploadLOB) {
        setBulkUploadLOB(data[0].name.toLowerCase());
      }
    } catch (error: any) {
      console.error("Error fetching line of business options:", error);
      toast({
        title: "Error",
        description: "Failed to fetch line of business options",
        variant: "destructive",
      });
    }
  };

  const filterPolicies = () => {
    let filtered = policies;

    // Filter by tab
    if (activeTab !== "all") {
      filtered = filtered.filter(policy => 
        policy.line_of_business?.toLowerCase() === activeTab.toLowerCase()
      );
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(policy =>
        policy.policy_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        policy.insurer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        policy.product_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply additional filters
    if (filters.insurer) {
      filtered = filtered.filter(policy => policy.insurer_id === filters.insurer);
    }
    if (filters.status) {
      filtered = filtered.filter(policy => policy.status === filters.status);
    }
    if (filters.lineOfBusiness) {
      filtered = filtered.filter(policy => policy.line_of_business === filters.lineOfBusiness);
    }
    if (filters.policyStatus && filters.policyStatus !== "all") {
      filtered = filtered.filter(policy => policy.policy_status === filters.policyStatus);
    }
    if (filters.dateRange && filters.dateRange !== "all") {
      const today = new Date();
      let startDate = new Date();
      
      switch (filters.dateRange) {
        case "7days":
          startDate.setDate(today.getDate() - 7);
          break;
        case "30days":
          startDate.setDate(today.getDate() - 30);
          break;
        case "90days":
          startDate.setDate(today.getDate() - 90);
          break;
      }
      
      filtered = filtered.filter(policy => 
        new Date(policy.created_at) >= startDate
      );
    }

    setFilteredPolicies(filtered);
  };

  const handleDeletePolicy = async (policyId: string) => {
    try {
      const { error } = await supabase
        .from("policies_new")
        .delete()
        .eq("id", policyId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Policy deleted successfully",
      });
      
      fetchPolicies();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleBulkStatusUpdate = async () => {
    if (selectedPolicies.length === 0 || !bulkStatus) {
      toast({
        title: "Error",
        description: "Please select policies and status",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("policies_new")
        .update({
          policy_status: bulkStatus as any,
          status_updated_by: user?.id,
          status_updated_at: new Date().toISOString()
        })
        .in("id", selectedPolicies);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${selectedPolicies.length} policies updated successfully`,
      });
      
      setSelectedPolicies([]);
      setShowBulkStatusUpdate(false);
      setBulkStatus("");
      setReversalRequired(false);
      fetchPolicies();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSelectAll = () => {
    if (selectedPolicies.length === filteredPolicies.length) {
      setSelectedPolicies([]);
    } else {
      setSelectedPolicies(filteredPolicies.map(p => p.id));
    }
  };

  const handleSelectPolicy = (policyId: string) => {
    setSelectedPolicies(prev => 
      prev.includes(policyId) 
        ? prev.filter(id => id !== policyId)
        : [...prev, policyId]
    );
  };

  const policyStats = [
    { 
      label: "Total Policies", 
      value: policies.length.toString(), 
      icon: FileText 
    },
    { 
      label: "Active Policies", 
      value: policies.filter(p => p.status === "Active").length.toString(), 
      icon: FileText 
    },
    { 
      label: "Pending Approval", 
      value: policies.filter(p => p.status === "Pending").length.toString(), 
      icon: FileText 
    },
    { 
      label: "Total Premium", 
      value: `₹${policies.reduce((sum, p) => sum + (p.premium_amount || 0), 0).toLocaleString()}`, 
      icon: DollarSign 
    }
  ];

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading policies...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div></div>
        <div className="flex gap-2">
          {selectedPolicies.length > 0 && (
            <Button 
              variant="outline"
              onClick={() => setShowBulkStatusUpdate(true)}
            >
              <CheckSquare className="h-4 w-4 mr-2" />
              Update Status ({selectedPolicies.length})
            </Button>
          )}
          
          <Button 
            variant="outline"
            onClick={() => setShowBulkUpload(true)}
          >
            <Upload className="h-4 w-4 mr-2" />
            Bulk Upload
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => setBulkUpdateModalOpen(true)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Bulk Update
          </Button>
          
          <Dialog open={showPolicyForm} onOpenChange={setShowPolicyForm}>
            <DialogTrigger asChild>
              <Button 
                className="bg-gradient-primary shadow-primary"
                onClick={() => setSelectedPolicy(null)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Policy
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <PolicyForm
                policy={selectedPolicy}
                onClose={() => setShowPolicyForm(false)}
                onSuccess={fetchPolicies}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Policy Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {policyStats.map((stat) => {
          const IconComponent = stat.icon;
          return (
            <Card key={stat.label} className="shadow-card">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  </div>
                  <IconComponent className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search policies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={filters.policyStatus || undefined} onValueChange={(value) => setFilters({ ...filters, policyStatus: value || "" })}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Policy Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Underwriting">Underwriting</SelectItem>
                  <SelectItem value="Issued">Issued</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                  <SelectItem value="Free Look Cancellation">Free Look Cancellation</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.dateRange || undefined} onValueChange={(value) => setFilters({ ...filters, dateRange: value || "" })}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Date Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="7days">Last 7 Days</SelectItem>
                  <SelectItem value="30days">Last 30 Days</SelectItem>
                  <SelectItem value="90days">Last 90 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Policy Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${Math.min(lineOfBusinessOptions.length + 1, 6)}, 1fr)` }}>
          <TabsTrigger value="all">All Policies</TabsTrigger>
          {lineOfBusinessOptions.map((lob) => (
            <TabsTrigger key={lob.id} value={lob.name.toLowerCase()}>
              {lob.name}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <Card>
            <CardContent className="pt-6">
                  <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Checkbox
                        checked={selectedPolicies.length === filteredPolicies.length && filteredPolicies.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Policy Number</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Insurer</TableHead>
                    <TableHead>Premium</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Days in Status</TableHead>
                    <TableHead>Alert</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPolicies.map((policy) => {
                    const daysInStatus = policy.status_updated_at 
                      ? Math.floor((new Date().getTime() - new Date(policy.status_updated_at).getTime()) / (1000 * 60 * 60 * 24))
                      : 0;
                    
                    return (
                      <TableRow key={policy.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedPolicies.includes(policy.id)}
                            onCheckedChange={() => handleSelectPolicy(policy.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{policy.policy_number}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{policy.customer_name || 'N/A'}</div>
                            <div className="text-sm text-muted-foreground">{policy.customer_phone}</div>
                          </div>
                        </TableCell>
                        <TableCell>{policy.insurer_name}</TableCell>
                        <TableCell>₹{policy.premium_amount?.toLocaleString()}</TableCell>
                        <TableCell>
                          <PolicyStatusBadge 
                            status={policy.policy_status || 'Underwriting'} 
                            daysInStatus={daysInStatus}
                            alertFlag={policy.alert_flag}
                          />
                        </TableCell>
                        <TableCell>
                          <span className={policy.alert_flag ? "text-destructive font-medium" : "text-muted-foreground"}>
                            {daysInStatus}d
                          </span>
                        </TableCell>
                        <TableCell>
                          {policy.alert_flag && (
                            <div className="flex items-center gap-1">
                              <AlertTriangle className="h-4 w-4 text-destructive" />
                              <span className="text-xs text-destructive">Attention</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setDetailsModal({ isOpen: true, policyId: policy.id })}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View Details
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setStatusHistoryModal({ isOpen: true, policyId: policy.id })}
                              title="View Status History"
                            >
                              <History className="h-3 w-3" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setStatusChangeModal({ 
                                isOpen: true, 
                                policyId: policy.id,
                                currentStatus: policy.policy_status || 'Underwriting'
                              })}
                              title="Change Status"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              
              {filteredPolicies.length === 0 && (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium">No policies found</p>
                  <p className="text-muted-foreground">
                    {activeTab === "all" ? "Create your first policy to get started" : `No ${activeTab} policies found`}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Bulk Upload Modal with LOB Selection */}
      <Dialog open={showBulkUpload} onOpenChange={setShowBulkUpload}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Select Line of Business</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Label htmlFor="lob-select">Choose the line of business for bulk upload:</Label>
            <Select value={bulkUploadLOB} onValueChange={setBulkUploadLOB}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {lineOfBusinessOptions.map((lob) => (
                  <SelectItem key={lob.id} value={lob.name.toLowerCase()}>
                    {lob.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowBulkUpload(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                setShowBulkUpload(false);
                // Open the actual bulk upload modal
                setBulkUploadModalOpen(true);
              }}>
                Continue
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Status Update Modal */}
      <Dialog open={showBulkStatusUpdate} onOpenChange={setShowBulkStatusUpdate}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update Policy Status</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="bulk-status">New Status</Label>
              <Select value={bulkStatus} onValueChange={setBulkStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Underwriting">Underwriting</SelectItem>
                  <SelectItem value="Issued">Issued</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                  <SelectItem value="Free Look Cancellation">Free Look Cancellation</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {bulkStatus === "Free Look Cancellation" && (
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="reversal-required" 
                  checked={reversalRequired}
                  onCheckedChange={(checked) => setReversalRequired(checked as boolean)}
                />
                <Label htmlFor="reversal-required">Auto-reverse Agent Payout?</Label>
              </div>
            )}
            
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowBulkStatusUpdate(false)}>
                Cancel
              </Button>
              <Button onClick={handleBulkStatusUpdate}>
                Update {selectedPolicies.length} Policies
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Actual Bulk Upload Modal */}
      <BulkUploadModal
        isOpen={bulkUploadModalOpen}
        onClose={() => setBulkUploadModalOpen(false)}
        entityType={`${bulkUploadLOB} Policy`}
        onSuccess={fetchPolicies}
        templateColumns={getTemplateColumns(bulkUploadLOB)}
        sampleData={getSampleData(bulkUploadLOB)}
        validateRow={validatePolicyRow}
        processRow={processPolicyRow}
      />

      {/* Policy Bulk Update Modal */}
      <BulkUpdateModal
        isOpen={bulkUpdateModalOpen}
        onClose={() => setBulkUpdateModalOpen(false)}
        entityType="Policy"
        onSuccess={fetchPolicies}
        templateColumns={getPolicyUpdateTemplateColumns()}
        customDownloadTemplate={generatePolicyUpdateTemplate}
        validateRow={validatePolicyUpdateRow}
        processRow={processPolicyUpdateRow}
      />

      {/* Policy Status History Modal */}
      <PolicyStatusHistory
        policyId={statusHistoryModal.policyId}
        isOpen={statusHistoryModal.isOpen}
        onClose={() => setStatusHistoryModal({ isOpen: false, policyId: "" })}
      />

      {/* Policy Status Change Modal */}
      <PolicyStatusChangeModal
        policyId={statusChangeModal.policyId}
        currentStatus={statusChangeModal.currentStatus}
        isOpen={statusChangeModal.isOpen}
        onClose={() => setStatusChangeModal({ isOpen: false, policyId: "", currentStatus: "" })}
        onSuccess={() => {
          fetchPolicies();
          setStatusChangeModal({ isOpen: false, policyId: "", currentStatus: "" });
        }}
      />

      {/* Policy Details Modal */}
      <PolicyDetailsModal
        isOpen={detailsModal.isOpen}
        onClose={() => setDetailsModal({ isOpen: false, policyId: "" })}
        policyId={detailsModal.policyId}
      />
    </div>
  );
};

export default Policies;