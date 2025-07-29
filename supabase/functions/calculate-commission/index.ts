import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CalculateCommissionRequest {
  insurerId: string;
  productId?: string;
  policyDetails: {
    lineOfBusiness: string;
    premiumAmount: number;
    odPremium?: number; // Motor specific
    tpPremium?: number; // Motor specific
    policyTerm?: number; // Life specific
    premiumPaymentTerm?: number; // Life specific
    vehicleType?: string; // Motor specific
    planType?: string; // Health specific
    paymentFrequency?: string;
    sumAssured?: number;
    [key: string]: any;
  };
  agentTierId?: string;
  isRenewal: boolean;
}

interface CommissionResult {
  commissionAmount: number;
  rateUsed: number;
  ruleId: string;
  breakdown?: {
    baseCommission: number;
    tierAdjustment?: number;
    odCommission?: number;
    tpCommission?: number;
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const requestData: CalculateCommissionRequest = await req.json();
    console.log('Commission calculation request:', requestData);

    const {
      insurerId,
      productId,
      policyDetails,
      agentTierId,
      isRenewal
    } = requestData;

    // Step 1: Find applicable commission rules using the new temporal function
    const { data: rules, error: rulesError } = await supabase
      .rpc('get_active_commission_rules', {
        p_insurer_id: insurerId,
        p_product_id: productId || null,
        p_line_of_business: policyDetails.lineOfBusiness,
        p_agent_tier_id: agentTierId || null,
        p_check_date: new Date().toISOString().split('T')[0]
      });

    if (rulesError) {
      console.error('Error fetching rules:', rulesError);
      throw rulesError;
    }

    if (!rules || rules.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'No applicable commission rules found',
          commissionAmount: 0,
          rateUsed: 0
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404
        }
      );
    }

    // Step 2: Use the first rule (highest version, most recent)
    const activeRule = rules[0];

    // Step 3: Get rule conditions and ranges for detailed calculation
    const { data: ruleDetails, error: detailsError } = await supabase
      .from('commission_rules')
      .select(`
        *,
        rule_conditions(*),
        rule_ranges(*)
      `)
      .eq('id', activeRule.rule_id)
      .single();

    if (detailsError) {
      console.error('Error fetching rule details:', detailsError);
      throw detailsError;
    }

    // Step 4: Calculate commission based on rule type and line of business
    const result = await calculateCommissionAmount(
      ruleDetails,
      policyDetails,
      isRenewal,
      agentTierId,
      supabase
    );

    console.log('Commission calculation result:', result);

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Commission calculation error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        commissionAmount: 0,
        rateUsed: 0
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});

async function calculateCommissionAmount(
  rule: any,
  policyDetails: any,
  isRenewal: boolean,
  agentTierId?: string,
  supabase?: any
): Promise<CommissionResult> {
  
  let baseRate = 0;
  let baseAmount = 0;
  let premiumToUse = policyDetails.premiumAmount;

  // Determine base rate/amount based on renewal status
  if (isRenewal) {
    baseRate = rule.renewal_rate || 0;
    baseAmount = rule.renewal_amount || 0;
  } else {
    baseRate = rule.first_year_rate || 0;
    baseAmount = rule.first_year_amount || 0;
  }

  // Line-specific logic
  switch (policyDetails.lineOfBusiness) {
    case 'Motor':
      return calculateMotorCommission(rule, policyDetails, baseRate, baseAmount);
    
    case 'Life':
      return calculateLifeCommission(rule, policyDetails, baseRate, baseAmount);
    
    case 'Health':
      return calculateHealthCommission(rule, policyDetails, baseRate, baseAmount);
    
    case 'Commercial':
      return calculateCommercialCommission(rule, policyDetails, baseRate, baseAmount);
    
    default:
      // Default calculation
      let commissionAmount = 0;
      if (baseAmount > 0) {
        commissionAmount = baseAmount;
      } else if (baseRate > 0) {
        commissionAmount = (premiumToUse * baseRate) / 100;
      }

      return {
        commissionAmount,
        rateUsed: baseRate,
        ruleId: rule.id
      };
  }
}

function calculateMotorCommission(rule: any, policyDetails: any, baseRate: number, baseAmount: number): CommissionResult {
  // Motor insurance: Commission only on OD component
  const odPremium = policyDetails.odPremium || 0;
  const tpPremium = policyDetails.tpPremium || 0;
  
  let commissionAmount = 0;
  let breakdown = {
    baseCommission: 0,
    odCommission: 0,
    tpCommission: 0
  };

  // Apply commission only to OD component
  if (baseAmount > 0) {
    commissionAmount = baseAmount;
    breakdown.baseCommission = baseAmount;
  } else if (baseRate > 0 && odPremium > 0) {
    breakdown.odCommission = (odPremium * baseRate) / 100;
    breakdown.tpCommission = 0; // TP gets 0% commission
    commissionAmount = breakdown.odCommission;
    breakdown.baseCommission = commissionAmount;
  }

  return {
    commissionAmount,
    rateUsed: baseRate,
    ruleId: rule.id,
    breakdown
  };
}

function calculateLifeCommission(rule: any, policyDetails: any, baseRate: number, baseAmount: number): CommissionResult {
  let commissionAmount = 0;
  let effectiveRate = baseRate;

  // Apply payment frequency multiplier for life insurance
  if (policyDetails.paymentFrequency && baseRate > 0) {
    const multipliers: { [key: string]: number } = {
      'Annual': 1.0,
      'Semi-Annual': 0.95,
      'Quarterly': 0.9,
      'Monthly': 0.85
    };
    
    const multiplier = multipliers[policyDetails.paymentFrequency] || 1.0;
    effectiveRate = baseRate * multiplier;
  }

  // Check for tiered ranges based on policy term or premium
  if (rule.rule_ranges && rule.rule_ranges.length > 0) {
    const applicableRange = findApplicableRange(
      rule.rule_ranges, 
      policyDetails.policyTerm || policyDetails.premiumAmount
    );
    
    if (applicableRange) {
      effectiveRate = applicableRange.commission_rate || effectiveRate;
      commissionAmount = applicableRange.commission_amount || 0;
    }
  }

  if (commissionAmount === 0) {
    if (baseAmount > 0) {
      commissionAmount = baseAmount;
    } else if (effectiveRate > 0) {
      commissionAmount = (policyDetails.premiumAmount * effectiveRate) / 100;
    }
  }

  return {
    commissionAmount,
    rateUsed: effectiveRate,
    ruleId: rule.id
  };
}

function calculateHealthCommission(rule: any, policyDetails: any, baseRate: number, baseAmount: number): CommissionResult {
  let commissionAmount = 0;
  let effectiveRate = baseRate;

  // Apply payment frequency multiplier
  if (policyDetails.paymentFrequency && baseRate > 0) {
    const multipliers: { [key: string]: number } = {
      'Annual': 1.0,
      'Semi-Annual': 0.9,
      'Quarterly': 0.8,
      'Monthly': 0.7
    };
    
    const multiplier = multipliers[policyDetails.paymentFrequency] || 1.0;
    effectiveRate = baseRate * multiplier;
  }

  // Apply plan type specific logic
  if (policyDetails.planType === 'Group' && effectiveRate > 7.5) {
    effectiveRate = 7.5; // IRDAI limit for group plans
  } else if (policyDetails.planType === 'Individual' && effectiveRate > 15) {
    effectiveRate = 15; // IRDAI limit for individual plans
  }

  if (baseAmount > 0) {
    commissionAmount = baseAmount;
  } else if (effectiveRate > 0) {
    commissionAmount = (policyDetails.premiumAmount * effectiveRate) / 100;
  }

  return {
    commissionAmount,
    rateUsed: effectiveRate,
    ruleId: rule.id
  };
}

function calculateCommercialCommission(rule: any, policyDetails: any, baseRate: number, baseAmount: number): CommissionResult {
  let commissionAmount = 0;
  let effectiveRate = baseRate;

  // Apply sum insured based ranges for commercial insurance
  if (rule.rule_ranges && rule.rule_ranges.length > 0) {
    const applicableRange = findApplicableRange(
      rule.rule_ranges, 
      policyDetails.sumAssured || policyDetails.premiumAmount
    );
    
    if (applicableRange) {
      effectiveRate = applicableRange.commission_rate || effectiveRate;
      commissionAmount = applicableRange.commission_amount || 0;
    }
  }

  if (commissionAmount === 0) {
    if (baseAmount > 0) {
      commissionAmount = baseAmount;
    } else if (effectiveRate > 0) {
      commissionAmount = (policyDetails.premiumAmount * effectiveRate) / 100;
    }
  }

  return {
    commissionAmount,
    rateUsed: effectiveRate,
    ruleId: rule.id
  };
}

function findApplicableRange(ranges: any[], value: number): any | null {
  for (const range of ranges) {
    if (value >= range.min_value && (!range.max_value || value <= range.max_value)) {
      return range;
    }
  }
  return null;
}