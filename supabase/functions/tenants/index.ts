import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Database {
  public: {
    Tables: {
      tenant_organizations: {
        Row: {
          id: string
          name: string
          tenant_code: string | null
          domain: string | null
          contact_person: string | null
          contact_email: string | null
          contact_phone: string | null
          address: string | null
          logo_url: string | null
          notes: string | null
          status: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          name: string
          tenant_code?: string | null
          domain?: string | null
          contact_person?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          address?: string | null
          logo_url?: string | null
          notes?: string | null
          status?: string
          is_active?: boolean
        }
        Update: {
          name?: string
          tenant_code?: string | null
          domain?: string | null
          contact_person?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          address?: string | null
          logo_url?: string | null
          notes?: string | null
          status?: string
          is_active?: boolean
        }
      }
      subscription_plans: {
        Row: {
          id: string
          plan_name: string
          plan_code: string
          is_active: boolean
        }
      }
      tenant_subscriptions: {
        Row: {
          id: string
          tenant_id: string
          plan_id: string
          start_date: string
          end_date: string | null
          is_active: boolean
          created_at: string
          updated_at: string
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
    const supabaseClient = createClient<Database>(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const url = new URL(req.url)
    const pathSegments = url.pathname.split('/').filter(Boolean)
    const tenantId = pathSegments[pathSegments.length - 1]

    console.log(`Processing ${req.method} request for tenants API`)

    switch (req.method) {
      case 'GET': {
        if (tenantId && tenantId !== 'tenants') {
          // Get single tenant with subscription details
          const { data: tenant, error: tenantError } = await supabaseClient
            .from('tenant_organizations')
            .select(`
              *,
              tenant_subscriptions (
                id,
                plan_id,
                start_date,
                end_date,
                is_active,
                subscription_plans (
                  id,
                  plan_name,
                  plan_code
                )
              )
            `)
            .eq('id', tenantId)
            .single()

          if (tenantError) {
            console.error('Error fetching tenant:', tenantError)
            return new Response(
              JSON.stringify({ success: false, error: tenantError.message }),
              { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }

          return new Response(
            JSON.stringify({ success: true, data: tenant }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        } else {
          // Get all tenants with pagination and filters
          const searchParams = url.searchParams
          const page = parseInt(searchParams.get('page') || '1')
          const limit = parseInt(searchParams.get('limit') || '10')
          const status = searchParams.get('status')
          const search = searchParams.get('search')

          let query = supabaseClient
            .from('tenant_organizations')
            .select(`
              *,
              tenant_subscriptions (
                subscription_plans (
                  plan_name
                )
              )
            `, { count: 'exact' })

          // Apply filters
          if (status) {
            query = query.eq('status', status)
          }
          if (search) {
            query = query.or(`name.ilike.%${search}%,tenant_code.ilike.%${search}%,domain.ilike.%${search}%`)
          }

          // Apply pagination
          const from = (page - 1) * limit
          const to = from + limit - 1
          query = query.range(from, to).order('created_at', { ascending: false })

          const { data: tenants, error: tenantsError, count } = await query

          if (tenantsError) {
            console.error('Error fetching tenants:', tenantsError)
            return new Response(
              JSON.stringify({ success: false, error: tenantsError.message }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }

          return new Response(
            JSON.stringify({
              success: true,
              data: tenants,
              pagination: {
                page,
                limit,
                total: count || 0,
                totalPages: Math.ceil((count || 0) / limit)
              }
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      }

      case 'POST': {
        const body = await req.json()
        console.log('Creating tenant with data:', body)

        const { data: tenant, error: tenantError } = await supabaseClient
          .from('tenant_organizations')
          .insert([{
            name: body.tenant_name,
            tenant_code: body.tenant_code,
            domain: body.domain,
            contact_person: body.contact_person,
            contact_email: body.contact_email,
            contact_phone: body.contact_phone,
            address: body.address,
            logo_url: body.logo_url,
            notes: body.notes,
            status: body.status || 'Active',
            is_active: body.status !== 'Inactive' && body.status !== 'Suspended'
          }])
          .select()
          .single()

        if (tenantError) {
          console.error('Error creating tenant:', tenantError)
          return new Response(
            JSON.stringify({ success: false, error: tenantError.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Create subscription if subscription_plan_id is provided
        if (body.subscription_plan_id && tenant) {
          const { error: subscriptionError } = await supabaseClient
            .from('tenant_subscriptions')
            .insert([{
              tenant_id: tenant.id,
              plan_id: body.subscription_plan_id,
              start_date: new Date().toISOString().split('T')[0],
              is_active: true
            }])

          if (subscriptionError) {
            console.error('Error creating subscription:', subscriptionError)
          }
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Tenant created successfully', 
            tenant_id: tenant.id 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'PUT': {
        const body = await req.json()
        console.log('Updating tenant:', tenantId, 'with data:', body)

        const { data: tenant, error: tenantError } = await supabaseClient
          .from('tenant_organizations')
          .update({
            name: body.tenant_name,
            tenant_code: body.tenant_code,
            domain: body.domain,
            contact_person: body.contact_person,
            contact_email: body.contact_email,
            contact_phone: body.contact_phone,
            address: body.address,
            logo_url: body.logo_url,
            notes: body.notes,
            status: body.status,
            is_active: body.status === 'Active'
          })
          .eq('id', tenantId)
          .select()
          .single()

        if (tenantError) {
          console.error('Error updating tenant:', tenantError)
          return new Response(
            JSON.stringify({ success: false, error: tenantError.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        return new Response(
          JSON.stringify({ success: true, message: 'Tenant updated successfully' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'PATCH': {
        // Handle status updates
        if (url.pathname.includes('/status')) {
          const body = await req.json()
          console.log('Updating tenant status:', tenantId, 'to:', body.status)

          const { error } = await supabaseClient
            .from('tenant_organizations')
            .update({ 
              status: body.status,
              is_active: body.status === 'Active'
            })
            .eq('id', tenantId)

          if (error) {
            console.error('Error updating tenant status:', error)
            return new Response(
              JSON.stringify({ success: false, error: error.message }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }

          return new Response(
            JSON.stringify({ success: true, message: 'Tenant status updated' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        break
      }

      case 'DELETE': {
        console.log('Deleting tenant:', tenantId)

        const { error } = await supabaseClient
          .from('tenant_organizations')
          .delete()
          .eq('id', tenantId)

        if (error) {
          console.error('Error deleting tenant:', error)
          return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        return new Response(
          JSON.stringify({ success: true, message: 'Tenant deleted successfully' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      default:
        return new Response(
          JSON.stringify({ success: false, error: 'Method not allowed' }),
          { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
  } catch (error) {
    console.error('Tenant API error:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})