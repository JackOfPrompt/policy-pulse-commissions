import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface Product {
  product_name: string;
  product_code: string;
  description?: string;
  lob_id: string;
  provider_id?: string;
  status: 'Active' | 'Inactive';
  plan_types?: PlanType[];
}

interface PlanType {
  id?: string;
  name: string;
  description?: string;
  active: boolean;
  variants?: Variant[];
}

interface Variant {
  id?: string;
  name: string;
  code: string;
  description?: string;
  active: boolean;
  coverages?: Coverage[];
}

interface Coverage {
  id?: string;
  sum_insured: number;
  policy_term: number;
  premium_payment_term: number;
  premium_min: number;
  premium_max: number;
  metadata?: Record<string, any>;
}

interface ReviewStepProps {
  data: Product;
  lobs: Array<{ lob_id: string; lob_name: string }>;
  providers: Array<{ provider_id: string; provider_name: string }>;
}

export const ReviewStep: React.FC<ReviewStepProps> = ({
  data,
  lobs,
  providers,
}) => {
  const getLobName = (lobId: string) => {
    return lobs.find(lob => lob.lob_id === lobId)?.lob_name || 'Unknown LOB';
  };

  const getProviderName = (providerId: string) => {
    return providers.find(provider => provider.provider_id === providerId)?.provider_name || 'No Provider';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getTotalStats = () => {
    const totalPlanTypes = data.plan_types?.length || 0;
    const totalVariants = data.plan_types?.reduce((acc, pt) => acc + (pt.variants?.length || 0), 0) || 0;
    const totalCoverages = data.plan_types?.reduce((acc, pt) => 
      acc + (pt.variants?.reduce((vacc, v) => vacc + (v.coverages?.length || 0), 0) || 0), 0) || 0;

    return { totalPlanTypes, totalVariants, totalCoverages };
  };

  const stats = getTotalStats();

  return (
    <div className="space-y-6">
      {/* Product Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Product Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-lg">{data.product_name}</h4>
              <p className="text-sm text-muted-foreground">{data.product_code}</p>
              {data.description && (
                <p className="text-sm mt-2">{data.description}</p>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Line of Business:</span>
                <span className="text-sm font-medium">{getLobName(data.lob_id)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Provider:</span>
                <span className="text-sm font-medium">{data.provider_id ? getProviderName(data.provider_id) : 'No Provider'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Status:</span>
                <Badge variant={data.status === 'Active' ? 'default' : 'secondary'}>
                  {data.status}
                </Badge>
              </div>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">{stats.totalPlanTypes}</div>
              <div className="text-sm text-muted-foreground">Plan Types</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">{stats.totalVariants}</div>
              <div className="text-sm text-muted-foreground">Variants</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">{stats.totalCoverages}</div>
              <div className="text-sm text-muted-foreground">Coverage Options</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Product Hierarchy Tree */}
      <Card>
        <CardHeader>
          <CardTitle>Product Hierarchy Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-lg font-semibold text-primary">
              {getLobName(data.lob_id)} → {data.provider_id ? getProviderName(data.provider_id) : 'Direct'} → {data.product_name}
            </div>

            {data.plan_types?.map((planType) => (
              <div key={planType.id} className="border-l-4 border-l-primary pl-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Plan Type: {planType.name}</span>
                  <Badge variant={planType.active ? 'default' : 'secondary'}>
                    {planType.active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                {planType.variants?.map((variant) => (
                  <div key={variant.id} className="ml-4 border-l-2 border-l-muted pl-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Variant: {variant.name} ({variant.code})</span>
                      <Badge variant={variant.active ? 'default' : 'secondary'}>
                        {variant.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>

                    {variant.coverages && variant.coverages.length > 0 && (
                      <div className="ml-4 space-y-1">
                        <span className="text-sm font-medium text-muted-foreground">Coverage Options:</span>
                        {variant.coverages.map((coverage) => (
                          <div key={coverage.id} className="text-sm bg-muted p-2 rounded">
                            <span className="font-medium">
                              {formatCurrency(coverage.sum_insured)}
                            </span>
                            <span className="text-muted-foreground">
                              {' '}• PT: {coverage.policy_term}Y • PPT: {coverage.premium_payment_term}Y • Premium: {formatCurrency(coverage.premium_min)}-{formatCurrency(coverage.premium_max)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};