import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ArrowRight, ArrowLeft, Search, Building, Star, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SelectProviderProps {
  lineOfBusiness: string;
  selectedProvider?: string;
  onSelect: (providerId: string, providerName: string) => void;
  onNext: () => void;
  onPrevious: () => void;
}

interface Provider {
  id: string;
  provider_name: string;
  irdai_code: string;
  status: string;
  logo_url?: string;
  website?: string;
  support_email?: string;
  contact_phone?: string;
  product_count?: number;
}

export const SelectProvider: React.FC<SelectProviderProps> = ({
  lineOfBusiness,
  selectedProvider,
  onSelect,
  onNext,
  onPrevious,
}) => {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchProviders();
  }, [lineOfBusiness]);

  const fetchProviders = async () => {
    try {
      // Get providers that have products for this LOB
      const { data, error } = await supabase
        .from('insurance_providers')
        .select(`
          *,
          insurance_products!inner(id)
        `)
        .eq('status', 'Active')
        .eq('insurance_products.category', lineOfBusiness)
        .order('provider_name');

      if (error) throw error;

      // Count products per provider
      const providersWithCount = await Promise.all(
        (data || []).map(async (provider) => {
          const { count } = await supabase
            .from('insurance_products')
            .select('*', { count: 'exact', head: true })
            .eq('provider_id', provider.id)
            .eq('category', lineOfBusiness)
            .eq('status', 'Active');

          return {
            ...provider,
            product_count: count || 0,
          };
        })
      );

      setProviders(providersWithCount);
    } catch (error) {
      console.error('Error fetching providers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProviders = providers.filter(provider =>
    provider.provider_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    provider.irdai_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (providerId: string, providerName: string) => {
    onSelect(providerId, providerName);
  };

  const canProceed = !!selectedProvider;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse h-10 bg-muted rounded"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-16 bg-muted rounded mb-4"></div>
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
        <h3 className="text-lg font-semibold mb-2">Select Insurance Provider</h3>
        <p className="text-muted-foreground">
          Choose from providers offering {lineOfBusiness} insurance
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Search providers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Providers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredProviders.map((provider) => {
          const isSelected = selectedProvider === provider.id;

          return (
            <Card
              key={provider.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                isSelected ? 'ring-2 ring-primary bg-primary/5' : ''
              }`}
              onClick={() => handleSelect(provider.id, provider.provider_name)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {provider.logo_url ? (
                      <img
                        src={provider.logo_url}
                        alt={provider.provider_name}
                        className="w-12 h-12 object-contain rounded"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                        <Building className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <CardTitle className="text-lg">{provider.provider_name}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        IRDAI: {provider.irdai_code}
                      </p>
                    </div>
                  </div>
                  {isSelected && <CheckCircle className="w-6 h-6 text-primary" />}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {provider.product_count} Products
                    </Badge>
                    <Badge variant="secondary">
                      {provider.status}
                    </Badge>
                  </div>
                  {provider.website && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(provider.website, '_blank');
                      }}
                    >
                      Visit Website
                    </Button>
                  )}
                </div>
                {(provider.support_email || provider.contact_phone) && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-xs text-muted-foreground">
                      {provider.support_email && `Email: ${provider.support_email}`}
                      {provider.support_email && provider.contact_phone && ' • '}
                      {provider.contact_phone && `Phone: ${provider.contact_phone}`}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredProviders.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Building className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Providers Found</h3>
            <p className="text-muted-foreground">
              {searchTerm 
                ? `No providers match "${searchTerm}"`
                : `No providers offer ${lineOfBusiness} insurance products.`
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