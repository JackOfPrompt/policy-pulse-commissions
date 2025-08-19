import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { BackButton } from "@/components/ui/back-button";
import { useToast } from "@/hooks/use-toast";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Search,
  Plus,
  Edit,
  Filter,
  Grid,
  List,
  Upload,
  Download,
  X,
  FolderOpen,
  ImageIcon,
  Trash2,
  AlertTriangle,
  FileSpreadsheet
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { LOBIcon } from "@/components/LOBIcon";
import { ListView, GridView, KanbanView, ViewToggle, useViewMode } from '@/components/ui/list-views';

interface LOB {
  lob_id: string;
  lob_code: string;
  lob_name: string;
  description?: string;
  icon_file_path?: string;
  status: 'Active' | 'Inactive';
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  linked_providers?: { provider_id: string; provider_name: string; provider_code: string }[];
}

interface InsuranceProvider {
  provider_id: string;
  provider_name: string;
  provider_code: string;
  status: string;
}

const lobSchema = z.object({
  lob_code: z.string().min(1, "LOB code is required").max(20, "LOB code too long"),
  lob_name: z.string().min(1, "LOB name is required").max(100, "LOB name too long"),
  description: z.string().optional(),
  status: z.enum(['Active', 'Inactive']),
  linked_providers: z.array(z.string()).optional()
});

type LOBFormData = z.infer<typeof lobSchema>;

export default function ManageLineOfBusiness() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile } = useAuth();
  
  // State management
  const [lobs, setLobs] = useState<LOB[]>([]);
  const [providers, setProviders] = useState<InsuranceProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const { viewMode, setViewMode } = useViewMode({ defaultView: 'list', storageKey: 'lob-view' });
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // Form states
  const [editingLOB, setEditingLOB] = useState<LOB | null>(null);
  const [deletingLOB, setDeletingLOB] = useState<LOB | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [csvPreview, setCsvPreview] = useState<any[]>([]);
  const [errorReport, setErrorReport] = useState<Array<{
    row: number;
    data: any;
    error: string;
    type: 'validation' | 'database' | 'network';
  }>>([]);
  const [isErrorReportOpen, setIsErrorReportOpen] = useState(false);
  const [bulkImportResults, setBulkImportResults] = useState<{
    total: number;
    inserted: number;
    updated: number;
    errors: number;
    timestamp: string;
  } | null>(null);

  // Form setup
  const form = useForm<LOBFormData>({
    resolver: zodResolver(lobSchema),
    defaultValues: {
      lob_code: "",
      lob_name: "",
      description: "",
      status: "Active",
      linked_providers: []
    }
  });

  // Fetch LOBs with linked providers
  const fetchLOBs = useCallback(async () => {
    try {
      setLoading(true);
      
      // First fetch LOBs using type assertion
      let query = (supabase as any)
        .from('master_line_of_business')
        .select('*')
        .order('lob_name');

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data: lobsData, error: lobsError } = await query;
      if (lobsError) throw lobsError;

      // Then fetch provider mappings for each LOB
      const lobsWithProviders = await Promise.all(
        (lobsData || []).map(async (lob: any) => {
          const { data: mappings, error: mappingError } = await (supabase as any)
            .from('provider_lob_map')
            .select(`
              provider_id,
              master_insurance_providers!inner(
                provider_id,
                provider_name,
                provider_code
              )
            `)
            .eq('lob_id', lob.lob_id);

          if (mappingError) {
            console.error('Error fetching provider mappings:', mappingError);
            return { ...lob, linked_providers: [] };
          }

          const linked_providers = mappings?.map((m: any) => ({
            provider_id: m.provider_id,
            provider_name: m.master_insurance_providers.provider_name,
            provider_code: m.master_insurance_providers.provider_code
          })) || [];

          return { ...lob, linked_providers };
        })
      );

      setLobs(lobsWithProviders);
    } catch (error) {
      console.error('Error fetching LOBs:', error);
      toast({
        title: "Error",
        description: "Failed to fetch Lines of Business",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [statusFilter, toast]);

  // Fetch providers for dropdown
  const fetchProviders = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('master_insurance_providers')
        .select('provider_id, provider_name, provider_code, status')
        .eq('status', 'Active')
        .order('provider_name');

      if (error) throw error;
      setProviders(data || []);
    } catch (error) {
      console.error('Error fetching providers:', error);
      toast({
        title: "Error",
        description: "Failed to fetch insurance providers",
        variant: "destructive"
      });
    }
  }, [toast]);

  // Initial data fetch
  useEffect(() => {
    fetchLOBs();
    fetchProviders();
  }, [fetchLOBs, fetchProviders]);

  // Get filtered and paginated data
  const getFilteredLOBs = () => {
    return lobs.filter(lob => {
      const matchesSearch = lob.lob_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          lob.lob_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (lob.description && lob.description.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = statusFilter === 'all' || lob.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  };

  const getPaginatedData = () => {
    const filtered = getFilteredLOBs();
    const total = Math.ceil(filtered.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginated = filtered.slice(startIndex, startIndex + itemsPerPage);
    return { filtered, total, paginated };
  };

  // Define list view columns
  const listViewColumns = [
    { 
      key: 'lob_code', 
      header: 'LOB Code', 
      className: 'w-32',
      render: (item: LOB) => <span className="font-medium">{item.lob_code}</span>
    },
    { 
      key: 'lob_name', 
      header: 'LOB Name', 
      className: 'flex-1',
      render: (item: LOB) => (
        <div className="flex items-center space-x-2">
          <LOBIcon 
            iconPath={item.icon_file_path}
            lobName={item.lob_name}
            className="h-6 w-6"
          />
          <span className="font-medium">{item.lob_name}</span>
        </div>
      )
    },
    { 
      key: 'description', 
      header: 'Description', 
      className: 'w-64',
      render: (item: LOB) => (
        <span className="text-sm text-muted-foreground line-clamp-2">
          {item.description || 'No description'}
        </span>
      )
    },
    { 
      key: 'linked_providers', 
      header: 'Linked Providers', 
      className: 'w-48',
      render: (item: LOB) => (
        <div className="flex flex-wrap gap-1">
          {item.linked_providers && item.linked_providers.length > 0 ? (
            <>
              {item.linked_providers.slice(0, 2).map(provider => (
                <Badge key={provider.provider_id} variant="outline" className="text-xs">
                  {provider.provider_code}
                </Badge>
              ))}
              {item.linked_providers.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{item.linked_providers.length - 2}
                </Badge>
              )}
            </>
          ) : (
            <span className="text-xs text-muted-foreground">None</span>
          )}
        </div>
      )
    },
    { 
      key: 'status', 
      header: 'Status', 
      className: 'w-24',
      render: (item: LOB) => (
        <Badge variant={item.status === 'Active' ? 'default' : 'secondary'}>
          {item.status}
        </Badge>
      )
    },
  ];

  // Render LOB card for grid and kanban views
  const renderLOBCard = (lob: LOB) => (
    <Card className="h-full hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header with icon and status */}
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <LOBIcon 
                iconPath={lob.icon_file_path}
                lobName={lob.lob_name}
                className="h-8 w-8"
              />
              <div>
                <h4 className="font-medium text-sm">{lob.lob_code}</h4>
                <Badge variant={lob.status === 'Active' ? 'default' : 'secondary'} className="text-xs">
                  {lob.status}
                </Badge>
              </div>
            </div>
          </div>
          
          {/* LOB Name */}
          <div>
            <h3 className="font-semibold text-base line-clamp-2">{lob.lob_name}</h3>
            {lob.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-3">{lob.description}</p>
            )}
          </div>
          
          {/* Linked Providers */}
          {lob.linked_providers && lob.linked_providers.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Linked Providers:</p>
              <div className="flex flex-wrap gap-1">
                {lob.linked_providers.slice(0, 3).map(provider => (
                  <Badge key={provider.provider_id} variant="outline" className="text-xs">
                    {provider.provider_code}
                  </Badge>
                ))}
                {lob.linked_providers.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{lob.linked_providers.length - 3} more
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  // Render actions for list and card views
  const renderLOBActions = (lob: LOB) => (
    <div className="flex items-center space-x-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleEdit(lob)}
        className="h-8 w-8 p-0"
      >
        <Edit className="h-4 w-4" />
      </Button>
      <Switch
        checked={lob.status === 'Active'}
        onCheckedChange={() => handleStatusToggle(lob)}
        className="scale-75"
      />
    </div>
  );

  // Status configuration for kanban view
  const statusConfig = {
    'Active': {
      label: 'Active LOBs',
      color: 'bg-green-100 border-green-200'
    },
    'Inactive': {
      label: 'Inactive LOBs', 
      color: 'bg-gray-100 border-gray-200'
    }
  };

  // Render data based on view mode
  const renderDataView = () => {
    const { paginated } = getPaginatedData();
    
    if (viewMode === 'list') {
      return (
        <ListView
          data={paginated}
          columns={listViewColumns}
          loading={loading}
          actions={renderLOBActions}
        />
      );
    } else if (viewMode === 'kanban') {
      return (
        <KanbanView
          data={paginated}
          loading={loading}
          renderCard={renderLOBCard}
          actions={renderLOBActions}
          getItemStatus={(lob) => lob.status}
          statusConfig={statusConfig}
        />
      );
    } else {
      // Grid views
      return (
        <GridView
          data={paginated}
          loading={loading}
          renderCard={renderLOBCard}
          actions={renderLOBActions}
          viewMode={viewMode as 'grid-small' | 'grid-medium' | 'grid-large'}
        />
      );
    }
  };

  // Placeholder functions for edit and status toggle
  const handleEdit = (lob: LOB) => {
    // TODO: Implement edit functionality
    toast({
      title: "Edit LOB",
      description: `Edit functionality for ${lob.lob_name} will be implemented.`
    });
  };

  const handleStatusToggle = async (lob: LOB) => {
    // TODO: Implement status toggle
    toast({
      title: "Status Toggle",
      description: `Status toggle for ${lob.lob_name} will be implemented.`
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading Lines of Business...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container-padding section-padding">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <BackButton to="/admin-dashboard" />
            <FolderOpen className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">Lines of Business</h1>
              <p className="text-muted-foreground">Manage insurance lines of business and provider mappings</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
            
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add LOB
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between space-x-4">
              <div className="flex items-center space-x-4 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search LOBs..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pl-10"
                  />
                </div>
                
                <Select value={statusFilter} onValueChange={(value) => {
                  setStatusFilter(value);
                  setCurrentPage(1);
                }}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="text-sm text-muted-foreground">
                {getFilteredLOBs().length} LOB(s) found
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data View */}
        {renderDataView()}

        {/* Pagination */}
        {(() => {
          const { filtered, total } = getPaginatedData();
          return total > 1 && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length} LOBs
                  </p>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    
                    {Array.from({ length: total }, (_, i) => i + 1).map(page => (
                      <Button
                        key={page}
                        variant={page === currentPage ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className="w-10"
                      >
                        {page}
                      </Button>
                    ))}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === total}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })()}
      </div>
    </div>
  );
}