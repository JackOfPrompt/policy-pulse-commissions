import { useState, useEffect } from "react";
import { Building2, Plus, Search, Edit, Eye, Upload, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusChip } from "@/components/ui/status-chip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { BulkUploadModal } from "@/components/admin/BulkUploadModal";
import { ViewBranchModal } from "@/components/admin/ViewBranchModal";
import { EditBranchModal } from "@/components/admin/EditBranchModal";
import { DeleteBranchModal } from "@/components/admin/DeleteBranchModal";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export default function BranchManagement() {
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [viewBranch, setViewBranch] = useState<any>(null);
  const [editBranch, setEditBranch] = useState<any>(null);
  const [deleteBranch, setDeleteBranch] = useState<any>(null);

  // Fetch branches data
  const fetchBranches = async () => {
    if (!profile?.org_id) return;
    
    try {
      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .eq('org_id', profile.org_id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching branches:', error);
        toast({
          title: "Error",
          description: "Failed to fetch branches data",
          variant: "destructive",
        });
      } else {
        setBranches(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, [profile?.org_id, toast]);

  const filteredBranches = branches.filter(branch =>
    branch.branch_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    branch.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    branch.state?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    branch.region?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const templateHeaders = [
    'branch_name',
    'region',
    'state',
    'district', 
    'city',
    'pincode',
    'landmark',
    'address',
    'department',
    'sub_department',
    'status'
  ];

  const requiredFields = ['branch_name', 'state', 'city'];

  const validateBranchRow = (row: any) => {
    const errors: string[] = [];
    
    if (row.status && !['active', 'inactive'].includes(row.status.toLowerCase())) {
      errors.push('Status must be either "active" or "inactive"');
    }
    
    if (row.pincode && !/^\d{6}$/.test(row.pincode)) {
      errors.push('Pincode must be 6 digits');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  };

  const handleBulkUpload = async (data: any[], isUpdate: boolean) => {
    try {
      if (!user?.id || !profile?.org_id) {
        throw new Error('User not authenticated or organization not found');
      }

      const processedData = data.map(row => ({
        branch_name: row.branch_name,
        region: row.region || null,
        state: row.state,
        district: row.district || null,
        city: row.city,
        pincode: row.pincode || null,
        landmark: row.landmark || null,
        address: row.address || null,
        department: row.department || null,
        sub_department: row.sub_department || null,
        status: row.status?.toLowerCase() || 'active',
        org_id: profile.org_id,
        created_by: user.id
      }));

      let results;
      if (isUpdate) {
        // For updates, use upsert
        const { data: result, error } = await supabase
          .from('branches')
          .upsert(processedData, {
            onConflict: 'branch_name,org_id',
            ignoreDuplicates: false
          })
          .select();
        
        if (error) throw error;
        results = processedData.map(() => ({ success: true, message: 'Updated successfully' }));
      } else {
        // For inserts, use regular insert
        const { data: result, error } = await supabase
          .from('branches')
          .insert(processedData)
          .select();
        
        if (error) throw error;
        results = processedData.map(() => ({ success: true, message: 'Inserted successfully' }));
      }

      // Refresh branches after successful upload
      await fetchBranches();

      return {
        success: true,
        results
      };
    } catch (error: any) {
      console.error('Bulk upload error:', error);
      return {
        success: false,
        error: error.message || 'Upload failed'
      };
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Branch Management</h1>
            <p className="text-muted-foreground">
              Manage branch locations and their details
            </p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => setIsBulkUploadOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Bulk Upload
            </Button>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Branch
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Branches</CardTitle>
              <Building2 className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{branches.length}</div>
              <p className="text-xs text-muted-foreground">Active locations</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Regions</CardTitle>
              <Building2 className="h-4 w-4 text-info" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Set(branches.map(b => b.region)).size}
              </div>
              <p className="text-xs text-muted-foreground">Coverage areas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">States</CardTitle>
              <Building2 className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Set(branches.map(b => b.state)).size}
              </div>
              <p className="text-xs text-muted-foreground">State presence</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Branch Directory</CardTitle>
            <CardDescription>
              View and manage all branch locations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex space-x-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search branches..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Branch Name</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Loading branches...
                    </TableCell>
                  </TableRow>
                ) : filteredBranches.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {searchTerm ? "No branches found matching your search." : "No branches found. Use bulk upload to add branches."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBranches.map((branch) => (
                    <TableRow key={branch.id}>
                      <TableCell>
                        <div className="font-medium">{branch.branch_name}</div>
                      </TableCell>
                      <TableCell>{branch.region || 'N/A'}</TableCell>
                      <TableCell>{branch.city && branch.state ? `${branch.city}, ${branch.state}` : 'N/A'}</TableCell>
                      <TableCell>
                        <StatusChip variant={branch.status === 'active' ? 'success' : 'secondary'}>
                          {branch.status || 'unknown'}
                        </StatusChip>
                      </TableCell>
                      <TableCell>{new Date(branch.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setViewBranch(branch)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setEditBranch(branch)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setDeleteBranch(branch)}
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

        <BulkUploadModal
          open={isBulkUploadOpen}
          onOpenChange={setIsBulkUploadOpen}
          title="Branches"
          templateHeaders={templateHeaders}
          requiredFields={requiredFields}
          onUpload={handleBulkUpload}
          validateRow={validateBranchRow}
        />

        <ViewBranchModal
          branch={viewBranch}
          open={!!viewBranch}
          onOpenChange={(open) => !open && setViewBranch(null)}
        />

        <EditBranchModal
          branch={editBranch}
          open={!!editBranch}
          onOpenChange={(open) => !open && setEditBranch(null)}
          onUpdate={fetchBranches}
        />

        <DeleteBranchModal
          branch={deleteBranch}
          open={!!deleteBranch}
          onOpenChange={(open) => !open && setDeleteBranch(null)}
          onDelete={fetchBranches}
        />
      </div>
    </AdminLayout>
  );
}