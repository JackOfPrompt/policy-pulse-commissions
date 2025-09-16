import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface CommissionCalculationResult {
  policy_id: string;
  policy_number: string;
  product_type: string;
  customer_name: string;
  premium_amount: number;
  provider: string;
  source_type: string;
  source_name: string;
  commission_rate: number;
  reward_rate?: number;
  bonus_rate?: number;
  insurer_commission: number;
  agent_commission: number;
  misp_commission: number;
  employee_commission: number;
  broker_share: number;
  commission_status: string;
  grid_table: string;
  grid_id: string;
  calc_date: string;
}

export function useCommissionCalculation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const calculateCommissions = async (): Promise<CommissionCalculationResult[]> => {
    try {
      setLoading(true);
      setError(null);

      // Get current user's org
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('User not authenticated');

      const { data: userOrgData } = await supabase
        .from('user_organizations')
        .select('org_id')
        .eq('user_id', userData.user.id)
        .single();

      const orgId = userOrgData?.org_id;
      if (!orgId) throw new Error('Organization not found');

      // Fetch policies with customer and product details
      const { data: policies, error: policiesError } = await supabase
        .from('policies')
        .select(`
          *,
          customers(first_name, last_name),
          product_types(category, name)
        `)
        .eq('org_id', orgId)
        .eq('policy_status', 'active');

      if (policiesError) throw policiesError;

      const results: CommissionCalculationResult[] = [];

      for (const policy of policies || []) {
        const premiumAmount = policy.premium_with_gst || policy.premium_without_gst || policy.gross_premium || 0;
        const customerName = `${policy.customers?.first_name || ''} ${policy.customers?.last_name || ''}`.trim() || 'Unknown';
        const productCategory = policy.product_types?.category || '';
        const productName = policy.product_types?.name || '';

        let matchedGrid = null;
        let gridTable = '';
        let commissionRate = 0;
        let rewardRate = 0;
        let gridId = '';

        // Try to match with specific payout grids first
        let baseCommissionRate = 0;
        let bonusCommissionRate = 0;
        
        console.log('Matching policy:', policy.policy_number, 'Product:', productName, 'Provider:', policy.provider);
        
        if (productCategory.toLowerCase().includes('motor') || productName.toLowerCase().includes('motor')) {
          const { data: motorGrids } = await supabase
            .from('motor_payout_grid')
            .select('*')
            .eq('org_id', orgId)
            .eq('is_active', true)
            .or(`provider.ilike.%${policy.provider || ''}%,provider.is.null`)
            .order('created_at', { ascending: false })
            .limit(1);

          if (motorGrids && motorGrids.length > 0) {
            matchedGrid = motorGrids[0];
            gridTable = 'motor_payout_grid';
            baseCommissionRate = matchedGrid.commission_rate;
            rewardRate = matchedGrid.reward_rate || 0;
            bonusCommissionRate = matchedGrid.bonus_commission_rate || 0;
            commissionRate = baseCommissionRate; // Base insurer commission for calculations
            gridId = matchedGrid.id;
          }
        } else if (productCategory.toLowerCase().includes('life') || productName.toLowerCase().includes('life')) {
          const { data: lifeGrids } = await supabase
            .from('life_payout_grid')
            .select('*')
            .eq('org_id', orgId)
            .eq('is_active', true)
            .or(`provider.ilike.%${policy.provider || ''}%,provider.is.null`)
            .order('created_at', { ascending: false })
            .limit(1);

          if (lifeGrids && lifeGrids.length > 0) {
            matchedGrid = lifeGrids[0];
            gridTable = 'life_payout_grid';
            baseCommissionRate = matchedGrid.commission_rate;
            rewardRate = matchedGrid.reward_rate || 0;
            bonusCommissionRate = matchedGrid.bonus_commission_rate || 0;
            commissionRate = baseCommissionRate; // Base insurer commission for calculations
            gridId = matchedGrid.id;
          }
        } else if (productCategory.toLowerCase().includes('health') || productName.toLowerCase().includes('health')) {
          const { data: healthGrids } = await supabase
            .from('health_payout_grid')
            .select('*')
            .eq('org_id', orgId)
            .eq('is_active', true)
            .or(`provider.ilike.%${policy.provider || ''}%,provider.is.null`)
            .order('created_at', { ascending: false })
            .limit(1);

          if (healthGrids && healthGrids.length > 0) {
            matchedGrid = healthGrids[0];
            gridTable = 'health_payout_grid';
            baseCommissionRate = matchedGrid.commission_rate;
            rewardRate = matchedGrid.reward_rate || 0;
            bonusCommissionRate = matchedGrid.bonus_commission_rate || 0;
            commissionRate = baseCommissionRate; // Base insurer commission for calculations
            gridId = matchedGrid.id;
          }
        }

        // No matched grid found in payout tables; leaving commission rates as zero for this policy.

        // Calculate commissions separately for clarity
        const baseInsurerCommission = premiumAmount * baseCommissionRate / 100;
        const rewardCommission = premiumAmount * rewardRate / 100;
        const bonusCommission = premiumAmount * bonusCommissionRate / 100;
        const totalInsurerCommission = baseInsurerCommission + rewardCommission + bonusCommission;
        
        let agentCommission = 0;
        let mispCommission = 0;
        let employeeCommission = 0;
        let brokerShare = totalInsurerCommission;

        // Get source details and calculate distributions
        let sourceName = 'Direct';
        
        if (policy.source_type === 'employee' && policy.employee_id) {
          const { data: employee } = await supabase
            .from('employees')
            .select('name')
            .eq('id', policy.employee_id)
            .single();
          
          if (employee) {
            sourceName = employee.name;
            
            // For employee policies: Employee gets portion of total commission
            const employeeSharePercentage = 60; // Default employee share
            employeeCommission = totalInsurerCommission * employeeSharePercentage / 100;
            brokerShare = totalInsurerCommission - employeeCommission;
          }
        } else if (policy.source_type === 'agent' && policy.agent_id) {
          const { data: agent } = await supabase
            .from('agents')
            .select('agent_name, percentage, commission_tier_id')
            .eq('id', policy.agent_id)
            .single();
          
          if (agent) {
            sourceName = agent.agent_name;
            
            // For agent policies: Use commission tier to split total insurer commission
            let agentSharePercentage = agent.percentage || 70;
            
            // If agent has commission tier, use tier percentage (default to Bronze if not set)
            if (agent.commission_tier_id) {
              const { data: tier } = await supabase
                .from('commission_tiers')
                .select('base_percentage')
                .eq('id', agent.commission_tier_id)
                .single();
              
              if (tier) {
                agentSharePercentage = tier.base_percentage;
              }
            } else {
              // If no tier set, use Bronze tier as default
              const { data: bronzeTier } = await supabase
                .from('commission_tiers')
                .select('base_percentage')
                .eq('org_id', orgId)
                .ilike('name', 'bronze')
                .limit(1);
              
              if (bronzeTier && bronzeTier.length > 0) {
                agentSharePercentage = bronzeTier[0].base_percentage;
              }
            }
            
            agentCommission = totalInsurerCommission * agentSharePercentage / 100;
            brokerShare = totalInsurerCommission - agentCommission;
          }
        } else if (policy.source_type === 'misp' && policy.misp_id) {
          const { data: misp } = await supabase
            .from('misps')
            .select('channel_partner_name, percentage, commission_tier_id')
            .eq('id', policy.misp_id)
            .single();
          
          if (misp) {
            sourceName = misp.channel_partner_name;
            
            // For MISP policies: Use commission tier to split total insurer commission
            let mispSharePercentage = misp.percentage || 50;
            
            // If MISP has commission tier, use tier percentage
            if (misp.commission_tier_id) {
              const { data: tier } = await supabase
                .from('commission_tiers')
                .select('base_percentage')
                .eq('id', misp.commission_tier_id)
                .single();
              
              if (tier) {
                mispSharePercentage = tier.base_percentage;
              }
            }
            
            mispCommission = totalInsurerCommission * mispSharePercentage / 100;
            brokerShare = totalInsurerCommission - mispCommission;
          }
        }

        const result: CommissionCalculationResult = {
          policy_id: policy.id,
          policy_number: policy.policy_number,
          product_type: productName,
          customer_name: customerName,
          premium_amount: premiumAmount,
          provider: policy.provider || 'Unknown',
          source_type: policy.source_type || 'direct',
          source_name: sourceName,
          commission_rate: baseCommissionRate, // Base commission rate
          reward_rate: rewardRate, // Reward rate for detailed reports
          bonus_rate: bonusCommissionRate, // Bonus rate for detailed reports
          insurer_commission: totalInsurerCommission,
          agent_commission: agentCommission,
          misp_commission: mispCommission,
          employee_commission: employeeCommission,
          broker_share: brokerShare,
          commission_status: matchedGrid ? 'calculated' : 'no_grid_match',
          grid_table: gridTable,
          grid_id: gridId,
          calc_date: new Date().toISOString()
        };

        results.push(result);
      }

      return results;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to calculate commissions';
      setError(errorMessage);
      toast({
        title: "Calculation Error",
        description: errorMessage,
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  const syncCommissions = async () => {
    try {
      setLoading(true);
      
      // First, calculate all commissions
      const calculations = await calculateCommissions();
      
      // Then, save them to the policy_commissions table
      for (const calc of calculations) {
        await supabase
          .from('policy_commissions')
          .upsert({
            policy_id: calc.policy_id,
            org_id: (await supabase.auth.getUser()).data.user?.id ? 
              (await supabase.from('user_organizations').select('org_id').eq('user_id', (await supabase.auth.getUser()).data.user!.id).single()).data?.org_id : null,
            product_type: calc.product_type,
            grid_table: calc.grid_table,
            grid_id: calc.grid_id || null,
            commission_rate: calc.commission_rate,
            reward_rate: calc.reward_rate || 0,
            commission_amount: calc.insurer_commission,
            reward_amount: calc.premium_amount * (calc.reward_rate || 0) / 100,
            total_amount: calc.insurer_commission,
            insurer_commission: calc.insurer_commission,
            agent_commission: calc.agent_commission,
            misp_commission: calc.misp_commission,
            employee_commission: calc.employee_commission,
            broker_share: calc.broker_share,
            commission_status: calc.commission_status,
            calc_date: calc.calc_date
          }, {
            onConflict: 'policy_id'
          });
      }

      toast({
        title: "Success",
        description: `Synchronized commissions for ${calculations.length} policies`,
      });

      return calculations;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sync commissions';
      setError(errorMessage);
      toast({
        title: "Sync Error",
        description: errorMessage,
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    calculateCommissions,
    syncCommissions
  };
}