import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface TierCommissionResult {
  policy_id: string;
  policy_number: string;
  customer_name: string;
  product_type: string;
  provider: string;
  premium_amount: number;
  source_type: string;
  source_name: string;
  tier_name?: string;
  tier_percentage?: number;
  override_percentage?: number;
  insurer_commission_rate: number;
  insurer_commission_amount: number;
  agent_commission_amount: number;
  misp_commission_amount: number;
  employee_commission_amount: number;
  broker_share_amount: number;
  commission_status: string;
}

export function useCommissionTierCalculation() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const calculateCommissionWithTiers = async (policyId?: string): Promise<TierCommissionResult[]> => {
    try {
      setLoading(true);
      
      // Get policies with their source details
      let query = supabase
        .from('policies')
        .select(`
          id,
          policy_number,
          premium_with_gst,
          premium_without_gst,
          gross_premium,
          provider,
          source_type,
          agent_id,
          misp_id,
          employee_id,
          org_id,
          customers!inner(
            first_name,
            last_name,
            company_name
          ),
          product_types!inner(
            name,
            category
          )
        `)
        .eq('policy_status', 'active');

      if (profile?.org_id) {
        query = query.eq('org_id', profile.org_id);
      }

      if (policyId) {
        query = query.eq('id', policyId);
      }

      const { data: policies, error: policiesError } = await query;
      if (policiesError) throw policiesError;

      const results: TierCommissionResult[] = [];

      for (const policy of policies || []) {
        const premium = policy.gross_premium || policy.premium_with_gst || policy.premium_without_gst || 0;
        const customerName = policy.customers?.company_name || 
          `${policy.customers?.first_name || ''} ${policy.customers?.last_name || ''}`.trim() || 
          'Unknown Customer';

        // Find matching commission grid
        const { data: gridMatch } = await supabase
          .from('life_payout_grid')
          .select('*')
          .eq('org_id', policy.org_id)
          .eq('product_type', policy.product_types?.category)
          .or(`provider.eq.${policy.provider},provider.is.null`)
          .or(`min_premium.lte.${premium},min_premium.is.null`)
          .or(`max_premium.gte.${premium},max_premium.is.null`)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!gridMatch) {
          console.warn(`No commission grid found for policy ${policy.policy_number}`);
          continue;
        }

        const insurerCommissionRate = (gridMatch as any).commission_rate;
        const insurerCommissionAmount = premium * insurerCommissionRate / 100;

        let sourceName = 'Direct';
        let tierName: string | undefined;
        let tierPercentage: number | undefined;
        let overridePercentage: number | undefined;
        let agentCommission = 0;
        let mispCommission = 0;
        let employeeCommission = 0;

        // Calculate source-specific commissions with tier support
        if (policy.source_type === 'agent' && policy.agent_id) {
          const { data: agent } = await supabase
            .from('agents')
            .select(`
              agent_name,
              commission_tier_id,
              override_percentage,
              commission_tiers(name, base_percentage)
            `)
            .eq('id', policy.agent_id)
            .single();

          if (agent) {
            sourceName = agent.agent_name;
            
            // Use commission tier or override percentage
            if (agent.override_percentage) {
              overridePercentage = agent.override_percentage;
              agentCommission = insurerCommissionAmount * agent.override_percentage / 100;
            } else if (agent.commission_tiers) {
              tierName = agent.commission_tiers.name;
              tierPercentage = agent.commission_tiers.base_percentage;
              agentCommission = insurerCommissionAmount * agent.commission_tiers.base_percentage / 100;
            }
          }
        } else if (policy.source_type === 'misp' && policy.misp_id) {
          const { data: misp } = await supabase
            .from('misps')
            .select(`
              channel_partner_name,
              commission_tier_id,
              override_percentage,
              commission_tiers(name, base_percentage)
            `)
            .eq('id', policy.misp_id)
            .single();

          if (misp) {
            sourceName = misp.channel_partner_name;
            
            if (misp.override_percentage) {
              overridePercentage = misp.override_percentage;
              mispCommission = insurerCommissionAmount * misp.override_percentage / 100;
            } else if (misp.commission_tiers) {
              tierName = misp.commission_tiers.name;
              tierPercentage = misp.commission_tiers.base_percentage;
              mispCommission = insurerCommissionAmount * misp.commission_tiers.base_percentage / 100;
            }
          }
        } else if (policy.source_type === 'employee' && policy.employee_id) {
          const { data: employee } = await supabase
            .from('employees')
            .select('name')
            .eq('id', policy.employee_id)
            .single();

          if (employee) {
            sourceName = employee.name;
            // Get organization employee share percentage
            const { data: orgConfig } = await supabase
              .from('org_config')
              .select('employee_share_percentage')
              .eq('org_id', policy.org_id)
              .single();
            
            const employeeSharePercentage = orgConfig?.employee_share_percentage || 60;
            employeeCommission = insurerCommissionAmount * employeeSharePercentage / 100;
          }
        }

        const brokerShare = insurerCommissionAmount - agentCommission - mispCommission - employeeCommission;

        const result: TierCommissionResult = {
          policy_id: policy.id,
          policy_number: policy.policy_number,
          customer_name: customerName,
          product_type: policy.product_types?.name || 'Unknown',
          provider: policy.provider || 'Unknown',
          premium_amount: premium,
          source_type: policy.source_type || 'direct',
          source_name: sourceName,
          tier_name: tierName,
          tier_percentage: tierPercentage,
          override_percentage: overridePercentage,
          insurer_commission_rate: insurerCommissionRate,
          insurer_commission_amount: insurerCommissionAmount,
          agent_commission_amount: agentCommission,
          misp_commission_amount: mispCommission,
          employee_commission_amount: employeeCommission,
          broker_share_amount: brokerShare,
          commission_status: 'calculated',
        };

        results.push(result);

        // Save to policy_commissions table
        await supabase
          .from('policy_commissions')
          .upsert({
            policy_id: policy.id,
            org_id: policy.org_id,
            product_type: policy.product_types?.category,
            commission_rate: insurerCommissionRate,
            commission_amount: insurerCommissionAmount,
            total_amount: insurerCommissionAmount,
            insurer_commission: insurerCommissionAmount,
            agent_commission: agentCommission,
            misp_commission: mispCommission,
            employee_commission: employeeCommission,
            broker_share: brokerShare,
            commission_status: 'calculated',
            grid_id: (gridMatch as any).id,
            grid_table: 'life_payout_grid',
            calc_date: new Date().toISOString(),
          }, {
            onConflict: 'policy_id'
          });
      }

      return results;
    } catch (error) {
      console.error('Error calculating commission with tiers:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const syncAllCommissions = async (): Promise<void> => {
    try {
      setLoading(true);
      const results = await calculateCommissionWithTiers();
      
      toast({
        title: "Success",
        description: `Synchronized commissions for ${results.length} policies`,
      });
    } catch (error) {
      console.error('Error syncing commissions:', error);
      toast({
        title: "Error",
        description: "Failed to sync commissions",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    calculateCommissionWithTiers,
    syncAllCommissions,
    loading,
  };
}