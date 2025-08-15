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
import { Search, Plus, Edit, Trash2, Filter, Heart } from 'lucide-react';
import CreateEditHealthConditionModal from '@/components/CreateEditHealthConditionModal';
import { supabase } from '@/integrations/supabase/client';

interface HealthCondition {
  condition_id: string;
  category: 'Covered' | 'Exclusions';
  condition_name: string;
  description?: string;
  waiting_period?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

const ManageHealthConditions = () => {
  const [conditions, setConditions] = useState<HealthCondition[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageLimit] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [createEditModalOpen, setCreateEditModalOpen] = useState(false);
  const [selectedCondition, setSelectedCondition] = useState<HealthCondition | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conditionToDelete, setConditionToDelete] = useState<HealthCondition | null>(null);
  const { toast } = useToast();

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

  const fetchConditions = useCallback(async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('master_health_conditions')
        .select('*', { count: 'exact' })
        .order('condition_name');

      // Apply filters
      if (searchTerm) {
        query = query.or(`condition_name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }
      
      if (categoryFilter !== 'all') {
        query = query.eq('category', categoryFilter);
      }
      
      if (statusFilter !== 'all') {
        query = query.eq('is_active', statusFilter === 'active');
      }

      // Apply pagination
      const offset = (currentPage - 1) * pageLimit;
      query = query.range(offset, offset + pageLimit - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      setConditions((data || []) as HealthCondition[]);
      setTotalItems(count || 0);
    } catch (error) {
      console.error('Error fetching health conditions:', error);
      toast({
        title: "Error",
        description: "Failed to fetch health conditions. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [searchTerm, categoryFilter, statusFilter, currentPage, pageLimit, toast]);

  const debouncedFetchConditions = useCallback(debounce(fetchConditions, 500), [fetchConditions]);

  useEffect(() => {
    debouncedFetchConditions();
  }, [searchTerm, categoryFilter, statusFilter, currentPage]);

  const handleToggleActive = async (condition: HealthCondition) => {
    try {
      const { error } = await supabase
        .from('master_health_conditions')
        .update({ 
          is_active: !condition.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('condition_id', condition.condition_id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Health condition ${!condition.is_active ? 'activated' : 'deactivated'} successfully.`
      });
      fetchConditions();
    } catch (error) {
      console.error('Error toggling condition status:', error);
      toast({
        title: "Error",
        description: "Failed to update condition status. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteCondition = async () => {
    if (!conditionToDelete) return;

    try {
      const { error } = await supabase
        .from('master_health_conditions')
        .delete()
        .eq('condition_id', conditionToDelete.condition_id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Health condition deleted successfully."
      });
      fetchConditions();
      setDeleteDialogOpen(false);
      setConditionToDelete(null);
    } catch (error) {
      console.error('Error deleting condition:', error);
      toast({
        title: "Error",
        description: "Failed to delete health condition. Please try again.",
        variant: "destructive"
      });
    }
  };

  const totalPages = Math.ceil(totalItems / pageLimit);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container-padding section-padding">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                <Heart className="w-8 h-8 text-primary" />
                Health Conditions
              </h1>
              <p className="text-muted-foreground">Manage covered conditions and exclusions</p>
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
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search conditions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {/* Category Filter */}
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="Covered">Covered</SelectItem>
                      <SelectItem value="Exclusions">Exclusions</SelectItem>
                    </SelectContent>
                  </Select>

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
                  <Button
                    onClick={() => setCreateEditModalOpen(true)}
                    className="flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    New Condition
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Table */}
          <Card>
            <CardHeader>
              <CardTitle>Health Conditions ({totalItems} total)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="hidden md:table-cell">Description</TableHead>
                      <TableHead className="hidden lg:table-cell">Waiting Period</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      Array.from({ length: 5 }).map((_, index) => (
                        <TableRow key={index}>
                          {Array.from({ length: 6 }).map((_, cellIndex) => (
                            <TableCell key={cellIndex}>
                              <div className="h-4 bg-muted animate-pulse rounded"></div>
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : conditions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No health conditions found. Create your first condition to get started.
                        </TableCell>
                      </TableRow>
                    ) : (
                      conditions.map((condition) => (
                        <TableRow key={condition.condition_id}>
                          <TableCell className="font-medium">{condition.condition_name}</TableCell>
                          <TableCell>
                            <Badge variant={condition.category === 'Covered' ? 'default' : 'destructive'}>
                              {condition.category}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell max-w-xs">
                            <div className="truncate" title={condition.description}>
                              {condition.description || '-'}
                            </div>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            {condition.waiting_period || '-'}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={condition.is_active}
                                onCheckedChange={() => handleToggleActive(condition)}
                              />
                              <Badge variant={condition.is_active ? 'default' : 'secondary'}>
                                {condition.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setSelectedCondition(condition);
                                  setCreateEditModalOpen(true);
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setConditionToDelete(condition);
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
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
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-muted-foreground">
                    Showing {(currentPage - 1) * pageLimit + 1} to {Math.min(currentPage * pageLimit, totalItems)} of {totalItems} results
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const page = i + 1;
                        return (
                          <Button
                            key={page}
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                          >
                            {page}
                          </Button>
                        );
                      })}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modals */}
      <CreateEditHealthConditionModal
        open={createEditModalOpen}
        onOpenChange={setCreateEditModalOpen}
        condition={selectedCondition}
        onSuccess={() => {
          fetchConditions();
          setSelectedCondition(null);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Health Condition</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{conditionToDelete?.condition_name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCondition}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ManageHealthConditions;