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
import { Plus, Search, Edit, Eye, Trash2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { ProductForm } from "@/components/admin/ProductForm";
import EnhancedBulkUploadModal from "@/components/admin/EnhancedBulkUploadModal";
import BulkUpdateModal from "@/components/admin/BulkUpdateModal";
import { getProductTemplateColumns, getProductSampleData, validateProductRow, processProductRow } from "@/utils/productBulkUpload";
import { getProductUpdateTemplateColumns, getProductUpdateSampleData, validateProductUpdateRow, processProductUpdateRow } from "@/utils/productBulkUpdate";

interface Product {
  product_id: string;
  product_name: string;
  product_code: string;
  status: string;
  provider_id: string;
  lob_id?: string;
  min_sum_insured: number;
  max_sum_insured: number;
  insurance_providers?: {
    insurer_name: string;
  };
  lines_of_business?: {
    lob_name: string;
  };
  created_at: string;
}

interface Provider {
  provider_id: string;
  insurer_name: string;
}

const InsuranceProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [providerFilter, setProviderFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [showBulkUpdate, setShowBulkUpdate] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
    fetchProviders();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchTerm, providerFilter, categoryFilter, statusFilter]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('insurance_products')
        .select(`
          product_id, product_name, product_code, status, provider_id, lob_id, min_sum_insured, max_sum_insured, created_at,
          insurance_providers (insurer_name),
          lines_of_business (lob_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      const normalized = ((data as any[]) || []).map((d) => ({
        ...d,
        insurance_providers: Array.isArray(d.insurance_providers) ? d.insurance_providers[0] : d.insurance_providers,
        lines_of_business: Array.isArray(d.lines_of_business) ? d.lines_of_business[0] : d.lines_of_business,
      })) as Product[];
      setProducts(normalized);
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
      setProviders((data as any) || []);
    } catch (error) {
      console.error('Error fetching providers:', error);
    }
  };

  const filterProducts = () => {
    let filtered = products;

    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.product_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.insurance_providers?.insurer_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (providerFilter !== "all") {
      filtered = filtered.filter(product => product.provider_id === providerFilter);
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter(product => (product.lines_of_business?.lob_name || '') === categoryFilter);
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

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingProduct(null);
    fetchProducts();
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingProduct(null);
  };

  const getStatusBadgeVariant = (status: string) => {
    return status === 'Active' ? 'default' : 'secondary';
  };

  const getCategoryBadgeColor = (category: string) => {
    const colors = {
      Health: 'bg-green-100 text-green-800',
      Life: 'bg-blue-100 text-blue-800',
      Motor: 'bg-orange-100 text-orange-800',
      Travel: 'bg-purple-100 text-purple-800',
      Property: 'bg-yellow-100 text-yellow-800',
      'Personal Accident': 'bg-red-100 text-red-800'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div></div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowBulkUpload(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Bulk Upload
          </Button>
          <Button variant="outline" onClick={() => setShowBulkUpdate(true)}>
            <Upload className="h-4 w-4 mr-2" />
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
              <ProductForm
                product={editingProduct}
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
          <div className="flex flex-col lg:flex-row gap-4">
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
                    <SelectItem key={provider.provider_id} value={provider.provider_id}>
                      {provider.insurer_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Health">Health</SelectItem>
                  <SelectItem value="Life">Life</SelectItem>
                  <SelectItem value="Motor">Motor</SelectItem>
                  <SelectItem value="Travel">Travel</SelectItem>
                  <SelectItem value="Property">Property</SelectItem>
                  <SelectItem value="Personal Accident">Personal Accident</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Discontinued">Discontinued</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Products ({filteredProducts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
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
                  <TableHead>Provider</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Min Sum Insured</TableHead>
                  <TableHead>Max Sum Insured</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.product_id}>
                    <TableCell className="font-medium">
                      <div>
                        <div>{product.product_name}</div>
                        <div className="text-sm text-muted-foreground">
                          Code: {product.product_code}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {product.insurance_providers?.insurer_name || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={getCategoryBadgeColor(product.lines_of_business?.lob_name || 'N/A')}
                      >
                        {product.lines_of_business?.lob_name || 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {formatCurrency(product.min_sum_insured)}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(product.max_sum_insured)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(product.status)}>
                        {product.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleView(product.product_id)}
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
                                Are you sure you want to delete "{product.product_name}"? 
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                               <AlertDialogAction
                                  onClick={() => handleDelete(product.product_id, product.product_name)}
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
        </CardContent>
      </Card>

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
      <BulkUpdateModal
        isOpen={showBulkUpdate}
        onClose={() => setShowBulkUpdate(false)}
        entityType="Product Updates"
        onSuccess={fetchProducts}
        templateColumns={getProductUpdateTemplateColumns()}
        sampleData={getProductUpdateSampleData()}
        validateRow={validateProductUpdateRow}
        processRow={processProductUpdateRow}
      />
    </div>
  );
};

export default InsuranceProducts;