import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowRight, ArrowLeft, Search, FileText, Download, CheckCircle, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SelectProductProps {
  providerId: string;
  lineOfBusiness: string;
  selectedProduct?: string;
  onSelect: (productId: string, productName: string) => void;
  onNext: () => void;
  onPrevious: () => void;
}

interface Product {
  id: string;
  name: string;
  code: string;
  description?: string;
  category: string;
  product_type?: string;
  min_sum_insured: number;
  max_sum_insured: number;
  age_limit?: number;
  features?: string[];
  eligibility_criteria?: string;
  brochure_file_path?: string;
  uin?: string;
  premium_frequency_options?: string[];
  supported_policy_types?: string[];
}

export const SelectProduct: React.FC<SelectProductProps> = ({
  providerId,
  lineOfBusiness,
  selectedProduct,
  onSelect,
  onNext,
  onPrevious,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState('all');

  useEffect(() => {
    fetchProducts();
  }, [providerId, lineOfBusiness]);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('insurance_products')
        .select('*')
        .eq('provider_id', providerId)
        .eq('category', lineOfBusiness)
        .eq('status', 'Active')
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (selectedTab === 'all') return matchesSearch;
    return matchesSearch && product.product_type === selectedTab;
  });

  const productTypes = [...new Set(products.map(p => p.product_type).filter(Boolean))];

  const handleSelect = (productId: string, productName: string) => {
    onSelect(productId, productName);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const canProceed = !!selectedProduct;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse h-10 bg-muted rounded"></div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-muted rounded mb-4"></div>
                <div className="h-4 bg-muted rounded mb-2"></div>
                <div className="h-3 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Select Insurance Product</h3>
        <p className="text-muted-foreground">
          Choose the specific product that meets your requirements
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Product Type Tabs */}
      {productTypes.length > 0 && (
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-auto">
            <TabsTrigger value="all">All Products</TabsTrigger>
            {productTypes.map(type => (
              <TabsTrigger key={type} value={type}>
                {type}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}

      {/* Products Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredProducts.map((product) => {
          const isSelected = selectedProduct === product.id;

          return (
            <Card
              key={product.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                isSelected ? 'ring-2 ring-primary bg-primary/5' : ''
              }`}
              onClick={() => handleSelect(product.id, product.name)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg">{product.name}</CardTitle>
                      {isSelected && <CheckCircle className="w-5 h-5 text-primary" />}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Code: {product.code}
                    </p>
                    {product.uin && (
                      <p className="text-xs text-muted-foreground">
                        UIN: {product.uin}
                      </p>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {product.description && (
                  <p className="text-sm text-muted-foreground mb-3">
                    {product.description}
                  </p>
                )}
                
                <div className="space-y-3">
                  {/* Sum Insured Range */}
                  <div>
                    <p className="text-sm font-medium">Coverage Range</p>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(product.min_sum_insured)} - {formatCurrency(product.max_sum_insured)}
                    </p>
                  </div>

                  {/* Age Limit */}
                  {product.age_limit && (
                    <div>
                      <p className="text-sm font-medium">Age Limit</p>
                      <p className="text-sm text-muted-foreground">
                        Up to {product.age_limit} years
                      </p>
                    </div>
                  )}

                  {/* Premium Frequency */}
                  {product.premium_frequency_options && product.premium_frequency_options.length > 0 && (
                    <div>
                      <p className="text-sm font-medium">Payment Options</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {product.premium_frequency_options.map(freq => (
                          <Badge key={freq} variant="outline" className="text-xs">
                            {freq}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Features */}
                  {product.features && product.features.length > 0 && (
                    <div>
                      <p className="text-sm font-medium">Key Features</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {product.features.slice(0, 3).map((feature, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                        {product.features.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{product.features.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex justify-between items-center pt-2 border-t">
                    <div className="flex items-center gap-2">
                      {product.product_type && (
                        <Badge variant="outline">
                          {product.product_type}
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {product.brochure_file_path && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(product.brochure_file_path, '_blank');
                          }}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      )}
                      {product.eligibility_criteria && (
                        <Button
                          variant="ghost"
                          size="sm"
                          title={product.eligibility_criteria}
                        >
                          <Info className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredProducts.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Products Found</h3>
            <p className="text-muted-foreground">
              {searchTerm 
                ? `No products match "${searchTerm}"`
                : 'No products available for this provider and line of business.'
              }
            </p>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={onPrevious}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>
        <Button
          onClick={onNext}
          disabled={!canProceed}
          className="min-w-32"
        >
          Next Step
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};