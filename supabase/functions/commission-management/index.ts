import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    
    // API routes starting with /api/v1/commission
    if (pathParts[0] === 'api' && pathParts[1] === 'v1' && pathParts[2] === 'commission') {
      return await handleRestAPI(req, supabase, pathParts.slice(3), url.searchParams);
    }
    
    // Legacy action-based requests
    const { action, tenantId, ...data } = await req.json();
    console.log('Commission management request:', { action, tenantId });

    // Get user from auth header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Invalid user token');
    }

    // Verify user has access to tenant
    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id, role')
      .eq('user_id', user.id)
      .single();

    if (!profile || (profile.tenant_id !== tenantId && profile.role !== 'system_admin')) {
      throw new Error('Access denied to tenant data');
    }

    switch (action) {
      case 'GET_DASHBOARD_DATA':
        return await getDashboardData(supabase, tenantId);
      
      case 'GET_COMMISSION_RULES':
        return await getCommissionRules(supabase, tenantId, data.filters);
      
      case 'CREATE_COMMISSION_RULE':
        return await createCommissionRule(supabase, tenantId, data, user.id);
      
      case 'UPDATE_COMMISSION_RULE':
        return await updateCommissionRule(supabase, tenantId, data, user.id);
      
      case 'DELETE_COMMISSION_RULE':
        return await deleteCommissionRule(supabase, tenantId, data.ruleId, user.id);
      
      case 'GET_AUDIT_LOG':
        return await getAuditLog(supabase, tenantId, data.ruleId);
      
      case 'CALCULATE_COMMISSION':
        return await calculateCommission(supabase, tenantId, data);
      
      case 'GET_COMPLIANCE_ALERTS':
        return await getComplianceAlerts(supabase, tenantId);
      
      default:
        throw new Error('Invalid action');
    }

  } catch (error) {
    console.error('Error in commission-management function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function handleRestAPI(req: Request, supabase: any, pathParts: string[], params: URLSearchParams) {
  const method = req.method;
  const endpoint = pathParts[0] || '';
  
  // Get user from auth header
  const authHeader = req.headers.get('authorization');
  if (!authHeader) {
    throw new Error('No authorization header');
  }

  const { data: { user }, error: userError } = await supabase.auth.getUser(
    authHeader.replace('Bearer ', '')
  );

  if (userError || !user) {
    throw new Error('Invalid user token');
  }

  console.log(`REST API: ${method} /${endpoint}`, pathParts, Object.fromEntries(params));

  switch (endpoint) {
    case 'rules':
      return await handleRulesAPI(req, supabase, pathParts.slice(1), params, user);
    
    case 'calculate':
      return await handleCalculateAPI(req, supabase, user);
    
    case 'irdai':
      return await handleIrdaiAPI(req, supabase, pathParts.slice(1), params, user);
    
    case 'reports':
      return await handleReportsAPI(req, supabase, params, user);
    
    default:
      throw new Error('Invalid endpoint');
  }
}

async function handleRulesAPI(req: Request, supabase: any, pathParts: string[], params: URLSearchParams, user: any) {
  const method = req.method;
  const tenantId = params.get('tenant_id');
  
  if (!tenantId) {
    throw new Error('tenant_id is required');
  }

  // Verify access
  await verifyTenantAccess(supabase, user.id, tenantId);

  switch (method) {
    case 'GET':
      if (pathParts.length === 0) {
        // GET /rules
        const filters = {
          providerId: params.get('insurer_id'),
          productId: params.get('product_id'),
          lobId: params.get('lob'),
          status: params.get('status') || 'Active',
          ruleType: params.get('rule_type')
        };
        return await getCommissionRulesRest(supabase, tenantId, filters);
      }
      break;

    case 'POST':
      if (pathParts.length === 0) {
        // POST /rules
        const ruleData = await req.json();
        return await createCommissionRuleRest(supabase, tenantId, ruleData, user.id);
      } else if (pathParts.length === 2) {
        // POST /rules/{rule_id}/renewal, /rules/{rule_id}/business-bonus, etc.
        const ruleId = pathParts[0];
        const bonusType = pathParts[1];
        const bonusData = await req.json();
        return await addBonusToRule(supabase, tenantId, ruleId, bonusType, bonusData, user.id);
      }
      break;

    case 'PUT':
      if (pathParts.length === 1) {
        // PUT /rules/{rule_id}
        const ruleId = pathParts[0];
        const updateData = await req.json();
        return await updateCommissionRuleRest(supabase, tenantId, ruleId, updateData, user.id);
      }
      break;

    case 'PATCH':
      if (pathParts.length === 2 && pathParts[1] === 'deactivate') {
        // PATCH /rules/{rule_id}/deactivate
        const ruleId = pathParts[0];
        return await deactivateRule(supabase, tenantId, ruleId, user.id);
      }
      break;
  }

  throw new Error('Invalid rules API endpoint');
}

async function handleCalculateAPI(req: Request, supabase: any, user: any) {
  if (req.method !== 'POST') {
    throw new Error('Only POST method allowed for calculate endpoint');
  }

  const calcData = await req.json();
  const { tenant_id } = calcData;
  
  if (!tenant_id) {
    throw new Error('tenant_id is required');
  }

  // Verify access
  await verifyTenantAccess(supabase, user.id, tenant_id);

  return await calculateCommissionRest(supabase, calcData);
}

async function handleIrdaiAPI(req: Request, supabase: any, pathParts: string[], params: URLSearchParams, user: any) {
  if (req.method !== 'GET' || pathParts[0] !== 'caps') {
    throw new Error('Invalid IRDAI API endpoint');
  }

  // GET /irdai/caps
  const lob = params.get('lob');
  const channel = params.get('channel');
  
  return await getIrdaiCaps(supabase, lob, channel);
}

async function handleReportsAPI(req: Request, supabase: any, params: URLSearchParams, user: any) {
  if (req.method !== 'GET') {
    throw new Error('Only GET method allowed for reports endpoint');
  }

  const tenantId = params.get('tenant_id');
  const period = params.get('period');
  
  if (!tenantId) {
    throw new Error('tenant_id is required');
  }

  // Verify access
  await verifyTenantAccess(supabase, user.id, tenantId);

  return await getCommissionReport(supabase, tenantId, period);
}

async function verifyTenantAccess(supabase: any, userId: string, tenantId: string) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id, role')
    .eq('user_id', userId)
    .single();

  if (!profile || (profile.tenant_id !== tenantId && profile.role !== 'system_admin')) {
    throw new Error('Access denied to tenant data');
  }
}

// REST API implementations
async function getCommissionRulesRest(supabase: any, tenantId: string, filters: any) {
  console.log('REST: Getting commission rules for tenant:', tenantId, 'with filters:', filters);
  
  try {
    let query = supabase
      .from('commission_rules')
      .select(`
        rule_id,
        rule_type,
        base_rate,
        channel,
        policy_year,
        valid_from,
        valid_to,
        status,
        master_insurance_providers!inner(provider_name),
        master_product_name!inner(product_name),
        master_line_of_business!inner(lob_name),
        commission_slabs(min_value, max_value, rate),
        commission_flat(flat_amount, unit_type),
        commission_renewal(renewal_rate, policy_year),
        commission_business_bonus(min_gwp, max_gwp, bonus_rate),
        commission_tiers(tier_name, min_business, max_business, extra_bonus),
        commission_time_bonus(campaign_name, bonus_rate, valid_from, valid_to)
      `)
      .eq('tenant_id', tenantId);

    // Apply filters
    if (filters.providerId) query = query.eq('insurer_id', filters.providerId);
    if (filters.productId) query = query.eq('product_id', filters.productId);
    if (filters.lobId) query = query.eq('lob_id', filters.lobId);
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.ruleType) query = query.eq('rule_type', filters.ruleType);

    const { data: rules, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    // Get IRDAI caps for compliance
    const { data: irdaiCaps } = await supabase
      .from('irdai_commission_caps')
      .select('*');

    // Format response according to API spec
    const formattedRules = rules?.map((rule: any) => {
      const cap = irdaiCaps?.find((cap: any) => 
        cap.lob_id === rule.lob_id && 
        cap.policy_year === rule.policy_year &&
        new Date(cap.effective_from) <= new Date() &&
        (!cap.effective_to || new Date(cap.effective_to) >= new Date())
      );

      const maxAllowed = cap?.max_commission_percent || 100;
      const effectiveRate = Math.min(rule.base_rate || 0, maxAllowed);

      let ruleResponse: any = {
        rule_id: rule.rule_id,
        rule_type: rule.rule_type,
        base_rate: rule.base_rate,
        effective_rate: effectiveRate,
        valid_from: rule.valid_from,
        valid_to: rule.valid_to,
        status: rule.status,
        channel: rule.channel,
        policy_year: rule.policy_year
      };

      // Add type-specific data
      if (rule.rule_type === 'Slab' && rule.commission_slabs?.length > 0) {
        ruleResponse.slabs = rule.commission_slabs.map((slab: any) => ({
          min: slab.min_value,
          max: slab.max_value,
          rate: slab.rate
        }));
      }

      if (rule.rule_type === 'Flat' && rule.commission_flat?.length > 0) {
        ruleResponse.flat_amount = rule.commission_flat[0].flat_amount;
        ruleResponse.unit_type = rule.commission_flat[0].unit_type;
      }

      return ruleResponse;
    });

    return new Response(JSON.stringify(formattedRules || []), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    throw new Error(`Failed to fetch commission rules: ${error.message}`);
  }
}

async function createCommissionRuleRest(supabase: any, tenantId: string, ruleData: any, userId: string) {
  console.log('REST: Creating commission rule:', ruleData);

  try {
    // Create main rule
    const { data: newRule, error: ruleError } = await supabase
      .from('commission_rules')
      .insert([{
        tenant_id: tenantId,
        insurer_id: ruleData.insurer_id,
        product_id: ruleData.product_id,
        lob_id: ruleData.lob_id,
        rule_type: ruleData.rule_type,
        base_rate: ruleData.base_rate,
        channel: ruleData.channel,
        policy_year: ruleData.policy_year || 1,
        valid_from: ruleData.valid_from,
        valid_to: ruleData.valid_to,
        created_by: userId
      }])
      .select()
      .single();

    if (ruleError) throw ruleError;

    // Create related records based on rule type
    if (ruleData.rule_type === 'Slab' && ruleData.slabs) {
      const slabInserts = ruleData.slabs.map((slab: any) => ({
        rule_id: newRule.rule_id,
        min_value: slab.min_value,
        max_value: slab.max_value,
        rate: slab.rate,
        slab_type: 'Premium'
      }));

      const { error: slabError } = await supabase
        .from('commission_slabs')
        .insert(slabInserts);

      if (slabError) throw slabError;
    }

    if (ruleData.rule_type === 'Flat' && ruleData.flat_amount) {
      const { error: flatError } = await supabase
        .from('commission_flat')
        .insert([{
          rule_id: newRule.rule_id,
          flat_amount: ruleData.flat_amount,
          unit_type: ruleData.unit_type || 'PerPolicy'
        }]);

      if (flatError) throw flatError;
    }

    // Log audit trail
    await supabase
      .from('commission_audit_log')
      .insert([{
        rule_id: newRule.rule_id,
        action: 'CREATE',
        new_values: ruleData,
        changed_by: userId,
        notes: 'Commission rule created via REST API'
      }]);

    return new Response(JSON.stringify({ 
      success: true, 
      rule_id: newRule.rule_id,
      message: 'Commission rule created successfully'
    }), {
      status: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    throw new Error(`Failed to create commission rule: ${error.message}`);
  }
}

async function updateCommissionRuleRest(supabase: any, tenantId: string, ruleId: string, updateData: any, userId: string) {
  console.log('REST: Updating commission rule:', ruleId, updateData);

  try {
    // Get old values for audit
    const { data: oldRule } = await supabase
      .from('commission_rules')
      .select('*')
      .eq('rule_id', ruleId)
      .eq('tenant_id', tenantId)
      .single();

    if (!oldRule) {
      return new Response(JSON.stringify({ error: 'Rule not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update main rule
    const { data: updatedRule, error: updateError } = await supabase
      .from('commission_rules')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('rule_id', ruleId)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Log audit trail
    await supabase
      .from('commission_audit_log')
      .insert([{
        rule_id: ruleId,
        action: 'UPDATE',
        old_values: oldRule,
        new_values: updateData,
        changed_by: userId,
        notes: 'Commission rule updated via REST API'
      }]);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Commission rule updated successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    throw new Error(`Failed to update commission rule: ${error.message}`);
  }
}

async function deactivateRule(supabase: any, tenantId: string, ruleId: string, userId: string) {
  console.log('REST: Deactivating commission rule:', ruleId);

  try {
    const { data: updatedRule, error: updateError } = await supabase
      .from('commission_rules')
      .update({ 
        status: 'Inactive',
        updated_at: new Date().toISOString()
      })
      .eq('rule_id', ruleId)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Log audit trail
    await supabase
      .from('commission_audit_log')
      .insert([{
        rule_id: ruleId,
        action: 'DEACTIVATE',
        new_values: { status: 'Inactive' },
        changed_by: userId,
        notes: 'Commission rule deactivated via REST API'
      }]);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Commission rule deactivated successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    throw new Error(`Failed to deactivate commission rule: ${error.message}`);
  }
}

async function addBonusToRule(supabase: any, tenantId: string, ruleId: string, bonusType: string, bonusData: any, userId: string) {
  console.log('REST: Adding bonus to rule:', ruleId, bonusType, bonusData);

  try {
    // Verify rule exists and belongs to tenant
    const { data: rule } = await supabase
      .from('commission_rules')
      .select('rule_id')
      .eq('rule_id', ruleId)
      .eq('tenant_id', tenantId)
      .single();

    if (!rule) {
      return new Response(JSON.stringify({ error: 'Rule not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let insertResult;
    switch (bonusType) {
      case 'renewal':
        insertResult = await supabase
          .from('commission_renewal')
          .insert([{
            rule_id: ruleId,
            policy_year: bonusData.policy_year,
            renewal_rate: bonusData.renewal_rate
          }]);
        break;

      case 'business-bonus':
        insertResult = await supabase
          .from('commission_business_bonus')
          .insert([{
            rule_id: ruleId,
            min_gwp: bonusData.min_gwp,
            max_gwp: bonusData.max_gwp,
            bonus_rate: bonusData.bonus_rate
          }]);
        break;

      case 'tier':
        insertResult = await supabase
          .from('commission_tiers')
          .insert([{
            rule_id: ruleId,
            tier_name: bonusData.tier_name,
            min_business: bonusData.min_business,
            max_business: bonusData.max_business,
            extra_bonus: bonusData.extra_bonus
          }]);
        break;

      case 'campaign':
        insertResult = await supabase
          .from('commission_time_bonus')
          .insert([{
            rule_id: ruleId,
            campaign_name: bonusData.campaign_name,
            bonus_rate: bonusData.bonus_rate,
            valid_from: bonusData.valid_from,
            valid_to: bonusData.valid_to
          }]);
        break;

      default:
        throw new Error('Invalid bonus type');
    }

    if (insertResult.error) throw insertResult.error;

    // Log audit trail
    await supabase
      .from('commission_audit_log')
      .insert([{
        rule_id: ruleId,
        action: 'ADD_BONUS',
        new_values: { bonus_type: bonusType, ...bonusData },
        changed_by: userId,
        notes: `Added ${bonusType} bonus via REST API`
      }]);

    return new Response(JSON.stringify({ 
      success: true, 
      message: `${bonusType} bonus added successfully`
    }), {
      status: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    throw new Error(`Failed to add bonus to rule: ${error.message}`);
  }
}

async function calculateCommissionRest(supabase: any, params: any) {
  console.log('REST: Calculating commission:', params);

  try {
    const { tenant_id, insurer_id, product_id, channel, policy_year, premium, gwp_to_date } = params;

    // Get applicable rules
    const { data: rules } = await supabase
      .from('commission_rules')
      .select(`
        *,
        commission_slabs(*),
        commission_flat(*),
        commission_renewal(*),
        commission_business_bonus(*),
        commission_tiers(*),
        commission_time_bonus(*)
      `)
      .eq('tenant_id', tenant_id)
      .eq('insurer_id', insurer_id)
      .eq('product_id', product_id)
      .eq('policy_year', policy_year)
      .eq('status', 'Active')
      .lte('valid_from', new Date().toISOString().split('T')[0])
      .or(`valid_to.is.null,valid_to.gte.${new Date().toISOString().split('T')[0]}`);

    let baseCommission = 0;
    let bonusCommission = 0;
    let appliedRate = 0;

    for (const rule of rules || []) {
      switch (rule.rule_type) {
        case 'Fixed':
          appliedRate = rule.base_rate || 0;
          baseCommission = premium * (appliedRate / 100);
          break;

        case 'Slab':
          const applicableSlab = rule.commission_slabs?.find((slab: any) => 
            premium >= slab.min_value && 
            (!slab.max_value || premium <= slab.max_value)
          );
          if (applicableSlab) {
            appliedRate = applicableSlab.rate;
            baseCommission = premium * (appliedRate / 100);
          }
          break;

        case 'Flat':
          const flatConfig = rule.commission_flat?.[0];
          if (flatConfig) {
            baseCommission = flatConfig.flat_amount;
            appliedRate = (baseCommission / premium) * 100;
          }
          break;
      }

      // Calculate bonuses
      if (gwp_to_date && rule.commission_business_bonus) {
        for (const bonus of rule.commission_business_bonus) {
          if (gwp_to_date >= bonus.min_gwp && (!bonus.max_gwp || gwp_to_date <= bonus.max_gwp)) {
            bonusCommission += premium * (bonus.bonus_rate / 100);
          }
        }
      }

      // Time-bound campaign bonuses
      if (rule.commission_time_bonus) {
        for (const campaign of rule.commission_time_bonus) {
          const now = new Date().toISOString().split('T')[0];
          if (now >= campaign.valid_from && now <= campaign.valid_to) {
            bonusCommission += premium * (campaign.bonus_rate / 100);
          }
        }
      }
    }

    const totalCommission = baseCommission + bonusCommission;

    // Check IRDAI compliance
    const { data: irdaiCap } = await supabase
      .from('irdai_commission_caps')
      .select('max_commission_percent')
      .eq('policy_year', policy_year)
      .lte('effective_from', new Date().toISOString().split('T')[0])
      .or(`effective_to.is.null,effective_to.gte.${new Date().toISOString().split('T')[0]}`)
      .limit(1)
      .single();

    const maxAllowed = irdaiCap?.max_commission_percent || 100;
    const complianceStatus = appliedRate <= maxAllowed ? 'Within Limit' : 'Exceeds Limit';

    return new Response(JSON.stringify({
      premium,
      applied_rate: appliedRate,
      base_commission: baseCommission,
      bonus_commission: bonusCommission,
      total_commission: totalCommission,
      irdai_cap: maxAllowed,
      compliance_status: complianceStatus
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    throw new Error(`Failed to calculate commission: ${error.message}`);
  }
}

async function getIrdaiCaps(supabase: any, lob?: string, channel?: string) {
  console.log('REST: Getting IRDAI caps:', { lob, channel });

  try {
    let query = supabase
      .from('irdai_commission_caps')
      .select(`
        cap_id,
        lob_id,
        policy_year,
        channel,
        product_category,
        max_commission_percent,
        effective_from,
        effective_to,
        master_line_of_business!inner(lob_name)
      `)
      .lte('effective_from', new Date().toISOString().split('T')[0])
      .or(`effective_to.is.null,effective_to.gte.${new Date().toISOString().split('T')[0]}`);

    if (lob) {
      query = query.eq('master_line_of_business.lob_name', lob);
    }
    if (channel) {
      query = query.eq('channel', channel);
    }

    const { data: caps, error } = await query.order('policy_year');

    if (error) throw error;

    const formattedCaps = caps?.map((cap: any) => ({
      lob: cap.master_line_of_business.lob_name,
      channel: cap.channel,
      policy_year: cap.policy_year,
      max_rate: cap.max_commission_percent,
      product_category: cap.product_category,
      effective_from: cap.effective_from,
      effective_to: cap.effective_to
    }));

    return new Response(JSON.stringify(formattedCaps || []), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    throw new Error(`Failed to fetch IRDAI caps: ${error.message}`);
  }
}

async function getCommissionReport(supabase: any, tenantId: string, period?: string) {
  console.log('REST: Getting commission report:', { tenantId, period });

  try {
    // For now, return mock data structure matching the API spec
    // This would need to be connected to actual policy/commission transaction data
    
    const reportData = {
      tenant_id: tenantId,
      total_commission: 4500000,
      by_lob: {
        "Health": 2500000,
        "Motor": 1200000,
        "Life": 800000
      },
      by_rule_type: {
        "Fixed": 60,
        "Slab": 25,
        "Bonus": 15
      },
      period: period || new Date().getFullYear() + '-Q' + Math.ceil((new Date().getMonth() + 1) / 3)
    };

    return new Response(JSON.stringify(reportData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    throw new Error(`Failed to generate commission report: ${error.message}`);
  }
}

// Legacy functions (keep existing for backward compatibility)
async function getDashboardData(supabase: any, tenantId: string) {
  console.log('Getting commission dashboard data for tenant:', tenantId);
  
  try {
    // Commission Performance by LOB
    const { data: lobPerformance } = await supabase
      .from('commission_rules')
      .select(`
        lob_id,
        master_line_of_business!inner(lob_name),
        base_rate
      `)
      .eq('tenant_id', tenantId)
      .eq('status', 'Active');

    // Active Commission Rules Count by Type
    const { data: rulesCounts } = await supabase
      .from('commission_rules')
      .select('rule_type')
      .eq('tenant_id', tenantId)
      .eq('status', 'Active');

    // Compliance Alerts (rules exceeding IRDAI caps)
    const { data: complianceAlerts } = await getComplianceAlertsData(supabase, tenantId);

    // Upcoming Campaign Bonuses
    const { data: upcomingCampaigns } = await supabase
      .from('commission_time_bonus')
      .select(`
        campaign_name,
        bonus_rate,
        valid_from,
        valid_to,
        commission_rules!inner(status, tenant_id)
      `)
      .eq('commission_rules.tenant_id', tenantId)
      .eq('commission_rules.status', 'Active')
      .gte('valid_to', new Date().toISOString().split('T')[0]);

    // Process data for charts
    const lobChart = lobPerformance?.reduce((acc: any, rule: any) => {
      const lobName = rule.master_line_of_business.lob_name;
      if (!acc[lobName]) {
        acc[lobName] = { name: lobName, avgRate: 0, count: 0 };
      }
      acc[lobName].avgRate = (acc[lobName].avgRate * acc[lobName].count + (rule.base_rate || 0)) / (acc[lobName].count + 1);
      acc[lobName].count++;
      return acc;
    }, {});

    const rulesCount = rulesCounts?.reduce((acc: any, rule: any) => {
      acc[rule.rule_type] = (acc[rule.rule_type] || 0) + 1;
      return acc;
    }, {});

    return new Response(JSON.stringify({
      lobPerformance: Object.values(lobChart || {}),
      rulesCount,
      complianceAlerts: complianceAlerts || [],
      upcomingCampaigns: upcomingCampaigns || []
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    throw new Error(`Failed to fetch dashboard data: ${error.message}`);
  }
}

async function getCommissionRules(supabase: any, tenantId: string, filters: any = {}) {
  console.log('Getting commission rules for tenant:', tenantId, 'with filters:', filters);
  
  try {
    let query = supabase
      .from('commission_rules')
      .select(`
        *,
        master_insurance_providers!inner(provider_name),
        master_product_name!inner(product_name),
        master_line_of_business!inner(lob_name),
        commission_slabs(*),
        commission_flat(*),
        commission_renewal(*),
        commission_business_bonus(*),
        commission_tiers(*),
        commission_time_bonus(*)
      `)
      .eq('tenant_id', tenantId);

    // Apply filters
    if (filters.providerId) {
      query = query.eq('insurer_id', filters.providerId);
    }
    if (filters.lobId) {
      query = query.eq('lob_id', filters.lobId);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.ruleType) {
      query = query.eq('rule_type', filters.ruleType);
    }

    const { data: rules, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    // Get IRDAI caps for compliance checking
    const { data: irdaiCaps } = await supabase
      .from('irdai_commission_caps')
      .select('*');

    // Calculate final effective rates with IRDAI compliance
    const rulesWithCompliance = rules?.map((rule: any) => {
      const cap = irdaiCaps?.find((cap: any) => 
        cap.lob_id === rule.lob_id && 
        cap.policy_year === rule.policy_year &&
        new Date(cap.effective_from) <= new Date() &&
        (!cap.effective_to || new Date(cap.effective_to) >= new Date())
      );

      const maxAllowed = cap?.max_commission_percent || 100;
      const finalRate = Math.min(rule.base_rate || 0, maxAllowed);
      const isCompliant = (rule.base_rate || 0) <= maxAllowed;

      return {
        ...rule,
        final_effective_rate: finalRate,
        is_compliant: isCompliant,
        irdai_cap: maxAllowed
      };
    });

    return new Response(JSON.stringify({ rules: rulesWithCompliance || [] }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    throw new Error(`Failed to fetch commission rules: ${error.message}`);
  }
}

async function createCommissionRule(supabase: any, tenantId: string, ruleData: any, userId: string) {
  console.log('Creating commission rule:', ruleData);

  try {
    // Create main rule
    const { data: newRule, error: ruleError } = await supabase
      .from('commission_rules')
      .insert([{
        tenant_id: tenantId,
        insurer_id: ruleData.insurer_id,
        product_id: ruleData.product_id,
        lob_id: ruleData.lob_id,
        rule_type: ruleData.rule_type,
        base_rate: ruleData.base_rate,
        channel: ruleData.channel,
        policy_year: ruleData.policy_year,
        valid_from: ruleData.valid_from,
        valid_to: ruleData.valid_to,
        created_by: userId
      }])
      .select()
      .single();

    if (ruleError) throw ruleError;

    // Create related records based on rule type
    if (ruleData.rule_type === 'Slab' && ruleData.slabs) {
      const slabInserts = ruleData.slabs.map((slab: any) => ({
        rule_id: newRule.rule_id,
        min_value: slab.min_value,
        max_value: slab.max_value,
        rate: slab.rate,
        slab_type: slab.slab_type || 'Premium'
      }));

      const { error: slabError } = await supabase
        .from('commission_slabs')
        .insert(slabInserts);

      if (slabError) throw slabError;
    }

    if (ruleData.rule_type === 'Flat' && ruleData.flat_amount) {
      const { error: flatError } = await supabase
        .from('commission_flat')
        .insert([{
          rule_id: newRule.rule_id,
          flat_amount: ruleData.flat_amount,
          unit_type: ruleData.unit_type || 'PerPolicy'
        }]);

      if (flatError) throw flatError;
    }

    if (ruleData.rule_type === 'Campaign' && ruleData.campaign) {
      const { error: campaignError } = await supabase
        .from('commission_time_bonus')
        .insert([{
          rule_id: newRule.rule_id,
          bonus_rate: ruleData.campaign.bonus_rate,
          valid_from: ruleData.campaign.valid_from,
          valid_to: ruleData.campaign.valid_to,
          campaign_name: ruleData.campaign.campaign_name
        }]);

      if (campaignError) throw campaignError;
    }

    // Log audit trail
    await supabase
      .from('commission_audit_log')
      .insert([{
        rule_id: newRule.rule_id,
        action: 'CREATE',
        new_values: ruleData,
        changed_by: userId,
        notes: 'Commission rule created'
      }]);

    return new Response(JSON.stringify({ success: true, rule: newRule }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    throw new Error(`Failed to create commission rule: ${error.message}`);
  }
}

async function updateCommissionRule(supabase: any, tenantId: string, ruleData: any, userId: string) {
  console.log('Updating commission rule:', ruleData);

  try {
    // Get old values for audit
    const { data: oldRule } = await supabase
      .from('commission_rules')
      .select('*')
      .eq('rule_id', ruleData.rule_id)
      .eq('tenant_id', tenantId)
      .single();

    // Update main rule
    const { data: updatedRule, error: updateError } = await supabase
      .from('commission_rules')
      .update({
        base_rate: ruleData.base_rate,
        channel: ruleData.channel,
        valid_from: ruleData.valid_from,
        valid_to: ruleData.valid_to,
        status: ruleData.status
      })
      .eq('rule_id', ruleData.rule_id)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Log audit trail
    await supabase
      .from('commission_audit_log')
      .insert([{
        rule_id: ruleData.rule_id,
        action: 'UPDATE',
        old_values: oldRule,
        new_values: ruleData,
        changed_by: userId,
        notes: 'Commission rule updated'
      }]);

    return new Response(JSON.stringify({ success: true, rule: updatedRule }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    throw new Error(`Failed to update commission rule: ${error.message}`);
  }
}

async function deleteCommissionRule(supabase: any, tenantId: string, ruleId: string, userId: string) {
  console.log('Deleting commission rule:', ruleId);

  try {
    // Get rule for audit
    const { data: rule } = await supabase
      .from('commission_rules')
      .select('*')
      .eq('rule_id', ruleId)
      .eq('tenant_id', tenantId)
      .single();

    // Delete rule (cascade will handle related records)
    const { error: deleteError } = await supabase
      .from('commission_rules')
      .delete()
      .eq('rule_id', ruleId)
      .eq('tenant_id', tenantId);

    if (deleteError) throw deleteError;

    // Log audit trail
    await supabase
      .from('commission_audit_log')
      .insert([{
        rule_id: ruleId,
        action: 'DELETE',
        old_values: rule,
        changed_by: userId,
        notes: 'Commission rule deleted'
      }]);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    throw new Error(`Failed to delete commission rule: ${error.message}`);
  }
}

async function getAuditLog(supabase: any, tenantId: string, ruleId?: string) {
  console.log('Getting audit log for tenant:', tenantId, 'rule:', ruleId);

  try {
    let query = supabase
      .from('commission_audit_log')
      .select(`
        *,
        commission_rules!inner(tenant_id, insurer_id),
        profiles(first_name, last_name)
      `)
      .eq('commission_rules.tenant_id', tenantId);

    if (ruleId) {
      query = query.eq('rule_id', ruleId);
    }

    const { data: auditLog, error } = await query
      .order('changed_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    return new Response(JSON.stringify({ auditLog: auditLog || [] }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    throw new Error(`Failed to fetch audit log: ${error.message}`);
  }
}

async function calculateCommission(supabase: any, tenantId: string, params: any) {
  console.log('Calculating commission:', params);

  try {
    const { premium_amount, insurer_id, product_id, policy_year, channel } = params;

    // Get applicable rules
    const { data: rules } = await supabase
      .from('commission_rules')
      .select(`
        *,
        commission_slabs(*),
        commission_flat(*),
        commission_renewal(*),
        commission_business_bonus(*),
        commission_tiers(*),
        commission_time_bonus(*)
      `)
      .eq('tenant_id', tenantId)
      .eq('insurer_id', insurer_id)
      .eq('product_id', product_id)
      .eq('policy_year', policy_year)
      .eq('status', 'Active')
      .lte('valid_from', new Date().toISOString().split('T')[0])
      .or(`valid_to.is.null,valid_to.gte.${new Date().toISOString().split('T')[0]}`);

    let totalCommission = 0;
    let totalRate = 0;
    const breakdown = [];

    for (const rule of rules || []) {
      let ruleCommission = 0;
      let ruleRate = 0;

      switch (rule.rule_type) {
        case 'Fixed':
          ruleRate = rule.base_rate || 0;
          ruleCommission = premium_amount * (ruleRate / 100);
          break;

        case 'Slab':
          const applicableSlab = rule.commission_slabs?.find((slab: any) => 
            premium_amount >= slab.min_value && 
            (!slab.max_value || premium_amount <= slab.max_value)
          );
          if (applicableSlab) {
            ruleRate = applicableSlab.rate;
            ruleCommission = premium_amount * (ruleRate / 100);
          }
          break;

        case 'Flat':
          const flatConfig = rule.commission_flat?.[0];
          if (flatConfig) {
            ruleCommission = flatConfig.flat_amount;
            ruleRate = (ruleCommission / premium_amount) * 100;
          }
          break;

        default:
          ruleRate = rule.base_rate || 0;
          ruleCommission = premium_amount * (ruleRate / 100);
      }

      totalCommission += ruleCommission;
      totalRate += ruleRate;

      breakdown.push({
        rule_type: rule.rule_type,
        rate: ruleRate,
        commission: ruleCommission
      });
    }

    // Check IRDAI compliance
    const { data: irdaiCap } = await supabase
      .from('irdai_commission_caps')
      .select('max_commission_percent')
      .eq('policy_year', policy_year)
      .lte('effective_from', new Date().toISOString().split('T')[0])
      .or(`effective_to.is.null,effective_to.gte.${new Date().toISOString().split('T')[0]}`)
      .limit(1)
      .single();

    const maxAllowed = irdaiCap?.max_commission_percent || 100;
    const finalRate = Math.min(totalRate, maxAllowed);
    const finalCommission = premium_amount * (finalRate / 100);

    return new Response(JSON.stringify({
      calculation: {
        premium_amount,
        total_rate: totalRate,
        final_rate: finalRate,
        total_commission: totalCommission,
        final_commission: finalCommission,
        irdai_cap: maxAllowed,
        is_compliant: totalRate <= maxAllowed,
        breakdown
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    throw new Error(`Failed to calculate commission: ${error.message}`);
  }
}

async function getComplianceAlerts(supabase: any, tenantId: string) {
  return await getComplianceAlertsData(supabase, tenantId);
}

async function getComplianceAlertsData(supabase: any, tenantId: string) {
  console.log('Getting compliance alerts for tenant:', tenantId);

  try {
    // Get rules that exceed IRDAI caps
    const { data: violations } = await supabase
      .from('commission_rules')
      .select(`
        *,
        master_insurance_providers!inner(provider_name),
        master_product_name!inner(product_name),
        master_line_of_business!inner(lob_name)
      `)
      .eq('tenant_id', tenantId)
      .eq('status', 'Active');

    const { data: irdaiCaps } = await supabase
      .from('irdai_commission_caps')
      .select('*');

    const alerts = violations?.filter((rule: any) => {
      const cap = irdaiCaps?.find((cap: any) => 
        cap.lob_id === rule.lob_id && 
        cap.policy_year === rule.policy_year &&
        new Date(cap.effective_from) <= new Date() &&
        (!cap.effective_to || new Date(cap.effective_to) >= new Date())
      );

      return cap && (rule.base_rate || 0) > cap.max_commission_percent;
    }).map((rule: any) => {
      const cap = irdaiCaps?.find((cap: any) => 
        cap.lob_id === rule.lob_id && cap.policy_year === rule.policy_year
      );

      return {
        rule_id: rule.rule_id,
        provider_name: rule.master_insurance_providers.provider_name,
        product_name: rule.master_product_name.product_name,
        lob_name: rule.master_line_of_business.lob_name,
        current_rate: rule.base_rate,
        max_allowed: cap?.max_commission_percent || 0,
        excess_amount: (rule.base_rate || 0) - (cap?.max_commission_percent || 0),
        severity: (rule.base_rate || 0) - (cap?.max_commission_percent || 0) > 5 ? 'high' : 'medium'
      };
    });

    return new Response(JSON.stringify({ alerts: alerts || [] }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    throw new Error(`Failed to fetch compliance alerts: ${error.message}`);
  }
}
