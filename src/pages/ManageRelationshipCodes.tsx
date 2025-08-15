import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BackButton } from "@/components/ui/back-button";
import { toast } from "@/hooks/use-toast";
import { 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  Users
} from "lucide-react";
import CreateEditRelationshipCodeModal from "@/components/CreateEditRelationshipCodeModal";

interface RelationshipCode {
  relationship_id: number;
  relationship_code: string;
  relationship_name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const ManageRelationshipCodes = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [relationshipCodes, setRelationshipCodes] = useState<RelationshipCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<RelationshipCode | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  // Check authentication and permissions
  useEffect(() => {
    if (!user || !profile) {
      toast({
        title: "Authentication Required",
        description: "Please log in to access this page.",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    if (profile.role !== "system_admin") {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page.",
        variant: "destructive",
      });
      navigate("/");
      return;
    }

    fetchRelationshipCodes();
  }, [user, profile, navigate, currentPage]);

  const fetchRelationshipCodes = useCallback(async () => {
    try {
      setLoading(true);
      
      const url = new URL(`https://sezbixunulacdednlrtl.supabase.co/functions/v1/relationship-codes`);
      
      if (statusFilter !== "all") {
        url.searchParams.set('status', statusFilter);
      }

      if (searchTerm.trim()) {
        url.searchParams.set('search', searchTerm);
      }

      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch relationship codes');
      }

      const data = await response.json();
      setRelationshipCodes(data || []);
      setTotalPages(Math.ceil((data?.length || 0) / itemsPerPage));
    } catch (error: any) {
      console.error('Error fetching relationship codes:', error);
      toast({
        title: "Error",
        description: "Failed to fetch relationship codes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, statusFilter]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handleEdit = (code: RelationshipCode) => {
    setEditingCode(code);
    setIsModalOpen(true);
  };

  const handleDelete = async (code: RelationshipCode) => {
    if (!confirm(`Are you sure you want to delete "${code.relationship_name}"?`)) {
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(`https://sezbixunulacdednlrtl.supabase.co/functions/v1/relationship-codes/${code.relationship_id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete relationship code');
      }

      toast({
        title: "Success",
        description: "Relationship code deleted successfully.",
      });

      fetchRelationshipCodes();
    } catch (error: any) {
      console.error('Error deleting relationship code:', error);
      toast({
        title: "Error",
        description: "Failed to delete relationship code. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleToggleStatus = async (code: RelationshipCode) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(`https://sezbixunulacdednlrtl.supabase.co/functions/v1/relationship-codes/${code.relationship_id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          relationship_name: code.relationship_name,
          description: code.description,
          is_active: !code.is_active,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update relationship code status');
      }

      toast({
        title: "Success",
        description: `Relationship code ${!code.is_active ? 'activated' : 'deactivated'} successfully.`,
      });

      fetchRelationshipCodes();
    } catch (error: any) {
      console.error('Error updating relationship code status:', error);
      toast({
        title: "Error",
        description: "Failed to update status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingCode(null);
    fetchRelationshipCodes();
  };

  const filteredCodes = relationshipCodes;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-secondary/10">
      {/* Header */}
      <header className="bg-card border-b border-border/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <BackButton to="/admin-dashboard" />
              <div className="flex items-center">
                <Users className="w-6 h-6 text-primary mr-3" />
                <h1 className="text-xl font-bold text-primary">Relationship Codes Management</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle>Relationship Codes</CardTitle>
              <Button 
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Relationship Code
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search by code or name..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <select
                  value={statusFilter}
                  onChange={(e) => handleStatusFilterChange(e.target.value)}
                  className="px-3 py-2 border border-border rounded-md text-sm bg-background"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            {/* Results Count */}
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">
                Showing {filteredCodes.length} of {filteredCodes.length} relationship codes
              </p>
            </div>

            {/* Table */}
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="mt-2 text-muted-foreground">Loading relationship codes...</p>
              </div>
            ) : filteredCodes.length === 0 ? (
              <div className="text-center py-8">
                <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-medium text-muted-foreground">No relationship codes found</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {searchTerm ? "Try adjusting your search criteria." : "Get started by adding a new relationship code."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCodes.map((code) => (
                      <TableRow key={code.relationship_id}>
                        <TableCell className="font-medium">
                          {code.relationship_code}
                        </TableCell>
                        <TableCell>{code.relationship_name}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {code.description || "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant={code.is_active ? "default" : "secondary"}
                              className={code.is_active ? "bg-green-100 text-green-800" : ""}
                            >
                              {code.is_active ? "Active" : "Inactive"}
                            </Badge>
                            <Switch
                              checked={code.is_active}
                              onCheckedChange={() => handleToggleStatus(code)}
                              className="scale-75"
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(code.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(code)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(code)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <p className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Modal */}
      <CreateEditRelationshipCodeModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        relationshipCode={editingCode}
      />
    </div>
  );
};

export default ManageRelationshipCodes;