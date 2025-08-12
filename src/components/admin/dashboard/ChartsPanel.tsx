import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { exportToCSV, exportToXLSX } from "@/lib/export";

interface ChartsPanelProps {
  tenants: { tenant_id: string; tenant_name: string }[];
}

export default function ChartsPanel({ tenants }: ChartsPanelProps) {
  // Placeholder/sample datasets based on tenants list
  const tenantPremium = useMemo(
    () =>
      tenants.map((t, i) => ({ tenant: t.tenant_name, premium: Math.round(50000 + (i * 13789) % 120000) })),
    [tenants]
  );

  const policyTypeDist = useMemo(
    () =>
      tenants.slice(0, 8).map((t, i) => ({
        tenant: t.tenant_name,
        new_business: (i * 17) % 200,
        renewal: (i * 29) % 250,
        rollover: (i * 11) % 80,
        portability: (i * 7) % 50,
      })),
    [tenants]
  );

  const activeByLOB = useMemo(
    () =>
      tenants.slice(0, 8).map((t, i) => ({
        tenant: t.tenant_name,
        Life: (i * 9) % 400,
        Health: (i * 13) % 500,
        Motor: (i * 7) % 350,
        Crop: (i * 5) % 200,
      })),
    [tenants]
  );

  const claimsPerformance = useMemo(
    () =>
      tenants.slice(0, 8).map((t, i) => {
        const filed = (i * 23) % 300;
        const settled = (i * 19) % 250;
        const pending = Math.max(0, filed - settled);
        const ratio = filed ? (settled / filed) * 100 : 0;
        return { tenant: t.tenant_name, filed, settled, pending, settlement_ratio: Number(ratio.toFixed(2)) };
      }),
    [tenants]
  );

  const monthlyUsage = useMemo(
    () =>
      Array.from({ length: 12 }).map((_, i) => ({
        month: new Date(2025, i, 1).toLocaleString(undefined, { month: "short" }),
        transactions: 1000 + (i * 87) % 400,
      })),
    []
  );

  const exportPremiumCSV = () => exportToCSV("tenant-premium", tenantPremium);
  const exportPremiumXLSX = () => exportToXLSX("tenant-premium", tenantPremium);

  const exportHealthCSV = () => exportToCSV("claims-performance", claimsPerformance);
  const exportHealthXLSX = () => exportToXLSX("claims-performance", claimsPerformance);

  return (
    <section aria-label="Analytics" className="grid grid-cols-1 xl:grid-cols-2 gap-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Tenant Premium Comparison</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportPremiumCSV}>CSV</Button>
            <Button variant="outline" size="sm" onClick={exportPremiumXLSX}>Excel</Button>
          </div>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={tenantPremium} layout="vertical" margin={{ left: 24 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="tenant" type="category" width={120} />
              <Tooltip />
              <Legend />
              <Bar dataKey="premium" name="Premium" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Policy Type Distribution</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={policyTypeDist}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="tenant" interval={0} angle={-20} textAnchor="end" height={60} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="new_business" stackId="a" name="New" fill="hsl(var(--primary))" />
              <Bar dataKey="renewal" stackId="a" name="Renewal" fill="hsl(var(--primary) / 0.7)" />
              <Bar dataKey="rollover" stackId="a" name="Rollover" fill="hsl(var(--secondary))" />
              <Bar dataKey="portability" stackId="a" name="Portability" fill="hsl(var(--accent))" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Active Policies by LOB</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={activeByLOB}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="tenant" interval={0} angle={-20} textAnchor="end" height={60} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Life" fill="hsl(var(--primary))" />
              <Bar dataKey="Health" fill="hsl(var(--primary) / 0.7)" />
              <Bar dataKey="Motor" fill="hsl(var(--secondary))" />
              <Bar dataKey="Crop" fill="hsl(var(--accent))" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Claims Performance</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportHealthCSV}>CSV</Button>
            <Button variant="outline" size="sm" onClick={exportHealthXLSX}>Excel</Button>
          </div>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={claimsPerformance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="tenant" interval={0} angle={-20} textAnchor="end" height={60} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line dataKey="filed" name="Filed" type="monotone" stroke="hsl(var(--primary))" />
              <Line dataKey="settled" name="Settled" type="monotone" stroke="hsl(var(--secondary))" />
              <Line dataKey="pending" name="Pending" type="monotone" stroke="hsl(var(--accent))" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="xl:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Monthly Platform Usage Trend</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyUsage}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line dataKey="transactions" name="Transactions" type="monotone" stroke="hsl(var(--primary))" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </section>
  );
}
