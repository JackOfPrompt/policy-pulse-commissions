import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ComprehensiveCommissionReport {
  policy_id: string;
  policy_number: string;
  product_category: string;
  product_name: string;
  plan_name: string;
  provider: string;
  source_type: string;
  grid_table: string;
  grid_id: string;
  // Using commission_rate and reward_rate directly from payout grids
  bonus_commission_rate: number;
  total_commission_rate: number;
  insurer_commission: number;
  agent_commission: number;
  misp_commission: number;
  employee_commission: number;
  reporting_employee_commission: number;
  broker_share: number;
  calc_date: string;
}

export function useComprehensiveCommissionReport() {
  const [data, setData] = useState<ComprehensiveCommissionReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const generateReport = async (orgId?: string) => {
    try {
      setLoading(true);
      setError(null);

      // Get current user's org if not provided
      let currentOrgId = orgId;
      if (!currentOrgId) {
        const { data: userData } = await supabase.auth.getUser();
        if (userData.user) {
          const { data: userOrgData } = await supabase
            .from('user_organizations')
            .select('org_id')
            .eq('user_id', userData.user.id)
            .single();
          currentOrgId = userOrgData?.org_id;
        }
      }

      // Calculate commissions directly instead of using the RPC
      const { data: policies, error: policiesError } = await supabase
        .from('policies')
        .select(`
          *,
          customers!policies_customer_id_fkey(first_name, last_name),
          agents!policies_agent_id_fkey(agent_name, commission_tier_id),
          employees!policies_employee_id_fkey(name),
          misps!policies_misp_id_fkey(channel_partner_name),
          product_types(name, category)
        `)
        .eq('org_id', currentOrgId)
        .eq('policy_status', 'active');

      if (policiesError) throw policiesError;

      const reportData = [];
      
      for (const policy of policies || []) {
        const premium = policy.premium_with_gst || policy.premium_without_gst || policy.gross_premium || 0;
        const productName = policy.product_types?.name || '';
        const productCategory = policy.product_types?.category || '';
        
        let matchedGrid = null;
        let gridTable = '';
        let baseCommissionRate = 0;
        let rewardRate = 0;
        let bonusRate = 0;
        let gridId = '';

        // Match with payout grids
        if (productName.toLowerCase().includes('motor')) {
          const { data: motorGrids } = await supabase
            .from('motor_payout_grid')
            .select('*')
            .eq('org_id', currentOrgId)
            .eq('is_active', true)
            .or(`provider.ilike.%${policy.provider || ''}%,provider.is.null`)
            .limit(1);

          if (motorGrids?.[0]) {
            matchedGrid = motorGrids[0];
            gridTable = 'motor_payout_grid';
            baseCommissionRate = matchedGrid.commission_rate;
            rewardRate = matchedGrid.reward_rate || 0;
            bonusRate = matchedGrid.bonus_commission_rate || 0;
            gridId = matchedGrid.id;
          }
        } else if (productName.toLowerCase().includes('life')) {
          const { data: lifeGrids } = await supabase
            .from('life_payout_grid')
            .select('*')
            .eq('org_id', currentOrgId)
            .eq('is_active', true)
            .or(`provider.ilike.%${policy.provider || ''}%,provider.is.null`)
            .limit(1);

          if (lifeGrids?.[0]) {
            matchedGrid = lifeGrids[0];
            gridTable = 'life_payout_grid';
            baseCommissionRate = matchedGrid.commission_rate;
            rewardRate = matchedGrid.reward_rate || 0;
            bonusRate = matchedGrid.bonus_commission_rate || 0;
            gridId = matchedGrid.id;
          }
        } else if (productName.toLowerCase().includes('health')) {
          const { data: healthGrids } = await supabase
            .from('health_payout_grid')
            .select('*')
            .eq('org_id', currentOrgId)
            .eq('is_active', true)
            .or(`provider.ilike.%${policy.provider || ''}%,provider.is.null`)
            .limit(1);

          if (healthGrids?.[0]) {
            matchedGrid = healthGrids[0];
            gridTable = 'health_payout_grid';
            baseCommissionRate = healthGrids[0].commission_rate;
            rewardRate = healthGrids[0].reward_rate || 0;
            bonusRate = healthGrids[0].bonus_commission_rate || 0;
            gridId = healthGrids[0].id;
          }
        }

        // Calculate total commissions
        const totalCommissionRate = baseCommissionRate + rewardRate + bonusRate;
        const insurerCommission = premium * totalCommissionRate / 100;
        
        let agentCommission = 0;
        let mispCommission = 0;
        let employeeCommission = 0;
        let reportingEmployeeCommission = 0;
        let brokerShare = insurerCommission;
        
        let agentName = '';
        let employeeName = '';
        let mispName = '';

        // Calculate distributions based on source
        if (policy.source_type === 'agent' && policy.agents) {
          agentName = policy.agents.agent_name;
          let agentSharePercentage = 40; // Default Bronze tier
          
          if (policy.agents.commission_tier_id) {
            const { data: tier } = await supabase
              .from('commission_tiers')
              .select('base_percentage')
              .eq('id', policy.agents.commission_tier_id)
              .single();
            
            if (tier) {
              agentSharePercentage = tier.base_percentage;
            }
          }
          
          agentCommission = insurerCommission * agentSharePercentage / 100;
          brokerShare = insurerCommission - agentCommission;
        } else if (policy.source_type === 'employee' && policy.employees) {
          employeeName = policy.employees.name;
          const employeeSharePercentage = 60; // Default employee share
          employeeCommission = insurerCommission * employeeSharePercentage / 100;
          brokerShare = insurerCommission - employeeCommission;
        } else if (policy.source_type === 'misp' && policy.misps) {
          mispName = policy.misps.channel_partner_name;
          const mispSharePercentage = 50; // Default MISP share
          mispCommission = insurerCommission * mispSharePercentage / 100;
          brokerShare = insurerCommission - mispCommission;
        }

        const customerName = policy.customers 
          ? `${policy.customers.first_name || ''} ${policy.customers.last_name || ''}`.trim()
          : 'Unknown Customer';

        reportData.push({
          policy_id: policy.id,
          policy_number: policy.policy_number,
          product_category: productCategory,
          product_name: productName,
          plan_name: policy.plan_name || '',
          provider: policy.provider || '',
          source_type: policy.source_type || 'direct',
          agent_name: agentName,
          employee_name: employeeName,
          misp_name: mispName,
          commission_rate: baseCommissionRate,
          reward_rate: rewardRate,
          bonus_commission_rate: bonusRate,
          total_commission_rate: totalCommissionRate,
          insurer_commission: insurerCommission,
          agent_commission: agentCommission,
          misp_commission: mispCommission,
          employee_commission: employeeCommission,
          reporting_employee_commission: reportingEmployeeCommission,
          broker_share: brokerShare,
          grid_id: gridId,
          grid_table: gridTable,
          calc_date: new Date().toISOString()
        });
      }

      setData(reportData || []);
      
      if (reportData?.length > 0) {
        toast({
          title: "Commission Report Generated",
          description: `Generated commission report for ${reportData.length} policies`,
        });
      } else {
        toast({
          title: "No Commission Data",
          description: "No policies with matching commission grids found. Please set up commission grids first.",
          variant: "destructive",
        });
      }

      return reportData || [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate commission report';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  const calculateSinglePolicy = async (policyId: string) => {
    try {
      setLoading(true);
      setError(null);

      // Calculate commissions for single policy
      const { data: policy, error: policyError } = await supabase
        .from('policies')
        .select(`
          *,
          customers!policies_customer_id_fkey(first_name, last_name),
          agents!policies_agent_id_fkey(agent_name, commission_tier_id),
          employees!policies_employee_id_fkey(name),
          misps!policies_misp_id_fkey(channel_partner_name),
          product_types(name, category)
        `)
        .eq('id', policyId)
        .single();

      if (policyError || !policy) throw new Error('Policy not found');

      // Get policy org_id for grid lookup
      const orgId = policy.org_id;
      const premium = policy.premium_with_gst || policy.premium_without_gst || policy.gross_premium || 0;
      const productName = policy.product_types?.name || '';
      
      let baseCommissionRate = 0;
      let rewardRate = 0;
      let bonusRate = 0;
      let gridTable = '';
      let gridId = '';

      // Match with payout grids
      if (productName.toLowerCase().includes('motor')) {
        const { data: motorGrids } = await supabase
          .from('motor_payout_grid')
          .select('*')
          .eq('org_id', orgId)
          .eq('is_active', true)
          .or(`provider.ilike.%${policy.provider || ''}%,provider.is.null`)
          .limit(1);

        if (motorGrids?.[0]) {
          const grid = motorGrids[0];
          gridTable = 'motor_payout_grid';
          baseCommissionRate = grid.commission_rate;
          rewardRate = grid.reward_rate || 0;
          bonusRate = grid.bonus_commission_rate || 0;
          gridId = grid.id;
        }
      } else if (productName.toLowerCase().includes('life')) {
        const { data: lifeGrids } = await supabase
          .from('life_payout_grid')
          .select('*')
          .eq('org_id', orgId)
          .eq('is_active', true)
          .or(`provider.ilike.%${policy.provider || ''}%,provider.is.null`)
          .limit(1);

        if (lifeGrids?.[0]) {
          const grid = lifeGrids[0];
          gridTable = 'life_payout_grid';
          baseCommissionRate = grid.commission_rate;
          rewardRate = grid.reward_rate || 0;
          bonusRate = grid.bonus_commission_rate || 0;
          gridId = grid.id;
        }
      }

      const totalCommissionRate = baseCommissionRate + rewardRate + bonusRate;
      const insurerCommission = premium * totalCommissionRate / 100;
      
      let agentCommission = 0;
      let brokerShare = insurerCommission;
      
      if (policy.source_type === 'agent' && policy.agents) {
        let agentSharePercentage = 40; // Default Bronze tier
        
        if (policy.agents.commission_tier_id) {
          const { data: tier } = await supabase
            .from('commission_tiers')
            .select('base_percentage')
            .eq('id', policy.agents.commission_tier_id)
            .single();
          
          if (tier) {
            agentSharePercentage = tier.base_percentage;
          }
        }
        
        agentCommission = insurerCommission * agentSharePercentage / 100;
        brokerShare = insurerCommission - agentCommission;
      }

      const result = {
        policy_id: policy.id,
        policy_number: policy.policy_number,
        product_category: policy.product_types?.category || '',
        product_name: productName,
        plan_name: policy.plan_name || '',
        provider: policy.provider || '',
        source_type: policy.source_type || 'direct',
        base_commission_rate: baseCommissionRate,
        reward_commission_rate: rewardRate,
        bonus_commission_rate: bonusRate,
        total_commission_rate: totalCommissionRate,
        insurer_commission: insurerCommission,
        agent_commission: agentCommission,
        misp_commission: 0,
        employee_commission: 0,
        reporting_employee_commission: 0,
        broker_share: brokerShare,
        grid_id: gridId,
        grid_table: gridTable,
        calc_date: new Date().toISOString()
      };
      if (result) {
        toast({
          title: "Commission Calculated",
          description: `Total Rate: ${result.total_commission_rate.toFixed(2)}% (₹${result.insurer_commission?.toLocaleString() || '0'})`,
        });
      }

      return result || null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to calculate policy commission';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const syncCommissions = async (orgId?: string) => {
    try {
      setLoading(true);
      setError(null);

      // First generate the report data using our updated logic
      const reportData = await generateReport(orgId);
      
      if (reportData && reportData.length > 0) {
        // Save calculated commissions to history tables
        for (const item of reportData) {
          // Save to agent commission history if agent involved
          if (item.agent_commission > 0 && item.policy_id) {
            await supabase
              .from('agent_commission_history')
              .upsert({
                policy_id: item.policy_id,
                org_id: orgId || data[0]?.policy_id ? (await supabase.from('policies').select('org_id').eq('id', item.policy_id).single()).data?.org_id : null,
                agent_id: (await supabase.from('policies').select('agent_id').eq('id', item.policy_id).single()).data?.agent_id,
                total_commission_rate: item.total_commission_rate,
                base_commission_rate: item.base_commission_rate,
                reward_commission_rate: item.reward_commission_rate,
                bonus_commission_rate: item.bonus_commission_rate,
                commission_amount: item.agent_commission,
                commission_percentage: item.base_commission_rate,
                applied_grid_id: item.grid_id,
                applied_grid_table: item.grid_table,
                used_override: false,
                is_reporting_employee_applied: false
              }, {
                onConflict: 'policy_id,agent_id'
              });
          }
          
          // Save to employee commission history if employee involved
          if (item.employee_commission > 0 && item.policy_id) {
            await supabase
              .from('employee_commission_history')
              .upsert({
                policy_id: item.policy_id,
                org_id: orgId || data[0]?.policy_id ? (await supabase.from('policies').select('org_id').eq('id', item.policy_id).single()).data?.org_id : null,
                employee_id: (await supabase.from('policies').select('employee_id').eq('id', item.policy_id).single()).data?.employee_id,
                total_commission_rate: item.total_commission_rate,
                base_commission_rate: item.base_commission_rate,
                reward_commission_rate: item.reward_commission_rate,
                bonus_commission_rate: item.bonus_commission_rate,
                commission_amount: item.employee_commission,
                applied_grid_id: item.grid_id,
                applied_grid_table: item.grid_table,
                is_reporting_employee: false
              }, {
                onConflict: 'policy_id,employee_id'
              });
          }
        }
      }

      toast({
        title: "Commissions Synced",
        description: "All commission data has been synchronized using the updated calculation system",
      });

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sync commissions';
      setError(errorMessage);
      toast({
        title: "Sync Error",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getCommissionSummary = () => {
    if (!data.length) return null;

    const summary = data.reduce((acc, item) => {
      acc.totalInsurer += item.insurer_commission;
      acc.totalAgent += item.agent_commission;
      acc.totalMisp += item.misp_commission;
      acc.totalEmployee += item.employee_commission;
      acc.totalReportingEmployee += item.reporting_employee_commission;
      acc.totalBroker += item.broker_share;
      acc.totalPolicies += 1;
      return acc;
    }, {
      totalInsurer: 0,
      totalAgent: 0,
      totalMisp: 0,
      totalEmployee: 0,
      totalReportingEmployee: 0,
      totalBroker: 0,
      totalPolicies: 0,
    });

    return summary;
  };

  return {
    data,
    loading,
    error,
    generateReport,
    calculateSinglePolicy,
    syncCommissions,
    getCommissionSummary,
  };
}