import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Search, Edit, Eye, Trash2, Filter, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { ProviderForm } from "@/components/admin/ProviderForm";
import BulkUpdateModal from "@/components/admin/BulkUpdateModal";
import { getProviderUpdateTemplateColumns, getProviderUpdateSampleData, validateProviderUpdateRow, processProviderUpdateRow, downloadProviderUpdateTemplate } from "@/utils/providerBulkUpdate";
import { format } from "date-fns";

interface Provider {
  id: string;
  provider_name: string;
  irdai_code: string;
  status: 'Active' | 'Inactive';
  contact_person: string;
  contact_email: string;
  support_email: string;
  phone_number: string;
  website: string;
  head_office_address: string;
  logo_url: string;
  logo_file_path: string;
  contract_start_date: string;
  contract_end_date: string;
  created_at: string;
}

const InsuranceProviders = () => {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [filteredProviders, setFilteredProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);
  const [showBulkUpdate, setShowBulkUpdate] = useState(false);
  const [importing, setImporting] = useState(false);
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProviders();
  }, []);

  useEffect(() => {
    filterProviders();
  }, [providers, searchTerm, typeFilter, statusFilter]);

  const fetchProviders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('insurance_providers')
        .select('id:provider_id, provider_name:insurer_name, irdai_code:irdai_registration_number, status, contact_person, contact_email, support_email, phone_number, website, head_office_address:head_office_location, logo_file_path:logo_url, contract_start_date, contract_end_date, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProviders((data as Provider[]) || []);
    } catch (error: any) {
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

  const dedupeProviders = async () => {
    try {
      setImporting(true);
      const { data, error } = await supabase
        .from('insurance_providers')
        .select('provider_id, insurer_name, irdai_registration_number, contact_person, contact_email, support_email, head_office_location, phone_number, website, contract_start_date, contract_end_date, status, lob_types, created_at');
      if (error) throw error;
      const items = (data as any[]) || [];
      const key = (n?: string, c?: string) => (c && c.trim()) ? c.trim().toUpperCase() : (n || '').trim().toUpperCase();
      const groups = new Map<string, any[]>();
      for (const p of items) {
        const k = key(p.insurer_name, p.irdai_registration_number);
        if (!k) continue;
        if (!groups.has(k)) groups.set(k, []);
        groups.get(k)!.push(p);
      }
      let mergedCount = 0;
      for (const [, arr] of groups) {
        if (arr.length <= 1) continue;
        arr.sort((a, b) => (a.created_at || '') < (b.created_at || '') ? -1 : 1);
        const primary = arr[0];
        const duplicates = arr.slice(1);
        const mergeFields = ['irdai_registration_number','contact_person','contact_email','support_email','head_office_location','phone_number','website','contract_start_date','contract_end_date','status','lob_types'] as const;
        const updateData: any = {};
        for (const f of mergeFields) {
          const val = (primary as any)[f];
          const empty = val == null || val === '' || (Array.isArray(val) && val.length === 0);
          if (empty) {
            const donor = duplicates.find(d => {
              const v = (d as any)[f];
              return v != null && v !== '' && (!Array.isArray(v) || v.length > 0);
            });
            if (donor) updateData[f] = (donor as any)[f];
          }
        }
        if (Object.keys(updateData).length > 0) {
          const { error: updErr } = await supabase
            .from('insurance_providers')
            .update(updateData)
            .eq('provider_id', primary.provider_id);
          if (updErr) throw updErr;
        }
        const dupIds = duplicates.map(d => d.provider_id);
        if (dupIds.length > 0) {
          try {
            const { error: delErr } = await supabase
              .from('insurance_providers')
              .delete()
              .in('provider_id', dupIds);
            if (delErr) throw delErr;
          } catch (e) {
            await supabase
              .from('insurance_providers')
              .update({ status: 'Inactive' })
              .in('provider_id', dupIds);
          }
          mergedCount += dupIds.length;
        }
      }
      toast({ title: 'Deduplication complete', description: `Merged ${mergedCount} duplicates.` });
      fetchProviders();
    } catch (e: any) {
      console.error('Dedup error:', e);
      toast({ title: 'Error', description: e.message || 'Failed to deduplicate', variant: 'destructive' });
    } finally {
      setImporting(false);
    }
  };

  const filterProviders = () => {
    let filtered = providers;

    if (searchTerm) {
      filtered = filtered.filter(provider =>
        (provider.provider_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (provider.irdai_code || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Removed provider_type filter since field was removed

    if (statusFilter !== "all") {
      filtered = filtered.filter(provider => provider.status === statusFilter);
    }

    setFilteredProviders(filtered);
  };

  const handleEdit = (provider: Provider) => {
    setEditingProvider(provider);
    setShowForm(true);
  };

  const handleView = (providerId: string) => {
    navigate(`/admin/providers/${providerId}`);
  };

  const handleDelete = async (providerId: string, providerName: string) => {
    try {
      const { error } = await supabase
        .from('insurance_providers')
        .delete()
        .eq('provider_id', providerId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${providerName} has been deleted`
      });
      
      fetchProviders();
    } catch (error: any) {
      console.error('Error deleting provider:', error);
      toast({
        title: "Error",
        description: "Failed to delete provider",
        variant: "destructive"
      });
    }
  };

  const importFromUIN = async () => {
    try {
      setImporting(true);
      const { data: uinData, error: uinError } = await supabase
        .from('master_uin_codes' as any)
        .select('insurer_name, line_of_business, is_active');
      if (uinError) throw uinError;

      const active = (uinData as any[] | null) || [];
      const map = new Map<string, Set<string>>();
      active.forEach((row: any) => {
        const name = (row?.insurer_name || '').trim();
        if (!name) return;
        const lob = (row?.line_of_business || '').toString().trim();
        if (!map.has(name)) map.set(name, new Set<string>());
        if (lob) map.get(name)!.add(lob.toUpperCase());
      });

      const { data: existing, error: existError } = await supabase
        .from('insurance_providers')
        .select('insurer_name');
      if (existError) throw existError;
      const existingSet = new Set((existing as any[] || []).map(p => (p.insurer_name || '').toUpperCase()));

      const toInsert = Array.from(map.entries())
        .filter(([name]) => !existingSet.has(name.toUpperCase()))
        .map(([name, lobSet]) => ({
          insurer_name: name,
          status: 'Active',
          lob_types: Array.from(lobSet)
        }));

      if (toInsert.length === 0) {
        toast({ title: 'Up to date', description: 'No new providers found in UIN/IRDAI data.' });
        return;
      }

      const { error: insertError } = await supabase
        .from('insurance_providers')
        .insert(toInsert);
      if (insertError) throw insertError;

      toast({ title: 'Imported', description: `Added ${toInsert.length} providers from UIN/IRDAI.` });
      fetchProviders();
    } catch (error: any) {
      console.error('Import from UIN error:', error);
      toast({ title: 'Error', description: error.message || 'Failed to import providers', variant: 'destructive' });
    } finally {
      setImporting(false);
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingProvider(null);
    fetchProviders();
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingProvider(null);
  };

  const getStatusBadgeVariant = (status: string) => {
    return status === 'Active' ? 'default' : 'secondary';
  };

  const getTypeBadgeColor = (type: string) => {
    const colors = {
      General: 'bg-blue-100 text-blue-800',
      Life: 'bg-green-100 text-green-800',
      Health: 'bg-purple-100 text-purple-800',
      Motor: 'bg-orange-100 text-orange-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div></div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => importFromUIN()} disabled={importing}>
            <Upload className="h-4 w-4 mr-2" />
            {importing ? 'Importing...' : 'Import from UIN/IRDAI'}
          </Button>
          <Button variant="outline" onClick={() => setShowBulkUpdate(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Bulk Update
          </Button>
          <Button variant="outline" onClick={() => dedupeProviders()}>
            <Upload className="h-4 w-4 mr-2" />
            Deduplicate
          </Button>
          <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingProvider(null)}>
                <Plus className="h-4 w-4 mr-2" />
                Add New Provider
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingProvider ? "Edit Provider" : "Add New Provider"}
                </DialogTitle>
              </DialogHeader>
              <ProviderForm
                provider={editingProvider}
                onSuccess={handleFormSuccess}
                onCancel={handleFormCancel}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by name or IRDAI code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              {/* Removed provider type filter since field was removed */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Providers Grid */}
      <Card>
        <CardHeader>
          <CardTitle>
            Providers ({filteredProviders.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading providers...
            </div>
          ) : filteredProviders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No providers found
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-8">
              {filteredProviders.map((provider) => (
                <Card 
                  key={provider.id} 
                  className="cursor-pointer hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 group border-border/50 hover:border-primary/20 bg-gradient-to-br from-card to-card/95 hover:scale-[1.02] rounded-xl overflow-hidden"
                  onClick={() => handleView(provider.id)}
                >
                  <CardContent className="p-0">
                    {/* Header section with gradient background */}
                    <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 p-6 pb-4 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-primary/5 to-primary/10 opacity-50" />
                      <div className="relative">
                        {/* Logo */}
                        <div className="w-20 h-20 mx-auto flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-2xl shadow-md border border-border/20">
                          {provider.logo_file_path ? (
                            <img 
                              src={`https://vnrwnqcoytwdinlxswqe.supabase.co/storage/v1/object/public/provider-documents/${provider.logo_file_path}`}
                              alt={`${provider.provider_name} logo`}
                              className="w-16 h-16 rounded-xl object-contain"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/30 rounded-xl flex items-center justify-center shadow-inner">
                              <span className="text-primary font-bold text-2xl">
                                {(provider.provider_name?.charAt(0) ?? '?').toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Status Badge - floating on top right */}
                        <div className="absolute -top-2 -right-2">
                          <Badge 
                            variant={getStatusBadgeVariant(provider.status)}
                            className="shadow-sm border border-background/20"
                          >
                            {provider.status}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Content section */}
                    <div className="p-6 pt-4 space-y-4">
                      {/* Provider Name */}
                      <div className="text-center">
                        <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors duration-200 line-clamp-2 min-h-[3.5rem] flex items-center justify-center">
                          {provider.provider_name}
                        </h3>
                        <div className="inline-flex items-center justify-center bg-muted/50 rounded-full px-3 py-1 mt-2">
                          <p className="text-xs font-medium text-muted-foreground">
                            IRDAI: {provider.irdai_code}
                          </p>
                        </div>
                      </div>

                      {/* Contact Info Card */}
                      <div className="bg-muted/30 rounded-lg p-3 space-y-2">
                        {provider.contact_person && (
                          <div className="flex items-center justify-center text-sm text-muted-foreground">
                            <span className="font-medium truncate">{provider.contact_person}</span>
                          </div>
                        )}
                        {provider.contact_email && (
                          <div className="text-center">
                            <span className="text-xs text-muted-foreground/80 truncate block">
                              {provider.contact_email}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Website */}
                      {provider.website && (
                        <div className="text-center">
                          <a 
                            href={provider.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center bg-primary/5 hover:bg-primary/10 text-primary hover:text-primary/80 text-sm font-medium px-3 py-1.5 rounded-full transition-all duration-200 border border-primary/20"
                            onClick={(e) => e.stopPropagation()}
                          >
                            🌐 Visit Website
                          </a>
                        </div>
                      )}

                      {/* Contract Expiry */}
                      {provider.contract_end_date && (
                        <div className="text-center">
                          <div className="inline-flex items-center justify-center bg-orange-50 text-orange-600 text-xs font-medium px-2 py-1 rounded-full border border-orange-200">
                            📅 Expires: {format(new Date(provider.contract_end_date), 'MMM yyyy')}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="border-t border-border/50 bg-muted/20 p-4">
                      <div className="flex gap-2 justify-center">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 hover:bg-primary hover:text-primary-foreground transition-all duration-200"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(provider);
                          }}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="flex-1 hover:bg-destructive hover:text-destructive-foreground transition-all duration-200"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Provider</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{provider.provider_name}"? 
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(provider.id, provider.provider_name)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Import replaces bulk upload; no bulk upload modal anymore */}

      {/* Bulk Update Modal */}
      <BulkUpdateModal
        isOpen={showBulkUpdate}
        onClose={() => setShowBulkUpdate(false)}
        entityType="Provider Updates"
        onSuccess={fetchProviders}
        templateColumns={getProviderUpdateTemplateColumns()}
        sampleData={getProviderUpdateSampleData()}
        validateRow={validateProviderUpdateRow}
        processRow={processProviderUpdateRow}
        customDownloadTemplate={downloadProviderUpdateTemplate}
      />
    </div>
  );
};

export default InsuranceProviders;