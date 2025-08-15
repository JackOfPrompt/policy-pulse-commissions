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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const url = new URL(req.url);
    const pathSegments = url.pathname.split('/').filter(Boolean);
    const relationshipId = pathSegments[pathSegments.length - 1];

    console.log(`${req.method} request to relationship codes API`);

    switch (req.method) {
      case 'GET':
        if (relationshipId && relationshipId !== 'relationship-codes') {
          // Get specific relationship code by ID
          const { data, error } = await supabaseClient
            .from('master_relationship_codes')
            .select('*')
            .eq('relationship_id', parseInt(relationshipId))
            .single();

          if (error) {
            console.error('Error fetching relationship code:', error);
            return new Response(
              JSON.stringify({ error: error.message }),
              { 
                status: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              }
            );
          }

          return new Response(
            JSON.stringify(data),
            { 
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        } else {
          // Get all relationship codes with optional status filter
          const status = url.searchParams.get('status');
          
          let query = supabaseClient
            .from('master_relationship_codes')
            .select('*')
            .order('relationship_name');

          if (status === 'active') {
            query = query.eq('is_active', true);
          } else if (status === 'inactive') {
            query = query.eq('is_active', false);
          }

          const { data, error } = await query;

          if (error) {
            console.error('Error fetching relationship codes:', error);
            return new Response(
              JSON.stringify({ error: error.message }),
              { 
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              }
            );
          }

          return new Response(
            JSON.stringify(data),
            { 
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

      case 'POST':
        const createData = await req.json();
        
        // Validate required fields
        if (!createData.relationship_code || !createData.relationship_name) {
          return new Response(
            JSON.stringify({ 
              error: 'relationship_code and relationship_name are required' 
            }),
            { 
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        const { data: newCode, error: createError } = await supabaseClient
          .from('master_relationship_codes')
          .insert({
            relationship_code: createData.relationship_code.toUpperCase(),
            relationship_name: createData.relationship_name,
            description: createData.description || null,
            is_active: createData.is_active ?? true,
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating relationship code:', createError);
          
          let errorMessage = createError.message;
          if (createError.code === '23505') {
            errorMessage = 'Relationship code already exists';
          }

          return new Response(
            JSON.stringify({ error: errorMessage }),
            { 
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        return new Response(
          JSON.stringify({
            status: 'success',
            message: 'Relationship code created successfully',
            relationship_id: newCode.relationship_id,
            data: newCode
          }),
          { 
            status: 201,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );

      case 'PUT':
        if (!relationshipId || relationshipId === 'relationship-codes') {
          return new Response(
            JSON.stringify({ error: 'Relationship ID is required for updates' }),
            { 
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        const updateData = await req.json();
        
        const { data: updatedCode, error: updateError } = await supabaseClient
          .from('master_relationship_codes')
          .update({
            relationship_name: updateData.relationship_name,
            description: updateData.description,
            is_active: updateData.is_active,
            updated_at: new Date().toISOString(),
          })
          .eq('relationship_id', parseInt(relationshipId))
          .select()
          .single();

        if (updateError) {
          console.error('Error updating relationship code:', updateError);
          return new Response(
            JSON.stringify({ error: updateError.message }),
            { 
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        return new Response(
          JSON.stringify({
            status: 'success',
            message: 'Relationship code updated successfully',
            data: updatedCode
          }),
          { 
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );

      case 'DELETE':
        if (!relationshipId || relationshipId === 'relationship-codes') {
          return new Response(
            JSON.stringify({ error: 'Relationship ID is required for deletion' }),
            { 
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        const { error: deleteError } = await supabaseClient
          .from('master_relationship_codes')
          .delete()
          .eq('relationship_id', parseInt(relationshipId));

        if (deleteError) {
          console.error('Error deleting relationship code:', deleteError);
          return new Response(
            JSON.stringify({ error: deleteError.message }),
            { 
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        return new Response(
          JSON.stringify({
            status: 'success',
            message: 'Relationship code deleted successfully'
          }),
          { 
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );

      default:
        return new Response(
          JSON.stringify({ error: 'Method not allowed' }),
          { 
            status: 405,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
})