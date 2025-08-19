import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
    )

    console.log('Inserting sample finance data...')

    // Get tenant admin profile for sample data
    const { data: tenantAdmin, error: adminError } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'tenant_admin')
      .limit(1)
      .single()

    if (adminError || !tenantAdmin) {
      throw new Error('No tenant admin found for sample data')
    }

    const tenantId = tenantAdmin.id

    // Insert sample finance accounts
    const { error: accountsError } = await supabase
      .from('finance_accounts')
      .upsert([
        { account_code: '1001', account_name: 'Cash in Hand', type: 'Asset', tenant_id: tenantId },
        { account_code: '1002', account_name: 'Bank Account - Current', type: 'Asset', tenant_id: tenantId },
        { account_code: '2001', account_name: 'Commission Payable', type: 'Liability', tenant_id: tenantId },
        { account_code: '4001', account_name: 'Premium Income', type: 'Income', tenant_id: tenantId },
        { account_code: '5001', account_name: 'Commission Expense', type: 'Expense', tenant_id: tenantId }
      ], { onConflict: 'account_code' })

    if (accountsError) throw accountsError

    // Insert sample settlements
    const { error: settlementsError } = await supabase
      .from('finance_settlements')
      .insert([
        { insurer_id: crypto.randomUUID(), period: '2024-01-01', expected_amount: 150000, received_amount: 148500, variance_amount: -1500, status: 'Pending', tenant_id: tenantId },
        { insurer_id: crypto.randomUUID(), period: '2024-01-01', expected_amount: 200000, received_amount: 200000, variance_amount: 0, status: 'Reconciled', tenant_id: tenantId },
        { insurer_id: crypto.randomUUID(), period: '2024-01-01', expected_amount: 75000, received_amount: 70000, variance_amount: -5000, status: 'Pending', tenant_id: tenantId }
      ])

    if (settlementsError) throw settlementsError

    // Insert sample payouts
    const { error: payoutsError } = await supabase
      .from('finance_payouts')
      .insert([
        { 
          org_id: crypto.randomUUID(), 
          agent_name: 'Agent A001 - John Doe', 
          amount: 15000, 
          request_date: '2024-01-15', 
          status: 'Requested', 
          tenant_id: tenantId,
          breakdown: { base_commission: 12000, renewal_bonus: 2000, performance_bonus: 1000 }
        },
        { 
          org_id: crypto.randomUUID(), 
          agent_name: 'Branch B001 - Mumbai Office', 
          amount: 25000, 
          request_date: '2024-01-14', 
          status: 'Approved', 
          tenant_id: tenantId,
          breakdown: { branch_commission: 20000, override_commission: 5000 }
        },
        { 
          org_id: crypto.randomUUID(), 
          agent_name: 'Agent A002 - Jane Smith', 
          amount: 8500, 
          request_date: '2024-01-16', 
          status: 'Paid', 
          tenant_id: tenantId,
          breakdown: { base_commission: 7500, target_achievement: 1000 }
        }
      ])

    if (payoutsError) throw payoutsError

    // Insert sample variances
    const { error: variancesError } = await supabase
      .from('finance_variances')
      .insert([
        { type: 'Insurer', reference_id: crypto.randomUUID(), expected_value: 150000, actual_value: 148500, difference: -1500, status: 'Open', description: 'Settlement shortfall from XYZ Insurance Co.', tenant_id: tenantId },
        { type: 'Revenue', reference_id: crypto.randomUUID(), expected_value: 100000, actual_value: 102500, difference: 2500, status: 'Under Review', description: 'Excess premium recorded vs expected', tenant_id: tenantId },
        { type: 'Payout', reference_id: crypto.randomUUID(), expected_value: 8500, actual_value: 7750, difference: -750, status: 'Resolved', description: 'Commission calculation discrepancy resolved', tenant_id: tenantId }
      ])

    if (variancesError) throw variancesError

    console.log('Sample finance data inserted successfully')

    return new Response(
      JSON.stringify({ success: true, message: 'Sample finance data inserted successfully' }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Error inserting sample data:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})