import { useState } from "react";
import { Users, Shield, DollarSign, TrendingUp, FileText, AlertTriangle, Settings } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { StatusChip } from "@/components/ui/status-chip";
import { Button } from "@/components/ui/button";
import { LocalAdminManagement } from "@/components/admin/LocalAdminManagement";
import { PasswordChangeModal } from "@/components/auth/PasswordChangeModal";
import users from "@/data/users.json";
import policies from "@/data/policies.json";
import customers from "@/data/customers.json";
import commissions from "@/data/commissions.json";

export default function AdminDashboard() {
  const user = users.admin;
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);

  const stats = [
    {
      title: "Total Customers",
      value: customers.length,
      change: "+12% from last month",
      icon: Users,
      color: "text-primary"
    },
    {
      title: "Active Policies", 
      value: policies.filter(p => p.status === 'active').length,
      change: "+5 this week",
      icon: Shield,
      color: "text-success"
    },
    {
      title: "Pending Commissions",
      value: `₹${commissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.commissionAmount, 0).toLocaleString()}`,
      change: "2 agents pending",
      icon: DollarSign,
      color: "text-warning"
    },
    {
      title: "Monthly Growth",
      value: "23.4%",
      change: "Premium collection",
      icon: TrendingUp,
      color: "text-info"
    }
  ];

  const recentPolicies = policies.slice(0, 5);
  const pendingExtractions = policies.filter(p => p.extractionStatus === 'pending' || p.extractionStatus === 'processing');

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
                {recentPolicies.map((policy) => (
                  <div key={policy.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{policy.id}</p>
                      <p className="text-sm text-muted-foreground">
                        {policy.customerName} • {policy.type}
                      </p>
                    </div>
                    <StatusChip 
                      variant={
                        policy.status === 'active' ? 'success' :
                        policy.status === 'pending' ? 'warning' : 'destructive'
                      }
                    >
                      {policy.status}
                    </StatusChip>
                  </div>
                ))}
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
                {pendingExtractions.map((policy) => (
                  <div key={policy.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{policy.id}</p>
                      <p className="text-sm text-muted-foreground">
                        {policy.customerName}
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
                ))}
                {pendingExtractions.length === 0 && (
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