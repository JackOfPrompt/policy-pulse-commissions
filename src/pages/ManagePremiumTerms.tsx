import { useState, useEffect } from "react";
import { Plus, Search, Edit, Power, PowerOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreateEditPremiumTermModal } from "@/components/CreateEditPremiumTermModal";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PremiumTerm {
  premium_term_id: number;
  premium_term_name: string;
  premium_term_code: string;
  term_duration_years: number;
  description?: string;
  status: string;
  created_at: string;
  updated_at?: string;
}

export default function ManagePremiumTerms() {
  const [premiumTerms, setPremiumTerms] = useState<PremiumTerm[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "Active" | "Inactive">("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPremiumTerm, setEditingPremiumTerm] = useState<PremiumTerm | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 20;
  const { toast } = useToast();

  const fetchPremiumTerms = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('master_premium_terms')
        .select('*')
        .order('premium_term_name');

      if (error) throw error;
      setPremiumTerms(data || []);
    } catch (error) {
      console.error('Error fetching premium terms:', error);
      toast({
        title: "Error",
        description: "Failed to fetch premium terms",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPremiumTerms();
  }, []);

  const handleCreateSuccess = () => {
    fetchPremiumTerms();
    setIsModalOpen(false);
    toast({
      title: "Success",
      description: "Premium term created successfully",
    });
  };

  const handleEditSuccess = () => {
    fetchPremiumTerms();
    setIsModalOpen(false);
    setEditingPremiumTerm(null);
    toast({
      title: "Success",
      description: "Premium term updated successfully",
    });
  };

  const handleEdit = (premiumTerm: PremiumTerm) => {
    setEditingPremiumTerm(premiumTerm);
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (premiumTerm: PremiumTerm) => {
    try {
      const newStatus = premiumTerm.status === 'Active' ? 'Inactive' : 'Active';
      
      const { error } = await (supabase as any)
        .from('master_premium_terms')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('premium_term_id', premiumTerm.premium_term_id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Premium term ${newStatus.toLowerCase()} successfully`,
      });
      fetchPremiumTerms();
    } catch (error) {
      console.error('Error updating premium term status:', error);
      toast({
        title: "Error",
        description: "Failed to update premium term status",
        variant: "destructive",
      });
    }
  };

  const filteredPremiumTerms = premiumTerms.filter((premiumTerm) => {
    const matchesSearch = premiumTerm.premium_term_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         premiumTerm.premium_term_code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || premiumTerm.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredPremiumTerms.length / recordsPerPage);
  const startIndex = (currentPage - 1) * recordsPerPage;
  const paginatedPremiumTerms = filteredPremiumTerms.slice(startIndex, startIndex + recordsPerPage);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading premium terms...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Premium Terms Management</h1>
          <p className="text-muted-foreground">Manage insurance premium payment terms and durations</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Premium Term
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Premium Terms</CardTitle>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as "all" | "Active" | "Inactive")}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
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
                  <TableHead>Premium Term Code</TableHead>
                  <TableHead>Premium Term Name</TableHead>
                  <TableHead>Duration (Years)</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedPremiumTerms.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      No premium terms found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedPremiumTerms.map((premiumTerm) => (
                    <TableRow key={premiumTerm.premium_term_id}>
                      <TableCell className="font-medium">
                        {premiumTerm.premium_term_id}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{premiumTerm.premium_term_code}</Badge>
                      </TableCell>
                      <TableCell>{premiumTerm.premium_term_name}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">{premiumTerm.term_duration_years}</Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {premiumTerm.description || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={premiumTerm.status === 'Active' ? "default" : "secondary"}>
                          {premiumTerm.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(premiumTerm.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(premiumTerm)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleStatus(premiumTerm)}
                          >
                            {premiumTerm.status === 'Active' ? (
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
                Showing {startIndex + 1} to {Math.min(startIndex + recordsPerPage, filteredPremiumTerms.length)} of {filteredPremiumTerms.length} results
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

      <CreateEditPremiumTermModal
        open={isModalOpen}
        onOpenChange={(open) => {
          setIsModalOpen(open);
          if (!open) {
            setEditingPremiumTerm(null);
          }
        }}
        premiumTerm={editingPremiumTerm}
        onSuccess={editingPremiumTerm ? handleEditSuccess : handleCreateSuccess}
      />
    </div>
  );
}