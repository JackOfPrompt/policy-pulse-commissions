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
import { Search, Plus, Download, Edit, Trash2, Filter } from 'lucide-react';
import CreateEditBusinessCategoryModal from '@/components/CreateEditBusinessCategoryModal';
import { supabase } from '@/integrations/supabase/client';

interface BusinessCategory {
  category_id: number;
  category_code: string;
  category_name: string;
  description?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

const ManageBusinessCategories = () => {
  const [categories, setCategories] = useState<BusinessCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageLimit] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [createEditModalOpen, setCreateEditModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<BusinessCategory | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<BusinessCategory | null>(null);
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

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      
      // Build query parameters
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      params.append('page', currentPage.toString());
      params.append('limit', pageLimit.toString());

      const url = `https://sezbixunulacdednlrtl.supabase.co/functions/v1/business-categories?${params.toString()}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlemJpeHVudWxhY2RlZG5scnRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxNDA5NjcsImV4cCI6MjA3MDcxNjk2N30.1e9sTjj8hPhEmnsJsMfXCGgfmLfbevbT6Z0wAPCOuJg',
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlemJpeHVudWxhY2RlZG5scnRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxNDA5NjcsImV4cCI6MjA3MDcxNjk2N30.1e9sTjj8hPhEmnsJsMfXCGgfmLfbevbT6Z0wAPCOuJg',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to fetch categories');
      
      const result = await response.json();
      if (result.success) {
        setCategories(result.data);
        setTotalItems(result.meta?.total || 0);
      } else {
        throw new Error(result.error || 'Failed to fetch categories');
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({
        title: "Error",
        description: "Failed to fetch business categories. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, currentPage, pageLimit, toast]);

  const debouncedFetchCategories = useCallback(debounce(fetchCategories, 500), [fetchCategories]);

  useEffect(() => {
    debouncedFetchCategories();
  }, [searchTerm, statusFilter, currentPage]);

  const handleToggleActive = async (category: BusinessCategory) => {
    try {
      const url = `https://sezbixunulacdednlrtl.supabase.co/functions/v1/business-categories/${category.category_id}`;
      
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlemJpeHVudWxhY2RlZG5scnRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxNDA5NjcsImV4cCI6MjA3MDcxNjk2N30.1e9sTjj8hPhEmnsJsMfXCGgfmLfbevbT6Z0wAPCOuJg',
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlemJpeHVudWxhY2RlZG5scnRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxNDA5NjcsImV4cCI6MjA3MDcxNjk2N30.1e9sTjj8hPhEmnsJsMfXCGgfmLfbevbT6Z0wAPCOuJg',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to toggle status');

      const result = await response.json();
      if (result.success) {
        toast({
          title: "Success",
          description: result.message
        });
        fetchCategories();
      } else {
        throw new Error(result.error || 'Failed to toggle category status');
      }
    } catch (error) {
      console.error('Error toggling category status:', error);
      toast({
        title: "Error",
        description: "Failed to update category status. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;

    try {
      const url = `https://sezbixunulacdednlrtl.supabase.co/functions/v1/business-categories/${categoryToDelete.category_id}`;
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlemJpeHVudWxhY2RlZG5scnRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxNDA5NjcsImV4cCI6MjA3MDcxNjk2N30.1e9sTjj8hPhEmnsJsMfXCGgfmLfbevbT6Z0wAPCOuJg',
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlemJpeHVudWxhY2RlZG5scnRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxNDA5NjcsImV4cCI6MjA3MDcxNjk2N30.1e9sTjj8hPhEmnsJsMfXCGgfmLfbevbT6Z0wAPCOuJg',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to delete category');

      const result = await response.json();
      if (result.success) {
        toast({
          title: "Success",
          description: "Category deleted successfully."
        });
        fetchCategories();
        setDeleteDialogOpen(false);
        setCategoryToDelete(null);
      } else {
        throw new Error(result.error || 'Failed to delete category');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      toast({
        title: "Error",
        description: "Failed to delete category. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleExportCSV = () => {
    const csvData = categories.map(category => ({
      'Category ID': category.category_id,
      'Category Code': category.category_code,
      'Category Name': category.category_name,
      'Description': category.description || '',
      'Status': category.status,
      'Last Updated': new Date(category.updated_at).toLocaleDateString()
    }));

    const csvContent = [
      Object.keys(csvData[0] || {}).join(','),
      ...csvData.map(row => Object.values(row).map(value => `"${value}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'business_categories.csv';
    a.click();
    window.URL.revokeObjectURL(url);
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
              <h1 className="text-3xl font-bold text-foreground">Master Business Categories</h1>
              <p className="text-muted-foreground">Manage business classification categories</p>
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
                      placeholder="Search by name or code..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
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

                  {/* Placeholder for future filter */}
                  <div></div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setSelectedCategory(null);
                      setCreateEditModalOpen(true);
                    }}
                    className="flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    New Category
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleExportCSV}
                    className="flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Export CSV
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Table */}
          <Card>
            <CardHeader>
              <CardTitle>Business Categories ({totalItems} total)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category ID</TableHead>
                      <TableHead>Category Code</TableHead>
                      <TableHead>Category Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Updated</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      Array.from({ length: 5 }).map((_, index) => (
                        <TableRow key={index}>
                          {Array.from({ length: 7 }).map((_, cellIndex) => (
                            <TableCell key={cellIndex}>
                              <div className="h-4 bg-muted animate-pulse rounded"></div>
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : categories.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No business categories found. Create your first category to get started.
                        </TableCell>
                      </TableRow>
                    ) : (
                      categories.map((category) => (
                        <TableRow key={category.category_id}>
                          <TableCell className="font-mono text-sm">{category.category_id}</TableCell>
                          <TableCell className="font-mono text-sm">{category.category_code}</TableCell>
                          <TableCell className="font-medium">{category.category_name}</TableCell>
                          <TableCell className="max-w-xs truncate">{category.description || '-'}</TableCell>
                          <TableCell>
                            <Badge variant={category.status === 'Active' ? 'default' : 'secondary'}>
                              {category.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{new Date(category.updated_at).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setSelectedCategory(category);
                                  setCreateEditModalOpen(true);
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Switch
                                checked={category.status === 'Active'}
                                onCheckedChange={() => handleToggleActive(category)}
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setCategoryToDelete(category);
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
                    Showing {(currentPage - 1) * pageLimit + 1} to {Math.min(currentPage * pageLimit, totalItems)} of {totalItems} entries
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
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
      <CreateEditBusinessCategoryModal
        open={createEditModalOpen}
        onOpenChange={setCreateEditModalOpen}
        category={selectedCategory}
        onSuccess={fetchCategories}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the business category
              "{categoryToDelete?.category_name}" and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCategory}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ManageBusinessCategories;