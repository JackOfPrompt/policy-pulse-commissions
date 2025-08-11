import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentTenant } from "./useCurrentTenant";

export interface SalesByMonthPoint {
  month: string;
  online: number; // Not available yet, kept for UI compatibility
  offline: number; // Using total as offline until channels are implemented
}

export interface CommissionSeriesPoint {
  month: string;
  earned: number; // commissions approved this month (Lakh)
  paid: number;   // payouts completed this month (Lakh)
}

export interface OnboardingSlice { name: string; value: number }
export interface ClaimsByLOBRow { lob: string; submitted: number; approved: number; pending: number }

interface KPIs {
  totalPoliciesIssued: number;
  activePolicies: number;
  premiumCollected: number; // in INR
  pendingRenewals: number;
  totalAgents: number;
}

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(key: string) {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, 1).toLocaleString(undefined, { month: 'short' });
}

export function useTenantOverviewData() {
  const { tenantId } = useCurrentTenant();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();

  const [kpis, setKPIs] = useState<KPIs>({
    totalPoliciesIssued: 0,
    activePolicies: 0,
    premiumCollected: 0,
    pendingRenewals: 0,
    totalAgents: 0,
  });

  const [salesByMonth, setSalesByMonth] = useState<SalesByMonthPoint[]>([]);
  const [commissionsSeries, setCommissionsSeries] = useState<CommissionSeriesPoint[]>([]);
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingSlice[]>([]);
  const [claimsByLOB, setClaimsByLOB] = useState<ClaimsByLOBRow[]>([]);

  const since6Months = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 5); // include current month => 6 points total
    d.setDate(1);
    d.setHours(0,0,0,0);
    return d.toISOString();
  }, []);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      if (!tenantId) return; // wait for tenant
      setLoading(true);
      setError(undefined);

      try {
        // 1) KPIs
        const [issuedCountRes, activeCountRes, premiumListRes, renewalsRes, agentsCountRes] = await Promise.all([
          supabase.from('policies_new').select('*', { count: 'exact', head: true })
            .eq('tenant_id', tenantId).eq('policy_status', 'Issued'),
          supabase.from('active_policies_view').select('*', { count: 'exact', head: true })
            .eq('tenant_id', tenantId),
          supabase.from('policies_new').select('premium_amount, policy_status, tenant_id')
            .eq('tenant_id', tenantId).eq('policy_status', 'Issued'),
          supabase.from('policies_new').select('policy_end_date, tenant_id, policy_status')
            .eq('tenant_id', tenantId).eq('policy_status', 'Issued')
            .gte('policy_end_date', new Date().toISOString())
            .lte('policy_end_date', new Date(Date.now() + 30*24*60*60*1000).toISOString()),
          supabase.from('agents').select('*', { count: 'exact', head: true })
            .eq('tenant_id', tenantId).eq('status', 'ACTIVE'),
        ]);

        const totalPoliciesIssued = issuedCountRes.count ?? 0;
        const activePolicies = activeCountRes.count ?? 0;
        const premiumCollected = (premiumListRes.data ?? [])
          .reduce((sum: number, r: any) => sum + (Number(r.premium_amount) || 0), 0);
        const pendingRenewals = (renewalsRes.data ?? []).length;
        const totalAgents = agentsCountRes.count ?? 0;

        if (!isMounted) return;
        setKPIs({ totalPoliciesIssued, activePolicies, premiumCollected, pendingRenewals, totalAgents });

        // 2) Sales by month (using policies_new; no channel yet, so put total in offline for compatibility)
        const policiesSince = await supabase.from('policies_new')
          .select('created_at, policy_status, tenant_id')
          .eq('tenant_id', tenantId)
          .eq('policy_status', 'Issued')
          .gte('created_at', since6Months);

        const countsByMonth: Record<string, number> = {};
        (policiesSince.data ?? []).forEach((row: any) => {
          const d = new Date(row.created_at);
          const key = monthKey(d);
          countsByMonth[key] = (countsByMonth[key] ?? 0) + 1;
        });

        // Build last 6 months in order
        const points: SalesByMonthPoint[] = [];
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
          const dt = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const key = monthKey(dt);
          const total = countsByMonth[key] ?? 0;
          points.push({ month: monthLabel(key), online: 0, offline: total });
        }
        if (isMounted) setSalesByMonth(points);

        // 3) Commissions & payouts per month
        const [commTxRes, payoutTxRes] = await Promise.all([
          supabase.from('commission_transactions')
            .select('calculated_at, commission_value, status')
            .gte('calculated_at', since6Months),
          supabase.from('payout_transactions')
            .select('payout_date, payout_amount, payout_status')
            .gte('payout_date', since6Months),
        ]);

        const earnedByMonth: Record<string, number> = {};
        (commTxRes.data ?? []).forEach((r: any) => {
          if (String(r.status).toUpperCase() !== 'APPROVED') return;
          const key = monthKey(new Date(r.calculated_at));
          earnedByMonth[key] = (earnedByMonth[key] ?? 0) + (Number(r.commission_value) || 0);
        });

        const paidByMonth: Record<string, number> = {};
        (payoutTxRes.data ?? []).forEach((r: any) => {
          const status = String(r.payout_status || '').toUpperCase();
          if (!['APPROVED', 'COMPLETED'].includes(status)) return;
          const key = monthKey(new Date(r.payout_date));
          paidByMonth[key] = (paidByMonth[key] ?? 0) + (Number(r.payout_amount) || 0);
        });

        const commPoints: CommissionSeriesPoint[] = [];
        for (let i = 5; i >= 0; i--) {
          const dt = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const key = monthKey(dt);
          const earned = (earnedByMonth[key] ?? 0) / 100000; // to Lakh
          const paid = (paidByMonth[key] ?? 0) / 100000;     // to Lakh
          commPoints.push({ month: monthLabel(key), earned, paid });
        }
        if (isMounted) setCommissionsSeries(commPoints);

        // 4) Onboarding status from customers. Group by kyc_status
        const custRes = await supabase.from('customers').select('kyc_status').eq('tenant_id', tenantId);
        const byStatus: Record<string, number> = {};
        (custRes.data ?? []).forEach((r: any) => {
          const k = String(r.kyc_status || 'Unknown');
          byStatus[k] = (byStatus[k] ?? 0) + 1;
        });
        const onboarding: OnboardingSlice[] = Object.entries(byStatus)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 5);
        if (isMounted) setOnboardingStatus(onboarding);

        // 5) Claims by category (using claim_type as surrogate for LOB)
        const claimsRes = await supabase.from('claims').select('claim_type, status').eq('tenant_id', tenantId);
        const agg: Record<string, { submitted: number; approved: number; pending: number }> = {};
        (claimsRes.data ?? []).forEach((r: any) => {
          const cat = String(r.claim_type || 'Other');
          const status = String(r.status || '').toUpperCase();
          if (!agg[cat]) agg[cat] = { submitted: 0, approved: 0, pending: 0 };
          agg[cat].submitted += 1;
          if (['APPROVED', 'SETTLED', 'COMPLETED'].includes(status)) agg[cat].approved += 1;
          else agg[cat].pending += 1;
        });
        const claimsRows: ClaimsByLOBRow[] = Object.entries(agg).map(([lob, v]) => ({ lob, ...v }));
        if (isMounted) setClaimsByLOB(claimsRows);

      } catch (e: any) {
        if (isMounted) setError(e?.message || 'Failed to load dashboard data');
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    return () => { isMounted = false };
  }, [tenantId, since6Months]);

  return { loading, error, kpis, salesByMonth, commissionsSeries, onboardingStatus, claimsByLOB };
}
