import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import { Search, Plus, Edit, Trash2, Filter, FileText } from 'lucide-react';
import CreateEditPolicyTypeModal from '@/components/CreateEditPolicyTypeModal';
import { supabase } from '@/integrations/supabase/client';
interface PolicyType {
  id: string;
  policy_type_name: string;
  policy_type_description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
const ManagePolicyTypes = () => {
  const [policyTypes, setPolicyTypes] = useState<PolicyType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageLimit] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [createEditModalOpen, setCreateEditModalOpen] = useState(false);
  const [selectedPolicyType, setSelectedPolicyType] = useState<PolicyType | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [policyTypeToDelete, setPolicyTypeToDelete] = useState<PolicyType | null>(null);
  const {
    toast
  } = useToast();
  const debounce = (func: Function, wait: number) => {
    let timeout: NodeJS.Timeout;
    return function executedFunction(...args: any[]) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };
  const fetchPolicyTypes = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase.from('master_policy_types').select('*', {
        count: 'exact'
      }).order('policy_type_name');

      // Apply filters
      if (searchTerm) {
        query = query.or(`policy_type_name.ilike.%${searchTerm}%,policy_type_description.ilike.%${searchTerm}%`);
      }
      if (statusFilter !== 'all') {
        query = query.eq('is_active', statusFilter === 'active');
      }

      // Apply pagination
      const offset = (currentPage - 1) * pageLimit;
      query = query.range(offset, offset + pageLimit - 1);
      const {
        data,
        error,
        count
      } = await query;
      if (error) throw error;
      setPolicyTypes((data || []) as PolicyType[]);
      setTotalItems(count || 0);
    } catch (error) {
      console.error('Error fetching policy types:', error);
      toast({
        title: "Error",
        description: "Failed to fetch policy types. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, currentPage, pageLimit, toast]);
  const debouncedFetchPolicyTypes = useCallback(debounce(fetchPolicyTypes, 500), [fetchPolicyTypes]);
  useEffect(() => {
    debouncedFetchPolicyTypes();
  }, [searchTerm, statusFilter, currentPage]);
  const handleToggleActive = async (policyType: PolicyType) => {
    try {
      const {
        error
      } = await supabase.from('master_policy_types').update({
        is_active: !policyType.is_active,
        updated_at: new Date().toISOString()
      }).eq('id', policyType.id);
      if (error) throw error;
      toast({
        title: "Success",
        description: `Policy type ${!policyType.is_active ? 'activated' : 'deactivated'} successfully.`
      });
      fetchPolicyTypes();
    } catch (error) {
      console.error('Error toggling policy type status:', error);
      toast({
        title: "Error",
        description: "Failed to update policy type status. Please try again.",
        variant: "destructive"
      });
    }
  };
  const handleDeletePolicyType = async () => {
    if (!policyTypeToDelete) return;
    try {
      const {
        error
      } = await supabase.from('master_policy_types').delete().eq('id', policyTypeToDelete.id);
      if (error) throw error;
      toast({
        title: "Success",
        description: "Policy type deleted successfully."
      });
      fetchPolicyTypes();
      setDeleteDialogOpen(false);
      setPolicyTypeToDelete(null);
    } catch (error) {
      console.error('Error deleting policy type:', error);
      toast({
        title: "Error",
        description: "Failed to delete policy type. Please try again.",
        variant: "destructive"
      });
    }
  };
  const totalPages = Math.ceil(totalItems / pageLimit);
  return <div className="min-h-screen bg-background">
      <Header />
      <div className="container-padding section-padding">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-2 py-[25px]">
                <FileText className="w-8 h-8 text-primary" />
                Policy Types
              </h1>
              <p className="text-muted-foreground">Manage insurance policy types and classifications</p>
            </div>
          </div>

          {/* Filters and Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filters & Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col lg:flex-row gap-4 items-end">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input placeholder="Search policy types..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
                  </div>

                  {/* Status Filter */}
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button onClick={() => setCreateEditModalOpen(true)} className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Add Policy Type
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Table */}
          <Card>
            <CardHeader>
              <CardTitle>Policy Types ({totalItems} total)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Policy Type Name</TableHead>
                      <TableHead className="hidden md:table-cell">Description</TableHead>
                      <TableHead>Active Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? Array.from({
                    length: 5
                  }).map((_, index) => <TableRow key={index}>
                          {Array.from({
                      length: 4
                    }).map((_, cellIndex) => <TableCell key={cellIndex}>
                              <div className="h-4 bg-muted animate-pulse rounded"></div>
                            </TableCell>)}
                        </TableRow>) : policyTypes.length === 0 ? <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          No policy types found. Create your first policy type to get started.
                        </TableCell>
                      </TableRow> : policyTypes.map(policyType => <TableRow key={policyType.id}>
                          <TableCell className="font-medium">{policyType.policy_type_name}</TableCell>
                          <TableCell className="hidden md:table-cell max-w-xs">
                            <div className="truncate" title={policyType.policy_type_description}>
                              {policyType.policy_type_description || '-'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Switch checked={policyType.is_active} onCheckedChange={() => handleToggleActive(policyType)} />
                              <Badge variant={policyType.is_active ? 'default' : 'secondary'}>
                                {policyType.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="icon" onClick={() => {
                          setSelectedPolicyType(policyType);
                          setCreateEditModalOpen(true);
                        }}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => {
                          setPolicyTypeToDelete(policyType);
                          setDeleteDialogOpen(true);
                        }}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>)}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-muted-foreground">
                    Showing {(currentPage - 1) * pageLimit + 1} to {Math.min(currentPage * pageLimit, totalItems)} of {totalItems} results
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                      Previous
                    </Button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({
                    length: Math.min(5, totalPages)
                  }, (_, i) => {
                    const page = i + 1;
                    return <Button key={page} variant={currentPage === page ? "default" : "outline"} size="sm" onClick={() => setCurrentPage(page)}>
                            {page}
                          </Button>;
                  })}
                    </div>

                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                      Next
                    </Button>
                  </div>
                </div>}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modals */}
      <CreateEditPolicyTypeModal open={createEditModalOpen} onOpenChange={setCreateEditModalOpen} policyType={selectedPolicyType} onSuccess={() => {
      fetchPolicyTypes();
      setSelectedPolicyType(null);
    }} />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Policy Type</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{policyTypeToDelete?.policy_type_name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePolicyType} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>;
};
export default ManagePolicyTypes;