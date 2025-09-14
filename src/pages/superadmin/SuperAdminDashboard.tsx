import { Building2, Users, DollarSign, TrendingUp, AlertTriangle, Shield } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { StatusChip } from "@/components/ui/status-chip";
import { PremiumLineChart } from "@/components/charts/PolicyChart";
import { Link } from "react-router-dom";

const superAdminUser = {
  name: "System Administrator",
  email: "admin@insuretech.com", 
  role: "superadmin"
};

export default function SuperAdminDashboard() {
  const platformStats = [
    {
      title: "Total Organizations",
      value: "124",
      change: "+8",
      icon: Building2,
      color: "text-primary"
    },
    {
      title: "Total Users",
      value: "15,847",
      change: "+342",
      icon: Users,
      color: "text-success"
    },
    {
      title: "Platform Revenue",
      value: "$2.4M",
      change: "+18.5%",
      icon: DollarSign,
      color: "text-info"
    },
    {
      title: "Active Subscriptions",
      value: "98",
      change: "+12",
      icon: TrendingUp,
      color: "text-warning"
    }
  ];

  const recentOrganizations = [
    {
      name: "Mumbai Insurance Corp",
      plan: "Enterprise",
      status: "active",
      users: 1250,
      joinedDate: "2024-01-15"
    },
    {
      name: "Delhi General Insurance",
      plan: "Professional", 
      status: "active",
      users: 850,
      joinedDate: "2024-01-18"
    },
    {
      name: "Bangalore Life Insurance",
      plan: "Starter",
      status: "trial",
      users: 120,
      joinedDate: "2024-01-20"
    }
  ];

  const systemAlerts = [
    {
      type: "warning",
      title: "High Server Load",
      message: "CPU usage above 85% on production server",
      time: "5 minutes ago"
    },
    {
      type: "info", 
      title: "New Organization Signup",
      message: "Chennai Insurance Limited signed up for Enterprise plan",
      time: "2 hours ago"
    },
    {
      type: "success",
      title: "Backup Completed",
      message: "Daily system backup completed successfully",
      time: "6 hours ago"
    }
  ];

  return (
    <DashboardLayout role="superadmin" user={superAdminUser}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Platform Dashboard</h1>
            <p className="text-muted-foreground">
              System-wide analytics and management overview
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild>
              <Link to="/superadmin/orgs">
                <Building2 className="mr-2 h-4 w-4" />
                Add Organization
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/superadmin/audit">
                <Shield className="mr-2 h-4 w-4" />
                System Logs
              </Link>
            </Button>
          </div>
        </div>

        {/* Platform Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {platformStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title} className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-success mt-1">
                    {stat.change} this month
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Platform Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Platform Revenue Growth</CardTitle>
            <CardDescription>
              Monthly recurring revenue from all subscriptions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PremiumLineChart />
          </CardContent>
        </Card>

        {/* Organizations & System Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Organizations */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Organizations</CardTitle>
              <CardDescription>
                Latest organizations that joined the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentOrganizations.map((org, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{org.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {org.users} users • Joined {new Date(org.joinedDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <StatusChip variant={org.status === 'active' ? 'success' : 'warning'}>
                        {org.status}
                      </StatusChip>
                      <span className="text-xs text-muted-foreground">{org.plan}</span>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4" asChild>
                <Link to="/superadmin/orgs">
                  View All Organizations
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* System Alerts */}
          <Card>
            <CardHeader>
              <CardTitle>System Alerts</CardTitle>
              <CardDescription>
                Important system notifications and updates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {systemAlerts.map((alert, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 border rounded-lg">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      alert.type === 'warning' ? 'bg-warning' :
                      alert.type === 'success' ? 'bg-success' :
                      'bg-info'
                    }`} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium">{alert.title}</p>
                        <StatusChip variant={
                          alert.type === 'warning' ? 'warning' :
                          alert.type === 'success' ? 'success' : 'info'
                        }>
                          {alert.type}
                        </StatusChip>
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">
                        {alert.message}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {alert.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Platform Management</CardTitle>
            <CardDescription>
              Quick access to platform administration tools
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button variant="outline" className="h-auto p-4" asChild>
                <Link to="/superadmin/orgs">
                  <div className="flex flex-col items-center space-y-2">
                    <Building2 className="h-6 w-6" />
                    <span className="text-sm">Organizations</span>
                  </div>
                </Link>
              </Button>
              
              <Button variant="outline" className="h-auto p-4" asChild>
                <Link to="/superadmin/users">
                  <div className="flex flex-col items-center space-y-2">
                    <Users className="h-6 w-6" />
                    <span className="text-sm">Users</span>
                  </div>
                </Link>
              </Button>
              
              <Button variant="outline" className="h-auto p-4" asChild>
                <Link to="/superadmin/plans">
                  <div className="flex flex-col items-center space-y-2">
                    <DollarSign className="h-6 w-6" />
                    <span className="text-sm">Plans</span>
                  </div>
                </Link>
              </Button>
              
              <Button variant="outline" className="h-auto p-4" asChild>
                <Link to="/superadmin/audit">
                  <div className="flex flex-col items-center space-y-2">
                    <Shield className="h-6 w-6" />
                    <span className="text-sm">Audit Logs</span>
                  </div>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* System Health */}
        <Card className="border-success/20 bg-success/5">
          <CardHeader>
            <CardTitle className="flex items-center text-success">
              <Shield className="mr-2 h-5 w-5" />
              System Status: Operational
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">API Response</p>
                <p className="font-medium text-success">142ms avg</p>
              </div>
              <div>
                <p className="text-muted-foreground">Uptime</p>
                <p className="font-medium text-success">99.9%</p>
              </div>
              <div>
                <p className="text-muted-foreground">Database</p>
                <p className="font-medium text-success">Healthy</p>
              </div>
              <div>
                <p className="text-muted-foreground">Storage</p>
                <p className="font-medium text-success">68% used</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}