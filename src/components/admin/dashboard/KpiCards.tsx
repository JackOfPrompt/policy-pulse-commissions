import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function KpiCard({ label, value, sublabel }: { label: string; value: React.ReactNode; sublabel?: string }) {
  return (
    <Card>
      <CardHeader className="py-3">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
      </CardHeader>
      <CardContent className="py-2">
        <div className="text-3xl font-semibold leading-none tracking-tight">{value}</div>
        {sublabel && <div className="text-xs text-muted-foreground mt-1">{sublabel}</div>}
      </CardContent>
    </Card>
  );
}

export default function KpiCards({
  tenants,
  users,
  mrr,
  currency,
  expiring,
  systemStatus = "Operational",
  apiStatus = "Healthy",
  functionsStatus = "Healthy",
  usage = "Moderate",
}: {
  tenants: number;
  users: number;
  mrr?: number | null;
  currency: string;
  expiring?: number | null;
  systemStatus?: string;
  apiStatus?: string;
  functionsStatus?: string;
  usage?: string;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
      <KpiCard label="Active Tenants" value={tenants} />
      <KpiCard label="Active Users" value={users} />
      <KpiCard label="Est. Monthly Revenue" value={mrr != null ? `${currency} ${mrr.toFixed(2)}` : "-"} />
      <KpiCard label="Expiring in 30 Days" value={expiring ?? "-"} />
      <KpiCard label="System Status" value={systemStatus} sublabel="Overall platform" />
      <KpiCard label="System Usage" value={usage} sublabel="Load & activity" />
      <KpiCard label="API Integrations" value={apiStatus} sublabel="3rd party services" />
      <KpiCard label="Functions" value={functionsStatus} sublabel="Background jobs" />
    </div>
  );
}
