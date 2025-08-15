import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Database {
  public: {
    Tables: {
      master_addon: {
        Row: {
          addon_id: string
          addon_code: string
          addon_name: string
          addon_category: string
          description: string | null
          premium_type: string
          premium_basis: string
          calc_value: number | null
          min_amount: number | null
          max_amount: number | null
          waiting_period_months: number | null
          is_mandatory: boolean
          eligibility_json: any
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          addon_code: string
          addon_name: string
          addon_category?: string
          description?: string
          premium_type?: string
          premium_basis?: string
          calc_value?: number
          min_amount?: number
          max_amount?: number
          waiting_period_months?: number
          is_mandatory?: boolean
          eligibility_json?: any
          is_active?: boolean
        }
        Update: {
          addon_code?: string
          addon_name?: string
          addon_category?: string
          description?: string
          premium_type?: string
          premium_basis?: string
          calc_value?: number
          min_amount?: number
          max_amount?: number
          waiting_period_months?: number
          is_mandatory?: boolean
          eligibility_json?: any
          is_active?: boolean
        }
      }
    }
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient<Database>(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const url = new URL(req.url)
    const pathSegments = url.pathname.split('/').filter(Boolean)
    
    // Remove 'functions' and 'addons' from path to get the actual route
    const routeSegments = pathSegments.slice(2)
    
    console.log('Method:', req.method, 'Route segments:', routeSegments)

    // GET /addons
    if (req.method === 'GET' && routeSegments.length === 0) {
      const searchParams = url.searchParams
      const search = searchParams.get('search')
      const is_active = searchParams.get('is_active')
      const premium_type = searchParams.get('premium_type')
      const category_id = searchParams.get('category_id')
      const subcategory_id = searchParams.get('subcategory_id')
      const page = parseInt(searchParams.get('page') || '1')
      const limit = parseInt(searchParams.get('limit') || '10')
      const offset = (page - 1) * limit

      let query = supabase
        .from('master_addon')
        .select('*', { count: 'exact' })

      // Apply filters
      if (search) {
        query = query.or(`addon_name.ilike.%${search}%,addon_code.ilike.%${search}%,description.ilike.%${search}%`)
      }
      
      if (is_active !== null) {
        query = query.eq('is_active', is_active === 'true')
      }
      
      if (premium_type) {
        query = query.eq('premium_type', premium_type)
      }

      // Apply pagination
      query = query.range(offset, offset + limit - 1)

      const { data, error, count } = await query

      if (error) {
        console.error('Error fetching addons:', error)
        return new Response(
          JSON.stringify({ success: false, message: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({
          success: true,
          data,
          meta: {
            page,
            limit,
            total: count || 0
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // GET /addons/:id
    if (req.method === 'GET' && routeSegments.length === 1) {
      const addonId = routeSegments[0]

      const { data, error } = await supabase
        .from('master_addon')
        .select('*')
        .eq('addon_id', addonId)
        .single()

      if (error) {
        console.error('Error fetching addon:', error)
        return new Response(
          JSON.stringify({ success: false, message: error.message }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ success: true, data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // POST /addons
    if (req.method === 'POST' && routeSegments.length === 0) {
      const body = await req.json()

      // Validation
      if (!body.addon_code || !body.addon_name) {
        return new Response(
          JSON.stringify({ success: false, message: 'addon_code and addon_name are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const validPremiumTypes = ['Flat', 'PercentOfBase', 'AgeBand', 'Slab']
      const validPremiumBasis = ['PerPolicy', 'PerMember']

      if (body.premium_type && !validPremiumTypes.includes(body.premium_type)) {
        return new Response(
          JSON.stringify({ success: false, message: 'Invalid premium_type' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (body.premium_basis && !validPremiumBasis.includes(body.premium_basis)) {
        return new Response(
          JSON.stringify({ success: false, message: 'Invalid premium_basis' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Check if addon_code is unique
      const { data: existing } = await supabase
        .from('master_addon')
        .select('addon_id')
        .eq('addon_code', body.addon_code)
        .single()

      if (existing) {
        return new Response(
          JSON.stringify({ success: false, message: 'addon_code must be unique' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { data, error } = await supabase
        .from('master_addon')
        .insert(body)
        .select()
        .single()

      if (error) {
        console.error('Error creating addon:', error)
        return new Response(
          JSON.stringify({ success: false, message: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ success: true, data, message: 'Addon created successfully' }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // PUT /addons/:id
    if (req.method === 'PUT' && routeSegments.length === 1) {
      const addonId = routeSegments[0]
      const body = await req.json()

      // Check if addon_code is unique (if being updated)
      if (body.addon_code) {
        const { data: existing } = await supabase
          .from('master_addon')
          .select('addon_id')
          .eq('addon_code', body.addon_code)
          .neq('addon_id', addonId)
          .single()

        if (existing) {
          return new Response(
            JSON.stringify({ success: false, message: 'addon_code must be unique' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      }

      const { data, error } = await supabase
        .from('master_addon')
        .update(body)
        .eq('addon_id', addonId)
        .select()
        .single()

      if (error) {
        console.error('Error updating addon:', error)
        return new Response(
          JSON.stringify({ success: false, message: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ success: true, data, message: 'Addon updated successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // PATCH /addons/:id/status
    if (req.method === 'PATCH' && routeSegments.length === 2 && routeSegments[1] === 'status') {
      const addonId = routeSegments[0]

      // Get current status
      const { data: current } = await supabase
        .from('master_addon')
        .select('is_active')
        .eq('addon_id', addonId)
        .single()

      if (!current) {
        return new Response(
          JSON.stringify({ success: false, message: 'Addon not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { data, error } = await supabase
        .from('master_addon')
        .update({ is_active: !current.is_active })
        .eq('addon_id', addonId)
        .select()
        .single()

      if (error) {
        console.error('Error toggling addon status:', error)
        return new Response(
          JSON.stringify({ success: false, message: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ success: true, data, message: 'Addon status toggled successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // DELETE /addons/:id (soft delete)
    if (req.method === 'DELETE' && routeSegments.length === 1) {
      const addonId = routeSegments[0]

      const { data, error } = await supabase
        .from('master_addon')
        .update({ is_active: false })
        .eq('addon_id', addonId)
        .select()
        .single()

      if (error) {
        console.error('Error deleting addon:', error)
        return new Response(
          JSON.stringify({ success: false, message: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ success: true, data, message: 'Addon deleted successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: false, message: 'Route not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ success: false, message: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})