import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface RealtimeStats {
  totalPolicies: number;
  totalPremium: number;
  totalAgents: number;
  totalEmployees: number;
  totalBranches: number;
  activeTasks: number;
  pendingLeads: number;
  lastUpdated: string;
}

export const useRealtimeSystemStats = () => {
  const [stats, setStats] = useState<RealtimeStats>({
    totalPolicies: 0,
    totalPremium: 0,
    totalAgents: 0,
    totalEmployees: 0,
    totalBranches: 0,
    activeTasks: 0,
    pendingLeads: 0,
    lastUpdated: new Date().toISOString(),
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSystemStats();

    // Set up real-time subscriptions for all major tables
    const policyChannel = supabase
      .channel('system-policy-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'policies_new' }, handleDataChange)
      .subscribe();

    const agentChannel = supabase
      .channel('system-agent-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'agents' }, handleDataChange)
      .subscribe();

    const employeeChannel = supabase
      .channel('system-employee-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'employees' }, handleDataChange)
      .subscribe();

    const taskChannel = supabase
      .channel('system-task-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, handleDataChange)
      .subscribe();

    const leadChannel = supabase
      .channel('system-lead-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, handleDataChange)
      .subscribe();

    return () => {
      supabase.removeChannel(policyChannel);
      supabase.removeChannel(agentChannel);
      supabase.removeChannel(employeeChannel);
      supabase.removeChannel(taskChannel);
      supabase.removeChannel(leadChannel);
    };
  }, []);

  const handleDataChange = () => {
    console.log('System data changed, refreshing stats...');
    fetchSystemStats();
  };

  const fetchSystemStats = async () => {
    try {
      setLoading(true);

      // Parallel queries for better performance
      const [
        { count: policiesCount },
        { data: premiumData },
        { count: agentsCount },
        { count: employeesCount },
        { count: branchesCount },
        { count: tasksCount },
        { count: leadsCount },
      ] = await Promise.all([
        supabase.from('policies_new').select('*', { count: 'exact', head: true }),
        supabase.from('policies_new').select('premium_amount'),
        supabase.from('agents').select('*', { count: 'exact', head: true }).eq('status', 'Active'),
        supabase.from('employees').select('*', { count: 'exact', head: true }).eq('status', 'Active'),
        supabase.from('branches').select('*', { count: 'exact', head: true }).eq('status', 'Active'),
        supabase.from('tasks').select('*', { count: 'exact', head: true }).in('status', ['Open', 'In Progress']),
        supabase.from('leads').select('*', { count: 'exact', head: true }).in('lead_status', ['New', 'Contacted']),
      ]);

      const totalPremium = premiumData?.reduce((sum, policy) => sum + (policy.premium_amount || 0), 0) || 0;

      setStats({
        totalPolicies: policiesCount || 0,
        totalPremium,
        totalAgents: agentsCount || 0,
        totalEmployees: employeesCount || 0,
        totalBranches: branchesCount || 0,
        activeTasks: tasksCount || 0,
        pendingLeads: leadsCount || 0,
        lastUpdated: new Date().toISOString(),
      });

    } catch (error) {
      console.error('Error fetching system stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    stats,
    loading,
    refresh: fetchSystemStats,
  };
};