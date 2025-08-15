import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Database {
  public: {
    Tables: {
      addon_category_map: {
        Row: {
          map_id: string
          addon_id: string
          category_id: string | null
          subcategory_id: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          addon_id: string
          category_id?: string
          subcategory_id?: string
          is_active?: boolean
        }
        Update: {
          category_id?: string
          subcategory_id?: string
          is_active?: boolean
        }
      }
      master_product_category: {
        Row: {
          category_id: string
          category_name: string
          category_code: string
        }
      }
      product_subcategory: {
        Row: {
          subcategory_id: string
          subcategory_name: string
          subcategory_code: string
          category_id: string
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
    
    // Remove 'functions' and 'addon-mappings' from path to get the actual route
    const routeSegments = pathSegments.slice(2)
    
    console.log('Method:', req.method, 'Route segments:', routeSegments)

    // GET /addons/:id/mappings
    if (req.method === 'GET' && routeSegments.length === 2 && routeSegments[0] === 'addons' && routeSegments[2] === 'mappings') {
      const addonId = routeSegments[1]

      const { data, error } = await supabase
        .from('addon_category_map')
        .select(`
          *,
          master_product_category:category_id (category_name, category_code),
          product_subcategory:subcategory_id (subcategory_name, subcategory_code)
        `)
        .eq('addon_id', addonId)

      if (error) {
        console.error('Error fetching addon mappings:', error)
        return new Response(
          JSON.stringify({ success: false, message: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ success: true, data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // POST /addons/:id/mappings
    if (req.method === 'POST' && routeSegments.length === 2 && routeSegments[0] === 'addons' && routeSegments[2] === 'mappings') {
      const addonId = routeSegments[1]
      const body = await req.json()

      // Validate foreign keys if provided
      if (body.category_id) {
        const { data: category } = await supabase
          .from('master_product_category')
          .select('category_id')
          .eq('category_id', body.category_id)
          .single()

        if (!category) {
          return new Response(
            JSON.stringify({ success: false, message: 'Invalid category_id' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      }

      if (body.subcategory_id) {
        const { data: subcategory } = await supabase
          .from('product_subcategory')
          .select('subcategory_id')
          .eq('subcategory_id', body.subcategory_id)
          .single()

        if (!subcategory) {
          return new Response(
            JSON.stringify({ success: false, message: 'Invalid subcategory_id' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      }

      const mappingData = {
        addon_id: addonId,
        ...body
      }

      const { data, error } = await supabase
        .from('addon_category_map')
        .insert(mappingData)
        .select()
        .single()

      if (error) {
        console.error('Error creating addon mapping:', error)
        return new Response(
          JSON.stringify({ success: false, message: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ success: true, data, message: 'Mapping created successfully' }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // DELETE /addons/:id/mappings/:mapId
    if (req.method === 'DELETE' && routeSegments.length === 3 && routeSegments[0] === 'addons' && routeSegments[2] === 'mappings') {
      const addonId = routeSegments[1]
      const mapId = routeSegments[3]

      const { data, error } = await supabase
        .from('addon_category_map')
        .delete()
        .eq('map_id', mapId)
        .eq('addon_id', addonId)
        .select()
        .single()

      if (error) {
        console.error('Error deleting addon mapping:', error)
        return new Response(
          JSON.stringify({ success: false, message: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ success: true, data, message: 'Mapping deleted successfully' }),
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