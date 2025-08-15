import { useState, useEffect } from "react";
import { Plus, Search, Edit, Power, PowerOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreateEditPremiumTypeModal } from "@/components/CreateEditPremiumTypeModal";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PremiumType {
  premium_type_id: number;
  premium_type_name: string;
  premium_type_code: string;
  description?: string;
  status: string;
  created_at: string;
  updated_at?: string;
}

export default function ManagePremiumTypes() {
  const [premiumTypes, setPremiumTypes] = useState<PremiumType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "Active" | "Inactive">("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPremiumType, setEditingPremiumType] = useState<PremiumType | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 20;
  const { toast } = useToast();

  const fetchPremiumTypes = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('master_premium_types')
        .select('*')
        .order('premium_type_name');

      if (error) throw error;
      setPremiumTypes(data || []);
    } catch (error) {
      console.error('Error fetching premium types:', error);
      toast({
        title: "Error",
        description: "Failed to fetch premium types",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPremiumTypes();
  }, []);

  const handleCreateSuccess = () => {
    fetchPremiumTypes();
    setIsModalOpen(false);
    toast({
      title: "Success",
      description: "Premium type created successfully",
    });
  };

  const handleEditSuccess = () => {
    fetchPremiumTypes();
    setIsModalOpen(false);
    setEditingPremiumType(null);
    toast({
      title: "Success",
      description: "Premium type updated successfully",
    });
  };

  const handleEdit = (premiumType: PremiumType) => {
    setEditingPremiumType(premiumType);
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (premiumType: PremiumType) => {
    try {
      const newStatus = premiumType.status === 'Active' ? 'Inactive' : 'Active';
      
      const { error } = await (supabase as any)
        .from('master_premium_types')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('premium_type_id', premiumType.premium_type_id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Premium type ${newStatus.toLowerCase()} successfully`,
      });
      fetchPremiumTypes();
    } catch (error) {
      console.error('Error updating premium type status:', error);
      toast({
        title: "Error",
        description: "Failed to update premium type status",
        variant: "destructive",
      });
    }
  };

  const filteredPremiumTypes = premiumTypes.filter((premiumType) => {
    const matchesSearch = premiumType.premium_type_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         premiumType.premium_type_code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || premiumType.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredPremiumTypes.length / recordsPerPage);
  const startIndex = (currentPage - 1) * recordsPerPage;
  const paginatedPremiumTypes = filteredPremiumTypes.slice(startIndex, startIndex + recordsPerPage);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading premium types...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Premium Types Management</h1>
          <p className="text-muted-foreground">Manage insurance premium types and their configurations</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Premium Type
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Premium Types</CardTitle>
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
                  <TableHead>Premium Type Code</TableHead>
                  <TableHead>Premium Type Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedPremiumTypes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      No premium types found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedPremiumTypes.map((premiumType) => (
                    <TableRow key={premiumType.premium_type_id}>
                      <TableCell className="font-medium">
                        {premiumType.premium_type_id}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{premiumType.premium_type_code}</Badge>
                      </TableCell>
                      <TableCell>{premiumType.premium_type_name}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {premiumType.description || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={premiumType.status === 'Active' ? "default" : "secondary"}>
                          {premiumType.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(premiumType.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(premiumType)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleStatus(premiumType)}
                          >
                            {premiumType.status === 'Active' ? (
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
                Showing {startIndex + 1} to {Math.min(startIndex + recordsPerPage, filteredPremiumTypes.length)} of {filteredPremiumTypes.length} results
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

      <CreateEditPremiumTypeModal
        open={isModalOpen}
        onOpenChange={(open) => {
          setIsModalOpen(open);
          if (!open) {
            setEditingPremiumType(null);
          }
        }}
        premiumType={editingPremiumType}
        onSuccess={editingPremiumType ? handleEditSuccess : handleCreateSuccess}
      />
    </div>
  );
}