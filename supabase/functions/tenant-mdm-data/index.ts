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

    const { tenantId, entityType, action, data } = await req.json();
    console.log('Tenant MDM request:', { tenantId, entityType, action });

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
      case 'GET_UNIFIED_DATA':
        return await getUnifiedMasterData(supabase, tenantId, entityType);
      
      case 'CREATE_TENANT_DATA':
        return await createTenantMasterData(supabase, tenantId, entityType, data, user.id);
      
      case 'UPDATE_TENANT_DATA':
        return await updateTenantMasterData(supabase, tenantId, entityType, data, user.id);
      
      case 'DELETE_TENANT_DATA':
        return await deleteTenantMasterData(supabase, tenantId, entityType, data.id);
      
      default:
        throw new Error('Invalid action');
    }

  } catch (error) {
    console.error('Error in tenant-mdm-data function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function getUnifiedMasterData(supabase: any, tenantId: string, entityType: string) {
  console.log('Getting unified data for:', entityType);
  
  let systemData = [];
  let tenantData = [];
  
  try {
    switch (entityType) {
      case 'product-categories':
        // Get system categories
        const { data: systemCategories } = await supabase
          .from('master_product_category')
          .select('*')
          .eq('is_active', true);
        
        // Get tenant categories  
        const { data: tenantCategories } = await supabase
          .from('tenant_product_categories')
          .select('*')
          .eq('tenant_id', tenantId)
          .eq('is_active', true);

        systemData = systemCategories?.map(item => ({ ...item, source: 'system', editable: false })) || [];
        tenantData = tenantCategories?.map(item => ({ ...item, source: 'tenant', editable: true })) || [];
        break;

      case 'insurance-providers':
        const { data: systemProviders } = await supabase
          .from('master_insurance_providers')
          .select('*')
          .eq('status', 'Active');
        
        const { data: tenantProviders } = await supabase
          .from('tenant_insurance_providers')
          .select('*')
          .eq('tenant_id', tenantId)
          .eq('status', 'Active');

        systemData = systemProviders?.map(item => ({ ...item, source: 'system', editable: false })) || [];
        tenantData = tenantProviders?.map(item => ({ ...item, source: 'tenant', editable: true })) || [];
        break;

      case 'policy-types':
        const { data: systemPolicyTypes } = await supabase
          .from('master_policy_types')
          .select('*')
          .eq('is_active', true);
        
        const { data: tenantPolicyTypes } = await supabase
          .from('tenant_policy_types')
          .select('*')
          .eq('tenant_id', tenantId)
          .eq('is_active', true);

        systemData = systemPolicyTypes?.map(item => ({ ...item, source: 'system', editable: false })) || [];
        tenantData = tenantPolicyTypes?.map(item => ({ ...item, source: 'tenant', editable: true })) || [];
        break;

      case 'health-conditions':
        const { data: systemConditions } = await supabase
          .from('master_health_conditions')
          .select('*')
          .eq('is_active', true);
        
        const { data: tenantConditions } = await supabase
          .from('tenant_health_conditions')
          .select('*')
          .eq('tenant_id', tenantId)
          .eq('is_active', true);

        systemData = systemConditions?.map(item => ({ ...item, source: 'system', editable: false })) || [];
        tenantData = tenantConditions?.map(item => ({ ...item, source: 'tenant', editable: true })) || [];
        break;

      default:
        throw new Error('Unsupported entity type');
    }

    return new Response(JSON.stringify({
      systemData,
      tenantData,
      total: systemData.length + tenantData.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    throw new Error(`Failed to fetch ${entityType}: ${error.message}`);
  }
}

async function createTenantMasterData(supabase: any, tenantId: string, entityType: string, data: any, userId: string) {
  console.log('Creating tenant data for:', entityType, data);

  try {
    let result;
    const baseData = {
      tenant_id: tenantId,
      created_by: userId,
      updated_by: userId
    };

    switch (entityType) {
      case 'product-categories':
        const { data: newCategory, error: categoryError } = await supabase
          .from('tenant_product_categories')
          .insert([{
            ...baseData,
            category_name: data.category_name,
            category_code: data.category_code,
            category_desc: data.category_desc
          }])
          .select()
          .single();
        
        if (categoryError) throw categoryError;
        result = newCategory;
        break;

      case 'insurance-providers':
        const { data: newProvider, error: providerError } = await supabase
          .from('tenant_insurance_providers')
          .insert([{
            ...baseData,
            provider_name: data.provider_name,
            provider_code: data.provider_code,
            trade_name: data.trade_name,
            contact_email: data.contact_email,
            contact_phone: data.contact_phone,
            contact_person: data.contact_person,
            address_line1: data.address_line1,
            address_line2: data.address_line2,
            state: data.state,
            website_url: data.website_url,
            notes: data.notes
          }])
          .select()
          .single();
        
        if (providerError) throw providerError;
        result = newProvider;
        break;

      case 'policy-types':
        const { data: newPolicyType, error: policyTypeError } = await supabase
          .from('tenant_policy_types')
          .insert([{
            ...baseData,
            policy_type_name: data.policy_type_name,
            policy_type_description: data.policy_type_description
          }])
          .select()
          .single();
        
        if (policyTypeError) throw policyTypeError;
        result = newPolicyType;
        break;

      case 'health-conditions':
        const { data: newCondition, error: conditionError } = await supabase
          .from('tenant_health_conditions')
          .insert([{
            ...baseData,
            condition_name: data.condition_name,
            category: data.category,
            description: data.description,
            waiting_period: data.waiting_period
          }])
          .select()
          .single();
        
        if (conditionError) throw conditionError;
        result = newCondition;
        break;

      default:
        throw new Error('Unsupported entity type for creation');
    }

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    throw new Error(`Failed to create ${entityType}: ${error.message}`);
  }
}

async function updateTenantMasterData(supabase: any, tenantId: string, entityType: string, data: any, userId: string) {
  console.log('Updating tenant data for:', entityType, data);

  try {
    let result;
    const updateData = {
      updated_by: userId,
      updated_at: new Date().toISOString()
    };

    switch (entityType) {
      case 'product-categories':
        const { data: updatedCategory, error: categoryError } = await supabase
          .from('tenant_product_categories')
          .update({
            ...updateData,
            category_name: data.category_name,
            category_code: data.category_code,
            category_desc: data.category_desc,
            is_active: data.is_active
          })
          .eq('tenant_category_id', data.tenant_category_id)
          .eq('tenant_id', tenantId)
          .select()
          .single();
        
        if (categoryError) throw categoryError;
        result = updatedCategory;
        break;

      case 'insurance-providers':
        const { data: updatedProvider, error: providerError } = await supabase
          .from('tenant_insurance_providers')
          .update({
            ...updateData,
            provider_name: data.provider_name,
            provider_code: data.provider_code,
            trade_name: data.trade_name,
            contact_email: data.contact_email,
            contact_phone: data.contact_phone,
            contact_person: data.contact_person,
            address_line1: data.address_line1,
            address_line2: data.address_line2,
            state: data.state,
            website_url: data.website_url,
            notes: data.notes,
            status: data.status
          })
          .eq('tenant_provider_id', data.tenant_provider_id)
          .eq('tenant_id', tenantId)
          .select()
          .single();
        
        if (providerError) throw providerError;
        result = updatedProvider;
        break;

      case 'policy-types':
        const { data: updatedPolicyType, error: policyTypeError } = await supabase
          .from('tenant_policy_types')
          .update({
            ...updateData,
            policy_type_name: data.policy_type_name,
            policy_type_description: data.policy_type_description,
            is_active: data.is_active
          })
          .eq('tenant_policy_type_id', data.tenant_policy_type_id)
          .eq('tenant_id', tenantId)
          .select()
          .single();
        
        if (policyTypeError) throw policyTypeError;
        result = updatedPolicyType;
        break;

      case 'health-conditions':
        const { data: updatedCondition, error: conditionError } = await supabase
          .from('tenant_health_conditions')
          .update({
            ...updateData,
            condition_name: data.condition_name,
            category: data.category,
            description: data.description,
            waiting_period: data.waiting_period,
            is_active: data.is_active
          })
          .eq('tenant_condition_id', data.tenant_condition_id)
          .eq('tenant_id', tenantId)
          .select()
          .single();
        
        if (conditionError) throw conditionError;
        result = updatedCondition;
        break;

      default:
        throw new Error('Unsupported entity type for update');
    }

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    throw new Error(`Failed to update ${entityType}: ${error.message}`);
  }
}

async function deleteTenantMasterData(supabase: any, tenantId: string, entityType: string, id: string) {
  console.log('Deleting tenant data for:', entityType, id);

  try {
    let result;
    
    switch (entityType) {
      case 'product-categories':
        const { error: categoryError } = await supabase
          .from('tenant_product_categories')
          .delete()
          .eq('tenant_category_id', id)
          .eq('tenant_id', tenantId);
        
        if (categoryError) throw categoryError;
        break;

      case 'insurance-providers':
        const { error: providerError } = await supabase
          .from('tenant_insurance_providers')
          .delete()
          .eq('tenant_provider_id', id)
          .eq('tenant_id', tenantId);
        
        if (providerError) throw providerError;
        break;

      case 'policy-types':
        const { error: policyTypeError } = await supabase
          .from('tenant_policy_types')
          .delete()
          .eq('tenant_policy_type_id', id)
          .eq('tenant_id', tenantId);
        
        if (policyTypeError) throw policyTypeError;
        break;

      case 'health-conditions':
        const { error: conditionError } = await supabase
          .from('tenant_health_conditions')
          .delete()
          .eq('tenant_condition_id', id)
          .eq('tenant_id', tenantId);
        
        if (conditionError) throw conditionError;
        break;

      default:
        throw new Error('Unsupported entity type for deletion');
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    throw new Error(`Failed to delete ${entityType}: ${error.message}`);
  }
}