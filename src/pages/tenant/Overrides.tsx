import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useCurrentTenant } from '@/hooks/useCurrentTenant';
import { PermissionButton } from '@/components/ui/permission-button';

interface OverrideFormState {
  name: string;
  description: string;
  status: string;
  premium_markup_rate: number | '';
  premium_flat_add: number | '';
  effective_from: string;
  effective_to: string;
  brochure_file_path: string;
}

const emptyForm: OverrideFormState = {
  name: '',
  description: '',
  status: '',
  premium_markup_rate: '',
  premium_flat_add: '',
  effective_from: '',
  effective_to: '',
  brochure_file_path: '',
};

const Overrides = () => {
  const { tenantId } = useCurrentTenant();
  const { toast } = useToast();
  const qc = useQueryClient();

  useEffect(() => {
    document.title = 'Tenant Product Overrides';
  }, []);

  const { data: products } = useQuery({
    queryKey: ['tenant_products_resolved', tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tenant_products_resolved')
        .select('*')
        .eq('tenant_id', tenantId!);
      if (error) throw error;
      return data ?? [];
    },
  });

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<any | null>(null);
  const [form, setForm] = useState<OverrideFormState>(emptyForm);

  const loadOverride = async (productId: string) => {
    if (!tenantId) return;
    const { data, error } = await supabase
      .from('tenant_product_overrides')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('product_id', productId)
      .maybeSingle();
    if (error) {
      toast({ title: 'Failed to load override', description: error.message, variant: 'destructive' });
      return;
    }
    if (data) {
      setForm({
        name: data.name ?? '',
        description: data.description ?? '',
        status: data.status ?? '',
        premium_markup_rate: data.premium_markup_rate ?? '',
        premium_flat_add: data.premium_flat_add ?? '',
        effective_from: data.effective_from ?? '',
        effective_to: data.effective_to ?? '',
        brochure_file_path: data.brochure_file_path ?? '',
      });
    } else if (selected) {
      // Prefill from resolved as baseline
      setForm({
        name: selected.name ?? '',
        description: selected.description ?? '',
        status: selected.status ?? '',
        premium_markup_rate: '',
        premium_flat_add: '',
        effective_from: '',
        effective_to: '',
        brochure_file_path: selected.brochure_file_path ?? '',
      });
    }
  };

  const onEdit = async (row: any) => {
    setSelected(row);
    setOpen(true);
    setForm(emptyForm);
    await loadOverride(row.product_id);
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const onSave = async () => {
    if (!tenantId || !selected) return;
    try {
      const payload: any = {
        tenant_id: tenantId,
        product_id: selected.product_id,
        name: form.name || null,
        description: form.description || null,
        status: form.status || null,
        premium_markup_rate: form.premium_markup_rate === '' ? null : Number(form.premium_markup_rate),
        premium_flat_add: form.premium_flat_add === '' ? null : Number(form.premium_flat_add),
        brochure_file_path: form.brochure_file_path || null,
        effective_from: form.effective_from || null,
        effective_to: form.effective_to || null,
      };
      const { error } = await supabase.from('tenant_product_overrides').upsert(payload, { onConflict: 'tenant_id,product_id' });
      if (error) throw error;
      toast({ title: 'Override saved' });
      setOpen(false);
      qc.invalidateQueries({ queryKey: ['tenant_products_resolved', tenantId] });
    } catch (e: any) {
      toast({ title: 'Save failed', description: e.message, variant: 'destructive' });
    }
  };

  const onClear = async () => {
    if (!tenantId || !selected) return;
    try {
      const { error } = await supabase
        .from('tenant_product_overrides')
        .delete()
        .eq('tenant_id', tenantId)
        .eq('product_id', selected.product_id);
      if (error) throw error;
      toast({ title: 'Override removed' });
      setOpen(false);
      qc.invalidateQueries({ queryKey: ['tenant_products_resolved', tenantId] });
    } catch (e: any) {
      toast({ title: 'Remove failed', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <main className="p-6 space-y-8">
      <section>
        <header className="mb-4">
          <h1 className="text-2xl font-semibold">Product Overrides</h1>
          <p className="text-muted-foreground">Tenant Admins can customize catalog fields and pricing adjustments.</p>
        </header>

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
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(products ?? []).map((r: any) => (
                  <TableRow key={`${r.tenant_id}-${r.product_id}`}>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell>{r.code}</TableCell>
                    <TableCell>{r.status}</TableCell>
                    <TableCell className="text-right">
                      <PermissionButton module="products" action="edit" size="sm" onClick={() => onEdit(r)}>
                        Edit Override
                      </PermissionButton>
                    </TableCell>
                  </TableRow>
                ))}
                {(!products || products.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">No products</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Override</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" value={form.name} onChange={onChange} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" value={form.description} onChange={onChange} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Input id="status" name="status" value={form.status} onChange={onChange} placeholder="Active/Inactive" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="premium_markup_rate">Premium Markup %</Label>
                <Input id="premium_markup_rate" name="premium_markup_rate" type="number" step="0.01" value={form.premium_markup_rate as any} onChange={onChange} placeholder="e.g., 0.10 for +10%" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="premium_flat_add">Premium Flat Add</Label>
                <Input id="premium_flat_add" name="premium_flat_add" type="number" step="0.01" value={form.premium_flat_add as any} onChange={onChange} placeholder="e.g., 500" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="effective_from">Effective From</Label>
                <Input id="effective_from" name="effective_from" type="date" value={form.effective_from} onChange={onChange} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="effective_to">Effective To</Label>
                <Input id="effective_to" name="effective_to" type="date" value={form.effective_to} onChange={onChange} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="brochure_file_path">Brochure File Path</Label>
              <Input id="brochure_file_path" name="brochure_file_path" value={form.brochure_file_path} onChange={onChange} placeholder="/path/in/storage" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <PermissionButton module="products" action="edit" variant="destructive" onClick={onClear}>
              Remove Override
            </PermissionButton>
            <PermissionButton module="products" action="edit" onClick={onSave}>
              Save Changes
            </PermissionButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
};

export default Overrides;
