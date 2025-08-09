import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface Tenant {
  tenant_id: string;
  tenant_name: string;
  contact_person?: string;
  contact_email?: string;
  phone_number?: string;
  status?: string;
  created_at?: string;
  industry_type?: string;
  logo_url?: string;
}

interface SubscriptionPlan {
  plan_id: string;
  plan_name: string;
  monthly_price?: number;
  annual_price?: number;
  features?: any; // JSON/text
  max_users?: number;
  max_agents?: number;
  api_access?: boolean;
  reporting_tools?: boolean;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

interface TenantSubscription {
  subscription_id: string;
  tenant_id: string;
  plan_id: string;
  start_date?: string;
  end_date?: string | null;
  billing_cycle?: string; // monthly | annual
  payment_status?: string; // paid | pending | overdue
  last_payment_date?: string | null;
  auto_renew?: boolean;
  tenant?: { tenant_name: string };
  plan?: { plan_name: string };
}

interface FeatureFlag {
  feature_id: string;
  feature_key: string;
  feature_name: string;
  description?: string;
  module_name?: string;
  is_globally_enabled?: boolean;
  default_value?: boolean;
  requires_plan?: string | null;
  status?: string;
}

interface TenantFeature {
  tenant_feature_id: string;
  tenant_id: string;
  feature_id: string;
  is_enabled: boolean;
  override_reason?: string | null;
  updated_at?: string;
  updated_by?: string | null;
}

function useCSV() {
  const toCSV = (rows: any[]) => {
    if (!rows?.length) return '';
    const headers = Object.keys(rows[0]);
    const escape = (val: any) => {
      const s = val == null ? '' : String(val);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csv = [headers.join(',')]
      .concat(rows.map(r => headers.map(h => escape(r[h])).join(',')))
      .join('\n');
    return csv;
  };
  const download = (filename: string, csv: string) => {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  return { toCSV, download };
}

export default function TenantManagement() {
  useEffect(() => {
    document.title = 'Tenant & Subscription Management | Admin';
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', 'Admin: manage tenants, subscription plans, subscriptions, and feature flags.');
  }, []);

  return (
    <main className="p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Tenant & Subscription Management</h1>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Control Panel</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="tenants">
            <TabsList className="mb-4">
              <TabsTrigger value="tenants">Tenants</TabsTrigger>
              <TabsTrigger value="plans">Plans</TabsTrigger>
              <TabsTrigger value="subscriptions">Tenant Subscriptions</TabsTrigger>
              <TabsTrigger value="features">Tenant Features</TabsTrigger>
            </TabsList>
            <TabsContent value="tenants">
              <TenantsTab />
            </TabsContent>
            <TabsContent value="plans">
              <PlansTab />
            </TabsContent>
            <TabsContent value="subscriptions">
              <SubscriptionsTab />
            </TabsContent>
            <TabsContent value="features">
              <FeaturesTab />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </main>
  );
}

function TenantsTab() {
  const { toast } = useToast();
  const { toCSV, download } = useCSV();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string | 'All'>('All');
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Tenant | null>(null);
  const [form, setForm] = useState<Partial<Tenant>>({ status: 'Active' });

  const load = async () => {
    try {
      setLoading(true);
      let query = supabase.from('tenants').select('*').order('created_at', { ascending: false });
      const { data, error } = await query;
      if (error) throw error;
      setTenants(data as Tenant[]);
    } catch (e: any) {
      toast({ title: 'Failed to load tenants', description: e.message, variant: 'destructive' as any });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel('tenants-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tenants' }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const filtered = useMemo(() => tenants.filter(t => {
    const s = search.trim().toLowerCase();
    const matches = !s || [t.tenant_name, t.contact_email, t.contact_person].some(v => v?.toLowerCase().includes(s));
    const okStatus = status === 'All' || (t.status || 'Active') === status;
    return matches && okStatus;
  }), [tenants, search, status]);

  const onSubmit = async () => {
    try {
      const payload = { ...form } as any;
      if (editing) {
        const { error } = await supabase.from('tenants').update(payload).eq('tenant_id', editing.tenant_id);
        if (error) throw error;
        toast({ title: 'Tenant updated' });
      } else {
        const { error } = await supabase.from('tenants').insert(payload);
        if (error) throw error;
        toast({ title: 'Tenant created' });
      }
      setOpen(false); setEditing(null); setForm({ status: 'Active' });
      load();
    } catch (e: any) {
      toast({ title: 'Save failed', description: e.message, variant: 'destructive' as any });
    }
  };

  const onDelete = async (tenant: Tenant) => {
    try {
      const { error } = await supabase.from('tenants').delete().eq('tenant_id', tenant.tenant_id);
      if (error) throw error;
      toast({ title: 'Tenant deleted' });
      load();
    } catch (e: any) { toast({ title: 'Delete failed', description: e.message, variant: 'destructive' as any }); }
  };

  const exportCSV = () => {
    const csv = toCSV(filtered);
    download('tenants.csv', csv);
  };

  return (
    <section>
      <div className="flex flex-col md:flex-row gap-3 mb-4 items-end">
        <div className="flex-1">
          <Label>Search</Label>
          <Input placeholder="Search by name or email" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="w-full md:w-48">
          <Label>Status</Label>
          <Select value={status} onValueChange={setStatus as any}>
            <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={exportCSV} variant="outline">Export CSV</Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditing(null); setForm({ status: 'Active' }); }}>New Tenant</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? 'Edit Tenant' : 'Create Tenant'}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Name</Label>
                <Input value={form.tenant_name || ''} onChange={e => setForm(f => ({ ...f, tenant_name: e.target.value }))} />
              </div>
              <div>
                <Label>Contact Person</Label>
                <Input value={form.contact_person || ''} onChange={e => setForm(f => ({ ...f, contact_person: e.target.value }))} />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={form.contact_email || ''} onChange={e => setForm(f => ({ ...f, contact_email: e.target.value }))} />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={form.phone_number || ''} onChange={e => setForm(f => ({ ...f, phone_number: e.target.value }))} />
              </div>
              <div>
                <Label>Industry</Label>
                <Input value={form.industry_type || ''} onChange={e => setForm(f => ({ ...f, industry_type: e.target.value }))} />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={(form.status as any) || 'Active'} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={onSubmit}>{editing ? 'Save' : 'Create'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(t => (
              <TableRow key={t.tenant_id}>
                <TableCell className="font-medium">{t.tenant_name}</TableCell>
                <TableCell>
                  <div className="text-sm">{t.contact_person}</div>
                  <div className="text-xs text-muted-foreground">{t.contact_email} {t.phone_number ? `• ${t.phone_number}` : ''}</div>
                </TableCell>
                <TableCell>
                  <Badge variant={t.status === 'Inactive' ? 'secondary' : 'default'}>{t.status || 'Active'}</Badge>
                </TableCell>
                <TableCell>{t.created_at ? new Date(t.created_at).toLocaleDateString() : '-'}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button size="sm" variant="outline" onClick={() => { setEditing(t); setForm(t); setOpen(true); }}>Edit</Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="destructive">Delete</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete tenant?</AlertDialogTitle>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onDelete(t)}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
            {!filtered.length && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">{loading ? 'Loading...' : 'No tenants found'}</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}

function PlansTab() {
  const { toast } = useToast();
  const { toCSV, download } = useCSV();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [status, setStatus] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<SubscriptionPlan | null>(null);
  const [form, setForm] = useState<Partial<SubscriptionPlan>>({ is_active: true });

  const load = async () => {
    try {
      const { data, error } = await supabase.from('subscription_plans').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setPlans(data as SubscriptionPlan[]);
    } catch (e: any) {
      toast({ title: 'Failed to load plans', description: e.message, variant: 'destructive' as any });
    }
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel('plans-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subscription_plans' }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const filtered = useMemo(() => plans.filter(p => status === 'All' || (p.is_active ? 'Active' : 'Inactive') === status), [plans, status]);

  const onSubmit = async () => {
    try {
      const payload = { ...form, features: form.features } as any;
      if (editing) {
        const { error } = await supabase.from('subscription_plans').update(payload).eq('plan_id', editing.plan_id);
        if (error) throw error;
        toast({ title: 'Plan updated' });
      } else {
        const { error } = await supabase.from('subscription_plans').insert(payload);
        if (error) throw error;
        toast({ title: 'Plan created' });
      }
      setOpen(false); setEditing(null); setForm({ is_active: true });
      load();
    } catch (e: any) { toast({ title: 'Save failed', description: e.message, variant: 'destructive' as any }); }
  };

  const onDelete = async (plan: SubscriptionPlan) => {
    try {
      const { error } = await supabase.from('subscription_plans').delete().eq('plan_id', plan.plan_id);
      if (error) throw error;
      toast({ title: 'Plan deleted' });
      load();
    } catch (e: any) { toast({ title: 'Delete failed', description: e.message, variant: 'destructive' as any }); }
  };

  const exportCSV = () => { const csv = toCSV(filtered); download('subscription_plans.csv', csv); };

  return (
    <section>
      <div className="flex flex-col md:flex-row gap-3 mb-4 items-end">
        <div className="w-full md:w-48">
          <Label>Status</Label>
          <Select value={status} onValueChange={setStatus as any}>
            <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={exportCSV} variant="outline">Export CSV</Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditing(null); setForm({ is_active: true }); }}>New Plan</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? 'Edit Plan' : 'Create Plan'}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Plan Name</Label>
                <Input value={form.plan_name || ''} onChange={e => setForm(f => ({ ...f, plan_name: e.target.value }))} />
              </div>
              <div>
                <Label>Monthly Price</Label>
                <Input type="number" value={form.monthly_price ?? ''} onChange={e => setForm(f => ({ ...f, monthly_price: Number(e.target.value) }))} />
              </div>
              <div>
                <Label>Annual Price</Label>
                <Input type="number" value={form.annual_price ?? ''} onChange={e => setForm(f => ({ ...f, annual_price: Number(e.target.value) }))} />
              </div>
              <div>
                <Label>Max Users</Label>
                <Input type="number" value={form.max_users ?? ''} onChange={e => setForm(f => ({ ...f, max_users: Number(e.target.value) }))} />
              </div>
              <div>
                <Label>Max Agents</Label>
                <Input type="number" value={form.max_agents ?? ''} onChange={e => setForm(f => ({ ...f, max_agents: Number(e.target.value) }))} />
              </div>
              <div>
                <Label>API Access</Label>
                <Select value={(form.api_access ? 'true' : 'false') as any} onValueChange={v => setForm(f => ({ ...f, api_access: v === 'true' }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Enabled</SelectItem>
                    <SelectItem value="false">Disabled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Reporting Tools</Label>
                <Select value={(form.reporting_tools ? 'true' : 'false') as any} onValueChange={v => setForm(f => ({ ...f, reporting_tools: v === 'true' }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Enabled</SelectItem>
                    <SelectItem value="false">Disabled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Label>Features (JSON)</Label>
                <Input placeholder='{"featureA": true}' value={typeof form.features === 'string' ? form.features : (form.features ? JSON.stringify(form.features) : '')} onChange={e => setForm(f => ({ ...f, features: e.target.value }))} />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={(form.is_active ? 'Active' : 'Inactive') as any} onValueChange={v => setForm(f => ({ ...f, is_active: v === 'Active' }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={onSubmit}>{editing ? 'Save' : 'Create'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Plan</TableHead>
              <TableHead>Pricing</TableHead>
              <TableHead>Limits</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(p => (
              <TableRow key={p.plan_id}>
                <TableCell className="font-medium">{p.plan_name}</TableCell>
                <TableCell>${p.monthly_price ?? 0}/mo • ${p.annual_price ?? 0}/yr</TableCell>
                <TableCell>{p.max_users ?? 0} users • {p.max_agents ?? 0} agents</TableCell>
                <TableCell><Badge variant={p.is_active ? 'default' : 'secondary'}>{p.is_active ? 'Active' : 'Inactive'}</Badge></TableCell>
                <TableCell className="text-right space-x-2">
                  <Button size="sm" variant="outline" onClick={() => { setEditing(p); setForm(p); setOpen(true); }}>Edit</Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="destructive">Delete</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete plan?</AlertDialogTitle>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onDelete(p)}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
            {!filtered.length && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">No plans found</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}

function SubscriptionsTab() {
  const { toast } = useToast();
  const { toCSV, download } = useCSV();
  const [rows, setRows] = useState<TenantSubscription[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tenant_subscriptions')
        .select('*, tenants(tenant_name), subscription_plans(plan_name)')
        .order('start_date', { ascending: false });
      if (error) throw error;
      setRows((data as any[]).map(r => ({ ...r, tenant: r.tenants, plan: r.subscription_plans })) as TenantSubscription[]);
    } catch (e: any) { toast({ title: 'Failed to load subscriptions', description: e.message, variant: 'destructive' as any }); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel('tenant-subs-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tenant_subscriptions' }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const updateStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase.from('tenant_subscriptions').update({ payment_status: status }).eq('subscription_id', id);
      if (error) throw error;
      toast({ title: 'Payment status updated' });
      load();
    } catch (e: any) { toast({ title: 'Update failed', description: e.message, variant: 'destructive' as any }); }
  };

  const exportCSV = () => {
    const flat = rows.map(r => ({
      subscription_id: r.subscription_id,
      tenant: r.tenant?.tenant_name,
      plan: r.plan?.plan_name,
      billing_cycle: r.billing_cycle,
      payment_status: r.payment_status,
      start_date: r.start_date,
      end_date: r.end_date,
      auto_renew: r.auto_renew
    }));
    download('tenant_subscriptions.csv', toCSV(flat));
  };

  return (
    <section>
      <div className="flex items-end gap-3 mb-4">
        <Button onClick={exportCSV} variant="outline">Export CSV</Button>
      </div>
      <div className="overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tenant</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Cycle</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Dates</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(r => (
              <TableRow key={r.subscription_id}>
                <TableCell className="font-medium">{r.tenant?.tenant_name}</TableCell>
                <TableCell>{r.plan?.plan_name}</TableCell>
                <TableCell className="capitalize">{r.billing_cycle || '-'}</TableCell>
                <TableCell><Badge variant={r.payment_status === 'overdue' ? 'secondary' : 'default'}>{r.payment_status || '-'}</Badge></TableCell>
                <TableCell>
                  <div className="text-sm">{r.start_date ? new Date(r.start_date).toLocaleDateString() : '-'}</div>
                  <div className="text-xs text-muted-foreground">to {r.end_date ? new Date(r.end_date).toLocaleDateString() : '-'}</div>
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Select onValueChange={v => updateStatus(r.subscription_id, v)}>
                    <SelectTrigger className="w-36"><SelectValue placeholder={r.payment_status || 'Set status'} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
            {!rows.length && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">{loading ? 'Loading...' : 'No subscriptions'}</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}

function FeaturesTab() {
  const { toast } = useToast();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<string>('');
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [overrides, setOverrides] = useState<Record<string, TenantFeature | undefined>>({});

  const loadTenants = async () => {
    const { data } = await supabase.from('tenants').select('tenant_id, tenant_name').order('tenant_name');
    setTenants((data || []) as Tenant[]);
  };
  const loadFlags = async () => {
    const { data, error } = await supabase.from('feature_flags').select('*').order('module_name');
    if (error) console.error(error);
    setFlags((data || []) as FeatureFlag[]);
  };
  const loadOverrides = async (tenantId: string) => {
    const { data, error } = await supabase.from('tenant_features').select('*').eq('tenant_id', tenantId);
    if (error) console.error(error);
    const map: Record<string, TenantFeature> = {};
    (data || []).forEach((tf: any) => { map[tf.feature_id] = tf; });
    setOverrides(map);
  };

  useEffect(() => {
    loadTenants();
    loadFlags();
  }, []);
  useEffect(() => {
    if (selectedTenant) loadOverrides(selectedTenant);
  }, [selectedTenant]);

  const toggle = async (flag: FeatureFlag, enable: boolean) => {
    try {
      const reason = window.prompt(`Override reason for ${flag.feature_name} (${enable ? 'enable' : 'disable'})`, '');
      const { error } = await supabase.from('tenant_features').upsert({
        tenant_id: selectedTenant,
        feature_id: flag.feature_id,
        is_enabled: enable,
        override_reason: reason || null
      });
      if (error) throw error;
      toast({ title: 'Feature updated' });
      loadOverrides(selectedTenant);
    } catch (e: any) { toast({ title: 'Update failed', description: e.message, variant: 'destructive' as any }); }
  };

  return (
    <section className="space-y-4">
      <div className="max-w-md">
        <Label>Select Tenant</Label>
        <Select value={selectedTenant} onValueChange={setSelectedTenant}>
          <SelectTrigger><SelectValue placeholder="Choose tenant" /></SelectTrigger>
          <SelectContent>
            {tenants.map(t => (
              <SelectItem key={t.tenant_id} value={t.tenant_id}>{t.tenant_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {selectedTenant && (
        <div className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Feature</TableHead>
                <TableHead>Module</TableHead>
                <TableHead>Default</TableHead>
                <TableHead>Current</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {flags.map(f => {
                const ov = overrides[f.feature_id];
                const current = ov?.is_enabled ?? f.default_value ?? false;
                return (
                  <TableRow key={f.feature_id}>
                    <TableCell className="font-medium">{f.feature_name}</TableCell>
                    <TableCell>{f.module_name}</TableCell>
                    <TableCell>{f.default_value ? 'Enabled' : 'Disabled'}</TableCell>
                    <TableCell>{current ? 'Enabled' : 'Disabled'}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => toggle(f, !current)}>{current ? 'Disable' : 'Enable'}</Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {!flags.length && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">No features found</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </section>
  );
}