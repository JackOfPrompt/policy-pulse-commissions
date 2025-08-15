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
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
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

  // Image upload handler
  const handleImageUpload = async (file: File) => {
    try {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: "Please upload an image file (JPEG, PNG, GIF, or WebP)",
          variant: "destructive"
        });
        return null;
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        toast({
          title: "File Too Large",
          description: "Please upload an image smaller than 5MB",
          variant: "destructive"
        });
        return null;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `lob_${Date.now()}.${fileExt}`;

      // Show upload progress toast
      toast({
        title: "Uploading...",
        description: "Please wait while we upload your image",
      });

      const { error: uploadError } = await supabase.storage
        .from('lob_icons')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });

      // Return the file path for storage in database
      return fileName;
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload image. Please try again.",
        variant: "destructive"
      });
      return null;
    }
  };

  // Form submission
  const onSubmit = async (data: LOBFormData) => {
    try {
      let iconUrl = editingLOB?.icon_file_path || "";

      // Upload new image if selected
      if (selectedImage) {
        const uploadedUrl = await handleImageUpload(selectedImage);
        if (uploadedUrl) {
          iconUrl = uploadedUrl;
        }
      }

      const lobData = {
        lob_code: data.lob_code,
        lob_name: data.lob_name,
        description: data.description || null,
        icon_file_path: iconUrl || null,
        status: data.status as any,
        updated_at: new Date().toISOString()
      };

      console.log('Attempting to save LOB with data:', lobData);
      console.log('Editing LOB:', editingLOB);

      let result;
      if (editingLOB) {
        // Update existing LOB
        console.log('Updating LOB with ID:', editingLOB.lob_id);
        result = await (supabase as any)
          .from('master_line_of_business')
          .update({ ...lobData, updated_by: (await supabase.auth.getUser()).data.user?.id })
          .eq('lob_id', editingLOB.lob_id)
          .select();
        
        console.log('Update result:', result);
      } else {
        // Create new LOB
        console.log('Creating new LOB');
        result = await (supabase as any)
          .from('master_line_of_business')
          .insert({ ...lobData, created_by: (await supabase.auth.getUser()).data.user?.id })
          .select()
          .single();
        
        console.log('Insert result:', result);
      }

      if (result.error) {
        console.error('Database operation error:', result.error);
        throw result.error;
      }

      // Check if operation was successful
      if (editingLOB && (!result.data || result.data.length === 0)) {
        console.error('Update failed - no data returned');
        throw new Error('LOB update failed - record may not exist or insufficient permissions');
      }
      
      if (!editingLOB && !result.data) {
        console.error('Insert failed - no data returned');
        throw new Error('LOB creation failed');
      }

      // Handle provider mappings
      const lobId = editingLOB?.lob_id || (Array.isArray(result.data) ? result.data[0]?.lob_id : result.data?.lob_id);
      console.log('Using LOB ID for mappings:', lobId);
      
      // Delete existing mappings
      await (supabase as any)
        .from('provider_lob_map')
        .delete()
        .eq('lob_id', lobId);

      // Insert new mappings
      if (data.linked_providers && data.linked_providers.length > 0) {
        const mappings = data.linked_providers.map(providerId => ({
          lob_id: lobId,
          provider_id: providerId
        }));

        const { error: mappingError } = await (supabase as any)
          .from('provider_lob_map')
          .insert(mappings);

        if (mappingError) throw mappingError;
      }

      toast({
        title: "Success",
        description: `LOB ${editingLOB ? 'updated' : 'created'} successfully`
      });

      // Reset form and close dialogs
      form.reset();
      setSelectedImage(null);
      setImagePreview("");
      setIsAddDialogOpen(false);
      setIsEditDialogOpen(false);
      setEditingLOB(null);
      
      // Clear file inputs
      const fileInputs = document.querySelectorAll('input[type="file"]');
      fileInputs.forEach((input: any) => {
        input.value = '';
      });
      
      // Refresh data
      fetchLOBs();
    } catch (error) {
      console.error('Error saving LOB:', error);
      toast({
        title: "Error",
        description: "Failed to save LOB",
        variant: "destructive"
      });
    }
  };

  // Edit handler
  const handleEdit = (lob: LOB) => {
    setEditingLOB(lob);
    setSelectedImage(null); // Clear any selected image
    
    form.reset({
      lob_code: lob.lob_code,
      lob_name: lob.lob_name,
      description: lob.description || "",
      status: lob.status,
      linked_providers: lob.linked_providers?.map(p => p.provider_id) || []
    });
    
    // Set image preview for existing icon
    if (lob.icon_file_path) {
      const { data } = supabase.storage
        .from('lob_icons')
        .getPublicUrl(lob.icon_file_path);
      setImagePreview(data.publicUrl);
    } else {
      setImagePreview("");
    }
    
    setIsEditDialogOpen(true);
  };

  // Delete handler (soft delete)
  const handleDelete = async () => {
    if (!deletingLOB) return;

    try {
      const { error } = await (supabase as any)
        .from('master_line_of_business')
        .update({ 
          status: 'Inactive' as any,
          updated_at: new Date().toISOString(),
          updated_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('lob_id', deletingLOB.lob_id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "LOB marked as inactive"
      });

      setIsDeleteDialogOpen(false);
      setDeletingLOB(null);
      fetchLOBs();
    } catch (error) {
      console.error('Error deleting LOB:', error);
      toast({
        title: "Error",
        description: "Failed to delete LOB",
        variant: "destructive"
      });
    }
  };

  // Status toggle
  const handleStatusToggle = async (lob: LOB) => {
    try {
      const newStatus = lob.status === 'Active' ? 'Inactive' : 'Active';
      
      const { error } = await (supabase as any)
        .from('master_line_of_business')
        .update({ 
          status: newStatus as any,
          updated_at: new Date().toISOString()
        })
        .eq('lob_id', lob.lob_id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `LOB ${newStatus.toLowerCase()}`
      });

      fetchLOBs();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive"
      });
    }
  };

  // Error report download
  const downloadErrorReport = () => {
    if (!errorReport.length) return;

    const csvContent = [
      'Row,LOB Code,LOB Name,Error Type,Error Message,Data',
      ...errorReport.map(error => [
        error.row,
        error.data.lob_code || 'N/A',
        error.data.lob_name || 'N/A',
        error.type,
        `"${error.error}"`,
        `"${JSON.stringify(error.data)}"`
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lob_bulk_import_errors_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // CSV template download
  const downloadTemplate = () => {
    const csvContent = `lob_code,lob_name,description,status,linked_provider_codes
MOTOR,Motor Insurance,Vehicle insurance coverage,Active,"HDFC001,ICICI002"
HEALTH,Health Insurance,Medical insurance coverage,Active,"HDFC001"`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lob_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const parseCSV = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim());
    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
      const obj: any = {};
      headers.forEach((header, index) => {
        obj[header] = values[index] || '';
      });
      return obj;
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsed = parseCSV(text);
      setCsvData(parsed);
      setCsvPreview(parsed.slice(0, 5));
    };
    reader.readAsText(file);
  };

  const processBulkImport = async () => {
    if (!csvData.length) return;

    // Check if user has system_admin role
    if (!profile || profile.role !== 'system_admin') {
      toast({
        title: "Access Denied",
        description: "Only system administrators can perform bulk imports",
        variant: "destructive"
      });
      return;
    }

    try {
      let insertCount = 0;
      let updateCount = 0;
      let errorCount = 0;
      const errors: Array<{
        row: number;
        data: any;
        error: string;
        type: 'validation' | 'database' | 'network';
      }> = [];

      for (let i = 0; i < csvData.length; i++) {
        const row = csvData[i];
        try {
          // Validate required fields
          if (!row.lob_code || !row.lob_name) {
            errors.push({
              row: i + 2, // +2 because CSV has header row and is 1-indexed
              data: row,
              error: 'Missing required fields: lob_code and lob_name are required',
              type: 'validation'
            });
            errorCount++;
            continue;
          }

          // Validate LOB code format
          if (row.lob_code.length > 20) {
            errors.push({
              row: i + 2,
              data: row,
              error: 'LOB code cannot exceed 20 characters',
              type: 'validation'
            });
            errorCount++;
            continue;
          }

          // Validate LOB name format
          if (row.lob_name.length > 100) {
            errors.push({
              row: i + 2,
              data: row,
              error: 'LOB name cannot exceed 100 characters',
              type: 'validation'
            });
            errorCount++;
            continue;
          }

          // Validate status
          if (row.status && !['Active', 'Inactive'].includes(row.status)) {
            errors.push({
              row: i + 2,
              data: row,
              error: 'Status must be either "Active" or "Inactive"',
              type: 'validation'
            });
            errorCount++;
            continue;
          }

          // Check if LOB exists
          const { data: existingLOB } = await (supabase as any)
            .from('master_line_of_business')
            .select('lob_id')
            .eq('lob_code', row.lob_code)
            .maybeSingle();

          const lobData = {
            lob_code: row.lob_code,
            lob_name: row.lob_name,
            description: row.description || null,
            status: (row.status || 'Active') as any
          };

          let lobId;
          if (existingLOB) {
            // Update existing
            const { error } = await (supabase as any)
              .from('master_line_of_business')
              .update(lobData)
              .eq('lob_id', existingLOB.lob_id);
            
            if (error) throw error;
            lobId = existingLOB.lob_id;
            updateCount++;
          } else {
            // Insert new
            const { data, error } = await (supabase as any)
              .from('master_line_of_business')
              .insert(lobData)
              .select('lob_id')
              .single();
            
            if (error) throw error;
            lobId = data.lob_id;
            insertCount++;
          }

          // Handle provider mappings
          if (row.linked_provider_codes) {
            try {
              const providerCodes = row.linked_provider_codes.split(',').map((c: string) => c.trim());
              
              // Delete existing mappings
              await (supabase as any)
                .from('provider_lob_map')
                .delete()
                .eq('lob_id', lobId);

              // Get provider IDs
              const { data: providerData } = await supabase
                .from('master_insurance_providers')
                .select('provider_id, provider_code')
                .in('provider_code', providerCodes);

              if (providerData?.length) {
                const mappings = providerData.map(p => ({
                  lob_id: lobId,
                  provider_id: p.provider_id
                }));

                const { error: mappingError } = await (supabase as any)
                  .from('provider_lob_map')
                  .insert(mappings);

                if (mappingError) throw mappingError;
              } else if (providerCodes.length > 0) {
                // Log warning for missing provider codes
                errors.push({
                  row: i + 2,
                  data: row,
                  error: `Provider codes not found: ${providerCodes.join(', ')}`,
                  type: 'validation'
                });
              }
            } catch (providerError: any) {
              errors.push({
                row: i + 2,
                data: row,
                error: `Provider mapping error: ${providerError.message}`,
                type: 'database'
              });
            }
          }
        } catch (error: any) {
          console.error('Error processing LOB row:', row, error);
          errors.push({
            row: i + 2,
            data: row,
            error: error.message || 'Unknown database error',
            type: 'database'
          });
          errorCount++;
        }
      }

      // Store results and errors
      setBulkImportResults({
        total: csvData.length,
        inserted: insertCount,
        updated: updateCount,
        errors: errorCount,
        timestamp: new Date().toISOString()
      });
      setErrorReport(errors);

      toast({
        title: "Bulk Import Complete",
        description: `Inserted: ${insertCount}, Updated: ${updateCount}, Errors: ${errorCount}${errorCount > 0 ? ' - View error report for details' : ''}`,
        variant: errorCount > 0 ? "destructive" : "default"
      });

      setIsBulkImportOpen(false);
      setCsvData([]);
      setCsvPreview([]);
      setUploadedFile(null);
      
      // Show error report if there are errors
      if (errorCount > 0) {
        setIsErrorReportOpen(true);
      }
      
      fetchLOBs();
    } catch (error) {
      console.error('Error processing bulk import:', error);
      toast({
        title: "Error",
        description: "Failed to process bulk import. Please ensure you are logged in as a system administrator.",
        variant: "destructive"
      });
    }
  };

  // Filter and pagination logic
  const filteredLOBs = lobs.filter(lob => {
    const matchesSearch = lob.lob_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lob.lob_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || lob.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredLOBs.length / itemsPerPage);
  const paginatedLOBs = filteredLOBs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Image preview handler
  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type immediately
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: "Please upload an image file (JPEG, PNG, GIF, or WebP)",
          variant: "destructive"
        });
        event.target.value = ''; // Clear the input
        return;
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        toast({
          title: "File Too Large",
          description: "Please upload an image smaller than 5MB",
          variant: "destructive"
        });
        event.target.value = ''; // Clear the input
        return;
      }

      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      // Handle file removal
      setSelectedImage(null);
      // If editing, restore original image preview
      if (editingLOB?.icon_file_path) {
        const { data } = supabase.storage
          .from('lob_icons')
          .getPublicUrl(editingLOB.icon_file_path);
        setImagePreview(data.publicUrl);
      } else {
        setImagePreview("");
      }
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchLOBs();
    fetchProviders();
  }, [fetchLOBs, fetchProviders]);

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
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode(viewMode === 'table' ? 'grid' : 'table')}
            >
              {viewMode === 'table' ? <Grid className="h-4 w-4" /> : <List className="h-4 w-4" />}
            </Button>
            
            <Dialog open={isBulkImportOpen} onOpenChange={setIsBulkImportOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>Bulk Import LOBs</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Button variant="outline" onClick={downloadTemplate}>
                      <Download className="h-4 w-4 mr-2" />
                      Download Template
                    </Button>
                    <Input
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload}
                      className="max-w-xs"
                    />
                  </div>

                  {csvPreview.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Preview ({csvData.length} records)</h4>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>LOB Code</TableHead>
                            <TableHead>LOB Name</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Provider Codes</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {csvPreview.map((row, index) => (
                            <TableRow key={index}>
                              <TableCell>{row.lob_code}</TableCell>
                              <TableCell>{row.lob_name}</TableCell>
                              <TableCell>{row.description}</TableCell>
                              <TableCell>
                                <Badge variant={row.status === 'Active' ? 'default' : 'secondary'}>
                                  {row.status}
                                </Badge>
                              </TableCell>
                              <TableCell>{row.linked_provider_codes}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      
                      <div className="flex justify-end mt-4">
                        <Button onClick={processBulkImport}>
                          Import {csvData.length} Records
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
              setIsAddDialogOpen(open);
              if (!open) {
                // Reset form when closing
                form.reset();
                setSelectedImage(null);
                setImagePreview("");
                const fileInputs = document.querySelectorAll('input[type="file"]');
                fileInputs.forEach((input: any) => {
                  input.value = '';
                });
              }
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add LOB
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add New Line of Business</DialogTitle>
                </DialogHeader>
                
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="lob_code">LOB Code *</Label>
                      <Input
                        id="lob_code"
                        {...form.register('lob_code')}
                        placeholder="e.g., MOTOR"
                      />
                      {form.formState.errors.lob_code && (
                        <p className="text-sm text-destructive mt-1">
                          {form.formState.errors.lob_code.message}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="lob_name">LOB Name *</Label>
                      <Input
                        id="lob_name"
                        {...form.register('lob_name')}
                        placeholder="e.g., Motor Insurance"
                      />
                      {form.formState.errors.lob_name && (
                        <p className="text-sm text-destructive mt-1">
                          {form.formState.errors.lob_name.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      {...form.register('description')}
                      placeholder="Description of the line of business"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="icon">Icon</Label>
                    <div className="flex items-center space-x-4">
                      <div className="flex-1">
                        <Input
                          type="file"
                          id="icon"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Upload JPG, PNG, GIF, or WebP (max 5MB)
                        </p>
                      </div>
                      {imagePreview && (
                        <div className="relative">
                          <img src={imagePreview} alt="Preview" className="w-16 h-16 object-cover rounded border" />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => {
                              setSelectedImage(null);
                              setImagePreview("");
                              const fileInput = document.getElementById('icon') as HTMLInputElement;
                              if (fileInput) fileInput.value = '';
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label>Linked Providers</Label>
                    <Controller
                      control={form.control}
                      name="linked_providers"
                      render={({ field }) => (
                        <Select
                          onValueChange={(value) => {
                            const current = field.value || [];
                            if (!current.includes(value)) {
                              field.onChange([...current, value]);
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select providers" />
                          </SelectTrigger>
                          <SelectContent>
                            {providers.map(provider => (
                              <SelectItem key={provider.provider_id} value={provider.provider_id}>
                                {provider.provider_name} ({provider.provider_code})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    
                    {/* Selected providers */}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(form.watch('linked_providers') || []).map(providerId => {
                        const provider = providers.find(p => p.provider_id === providerId);
                        return provider ? (
                          <Badge key={providerId} variant="secondary" className="flex items-center gap-1">
                            {provider.provider_name}
                            <X 
                              className="h-3 w-3 cursor-pointer" 
                              onClick={() => {
                                const current = form.getValues('linked_providers') || [];
                                form.setValue('linked_providers', current.filter(id => id !== providerId));
                              }}
                            />
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Controller
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <Switch
                          checked={field.value === 'Active'}
                          onCheckedChange={(checked) => field.onChange(checked ? 'Active' : 'Inactive')}
                        />
                      )}
                    />
                    <Label>Active Status</Label>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Add LOB</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search LOBs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Content */}
        {viewMode === 'table' ? (
          /* Table View */
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Icon</TableHead>
                  <TableHead>LOB Code</TableHead>
                  <TableHead>LOB Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Linked Providers</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedLOBs.map((lob) => (
                  <TableRow key={lob.lob_id} className="cursor-pointer" onClick={() => handleEdit(lob)}>
                    <TableCell>
                      <LOBIcon 
                        iconPath={lob.icon_file_path} 
                        lobName={lob.lob_name} 
                        size="md" 
                      />
                    </TableCell>
                    <TableCell className="font-medium">{lob.lob_code}</TableCell>
                    <TableCell>{lob.lob_name}</TableCell>
                    <TableCell className="max-w-xs truncate">{lob.description}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {lob.linked_providers?.slice(0, 3).map(provider => (
                          <Badge key={provider.provider_id} variant="outline" className="text-xs">
                            {provider.provider_code}
                          </Badge>
                        ))}
                        {(lob.linked_providers?.length || 0) > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{(lob.linked_providers?.length || 0) - 3} more
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Badge variant={lob.status === 'Active' ? 'default' : 'secondary'}>
                          {lob.status}
                        </Badge>
                        <Switch
                          checked={lob.status === 'Active'}
                          onCheckedChange={() => handleStatusToggle(lob)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(lob);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingLOB(lob);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredLOBs.length)} of {filteredLOBs.length} LOBs
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
        ) : (
          /* Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {paginatedLOBs.map((lob) => (
              <Card key={lob.lob_id} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleEdit(lob)}>
                <CardHeader className="text-center pb-2">
                  <div className="flex justify-center mb-2">
                    <LOBIcon 
                      iconPath={lob.icon_file_path} 
                      lobName={lob.lob_name} 
                      size="lg" 
                    />
                  </div>
                  <CardTitle className="text-lg">{lob.lob_name}</CardTitle>
                  <Badge variant={lob.status === 'Active' ? 'default' : 'secondary'} className="w-fit mx-auto">
                    {lob.status}
                  </Badge>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground mb-2 text-center">{lob.lob_code}</p>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{lob.description}</p>
                  <div className="text-center">
                    <Badge variant="outline" className="text-xs">
                      {lob.linked_providers?.length || 0} Providers
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) {
            // Reset form when closing
            setEditingLOB(null);
            setSelectedImage(null);
            setImagePreview("");
            form.reset();
            const fileInputs = document.querySelectorAll('input[type="file"]');
            fileInputs.forEach((input: any) => {
              input.value = '';
            });
          }
        }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Line of Business</DialogTitle>
            </DialogHeader>
            
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_lob_code">LOB Code *</Label>
                  <Input
                    id="edit_lob_code"
                    {...form.register('lob_code')}
                    placeholder="e.g., MOTOR"
                  />
                  {form.formState.errors.lob_code && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.lob_code.message}
                    </p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="edit_lob_name">LOB Name *</Label>
                  <Input
                    id="edit_lob_name"
                    {...form.register('lob_name')}
                    placeholder="e.g., Motor Insurance"
                  />
                  {form.formState.errors.lob_name && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.lob_name.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="edit_description">Description</Label>
                <Textarea
                  id="edit_description"
                  {...form.register('description')}
                  placeholder="Description of the line of business"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="edit_icon">Icon</Label>
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <Input
                      type="file"
                      id="edit_icon"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Upload JPG, PNG, GIF, or WebP (max 5MB)
                    </p>
                  </div>
                  {imagePreview && (
                    <div className="relative">
                      <img src={imagePreview} alt="Preview" className="w-16 h-16 object-cover rounded border" />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={() => {
                          setSelectedImage(null);
                          if (editingLOB?.icon_file_path) {
                            const { data } = supabase.storage
                              .from('lob_icons')
                              .getPublicUrl(editingLOB.icon_file_path);
                            setImagePreview(data.publicUrl);
                          } else {
                            setImagePreview("");
                          }
                          const fileInput = document.getElementById('edit_icon') as HTMLInputElement;
                          if (fileInput) fileInput.value = '';
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label>Linked Providers</Label>
                <Controller
                  control={form.control}
                  name="linked_providers"
                  render={({ field }) => (
                    <Select
                      onValueChange={(value) => {
                        const current = field.value || [];
                        if (!current.includes(value)) {
                          field.onChange([...current, value]);
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select providers" />
                      </SelectTrigger>
                      <SelectContent>
                        {providers.map(provider => (
                          <SelectItem key={provider.provider_id} value={provider.provider_id}>
                            {provider.provider_name} ({provider.provider_code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                
                {/* Selected providers */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {(form.watch('linked_providers') || []).map(providerId => {
                    const provider = providers.find(p => p.provider_id === providerId);
                    return provider ? (
                      <Badge key={providerId} variant="secondary" className="flex items-center gap-1">
                        {provider.provider_name}
                        <X 
                          className="h-3 w-3 cursor-pointer" 
                          onClick={() => {
                            const current = form.getValues('linked_providers') || [];
                            form.setValue('linked_providers', current.filter(id => id !== providerId));
                          }}
                        />
                      </Badge>
                    ) : null;
                  })}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Controller
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <Switch
                      checked={field.value === 'Active'}
                      onCheckedChange={(checked) => field.onChange(checked ? 'Active' : 'Inactive')}
                    />
                  )}
                />
                <Label>Active Status</Label>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Update LOB</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-destructive mr-2" />
                Confirm Delete
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <p>Are you sure you want to mark this LOB as inactive?</p>
              
              {deletingLOB && (
                <Alert>
                  <AlertDescription>
                    <strong>{deletingLOB.lob_name}</strong> ({deletingLOB.lob_code})
                    {deletingLOB.linked_providers && deletingLOB.linked_providers.length > 0 && (
                      <><br />This LOB is linked to {deletingLOB.linked_providers.length} provider(s).</>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDelete}>
                  Mark as Inactive
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Error Report Dialog */}
        <Dialog open={isErrorReportOpen} onOpenChange={setIsErrorReportOpen}>
          <DialogContent className="max-w-6xl">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-destructive mr-2" />
                  Bulk Import Error Report
                </div>
                {errorReport.length > 0 && (
                  <Button variant="outline" size="sm" onClick={downloadErrorReport}>
                    <Download className="h-4 w-4 mr-2" />
                    Download Report
                  </Button>
                )}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {bulkImportResults && (
                <Alert>
                  <AlertDescription>
                    <strong>Import Summary:</strong> Total: {bulkImportResults.total}, 
                    Inserted: {bulkImportResults.inserted}, 
                    Updated: {bulkImportResults.updated}, 
                    Errors: {bulkImportResults.errors}
                    <br />
                    <strong>Timestamp:</strong> {new Date(bulkImportResults.timestamp).toLocaleString()}
                  </AlertDescription>
                </Alert>
              )}

              {errorReport.length > 0 ? (
                <div>
                  <h4 className="font-medium mb-2">Error Details ({errorReport.length} errors)</h4>
                  <div className="max-h-96 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Row</TableHead>
                          <TableHead>LOB Code</TableHead>
                          <TableHead>LOB Name</TableHead>
                          <TableHead>Error Type</TableHead>
                          <TableHead>Error Message</TableHead>
                          <TableHead>Data</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {errorReport.map((error, index) => (
                          <TableRow key={index}>
                            <TableCell>{error.row}</TableCell>
                            <TableCell>{error.data.lob_code || 'N/A'}</TableCell>
                            <TableCell>{error.data.lob_name || 'N/A'}</TableCell>
                            <TableCell>
                              <Badge variant={
                                error.type === 'validation' ? 'destructive' : 
                                error.type === 'database' ? 'secondary' : 'outline'
                              }>
                                {error.type}
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-xs">
                              <div className="truncate" title={error.error}>
                                {error.error}
                              </div>
                            </TableCell>
                            <TableCell className="max-w-xs">
                              <div className="truncate text-xs text-muted-foreground" title={JSON.stringify(error.data)}>
                                {JSON.stringify(error.data)}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No errors to display</p>
                </div>
              )}

              <div className="flex justify-end">
                <Button onClick={() => setIsErrorReportOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Show Error Report Button if there are recent errors */}
        {errorReport.length > 0 && !isErrorReportOpen && (
          <div className="fixed bottom-4 right-4 z-50">
            <Button 
              variant="destructive" 
              size="sm"
              onClick={() => setIsErrorReportOpen(true)}
              className="shadow-lg"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              View Error Report ({errorReport.length})
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}