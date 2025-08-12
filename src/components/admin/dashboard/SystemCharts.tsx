import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area,
  BarChart,
  Bar,
} from "recharts";

const tenantData = [
  { name: "Mon", active: 12 },
  { name: "Tue", active: 14 },
  { name: "Wed", active: 13 },
  { name: "Thu", active: 15 },
  { name: "Fri", active: 16 },
  { name: "Sat", active: 16 },
  { name: "Sun", active: 17 },
];

const usageData = [
  { name: "00h", usage: 20 },
  { name: "04h", usage: 28 },
  { name: "08h", usage: 45 },
  { name: "12h", usage: 65 },
  { name: "16h", usage: 40 },
  { name: "20h", usage: 30 },
];

const apiData = [
  { name: "ProviderA", success: 98, fail: 2 },
  { name: "ProviderB", success: 95, fail: 5 },
  { name: "ProviderC", success: 99, fail: 1 },
];

export default function SystemCharts() {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
      <Card>
        <CardHeader className="py-3"><CardTitle className="text-sm">Tenant Status</CardTitle></CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={tenantData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="active" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="py-3"><CardTitle className="text-sm">System Usage</CardTitle></CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={usageData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="usageGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="usage" stroke="hsl(var(--primary))" fill="url(#usageGradient)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="py-3"><CardTitle className="text-sm">API Integration Status</CardTitle></CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={apiData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="success" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="fail" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
