import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BackButton } from "@/components/ui/back-button";
import { useToast } from "@/hooks/use-toast";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Search,
  Plus,
  Edit,
  MapPin,
  Upload,
  Download
} from "lucide-react";
import { BulkImportDialog } from "@/components/BulkImportDialog";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

// Interface for the new consolidated master_locations table
interface MasterLocation {
  id: string;
  district?: string;
  division?: string;
  region?: string;
  block?: string;
  state: string;
  country: string;
  pincode: string;
  status: 'Active' | 'Inactive';
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

// Validation schema
const locationSchema = z.object({
  district: z.string().optional(),
  division: z.string().optional(), 
  region: z.string().optional(),
  block: z.string().optional(),
  state: z.string().min(1, "State is required"),
  country: z.string().min(1, "Country is required"),
  pincode: z.string().min(1, "Pincode is required").max(10, "Pincode too long"),
  status: z.enum(['Active', 'Inactive'])
});

type LocationFormData = z.infer<typeof locationSchema>;

export default function ManageLocations() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // State management
  const [locations, setLocations] = useState<MasterLocation[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);
  const [totalCount, setTotalCount] = useState(0);
  
  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  
  // Form states
  const [editingLocation, setEditingLocation] = useState<MasterLocation | null>(null);

  // Form setup
  const locationForm = useForm<LocationFormData>({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      district: "",
      division: "",
      region: "",
      block: "",
      state: "",
      country: "India",
      pincode: "",
      status: "Active"
    }
  });

  // Fetch data function with server-side pagination
  const fetchLocations = useCallback(async () => {
    try {
      // Build base query for counting
      let countQuery = supabase
        .from('master_locations')
        .select('*', { count: 'exact', head: true });

      // Build base query for data
      let query = supabase
        .from('master_locations')
        .select('*')
        .order('state', { ascending: true })
        .order('district', { ascending: true })
        .order('pincode', { ascending: true });

      // Apply filters to both queries
      if (stateFilter !== 'all') {
        query = query.eq('state', stateFilter);
        countQuery = countQuery.eq('state', stateFilter);
      }
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
        countQuery = countQuery.eq('status', statusFilter);
      }

      // Apply search to both queries
      if (searchTerm) {
        const searchFilter = `pincode.ilike.%${searchTerm}%,district.ilike.%${searchTerm}%,state.ilike.%${searchTerm}%,block.ilike.%${searchTerm}%`;
        query = query.or(searchFilter);
        countQuery = countQuery.or(searchFilter);
      }

      // Apply pagination to data query
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      query = query.range(from, to);

      // Execute both queries
      const [{ data, error }, { count, error: countError }] = await Promise.all([
        query,
        countQuery
      ]);

      if (error) throw error;
      if (countError) throw countError;

      setLocations((data || []) as MasterLocation[]);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error fetching locations:', error);
      toast({
        title: "Error",
        description: "Failed to fetch locations",
        variant: "destructive"
      });
    }
  }, [stateFilter, statusFilter, searchTerm, currentPage, itemsPerPage, toast]);

  // Form submission handler
  const onLocationSubmit = async (data: LocationFormData) => {
    try {
      const locationData = {
        district: data.district || null,
        division: data.division || null,
        region: data.region || null,
        block: data.block || null,
        state: data.state,
        country: data.country,
        pincode: data.pincode,
        status: data.status,
        updated_at: new Date().toISOString()
      };

      let result;
      if (editingLocation) {
        result = await supabase
          .from('master_locations')
          .update({ ...locationData, updated_by: (await supabase.auth.getUser()).data.user?.id })
          .eq('id', editingLocation.id);
      } else {
        result = await supabase
          .from('master_locations')
          .insert({ ...locationData, created_by: (await supabase.auth.getUser()).data.user?.id });
      }

      if (result.error) throw result.error;

      toast({
        title: "Success",
        description: `Location ${editingLocation ? 'updated' : 'created'} successfully`
      });

      locationForm.reset();
      setIsAddDialogOpen(false);
      setIsEditDialogOpen(false);
      setEditingLocation(null);
      fetchLocations();
    } catch (error: any) {
      console.error('Error saving location:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save location",
        variant: "destructive"
      });
    }
  };

  // Edit handler
  const handleLocationEdit = (location: MasterLocation) => {
    setEditingLocation(location);
    locationForm.reset({
      district: location.district || "",
      division: location.division || "",
      region: location.region || "",
      block: location.block || "",
      state: location.state,
      country: location.country,
      pincode: location.pincode,
      status: location.status
    });
    setIsEditDialogOpen(true);
  };

  // Status toggle handler
  const handleStatusToggle = async (location: MasterLocation) => {
    try {
      const newStatus = location.status === 'Active' ? 'Inactive' : 'Active';
      
      const { error } = await supabase
        .from('master_locations')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', location.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Location ${newStatus.toLowerCase()}`
      });

      fetchLocations();
    } catch (error) {
      console.error('Error updating location status:', error);
      toast({
        title: "Error",
        description: "Failed to update location status",
        variant: "destructive"
      });
    }
  };

  // Bulk import handler
  const handleBulkImport = async (data: any[]) => {
    try {
      let insertCount = 0;
      let updateCount = 0;
      let errorCount = 0;

      for (const row of data) {
        try {
          // Check if location exists by pincode
          const { data: existingLocation } = await supabase
            .from('master_locations')
            .select('id')
            .eq('pincode', row.pincode)
            .maybeSingle();

          const locationData = {
            district: row.district || null,
            division: row.division || null,
            region: row.region || null,
            block: row.block || null,
            state: row.state,
            country: row.country || 'India',
            pincode: row.pincode,
            status: row.status || 'Active'
          };

          if (existingLocation) {
            // Update existing
            const { error } = await supabase
              .from('master_locations')
              .update(locationData)
              .eq('id', existingLocation.id);
            
            if (error) throw error;
            updateCount++;
          } else {
            // Insert new
            const { error } = await supabase
              .from('master_locations')
              .insert(locationData);
            
            if (error) throw error;
            insertCount++;
          }
        } catch (error) {
          console.error('Error processing location row:', row, error);
          errorCount++;
        }
      }

      toast({
        title: "Locations Import Complete",
        description: `Inserted: ${insertCount}, Updated: ${updateCount}, Errors: ${errorCount}`
      });

      fetchLocations();
    } catch (error: any) {
      toast({
        title: "Import Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // Calculate pagination from server data
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  // Get unique states for filter - need to fetch separately for filter dropdown
  const [uniqueStates, setUniqueStates] = useState<string[]>([]);

  // Fetch unique states for filter dropdown
  const fetchUniqueStates = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('master_locations')
        .select('state')
        .order('state');
      
      if (error) throw error;
      
      const states = [...new Set(data?.map(item => item.state))].sort();
      setUniqueStates(states);
    } catch (error) {
      console.error('Error fetching states:', error);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([fetchLocations(), fetchUniqueStates()]);
      setLoading(false);
    };
    fetchData();
  }, [fetchLocations, fetchUniqueStates]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, stateFilter, statusFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <BackButton to="/admin-dashboard" />
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center space-y-0 pb-4">
          <MapPin className="h-8 w-8 text-primary mr-3" />
          <div>
            <CardTitle>Master Locations Management</CardTitle>
            <p className="text-sm text-muted-foreground">
              Consolidated location data: District, Division, Region, Block, State, Country, Pincode
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between text-sm">
            <span>Total Locations:</span>
            <span className="font-semibold">{totalCount}</span>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Locations Management</h2>
            <p className="text-muted-foreground">Manage consolidated location master data</p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={() => setIsBulkImportOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Bulk Import
            </Button>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Location
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add New Location</DialogTitle>
                </DialogHeader>
                
                <form onSubmit={locationForm.handleSubmit(onLocationSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="pincode">Pincode *</Label>
                      <Input
                        id="pincode"
                        {...locationForm.register('pincode')}
                        placeholder="e.g., 400001"
                      />
                      {locationForm.formState.errors.pincode && (
                        <p className="text-sm text-destructive">{locationForm.formState.errors.pincode.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="state">State *</Label>
                      <Input
                        id="state"
                        {...locationForm.register('state')}
                        placeholder="e.g., Maharashtra"
                      />
                      {locationForm.formState.errors.state && (
                        <p className="text-sm text-destructive">{locationForm.formState.errors.state.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="district">District</Label>
                      <Input
                        id="district"
                        {...locationForm.register('district')}
                        placeholder="e.g., Mumbai"
                      />
                    </div>

                    <div>
                      <Label htmlFor="division">Division</Label>
                      <Input
                        id="division"
                        {...locationForm.register('division')}
                        placeholder="e.g., Konkan"
                      />
                    </div>

                    <div>
                      <Label htmlFor="region">Region</Label>
                      <Input
                        id="region"
                        {...locationForm.register('region')}
                        placeholder="e.g., Western"
                      />
                    </div>

                    <div>
                      <Label htmlFor="block">Block</Label>
                      <Input
                        id="block"
                        {...locationForm.register('block')}
                        placeholder="e.g., Fort"
                      />
                    </div>

                    <div>
                      <Label htmlFor="country">Country *</Label>
                      <Input
                        id="country"
                        {...locationForm.register('country')}
                        placeholder="e.g., India"
                      />
                      {locationForm.formState.errors.country && (
                        <p className="text-sm text-destructive">{locationForm.formState.errors.country.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Controller
                        name="status"
                        control={locationForm.control}
                        render={({ field }) => (
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Active">Active</SelectItem>
                              <SelectItem value="Inactive">Inactive</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Add Location</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search pincode, district, state, or block..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={stateFilter} onValueChange={setStateFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by State" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All States</SelectItem>
              {uniqueStates.map(state => (
                <SelectItem key={state} value={state}>{state}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Data Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pincode</TableHead>
                <TableHead>District</TableHead>
                <TableHead>Division</TableHead>
                <TableHead>Region</TableHead>
                <TableHead>Block</TableHead>
                <TableHead>State</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {locations.map((location) => (
                <TableRow key={location.id} className="cursor-pointer" onClick={() => handleLocationEdit(location)}>
                  <TableCell className="font-medium">{location.pincode}</TableCell>
                  <TableCell>{location.district || '-'}</TableCell>
                  <TableCell>{location.division || '-'}</TableCell>
                  <TableCell>{location.region || '-'}</TableCell>
                  <TableCell>{location.block || '-'}</TableCell>
                  <TableCell>{location.state}</TableCell>
                  <TableCell>{location.country}</TableCell>
                  <TableCell>
                    <Badge variant={location.status === 'Active' ? 'default' : 'secondary'}>
                      {location.status}
                    </Badge>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusToggle(location)}
                    >
                      Toggle
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} locations
            </p>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
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
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Location</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={locationForm.handleSubmit(onLocationSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_pincode">Pincode *</Label>
                <Input
                  id="edit_pincode"
                  {...locationForm.register('pincode')}
                  placeholder="e.g., 400001"
                />
              </div>
              
              <div>
                <Label htmlFor="edit_state">State *</Label>
                <Input
                  id="edit_state"
                  {...locationForm.register('state')}
                  placeholder="e.g., Maharashtra"
                />
              </div>

              <div>
                <Label htmlFor="edit_district">District</Label>
                <Input
                  id="edit_district"
                  {...locationForm.register('district')}
                  placeholder="e.g., Mumbai"
                />
              </div>

              <div>
                <Label htmlFor="edit_division">Division</Label>
                <Input
                  id="edit_division"
                  {...locationForm.register('division')}
                  placeholder="e.g., Konkan"
                />
              </div>

              <div>
                <Label htmlFor="edit_region">Region</Label>
                <Input
                  id="edit_region"
                  {...locationForm.register('region')}
                  placeholder="e.g., Western"
                />
              </div>

              <div>
                <Label htmlFor="edit_block">Block</Label>
                <Input
                  id="edit_block"
                  {...locationForm.register('block')}
                  placeholder="e.g., Fort"
                />
              </div>

              <div>
                <Label htmlFor="edit_country">Country *</Label>
                <Input
                  id="edit_country"
                  {...locationForm.register('country')}
                  placeholder="e.g., India"
                />
              </div>

              <div>
                <Label htmlFor="edit_status">Status</Label>
                <Controller
                  name="status"
                  control={locationForm.control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Update Location</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Note: BulkImportDialog needs to be updated for locations - using custom import handler for now */}
      {isBulkImportOpen && (
        <Dialog open={isBulkImportOpen} onOpenChange={setIsBulkImportOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Bulk Import Locations</DialogTitle>
            </DialogHeader>
            <div className="p-4">
              <p>Custom bulk import for locations coming soon...</p>
              <Button onClick={() => setIsBulkImportOpen(false)} className="mt-4">
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}