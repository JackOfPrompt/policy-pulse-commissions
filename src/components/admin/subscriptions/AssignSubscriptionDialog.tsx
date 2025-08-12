import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface TenantOpt { tenant_id: string; tenant_name: string; }
interface PlanOpt { plan_id: string; plan_name: string; plan_code: string; monthly_price: number; annual_price: number | null; currency_code: string | null; }

type BillingCycle = "Monthly" | "Yearly";
type PaymentStatus = "Paid" | "Pending" | "Overdue" | "Failed";

export function AssignSubscriptionDialog({
  open,
  onOpenChange,
  defaultTenantId,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultTenantId?: string | null;
  onSaved?: () => void;
}) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [tenantOptions, setTenantOptions] = useState<TenantOpt[]>([]);
  const [planOptions, setPlanOptions] = useState<PlanOpt[]>([]);

  const [form, setForm] = useState({
    tenant_id: defaultTenantId || "",
    plan_id: "",
    billing_cycle: "Monthly" as BillingCycle,
    payment_status: "Paid" as PaymentStatus,
    start_date: new Date().toISOString().slice(0, 10),
    end_date: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().slice(0, 10),
    auto_renew: true,
    invoice_reference: "",
    trial_used: false,
  });

  useEffect(() => {
    setForm((f) => ({ ...f, tenant_id: defaultTenantId || "" }));
  }, [defaultTenantId]);

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
      const { data: planRow, error: planErr } = await supabase
        .from("subscription_plans").select("*").eq("plan_id", form.plan_id).maybeSingle();
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
      } as any;

      const { error } = await supabase.from("tenant_subscriptions").insert([payload]);
      if (error) throw error;
      toast({ title: "Subscription created" });
      onSaved?.();
      onOpenChange(false);
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
          <DialogTitle>Assign Subscription</DialogTitle>
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
            <Select value={form.billing_cycle} onValueChange={(v: BillingCycle) => setForm((f) => ({ ...f, billing_cycle: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent className="z-[60]">
                <SelectItem value="Monthly">Monthly</SelectItem>
                <SelectItem value="Yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Payment Status</Label>
            <Select value={form.payment_status} onValueChange={(v: PaymentStatus) => setForm((f) => ({ ...f, payment_status: v }))}>
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
