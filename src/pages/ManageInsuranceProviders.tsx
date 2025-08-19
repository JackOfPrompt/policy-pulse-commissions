import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BackButton } from "@/components/ui/back-button";
import { toast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Search, Filter, Plus, Upload, Download, Edit, Trash2, Building2, ImageIcon, FileSpreadsheet, X } from "lucide-react";
import { ListView, GridView, KanbanView, ViewToggle, useViewMode } from '@/components/ui/list-views';
interface InsuranceProvider {
  provider_id: string;
  provider_code: string;
  provider_name: string;
  trade_name?: string;
  provider_type?: "Composite" | "Life" | "General" | "Health";
  irda_license_number: string;
  irda_license_valid_till: string;
  logo_file_path?: string;
  contact_person?: string;
  contact_email?: string;
  contact_phone?: string;
  state?: string;
  status?: "Active" | "Inactive" | "Pending";
  created_at?: string;
  updated_at?: string;
}
const providerSchema = z.object({
  provider_code: z.string().min(1, "Provider code is required"),
  provider_name: z.string().min(1, "Provider name is required"),
  trade_name: z.string().optional(),
  provider_type: z.enum(["Composite", "Life", "General", "Health"]).optional(),
  parent_provider_id: z.string().optional(),
  irda_license_number: z.string().min(1, "IRDA license number is required"),
  irda_license_valid_till: z.date({
    required_error: "License expiry date is required"
  }),
  contact_person: z.string().optional(),
  contact_email: z.string().email("Invalid email format").optional().or(z.literal("")),
  contact_phone: z.string().optional(),
  state: z.string().optional(),
  status: z.enum(["Active", "Inactive"]).default("Active"),
  notes: z.string().optional()
});
type ProviderFormData = z.infer<typeof providerSchema>;
export default function ManageInsuranceProviders() {
  const navigate = useNavigate();
  const {
    user,
    profile
  } = useAuth();
  const [providers, setProviders] = useState<InsuranceProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<InsuranceProvider | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [isProcessingImport, setIsProcessingImport] = useState(false);
  const [importErrors, setImportErrors] = useState<Array<{
    row: number;
    error: string;
    data: any;
  }>>([]);
  const itemsPerPage = 10;
  const {
    viewMode,
    setViewMode
  } = useViewMode({
    defaultView: 'list',
    storageKey: 'providers-view'
  });
  const form = useForm<ProviderFormData>({
    resolver: zodResolver(providerSchema),
    defaultValues: {
      status: "Active"
    }
  });

  // Fetch providers with pagination and filters
  const fetchProviders = async () => {
    setLoading(true);
    try {
      let query = supabase.from('master_insurance_providers').select('*', {
        count: 'exact'
      });

      // Apply filters
      if (searchTerm) {
        query = query.or(`provider_name.ilike.%${searchTerm}%,provider_code.ilike.%${searchTerm}%,trade_name.ilike.%${searchTerm}%`);
      }
      if (typeFilter !== 'all') {
        query = query.eq('provider_type', typeFilter as any);
      }
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter as any);
      }

      // Apply pagination
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      query = query.range(from, to);
      const {
        data,
        error,
        count
      } = await query.order('created_at', {
        ascending: false
      });
      if (error) throw error;
      setProviders(data || []);
      setTotalPages(Math.ceil((count || 0) / itemsPerPage));
    } catch (error) {
      console.error('Error fetching providers:', error);
      toast({
        title: "Error",
        description: "Failed to fetch insurance providers",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchProviders();
  }, [currentPage, searchTerm, typeFilter, statusFilter]);

  // Handle logo upload
  const handleLogoUpload = async (file: File) => {
    if (!file) return null;
    setUploadingLogo(true);
    try {
      // Check if user is authenticated using the custom auth system
      if (!user || !profile) {
        console.error('User not authenticated in custom auth system');
        toast({
          title: "Authentication Error",
          description: "You must be logged in to upload files. Please login first.",
          variant: "destructive"
        });
        return null;
      }
      console.log('User authenticated:', user.email, 'Role:', profile.role);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;
      console.log('Uploading file:', filePath, 'to bucket: provider_logos');
      const {
        error: uploadError
      } = await supabase.storage.from('provider_logos').upload(filePath, file);
      if (uploadError) {
        console.error('Upload error details:', uploadError);
        throw uploadError;
      }
      const {
        data: {
          publicUrl
        }
      } = supabase.storage.from('provider_logos').getPublicUrl(filePath);
      console.log('Upload successful, public URL:', publicUrl);
      return publicUrl;
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast({
        title: "Error",
        description: `Failed to upload logo: ${error.message || 'Unknown error'}`,
        variant: "destructive"
      });
      return null;
    } finally {
      setUploadingLogo(false);
    }
  };

  // Handle logo file selection
  const handleLogoFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setLogoFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onload = e => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle form submission
  const onSubmit = async (data: ProviderFormData) => {
    try {
      let logoUrl = editingProvider?.logo_file_path;

      // Upload logo if a new file is selected
      if (logoFile) {
        logoUrl = await handleLogoUpload(logoFile);
        if (!logoUrl) {
          // If logo upload failed, don't proceed
          return;
        }
      }
      const providerData = {
        provider_code: data.provider_code,
        provider_name: data.provider_name,
        trade_name: data.trade_name,
        provider_type: data.provider_type,
        irda_license_number: data.irda_license_number,
        irda_license_valid_till: format(data.irda_license_valid_till, 'yyyy-MM-dd'),
        contact_person: data.contact_person,
        contact_email: data.contact_email,
        contact_phone: data.contact_phone,
        state: data.state,
        status: data.status,
        notes: data.notes,
        logo_file_path: logoUrl
      };
      if (editingProvider) {
        const {
          error
        } = await supabase.from('master_insurance_providers').update(providerData).eq('provider_id', editingProvider.provider_id);
        if (error) throw error;
        toast({
          title: "Success",
          description: "Provider updated successfully"
        });
      } else {
        const {
          error
        } = await supabase.from('master_insurance_providers').insert(providerData);
        if (error) throw error;
        toast({
          title: "Success",
          description: "Provider created successfully"
        });
      }
      setIsDialogOpen(false);
      form.reset();
      setEditingProvider(null);
      setLogoFile(null);
      setLogoPreview(null);
      fetchProviders();
    } catch (error) {
      console.error('Error saving provider:', error);
      toast({
        title: "Error",
        description: "Failed to save provider",
        variant: "destructive"
      });
    }
  };

  // Handle edit
  const handleEdit = (provider: InsuranceProvider) => {
    setEditingProvider(provider);
    setLogoFile(null);
    setLogoPreview(null);
    form.reset({
      provider_code: provider.provider_code,
      provider_name: provider.provider_name,
      trade_name: provider.trade_name,
      provider_type: provider.provider_type,
      irda_license_number: provider.irda_license_number,
      irda_license_valid_till: new Date(provider.irda_license_valid_till),
      contact_person: provider.contact_person,
      contact_email: provider.contact_email || "",
      contact_phone: provider.contact_phone,
      state: provider.state,
      status: provider.status === 'Active' || provider.status === 'Inactive' ? provider.status : "Active",
      notes: ""
    });
    setIsDialogOpen(true);
  };

  // Handle delete (soft delete)
  const handleDelete = async (providerId: string) => {
    if (!confirm('Are you sure you want to delete this provider?')) return;
    try {
      const {
        error
      } = await supabase.from('master_insurance_providers').update({
        status: 'Inactive'
      }).eq('provider_id', providerId);
      if (error) throw error;
      toast({
        title: "Success",
        description: "Provider deleted successfully"
      });
      fetchProviders();
    } catch (error) {
      console.error('Error deleting provider:', error);
      toast({
        title: "Error",
        description: "Failed to delete provider",
        variant: "destructive"
      });
    }
  };

  // Handle status toggle with debouncing and optimistic updates
  const [updatingStatuses, setUpdatingStatuses] = useState<Set<string>>(new Set());
  const handleStatusToggle = useCallback(async (providerId: string, currentStatus: string) => {
    // Prevent multiple calls for the same provider
    if (updatingStatuses.has(providerId)) {
      return;
    }
    try {
      setUpdatingStatuses(prev => new Set(prev).add(providerId));
      const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';

      // Optimistic update
      setProviders(prev => prev.map(provider => provider.provider_id === providerId ? {
        ...provider,
        status: newStatus as "Active" | "Inactive" | "Pending"
      } : provider));
      const {
        error
      } = await supabase.from('master_insurance_providers').update({
        status: newStatus
      }).eq('provider_id', providerId);
      if (error) throw error;
      toast({
        title: "Success",
        description: "Provider status updated"
      });
    } catch (error) {
      console.error('Error updating status:', error);

      // Revert optimistic update on error
      setProviders(prev => prev.map(provider => provider.provider_id === providerId ? {
        ...provider,
        status: currentStatus as "Active" | "Inactive" | "Pending"
      } : provider));
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive"
      });
    } finally {
      setUpdatingStatuses(prev => {
        const newSet = new Set(prev);
        newSet.delete(providerId);
        return newSet;
      });
    }
  }, [updatingStatuses]);

  // Download CSV template
  const downloadTemplate = () => {
    const csvContent = `provider_code,provider_name,trade_name,provider_type,irda_license_number,irda_license_valid_till,contact_person,contact_email,contact_phone,state,status,notes
SAMPLE001,Sample Insurance Company,Sample Trade Name,Composite,IRDA/COMP/2023/001,2025-12-31,John Doe,john@sample.com,+91-9876543210,Maharashtra,Active,Sample notes`;
    const blob = new Blob([csvContent], {
      type: 'text/csv'
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'insurance_providers_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Parse CSV file
  const parseCSV = (text: string) => {
    const lines = text.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const data = [];
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim()) {
        const values = lines[i].split(',').map(v => v.trim());
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        data.push(row);
      }
    }
    return data;
  };

  // Handle file upload for import
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImportFile(file);
      const reader = new FileReader();
      reader.onload = e => {
        const text = e.target?.result as string;
        try {
          const data = parseCSV(text);
          setImportPreview(data.slice(0, 5)); // Show first 5 rows for preview
        } catch (error) {
          toast({
            title: "Error",
            description: "Failed to parse CSV file",
            variant: "destructive"
          });
        }
      };
      reader.readAsText(file);
    }
  };

  // Process bulk import
  const processBulkImport = async () => {
    if (!importFile) return;
    setIsProcessingImport(true);
    const errors: Array<{
      row: number;
      error: string;
      data: any;
    }> = [];
    try {
      const reader = new FileReader();
      reader.onload = async e => {
        const text = e.target?.result as string;
        const data = parseCSV(text);
        let insertCount = 0;
        let updateCount = 0;
        let errorCount = 0;
        for (let i = 0; i < data.length; i++) {
          const row = data[i];
          const rowNumber = i + 2; // Account for header row

          try {
            // Validate required fields
            if (!row.provider_code || !row.provider_name || !row.irda_license_number) {
              throw new Error('Missing required fields: provider_code, provider_name, or irda_license_number');
            }

            // Validate email format if provided
            if (row.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.contact_email)) {
              throw new Error('Invalid email format');
            }

            // Validate date format
            if (row.irda_license_valid_till && !/^\d{4}-\d{2}-\d{2}$/.test(row.irda_license_valid_till)) {
              throw new Error('Invalid date format for irda_license_valid_till (expected YYYY-MM-DD)');
            }

            // Check if provider exists
            const {
              data: existingProvider
            } = await supabase.from('master_insurance_providers').select('provider_id').eq('provider_code', row.provider_code).single();
            const providerData = {
              provider_code: row.provider_code,
              provider_name: row.provider_name,
              trade_name: row.trade_name || null,
              provider_type: row.provider_type || null,
              irda_license_number: row.irda_license_number,
              irda_license_valid_till: row.irda_license_valid_till,
              contact_person: row.contact_person || null,
              contact_email: row.contact_email || null,
              contact_phone: row.contact_phone || null,
              state: row.state || null,
              status: row.status || 'Active',
              notes: row.notes || null
            };
            if (existingProvider) {
              // Update existing
              const {
                error
              } = await supabase.from('master_insurance_providers').update(providerData).eq('provider_id', existingProvider.provider_id);
              if (error) throw error;
              updateCount++;
            } else {
              // Insert new
              const {
                error
              } = await supabase.from('master_insurance_providers').insert(providerData);
              if (error) throw error;
              insertCount++;
            }
          } catch (error: any) {
            console.error('Error processing row:', row, error);
            errors.push({
              row: rowNumber,
              error: error.message || 'Unknown error',
              data: row
            });
            errorCount++;
          }
        }
        setImportErrors(errors);
        toast({
          title: "Import Complete",
          description: `Inserted: ${insertCount}, Updated: ${updateCount}, Errors: ${errorCount}`
        });
        setIsImportDialogOpen(false);
        setImportFile(null);
        setImportPreview([]);
        fetchProviders();
      };
      reader.readAsText(importFile);
    } catch (error) {
      console.error('Error processing import:', error);
      toast({
        title: "Error",
        description: "Failed to process import",
        variant: "destructive"
      });
    } finally {
      setIsProcessingImport(false);
    }
  };

  // Download error report
  const downloadErrorReport = () => {
    if (importErrors.length === 0) {
      toast({
        title: "No Errors",
        description: "No import errors to download"
      });
      return;
    }
    const headers = ['Row Number', 'Error', 'provider_code', 'provider_name', 'irda_license_number', 'contact_email', 'All Data'];
    const csvContent = [headers.join(','), ...importErrors.map(error => [error.row, `"${error.error.replace(/"/g, '""')}"`,
    // Escape quotes in error messages
    error.data.provider_code || '', `"${(error.data.provider_name || '').replace(/"/g, '""')}"`, error.data.irda_license_number || '', error.data.contact_email || '', `"${JSON.stringify(error.data).replace(/"/g, '""')}"` // Full row data as JSON
    ].join(','))].join('\n');
    const blob = new Blob([csvContent], {
      type: 'text/csv'
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `insurance_providers_import_errors_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast({
      title: "Error Report Downloaded",
      description: `Downloaded ${importErrors.length} error records`
    });
  };

  // Render actions for each provider
  const renderActions = (provider: InsuranceProvider) => <div className="flex items-center space-x-1">
      <Button variant="ghost" size="sm" onClick={e => {
      e.stopPropagation();
      handleEdit(provider);
    }}>
        <Edit className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" onClick={e => {
      e.stopPropagation();
      handleDelete(provider.provider_id);
    }}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>;

  // Render card for grid views
  const renderProviderCard = (provider: InsuranceProvider, actions?: React.ReactNode) => <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            {provider.logo_file_path ? <img src={provider.logo_file_path} alt={`${provider.provider_name} logo`} className="h-12 w-12 object-contain rounded bg-white border" onError={e => {
            e.currentTarget.style.display = 'none';
            e.currentTarget.nextElementSibling?.classList.remove('hidden');
          }} /> : null}
            <div className={`h-12 w-12 bg-muted rounded flex items-center justify-center ${provider.logo_file_path ? 'hidden' : ''}`}>
              <ImageIcon className="h-6 w-6 text-muted-foreground" />
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg truncate">{provider.provider_name}</h3>
              <Badge variant={provider.status === 'Active' ? 'default' : 'secondary'}>
                {provider.status}
              </Badge>
            </div>
            
            <p className="text-sm text-muted-foreground mb-2">{provider.provider_code}</p>
            
            {provider.trade_name && <p className="text-sm mb-2">Trade: {provider.trade_name}</p>}
            
            {provider.provider_type && <Badge variant="outline" className="mb-2">{provider.provider_type}</Badge>}
            
            <div className="space-y-1 text-sm text-muted-foreground">
              <div>License: {provider.irda_license_number}</div>
              <div>Expires: {format(new Date(provider.irda_license_valid_till), 'MMM dd, yyyy')}</div>
              {provider.contact_person && <div>Contact: {provider.contact_person}</div>}
              {provider.state && <div>State: {provider.state}</div>}
            </div>
            
            <div className="flex items-center justify-between mt-3">
              <Switch checked={provider.status === 'Active'} disabled={updatingStatuses.has(provider.provider_id)} onCheckedChange={() => handleStatusToggle(provider.provider_id, provider.status || 'Inactive')} />
              {actions}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>;

  // Define columns for list view
  const listViewColumns = [{
    key: 'logo',
    header: 'Logo',
    className: 'w-16',
    render: (provider: InsuranceProvider) => <div>
          {provider.logo_file_path ? <img src={provider.logo_file_path} alt={`${provider.provider_name} logo`} className="h-8 w-8 object-contain rounded bg-white border" onError={e => {
        e.currentTarget.style.display = 'none';
        e.currentTarget.nextElementSibling?.classList.remove('hidden');
      }} /> : null}
          <div className={`h-8 w-8 bg-muted rounded flex items-center justify-center ${provider.logo_file_path ? 'hidden' : ''}`}>
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
  }, {
    key: 'provider_code',
    header: 'Code',
    render: (provider: InsuranceProvider) => <span className="font-medium">{provider.provider_code}</span>
  }, {
    key: 'provider_name',
    header: 'Provider Name'
  }, {
    key: 'trade_name',
    header: 'Trade Name',
    render: (provider: InsuranceProvider) => <span className="text-muted-foreground">{provider.trade_name || '-'}</span>
  }, {
    key: 'provider_type',
    header: 'Type',
    render: (provider: InsuranceProvider) => provider.provider_type ? <Badge variant="outline">{provider.provider_type}</Badge> : null
  }, {
    key: 'irda_license_number',
    header: 'License #',
    render: (provider: InsuranceProvider) => <span className="font-mono text-sm">{provider.irda_license_number}</span>
  }, {
    key: 'irda_license_valid_till',
    header: 'Expires',
    render: (provider: InsuranceProvider) => format(new Date(provider.irda_license_valid_till), 'MMM dd, yyyy')
  }, {
    key: 'contact',
    header: 'Contact',
    render: (provider: InsuranceProvider) => <div className="text-sm">
          {provider.contact_person && <div>{provider.contact_person}</div>}
          {provider.contact_email && <div className="text-muted-foreground">{provider.contact_email}</div>}
        </div>
  }, {
    key: 'state',
    header: 'Location',
    render: (provider: InsuranceProvider) => <div className="text-sm">
          {provider.state && <div>{provider.state}</div>}
        </div>
  }, {
    key: 'status',
    header: 'Status',
    render: (provider: InsuranceProvider) => <div className="flex items-center space-x-2">
          <Switch checked={provider.status === 'Active'} disabled={updatingStatuses.has(provider.provider_id)} onCheckedChange={() => handleStatusToggle(provider.provider_id, provider.status || 'Inactive')} />
          <Badge variant={provider.status === 'Active' ? 'default' : 'secondary'}>
            {provider.status}
          </Badge>
        </div>
  }];

  // Status configuration for kanban view
  const statusConfig = {
    'Active': {
      label: 'Active Providers',
      color: 'text-green-600',
      bgColor: 'bg-green-50 border-green-200'
    },
    'Inactive': {
      label: 'Inactive Providers',
      color: 'text-gray-600',
      bgColor: 'bg-gray-50 border-gray-200'
    },
    'Pending': {
      label: 'Pending Approval',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50 border-yellow-200'
    }
  };

  // Render data based on view mode
  const renderDataView = () => {
    if (viewMode === 'list') {
      return <ListView data={providers} columns={listViewColumns} loading={loading} actions={renderActions} />;
    } else if (viewMode === 'kanban') {
      return <KanbanView data={providers} loading={loading} renderCard={renderProviderCard} actions={renderActions} getItemStatus={provider => provider.status || 'Pending'} statusConfig={statusConfig} />;
    } else {
      // Grid views
      return <GridView data={providers} loading={loading} renderCard={renderProviderCard} actions={renderActions} viewMode={viewMode as 'grid-small' | 'grid-medium' | 'grid-large'} />;
    }
  };
  return <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <BackButton to="/admin-dashboard" />
          <Building2 className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl text-foreground font-normal">Insurance Providers</h1>
            
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {importErrors.length > 0 && <Button variant="outline" size="sm" onClick={downloadErrorReport}>
              <Download className="h-4 w-4 mr-2" />
              Error Report ({importErrors.length})
            </Button>}
          <Button variant="outline" size="sm" onClick={downloadTemplate}>
            <Download className="h-4 w-4 mr-2" />
            Template
          </Button>
          <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Bulk Import Insurance Providers</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                  <div className="text-center">
                    <FileSpreadsheet className="mx-auto h-12 w-12 text-muted-foreground" />
                    <div className="mt-4">
                      <label htmlFor="csv-upload" className="cursor-pointer">
                        <span className="mt-2 block text-sm font-medium text-foreground">
                          Choose CSV file or drag and drop
                        </span>
                        <span className="text-xs text-muted-foreground">
                          CSV files only
                        </span>
                      </label>
                      <input id="csv-upload" type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
                    </div>
                  </div>
                </div>

                {importFile && <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Selected file: {importFile.name}</span>
                      <Button variant="ghost" size="sm" onClick={() => {
                    setImportFile(null);
                    setImportPreview([]);
                  }}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    {importPreview.length > 0 && <div>
                        <h4 className="text-sm font-medium mb-2">Preview (first 5 rows):</h4>
                        <div className="border rounded-lg overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Provider Code</TableHead>
                                <TableHead>Provider Name</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>IRDA License</TableHead>
                                <TableHead>Status</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {importPreview.map((row, index) => <TableRow key={index}>
                                  <TableCell>{row.provider_code}</TableCell>
                                  <TableCell>{row.provider_name}</TableCell>
                                  <TableCell>{row.provider_type}</TableCell>
                                  <TableCell>{row.irda_license_number}</TableCell>
                                  <TableCell>{row.status}</TableCell>
                                </TableRow>)}
                            </TableBody>
                          </Table>
                        </div>
                      </div>}

                    <div className="flex items-center space-x-2">
                      <Button onClick={processBulkImport} disabled={isProcessingImport} className="flex-1">
                        {isProcessingImport ? "Processing..." : "Import Data"}
                      </Button>
                    </div>
                  </div>}
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Provider
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingProvider ? 'Edit Provider' : 'Add New Provider'}
                </DialogTitle>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="provider_code" render={({
                    field
                  }) => <FormItem>
                          <FormLabel>Provider Code *</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., ICICI-GRP" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>} />
                    
                    <FormField control={form.control} name="provider_type" render={({
                    field
                  }) => <FormItem>
                          <FormLabel>Provider Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Composite">Composite</SelectItem>
                              <SelectItem value="Life">Life</SelectItem>
                              <SelectItem value="General">General</SelectItem>
                              <SelectItem value="Health">Health</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>} />
                  </div>

                  <FormField control={form.control} name="provider_name" render={({
                  field
                }) => <FormItem>
                        <FormLabel>Provider Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Full registered name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>} />

                  <FormField control={form.control} name="trade_name" render={({
                  field
                }) => <FormItem>
                        <FormLabel>Trade Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Commercial brand name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>} />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="irda_license_number" render={({
                    field
                  }) => <FormItem>
                          <FormLabel>IRDA License Number *</FormLabel>
                          <FormControl>
                            <Input placeholder="License number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>} />

                    <FormField control={form.control} name="irda_license_valid_till" render={({
                    field
                  }) => <FormItem>
                          <FormLabel>License Valid Till *</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                  {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={date => date < new Date()} initialFocus className="pointer-events-auto" />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>} />
                  </div>

                   {/* Logo Upload */}
                   <div className="space-y-3">
                     <label className="text-sm font-medium">Provider Logo</label>
                     
                     {/* Current/Preview Logo Display */}
                     <div className="flex items-center space-x-4">
                       {(logoPreview || editingProvider?.logo_file_path) && <div className="relative">
                           <img src={logoPreview || editingProvider?.logo_file_path} alt="Logo preview" className="h-16 w-16 object-contain rounded border bg-white" />
                           {logoPreview && <div className="absolute -top-2 -right-2">
                               <Button type="button" variant="outline" size="sm" className="h-6 w-6 rounded-full p-0" onClick={() => {
                          setLogoFile(null);
                          setLogoPreview(null);
                          // Reset file input
                          const input = document.getElementById('logo-upload') as HTMLInputElement;
                          if (input) input.value = '';
                        }}>
                                 <X className="h-3 w-3" />
                               </Button>
                             </div>}
                         </div>}
                       
                       <div className="flex-1">
                         <Input id="logo-upload" type="file" accept="image/*" onChange={handleLogoFileChange} disabled={uploadingLogo} className="w-full" />
                         <p className="text-xs text-muted-foreground mt-1">
                           Upload company logo (JPG, PNG, SVG - max 5MB)
                         </p>
                       </div>
                     </div>
                     
                     {uploadingLogo && <div className="text-sm text-muted-foreground flex items-center space-x-2">
                         <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                         <span>Uploading logo...</span>
                       </div>}
                   </div>

                  {/* Contact Information */}
                  <div className="grid grid-cols-3 gap-4">
                    <FormField control={form.control} name="contact_person" render={({
                    field
                  }) => <FormItem>
                          <FormLabel>Contact Person</FormLabel>
                          <FormControl>
                            <Input placeholder="Full name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>} />

                    <FormField control={form.control} name="contact_email" render={({
                    field
                  }) => <FormItem>
                          <FormLabel>Contact Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="email@domain.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>} />

                    <FormField control={form.control} name="contact_phone" render={({
                    field
                  }) => <FormItem>
                          <FormLabel>Contact Phone</FormLabel>
                          <FormControl>
                            <Input placeholder="+91 XXXXXXXXXX" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>} />
                  </div>

                   {/* Location */}
                   <FormField control={form.control} name="state" render={({
                  field
                }) => <FormItem>
                         <FormLabel>State</FormLabel>
                         <FormControl>
                           <Input placeholder="State name" {...field} />
                         </FormControl>
                         <FormMessage />
                       </FormItem>} />

                  <FormField control={form.control} name="notes" render={({
                  field
                }) => <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Additional notes..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>} />

                  <FormField control={form.control} name="status" render={({
                  field
                }) => <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Active">Active</SelectItem>
                            <SelectItem value="Inactive">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>} />

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => {
                    setIsDialogOpen(false);
                    form.reset();
                    setEditingProvider(null);
                    setLogoFile(null);
                    setLogoPreview(null);
                  }}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingProvider ? 'Update' : 'Create'} Provider
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search providers..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
              </div>
            </div>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Composite">Composite</SelectItem>
                <SelectItem value="Life">Life</SelectItem>
                <SelectItem value="General">General</SelectItem>
                <SelectItem value="Health">Health</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            
            <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
          </div>
        </CardContent>
      </Card>

      {/* Data Display */}
      {renderDataView()}
      
      {/* Pagination */}
      {totalPages > 1 && <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex items-center space-x-1">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1}>
                  Previous
                </Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages}>
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>}
    </div>;
}