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
import { Plus, Search, Pencil, Trash2 } from "lucide-react";

export interface PlanRow {
  plan_id: string;
  plan_name: string;
  plan_code: string;
  description: string | null;
  monthly_price: number;
  annual_price: number | null;
  currency_code: string | null;
  regional_prices: any | null;
  trial_days: number | null;
  includes_trial: boolean | null;
  max_users: number | null;
  max_agents: number | null;
  max_products: number | null;
  api_access: boolean | null;
  reporting_tools: boolean | null;
  support_level: "Basic" | "Priority" | "Dedicated";
  features: any | null;
  available_add_ons: any | null;
  is_active: boolean | null;
  is_default_plan: boolean | null;
}

const PER_PAGE = 10;

export default function PlansSection() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<PlanRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PlanRow | null>(null);

  const from = (page - 1) * PER_PAGE;
  const to = page * PER_PAGE - 1;

  const fetchData = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("subscription_plans")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, to);
      if (search.trim()) {
        const term = `%${search.trim()}%`;
        query = query.or(`plan_name.ilike.${term},plan_code.ilike.${term}`);
      }
      const { data, error, count } = await query;
      if (error) throw error;
      setRows((data as any) || []);
      setTotal(count || 0);
    } catch (e: any) {
      toast({ title: "Failed to load plans", description: e?.message || String(e), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / PER_PAGE)), [total]);

  const onCreate = () => { setEditing(null); setOpen(true); };
  const onEdit = (row: PlanRow) => { setEditing(row); setOpen(true); };
  const onDelete = async (row: PlanRow) => {
    if (!confirm(`Delete plan ${row.plan_name}?`)) return;
    try {
      const { error } = await supabase.from("subscription_plans").delete().eq("plan_id", row.plan_id);
      if (error) throw error;
      toast({ title: "Plan deleted" });
      fetchData();
    } catch (e: any) {
      toast({ title: "Delete failed", description: e?.message || String(e), variant: "destructive" });
    }
  };

  const toggleActive = async (row: PlanRow, key: "is_active" | "is_default_plan", value: boolean) => {
    try {
      const { error } = await supabase.from("subscription_plans").update({ [key]: value }).eq("plan_id", row.plan_id);
      if (error) throw error;
      setRows((rs) => rs.map((r) => (r.plan_id === row.plan_id ? { ...r, [key]: value } : r)));
    } catch (e: any) {
      toast({ title: "Update failed", description: e?.message || String(e), variant: "destructive" });
    }
  };

  return (
    <section id="plans" className="space-y-3 pt-10">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Subscription Plans</h2>
        <Button size="sm" onClick={onCreate}><Plus className="h-4 w-4" /> Create Plan</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Plans</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search name, code"
                className="pl-8 w-[260px]"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { setPage(1); fetchData(); } }}
              />
            </div>
            <Button variant="secondary" onClick={() => { setPage(1); fetchData(); }}>Search</Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Monthly</TableHead>
                  <TableHead>Annual</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Default</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={7}>Loading...</TableCell></TableRow>
                ) : rows.length === 0 ? (
                  <TableRow><TableCell colSpan={7}>No plans found</TableCell></TableRow>
                ) : (
                  rows.map((r) => (
                    <TableRow key={r.plan_id}>
                      <TableCell className="font-medium">{r.plan_name}</TableCell>
                      <TableCell>{r.plan_code}</TableCell>
                      <TableCell>{r.monthly_price?.toFixed(2)} {r.currency_code || "INR"}</TableCell>
                      <TableCell>{r.annual_price ? r.annual_price.toFixed(2) : "-"} {r.currency_code || "INR"}</TableCell>
                      <TableCell>
                        <Switch checked={!!r.is_active} onCheckedChange={(v) => toggleActive(r, "is_active", v)} />
                      </TableCell>
                      <TableCell>
                        <Switch checked={!!r.is_default_plan} onCheckedChange={(v) => toggleActive(r, "is_default_plan", v)} />
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button size="icon" variant="ghost" onClick={() => onEdit(r)}><Pencil className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => onDelete(r)}><Trash2 className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))
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

      <PlanFormDialog
        open={open}
        onOpenChange={setOpen}
        initial={editing}
        onSaved={() => { setOpen(false); fetchData(); }}
      />
    </section>
  );
}

function parseJsonOrNull(value: string) {
  if (!value.trim()) return null;
  try { return JSON.parse(value); } catch { return null; }
}

function PlanFormDialog({ open, onOpenChange, initial, onSaved }: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial: PlanRow | null;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    plan_name: "",
    plan_code: "",
    description: "",
    monthly_price: 0,
    annual_price: 0,
    currency_code: "INR",
    trial_days: 0,
    includes_trial: false,
    max_users: 0,
    max_agents: 0,
    max_products: 0,
    api_access: false,
    reporting_tools: false,
    support_level: "Basic" as PlanRow["support_level"],
    features: "",
    available_add_ons: "",
    is_active: true,
    is_default_plan: false,
  });

  useEffect(() => {
    if (initial) {
      setForm({
        plan_name: initial.plan_name || "",
        plan_code: initial.plan_code || "",
        description: initial.description || "",
        monthly_price: Number(initial.monthly_price || 0),
        annual_price: Number(initial.annual_price || 0),
        currency_code: initial.currency_code || "INR",
        trial_days: Number(initial.trial_days || 0),
        includes_trial: !!initial.includes_trial,
        max_users: Number(initial.max_users || 0),
        max_agents: Number(initial.max_agents || 0),
        max_products: Number(initial.max_products || 0),
        api_access: !!initial.api_access,
        reporting_tools: !!initial.reporting_tools,
        support_level: initial.support_level,
        features: initial.features ? JSON.stringify(initial.features, null, 2) : "",
        available_add_ons: initial.available_add_ons ? JSON.stringify(initial.available_add_ons, null, 2) : "",
        is_active: !!initial.is_active,
        is_default_plan: !!initial.is_default_plan,
      });
    } else {
      setForm({
        plan_name: "",
        plan_code: "",
        description: "",
        monthly_price: 0,
        annual_price: 0,
        currency_code: "INR",
        trial_days: 0,
        includes_trial: false,
        max_users: 0,
        max_agents: 0,
        max_products: 0,
        api_access: false,
        reporting_tools: false,
        support_level: "Basic",
        features: "",
        available_add_ons: "",
        is_active: true,
        is_default_plan: false,
      });
    }
  }, [initial]);

  const onSubmit = async () => {
    if (!form.plan_code.trim() || !form.plan_name.trim()) {
      toast({ title: "Missing fields", description: "Code and Name are required", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        plan_name: form.plan_name,
        plan_code: form.plan_code,
        description: form.description || null,
        monthly_price: Number(form.monthly_price || 0),
        annual_price: form.annual_price ? Number(form.annual_price) : null,
        currency_code: form.currency_code || "INR",
        trial_days: Number(form.trial_days || 0),
        includes_trial: !!form.includes_trial,
        max_users: form.max_users ? Number(form.max_users) : null,
        max_agents: form.max_agents ? Number(form.max_agents) : null,
        max_products: form.max_products ? Number(form.max_products) : null,
        api_access: !!form.api_access,
        reporting_tools: !!form.reporting_tools,
        support_level: form.support_level,
        features: parseJsonOrNull(form.features),
        available_add_ons: parseJsonOrNull(form.available_add_ons),
        is_active: !!form.is_active,
        is_default_plan: !!form.is_default_plan,
      } as const;

      if (initial) {
        const { error } = await supabase.from("subscription_plans").update(payload).eq("plan_id", initial.plan_id);
        if (error) throw error;
        toast({ title: "Plan updated" });
      } else {
        const { error } = await supabase.from("subscription_plans").insert([payload]);
        if (error) throw error;
        toast({ title: "Plan created" });
      }
      onSaved();
    } catch (e: any) {
      const msg = e?.message || String(e);
      toast({ title: "Save failed", description: msg.includes("duplicate key") ? "plan_code must be unique" : msg, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit Plan" : "Create Plan"}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 py-2">
          <div className="md:col-span-2">
            <Label>Plan Name</Label>
            <Input value={form.plan_name} onChange={(e) => setForm((f) => ({ ...f, plan_name: e.target.value }))} />
          </div>
          <div>
            <Label>Plan Code</Label>
            <Input value={form.plan_code} onChange={(e) => setForm((f) => ({ ...f, plan_code: e.target.value }))} />
          </div>
          <div className="md:col-span-3">
            <Label>Description</Label>
            <Input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
          <div>
            <Label>Monthly Price</Label>
            <Input type="number" value={form.monthly_price} onChange={(e) => setForm((f) => ({ ...f, monthly_price: Number(e.target.value) }))} />
          </div>
          <div>
            <Label>Annual Price</Label>
            <Input type="number" value={form.annual_price} onChange={(e) => setForm((f) => ({ ...f, annual_price: Number(e.target.value) }))} />
          </div>
          <div>
            <Label>Currency</Label>
            <Input value={form.currency_code} onChange={(e) => setForm((f) => ({ ...f, currency_code: e.target.value }))} />
          </div>
          <div>
            <Label>Trial Days</Label>
            <Input type="number" value={form.trial_days} onChange={(e) => setForm((f) => ({ ...f, trial_days: Number(e.target.value) }))} />
          </div>
          <div>
            <Label>Support Level</Label>
            <Select value={form.support_level} onValueChange={(v: PlanRow["support_level"]) => setForm((f) => ({ ...f, support_level: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Basic">Basic</SelectItem>
                <SelectItem value="Priority">Priority</SelectItem>
                <SelectItem value="Dedicated">Dedicated</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={form.includes_trial} onCheckedChange={(v) => setForm((f) => ({ ...f, includes_trial: v }))} />
            <Label className="text-sm">Includes Trial</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={form.api_access} onCheckedChange={(v) => setForm((f) => ({ ...f, api_access: v }))} />
            <Label className="text-sm">API Access</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={form.reporting_tools} onCheckedChange={(v) => setForm((f) => ({ ...f, reporting_tools: v }))} />
            <Label className="text-sm">Reporting Tools</Label>
          </div>
          <div>
            <Label>Max Users</Label>
            <Input type="number" value={form.max_users} onChange={(e) => setForm((f) => ({ ...f, max_users: Number(e.target.value) }))} />
          </div>
          <div>
            <Label>Max Agents</Label>
            <Input type="number" value={form.max_agents} onChange={(e) => setForm((f) => ({ ...f, max_agents: Number(e.target.value) }))} />
          </div>
          <div>
            <Label>Max Products</Label>
            <Input type="number" value={form.max_products} onChange={(e) => setForm((f) => ({ ...f, max_products: Number(e.target.value) }))} />
          </div>
          <div className="md:col-span-3">
            <Label>Features (JSON)</Label>
            <textarea className="w-full min-h-[120px] rounded-md border p-2 text-sm" value={form.features} onChange={(e) => setForm((f) => ({ ...f, features: e.target.value }))} />
          </div>
          <div className="md:col-span-3">
            <Label>Available Add-ons (JSON)</Label>
            <textarea className="w-full min-h-[120px] rounded-md border p-2 text-sm" value={form.available_add_ons} onChange={(e) => setForm((f) => ({ ...f, available_add_ons: e.target.value }))} />
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={form.is_active} onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))} />
            <Label className="text-sm">Active</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={form.is_default_plan} onCheckedChange={(v) => setForm((f) => ({ ...f, is_default_plan: v }))} />
            <Label className="text-sm">Default Plan</Label>
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
