import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const url = new URL(req.url)
    const path = url.pathname.split('/').pop()

    if (req.method === 'GET') {
      // Get all departments
      const { data, error } = await supabase
        .from('master_departments')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching departments:', error)
        return new Response(
          JSON.stringify({ error: error.message }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      return new Response(
        JSON.stringify(data),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (req.method === 'POST') {
      // Create new department
      const body = await req.json()
      
      const { data, error } = await supabase
        .from('master_departments')
        .insert([{
          department_name: body.department_name,
          department_code: body.department_code,
          tenant_id: body.tenant_id,
          branch_id: body.branch_id,
          description: body.description,
          status: body.status || 'Active'
        }])
        .select()

      if (error) {
        console.error('Error creating department:', error)
        return new Response(
          JSON.stringify({ error: error.message }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      return new Response(
        JSON.stringify({ message: 'Department created successfully', data }),
        { 
          status: 201, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (req.method === 'PUT') {
      // Update department
      const body = await req.json()
      const departmentId = body.id
      
      if (!departmentId) {
        return new Response(
          JSON.stringify({ error: 'Department ID is required' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }
      
      const { data, error } = await supabase
        .from('master_departments')
        .update({
          department_name: body.department_name,
          department_code: body.department_code,
          tenant_id: body.tenant_id,
          branch_id: body.branch_id,
          description: body.description,
          status: body.status,
          updated_at: new Date().toISOString()
        })
        .eq('department_id', departmentId)
        .select()

      if (error) {
        console.error('Error updating department:', error)
        return new Response(
          JSON.stringify({ error: error.message }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      return new Response(
        JSON.stringify({ message: 'Department updated successfully', data }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (req.method === 'DELETE') {
      // Soft delete department (set status to Inactive)
      const departmentId = url.searchParams.get('id')
      if (!departmentId) {
        return new Response(
          JSON.stringify({ error: 'Department ID is required' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      const { data, error } = await supabase
        .from('master_departments')
        .update({ 
          status: 'Inactive',
          updated_at: new Date().toISOString()
        })
        .eq('department_id', departmentId)
        .select()

      if (error) {
        console.error('Error deleting department:', error)
        return new Response(
          JSON.stringify({ error: error.message }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      return new Response(
        JSON.stringify({ message: 'Department deleted successfully' }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})