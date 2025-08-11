import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useCurrentTenant } from '@/hooks/useCurrentTenant';
import { useToast } from '@/hooks/use-toast';

const Catalog = () => {
  const { tenantId, loading: tenantLoading, error } = useCurrentTenant();
  const { toast } = useToast();

  // Title handled by Helmet

  const { data: providers } = useQuery({
    queryKey: ['tenant_providers_resolved', tenantId],
    enabled: true,
    queryFn: async () => {
      try {
        const base = supabase.from('tenant_providers_resolved' as any).select('*');
        const { data, error } = tenantId ? await base.eq('tenant_id', tenantId) : await base;
        if (error) throw error;
        return data ?? [];
      } catch (err: any) {
        const { data, error } = await supabase
          .from('insurance_providers' as any)
          .select('provider_id,insurer_name,status');
        if (error) throw error;
        return (data ?? []).map((p: any) => ({
          provider_name: p.insurer_name,
          status: p.status,
          tenant_id: null,
          provider_id: p.provider_id,
        }));
      }
    },
  });

  const { data: products } = useQuery({
    queryKey: ['tenant_products_resolved', tenantId],
    enabled: true,
    queryFn: async () => {
      try {
        const base = supabase.from('tenant_products_resolved' as any).select('*');
        const { data, error } = tenantId ? await base.eq('tenant_id', tenantId) : await base;
        if (error) throw error;
        return data ?? [];
      } catch (err: any) {
        const { data, error } = await supabase
          .from('insurance_products' as any)
          .select('product_id,product_name,product_code,product_type,status');
        if (error) throw error;
        return (data ?? []).map((r: any) => ({
          product_id: r.product_id,
          tenant_id: null,
          name: r.product_name,
          code: r.product_code,
          category: r.product_type,
          status: r.status,
          premium_markup_rate: null,
          premium_flat_add: null,
        }));
      }
    },
  });

  useEffect(() => {
    if (error) {
      toast({ title: 'Tenant not found', description: error, variant: 'destructive' });
    }
  }, [error, toast]);

  return (
    <main className="p-6 space-y-8">
      <Helmet>
        <title>Tenant Catalog | Products & Providers</title>
        <meta name="description" content="Browse providers and products available for your tenant." />
        <link rel="canonical" href="/tenant/catalog" />
      </Helmet>
      <section>
        <header className="mb-4">
          <h1 className="text-2xl font-semibold">Tenant Catalog</h1>
          <p className="text-muted-foreground">Providers and products available to your tenant.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Providers</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(providers ?? []).map((p: any) => (
                    <TableRow key={`${p.tenant_id}-${p.provider_id}`}>
                      <TableCell className="font-medium">{p.provider_name}</TableCell>
                      <TableCell>
                        <Badge variant={p.status === 'Active' ? 'default' : 'secondary'}>{p.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!providers || providers.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center text-muted-foreground">No providers</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Products</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Override</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(products ?? []).map((r: any) => (
                    <TableRow key={`${r.tenant_id}-${r.product_id}`}>
                      <TableCell className="font-medium">{r.name}</TableCell>
                      <TableCell>{r.code}</TableCell>
                      <TableCell>{r.category}</TableCell>
                      <TableCell>
                        <Badge variant={r.status === 'Active' ? 'default' : 'secondary'}>{r.status}</Badge>
                      </TableCell>
                      <TableCell>
                        {r.premium_markup_rate != null || r.premium_flat_add != null ? (
                          <Badge>Overridden</Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!products || products.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">No products</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
};

export default Catalog;
