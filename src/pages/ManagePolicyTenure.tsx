import { useState, useEffect } from "react";
import { Plus, Search, Edit, Power, PowerOff, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreateEditPolicyTenureModal } from "@/components/CreateEditPolicyTenureModal";
import { BulkImportDialog } from "@/components/BulkImportDialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PolicyTenure {
  tenure_id: number;
  tenure_name: string;
  duration_value: number;
  duration_unit: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export default function ManagePolicyTenure() {
  const [policyTenures, setPolicyTenures] = useState<PolicyTenure[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [unitFilter, setUnitFilter] = useState<"all" | "Years" | "Months" | "Days">("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [editingPolicyTenure, setEditingPolicyTenure] = useState<PolicyTenure | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 20;
  const { toast } = useToast();

  const fetchPolicyTenures = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('master_policy_tenure')
        .select('*')
        .order('tenure_name');

      if (error) throw error;
      setPolicyTenures(data || []);
    } catch (error) {
      console.error('Error fetching policy tenures:', error);
      toast({
        title: "Error",
        description: "Failed to fetch policy tenures",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicyTenures();
  }, []);

  const handleCreateSuccess = () => {
    fetchPolicyTenures();
    setIsModalOpen(false);
    toast({
      title: "Success",
      description: "Policy tenure created successfully",
    });
  };

  const handleEditSuccess = () => {
    fetchPolicyTenures();
    setIsModalOpen(false);
    setEditingPolicyTenure(null);
    toast({
      title: "Success",
      description: "Policy tenure updated successfully",
    });
  };

  const handleEdit = (policyTenure: PolicyTenure) => {
    setEditingPolicyTenure(policyTenure);
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (policyTenure: PolicyTenure) => {
    try {
      const newStatus = !policyTenure.is_active;
      
      const { error } = await (supabase as any)
        .from('master_policy_tenure')
        .update({ 
          is_active: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('tenure_id', policyTenure.tenure_id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Policy tenure ${newStatus ? 'activated' : 'deactivated'} successfully`,
      });
      fetchPolicyTenures();
    } catch (error) {
      console.error('Error updating policy tenure status:', error);
      toast({
        title: "Error",
        description: "Failed to update policy tenure status",
        variant: "destructive",
      });
    }
  };

  const handleBulkImportComplete = () => {
    fetchPolicyTenures();
    setIsBulkImportOpen(false);
  };

  const filteredPolicyTenures = policyTenures.filter((tenure) => {
    const matchesSearch = tenure.tenure_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tenure.duration_unit.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "active" && tenure.is_active) ||
                         (statusFilter === "inactive" && !tenure.is_active);
    const matchesUnit = unitFilter === "all" || tenure.duration_unit === unitFilter;
    
    return matchesSearch && matchesStatus && matchesUnit;
  });

  // Pagination
  const totalPages = Math.ceil(filteredPolicyTenures.length / recordsPerPage);
  const startIndex = (currentPage - 1) * recordsPerPage;
  const paginatedPolicyTenures = filteredPolicyTenures.slice(startIndex, startIndex + recordsPerPage);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading policy tenures...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Policy Tenure Management</h1>
          <p className="text-muted-foreground">Manage insurance policy tenure options and durations</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsBulkImportOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Bulk Import
          </Button>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Policy Tenure
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Policy Tenures</CardTitle>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or unit..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as "all" | "active" | "inactive")}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select value={unitFilter} onValueChange={(value) => setUnitFilter(value as "all" | "Years" | "Months" | "Days")}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by unit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Units</SelectItem>
                <SelectItem value="Years">Years</SelectItem>
                <SelectItem value="Months">Months</SelectItem>
                <SelectItem value="Days">Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Tenure Name</TableHead>
                  <TableHead>Duration Value</TableHead>
                  <TableHead>Duration Unit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedPolicyTenures.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      No policy tenures found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedPolicyTenures.map((tenure) => (
                    <TableRow key={tenure.tenure_id}>
                      <TableCell className="font-medium">
                        {tenure.tenure_id}
                      </TableCell>
                      <TableCell>{tenure.tenure_name}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">{tenure.duration_value}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{tenure.duration_unit}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={tenure.is_active ? "default" : "secondary"}>
                          {tenure.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(tenure.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(tenure)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleStatus(tenure)}
                          >
                            {tenure.is_active ? (
                              <PowerOff className="h-4 w-4" />
                            ) : (
                              <Power className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-2 py-4">
              <div className="text-sm text-muted-foreground">
                Showing {startIndex + 1} to {Math.min(startIndex + recordsPerPage, filteredPolicyTenures.length)} of {filteredPolicyTenures.length} results
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <div className="flex items-center space-x-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <CreateEditPolicyTenureModal
        open={isModalOpen}
        onOpenChange={(open) => {
          setIsModalOpen(open);
          if (!open) {
            setEditingPolicyTenure(null);
          }
        }}
        policyTenure={editingPolicyTenure}
        onSuccess={editingPolicyTenure ? handleEditSuccess : handleCreateSuccess}
      />

      <BulkImportDialog
        open={isBulkImportOpen}
        onOpenChange={setIsBulkImportOpen}
        type="policy-tenure"
        onImportComplete={handleBulkImportComplete}
      />
    </div>
  );
}