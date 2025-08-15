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
    const premiumTermId = pathParts[pathParts.length - 1]

    switch (req.method) {
      case 'POST':
        return await createPremiumTerm(supabaseClient, req)
      case 'GET':
        if (premiumTermId && premiumTermId !== 'premium-terms') {
          return await getPremiumTerm(supabaseClient, premiumTermId)
        } else {
          return await listPremiumTerms(supabaseClient, url)
        }
      case 'PUT':
        return await updatePremiumTerm(supabaseClient, premiumTermId, req)
      case 'DELETE':
        return await deletePremiumTerm(supabaseClient, premiumTermId)
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

async function createPremiumTerm(supabaseClient: any, req: Request) {
  const body = await req.json()
  
  const { data, error } = await supabaseClient
    .from('master_premium_terms')
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
    success: true,
    message: 'Premium term added successfully',
    data: { premium_term_id: data.premium_term_id }
  }), {
    status: 201,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function listPremiumTerms(supabaseClient: any, url: URL) {
  const status = url.searchParams.get('status')
  const search = url.searchParams.get('search')
  
  let query = supabaseClient
    .from('master_premium_terms')
    .select('*')
    .order('premium_term_name')

  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  if (search) {
    query = query.or(`premium_term_name.ilike.%${search}%,premium_term_code.ilike.%${search}%`)
  }

  const { data, error } = await query

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function getPremiumTerm(supabaseClient: any, premiumTermId: string) {
  const { data, error } = await supabaseClient
    .from('master_premium_terms')
    .select('*')
    .eq('premium_term_id', premiumTermId)
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

async function updatePremiumTerm(supabaseClient: any, premiumTermId: string, req: Request) {
  const body = await req.json()
  
  const { data, error } = await supabaseClient
    .from('master_premium_terms')
    .update({
      ...body,
      updated_at: new Date().toISOString(),
    })
    .eq('premium_term_id', premiumTermId)
    .select()
    .single()

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({
    success: true,
    message: 'Premium term updated successfully',
    data: { premium_term_id: data.premium_term_id }
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function deletePremiumTerm(supabaseClient: any, premiumTermId: string) {
  const { data, error } = await supabaseClient
    .from('master_premium_terms')
    .update({ 
      status: 'Inactive',
      updated_at: new Date().toISOString(),
    })
    .eq('premium_term_id', premiumTermId)
    .select()
    .single()

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({
    success: true,
    message: 'Premium term deleted successfully',
    data: { premium_term_id: data.premium_term_id }
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}