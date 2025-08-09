import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CommissionCalculationPayload {
  policyId: string;
  lineOfBusiness: string;
  insurerId: string;
  productId?: string;
  premiumAmount: number;
  agentId?: string;
  employeeId?: string;
  policyType?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role key for full access
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { policyId, lineOfBusiness, insurerId, productId, premiumAmount, agentId, employeeId, policyType } = 
      await req.json() as CommissionCalculationPayload;

    console.log(`Processing commission calculation for policy ${policyId}`);

    // Step 1: Find applicable commission rules
    const commissionRules = await findApplicableCommissionRules(
      supabaseAdmin, lineOfBusiness, insurerId, productId, premiumAmount, policyType
    );

    if (commissionRules.length === 0) {
      console.log(`No commission rules found for policy ${policyId}`);
      return new Response(
        JSON.stringify({ success: false, message: "No applicable commission rules found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results = [];

    // Step 2: Calculate commissions for each applicable rule
    for (const rule of commissionRules) {
      const commissionAmount = calculateCommissionAmount(rule, premiumAmount);
      
      if (commissionAmount > 0) {
        // Step 3: Create commission record
        const { data: commission, error: commissionError } = await supabaseAdmin
          .from('commissions')
          .insert({
            policy_id: policyId,
            agent_id: agentId,
            commission_amount: commissionAmount,
            commission_rate: rule.first_year_rate || 0,
            commission_type: 'Initial',
            status: 'Pending'
          })
          .select()
          .single();

        if (commissionError) {
          console.error('Error creating commission record:', commissionError);
          continue;
        }

        // Step 4: Create payout transaction if agent is involved
        if (agentId) {
          const payoutResult = await createPayoutTransaction(
            supabaseAdmin, policyId, agentId, commissionAmount, rule.id
          );
          results.push({ commission, payout: payoutResult });
        }

        // Step 5: Update employee performance metrics if employee is involved
        if (employeeId) {
          await updateEmployeePerformance(supabaseAdmin, employeeId, premiumAmount);
        }

        console.log(`Commission calculated: ${commissionAmount} for rule ${rule.id}`);
      }
    }

    // Step 6: Create audit log
    await supabaseAdmin
      .from('audit_logs')
      .insert({
        event: 'Commission Calculated',
        entity_type: 'policy',
        entity_id: policyId,
        policy_id: policyId,
        metadata: {
          commission_rules_applied: commissionRules.map(r => r.id),
          total_commission: results.reduce((sum, r) => sum + r.commission.commission_amount, 0),
          agent_id: agentId,
          employee_id: employeeId,
          line_of_business: lineOfBusiness,
          premium_amount: premiumAmount
        }
      });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Commission calculated for ${results.length} rule(s)`,
        results 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error('Error in commission calculation:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});

async function findApplicableCommissionRules(
  supabase: any, 
  lineOfBusiness: string, 
  insurerId: string, 
  productId?: string, 
  premiumAmount?: number,
  policyType?: string
) {
  let query = supabase
    .from('commission_rules')
    .select('*')
    .eq('insurer_id', insurerId)
    .eq('line_of_business', lineOfBusiness)
    .eq('is_active', true)
    .lte('effective_from', new Date().toISOString().split('T')[0]);

  // Add optional filters
  if (productId) {
    query = query.or(`product_id.eq.${productId},product_id.is.null`);
  }

  if (policyType) {
    query = query.or(`policy_type.eq.${policyType},policy_type.is.null`);
  }

  // Filter by effective_to (null means no end date)
  query = query.or(`effective_to.is.null,effective_to.gte.${new Date().toISOString().split('T')[0]}`);

  const { data: rules, error } = await query.order('version', { ascending: false });

  if (error) {
    console.error('Error fetching commission rules:', error);
    return [];
  }

  // Filter by premium range if commission slabs exist
  const applicableRules = [];
  for (const rule of rules || []) {
    if (premiumAmount && rule.rule_type === 'slab') {
      // Check if premium falls within any slab
      const { data: slabs } = await supabase
        .from('commission_slabs')
        .select('*')
        .eq('rule_id', rule.id)
        .lte('from_amount', premiumAmount)
        .or(`to_amount.is.null,to_amount.gte.${premiumAmount}`);

      if (slabs && slabs.length > 0) {
        applicableRules.push({ ...rule, applicableSlab: slabs[0] });
      }
    } else {
      applicableRules.push(rule);
    }
  }

  return applicableRules;
}

function calculateCommissionAmount(rule: any, premiumAmount: number): number {
  if (rule.rule_type === 'slab' && rule.applicableSlab) {
    // Slab-based calculation
    const slab = rule.applicableSlab;
    if (slab.commission_amount) {
      return slab.commission_amount;
    } else if (slab.commission_rate) {
      return Math.round(premiumAmount * (slab.commission_rate / 100));
    }
  } else if (rule.rule_type === 'percentage') {
    // Percentage-based calculation
    if (rule.first_year_rate) {
      return Math.round(premiumAmount * (rule.first_year_rate / 100));
    } else if (rule.first_year_amount) {
      return rule.first_year_amount;
    }
  }

  return 0;
}

async function createPayoutTransaction(
  supabase: any, 
  policyId: string, 
  agentId: string, 
  commissionAmount: number,
  commissionRuleId: string
) {
  try {
    const { data: payout, error } = await supabase
      .from('payout_transactions')
      .insert({
        policy_id: policyId,
        agent_id: agentId,
        payout_amount: commissionAmount,
        payout_date: new Date().toISOString().split('T')[0],
        payout_status: 'Pending',
        payment_mode: 'Bank Transfer',
        commission_rule_id: commissionRuleId,
        remarks: 'Auto-generated from policy purchase'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating payout transaction:', error);
      return null;
    }

    console.log(`Payout transaction created: ${payout.payout_id}`);
    return payout;
  } catch (error) {
    console.error('Error in createPayoutTransaction:', error);
    return null;
  }
}

async function updateEmployeePerformance(
  supabase: any,
  employeeId: string,
  revenueAmount: number
) {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Update or create daily performance metrics
    const { error: upsertError } = await supabase
      .from('daily_performance_metrics')
      .upsert({
        employee_id: employeeId,
        metric_date: today,
        policies_processed: 1,
        revenue_generated: revenueAmount
      }, {
        onConflict: 'employee_id,metric_date',
        ignoreDuplicates: false
      });

    if (upsertError) {
      console.error('Error updating employee performance:', upsertError);
    } else {
      console.log(`Employee performance updated for ${employeeId}`);
    }
  } catch (error) {
    console.error('Error in updateEmployeePerformance:', error);
  }
}