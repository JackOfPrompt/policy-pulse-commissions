import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface LeadStats {
  total: number;
  new: number;
  contacted: number;
  converted: number;
  dropped: number;
  followUpDueToday: number;
  conversionRate: number;
}

interface LeadData {
  id: string;
  lead_number: string;
  full_name: string;
  phone_number: string;
  lead_status: string;
  line_of_business: string;
  next_follow_up_date: string | null;
  created_at: string;
  priority: string;
}

export const useLeadsDashboard = (userRole: string) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<LeadStats>({
    total: 0,
    new: 0,
    contacted: 0,
    converted: 0,
    dropped: 0,
    followUpDueToday: 0,
    conversionRate: 0,
  });
  const [leads, setLeads] = useState<LeadData[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchLeadsData();
      
      // Set up real-time subscription
      const channel = supabase
        .channel('leads-dashboard-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'leads'
          },
          () => {
            console.log('Leads data changed, refreshing...');
            fetchLeadsData();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user?.id, userRole]);

  const fetchLeadsData = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase.from('leads').select('*');

      if (userRole === 'Employee') {
        // Employee: Get leads assigned to them or their branch
        const { data: employee } = await supabase
          .from('employees')
          .select('id, branch_id')
          .eq('user_id', user?.id)
          .single();

        if (employee) {
          query = query.or(`assigned_to_id.eq.${employee.id},branch_id.eq.${employee.branch_id}`);
        }
      } else if (userRole === 'Agent') {
        // Agent: Get only leads assigned to them
        const { data: agent } = await supabase
          .from('agents')
          .select('id')
          .eq('user_id', user?.id)
          .single();

        if (agent) {
          query = query.eq('assigned_to_id', agent.id).eq('assigned_to_type', 'Agent');
        }
      }

      const { data: leadsData, error: leadsError } = await query
        .order('created_at', { ascending: false });

      if (leadsError) {
        throw new Error('Failed to fetch leads');
      }

      // Calculate stats
      const total = leadsData?.length || 0;
      const statusCounts = leadsData?.reduce((acc, lead) => {
        const status = lead.lead_status;
        acc[status.toLowerCase()] = (acc[status.toLowerCase()] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const today = new Date().toISOString().split('T')[0];
      const followUpDueToday = leadsData?.filter(lead => 
        lead.next_follow_up_date === today
      ).length || 0;

      const conversionRate = total > 0 ? ((statusCounts.converted || 0) / total) * 100 : 0;

      setStats({
        total,
        new: statusCounts.new || 0,
        contacted: statusCounts.contacted || 0,
        converted: statusCounts.converted || 0,
        dropped: statusCounts.dropped || 0,
        followUpDueToday,
        conversionRate,
      });

      setLeads(leadsData || []);

    } catch (err) {
      console.error('Error fetching leads data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch leads data');
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    stats,
    leads,
    refreshData: fetchLeadsData,
  };
};