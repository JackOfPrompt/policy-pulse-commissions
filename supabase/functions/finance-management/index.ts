import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface FinanceRequest {
  action: string;
  tenant_id: string;
  data?: any;
  params?: any;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { action, tenant_id, data, params }: FinanceRequest = await req.json();
    console.log(`Finance Management API - Action: ${action}, Tenant: ${tenant_id}`);

    let result;

    switch (action) {
      case 'get_dashboard_kpis':
        result = await getDashboardKPIs(supabaseClient, tenant_id);
        break;
      
      case 'get_accounts':
        result = await getAccounts(supabaseClient, tenant_id, params);
        break;
      
      case 'create_account':
        result = await createAccount(supabaseClient, tenant_id, data);
        break;
      
      case 'update_account':
        result = await updateAccount(supabaseClient, tenant_id, data);
        break;
      
      case 'get_journals':
        result = await getJournals(supabaseClient, tenant_id, params);
        break;
      
      case 'create_journal':
        result = await createJournal(supabaseClient, tenant_id, data);
        break;
      
      case 'post_journal':
        result = await postJournal(supabaseClient, tenant_id, data.journal_id);
        break;
      
      case 'get_settlements':
        result = await getSettlements(supabaseClient, tenant_id, params);
        break;
      
      case 'create_settlement':
        result = await createSettlement(supabaseClient, tenant_id, data);
        break;
      
      case 'approve_settlement':
        result = await approveSettlement(supabaseClient, tenant_id, data);
        break;
      
      case 'get_payouts':
        result = await getPayouts(supabaseClient, tenant_id, params);
        break;
      
      case 'create_payout':
        result = await createPayout(supabaseClient, tenant_id, data);
        break;
      
      case 'approve_payout':
        result = await approvePayout(supabaseClient, tenant_id, data);
        break;
      
      case 'mark_payout_paid':
        result = await markPayoutPaid(supabaseClient, tenant_id, data);
        break;
      
      case 'get_variances':
        result = await getVariances(supabaseClient, tenant_id, params);
        break;
      
      case 'create_variance':
        result = await createVariance(supabaseClient, tenant_id, data);
        break;
      
      case 'resolve_variance':
        result = await resolveVariance(supabaseClient, tenant_id, data);
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Finance Management API Error:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Dashboard KPIs
async function getDashboardKPIs(supabase: any, tenant_id: string) {
  const [
    { count: totalJournals },
    { count: pendingSettlements },
    { count: openVariances },
    { count: totalAccounts }
  ] = await Promise.all([
    supabase.from('finance_journals').select('*', { count: 'exact', head: true }).eq('tenant_id', tenant_id),
    supabase.from('finance_settlements').select('*', { count: 'exact', head: true }).eq('tenant_id', tenant_id).eq('status', 'Pending'),
    supabase.from('finance_variances').select('*', { count: 'exact', head: true }).eq('tenant_id', tenant_id).eq('status', 'Open'),
    supabase.from('finance_accounts').select('*', { count: 'exact', head: true }).eq('tenant_id', tenant_id)
  ]);

  return {
    totalJournals: totalJournals || 0,
    pendingSettlements: pendingSettlements || 0,
    openVariances: openVariances || 0,
    totalAccounts: totalAccounts || 0,
    totalRevenue: 5420000, // Mock data - should come from actual calculations
    totalExpenses: 3890000,
    cashBalance: 1530000,
    settlementsCompleted: 12
  };
}

// Accounts Management
async function getAccounts(supabase: any, tenant_id: string, params: any = {}) {
  let query = supabase
    .from('finance_accounts')
    .select('*')
    .eq('tenant_id', tenant_id)
    .order('account_code');

  if (params.type) {
    query = query.eq('type', params.type);
  }

  if (params.active !== undefined) {
    query = query.eq('is_active', params.active);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

async function createAccount(supabase: any, tenant_id: string, data: any) {
  const { data: account, error } = await supabase
    .from('finance_accounts')
    .insert({
      ...data,
      tenant_id
    })
    .select()
    .single();

  if (error) throw error;
  return account;
}

async function updateAccount(supabase: any, tenant_id: string, data: any) {
  const { data: account, error } = await supabase
    .from('finance_accounts')
    .update(data)
    .eq('account_id', data.account_id)
    .eq('tenant_id', tenant_id)
    .select()
    .single();

  if (error) throw error;
  return account;
}

// Journal Management
async function getJournals(supabase: any, tenant_id: string, params: any = {}) {
  let query = supabase
    .from('finance_journals')
    .select(`
      *,
      finance_journal_lines (
        *,
        finance_accounts (account_code, account_name)
      )
    `)
    .eq('tenant_id', tenant_id)
    .order('created_at', { ascending: false });

  if (params.status) {
    query = query.eq('status', params.status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

async function createJournal(supabase: any, tenant_id: string, data: any) {
  const { journal, lines } = data;
  
  // Create journal
  const { data: newJournal, error: journalError } = await supabase
    .from('finance_journals')
    .insert({
      ...journal,
      tenant_id,
      trace_id: crypto.randomUUID()
    })
    .select()
    .single();

  if (journalError) throw journalError;

  // Create journal lines
  if (lines && lines.length > 0) {
    const { error: linesError } = await supabase
      .from('finance_journal_lines')
      .insert(
        lines.map((line: any) => ({
          ...line,
          journal_id: newJournal.journal_id
        }))
      );

    if (linesError) throw linesError;
  }

  return newJournal;
}

async function postJournal(supabase: any, tenant_id: string, journal_id: string) {
  const { data: journal, error } = await supabase
    .from('finance_journals')
    .update({ 
      status: 'Posted',
      posted_at: new Date().toISOString()
    })
    .eq('journal_id', journal_id)
    .eq('tenant_id', tenant_id)
    .select()
    .single();

  if (error) throw error;
  return journal;
}

// Settlement Management
async function getSettlements(supabase: any, tenant_id: string, params: any = {}) {
  let query = supabase
    .from('finance_settlements')
    .select('*')
    .eq('tenant_id', tenant_id)
    .order('created_at', { ascending: false });

  if (params.status) {
    query = query.eq('status', params.status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

async function createSettlement(supabase: any, tenant_id: string, data: any) {
  const { data: settlement, error } = await supabase
    .from('finance_settlements')
    .insert({
      ...data,
      tenant_id,
      trace_id: crypto.randomUUID()
    })
    .select()
    .single();

  if (error) throw error;
  return settlement;
}

async function approveSettlement(supabase: any, tenant_id: string, data: any) {
  const { data: settlement, error } = await supabase
    .from('finance_settlements')
    .update({ 
      status: 'Approved',
      approved_by: data.approved_by
    })
    .eq('settlement_id', data.settlement_id)
    .eq('tenant_id', tenant_id)
    .select()
    .single();

  if (error) throw error;
  return settlement;
}

// Payout Management
async function getPayouts(supabase: any, tenant_id: string, params: any = {}) {
  let query = supabase
    .from('finance_payouts')
    .select('*')
    .eq('tenant_id', tenant_id)
    .order('created_at', { ascending: false });

  if (params.status) {
    query = query.eq('status', params.status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

async function createPayout(supabase: any, tenant_id: string, data: any) {
  const { data: payout, error } = await supabase
    .from('finance_payouts')
    .insert({
      ...data,
      tenant_id,
      trace_id: crypto.randomUUID()
    })
    .select()
    .single();

  if (error) throw error;
  return payout;
}

async function approvePayout(supabase: any, tenant_id: string, data: any) {
  const { data: payout, error } = await supabase
    .from('finance_payouts')
    .update({ 
      status: 'Approved',
      approved_by: data.approved_by
    })
    .eq('payout_id', data.payout_id)
    .eq('tenant_id', tenant_id)
    .select()
    .single();

  if (error) throw error;
  return payout;
}

async function markPayoutPaid(supabase: any, tenant_id: string, data: any) {
  const { data: payout, error } = await supabase
    .from('finance_payouts')
    .update({ 
      status: 'Paid',
      payment_ref: data.payment_ref
    })
    .eq('payout_id', data.payout_id)
    .eq('tenant_id', tenant_id)
    .select()
    .single();

  if (error) throw error;
  return payout;
}

// Variance Management
async function getVariances(supabase: any, tenant_id: string, params: any = {}) {
  let query = supabase
    .from('finance_variances')
    .select('*')
    .eq('tenant_id', tenant_id)
    .order('created_at', { ascending: false });

  if (params.status) {
    query = query.eq('status', params.status);
  }

  if (params.type) {
    query = query.eq('type', params.type);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

async function createVariance(supabase: any, tenant_id: string, data: any) {
  const { data: variance, error } = await supabase
    .from('finance_variances')
    .insert({
      ...data,
      tenant_id,
      trace_id: crypto.randomUUID(),
      difference: data.expected_value - data.actual_value
    })
    .select()
    .single();

  if (error) throw error;
  return variance;
}

async function resolveVariance(supabase: any, tenant_id: string, data: any) {
  const { data: variance, error } = await supabase
    .from('finance_variances')
    .update({ 
      status: 'Resolved',
      assigned_to: data.assigned_to
    })
    .eq('variance_id', data.variance_id)
    .eq('tenant_id', tenant_id)
    .select()
    .single();

  if (error) throw error;
  return variance;
}