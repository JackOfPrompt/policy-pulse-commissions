import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Edit, Download, FileText, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ProductForm } from "@/components/admin/ProductForm";

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
  description: string;
  api_mapping_key: string;
  features: string[];
  brochure_file_path: string;
  eligibility_criteria: string;
  provider_id: string;
  insurance_providers: {
    provider_name: string;
  };
  created_at: string;
  updated_at: string;
}

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditForm, setShowEditForm] = useState(false);

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id]);

  const fetchProduct = async () => {
    try {
      const { data, error } = await supabase
        .from('insurance_products')
        .select(`
          *,
          insurance_providers (
            provider_name
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setProduct(data as Product);
    } catch (error: any) {
      console.error('Error fetching product:', error);
      toast({
        title: "Error",
        description: "Failed to fetch product details",
        variant: "destructive"
      });
      navigate('/admin/products');
    } finally {
      setLoading(false);
    }
  };

  const downloadBrochure = async () => {
    if (!product?.brochure_file_path) return;
    
    try {
      const { data, error } = await supabase.storage
        .from('product-brochures')
        .download(product.brochure_file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${product.name}-brochure.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Error downloading brochure:', error);
      toast({
        title: "Error",
        description: "Failed to download brochure",
        variant: "destructive"
      });
    }
  };

  const handleDiscontinue = async () => {
    if (!product) return;

    try {
      const { error } = await supabase
        .from('insurance_products')
        .update({ status: 'Discontinued' })
        .eq('id', product.id);

      if (error) throw error;

      setProduct({ ...product, status: 'Discontinued' });
      toast({
        title: "Success",
        description: "Product has been discontinued"
      });
    } catch (error: any) {
      console.error('Error discontinuing product:', error);
      toast({
        title: "Error",
        description: "Failed to discontinue product",
        variant: "destructive"
      });
    }
  };

  const handleFormSuccess = () => {
    setShowEditForm(false);
    fetchProduct();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-8 text-muted-foreground">
          Loading product details...
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-6">
        <div className="text-center py-8 text-muted-foreground">
          Product not found
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/admin">Admin Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/admin/products">Insurance Products</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{product.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/admin/products')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Products
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              {product.name}
              <Badge variant={product.status === 'Active' ? 'default' : 'secondary'}>
                {product.status}
              </Badge>
            </h1>
            <p className="text-muted-foreground mt-1">
              {product.insurance_providers?.provider_name} • Code: {product.code}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowEditForm(true)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          {product.status === 'Active' && (
            <Button
              variant="destructive"
              onClick={handleDiscontinue}
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Discontinue Product
            </Button>
          )}
        </div>
      </div>

      {/* Product Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Product Name</label>
              <p className="text-lg font-semibold">{product.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Provider</label>
              <p>{product.insurance_providers?.provider_name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Product Code</label>
              <p>{product.code}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Category</label>
              <div className="mt-1">
                <Badge variant="outline">{product.category}</Badge>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Coverage Type</label>
              <p>{product.coverage_type}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Premium Type</label>
              <p>{product.premium_type}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Coverage Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Minimum Sum Insured</label>
              <p className="text-lg font-semibold text-green-600">
                {formatCurrency(product.min_sum_insured)}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Maximum Sum Insured</label>
              <p className="text-lg font-semibold text-green-600">
                {formatCurrency(product.max_sum_insured)}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">API Mapping Key</label>
              <p>{product.api_mapping_key || 'N/A'}</p>
            </div>
          </CardContent>
        </Card>

        {product.description && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-line">{product.description}</p>
            </CardContent>
          </Card>
        )}

        {product.features && product.features.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Features</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {product.features.map((feature, index) => (
                  <Badge key={index} variant="secondary">
                    {feature}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {product.eligibility_criteria && (
          <Card>
            <CardHeader>
              <CardTitle>Eligibility Criteria</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-line">{product.eligibility_criteria}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Brochure */}
      {product.brochure_file_path && (
        <Card>
          <CardHeader>
            <CardTitle>Product Brochure</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-red-500" />
                <div>
                  <p className="font-medium">Product Brochure</p>
                  <p className="text-sm text-muted-foreground">PDF Document</p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={downloadBrochure}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Future Commission Plan Button */}
      <Card>
        <CardHeader>
          <CardTitle>Commission Management</CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="outline" disabled>
            Assign Commission Plan
            <span className="ml-2 text-xs text-muted-foreground">(Coming Soon)</span>
          </Button>
        </CardContent>
      </Card>

      {/* Edit Form Dialog */}
      <Dialog open={showEditForm} onOpenChange={setShowEditForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          <ProductForm
            product={product}
            onSuccess={handleFormSuccess}
            onCancel={() => setShowEditForm(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductDetail;