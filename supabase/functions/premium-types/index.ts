import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const url = new URL(req.url)
    const pathParts = url.pathname.split('/').filter(Boolean)
    const premiumTypeId = pathParts[pathParts.length - 1]

    switch (req.method) {
      case 'POST':
        return await createPremiumType(supabaseClient, req)
      case 'GET':
        if (premiumTypeId && premiumTypeId !== 'premium-types') {
          return await getPremiumType(supabaseClient, premiumTypeId)
        } else {
          return await listPremiumTypes(supabaseClient, url)
        }
      case 'PUT':
        return await updatePremiumType(supabaseClient, premiumTypeId, req)
      case 'PATCH':
        if (url.pathname.endsWith('/status')) {
          const id = pathParts[pathParts.length - 2]
          return await toggleStatus(supabaseClient, id)
        }
        return new Response('Invalid PATCH endpoint', { status: 400, headers: corsHeaders })
      case 'DELETE':
        return await deletePremiumType(supabaseClient, premiumTypeId)
      default:
        return new Response('Method not allowed', { status: 405, headers: corsHeaders })
    }
  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

async function createPremiumType(supabaseClient: any, req: Request) {
  const body = await req.json()
  
  const { data, error } = await supabaseClient
    .from('master_premium_types')
    .insert([body])
    .select()
    .single()

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({
    premium_type_id: data.premium_type_id,
    message: 'Premium type created successfully'
  }), {
    status: 201,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function listPremiumTypes(supabaseClient: any, url: URL) {
  const page = parseInt(url.searchParams.get('page') || '1')
  const limit = parseInt(url.searchParams.get('limit') || '20')
  const status = url.searchParams.get('status')
  const search = url.searchParams.get('search')
  
  let query = supabaseClient
    .from('master_premium_types')
    .select('*', { count: 'exact' })
    .order('premium_type_name')

  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  if (search) {
    query = query.or(`premium_type_name.ilike.%${search}%,premium_type_code.ilike.%${search}%`)
  }

  const from = (page - 1) * limit
  const to = from + limit - 1
  
  const { data, error, count } = await query.range(from, to)

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({
    data,
    pagination: {
      page,
      limit,
      total: count,
      totalPages: Math.ceil((count || 0) / limit)
    }
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function getPremiumType(supabaseClient: any, premiumTypeId: string) {
  const { data, error } = await supabaseClient
    .from('master_premium_types')
    .select('*')
    .eq('premium_type_id', premiumTypeId)
    .single()

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function updatePremiumType(supabaseClient: any, premiumTypeId: string, req: Request) {
  const body = await req.json()
  
  const { data, error } = await supabaseClient
    .from('master_premium_types')
    .update({
      ...body,
      updated_at: new Date().toISOString(),
    })
    .eq('premium_type_id', premiumTypeId)
    .select()
    .single()

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({
    premium_type_id: data.premium_type_id,
    message: 'Premium type updated successfully'
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function toggleStatus(supabaseClient: any, premiumTypeId: string) {
  // First get current status
  const { data: current, error: fetchError } = await supabaseClient
    .from('master_premium_types')
    .select('status')
    .eq('premium_type_id', premiumTypeId)
    .single()

  if (fetchError) {
    return new Response(JSON.stringify({ error: fetchError.message }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const newStatus = current.status === 'Active' ? 'Inactive' : 'Active'
  
  const { data, error } = await supabaseClient
    .from('master_premium_types')
    .update({ 
      status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('premium_type_id', premiumTypeId)
    .select()
    .single()

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({
    premium_type_id: data.premium_type_id,
    status: newStatus,
    message: `Premium type ${newStatus.toLowerCase()} successfully`
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function deletePremiumType(supabaseClient: any, premiumTypeId: string) {
  // Soft delete by setting status to 'Deleted'
  const { data, error } = await supabaseClient
    .from('master_premium_types')
    .update({ 
      status: 'Deleted',
      updated_at: new Date().toISOString(),
    })
    .eq('premium_type_id', premiumTypeId)
    .select()
    .single()

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({
    premium_type_id: data.premium_type_id,
    message: 'Premium type deleted successfully'
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}