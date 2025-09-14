import { Users, Shield, Clock, CheckCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { StatusChip } from "@/components/ui/status-chip";
import { Button } from "@/components/ui/button";
import users from "@/data/users.json";
import policies from "@/data/policies.json";
import customers from "@/data/customers.json";

export default function EmployeeDashboard() {
  const user = users.employee;

  const stats = [
    {
      title: "Customers Assigned",
      value: "84",
      change: "Active accounts",
      icon: Users,
      color: "text-primary"
    },
    {
      title: "Policies Processed", 
      value: "23",
      change: "This month",
      icon: Shield,
      color: "text-success"
    },
    {
      title: "Pending Tasks",
      value: "7",
      change: "Require attention",
      icon: Clock,
      color: "text-warning"
    },
    {
      title: "Completed Today",
      value: "12",
      change: "Tasks finished",
      icon: CheckCircle,
      color: "text-info"
    }
  ];

  const recentCustomers = customers.slice(0, 4);
  const pendingPolicies = policies.filter(p => p.status === 'pending').slice(0, 5);

  return (
    <DashboardLayout role="employee" user={user}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Employee Dashboard</h1>
            <p className="text-muted-foreground">
              Manage customer accounts and process policy applications
            </p>
          </div>
          <Button>
            <Users className="mr-2 h-4 w-4" />
            New Customer
          </Button>
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
              <CardTitle>Recent Customers</CardTitle>
              <CardDescription>
                Customers you've worked with recently
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentCustomers.map((customer) => (
                  <div key={customer.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{customer.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {customer.policies.length} policies • Joined {new Date(customer.joinDate).toLocaleDateString()}
                      </p>
                    </div>
                    <StatusChip 
                      variant={customer.status === 'active' ? 'success' : 'secondary'}
                    >
                      {customer.status}
                    </StatusChip>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pending Policy Reviews</CardTitle>
              <CardDescription>
                Applications awaiting your review
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingPolicies.map((policy) => (
                  <div key={policy.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{policy.id}</p>
                      <p className="text-sm text-muted-foreground">
                        {policy.customerName} • {policy.type}
                      </p>
                    </div>
                    <Button size="sm" variant="outline">
                      Review
                    </Button>
                  </div>
                ))}
                {pendingPolicies.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No pending reviews
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}