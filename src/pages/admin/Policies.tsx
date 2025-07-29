import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { FileText, Plus, Calendar, DollarSign, User, Filter, Search, Eye, Edit, Trash2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import PolicyForm from "@/components/admin/PolicyForm";
import BulkUploadModal from "@/components/admin/BulkUploadModal";
import { getTemplateColumns, getSampleData, validatePolicyRow, processPolicyRow } from "@/utils/policyBulkUpload";

const Policies = () => {
  const [policies, setPolicies] = useState<any[]>([]);
  const [filteredPolicies, setFilteredPolicies] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    insurer: "",
    status: "",
    lineOfBusiness: "",
  });
  const [showPolicyForm, setShowPolicyForm] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<any>(null);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [bulkUploadModalOpen, setBulkUploadModalOpen] = useState(false);
  const [bulkUploadLOB, setBulkUploadLOB] = useState<string>("motor");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchPolicies();
  }, []);

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
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Policy Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage insurance policies and customer coverage
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => setShowBulkUpload(true)}
          >
            <Upload className="h-4 w-4 mr-2" />
            Bulk Upload
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
              <Select value={filters.status || undefined} onValueChange={(value) => setFilters({ ...filters, status: value || "" })}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Policy Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All Policies</TabsTrigger>
          <TabsTrigger value="motor">Motor</TabsTrigger>
          <TabsTrigger value="life">Life</TabsTrigger>
          <TabsTrigger value="health">Health</TabsTrigger>
          <TabsTrigger value="commercial">Commercial</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <Card>
            <CardContent className="pt-6">
                  <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Policy Number</TableHead>
                    <TableHead>Insurer</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Line of Business</TableHead>
                    <TableHead>Premium</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead>Issuer</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPolicies.map((policy) => (
                    <TableRow key={policy.id}>
                      <TableCell className="font-medium">{policy.policy_number}</TableCell>
                      <TableCell>{policy.insurer_name}</TableCell>
                      <TableCell>{policy.product_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{policy.line_of_business}</Badge>
                      </TableCell>
                      <TableCell>₹{policy.premium_amount?.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={policy.created_by_type === "Agent" ? "default" : "secondary"}
                            className={policy.created_by_type === "Agent" ? "bg-gradient-primary text-primary-foreground" : "bg-gradient-accent text-accent-foreground"}
                          >
                            {policy.created_by_type || "Employee"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        {policy.created_by_type === "Agent" ? policy.agent_name : policy.employee_name}
                      </TableCell>
                      <TableCell>{new Date(policy.policy_start_date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={policy.status === "Active" ? "default" : "secondary"}
                          className={policy.status === "Active" ? "bg-gradient-success" : ""}
                        >
                          {policy.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              setSelectedPolicy(policy);
                              setShowPolicyForm(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeletePolicy(policy.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
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
                <SelectItem value="motor">Motor</SelectItem>
                <SelectItem value="life">Life</SelectItem>
                <SelectItem value="health">Health</SelectItem>
                <SelectItem value="commercial">Commercial</SelectItem>
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
    </div>
  );
};

export default Policies;