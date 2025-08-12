import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { exportToCSV, exportToXLSX } from "@/lib/export";

interface HealthRow {
  tenant: string;
  api_status: string;
  errors: number;
  avg_response_ms: number;
  last_downtime?: string;
}

export default function HealthStatusTable({ tenants }: { tenants: { tenant_id: string; tenant_name: string }[] }) {
  const rows: HealthRow[] = useMemo(
    () =>
      tenants.map((t, i) => ({
        tenant: t.tenant_name,
        api_status: (i % 7 === 0 ? "Degraded" : "Healthy"),
        errors: (i * 3) % 17,
        avg_response_ms: 200 + ((i * 37) % 120),
        last_downtime: i % 11 === 0 ? new Date(Date.now() - i * 86400000).toLocaleString() : undefined,
      })),
    [tenants]
  );

  const onCSV = () => exportToCSV("tenant-health-status", rows);
  const onXLSX = () => exportToXLSX("tenant-health-status", rows);

  return (
    <section aria-label="Tenant Health Status">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Tenant Health Status</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onCSV}>CSV</Button>
            <Button variant="outline" size="sm" onClick={onXLSX}>Excel</Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableCaption>Connect your monitoring API to populate live health metrics.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Tenant Name</TableHead>
                <TableHead>API Status</TableHead>
                <TableHead>Integration Errors</TableHead>
                <TableHead>Avg. Response Time</TableHead>
                <TableHead>Last Downtime</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.tenant}>
                  <TableCell>{r.tenant}</TableCell>
                  <TableCell>{r.api_status}</TableCell>
                  <TableCell>{r.errors}</TableCell>
                  <TableCell>{r.avg_response_ms} ms</TableCell>
                  <TableCell>{r.last_downtime ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </section>
  );
}
