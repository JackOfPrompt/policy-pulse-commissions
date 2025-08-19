import { useState, useEffect } from 'react';
import { 
  Database, 
  Plus, 
  Edit2, 
  Trash2, 
  Search, 
  Filter, 
  Building2,
  Package,
  FileText,
  Heart,
  Shield,
  Eye,
  EyeOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface MDMEntity {
  id: string;
  name: string;
  code?: string;
  description?: string;
  category?: string;
  status?: string;
  is_active?: boolean;
  source: 'system' | 'tenant';
  editable: boolean;
  created_at?: string;
  updated_at?: string;
}

interface EntityConfig {
  type: string;
  displayName: string;
  icon: any;
  fields: string[];
  searchField: string;
  statusField: string;
}

const ENTITY_CONFIGS: EntityConfig[] = [
  {
    type: 'product-categories',
    displayName: 'Product Categories',
    icon: Package,
    fields: ['category_name', 'category_code', 'category_desc'],
    searchField: 'category_name',
    statusField: 'is_active'
  },
  {
    type: 'insurance-providers',
    displayName: 'Insurance Providers',
    icon: Building2,
    fields: ['provider_name', 'provider_code', 'trade_name', 'contact_email', 'contact_phone'],
    searchField: 'provider_name',
    statusField: 'status'
  },
  {
    type: 'policy-types',
    displayName: 'Policy Types',
    icon: FileText,
    fields: ['policy_type_name', 'policy_type_description'],
    searchField: 'policy_type_name',
    statusField: 'is_active'
  },
  {
    type: 'health-conditions',
    displayName: 'Health Conditions',
    icon: Heart,
    fields: ['condition_name', 'category', 'description', 'waiting_period'],
    searchField: 'condition_name',
    statusField: 'is_active'
  }
];

const TenantMDMManager = () => {
  const [selectedEntity, setSelectedEntity] = useState<string>('product-categories');
  const [systemData, setSystemData] = useState<MDMEntity[]>([]);
  const [tenantData, setTenantData] = useState<MDMEntity[]>([]);
  const [filteredSystemData, setFilteredSystemData] = useState<MDMEntity[]>([]);
  const [filteredTenantData, setFilteredTenantData] = useState<MDMEntity[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSource, setFilterSource] = useState<'all' | 'system' | 'tenant'>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MDMEntity | null>(null);
  const [formData, setFormData] = useState<any>({});

  const { profile } = useAuth();
  const { toast } = useToast();

  const currentConfig = ENTITY_CONFIGS.find(config => config.type === selectedEntity);

  useEffect(() => {
    if (selectedEntity) {
      fetchData();
    }
  }, [selectedEntity]);

  useEffect(() => {
    filterData();
  }, [systemData, tenantData, searchTerm, filterSource]);

  const fetchData = async () => {
    if (!profile?.tenant_id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('tenant-mdm-data', {
        body: {
          tenantId: profile.tenant_id,
          entityType: selectedEntity,
          action: 'GET_UNIFIED_DATA'
        }
      });

      if (error) throw error;

      setSystemData(data.systemData || []);
      setTenantData(data.tenantData || []);
    } catch (error) {
      console.error('Error fetching MDM data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch master data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterData = () => {
    const searchLower = searchTerm.toLowerCase();
    const searchField = currentConfig?.searchField || 'name';

    const filterBySearch = (items: MDMEntity[]) => {
      if (!searchTerm) return items;
      return items.filter(item => {
        const searchValue = item[searchField as keyof MDMEntity] as string;
        return searchValue?.toLowerCase().includes(searchLower);
      });
    };

    let systemFiltered = filterBySearch(systemData);
    let tenantFiltered = filterBySearch(tenantData);

    if (filterSource === 'system') {
      tenantFiltered = [];
    } else if (filterSource === 'tenant') {
      systemFiltered = [];
    }

    setFilteredSystemData(systemFiltered);
    setFilteredTenantData(tenantFiltered);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.tenant_id) return;

    try {
      const { data, error } = await supabase.functions.invoke('tenant-mdm-data', {
        body: {
          tenantId: profile.tenant_id,
          entityType: selectedEntity,
          action: 'CREATE_TENANT_DATA',
          data: formData
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Master data created successfully",
      });

      setIsCreateModalOpen(false);
      setFormData({});
      fetchData();
    } catch (error) {
      console.error('Error creating data:', error);
      toast({
        title: "Error",
        description: "Failed to create master data",
        variant: "destructive",
      });
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.tenant_id || !selectedItem) return;

    try {
      const { data, error } = await supabase.functions.invoke('tenant-mdm-data', {
        body: {
          tenantId: profile.tenant_id,
          entityType: selectedEntity,
          action: 'UPDATE_TENANT_DATA',
          data: formData
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Master data updated successfully",
      });

      setIsEditModalOpen(false);
      setSelectedItem(null);
      setFormData({});
      fetchData();
    } catch (error) {
      console.error('Error updating data:', error);
      toast({
        title: "Error",
        description: "Failed to update master data",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (item: MDMEntity) => {
    if (!profile?.tenant_id) return;

    try {
      const { data, error } = await supabase.functions.invoke('tenant-mdm-data', {
        body: {
          tenantId: profile.tenant_id,
          entityType: selectedEntity,
          action: 'DELETE_TENANT_DATA',
          data: { id: item.id }
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Master data deleted successfully",
      });

      fetchData();
    } catch (error) {
      console.error('Error deleting data:', error);
      toast({
        title: "Error",
        description: "Failed to delete master data",
        variant: "destructive",
      });
    }
  };

  const openEditModal = (item: MDMEntity) => {
    setSelectedItem(item);
    setFormData(item);
    setIsEditModalOpen(true);
  };

  const renderFormField = (fieldName: string, isRequired: boolean = true) => {
    const value = formData[fieldName] || '';
    
    if (fieldName === 'category' && selectedEntity === 'health-conditions') {
      return (
        <Select value={value} onValueChange={(val) => setFormData(prev => ({ ...prev, [fieldName]: val }))}>
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Covered">Covered</SelectItem>
            <SelectItem value="Exclusions">Exclusions</SelectItem>
          </SelectContent>
        </Select>
      );
    }

    if (fieldName.includes('description') || fieldName === 'notes') {
      return (
        <Textarea
          value={value}
          onChange={(e) => setFormData(prev => ({ ...prev, [fieldName]: e.target.value }))}
          rows={3}
        />
      );
    }

    return (
      <Input
        type="text"
        value={value}
        onChange={(e) => setFormData(prev => ({ ...prev, [fieldName]: e.target.value }))}
        required={isRequired}
      />
    );
  };

  const renderDataTable = (data: MDMEntity[], title: string, canEdit: boolean = false) => (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              {canEdit ? <Edit2 className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              {title}
            </CardTitle>
            <CardDescription>
              {canEdit ? 'Manage your organization-specific data' : 'View system-wide master data'}
            </CardDescription>
          </div>
          {canEdit && (
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add New
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No data available
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Source</TableHead>
                {canEdit && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    {item[currentConfig?.searchField as keyof MDMEntity] as string}
                  </TableCell>
                  <TableCell>{item.code || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={
                      (item.is_active ?? item.status === 'Active') ? "default" : "secondary"
                    }>
                      {item.is_active !== undefined 
                        ? (item.is_active ? 'Active' : 'Inactive')
                        : (item.status || 'Active')
                      }
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.source === 'system' ? "outline" : "default"}>
                      {item.source === 'system' ? 'System' : 'Tenant'}
                    </Badge>
                  </TableCell>
                  {canEdit && (
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditModal(item)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this item? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(item)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Master Data Management</h2>
          <p className="text-muted-foreground">Manage system and tenant-specific master data</p>
        </div>
      </div>

      {/* Entity Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Master Data Entity</CardTitle>
          <CardDescription>Choose the type of master data to manage</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {ENTITY_CONFIGS.map((config) => {
              const IconComponent = config.icon;
              return (
                <Card
                  key={config.type}
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    selectedEntity === config.type ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedEntity(config.type)}
                >
                  <CardContent className="p-4 text-center">
                    <IconComponent className="w-8 h-8 mx-auto mb-2 text-primary" />
                    <h4 className="font-semibold text-sm">{config.displayName}</h4>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search master data..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterSource} onValueChange={(value: any) => setFilterSource(value)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="system">System Data Only</SelectItem>
                <SelectItem value="tenant">Tenant Data Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Data Display */}
      {loading ? (
        <div className="text-center py-8">
          <Database className="w-12 h-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading master data...</p>
        </div>
      ) : (
        <Tabs defaultValue="unified" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="unified">Unified View</TabsTrigger>
            <TabsTrigger value="system">System Masters</TabsTrigger>
            <TabsTrigger value="tenant">Tenant Masters</TabsTrigger>
          </TabsList>
          
          <TabsContent value="unified" className="space-y-6">
            {(filterSource === 'all' || filterSource === 'system') && 
              renderDataTable(filteredSystemData, 'System Master Data', false)
            }
            {(filterSource === 'all' || filterSource === 'tenant') && 
              renderDataTable(filteredTenantData, 'Tenant Master Data', true)
            }
          </TabsContent>
          
          <TabsContent value="system">
            {renderDataTable(filteredSystemData, 'System Master Data (Read-Only)', false)}
          </TabsContent>
          
          <TabsContent value="tenant">
            {renderDataTable(filteredTenantData, 'Tenant Master Data', true)}
          </TabsContent>
        </Tabs>
      )}

      {/* Create Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New {currentConfig?.displayName}</DialogTitle>
            <DialogDescription>
              Create a new entry for your organization
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            {currentConfig?.fields.map((field) => (
              <div key={field} className="space-y-2">
                <Label htmlFor={field}>
                  {field.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Label>
                {renderFormField(field)}
              </div>
            ))}
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit {currentConfig?.displayName}</DialogTitle>
            <DialogDescription>
              Update the selected entry
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            {currentConfig?.fields.map((field) => (
              <div key={field} className="space-y-2">
                <Label htmlFor={field}>
                  {field.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Label>
                {renderFormField(field)}
              </div>
            ))}
            {currentConfig?.statusField && (
              <div className="space-y-2">
                <Label>Status</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData[currentConfig.statusField]}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, [currentConfig.statusField]: checked }))
                    }
                  />
                  <Label>Active</Label>
                </div>
              </div>
            )}
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Update</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TenantMDMManager;