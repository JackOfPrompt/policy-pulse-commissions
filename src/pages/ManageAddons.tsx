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
import { Search, Plus, Download, Edit, MapPin, Trash2, Filter, Upload } from 'lucide-react';
import CreateEditAddonModal from '@/components/CreateEditAddonModal';
import AssignCategoryModal from '@/components/AssignCategoryModal';
import BulkImportModal from '@/components/BulkImportModal';
import { supabase } from '@/integrations/supabase/client';

const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlemJpeHVudWxhY2RlZG5scnRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxNDA5NjcsImV4cCI6MjA3MDcxNjk2N30.1e9sTjj8hPhEmnsJsMfXCGgfmLfbevbT6Z0wAPCOuJg";

interface Addon {
  addon_id: string;
  addon_code: string;
  addon_name: string;
  addon_category: string;
  description?: string;
  premium_type: string;
  premium_basis: string;
  calc_value?: number;
  min_amount?: number;
  max_amount?: number;
  waiting_period_months?: number;
  is_mandatory: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: {
    page: number;
    limit: number;
    total: number;
  };
}

const ManageAddons = () => {
  const [addons, setAddons] = useState<Addon[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [premiumTypeFilter, setPremiumTypeFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageLimit] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [createEditModalOpen, setCreateEditModalOpen] = useState(false);
  const [bulkImportModalOpen, setBulkImportModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedAddon, setSelectedAddon] = useState<Addon | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [addonToDelete, setAddonToDelete] = useState<Addon | null>(null);
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

  const fetchAddons = useCallback(async () => {
    try {
      setLoading(true);
      
      // Build query parameters
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (activeFilter !== 'all') params.append('is_active', activeFilter === 'active' ? 'true' : 'false');
      if (premiumTypeFilter !== 'all') params.append('premium_type', premiumTypeFilter);
      params.append('page', currentPage.toString());
      params.append('limit', pageLimit.toString());

      const url = `https://sezbixunulacdednlrtl.supabase.co/functions/v1/addons?${params.toString()}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to fetch addons');
      
      const result = await response.json() as ApiResponse<Addon[]>;
      if (result.success) {
        setAddons(result.data);
        setTotalItems(result.meta?.total || 0);
      } else {
        throw new Error(result.message || 'Failed to fetch addons');
      }
    } catch (error) {
      console.error('Error fetching addons:', error);
      toast({
        title: "Error",
        description: "Failed to fetch addons. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [searchTerm, activeFilter, premiumTypeFilter, currentPage, pageLimit, toast]);

  const debouncedFetchAddons = useCallback(debounce(fetchAddons, 500), [fetchAddons]);

  useEffect(() => {
    debouncedFetchAddons();
  }, [searchTerm, activeFilter, premiumTypeFilter, currentPage]);

  const handleToggleActive = async (addon: Addon) => {
    try {
      const url = `https://sezbixunulacdednlrtl.supabase.co/functions/v1/addons/${addon.addon_id}/status`;
      
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error('Failed to toggle status');

      const result = await response.json() as ApiResponse<Addon>;
      if (result.success) {
        toast({
          title: "Success",
          description: `Addon ${result.data.is_active ? 'activated' : 'deactivated'} successfully.`
        });
        fetchAddons();
      } else {
        throw new Error(result.message || 'Failed to toggle addon status');
      }
    } catch (error) {
      console.error('Error toggling addon status:', error);
      toast({
        title: "Error",
        description: "Failed to update addon status. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteAddon = async () => {
    if (!addonToDelete) return;

    try {
      const url = `https://sezbixunulacdednlrtl.supabase.co/functions/v1/addons/${addonToDelete.addon_id}`;
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error('Failed to delete addon');

      const result = await response.json() as ApiResponse<Addon>;
      if (result.success) {
        toast({
          title: "Success",
          description: "Addon deleted successfully."
        });
        fetchAddons();
        setDeleteDialogOpen(false);
        setAddonToDelete(null);
      } else {
        throw new Error(result.message || 'Failed to delete addon');
      }
    } catch (error) {
      console.error('Error deleting addon:', error);
      toast({
        title: "Error",
        description: "Failed to delete addon. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleExportCSV = () => {
    const csvData = addons.map(addon => ({
      Code: addon.addon_code,
      Name: addon.addon_name,
      Category: addon.addon_category,
      'Premium Type': addon.premium_type,
      'Premium Basis': addon.premium_basis,
      'Calc Value': addon.calc_value || '',
      'Waiting Period': addon.waiting_period_months || '',
      Mandatory: addon.is_mandatory ? 'Yes' : 'No',
      Active: addon.is_active ? 'Yes' : 'No'
    }));

    const csvContent = [
      Object.keys(csvData[0] || {}).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'addons.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const formatCalcValue = (addon: Addon) => {
    if (!addon.calc_value) return '-';
    return addon.premium_type === 'PercentOfBase' 
      ? `${addon.calc_value}%` 
      : `₹${addon.calc_value.toLocaleString()}`;
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
              <h1 className="text-3xl font-bold text-foreground">Add-ons / Riders</h1>
              <p className="text-muted-foreground">Manage insurance add-ons and rider coverages</p>
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
                <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
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

                  {/* Active Filter */}
                  <Select value={activeFilter} onValueChange={setActiveFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Premium Type Filter */}
                  <Select value={premiumTypeFilter} onValueChange={setPremiumTypeFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Premium Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="Flat">Flat</SelectItem>
                      <SelectItem value="PercentOfBase">Percent of Base</SelectItem>
                      <SelectItem value="AgeBand">Age Band</SelectItem>
                      <SelectItem value="Slab">Slab</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Placeholder for Category Filter */}
                  <div></div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => setCreateEditModalOpen(true)}
                    className="flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    New Add-on
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setBulkImportModalOpen(true)}
                    className="flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Bulk Import
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
              <CardTitle>Add-ons List ({totalItems} total)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Premium Type</TableHead>
                      <TableHead>Premium Basis</TableHead>
                      <TableHead>Calc Value</TableHead>
                      <TableHead>Waiting Period</TableHead>
                      <TableHead>Mandatory</TableHead>
                      <TableHead>Active</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      Array.from({ length: 5 }).map((_, index) => (
                        <TableRow key={index}>
                          {Array.from({ length: 10 }).map((_, cellIndex) => (
                            <TableCell key={cellIndex}>
                              <div className="h-4 bg-muted animate-pulse rounded"></div>
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : addons.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                          No add-ons found. Create your first add-on to get started.
                        </TableCell>
                      </TableRow>
                    ) : (
                      addons.map((addon) => (
                        <TableRow key={addon.addon_id}>
                          <TableCell className="font-mono text-sm">{addon.addon_code}</TableCell>
                          <TableCell className="font-medium">{addon.addon_name}</TableCell>
                          <TableCell>
                            <Badge variant={addon.addon_category === 'Rider' ? 'default' : 'secondary'}>
                              {addon.addon_category}
                            </Badge>
                          </TableCell>
                          <TableCell>{addon.premium_type}</TableCell>
                          <TableCell>{addon.premium_basis}</TableCell>
                          <TableCell>{formatCalcValue(addon)}</TableCell>
                          <TableCell>
                            {addon.waiting_period_months ? `${addon.waiting_period_months} months` : '-'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={addon.is_mandatory ? 'destructive' : 'outline'}>
                              {addon.is_mandatory ? 'Yes' : 'No'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={addon.is_active}
                              onCheckedChange={() => handleToggleActive(addon)}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setSelectedAddon(addon);
                                  setCreateEditModalOpen(true);
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setSelectedAddon(addon);
                                  setAssignModalOpen(true);
                                }}
                              >
                                <MapPin className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setAddonToDelete(addon);
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
      <CreateEditAddonModal
        open={createEditModalOpen}
        onOpenChange={setCreateEditModalOpen}
        addon={selectedAddon}
        onSuccess={() => {
          fetchAddons();
          setSelectedAddon(null);
        }}
      />

      <BulkImportModal
        open={bulkImportModalOpen}
        onOpenChange={setBulkImportModalOpen}
        onSuccess={() => {
          fetchAddons();
        }}
      />

      <AssignCategoryModal
        open={assignModalOpen}
        onOpenChange={setAssignModalOpen}
        addon={selectedAddon}
        onSuccess={() => {
          setSelectedAddon(null);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Add-on</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{addonToDelete?.addon_name}"? This action will mark the add-on as inactive and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAddon}
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

export default ManageAddons;