import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { AssignSubscriptionDialog } from "@/components/admin/subscriptions/AssignSubscriptionDialog";

export interface Tenant {
  tenant_id: string;
  tenant_code: string;
  tenant_name: string;
  contact_person: string | null;
  contact_email: string;
  phone_number: string | null;
  industry_type: string | null;
  logo_url: string | null;
  status: "Active" | "Inactive" | "Pending";
  timezone: string | null;
  created_at: string;
  updated_at: string;
  notes: string | null;
}

const PER_PAGE = 10;

function statusVariant(status: Tenant["status"]) {
  switch (status) {
    case "Active":
      return "default" as const;
    case "Inactive":
      return "secondary" as const;
    default:
      return "outline" as const;
  }
}

export default function TenantsSection() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Tenant[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Tenant | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignTenantId, setAssignTenantId] = useState<string | null>(null);
  const from = (page - 1) * PER_PAGE;
  const to = page * PER_PAGE - 1;

  const fetchData = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("tenants")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, to);

      if (search.trim()) {
        const term = `%${search.trim()}%`;
        query = query.or(
          `tenant_name.ilike.${term},tenant_code.ilike.${term},contact_email.ilike.${term}`
        );
      }
      if (status !== "all") {
        query = query.eq("status", status);
      }

      const { data, error, count } = await query;
      if (error) throw error;
      setRows((data as any) || []);
      setTotal(count || 0);
    } catch (e: any) {
      console.error(e);
      toast({ title: "Failed to load tenants", description: e?.message || String(e), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / PER_PAGE)), [total]);

  const onCreate = () => {
    setEditing(null);
    setOpen(true);
  };
  const onEdit = (row: Tenant) => {
    setEditing(row);
    setOpen(true);
  };
  const onDelete = async (row: Tenant) => {
    if (!confirm(`Delete tenant ${row.tenant_name}?`)) return;
    try {
      const { error } = await supabase.from("tenants").delete().eq("tenant_id", row.tenant_id);
      if (error) throw error;
      toast({ title: "Tenant deleted" });
      fetchData();
    } catch (e: any) {
      toast({ title: "Delete failed", description: e?.message || String(e), variant: "destructive" });
    }
  };

  return (
    <section id="tenants" className="space-y-3 pt-10">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Tenant Management</h2>
        <Button size="sm" onClick={onCreate}><Plus className="h-4 w-4" /> Create Tenant</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tenants</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search name, code, email"
                  className="pl-8 w-[260px]"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      setPage(1);
                      fetchData();
                    }
                  }}
                />
              </div>
              <Button variant="secondary" onClick={() => { setPage(1); fetchData(); }}>Search</Button>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-sm">Status</Label>
              <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
                <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6}>Loading...</TableCell></TableRow>
                ) : rows.length === 0 ? (
                  <TableRow><TableCell colSpan={6}>No tenants found</TableCell></TableRow>
                ) : (
                  rows.map((r) => (
                    <TableRow key={r.tenant_id}>
                      <TableCell>{r.tenant_code}</TableCell>
                      <TableCell>{r.tenant_name}</TableCell>
                      <TableCell>{r.contact_email}</TableCell>
                      <TableCell>{r.phone_number || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(r.status)}>{r.status}</Badge>
                      </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button size="sm" variant="outline" onClick={() => { setAssignTenantId(r.tenant_id); setAssignOpen(true); }}>Assign</Button>
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

      <TenantFormDialog
        open={open}
        onOpenChange={setOpen}
        initial={editing}
        onSaved={() => { setOpen(false); fetchData(); }}
      />

      <AssignSubscriptionDialog
        open={assignOpen}
        onOpenChange={setAssignOpen}
        defaultTenantId={assignTenantId}
        onSaved={() => { setAssignOpen(false); }}
      />
    </section>
  );
}

function isValidEmail(email: string) {
  return /.+@.+\..+/.test(email);
}

function TenantFormDialog({ open, onOpenChange, initial, onSaved }: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial: Tenant | null;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    tenant_code: "",
    tenant_name: "",
    contact_person: "",
    contact_email: "",
    phone_number: "",
    industry_type: "",
    logo_url: "",
    status: "Pending" as Tenant["status"],
    timezone: "UTC",
    notes: "",
  });

  useEffect(() => {
    if (initial) {
      setForm({
        tenant_code: initial.tenant_code || "",
        tenant_name: initial.tenant_name || "",
        contact_person: initial.contact_person || "",
        contact_email: initial.contact_email || "",
        phone_number: initial.phone_number || "",
        industry_type: initial.industry_type || "",
        logo_url: initial.logo_url || "",
        status: initial.status,
        timezone: initial.timezone || "UTC",
        notes: initial.notes || "",
      });
    } else {
      setForm({
        tenant_code: "",
        tenant_name: "",
        contact_person: "",
        contact_email: "",
        phone_number: "",
        industry_type: "",
        logo_url: "",
        status: "Pending",
        timezone: "UTC",
        notes: "",
      });
    }
  }, [initial]);

  const onSubmit = async () => {
    if (!form.tenant_code.trim() || !form.tenant_name.trim()) {
      toast({ title: "Missing fields", description: "Code and Name are required", variant: "destructive" });
      return;
    }
    if (!isValidEmail(form.contact_email)) {
      toast({ title: "Invalid email", description: "Please enter a valid contact email", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      if (initial) {
        const { error } = await supabase
          .from("tenants")
          .update({ ...form })
          .eq("tenant_id", initial.tenant_id);
        if (error) throw error;
        toast({ title: "Tenant updated" });
      } else {
        const { error } = await supabase
          .from("tenants")
          .insert([{ ...form }]);
        if (error) throw error;
        toast({ title: "Tenant created" });
      }
      onSaved();
    } catch (e: any) {
      const msg = e?.message || String(e);
      toast({ title: "Save failed", description: msg.includes("duplicate key") ? "tenant_code must be unique" : msg, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial ? "Edit Tenant" : "Create Tenant"}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 py-2">
          <div>
            <Label>Tenant Code</Label>
            <Input value={form.tenant_code} onChange={(e) => setForm((f) => ({ ...f, tenant_code: e.target.value }))} />
          </div>
          <div>
            <Label>Tenant Name</Label>
            <Input value={form.tenant_name} onChange={(e) => setForm((f) => ({ ...f, tenant_name: e.target.value }))} />
          </div>
          <div>
            <Label>Contact Person</Label>
            <Input value={form.contact_person} onChange={(e) => setForm((f) => ({ ...f, contact_person: e.target.value }))} />
          </div>
          <div>
            <Label>Contact Email</Label>
            <Input type="email" value={form.contact_email} onChange={(e) => setForm((f) => ({ ...f, contact_email: e.target.value }))} />
          </div>
          <div>
            <Label>Phone Number</Label>
            <Input value={form.phone_number} onChange={(e) => setForm((f) => ({ ...f, phone_number: e.target.value }))} />
          </div>
          <div>
            <Label>Industry Type</Label>
            <Input value={form.industry_type} onChange={(e) => setForm((f) => ({ ...f, industry_type: e.target.value }))} />
          </div>
          <div>
            <Label>Logo URL</Label>
            <Input value={form.logo_url} onChange={(e) => setForm((f) => ({ ...f, logo_url: e.target.value }))} />
          </div>
          <div>
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v: Tenant["status"]) => setForm((f) => ({ ...f, status: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Timezone</Label>
            <Input value={form.timezone} onChange={(e) => setForm((f) => ({ ...f, timezone: e.target.value }))} />
          </div>
          <div className="md:col-span-2">
            <Label>Notes</Label>
            <Input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
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
