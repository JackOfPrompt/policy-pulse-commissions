import { BarChart3, Download, Calendar, Filter, TrendingUp, PieChart, FileText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import users from "@/data/users.json";

export default function AdminReports() {
  const user = users.admin;

  const reportCategories = [
    {
      title: "Financial Reports",
      description: "Revenue, commissions, and premium collection reports",
      icon: TrendingUp,
      reports: [
        "Monthly Revenue Report",
        "Commission Payout Summary", 
        "Premium Collection Analysis",
        "Profit & Loss Statement"
      ]
    },
    {
      title: "Policy Reports", 
      description: "Policy performance and customer analytics",
      icon: FileText,
      reports: [
        "Policy Sales Report",
        "Claims Analysis",
        "Policy Renewal Trends",
        "Product Performance"
      ]
    },
    {
      title: "Agent Reports",
      description: "Agent performance and productivity metrics", 
      icon: BarChart3,
      reports: [
        "Agent Performance Report",
        "Sales Leaderboard",
        "Commission Distribution",
        "Agent Productivity Analysis"
      ]
    },
    {
      title: "Customer Reports",
      description: "Customer demographics and behavior insights",
      icon: PieChart, 
      reports: [
        "Customer Acquisition Report",
        "Customer Satisfaction Survey",
        "Demographic Analysis",
        "Customer Lifetime Value"
      ]
    }
  ];

  return (
    <DashboardLayout role="admin" user={user}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Reports</h1>
            <p className="text-muted-foreground">
              Generate and analyze business intelligence reports
            </p>
          </div>
          <div className="flex space-x-2">
            <Select>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Time Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last7days">Last 7 Days</SelectItem>
                <SelectItem value="last30days">Last 30 Days</SelectItem>
                <SelectItem value="last3months">Last 3 Months</SelectItem>
                <SelectItem value="last12months">Last 12 Months</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Calendar className="mr-2 h-4 w-4" />
              Custom Range
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reportCategories.map((category) => {
            const Icon = category.icon;
            return (
              <Card key={category.title}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Icon className="h-5 w-5 text-primary" />
                    <span>{category.title}</span>
                  </CardTitle>
                  <CardDescription>{category.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {category.reports.map((report) => (
                      <div key={report} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                        <span className="font-medium">{report}</span>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline">
                            <Download className="h-4 w-4 mr-1" />
                            Export
                          </Button>
                          <Button size="sm">
                            View
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Quick Analytics</CardTitle>
            <CardDescription>
              Key performance indicators at a glance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">₹2.4M</div>
                <p className="text-sm text-muted-foreground">Total Premium (MTD)</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-success">89%</div>
                <p className="text-sm text-muted-foreground">Policy Renewal Rate</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-info">156</div>
                <p className="text-sm text-muted-foreground">New Policies (MTD)</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-warning">12.5%</div>
                <p className="text-sm text-muted-foreground">Claims Ratio</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}