import { useState, useEffect } from "react";
import { Building2, Users, Activity, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { StatusChip } from "@/components/ui/status-chip";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { TenantAdminManagement } from "@/components/superadmin/TenantAdminManagement";
import users from "@/data/users.json";
import auditLogs from "@/data/audit-logs.json";

type Organization = {
  id: string;
  name: string;
  code: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  created_at: string;
  updated_at: string;
};

export default function SuperAdminDashboard() {
  const { user, profile } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);

  const dashboardUser = users.superadmin;

  // Load organizations from Supabase
  useEffect(() => {
    loadOrganizations();
  }, []);

  const loadOrganizations = async () => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrganizations(data || []);
    } catch (error) {
      console.error('Error loading organizations:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    {
      title: "Total Organizations",
      value: organizations.length,
      change: "+2 this month",
      icon: Building2,
      color: "text-primary"
    },
    {
      title: "Active Users", 
      value: "1,247",
      change: "+18% from last month",
      icon: Users,
      color: "text-success"
    },
    {
      title: "System Uptime",
      value: "99.9%",
      change: "Last 30 days",
      icon: TrendingUp,
      color: "text-info"
    },
    {
      title: "Audit Events",
      value: auditLogs.length,
      change: "Today",
      icon: Activity,
      color: "text-warning"
    }
  ];

  if (loading) {
    return (
      <DashboardLayout role="superadmin" user={dashboardUser}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="superadmin" user={dashboardUser}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Super Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage organizations and monitor system-wide activities
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">
                    {stat.change}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Organizations Overview</CardTitle>
              <CardDescription>
                Manage partner organizations and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {organizations.slice(0, 5).map((org) => (
                  <div key={org.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{org.name}</p>
                      <p className="text-sm text-muted-foreground">{org.code}</p>
                    </div>
                    <StatusChip variant="success">
                      Active
                    </StatusChip>
                  </div>
                ))}
                {organizations.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center">No organizations found</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Audit Activity</CardTitle>
              <CardDescription>
                Latest system events and user actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {auditLogs.slice(0, 5).map((log) => (
                  <div key={log.id} className="flex items-start space-x-3">
                    <Activity className="h-4 w-4 mt-1 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{log.action}</p>
                      <p className="text-xs text-muted-foreground">
                        by {log.actor} • {new Date(log.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tenant Admin Management */}
        <TenantAdminManagement />
      </div>
    </DashboardLayout>
  );
}