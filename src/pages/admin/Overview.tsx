import { useState, useEffect } from "react";
import { CompactDashboardFilters } from "@/components/admin/CompactDashboardFilters";
import { EnhancedKPICards } from "@/components/admin/EnhancedKPICards";
import { PerformanceCharts } from "@/components/admin/PerformanceCharts";
import { FutureProjections } from "@/components/admin/FutureProjections";
import { RenewalsList } from "@/components/admin/RenewalsList";
import { AgentLeaderboard } from "@/components/admin/AgentLeaderboard";
import TaskEscalationKPIs from "@/components/admin/TaskEscalationKPIs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePermissions } from "@/hooks/usePermissions";
import { useRealtimeSystemStats } from "@/hooks/useRealtimeSystemStats";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  TrendingUp, 
  Users, 
  RotateCcw, 
  Target, 
  AlertTriangle,
  Calendar,
  BarChart3,
  PieChart,
  Clock,
  FileCheck,
  XCircle,
  CreditCard,
  ClipboardList
} from "lucide-react";

interface FilterState {
  branchId: string | null;
  startDate: Date | null;
  endDate: Date | null;
  policyType: string | null;
  lineOfBusiness: string | null;
  agentId: string | null;
  productId: string | null;
  providerId: string | null;
}

const Overview = () => {
  const [filters, setFilters] = useState<FilterState>({
    branchId: null,
    startDate: null,
    endDate: null,
    policyType: null,
    lineOfBusiness: null,
    agentId: null,
    productId: null,
    providerId: null
  });

  const [policyStatusCounts, setPolicyStatusCounts] = useState({
    underwriting: 0,
    issued: 0,
    rejected: 0,
    cancelled: 0,
    freeLookCancellation: 0
  });

  const [leadStats, setLeadStats] = useState({
    newLeads: 0,
    inProgress: 0,
    converted: 0,
    conversionRate: 0
  });

  const { role } = usePermissions();
  const { toast } = useToast();
  const { stats: systemStats, loading: systemLoading } = useRealtimeSystemStats();

  useEffect(() => {
    fetchPolicyStatusCounts();
    fetchLeadStats();
  }, [filters]);

  const fetchPolicyStatusCounts = async () => {
    try {
      const { data, error } = await supabase
        .from('policies_new')
        .select('policy_status')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const counts = {
        underwriting: data?.filter(p => p.policy_status === 'Underwriting').length || 0,
        issued: data?.filter(p => p.policy_status === 'Issued').length || 0,
        rejected: data?.filter(p => p.policy_status === 'Rejected').length || 0,
        cancelled: data?.filter(p => p.policy_status === 'Cancelled').length || 0,
        freeLookCancellation: data?.filter(p => p.policy_status === 'Free Look Cancellation').length || 0
      };

      setPolicyStatusCounts(counts);
    } catch (error: any) {
      console.error('Error fetching policy status counts:', error);
    }
  };

  const fetchLeadStats = async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('lead_status');

      if (error) throw error;

      const newLeads = data?.filter(l => l.lead_status === 'New').length || 0;
      const inProgress = data?.filter(l => l.lead_status === 'Contacted').length || 0;
      const converted = data?.filter(l => l.lead_status === 'Converted').length || 0;
      const total = newLeads + inProgress + converted;
      const conversionRate = total > 0 ? Math.round((converted / total) * 100) : 0;

      setLeadStats({
        newLeads,
        inProgress,
        converted,
        conversionRate
      });
    } catch (error: any) {
      console.error('Error fetching lead stats:', error);
    }
  };

  const getRoleBasedWidgets = () => {
    const roleSlug = role?.slug || 'admin';
    
    switch (roleSlug) {
      case 'ops':
      case 'operations':
        return [
          {
            title: "Underwriting Queue",
            count: policyStatusCounts.underwriting,
            icon: Clock,
            color: "text-warning",
            bgColor: "bg-warning/10",
            borderColor: "border-warning/20",
            href: "/admin/policies?status=Underwriting"
          }
        ];
      
      case 'finance':
        return [
          {
            title: "Free Look Cancellations (30d)",
            count: policyStatusCounts.freeLookCancellation,
            icon: XCircle,
            color: "text-destructive",
            bgColor: "bg-destructive/10",
            borderColor: "border-destructive/20",
            href: "/admin/policies?status=Free Look Cancellation"
          },
          {
            title: "Cancelled Policies",
            count: policyStatusCounts.cancelled,
            icon: CreditCard,
            color: "text-muted-foreground",
            bgColor: "bg-muted/10",
            borderColor: "border-muted/20",
            href: "/admin/policies?status=Cancelled"
          }
        ];
      
      case 'manager':
      case 'branch-manager':
        return [
          {
            title: "Rejected Policies",
            count: policyStatusCounts.rejected,
            icon: XCircle,
            color: "text-destructive",
            bgColor: "bg-destructive/10",
            borderColor: "border-destructive/20",
            href: "/admin/policies?status=Rejected"
          }
        ];
      
      case 'agent':
        return [
          {
            title: "My Policy Applications",
            count: policyStatusCounts.underwriting + policyStatusCounts.issued,
            icon: FileCheck,
            color: "text-primary",
            bgColor: "bg-primary/10",
            borderColor: "border-primary/20",
            href: "/admin/policies"
          }
        ];
      
      default: // admin
        return [
          {
            title: "Underwriting Queue",
            count: policyStatusCounts.underwriting,
            icon: Clock,
            color: "text-warning",
            bgColor: "bg-warning/10",
            borderColor: "border-warning/20",
            href: "/admin/policies?status=Underwriting"
          },
          {
            title: "Issued Policies",
            count: policyStatusCounts.issued,
            icon: FileCheck,
            color: "text-success",
            bgColor: "bg-success/10",
            borderColor: "border-success/20",
            href: "/admin/policies?status=Issued"
          },
          {
            title: "Rejected Policies",
            count: policyStatusCounts.rejected,
            icon: XCircle,
            color: "text-destructive",
            bgColor: "bg-destructive/10",
            borderColor: "border-destructive/20",
            href: "/admin/policies?status=Rejected"
          }
        ];
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Compact Filters */}
      <CompactDashboardFilters filters={filters} onFiltersChange={setFilters} />

      <div className="p-6 space-y-8">

        {/* Role-Based Policy Status Widgets */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">Policy Status Overview</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {getRoleBasedWidgets().map((widget, index) => {
              const IconComponent = widget.icon;
              return (
                <Card key={index} className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${widget.borderColor} border`}>
                  <CardContent className="p-4">
                    <a href={widget.href} className="block">
                      <div className={`p-3 sm:p-4 rounded-lg ${widget.bgColor} ${widget.borderColor} border`}>
                        <div className="flex items-center justify-between">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">{widget.title}</p>
                            <p className={`text-xl sm:text-2xl lg:text-3xl font-bold ${widget.color} break-all`}>{widget.count}</p>
                          </div>
                          <IconComponent className={`h-6 w-6 sm:h-8 sm:w-8 ${widget.color} flex-shrink-0 ml-2`} />
                        </div>
                      </div>
                    </a>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Task Escalation & SLA Monitoring */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">Task Escalation & SLA Monitoring</h2>
          </div>
          <TaskEscalationKPIs />
        </section>

        {/* 1. Business Performance KPIs */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">Business Performance KPIs</h2>
          </div>
          <EnhancedKPICards filters={filters} />
        </section>

        {/* 2. Agent & Branch Performance */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">Agent & Branch Performance</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Top Performing Agents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AgentLeaderboard filters={filters} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-4 w-4" />
                  Branch Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PerformanceCharts filters={filters} />
              </CardContent>
            </Card>
          </div>
        </section>

        {/* 3. Renewals & Leads */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">Renewals & Leads</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Upcoming Renewals This Week</CardTitle>
              </CardHeader>
              <CardContent>
                <RenewalsList filters={filters} showWeekOnly={true} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Lead Conversion Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">New Leads</span>
                  <Badge variant="outline">{leadStats.newLeads}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">In Progress</span>
                  <Badge variant="secondary">{leadStats.inProgress}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Converted</span>
                  <Badge variant="default">{leadStats.converted}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Conversion Rate</span>
                  <Badge variant="outline" className="text-primary">{leadStats.conversionRate}%</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* 4. Future Business Forecast */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">Future Business Forecast</h2>
          </div>
          <FutureProjections filters={filters} />
        </section>

        {/* 5. Risk & Expiry Watchlist */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <h2 className="text-xl font-semibold text-foreground">Risk & Expiry Watchlist</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-destructive">Policies Expiring Next 15 Days</CardTitle>
              </CardHeader>
              <CardContent>
                <RenewalsList filters={filters} showWeekOnly={false} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Low Performance Alerts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    <span className="text-sm font-medium">Low Conversion Branches</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">2 branches below 20% conversion rate</p>
                </div>
                <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-warning" />
                    <span className="text-sm font-medium">Pending Commissions</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">₹2,45,000 pending for 3+ weeks</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Overview;