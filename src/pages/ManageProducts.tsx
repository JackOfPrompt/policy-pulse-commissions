import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Plus, Edit, Trash2, Search, Filter, Eye, Download, Upload, TreePine } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ProductWizard } from '@/components/ProductWizard';
import { BulkProductUploadModal } from '@/components/BulkProductUploadModal';
import Header from '@/components/Header';
import { useLOBs } from '@/hooks/useLOBs';
import { useProviders } from '@/hooks/useProviders';

interface ProductName {
  product_id: string;
  product_code: string;
  product_name: string;
  description?: string;
  status: 'Active' | 'Inactive';
  lob_id: string;
  policy_type_id?: string;
  plan_type_id?: string;
  provider_id?: string;
  created_at: string;
  updated_at: string;
  lob_name?: string;
  policy_type_name?: string;
  plan_type_name?: string;
  provider_name?: string;
  plan_types?: PlanTypeWithVariants[];
}

interface PlanTypeWithVariants {
  id?: string;
  name: string;
  description?: string;
  active: boolean;
  variants?: VariantWithCoverages[];
}

interface VariantWithCoverages {
  id?: string;
  name: string;
  code: string;
  active: boolean;
  coverages?: CoverageOption[];
}

interface CoverageOption {
  id?: string;
  sum_insured: number;
  policy_term: number;
  premium_payment_term: number;
  premium_min: number;
  premium_max: number;
}

interface PolicyType {
  id: string;
  policy_type_name: string;
}

interface PlanType {
  plan_type_id: string;
  plan_type_name: string;
}

const ManageProducts: React.FC = () => {
  const [productNames, setProductNames] = useState<ProductName[]>([]);
  const [policyTypes, setPolicyTypes] = useState<PolicyType[]>([]);
  const [planTypes, setPlanTypes] = useState<PlanType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [lobFilter, setLobFilter] = useState('all');
  const [policyTypeFilter, setPolicyTypeFilter] = useState('all');
  const [planTypeFilter, setPlanTypeFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductName | null>(null);
  const { toast } = useToast();
  const { lobs } = useLOBs();
  const { providers } = useProviders();

  useEffect(() => {
    fetchProductNames();
    fetchPolicyTypes();
    fetchPlanTypes();
  }, []);

  const fetchProductNames = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('master_product_name')
        .select(`
          *,
          master_line_of_business(lob_name),
          master_policy_types(policy_type_name),
          master_plan_types(plan_type_name),
          master_insurance_providers(provider_name)
        `)
        .order('product_name');

      if (error) throw error;

      const formattedData = data?.map(item => ({
        ...item,
        status: item.status as 'Active' | 'Inactive',
        lob_name: item.master_line_of_business?.lob_name,
        policy_type_name: item.master_policy_types?.policy_type_name,
        plan_type_name: item.master_plan_types?.plan_type_name,
        provider_name: item.master_insurance_providers?.provider_name,
      })) || [];

      setProductNames(formattedData);
    } catch (error) {
      console.error('Error fetching product names:', error);
      toast({
        title: "Error",
        description: "Failed to fetch product names",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPolicyTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('master_policy_types')
        .select('id, policy_type_name')
        .eq('is_active', true)
        .order('policy_type_name');

      if (error) throw error;
      setPolicyTypes(data || []);
    } catch (error) {
      console.error('Error fetching policy types:', error);
    }
  };

  const fetchPlanTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('master_plan_types')
        .select('plan_type_id, plan_type_name')
        .eq('is_active', true)
        .order('plan_type_name');

      if (error) throw error;
      setPlanTypes(data || []);
    } catch (error) {
      console.error('Error fetching plan types:', error);
    }
  };

  const handleDelete = async (productId: string) => {
    try {
      const { error } = await supabase
        .from('master_product_name')
        .update({ status: 'Inactive' })
        .eq('product_id', productId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Product deactivated successfully",
      });
      fetchProductNames();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: "Error",
        description: "Failed to deactivate product",
        variant: "destructive",
      });
    }
  };

  const filteredProductNames = useMemo(() => {
    return productNames.filter(product => {
      const matchesSearch = product.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.product_code.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || product.status === statusFilter;
      const matchesLOB = lobFilter === 'all' || product.lob_id === lobFilter;
      const matchesPolicyType = policyTypeFilter === 'all' || product.policy_type_id === policyTypeFilter;
      const matchesPlanType = planTypeFilter === 'all' || product.plan_type_id === planTypeFilter;

      return matchesSearch && matchesStatus && matchesLOB && matchesPolicyType && matchesPlanType;
    });
  }, [productNames, searchTerm, statusFilter, lobFilter, policyTypeFilter, planTypeFilter]);

  const handleModalSuccess = () => {
    fetchProductNames();
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const openEditModal = (product: ProductName) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="products" className="w-full">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Products Management</h1>
              <p className="text-muted-foreground mt-2">Manage insurance products and their configurations</p>
            </div>
            <TabsList className="grid w-full lg:w-auto grid-cols-1">
              <TabsTrigger value="products">Products</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="products" className="space-y-6">
            <Card>
              <CardHeader className="pb-4">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1">
                    <Label htmlFor="search" className="sr-only">Search</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        id="search"
                        placeholder="Search by product name or code..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-[140px]">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={lobFilter} onValueChange={setLobFilter}>
                      <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="LOB" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All LOBs</SelectItem>
                        {lobs.map((lob) => (
                          <SelectItem key={lob.lob_id} value={lob.lob_id}>
                            {lob.lob_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={policyTypeFilter} onValueChange={setPolicyTypeFilter}>
                      <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="Policy Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Policy Types</SelectItem>
                        {policyTypes.map((policyType) => (
                          <SelectItem key={policyType.id} value={policyType.id}>
                            {policyType.policy_type_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={planTypeFilter} onValueChange={setPlanTypeFilter}>
                      <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="Plan Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Plan Types</SelectItem>
                        {planTypes.map((planType) => (
                          <SelectItem key={planType.plan_type_id} value={planType.plan_type_id}>
                            {planType.plan_type_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="outline" className="gap-2" onClick={() => setIsBulkUploadOpen(true)}>
                      <Upload className="h-4 w-4" />
                      Bulk Upload
                    </Button>
                    <Button variant="outline" className="gap-2">
                      <Download className="h-4 w-4" />
                      Export
                    </Button>
                    <Button onClick={openCreateModal} className="gap-2">
                      <Plus className="h-4 w-4" />
                      Add Product
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>LOB</TableHead>
                          <TableHead>Provider</TableHead>
                          <TableHead>Product Name</TableHead>
                          <TableHead>Plan Types</TableHead>
                          <TableHead>Variants</TableHead>
                          <TableHead>Coverage Options</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="w-[140px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8">
                            Loading products...
                          </TableCell>
                        </TableRow>
                      ) : filteredProductNames.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                            No products found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredProductNames.map((product) => {
                          const planTypesCount = product.plan_types?.length || 0;
                          const variantsCount = product.plan_types?.reduce((acc, pt) => acc + (pt.variants?.length || 0), 0) || 0;
                          const coverageCount = product.plan_types?.reduce((acc, pt) => 
                            acc + (pt.variants?.reduce((vacc, v) => vacc + (v.coverages?.length || 0), 0) || 0), 0) || 0;
                          
                          return (
                            <TableRow key={product.product_id}>
                              <TableCell>
                                <Badge variant="outline" className="text-xs">
                                  {product.lob_name}
                                </Badge>
                              </TableCell>
                              <TableCell>{product.provider_name || 'Direct'}</TableCell>
                              <TableCell>
                                <div>
                                  <span className="font-medium">{product.product_name}</span>
                                  <div className="text-xs text-muted-foreground">{product.product_code}</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <TreePine className="h-3 w-3 text-primary" />
                                  <span className="text-sm">{planTypesCount}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className="text-sm">{variantsCount}</span>
                              </TableCell>
                              <TableCell>
                                <span className="text-sm">{coverageCount}</span>
                              </TableCell>
                              <TableCell>
                                <Badge variant={product.status === 'Active' ? 'default' : 'secondary'}>
                                  {product.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    title="View Details"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openEditModal(product)}
                                    title="Edit Product"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="ghost" size="sm" title="Delete Product">
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Are you sure you want to deactivate "{product.product_name}"? This action will set its status to Inactive.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => handleDelete(product.product_id)}
                                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        >
                                          Deactivate
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <ProductWizard
          isOpen={isModalOpen}
          onOpenChange={setIsModalOpen}
          product={editingProduct}
          onSuccess={handleModalSuccess}
          lobs={lobs}
          providers={providers}
        />

        <BulkProductUploadModal
          isOpen={isBulkUploadOpen}
          onOpenChange={setIsBulkUploadOpen}
          onSuccess={handleModalSuccess}
        />
      </main>
    </div>
  );
};

export default ManageProducts;