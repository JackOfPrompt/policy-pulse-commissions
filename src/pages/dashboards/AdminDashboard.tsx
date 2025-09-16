import { useState } from "react";
import { Users, Shield, DollarSign, TrendingUp, FileText, AlertTriangle, Settings } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { StatusChip } from "@/components/ui/status-chip";
import { Button } from "@/components/ui/button";
import { LocalAdminManagement } from "@/components/admin/LocalAdminManagement";
import { PasswordChangeModal } from "@/components/auth/PasswordChangeModal";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminDashboard() {
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const { data: dashboardData, loading, error } = useDashboardStats();

  // Mock user for now - in a real app, this would come from auth context
  const user = { name: "Admin User", email: "admin@company.com", role: "admin" };

  if (loading) {
    return (
      <DashboardLayout role="admin" user={user}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
              <p className="text-muted-foreground">Loading dashboard data...</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-[100px]" />
                  <Skeleton className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-[60px]" />
                  <Skeleton className="h-3 w-[120px] mt-2" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout role="admin" user={user}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
              <p className="text-destructive">Error loading dashboard: {error}</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const stats = [
    {
      title: "Total Customers",
      value: dashboardData.totalCustomers,
      change: "+12% from last month",
      icon: Users,
      color: "text-primary"
    },
    {
      title: "Active Policies", 
      value: dashboardData.activePolicies,
      change: "+5 this week",
      icon: Shield,
      color: "text-success"
    },
    {
      title: "Pending Commissions",
      value: `₹${dashboardData.pendingCommissions.toLocaleString()}`,
      change: "Awaiting payout",
      icon: DollarSign,
      color: "text-warning"
    },
    {
      title: "Total Premium",
      value: `₹${(dashboardData.totalPremium / 100000).toFixed(1)}L`,
      change: `${dashboardData.monthlyGrowth}% growth`,
      icon: TrendingUp,
      color: "text-info"
    }
  ];

  return (
    <DashboardLayout role="admin" user={user}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Overview of your insurance operations and performance
            </p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline">
              <Users className="mr-2 h-4 w-4" />
              Add Customer
            </Button>
            <Button variant="outline">
              <Shield className="mr-2 h-4 w-4" />
              Upload Policy
            </Button>
            <Button>
              <FileText className="mr-2 h-4 w-4" />
              Generate Report
            </Button>
          </div>
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
              <CardTitle>Recent Policies</CardTitle>
              <CardDescription>
                Latest policy applications and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData.recentPolicies.length > 0 ? dashboardData.recentPolicies.map((policy) => (
                  <div key={policy.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{policy.policy_number}</p>
                      <p className="text-sm text-muted-foreground">
                        {policy.customer_name} • {policy.product_type}
                      </p>
                    </div>
                    <StatusChip 
                      variant={
                        policy.policy_status === 'active' ? 'success' :
                        policy.policy_status === 'pending' ? 'warning' : 'destructive'
                      }
                    >
                      {policy.policy_status}
                    </StatusChip>
                  </div>
                )) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No recent policies found
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="mr-2 h-4 w-4 text-warning" />
                AI Extraction Queue
              </CardTitle>
              <CardDescription>
                Policies awaiting document processing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData.pendingExtractions.length > 0 ? dashboardData.pendingExtractions.map((policy) => (
                  <div key={policy.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{policy.policy_number}</p>
                      <p className="text-sm text-muted-foreground">
                        {policy.customer_name}
                      </p>
                    </div>
                    <StatusChip 
                      variant={
                        policy.extractionStatus === 'pending' ? 'warning' :
                        policy.extractionStatus === 'processing' ? 'info' : 'destructive'
                      }
                    >
                      {policy.extractionStatus}
                    </StatusChip>
                  </div>
                )) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No pending extractions
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Local Admin Management */}
        <LocalAdminManagement />
      </div>
      
      <PasswordChangeModal
        open={passwordModalOpen}
        onOpenChange={setPasswordModalOpen}
      />
    </DashboardLayout>
  );
}