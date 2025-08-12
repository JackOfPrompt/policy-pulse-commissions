import React from "react";
import { KpiCard } from "./KpiCards";

interface Props {
  tenantsCount: number;
  activeUsers: number;
  activePolicies?: number | null;
  mtdNewPolicies?: number | null;
  mtdRenewals?: number | null;
  totalPremium?: number | null;
  topTenant?: string | null;
  lowestTenantByRenewal?: string | null;
  uptimePct?: number | null;
  integrationHealth?: string | null;
  pendingTickets?: number | null;
}

export default function ExtendedKpiCards({
  tenantsCount,
  activeUsers,
  activePolicies = null,
  mtdNewPolicies = null,
  mtdRenewals = null,
  totalPremium = null,
  topTenant = null,
  lowestTenantByRenewal = null,
  uptimePct = null,
  integrationHealth = null,
  pendingTickets = null,
}: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
      <KpiCard label="Total Tenants" value={tenantsCount} />
      <KpiCard label="Total Active Users" value={activeUsers} />
      <KpiCard label="Total Active Policies" value={activePolicies ?? "—"} />
      <KpiCard label="MTD New Policies" value={mtdNewPolicies ?? "—"} />
      <KpiCard label="MTD Renewals" value={mtdRenewals ?? "—"} />
      <KpiCard label="Total Premium Collected" value={totalPremium != null ? `INR ${totalPremium.toLocaleString()}` : "—"} />
      <KpiCard label="Top Performing Tenant" value={topTenant ?? "—"} />
      <KpiCard label="Lowest Tenant by Renewal Rate" value={lowestTenantByRenewal ?? "—"} />
      <KpiCard label="Platform Uptime (%)" value={uptimePct != null ? `${uptimePct.toFixed(2)}%` : "—"} />
      <KpiCard label="Integration Health" value={integrationHealth ?? "—"} />
      <KpiCard label="Pending Support Tickets" value={pendingTickets ?? "—"} />
      <KpiCard label="System Usage" value={"—"} sublabel="User activity heatmap" />
    </div>
  );
}
