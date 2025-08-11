import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Search, Edit, Eye, Trash2, Upload, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { SimpleProductForm } from "@/components/admin/SimpleProductForm";
import EnhancedBulkUploadModal from "@/components/admin/EnhancedBulkUploadModal";
import { getProductTemplateColumns, getProductSampleData, validateProductRow, processProductRow } from "@/utils/productBulkUpload";
import { getProductUpdateTemplateColumns, getProductUpdateSampleData, validateProductUpdateRow, processProductUpdateRow } from "@/utils/productBulkUpdate";

interface Product {
  id: string;
  name: string;
  code: string;
  category: string;
  coverage_type: string;
  min_sum_insured: number;
  max_sum_insured: number;
  premium_type: string;
  status: string;
  provider_id: string;
  line_of_business_id: string;
  uin?: string;
  description?: string;
  api_mapping_key?: string;
  eligibility_criteria?: string;
  features?: string[];
  logo_file_path?: string;
  brochure_file_path?: string;
  product_type?: string;
  min_entry_age?: number;
  max_entry_age?: number;
  insurance_providers: {
    provider_name: string;
    logo_url?: string | null;
  };
  line_of_business: {
    name: string;
  };
  created_at: string;
}

interface Provider {
  id: string;
  provider_name: string;
}

interface LineOfBusiness {
  id: string;
  name: string;
}

const ProductsTab = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [lineOfBusiness, setLineOfBusiness] = useState<LineOfBusiness[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [providerFilter, setProviderFilter] = useState<string>("all");
  const [lobFilter, setLobFilter] = useState<string>("all");
  const [productTypeFilter, setProductTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [availableLOBsForFilter, setAvailableLOBsForFilter] = useState<LineOfBusiness[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [showBulkUpdate, setShowBulkUpdate] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
    fetchProviders();
    fetchLineOfBusiness();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchTerm, providerFilter, lobFilter, productTypeFilter, statusFilter]);

  useEffect(() => {
    if (providerFilter !== "all") {
      fetchProviderLOBs(providerFilter);
      setLobFilter("all"); // Reset LOB filter when provider changes
    } else {
      setAvailableLOBsForFilter(lineOfBusiness);
    }
  }, [providerFilter, lineOfBusiness]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('insurance_products')
        .select(`
          product_id,
          product_name,
          product_code,
          uin_code,
          product_type,
          status,
          effective_from,
          effective_to,
          provider_id,
          lob_id,
          created_at,
          insurance_providers:provider_id (
            insurer_name,
            logo_url,
            provider_id
          ),
          lines_of_business:lob_id (
            lob_name,
            lob_id
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const baseRows = (data as any[]) || [];

      const baseProducts: Product[] = baseRows.map((row: any) => ({
        id: row.product_id,
        name: row.product_name,
        code: row.product_code,
        category: row.product_type || '',
        coverage_type: '',
        min_sum_insured: 0,
        max_sum_insured: 0,
        premium_type: '',
        status: row.status,
        provider_id: row.provider_id,
        line_of_business_id: row.lob_id,
        uin: row.uin_code || undefined,
        description: undefined,
        api_mapping_key: undefined,
        eligibility_criteria: undefined,
        features: undefined,
        logo_file_path: undefined,
        brochure_file_path: undefined,
        product_type: row.product_type || undefined,
        min_entry_age: undefined,
        max_entry_age: undefined,
        insurance_providers: {
          provider_name: row.insurance_providers?.insurer_name || '',
          logo_url: row.insurance_providers?.logo_url || null
        },
        line_of_business: {
          name: row.lines_of_business?.lob_name || ''
        },
        created_at: row.created_at
      }));

      // Enrich missing UIN codes from master UIN/IRDAI codes table
      const enriched = await Promise.all(
        baseProducts.map(async (p) => {
          if (p.uin) return p;
          const providerName = p.insurance_providers?.provider_name;
          const lobName = p.line_of_business?.name;
          if (!providerName || !lobName) return p;

          try {
            const { data: uinRow } = await supabase
              .from('master_uin_codes')
              .select('uin_code')
              .ilike('product_name', p.name)
              .ilike('insurer_name', providerName)
              .ilike('line_of_business', lobName)
              .maybeSingle();

            if (uinRow?.uin_code) {
              return { ...p, uin: uinRow.uin_code } as Product;
            }
          } catch (e) {
            // Non-blocking: skip if lookup fails
          }
          return p;
        })
      );

      setProducts(enriched);
    } catch (error: any) {
      console.error('Error fetching products:', error);
      toast({
        title: "Error",
        description: "Failed to fetch insurance products",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const fetchProviders = async () => {
    try {
      const { data, error } = await supabase
        .from('insurance_providers')
        .select('provider_id, insurer_name')
        .eq('status', 'Active')
        .order('insurer_name');
      
      if (error) throw error;
      const mapped = (data as any[] | null)?.map((p) => ({ id: p.provider_id, provider_name: p.insurer_name })) || [];
      setProviders(mapped);
    } catch (error) {
      console.error('Error fetching providers:', error);
    }
  };

  const fetchLineOfBusiness = async () => {
    try {
      const { data, error } = await supabase
        .from('lines_of_business')
        .select('lob_id, lob_name')
        .eq('is_active', true)
        .order('lob_name');
      
      if (error) throw error;
      const mapped = (data as any[] | null)?.map((l) => ({ id: l.lob_id, name: l.lob_name })) || [];
      setLineOfBusiness(mapped);
    } catch (error) {
      console.error('Error fetching line of business:', error);
    }
  };

  const fetchProviderLOBs = async (_providerId: string) => {
    // Fallback: if mapping table is unavailable, show all active LOBs
    setAvailableLOBsForFilter(lineOfBusiness);
  };

  const filterProducts = () => {
    let filtered = products;

    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.insurance_providers?.provider_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (providerFilter !== "all") {
      filtered = filtered.filter(product => product.provider_id === providerFilter);
    }

    if (lobFilter !== "all") {
      filtered = filtered.filter(product => product.line_of_business_id === lobFilter);
    }

    if (productTypeFilter !== "all") {
      filtered = filtered.filter(product => product.product_type === productTypeFilter);
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(product => product.status === statusFilter);
    }

    setFilteredProducts(filtered);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleView = (productId: string) => {
    navigate(`/admin/products/${productId}`);
  };

  const handleDelete = async (productId: string, productName: string) => {
    try {
      const { error } = await supabase
        .from('insurance_products')
        .delete()
        .eq('product_id', productId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${productName} has been deleted`
      });
      
      fetchProducts();
    } catch (error: any) {
      console.error('Error deleting product:', error);
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive"
      });
    }
  };

  const toggleProductStatus = async (productId: string, currentStatus: string, productName: string) => {
    const newStatus = currentStatus === 'Active' ? 'Discontinued' : 'Active';
    
    try {
      const { error } = await supabase
        .from('insurance_products')
        .update({ status: newStatus })
        .eq('product_id', productId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${productName} has been ${newStatus === 'Active' ? 'activated' : 'deactivated'}`
      });
      
      fetchProducts();
    } catch (error: any) {
      console.error('Error updating product status:', error);
      toast({
        title: "Error",
        description: "Failed to update product status",
        variant: "destructive"
      });
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingProduct(null);
    fetchProducts();
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingProduct(null);
  };

  // Utilities
  const getStatusBadgeVariant = (status: string) => (status === 'Active' ? 'default' : 'secondary');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Insurance Products</h1>
          <p className="text-muted-foreground mt-1">Manage insurance products and their details</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowBulkUpload(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Bulk Upload
          </Button>
          <Button variant="outline" onClick={() => setShowBulkUpdate(true)}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Bulk Update
          </Button>
          <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingProduct(null)}>
                <Plus className="h-4 w-4 mr-2" />
                Add New Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingProduct ? "Edit Product" : "Add New Product"}
                </DialogTitle>
              </DialogHeader>
              <SimpleProductForm
                product={editingProduct}
                onSuccess={handleFormSuccess}
                onCancel={handleFormCancel}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4 p-4 bg-muted/50 rounded-lg">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search by product name, code, or provider..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Select value={providerFilter} onValueChange={setProviderFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Providers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Providers</SelectItem>
              {providers.map((provider) => (
                <SelectItem key={provider.id} value={provider.id}>
                  {provider.provider_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={lobFilter} onValueChange={setLobFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All LOBs" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All LOBs</SelectItem>
              {availableLOBsForFilter.map((lob) => (
                <SelectItem key={lob.id} value={lob.id}>
                  {lob.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={productTypeFilter} onValueChange={setProductTypeFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Product Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {Array.from(new Set(products.map(p => p.product_type).filter(Boolean))).map((type) => (
                <SelectItem key={type} value={type!}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {Array.from(new Set(products.map(p => p.status).filter(Boolean))).map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading products...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No products found
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product Name</TableHead>
                <TableHead>Provider Name</TableHead>
                <TableHead>LOB</TableHead>
                <TableHead>Product Type</TableHead>
                <TableHead>UIN Code</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">
                    <div>
                      <div className="font-semibold">{product.name}</div>
                      <div className="text-sm text-muted-foreground">
                        Code: {product.code}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {product.insurance_providers?.logo_url ? (
                        <img
                          src={product.insurance_providers.logo_url.startsWith('http') ? product.insurance_providers.logo_url : `https://vnrwnqcoytwdinlxswqe.supabase.co/storage/v1/object/public/provider-documents/${product.insurance_providers.logo_url}`}
                          alt={`${product.insurance_providers?.provider_name || 'Provider'} logo`}
                          className="h-5 w-5 rounded object-contain"
                          loading="lazy"
                          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                        />
                      ) : null}
                      <span className="font-medium">{product.insurance_providers?.provider_name || 'N/A'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-medium">
                      {product.line_of_business?.name || 'N/A'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {product.product_type ? (
                      <Badge variant="secondary">{product.product_type}</Badge>
                    ) : (
                      <span className="text-muted-foreground">Not specified</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="font-mono text-sm">
                      {product.uin || 'N/A'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant={getStatusBadgeVariant(product.status)}>
                        {product.status}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleProductStatus(product.id, product.status, product.name)}
                        className="h-6 px-2"
                      >
                        {product.status === 'Active' ? 'Deactivate' : 'Activate'}
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleView(product.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(product)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Product</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{product.name}"? 
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(product.id, product.name)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Enhanced Bulk Upload Modal */}
      <EnhancedBulkUploadModal
        isOpen={showBulkUpload}
        onClose={() => setShowBulkUpload(false)}
        entityType="Insurance Product"
        onSuccess={fetchProducts}
        templateColumns={getProductTemplateColumns()}
        sampleData={getProductSampleData()}
        validateRow={validateProductRow}
        processRow={processProductRow}
      />

      {/* Bulk Update Modal */}
      <EnhancedBulkUploadModal
        isOpen={showBulkUpdate}
        onClose={() => setShowBulkUpdate(false)}
        entityType="Product Update"
        onSuccess={fetchProducts}
        templateColumns={getProductUpdateTemplateColumns()}
        sampleData={getProductUpdateSampleData()}
        validateRow={validateProductUpdateRow}
        processRow={processProductUpdateRow}
      />
    </div>
  );
};

export default ProductsTab;