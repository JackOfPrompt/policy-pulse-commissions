import { Shield, FileText, AlertCircle, Calendar } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { StatusChip } from "@/components/ui/status-chip";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import users from "@/data/users.json";
import policies from "@/data/policies.json";

export default function CustomerDashboard() {
  const user = users.customer;
  const customerPolicies = policies.filter(p => p.customerId === 'CUST-001');

  const stats = [
    {
      title: "Active Policies",
      value: customerPolicies.filter(p => p.status === 'active').length,
      icon: Shield,
      color: "text-success"
    },
    {
      title: "Total Coverage", 
      value: `₹${customerPolicies.reduce((sum, p) => sum + p.coverage, 0).toLocaleString()}`,
      icon: Shield,
      color: "text-primary"
    },
    {
      title: "Annual Premium",
      value: `₹${customerPolicies.reduce((sum, p) => sum + p.premium, 0).toLocaleString()}`,
      icon: FileText,
      color: "text-info"
    }
  ];

  return (
    <DashboardLayout role="customer" user={user}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">My Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {user.name}! Here's your insurance portfolio overview.
            </p>
          </div>
          <Button>
            <FileText className="mr-2 h-4 w-4" />
            Download Statement
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>My Policies</CardTitle>
              <CardDescription>
                Overview of your current insurance coverage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {customerPolicies.map((policy) => {
                  const daysUntilExpiry = Math.ceil(
                    (new Date(policy.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                  );
                  
                  return (
                    <div key={policy.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">{policy.type}</h3>
                        <StatusChip 
                          variant={
                            policy.status === 'active' ? 'success' :
                            policy.status === 'pending' ? 'warning' : 'destructive'
                          }
                        >
                          {policy.status}
                        </StatusChip>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Policy No: {policy.id}
                      </p>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Coverage</p>
                          <p className="font-medium">₹{policy.coverage.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Annual Premium</p>
                          <p className="font-medium">₹{policy.premium.toLocaleString()}</p>
                        </div>
                      </div>
                      {policy.status === 'active' && (
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span>Days until renewal</span>
                            <span className={daysUntilExpiry < 30 ? 'text-warning' : 'text-muted-foreground'}>
                              {daysUntilExpiry} days
                            </span>
                          </div>
                          <Progress 
                            value={Math.max(0, 100 - (daysUntilExpiry / 365) * 100)} 
                            className="h-2"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common tasks and requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="mr-2 h-4 w-4" />
                  Upload Policy Document
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <AlertCircle className="mr-2 h-4 w-4" />
                  File a Claim
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="mr-2 h-4 w-4" />
                  Schedule Consultation
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Shield className="mr-2 h-4 w-4" />
                  Request Policy Change
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Your recent interactions and updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Shield className="h-4 w-4 mt-1 text-success" />
                <div>
                  <p className="text-sm font-medium">Policy Premium Paid</p>
                  <p className="text-xs text-muted-foreground">
                    Health Insurance premium of ₹25,000 paid successfully • 2 days ago
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <FileText className="h-4 w-4 mt-1 text-info" />
                <div>
                  <p className="text-sm font-medium">Document Uploaded</p>
                  <p className="text-xs text-muted-foreground">
                    Medical certificate uploaded for claim processing • 1 week ago
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-4 w-4 mt-1 text-warning" />
                <div>
                  <p className="text-sm font-medium">Renewal Reminder</p>
                  <p className="text-xs text-muted-foreground">
                    Motor insurance expires in 30 days • 2 weeks ago
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}