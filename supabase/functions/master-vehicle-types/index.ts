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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 1];
    const isIdPath = id && id !== 'master-vehicle-types' && !isNaN(Number(id));

    switch (req.method) {
      case 'GET':
        if (isIdPath) {
          // Get single vehicle type
          const { data, error } = await supabase
            .from('master_vehicle_types')
            .select('*')
            .eq('vehicle_type_id', parseInt(id))
            .maybeSingle();

          if (error) throw error;
          
          if (!data) {
            return new Response(JSON.stringify({ error: 'Vehicle type not found' }), {
              status: 404,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }

          return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        } else {
          // List all vehicle types
          const { data, error } = await supabase
            .from('master_vehicle_types')
            .select('*')
            .order('vehicle_type_name');

          if (error) throw error;

          return new Response(JSON.stringify(data || []), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

      case 'POST':
        const createData = await req.json();
        
        const { data: newVehicleType, error: createError } = await supabase
          .from('master_vehicle_types')
          .insert({
            vehicle_type_name: createData.vehicle_type_name,
            description: createData.description,
            status: createData.status ?? true
          })
          .select()
          .single();

        if (createError) throw createError;

        return new Response(JSON.stringify(newVehicleType), {
          status: 201,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      case 'PUT':
        if (!isIdPath) {
          return new Response(JSON.stringify({ error: 'Vehicle type ID is required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const updateData = await req.json();
        
        const { data: updatedVehicleType, error: updateError } = await supabase
          .from('master_vehicle_types')
          .update({
            vehicle_type_name: updateData.vehicle_type_name,
            description: updateData.description,
            status: updateData.status
          })
          .eq('vehicle_type_id', parseInt(id))
          .select()
          .single();

        if (updateError) throw updateError;

        return new Response(JSON.stringify(updatedVehicleType), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      case 'DELETE':
        if (!isIdPath) {
          return new Response(JSON.stringify({ error: 'Vehicle type ID is required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const { error: deleteError } = await supabase
          .from('master_vehicle_types')
          .delete()
          .eq('vehicle_type_id', parseInt(id));

        if (deleteError) throw deleteError;

        return new Response(JSON.stringify({ message: 'Vehicle type deleted successfully' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      default:
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
})