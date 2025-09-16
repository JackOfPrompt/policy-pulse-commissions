import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PolicyCommissionDetail {
  policy_id: string;
  policy_number: string;
  customer_name: string;
  product_category: string;
  product_name: string;
  plan_name: string;
  provider: string;
  source_type: string;
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
  grid_id: string;
  grid_table: string;
  calc_date: string;
}

export function useEnhancedCommissionReportWithDetails() {
  const [data, setData] = useState<PolicyCommissionDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const calculateCommissionForPolicy = async (policy: any) => {
    const premium_amount = policy.premium_with_gst || policy.premium_without_gst || policy.gross_premium || 0;
    const product_category = policy.product_types.category.toLowerCase();
    
    let grid = null;
    let gridTableName = '';
    
    // Determine which grid table to query based on product type
    if (product_category === 'motor') {
      const { data: grids } = await supabase
        .from('motor_payout_grid')
        .select('*')
        .eq('org_id', policy.org_id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      // Filter grids in JS for better control
      const filteredGrids = grids?.filter(grid => {
        const productMatch = grid.product_type?.toLowerCase().includes(product_category) || 
                           grid.product_subtype?.toLowerCase().includes(product_category);
        const premiumMatch = (!grid.min_premium || premium_amount >= grid.min_premium) &&
                           (!grid.max_premium || premium_amount <= grid.max_premium);
        const providerMatch = !grid.provider || grid.provider === '' || 
                            grid.provider.toLowerCase().includes(policy.provider?.toLowerCase() || '');
        const dateMatch = (!grid.effective_from || new Date(grid.effective_from) <= new Date()) &&
                        (!grid.effective_to || new Date(grid.effective_to) >= new Date());
        
        return productMatch && premiumMatch && providerMatch && dateMatch;
      }) || [];
      
      grid = filteredGrids[0];
      gridTableName = 'motor_payout_grid';
    } else if (product_category === 'health') {
      const { data: grids } = await supabase
        .from('health_payout_grid')
        .select('*')
        .eq('org_id', policy.org_id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      // Filter grids in JS for better control
      const filteredGrids = grids?.filter(grid => {
        const productMatch = grid.product_type?.toLowerCase().includes(product_category) || 
                           grid.product_sub_type?.toLowerCase().includes(product_category);
        const premiumMatch = (!grid.min_premium || premium_amount >= grid.min_premium) &&
                           (!grid.max_premium || premium_amount <= grid.max_premium);
        const providerMatch = !grid.provider || grid.provider === '' || 
                            grid.provider.toLowerCase().includes(policy.provider?.toLowerCase() || '');
        const dateMatch = (!grid.effective_from || new Date(grid.effective_from) <= new Date()) &&
                        (!grid.effective_to || new Date(grid.effective_to) >= new Date());
        
        return productMatch && premiumMatch && providerMatch && dateMatch;
      }) || [];
      
      grid = filteredGrids[0];
      gridTableName = 'health_payout_grid';
    } else if (product_category === 'life') {
      const { data: grids } = await supabase
        .from('life_payout_grid')
        .select('*')
        .eq('org_id', policy.org_id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      // Filter grids in JS for better control
      const filteredGrids = grids?.filter(grid => {
        const productMatch = grid.product_type?.toLowerCase().includes(product_category) || 
                           grid.product_sub_type?.toLowerCase().includes(product_category);
        const premiumMatch = (!grid.min_premium || premium_amount >= grid.min_premium) &&
                           (!grid.max_premium || premium_amount <= grid.max_premium);
        const providerMatch = !grid.provider || grid.provider === '' || 
                            grid.provider.toLowerCase().includes(policy.provider?.toLowerCase() || '');
        const dateMatch = (!grid.commission_start_date || new Date(grid.commission_start_date) <= new Date()) &&
                        (!grid.commission_end_date || new Date(grid.commission_end_date) >= new Date());
        
        return productMatch && premiumMatch && providerMatch && dateMatch;
      }) || [];
      
      grid = filteredGrids[0];
      gridTableName = 'life_payout_grid';
    } else {
      grid = null;
      gridTableName = '';
    }
    if (!grid) {
      console.log(`No commission grid found for policy ${policy.policy_number}:`, {
        org_id: policy.org_id,
        product_type: policy.product_types.category,
        product_category: product_category,
        provider: policy.provider,
        premium_amount,
        gridTableName
      });
      return null;
    }
    
    console.log(`Commission grid found for policy ${policy.policy_number}:`, {
      grid_id: grid.id,
      grid_table: gridTableName,
      base_rate: grid.commission_rate,
      reward_rate: grid.reward_rate,
      bonus_rate: grid.bonus_commission_rate,
      provider: grid.provider
    });

    // Calculate commission rates based on grid structure - Updated to use correct field names
    const base_commission_rate = grid.commission_rate || 0;
    const reward_commission_rate = grid.reward_rate || 0;
    const bonus_commission_rate = grid.bonus_commission_rate || 0;
    const total_commission_rate = base_commission_rate + reward_commission_rate + bonus_commission_rate;

    // Calculate total insurer commission
    const insurer_commission = premium_amount * total_commission_rate / 100;

    // Initialize commission distribution
    let agent_commission = 0;
    let misp_commission = 0;
    let employee_commission = 0;
    let reporting_employee_commission = 0;
    let broker_share = 0;

    // Business logic for commission distribution based on source type
    if (policy.source_type === 'employee' && policy.employee_id) {
      // Employee sale - employee gets the full insurer commission, broker share = 0
      employee_commission = insurer_commission;
      broker_share = 0; // No broker share for employee sales
    } else if (policy.source_type === 'agent' && policy.agent_id) {
      // Agent sale - get agent details and calculate split
      const { data: agent } = await supabase
        .from('agents')
        .select('percentage, override_percentage, employee_id, reporting_manager_id')
        .eq('id', policy.agent_id)
        .single();

      if (agent) {
        // Use override percentage if available, otherwise use regular percentage
        const agent_percentage = agent.override_percentage || agent.percentage || 70;
        agent_commission = insurer_commission * agent_percentage / 100;
        
        // Check if agent has reporting employee (reporting manager)
        if (agent.reporting_manager_id || agent.employee_id) {
          // Reporting employee gets the remaining commission
          reporting_employee_commission = insurer_commission - agent_commission;
          broker_share = 0; // No broker share when reporting employee exists
        } else {
          // No reporting employee - broker gets the remaining commission
          broker_share = insurer_commission - agent_commission;
        }
      } else {
        // No agent found - all goes to broker
        broker_share = insurer_commission;
      }
    } else if (policy.source_type === 'misp' && policy.misp_id) {
      // MISP sale - get MISP details and calculate split
      const { data: misp } = await supabase
        .from('misps')
        .select('percentage, override_percentage, employee_id, reporting_manager_id')
        .eq('id', policy.misp_id)
        .single();

      if (misp) {
        // Use override percentage if available, otherwise use regular percentage
        const misp_percentage = misp.override_percentage || misp.percentage || 50;
        misp_commission = insurer_commission * misp_percentage / 100;
        
        // Check if MISP has reporting employee
        if (misp.reporting_manager_id || misp.employee_id) {
          // Reporting employee gets the remaining commission
          reporting_employee_commission = insurer_commission - misp_commission;
          broker_share = 0; // No broker share when reporting employee exists
        } else {
          // No reporting employee - broker gets the remaining commission
          broker_share = insurer_commission - misp_commission;
        }
      } else {
        // No MISP found - all goes to broker
        broker_share = insurer_commission;
      }
    } else if (policy.source_type === 'posp' && policy.posp_id) {
      // POSP sale - similar logic to agent/misp
      const posp_percentage = 60; // Default 60% for POSP
      const posp_commission = insurer_commission * posp_percentage / 100;
      
      // Treat POSP similar to agent commission
      agent_commission = posp_commission;
      broker_share = insurer_commission - posp_commission;
    } else {
      // Direct sale or no source - all commission goes to broker
      broker_share = insurer_commission;
    }

    return {
      grid_id: grid.id,
      grid_table: gridTableName,
      base_commission_rate,
      reward_commission_rate,
      bonus_commission_rate,
      total_commission_rate,
      insurer_commission,
      agent_commission,
      misp_commission,
      employee_commission,
      reporting_employee_commission,
      broker_share,
      calc_date: new Date().toISOString()
    };
  };

  const fetchCommissionReport = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user's org
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: userOrg } = await supabase
        .from('user_organizations')
        .select('org_id')
        .eq('user_id', user.id)
        .single();

      if (!userOrg) throw new Error('User organization not found');

      // First, try to get existing commission data from policy_commissions table
      const { data: existingCommissions, error: commissionsError } = await supabase
        .from('policy_commissions')
        .select(`
          *,
          policies!inner(
            id,
            policy_number,
            plan_name,
            provider,
            source_type,
            agent_id,
            employee_id,
            misp_id,
            premium_with_gst,
            premium_without_gst,
            gross_premium,
            customers(first_name, last_name),
            product_types(name, category)
          )
        `)
        .eq('org_id', userOrg.org_id)
        .eq('is_active', true)
        .order('calc_date', { ascending: false });

      if (commissionsError) throw commissionsError;

      console.log(`Found ${existingCommissions?.length || 0} existing commission records`);

      if (existingCommissions && existingCommissions.length > 0) {
        // Transform existing commission data
        const transformedData: PolicyCommissionDetail[] = existingCommissions.map(commission => {
          const policy = commission.policies;
          const customer_name = `${policy.customers?.first_name || ''} ${policy.customers?.last_name || ''}`.trim();
          const premium_amount = policy.premium_with_gst || policy.premium_without_gst || policy.gross_premium || 0;

          return {
            policy_id: commission.policy_id,
            policy_number: policy.policy_number,
            customer_name,
            product_category: policy.product_types?.name || '',
            product_name: policy.product_types?.name || '',
            plan_name: policy.plan_name || '',
            provider: policy.provider || '',
            source_type: policy.source_type || 'direct',
            premium_amount,
            base_commission_rate: commission.commission_rate || 0,
            reward_commission_rate: commission.reward_rate || 0,
            bonus_commission_rate: 0, // Not in current schema
            total_commission_rate: (commission.commission_rate || 0) + (commission.reward_rate || 0),
            insurer_commission: commission.insurer_commission || 0,
            agent_commission: commission.agent_commission || 0,
            misp_commission: commission.misp_commission || 0,
            employee_commission: commission.employee_commission || 0,
            reporting_employee_commission: 0, // Not in current schema
            broker_share: commission.broker_share || 0,
            grid_id: commission.grid_id || '',
            grid_table: commission.grid_table || '',
            calc_date: commission.calc_date || commission.created_at
          };
        });

        setData(transformedData);
        return;
      }

      // Fallback: Calculate commissions for policies without existing commission data
      console.log('No existing commission data found, falling back to calculation...');
      
      // Get all active policies with related data
      const { data: policies, error: policiesError } = await supabase
        .from('policies')
        .select(`
          id,
          org_id,
          policy_number,
          plan_name,
          provider,
          source_type,
          agent_id,
          employee_id,
          misp_id,
          posp_id,
          premium_with_gst,
          premium_without_gst,
          gross_premium,
          customers!inner(first_name, last_name),
          product_types!inner(name, category)
        `)
        .eq('org_id', userOrg.org_id)
        .eq('policy_status', 'active')
        .order('created_at', { ascending: false });

      if (policiesError) throw policiesError;

      console.log(`Found ${policies?.length || 0} active policies for org ${userOrg.org_id}`);

      // Calculate commissions for each policy
      const transformedData: PolicyCommissionDetail[] = [];
      
      for (const policy of policies || []) {
        const customer_name = `${policy.customers.first_name || ''} ${policy.customers.last_name || ''}`.trim();
        const premium_amount = policy.premium_with_gst || policy.premium_without_gst || policy.gross_premium || 0;
        
        // Calculate commission for this policy
        const commissionCalc = await calculateCommissionForPolicy(policy);
        
        if (commissionCalc) {
          transformedData.push({
            policy_id: policy.id,
            policy_number: policy.policy_number,
            customer_name,
            product_category: policy.product_types.name,
            product_name: policy.product_types.name,
            plan_name: policy.plan_name || '',
            provider: policy.provider || '',
            source_type: policy.source_type || 'direct',
            premium_amount,
            ...commissionCalc
          });
        } else {
          // Policy without commission grid match
          transformedData.push({
            policy_id: policy.id,
            policy_number: policy.policy_number,
            customer_name,
            product_category: policy.product_types.name,
            product_name: policy.product_types.name,
            plan_name: policy.plan_name || '',
            provider: policy.provider || '',
            source_type: policy.source_type || 'direct',
            premium_amount,
            base_commission_rate: 0,
            reward_commission_rate: 0,
            bonus_commission_rate: 0,
            total_commission_rate: 0,
            insurer_commission: 0,
            agent_commission: 0,
            misp_commission: 0,
            employee_commission: 0,
            reporting_employee_commission: 0,
            broker_share: 0,
            grid_id: '',
            grid_table: '',
            calc_date: new Date().toISOString()
          });
        }
      }

      setData(transformedData);
    } catch (err) {
      console.error('Error fetching commission report:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch commission report';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const syncAllCommissions = async () => {
    try {
      setLoading(true);
      
      // First recalculate all commissions
      await fetchCommissionReport();
      
      // Then save them to the policy_commissions table
      for (const policy of data) {
        if (policy.insurer_commission > 0) {
          await supabase
            .from('policy_commissions')
            .upsert({
              policy_id: policy.policy_id,
              org_id: (await supabase
                .from('user_organizations')
                .select('org_id')
                .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
                .single()).data?.org_id,
              product_type: policy.product_category,
              commission_rate: policy.total_commission_rate,
              reward_rate: policy.reward_commission_rate,
              commission_amount: policy.insurer_commission,
              reward_amount: policy.insurer_commission * policy.reward_commission_rate / 100,
              total_amount: policy.insurer_commission,
              insurer_commission: policy.insurer_commission,
              agent_commission: policy.agent_commission,
              misp_commission: policy.misp_commission,
              employee_commission: policy.employee_commission,
              broker_share: policy.broker_share,
              grid_id: policy.grid_id,
              grid_table: policy.grid_table,
              commission_status: 'calculated',
              calc_date: new Date().toISOString()
            }, { onConflict: 'policy_id' });
        }
      }

      toast({
        title: "Success",
        description: "All commissions have been synchronized successfully",
      });

      // Refresh the report
      await fetchCommissionReport();
      return true;
    } catch (err) {
      console.error('Error syncing commissions:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to sync commissions';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getCommissionSummary = () => {
    const totalPolicies = data.length;
    const totalInsurer = data.reduce((sum, policy) => sum + policy.insurer_commission, 0);
    const totalAgent = data.reduce((sum, policy) => sum + policy.agent_commission, 0);
    const totalMisp = data.reduce((sum, policy) => sum + policy.misp_commission, 0);
    const totalEmployee = data.reduce((sum, policy) => sum + policy.employee_commission, 0);
    const totalReportingEmployee = data.reduce((sum, policy) => sum + policy.reporting_employee_commission, 0);
    const totalBroker = data.reduce((sum, policy) => sum + policy.broker_share, 0);

    const avgBaseRate = data.length > 0 ? data.reduce((sum, policy) => sum + policy.base_commission_rate, 0) / data.length : 0;
    const avgRewardRate = data.length > 0 ? data.reduce((sum, policy) => sum + policy.reward_commission_rate, 0) / data.length : 0;
    const avgBonusRate = data.length > 0 ? data.reduce((sum, policy) => sum + policy.bonus_commission_rate, 0) / data.length : 0;

    return {
      totalPolicies,
      totalInsurer,
      totalAgent,
      totalMisp,
      totalEmployee,
      totalReportingEmployee,
      totalBroker,
      avgBaseRate,
      avgRewardRate,
      avgBonusRate
    };
  };

  useEffect(() => {
    fetchCommissionReport();
  }, []);

  return {
    data,
    loading,
    error,
    generateReport: fetchCommissionReport,
    syncCommissions: syncAllCommissions,
    getCommissionSummary
  };
}