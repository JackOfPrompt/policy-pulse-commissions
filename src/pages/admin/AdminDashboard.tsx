import { Shield, Users, FileText, DollarSign, TrendingUp, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { PolicyBarChart, PremiumLineChart } from "@/components/charts/PolicyChart";
import { Link } from "react-router-dom";

const adminUser = {
  name: "Rahul Sharma",
  email: "rahul.sharma@mumbaiinsurance.com",
  role: "admin"
};

export default function AdminDashboard() {
  const stats = [
    {
      title: "Total Customers",
      value: "2,847",
      change: "+12.5%",
      icon: Users,
      color: "text-primary"
    },
    {
      title: "Active Policies", 
      value: "1,523",
      change: "+8.2%",
      icon: Shield,
      color: "text-success"
    },
    {
      title: "Total Premium",
      value: "₹4.2Cr",
      change: "+15.7%",
      icon: DollarSign,
      color: "text-info"
    },
    {
      title: "Agents",
      value: "127",
      change: "+3.1%",
      icon: Users,
      color: "text-warning"
    }
  ];

  const recentActivity = [
    {
      title: "New Policy Created",
      description: "Health Insurance policy for Rajesh Sharma",
      time: "2 minutes ago",
      type: "policy"
    },
    {
      title: "Agent Onboarded",
      description: "New agent Sarah Wilson joined Mumbai branch",
      time: "1 hour ago", 
      type: "agent"
    },
    {
      title: "Premium Payment Received",
      description: "₹25,000 received from Priya Patel",
      time: "3 hours ago",
      type: "payment"
    }
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {adminUser.name}! Here's your organization overview.
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild>
              <Link to="/admin/policies">
                <Shield className="mr-2 h-4 w-4" />
                New Policy
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
                  <p className="text-xs text-success mt-1">
                    {stat.change} from last month
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Policy Growth</CardTitle>
              <CardDescription>
                New policies created each month
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PolicyBarChart />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Premium Revenue Trend</CardTitle>
              <CardDescription>
                Monthly premium collection trend
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PremiumLineChart />
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions & Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common administrative tasks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="h-auto p-4" asChild>
                  <Link to="/admin/customers">
                    <div className="flex flex-col items-center space-y-2">
                      <Users className="h-6 w-6" />
                      <span className="text-sm">Customers</span>
                    </div>
                  </Link>
                </Button>
                
                <Button variant="outline" className="h-auto p-4" asChild>
                  <Link to="/admin/policies">
                    <div className="flex flex-col items-center space-y-2">
                      <Shield className="h-6 w-6" />
                      <span className="text-sm">Policies</span>
                    </div>
                  </Link>
                </Button>
                
                <Button variant="outline" className="h-auto p-4" asChild>
                  <Link to="/admin/agents">
                    <div className="flex flex-col items-center space-y-2">
                      <Users className="h-6 w-6" />
                      <span className="text-sm">Agents</span>
                    </div>
                  </Link>
                </Button>
                
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest updates across your organization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      activity.type === 'policy' ? 'bg-success' :
                      activity.type === 'agent' ? 'bg-info' :
                      'bg-warning'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{activity.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {activity.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alerts */}
        <Card className="border-warning/20 bg-warning/5">
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertCircle className="mr-2 h-5 w-5 text-warning" />
              Attention Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm">• 15 policies expiring in the next 30 days</p>
              <p className="text-sm">• 3 agents pending verification</p>
              <p className="text-sm">• 2 claims awaiting approval</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}