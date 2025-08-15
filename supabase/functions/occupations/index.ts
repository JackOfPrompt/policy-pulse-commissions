import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Occupation {
  occupation_id?: string;
  name: string;
  code?: string;
  description?: string;
  status: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { method } = req;
    const url = new URL(req.url);
    const pathSegments = url.pathname.split('/').filter(Boolean);
    const occupationId = pathSegments[pathSegments.length - 1];

    console.log(`${method} request to occupations API`);

    switch (method) {
      case 'GET':
        if (occupationId && occupationId !== 'occupations') {
          // Get specific occupation
          const { data: occupation, error } = await supabaseClient
            .from('master_occupations')
            .select('*')
            .eq('occupation_id', occupationId)
            .single();

          if (error) {
            console.error('Error fetching occupation:', error);
            return new Response(
              JSON.stringify({ success: false, message: 'Occupation not found' }),
              { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          return new Response(
            JSON.stringify({ success: true, data: occupation }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } else {
          // Get all occupations with optional filters
          const status = url.searchParams.get('status');
          const search = url.searchParams.get('search');

          let query = supabaseClient
            .from('master_occupations')
            .select('*')
            .order('updated_at', { ascending: false });

          if (status && status !== 'All') {
            query = query.eq('status', status);
          }

          if (search) {
            query = query.or(`name.ilike.%${search}%,code.ilike.%${search}%`);
          }

          const { data: occupations, error } = await query;

          if (error) {
            console.error('Error fetching occupations:', error);
            return new Response(
              JSON.stringify({ success: false, message: 'Failed to fetch occupations' }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          return new Response(
            JSON.stringify({ success: true, data: occupations }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

      case 'POST':
        const createData: Occupation = await req.json();
        
        const { data: newOccupation, error: createError } = await supabaseClient
          .from('master_occupations')
          .insert({
            name: createData.name,
            code: createData.code || null,
            description: createData.description || null,
            status: createData.status || 'Active'
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating occupation:', createError);
          
          if (createError.code === '23505') {
            return new Response(
              JSON.stringify({ 
                success: false, 
                message: createError.message.includes('name') 
                  ? 'An occupation with this name already exists'
                  : 'An occupation with this code already exists'
              }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          return new Response(
            JSON.stringify({ success: false, message: 'Failed to create occupation' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Occupation created successfully',
            data: { occupation_id: newOccupation.occupation_id }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'PUT':
        const updateData: Occupation = await req.json();
        
        const { data: updatedOccupation, error: updateError } = await supabaseClient
          .from('master_occupations')
          .update({
            name: updateData.name,
            code: updateData.code || null,
            description: updateData.description || null,
            status: updateData.status,
            updated_at: new Date().toISOString()
          })
          .eq('occupation_id', occupationId)
          .select()
          .single();

        if (updateError) {
          console.error('Error updating occupation:', updateError);
          
          if (updateError.code === '23505') {
            return new Response(
              JSON.stringify({ 
                success: false, 
                message: updateError.message.includes('name') 
                  ? 'An occupation with this name already exists'
                  : 'An occupation with this code already exists'
              }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          return new Response(
            JSON.stringify({ success: false, message: 'Failed to update occupation' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Occupation updated successfully',
            data: updatedOccupation
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'DELETE':
        // Soft delete - set status to Inactive
        const { error: deleteError } = await supabaseClient
          .from('master_occupations')
          .update({ 
            status: 'Inactive',
            updated_at: new Date().toISOString()
          })
          .eq('occupation_id', occupationId);

        if (deleteError) {
          console.error('Error deactivating occupation:', deleteError);
          return new Response(
            JSON.stringify({ success: false, message: 'Failed to deactivate occupation' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Occupation deactivated successfully'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      default:
        return new Response(
          JSON.stringify({ success: false, message: 'Method not allowed' }),
          { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ success: false, message: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});