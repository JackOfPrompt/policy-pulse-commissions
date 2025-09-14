import { Shield, FileText, AlertCircle, Calendar, Users, Clock, TrendingUp, Upload } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { StatusChip } from "@/components/ui/status-chip";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import customerData from "@/data/customer/customerData.json";
import policies from "@/data/customer/policies.json";

export default function CustomerDashboard() {
  const user = customerData;
  const customerPolicies = policies;

  const activePolicies = customerPolicies.filter(p => p.status === 'active');
  const renewalDuePolicies = customerPolicies.filter(p => p.status === 'renewal_due');
  const totalCoverage = customerPolicies.reduce((sum, p) => sum + p.coverage, 0);
  const totalPremium = customerPolicies.reduce((sum, p) => sum + p.premium, 0);

  const stats = [
    {
      title: "Active Policies",
      value: activePolicies.length,
      icon: Shield,
      color: "text-success",
      description: "Currently active"
    },
    {
      title: "Renewal Due", 
      value: renewalDuePolicies.length,
      icon: Clock,
      color: "text-warning",
      description: "Require attention"
    },
    {
      title: "Total Coverage",
      value: `₹${(totalCoverage / 100000).toFixed(1)}L`,
      icon: TrendingUp,
      color: "text-info",
      description: "Sum insured"
    },
    {
      title: "Annual Premium",
      value: `₹${(totalPremium / 1000).toFixed(0)}K`,
      icon: FileText,
      color: "text-primary",
      description: "Total premium"
    }
  ];

  const getTimelineColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-success';
      case 'renewal_due': return 'text-warning'; 
      case 'expired': return 'text-muted-foreground';
      default: return 'text-muted-foreground';
    }
  };

  const getDaysUntilRenewal = (renewalDate: string) => {
    const days = Math.ceil((new Date(renewalDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  return (
    <DashboardLayout role="customer" user={user}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">My Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {user.name}! Here's your insurance portfolio overview.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button asChild>
              <Link to="/customer/docs">
                <Upload className="mr-2 h-4 w-4" />
                Upload Documents
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/customer/policies">
                <FileText className="mr-2 h-4 w-4" />
                View All Policies
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => {
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
                  <p className="text-xs text-muted-foreground mt-1">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Policy Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Renewals & Activity</CardTitle>
              <CardDescription>
                Track your policy renewals and recent activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {customerPolicies
                  .sort((a, b) => new Date(a.renewalDue).getTime() - new Date(b.renewalDue).getTime())
                  .map((policy) => {
                    const daysUntilRenewal = getDaysUntilRenewal(policy.renewalDue);
                    const isUrgent = daysUntilRenewal <= 30 && daysUntilRenewal > 0;
                    
                    return (
                      <div key={policy.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                        <div className={`w-2 h-2 rounded-full mt-2 ${getTimelineColor(policy.status)}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-medium truncate">{policy.productType}</p>
                            <StatusChip 
                              variant={
                                policy.status === 'active' ? 'success' :
                                policy.status === 'renewal_due' ? 'warning' : 'secondary'
                              }
                            >
                              {policy.status === 'renewal_due' ? 'renewal due' : policy.status}
                            </StatusChip>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">
                            {policy.insurer} • {policy.policyNumber}
                          </p>
                          {policy.status === 'active' && (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-xs">
                                <span className={isUrgent ? 'text-warning' : 'text-muted-foreground'}>
                                  {daysUntilRenewal > 0 
                                    ? `Renews in ${daysUntilRenewal} days`
                                    : `Expired ${Math.abs(daysUntilRenewal)} days ago`
                                  }
                                </span>
                                <span className="text-muted-foreground">
                                  ₹{policy.premium.toLocaleString()}
                                </span>
                              </div>
                              <Progress 
                                value={Math.max(0, Math.min(100, 100 - (daysUntilRenewal / 365) * 100))} 
                                className="h-2"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common tasks and requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3">
                <Button variant="outline" className="w-full justify-start h-auto p-4" asChild>
                  <Link to="/customer/docs">
                    <div className="flex items-center">
                      <Upload className="mr-3 h-5 w-5" />
                      <div className="text-left">
                        <div className="font-medium">Upload Document</div>
                        <div className="text-xs text-muted-foreground">KYC, Policy, or Claim documents</div>
                      </div>
                    </div>
                  </Link>
                </Button>
                
                <Button variant="outline" className="w-full justify-start h-auto p-4">
                  <div className="flex items-center">
                    <AlertCircle className="mr-3 h-5 w-5" />
                    <div className="text-left">
                      <div className="font-medium">File a Claim</div>
                      <div className="text-xs text-muted-foreground">Submit new insurance claim</div>
                    </div>
                  </div>
                </Button>
                
                <Button variant="outline" className="w-full justify-start h-auto p-4">
                  <div className="flex items-center">
                    <Calendar className="mr-3 h-5 w-5" />
                    <div className="text-left">
                      <div className="font-medium">Schedule Consultation</div>
                      <div className="text-xs text-muted-foreground">Book appointment with agent</div>
                    </div>
                  </div>
                </Button>
                
                <Button variant="outline" className="w-full justify-start h-auto p-4" asChild>
                  <Link to="/customer/policies">
                    <div className="flex items-center">
                      <Shield className="mr-3 h-5 w-5" />
                      <div className="text-left">
                        <div className="font-medium">Renew Policy</div>
                        <div className="text-xs text-muted-foreground">Renew existing policies</div>
                      </div>
                    </div>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
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
                <div className="w-2 h-2 rounded-full bg-success mt-2" />
                <div>
                  <p className="text-sm font-medium">Policy Premium Paid</p>
                  <p className="text-xs text-muted-foreground">
                    Health Insurance premium of ₹25,000 paid successfully • 2 days ago
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 rounded-full bg-info mt-2" />
                <div>
                  <p className="text-sm font-medium">Document Uploaded</p>
                  <p className="text-xs text-muted-foreground">
                    Medical certificate uploaded for claim processing • 1 week ago
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 rounded-full bg-warning mt-2" />
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