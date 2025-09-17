import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Safe getter utility
function getVal(obj: any, paths: string[]): any {
  for (const p of paths) {
    const [section, field] = p.split('.');
    if (obj?.[section]?.[field] !== undefined && obj?.[section]?.[field] !== null && obj?.[section]?.[field] !== '') {
      return obj[section][field];
    }
  }
  return null;
}

function splitName(fullName?: string | null): { first?: string; last?: string } {
  if (!fullName || typeof fullName !== 'string') return {};
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { first: parts[0] };
  const last = parts.pop();
  return { first: parts.join(' '), last };
}

function inferProductType(formData: any): string | null {
  try {
    const policyType = getVal(formData, ['policy.POLICY_TYPE', 'policy_details.policy_type']);
    if (formData?.vehicle || formData?.vehicle_details || /motor|vehicle|two\s*wheeler|four\s*wheeler/i.test(policyType || '')) {
      return 'motor';
    }
    if (formData?.insured_members || formData?.policy?.INSURED_PERSONS || /health|mediclaim|family\s*floater/i.test(policyType || '')) {
      return 'health';
    }
    if (formData?.benefits || /life|term|endowment|ulip/i.test(policyType || '')) {
      return 'life';
    }
    return null;
  } catch (_) {
    return null;
  }
}

async function getOrCreateOrgId(formData: any): Promise<string> {
  // If org_id is provided in formData, use it (from authenticated user context)
  if (formData.org_id) {
    return formData.org_id as string;
  }

  // Try first existing org as fallback
  const { data: org, error: orgErr } = await supabase
    .from('organizations')
    .select('id')
    .limit(1)
    .maybeSingle();

  if (org && org.id) return org.id as string;

  // Create a default org if none exists
  const { data: created, error: createErr } = await supabase
    .from('organizations')
    .insert({ name: 'Default Organization', code: `DEFAULT-${crypto.randomUUID().slice(0,8)}` })
    .select('id')
    .single();
  if (createErr) throw createErr;
  return created.id as string;
}

async function getOrCreateProductTypeId(orgId: string, productType: string): Promise<string> {
  const code = (productType || 'general').toLowerCase();
  
  // First try to find existing product type by category (which is the main field)
  const { data: pt, error: ptErr } = await supabase
    .from('product_types')
    .select('id')
    .eq('org_id', orgId)
    .eq('category', code)
    .limit(1)
    .maybeSingle();
  if (pt && pt.id) return pt.id as string;

  // If not found, create new product type with proper mapping
  const categoryMap: Record<string, string> = {
    'motor': 'motor',
    'vehicle': 'motor',
    'auto': 'motor',
    'health': 'health',
    'medical': 'health',
    'mediclaim': 'health',
    'life': 'life',
    'term': 'life',
    'endowment': 'life',
    'ulip': 'life',
    'general': 'general'
  };
  
  const category = categoryMap[code] || 'general';
  const name = category.charAt(0).toUpperCase() + category.slice(1);
  
  const { data: created, error: createErr } = await supabase
    .from('product_types')
    .insert({ 
      org_id: orgId, 
      code: category, 
      name: name, 
      category: category, 
      is_active: true 
    })
    .select('id')
    .single();
  if (createErr) throw createErr;
  return created.id as string;
}

async function getOrCreateCustomer(orgId: string, formData: any) {
  const fullName = getVal(formData, ['customer.CUSTOMER_NAME', 'policyholder.name']);
  const email = getVal(formData, ['customer.CUSTOMER_EMAIL', 'policyholder.email']);
  const phone = getVal(formData, ['customer.CUSTOMER_PHONE', 'policyholder.mobile']);
  const address = getVal(formData, ['customer.CUSTOMER_ADDRESS', 'policyholder.address']);
  const gender = getVal(formData, ['customer.GENDER', 'policyholder.gender']);
  const dob = getVal(formData, ['customer.CUSTOMER_DOB', 'policyholder.dob']);
  const city = getVal(formData, ['customer.CITY']);
  const state = getVal(formData, ['customer.STATE']);
  const pincode = getVal(formData, ['customer.PINCODE']);
  const customerType = (getVal(formData, ['business_details.CUSTOMER_TYPE', 'customer.CUSTOMER_TYPE']) || 'individual').toString().toLowerCase();

  const nameParts = splitName(fullName || undefined);

  // Find by email or phone
  let query = supabase.from('customers').select('id').eq('org_id', orgId).limit(1);
  if (email && phone) {
    query = query.or(`email.eq.${email},phone.eq.${phone}`);
  } else if (email) {
    query = query.eq('email', email);
  } else if (phone) {
    query = query.eq('phone', phone);
  }
  const { data: existing, error: findErr } = await query.maybeSingle();
  if (existing?.id) return existing.id as string;

  const insertPayload: any = {
    org_id: orgId,
    first_name: nameParts.first || null,
    last_name: nameParts.last || null,
    email: email || null,
    phone: phone || null,
    address: address || null,
    gender: gender || null,
    date_of_birth: dob || null,
    city: city || null,
    state: state || null,
    pincode: pincode || null,
    customer_type: customerType,
  };

  const { data: created, error: insErr } = await supabase
    .from('customers')
    .insert(insertPayload)
    .select('id')
    .single();
  if (insErr) throw insErr;
  return created.id as string;
}

async function createVehicle(orgId: string, customerId: string, formData: any) {
  try {
    // Try from multiple schemas
    const regNum = getVal(formData, ['vehicle.VEHICLE_NUMBER', 'vehicle_details.registration_number']);
    const make = getVal(formData, ['vehicle.VEHICLE_MAKE', 'vehicle_details.make']);
    const model = getVal(formData, ['vehicle.VEHICLE_MODEL', 'vehicle_details.model']);
    const variant = getVal(formData, ['vehicle.VEHICLE_VARIANT', 'vehicle_details.variant']);
    const fuelType = getVal(formData, ['vehicle.FUEL_TYPE', 'vehicle_details.fuel_type']);
    const engineNumber = getVal(formData, ['vehicle.VEHICLE_ENGINE_NUMBER', 'vehicle_details.engine_number']);
    const chassisNumber = getVal(formData, ['vehicle.VEHICLE_CHASSID', 'vehicle_details.chassis_number']);
    const cc = getVal(formData, ['vehicle.VEHICLE_CC', 'vehicle_details.cc_kw']);
    const bodyType = getVal(formData, ['vehicle.VEHICLE_BODY_TYPE', 'vehicle_details.body_type']);
    const permitType = getVal(formData, ['vehicle.VEHICLE_PERMIT_TYPE']);
    const regDate = getVal(formData, ['vehicle.VEHICLE_REGISTRATION_DATE']);
    const mfgDate = getVal(formData, ['vehicle.MFG_DATE', 'vehicle_details.year_of_manufacture']);

    // Check if vehicles table exists, if not skip vehicle creation
    const { error: tableCheckError } = await supabase
      .from('vehicles')
      .select('id')
      .limit(1);
      
    if (tableCheckError && tableCheckError.message?.includes('relation "vehicles" does not exist')) {
      console.log('Vehicles table does not exist, skipping vehicle creation');
      return null;
    }

    const payload: any = {
      org_id: orgId,
      customer_id: customerId,
      registration_number: regNum || null,
      make: make || null,
      model: model || null,
      variant: variant || null,
      fuel_type: fuelType || null,
      engine_number: engineNumber || null,
      chassis_number: chassisNumber || null,
      cc: cc ? Number(String(cc).replace(/[^0-9]/g, '')) : null,
      body_type: bodyType || null,
      permit_type: permitType || null,
      registration_date: regDate || null,
      manufacture_date: mfgDate || null,
    };

    const { data, error } = await supabase
      .from('vehicles')
      .insert(payload)
      .select('id')
      .single();
    if (error) throw error;
    return data.id as string;
  } catch (error) {
    console.error('Vehicle creation error:', error);
    return null; // Return null instead of throwing
  }
}

function publicFileUrl(fileName?: string | null, documentPath?: string | null): string | null {
  // Priority: use documentPath (from document upload) over fileName (from extraction)
  const filePath = documentPath || fileName;
  if (!filePath) return null;
  
  const { data } = supabase.storage.from('policies').getPublicUrl(filePath);
  return data?.publicUrl || null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { formData, metadata } = await req.json();
    console.log('save-policy incoming', { hasFormData: !!formData, hasMetadata: !!metadata });
    
    if (formData) {
      console.log('save-policy payload preview', {
        org_id: formData?.org_id,
        source_type: formData?.source_type,
        employee_id: formData?.employee_id,
        agent_id: formData?.agent_id,
        misp_id: formData?.misp_id,
        broker_company: formData?.broker_company,
      });
    }
    if (!formData) {
      return new Response(JSON.stringify({ success: false, error: 'Missing formData' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
    }

    const productType: string = metadata?.productType || getVal(formData, ['policy.PRODUCT_TYPE']) || inferProductType(formData) || 'motor';

    console.log('Determined product type:', productType);

    // Prepare base entities
    const orgId = await getOrCreateOrgId(formData);
    const productTypeId = await getOrCreateProductTypeId(orgId, productType);
    const customerId = await getOrCreateCustomer(orgId, formData);

    const provider = getVal(formData, ['insurer.INSURER_NAME', 'insurer_details.insurer_name', 'insurance_provider.PROVIDER_NAME']);
    const policyNumber = getVal(formData, ['policy.POLICY_NUMBER', 'policy_details.policy_number']);
    const startDate = getVal(formData, ['policy.POLICY_START_DATE', 'policy_details.period_start']);
    const endDate = getVal(formData, ['policy.POLICY_END_DATE', 'policy_details.period_end']);
    const issueDate = getVal(formData, ['policy.POLICY_ISSUE_DATE', 'policy_details.issue_date']);
    const planName = getVal(formData, ['policy.PLAN_NAME', 'policy_details.plan_name']);
    const gst = getVal(formData, ['policy.GST', 'premium_details.gst']);
    const netPremium = getVal(formData, ['policy.NET_PREMIUM', 'premium_details.net_premium', 'premium_details.installment_premium']);
    const grossPremium = getVal(formData, ['policy.GROSS_PREMIUM', 'premium_details.total_premium']);

    const pdfLink = publicFileUrl(metadata?.fileName, metadata?.documentPath);

    // Insert policy with business source assignments
    const policyPayload: any = {
      org_id: orgId,
      customer_id: customerId,
      policy_number: policyNumber || `POL-${Date.now()}`,
      provider: provider || null,
      plan_name: planName || null,
      start_date: startDate || null,
      end_date: endDate || null,
      issue_date: issueDate || null,
      gst: gst !== null ? Number(gst) : null,
      premium_without_gst: netPremium !== null ? Number(netPremium) : null,
      premium_with_gst: grossPremium !== null ? Number(grossPremium) : null,
      gross_premium: grossPremium !== null ? Number(grossPremium) : (netPremium !== null ? Number(netPremium) : null),
      product_type_id: productTypeId,
      pdf_link: pdfLink,
      dynamic_details: formData,
      policy_status: 'active',
      // Business source assignments
      source_type: formData.source_type || null,
      employee_id: formData.employee_id || null,
      posp_id: formData.posp_id || null,
      misp_id: formData.misp_id || null,
      agent_id: formData.agent_id || null,
      broker_company: formData.broker_company || null,
    };

    const { data: policyRow, error: policyErr } = await supabase
      .from('policies')
      .upsert(policyPayload, { onConflict: 'org_id,policy_number' })
      .select('id')
      .single();
    if (policyErr) throw policyErr;

    const policyId: string = policyRow.id;

    // Create basic commission record (skip complex calculation for now)
    try {
      console.log('Creating basic commission record for policy:', policyId);
      
      // Upsert basic commission record with pending status (avoid duplicates)
      const { error: insertCommissionError } = await supabase
        .from('policy_commissions')
        .upsert({
          policy_id: policyId,
          org_id: orgId,
          product_type: productType,
          commission_status: 'pending',
          created_by: formData.created_by || null
        }, { onConflict: 'policy_id' });
        
      if (insertCommissionError) {
        console.error('Commission insert error:', insertCommissionError);
      } else {
        console.log('Commission record created successfully with pending status');
      }
    } catch (commissionErr) {
      console.error('Commission processing error:', commissionErr);
      // Continue without failing the policy save
    }

    // Product-specific detail tables - with error handling
    try {
      if (productType.toLowerCase() === 'motor') {
        console.log('Creating motor policy details...');
        // Create vehicle first
        let vehicleId = null;
        try {
          vehicleId = await createVehicle(orgId, customerId, formData);
        } catch (vehicleErr) {
          console.error('Vehicle creation error:', vehicleErr);
          // Continue without vehicle if creation fails
        }

        const idv = getVal(formData, ['policy.IDV', 'vehicle_details.idv']);
        const ncb = getVal(formData, ['policy.NCB', 'previous_insurance.ncb']);
        const prevClaim = getVal(formData, ['policy.PREVIOUS_CLAIM', 'previous_insurance.claims_history']);
        const policyType = getVal(formData, ['policy.POLICY_TYPE', 'policy_details.policy_type']);
        const policySubType = getVal(formData, ['policy.POLICY_SUB_TYPE']);
        const prevInsurer = getVal(formData, ['policy.PREVIOUS_POLICY_COMPANY_NAME', 'previous_insurance.insurer_name']);
        const prevPolicyNum = getVal(formData, ['policy.PREVIOUS_POLICY_NUMBER', 'previous_insurance.policy_number']);

        const motorPayload: any = {
          policy_id: policyId,
          vehicle_id: vehicleId,
          idv: idv !== null ? Number(idv) : null,
          ncb: ncb !== null ? Number(ncb) : null,
          previous_claim: typeof prevClaim === 'string' ? /yes|claim/i.test(prevClaim) : Boolean(prevClaim),
          policy_type: policyType || null,
          policy_sub_type: policySubType || null,
          previous_insurer_name: prevInsurer || null,
          previous_policy_number: prevPolicyNum || null,
        };

        const { error: motorErr } = await supabase.from('motor_policy_details').insert(motorPayload);
        if (motorErr) {
          console.error('Motor policy details error:', motorErr);
          throw motorErr;
        }
        console.log('Motor policy details created successfully');
      }

      if (productType.toLowerCase() === 'health') {
        console.log('Creating health policy details...');
        const policyType = getVal(formData, ['policy.POLICY_TYPE']);
        const uin = getVal(formData, ['insurance_provider.PROVIDER_UIN', 'policy_details.uin']);
        const coverTillAge = getVal(formData, ['policy.COVER_TILL_AGE']);

        const healthPayload: any = {
          policy_id: policyId,
          policy_type: policyType || null,
          uin: uin || null,
          cover_type: coverTillAge ? `Till ${coverTillAge}` : null,
          benefits: null,
          exclusions: null,
        };
        const { error: healthErr } = await supabase.from('health_policy_details').insert(healthPayload);
        if (healthErr) {
          console.error('Health policy details error:', healthErr);
          throw healthErr;
        }

        // Insured members
        const insuredPersons: any[] = formData?.policy?.INSURED_PERSONS || formData?.insured_members || [];
        if (Array.isArray(insuredPersons) && insuredPersons.length) {
          const rows = insuredPersons.map((m) => ({
            policy_id: policyId,
            name: m?.name || null,
            dob: m?.dob || null,
            gender: m?.gender || null,
            relationship: m?.relationship_with_proposer || m?.relationship || null,
            member_id: m?.member_id || null,
            pre_existing_diseases: m?.pre_existing_diseases || null,
            sum_insured: m?.sum_insured ? Number(m.sum_insured) : null,
          }));
          const { error: imErr } = await supabase.from('insured_members').insert(rows);
          if (imErr) {
            console.error('Insured members error:', imErr);
            // Don't fail for member insertion errors
          }
        }
        console.log('Health policy details created successfully');
      }

      if (productType.toLowerCase() === 'life') {
        console.log('Creating life policy details...');
        const policyTerm = getVal(formData, ['policy_details.policy_term', 'policy.POLICY_TENURE']);
        const premiumPaymentTerm = getVal(formData, ['policy_details.premium_payment_term', 'policy.POLICY_PAYMENT_TERM']);
        const premiumFrequency = getVal(formData, ['policy_details.premium_payment_frequency', 'policy.PAYMENT_TERM']);
        const sumAssured = getVal(formData, ['benefits.sum_assured_on_death', 'policy.SUM_INSURED']);
        const maturityDate = getVal(formData, ['policy_details.maturity_date']);
        const uin = getVal(formData, ['policy_details.uin', 'insurance_provider.PROVIDER_UIN']);
        const planType = getVal(formData, ['policy_details.plan_type']);
        const taxBenefits = getVal(formData, ['premium_details.tax_benefits']);

        const lifePayload: any = {
          policy_id: policyId,
          policy_term: policyTerm ? Number(String(policyTerm).replace(/[^0-9]/g, '')) : null,
          premium_payment_term: premiumPaymentTerm ? Number(String(premiumPaymentTerm).replace(/[^0-9]/g, '')) : null,
          premium_frequency: premiumFrequency || null,
          sum_assured: sumAssured !== null ? Number(sumAssured) : null,
          maturity_date: maturityDate || null,
          uin: uin || null,
          plan_type: planType || null,
          tax_benefits: taxBenefits || null,
        };
        const { error: lifeErr } = await supabase.from('life_policy_details').insert(lifePayload);
        if (lifeErr) {
          console.error('Life policy details error:', lifeErr);
          throw lifeErr;
        }
        console.log('Life policy details created successfully');
      }
    } catch (detailsErr) {
      console.error('Product-specific details error:', detailsErr);
      // Don't fail the entire save for details table errors
    }

    return new Response(
      JSON.stringify({ success: true, policy_id: policyId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('save-policy error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error?.message || 'Unknown error', details: error }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
