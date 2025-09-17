import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface PolicyCommissionDetail {
  policy_id: string;
  policy_number: string;
  customer_name: string;
  product_type: string;
  product_category: string;
  provider: string;
  premium_amount: number;
  base_commission_rate: number;
  reward_commission_rate: number;
  bonus_commission_rate: number;
  total_commission_rate: number;
  insurer_commission: number;
  agent_commission: number;
  misp_commission: number;
  employee_commission: number;
  reporting_employee_commission: number;
  broker_share: number;
  source_type: string;
  source_id: string;
  source_name: string;
  reporting_employee_name?: string;
  commission_status: string;
  policy_start_date: string;
  created_at: string;
}

export function useEnhancedCommissionReportWithDetails() {
  const { profile } = useAuth();
  const [reportData, setReportData] = useState<PolicyCommissionDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateReport = async () => {
    if (!profile?.org_id) return;
    
    setLoading(true);
    try {
      // Use the enhanced comprehensive commission calculation function
      const { data: commissionData, error: commissionError } = await supabase
        .rpc('calculate_enhanced_comprehensive_commission_report', { 
          p_org_id: profile.org_id 
        });

      if (commissionError) throw commissionError;

      // Transform the data to match our interface
      const reportDetails: PolicyCommissionDetail[] = commissionData?.map((item: any) => {
        // Determine source info based on actual policy source type and IDs
        let sourceId = '';
        let sourceName = '';
        let reportingEmployeeName = '';
        let actualSourceType = item.source_type || 'direct';

        // Check actual policy source assignments to determine internal vs external
        if (item.employee_id && !item.agent_id && !item.misp_id) {
          // Internal: Direct employee policy
          actualSourceType = 'employee';
          sourceId = item.employee_id;
          const employeeCode = item.employee_code || item.employee_id;
          const employeeName = item.employee_name || 'Unknown Employee';
          sourceName = `${employeeCode} - ${employeeName}`;
        } else if (item.agent_id) {
          // External: Agent policy
          actualSourceType = 'agent';
          sourceId = item.agent_id;
          const agentCode = item.agent_code || item.agent_id;
          const agentName = item.agent_name || 'Unknown Agent';
          sourceName = `${agentCode} - ${agentName}`;
          reportingEmployeeName = item.employee_name || '';
        } else if (item.misp_id) {
          // External: MISP policy
          actualSourceType = 'misp';
          sourceId = item.misp_id;
          const mispCode = item.misp_code || item.channel_partner_name || item.misp_id;
          const mispName = item.misp_name || item.channel_partner_name || 'Unknown MISP';
          sourceName = `${mispCode} - ${mispName}`;
          reportingEmployeeName = item.employee_name || '';
        } else {
          // Direct policy - no specific source
          actualSourceType = 'direct';
          sourceId = '';
          sourceName = 'Direct Policy';
        }

        return {
          policy_id: item.policy_id,
          policy_number: item.policy_number,
          customer_name: item.customer_name || 'Unknown Customer',
          product_type: item.product_name || 'Unknown Product',
          product_category: item.product_category || 'general',
          provider: item.provider || 'Unknown Provider',
          premium_amount: item.premium_amount || 0,
          base_commission_rate: item.base_commission_rate || 0,
          reward_commission_rate: item.reward_commission_rate || 0,
          bonus_commission_rate: item.bonus_commission_rate || 0,
          total_commission_rate: item.total_commission_rate || 0,
          insurer_commission: item.insurer_commission || 0,
          agent_commission: item.agent_commission || 0,
          misp_commission: item.misp_commission || 0,
          employee_commission: item.employee_commission || 0,
          reporting_employee_commission: item.reporting_employee_commission || 0,
          broker_share: item.broker_share || 0,
          source_type: actualSourceType,
          source_id: sourceId,
          source_name: sourceName,
          reporting_employee_name: reportingEmployeeName,
          commission_status: 'calculated',
          policy_start_date: item.policy_start_date || '',
          created_at: item.calc_date || item.created_at || ''
        };
      }) || [];

      setReportData(reportDetails);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate commission report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateReport();
  }, [profile?.org_id]);

  return {
    reportData,
    loading,
    error,
    generateReport,
    refetch: generateReport
  };
}