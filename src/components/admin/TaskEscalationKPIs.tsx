import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock, TrendingUp, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface TaskKPIData {
  pending_policy_tasks: number;
  overdue_followups: number;
  high_priority_escalations: number;
  total_escalated: number;
  avg_resolution_hours: number;
  sla_breach_percentage: number;
}

export default function TaskEscalationKPIs() {
  const [kpiData, setKpiData] = useState<TaskKPIData>({
    pending_policy_tasks: 0,
    overdue_followups: 0,
    high_priority_escalations: 0,
    total_escalated: 0,
    avg_resolution_hours: 0,
    sla_breach_percentage: 0
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTaskKPIs();
  }, []);

  const fetchTaskKPIs = async () => {
    setLoading(true);
    try {
      // Fetch all tasks data in one query to avoid type issues
      const { data: tasks, error } = await supabase
        .from("tasks")
        .select("*");

      if (error) throw error;

      if (tasks) {
        const now = new Date();
        
        // Calculate KPIs from the fetched data
        const pendingPolicyTasks = tasks.filter(t => 
          t.related_to === "Policy" && t.status === "Open"
        ).length;

        const overdueFollowUps = tasks.filter(t => 
          t.due_date && new Date(t.due_date) < now && 
          (t.status === "Open" || t.status === "In Progress")
        ).length;

        const highPriorityEscalations = tasks.filter(t => 
          t.priority === "High" && t.escalated_at
        ).length;

        const totalEscalated = tasks.filter(t => t.escalated_at).length;

        const totalTasks = tasks.length;
        const slaBreachPercentage = totalTasks > 0 ? 
          Math.round((overdueFollowUps / totalTasks) * 100) : 0;

        setKpiData({
          pending_policy_tasks: pendingPolicyTasks,
          overdue_followups: overdueFollowUps,
          high_priority_escalations: highPriorityEscalations,
          total_escalated: totalEscalated,
          avg_resolution_hours: 24, // Placeholder
          sla_breach_percentage: slaBreachPercentage
        });
      }

    } catch (error) {
      console.error("Error fetching task KPIs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewAll = (filter?: string) => {
    const params = new URLSearchParams();
    if (filter) params.set("filter", filter);
    navigate(`/admin/tasks?${params.toString()}`);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="shadow-card animate-pulse">
            <CardContent className="pt-6">
              <div className="h-16 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-card cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleViewAll("policy")}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Policy Tasks</p>
                <p className="text-2xl font-bold text-primary">{kpiData.pending_policy_tasks}</p>
              </div>
              <Clock className="h-8 w-8 text-primary" />
            </div>
            <div className="mt-3">
              <Button variant="ghost" size="sm" className="text-xs">
                <Eye className="h-3 w-3 mr-1" />
                View All
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleViewAll("overdue")}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overdue Follow-Ups</p>
                <p className="text-2xl font-bold text-destructive">{kpiData.overdue_followups}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <div className="mt-3">
              <Button variant="ghost" size="sm" className="text-xs">
                <Eye className="h-3 w-3 mr-1" />
                View All
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleViewAll("escalated")}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">High-Priority Escalations</p>
                <p className="text-2xl font-bold text-orange-600">{kpiData.high_priority_escalations}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
            <div className="mt-3">
              <Button variant="ghost" size="sm" className="text-xs">
                <Eye className="h-3 w-3 mr-1" />
                View All
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">SLA Breach Rate</p>
                <p className="text-2xl font-bold text-foreground">{kpiData.sla_breach_percentage}%</p>
              </div>
              <div className="flex items-center">
                <Badge variant={kpiData.sla_breach_percentage > 20 ? "destructive" : kpiData.sla_breach_percentage > 10 ? "default" : "secondary"}>
                  {kpiData.sla_breach_percentage > 20 ? "High" : kpiData.sla_breach_percentage > 10 ? "Medium" : "Low"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-lg">Escalation Overview</CardTitle>
            <CardDescription>Current escalation status across all tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Escalated</span>
                <span className="font-semibold">{kpiData.total_escalated}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Avg Resolution Time</span>
                <span className="font-semibold">{kpiData.avg_resolution_hours}h</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Auto-Escalated Today</span>
                <span className="font-semibold">-</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
            <CardDescription>Manage task escalations and SLA settings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start"
                onClick={() => navigate("/admin/settings/escalations")}
              >
                Configure SLA Rules
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start"
                onClick={() => navigate("/admin/reports/escalation-logs")}
              >
                View Escalation Reports
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start"
                onClick={() => handleViewAll("audit")}
              >
                Audit Trail
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}