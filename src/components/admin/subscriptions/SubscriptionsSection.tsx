import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Pencil, Trash2, Eye } from "lucide-react";

interface SubscriptionRow {
  subscription_id: string;
  tenant_id: string;
  plan_id: string;
  plan_snapshot: any | null;
  start_date: string;
  end_date: string;
  billing_cycle: "Monthly" | "Yearly";
  payment_status: "Paid" | "Pending" | "Overdue" | "Failed";
  last_payment_date: string | null;
  next_renewal_date: string | null;
  auto_renew: boolean | null;
  trial_used: boolean | null;
  trial_start_date: string | null;
  trial_end_date: string | null;
  current_add_ons: any | null;
  discount_code: string | null;
  payment_method: string | null;
  invoice_reference: string | null;
  is_active: boolean | null;
  cancelled_on: string | null;
  cancellation_reason: string | null;
  created_at: string;
}

interface TenantOpt { tenant_id: string; tenant_name: string; }
interface PlanOpt { plan_id: string; plan_name: string; plan_code: string; monthly_price: number; annual_price: number | null; currency_code: string | null; }

const PER_PAGE = 10;

export default function SubscriptionsSection() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<SubscriptionRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [snapshotOpen, setSnapshotOpen] = useState<{ open: boolean; data: any | null }>({ open: false, data: null });
  const [editing, setEditing] = useState<SubscriptionRow | null>(null);
  const [tenantMap, setTenantMap] = useState<Record<string, TenantOpt>>({});
  const [planMap, setPlanMap] = useState<Record<string, PlanOpt>>({});

  const from = (page - 1) * PER_PAGE;
  const to = page * PER_PAGE - 1;

  const fetchPage = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("tenant_subscriptions")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, to);

      if (search.trim()) {
        const term = `%${search.trim()}%`;
        query = query.or(`invoice_reference.ilike.${term}`);
      }
      if (status !== "all") {
        if (status === "active") query = query.eq("is_active", true);
        if (status === "inactive") query = query.eq("is_active", false);
      }
      const { data, error, count } = await query;
      if (error) throw error;
      const pageRows = (data as any as SubscriptionRow[]) || [];
      setRows(pageRows);
      setTotal(count || 0);

      const tenantIds = Array.from(new Set(pageRows.map(r => r.tenant_id)));
      const planIds = Array.from(new Set(pageRows.map(r => r.plan_id)));
      const [{ data: tenantsData, error: tenantsErr }, { data: plansData, error: plansErr }] = await Promise.all([
        tenantIds.length ? supabase.from("tenants").select("tenant_id, tenant_name").in("tenant_id", tenantIds) : Promise.resolve({ data: [], error: null } as any),
        planIds.length ? supabase.from("subscription_plans").select("plan_id, plan_name, plan_code, monthly_price, annual_price, currency_code").in("plan_id", planIds) : Promise.resolve({ data: [], error: null } as any),
      ]);
      if (tenantsErr) throw tenantsErr;
      if (plansErr) throw plansErr;
      const tMap: Record<string, TenantOpt> = {};
      (tenantsData as any as TenantOpt[]).forEach(t => { tMap[t.tenant_id] = t; });
      const pMap: Record<string, PlanOpt> = {};
      (plansData as any as PlanOpt[]).forEach(p => { pMap[p.plan_id] = p; });
      setTenantMap(tMap);
      setPlanMap(pMap);
    } catch (e: any) {
      console.error(e);
      toast({ title: "Failed to load subscriptions", description: e?.message || String(e), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / PER_PAGE)), [total]);

  const onCreate = () => { setEditing(null); setOpen(true); };
  const onEdit = (row: SubscriptionRow) => { setEditing(row); setOpen(true); };
  const onDelete = async (row: SubscriptionRow) => {
    if (!confirm(`Delete subscription ${row.subscription_id}?`)) return;
    try {
      const { error } = await supabase.from("tenant_subscriptions").delete().eq("subscription_id", row.subscription_id);
      if (error) throw error;
      toast({ title: "Subscription deleted" });
      fetchPage();
    } catch (e: any) {
      toast({ title: "Delete failed", description: e?.message || String(e), variant: "destructive" });
    }
  };

  const toggleAutoRenew = async (row: SubscriptionRow, value: boolean) => {
    try {
      const { error } = await supabase.from("tenant_subscriptions").update({ auto_renew: value }).eq("subscription_id", row.subscription_id);
      if (error) throw error;
      setRows(rs => rs.map(r => r.subscription_id === row.subscription_id ? { ...r, auto_renew: value } : r));
    } catch (e: any) {
      toast({ title: "Update failed", description: e?.message || String(e), variant: "destructive" });
    }
  };

  const cancelSubscription = async (row: SubscriptionRow) => {
    const reason = window.prompt("Enter cancellation reason (optional)") || null;
    try {
      const today = new Date().toISOString().slice(0, 10);
      const { error } = await supabase.from("tenant_subscriptions").update({ is_active: false, cancelled_on: today, cancellation_reason: reason }).eq("subscription_id", row.subscription_id);
      if (error) throw error;
      toast({ title: "Subscription cancelled" });
      fetchPage();
    } catch (e: any) {
      toast({ title: "Cancellation failed", description: e?.message || String(e), variant: "destructive" });
    }
  };

  return (
    <section id="subscriptions" className="space-y-3 pt-10">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Tenant Subscriptions</h2>
        <Button size="sm" onClick={onCreate}><Plus className="h-4 w-4" /> Assign Subscription</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Subscriptions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by invoice ref"
                  className="pl-8 w-[260px]"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { setPage(1); fetchPage(); } }}
                />
              </div>
              <Button variant="secondary" onClick={() => { setPage(1); fetchPage(); }}>Search</Button>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-sm">Status</Label>
              <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
                <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                <SelectContent className="z-[60]">
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Billing</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Start</TableHead>
                  <TableHead>End</TableHead>
                  <TableHead>Auto renew</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={8}>Loading...</TableCell></TableRow>
                ) : rows.length === 0 ? (
                  <TableRow><TableCell colSpan={8}>No subscriptions found</TableCell></TableRow>
                ) : (
                  rows.map((r) => {
                    const t = tenantMap[r.tenant_id];
                    const p = planMap[r.plan_id];
                    return (
                      <TableRow key={r.subscription_id}>
                        <TableCell className="font-medium">{t?.tenant_name || r.tenant_id.slice(0,8)}</TableCell>
                        <TableCell>{p ? `${p.plan_name} (${p.plan_code})` : r.plan_id.slice(0,8)}</TableCell>
                        <TableCell>{r.billing_cycle}</TableCell>
                        <TableCell>
                          <Badge variant={r.is_active ? "default" : "secondary"}>{r.payment_status}{!r.is_active ? " • Inactive" : ""}</Badge>
                        </TableCell>
                        <TableCell>{r.start_date}</TableCell>
                        <TableCell>{r.end_date}</TableCell>
                        <TableCell>
                          <Switch checked={!!r.auto_renew} onCheckedChange={(v) => toggleAutoRenew(r, v)} />
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button size="icon" variant="ghost" onClick={() => setSnapshotOpen({ open: true, data: r.plan_snapshot })}><Eye className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" onClick={() => onEdit(r)}><Pencil className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" onClick={() => onDelete(r)}><Trash2 className="h-4 w-4" /></Button>
                          {r.is_active ? (
                            <Button size="sm" variant="outline" onClick={() => cancelSubscription(r)}>Cancel</Button>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
              <TableCaption>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-muted-foreground">Page {page} of {totalPages} ({total} total)</span>
                  <div className="space-x-2">
                    <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>Prev</Button>
                    <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Next</Button>
                  </div>
                </div>
              </TableCaption>
            </Table>
          </div>
        </CardContent>
      </Card>

      <SubscriptionFormDialog
        open={open}
        onOpenChange={setOpen}
        initial={editing}
        onSaved={() => { setOpen(false); fetchPage(); }}
      />

      <Dialog open={snapshotOpen.open} onOpenChange={(v) => setSnapshotOpen({ open: v, data: v ? snapshotOpen.data : null })}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Plan Snapshot</DialogTitle>
          </DialogHeader>
          <pre className="text-xs overflow-auto max-h-[60vh] p-3 rounded-md border bg-muted">{JSON.stringify(snapshotOpen.data, null, 2)}</pre>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function SubscriptionFormDialog({ open, onOpenChange, initial, onSaved }: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial: SubscriptionRow | null;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [tenantOptions, setTenantOptions] = useState<TenantOpt[]>([]);
  const [planOptions, setPlanOptions] = useState<PlanOpt[]>([]);

  const [form, setForm] = useState({
    tenant_id: "",
    plan_id: "",
    billing_cycle: "Monthly" as SubscriptionRow["billing_cycle"],
    payment_status: "Paid" as SubscriptionRow["payment_status"],
    start_date: new Date().toISOString().slice(0, 10),
    end_date: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().slice(0, 10),
    auto_renew: true,
    invoice_reference: "",
    trial_used: false,
  });

  useEffect(() => {
    (async () => {
      try {
        const [{ data: tData, error: tErr }, { data: pData, error: pErr }] = await Promise.all([
          supabase.from("tenants").select("tenant_id, tenant_name").order("tenant_name"),
          supabase.from("subscription_plans").select("plan_id, plan_name, plan_code, monthly_price, annual_price, currency_code").eq("is_active", true).order("plan_name"),
        ]);
        if (tErr) throw tErr; if (pErr) throw pErr;
        setTenantOptions((tData as any) || []);
        setPlanOptions((pData as any) || []);
      } catch (e: any) {
        toast({ title: "Failed to load options", description: e?.message || String(e), variant: "destructive" });
      }
    })();
  }, [toast]);

  useEffect(() => {
    if (initial) {
      setForm({
        tenant_id: initial.tenant_id,
        plan_id: initial.plan_id,
        billing_cycle: initial.billing_cycle,
        payment_status: initial.payment_status,
        start_date: initial.start_date,
        end_date: initial.end_date,
        auto_renew: !!initial.auto_renew,
        invoice_reference: initial.invoice_reference || "",
        trial_used: !!initial.trial_used,
      });
    } else {
      setForm((f) => ({ ...f }));
    }
  }, [initial]);

  useEffect(() => {
    // auto adjust end_date when billing cycle changes (basic default)
    const start = new Date(form.start_date);
    const end = new Date(start);
    if (form.billing_cycle === "Monthly") end.setMonth(end.getMonth() + 1);
    else end.setFullYear(end.getFullYear() + 1);
    const iso = end.toISOString().slice(0, 10);
    setForm((f) => ({ ...f, end_date: iso }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.billing_cycle, form.start_date]);

  const onSubmit = async () => {
    if (!form.tenant_id || !form.plan_id) {
      toast({ title: "Missing fields", description: "Tenant and Plan are required", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      // Fetch plan snapshot
      const { data: planRow, error: planErr } = await supabase.from("subscription_plans").select("*").eq("plan_id", form.plan_id).maybeSingle();
      if (planErr) throw planErr;

      const payload = {
        tenant_id: form.tenant_id,
        plan_id: form.plan_id,
        plan_snapshot: planRow || null,
        start_date: form.start_date,
        end_date: form.end_date,
        billing_cycle: form.billing_cycle,
        payment_status: form.payment_status,
        auto_renew: form.auto_renew,
        invoice_reference: form.invoice_reference || null,
        trial_used: form.trial_used,
        is_active: true,
        next_renewal_date: form.end_date,
      };

      if (initial) {
        const { error } = await supabase.from("tenant_subscriptions").update(payload).eq("subscription_id", initial.subscription_id);
        if (error) throw error;
        toast({ title: "Subscription updated" });
      } else {
        const { error } = await supabase.from("tenant_subscriptions").insert(payload);
        if (error) throw error;
        toast({ title: "Subscription created" });
      }
      onSaved();
    } catch (e: any) {
      toast({ title: "Save failed", description: e?.message || String(e), variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit Subscription" : "Assign Subscription"}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 py-2">
          <div>
            <Label>Tenant</Label>
            <Select value={form.tenant_id} onValueChange={(v) => setForm((f) => ({ ...f, tenant_id: v }))}>
              <SelectTrigger><SelectValue placeholder="Select tenant" /></SelectTrigger>
              <SelectContent className="z-[60]">
                {tenantOptions.map((t) => (
                  <SelectItem key={t.tenant_id} value={t.tenant_id}>{t.tenant_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Plan</Label>
            <Select value={form.plan_id} onValueChange={(v) => setForm((f) => ({ ...f, plan_id: v }))}>
              <SelectTrigger><SelectValue placeholder="Select plan" /></SelectTrigger>
              <SelectContent className="z-[60]">
                {planOptions.map((p) => (
                  <SelectItem key={p.plan_id} value={p.plan_id}>{p.plan_name} ({p.plan_code})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Billing Cycle</Label>
            <Select value={form.billing_cycle} onValueChange={(v: SubscriptionRow["billing_cycle"]) => setForm((f) => ({ ...f, billing_cycle: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent className="z-[60]">
                <SelectItem value="Monthly">Monthly</SelectItem>
                <SelectItem value="Yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Payment Status</Label>
            <Select value={form.payment_status} onValueChange={(v: SubscriptionRow["payment_status"]) => setForm((f) => ({ ...f, payment_status: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent className="z-[60]">
                <SelectItem value="Paid">Paid</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Overdue">Overdue</SelectItem>
                <SelectItem value="Failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Start Date</Label>
            <Input type="date" value={form.start_date} onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))} />
          </div>
          <div>
            <Label>End Date</Label>
            <Input type="date" value={form.end_date} onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))} />
          </div>
          <div>
            <Label>Invoice Reference</Label>
            <Input value={form.invoice_reference} onChange={(e) => setForm((f) => ({ ...f, invoice_reference: e.target.value }))} />
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={form.auto_renew} onCheckedChange={(v) => setForm((f) => ({ ...f, auto_renew: v }))} />
            <Label className="text-sm">Auto renew</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={form.trial_used} onCheckedChange={(v) => setForm((f) => ({ ...f, trial_used: v }))} />
            <Label className="text-sm">Trial used</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={onSubmit} disabled={submitting}>{submitting ? "Saving..." : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
