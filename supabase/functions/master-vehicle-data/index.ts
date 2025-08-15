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
    const isIdPath = id && id !== 'master-vehicle-data' && !isNaN(Number(id));

    switch (req.method) {
      case 'GET':
        if (isIdPath) {
          // Get single vehicle data
          const { data, error } = await supabase
            .from('master_vehicle_data')
            .select(`
              *,
              master_vehicle_types!vehicle_type_id (
                vehicle_type_name
              )
            `)
            .eq('vehicle_id', parseInt(id))
            .maybeSingle();

          if (error) throw error;
          
          if (!data) {
            return new Response(JSON.stringify({ error: 'Vehicle data not found' }), {
              status: 404,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }

          return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        } else {
          // List all vehicle data
          const { data, error } = await supabase
            .from('master_vehicle_data')
            .select(`
              *,
              master_vehicle_types!vehicle_type_id (
                vehicle_type_name
              )
            `)
            .order('make');

          if (error) throw error;

          return new Response(JSON.stringify(data || []), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

      case 'POST':
        const createData = await req.json();
        
        const { data: newVehicleData, error: createError } = await supabase
          .from('master_vehicle_data')
          .insert({
            vehicle_type_id: createData.vehicle_type_id,
            make: createData.make,
            model: createData.model,
            variant: createData.variant,
            cubic_capacity: createData.cubic_capacity,
            fuel_type: createData.fuel_type,
            status: createData.status ?? true
          })
          .select(`
            *,
            master_vehicle_types!vehicle_type_id (
              vehicle_type_name
            )
          `)
          .single();

        if (createError) throw createError;

        return new Response(JSON.stringify(newVehicleData), {
          status: 201,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      case 'PUT':
        if (!isIdPath) {
          return new Response(JSON.stringify({ error: 'Vehicle ID is required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const updateData = await req.json();
        
        const { data: updatedVehicleData, error: updateError } = await supabase
          .from('master_vehicle_data')
          .update({
            vehicle_type_id: updateData.vehicle_type_id,
            make: updateData.make,
            model: updateData.model,
            variant: updateData.variant,
            cubic_capacity: updateData.cubic_capacity,
            fuel_type: updateData.fuel_type,
            status: updateData.status
          })
          .eq('vehicle_id', parseInt(id))
          .select(`
            *,
            master_vehicle_types!vehicle_type_id (
              vehicle_type_name
            )
          `)
          .single();

        if (updateError) throw updateError;

        return new Response(JSON.stringify(updatedVehicleData), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      case 'DELETE':
        if (!isIdPath) {
          return new Response(JSON.stringify({ error: 'Vehicle ID is required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const { error: deleteError } = await supabase
          .from('master_vehicle_data')
          .delete()
          .eq('vehicle_id', parseInt(id));

        if (deleteError) throw deleteError;

        return new Response(JSON.stringify({ message: 'Vehicle data deleted successfully' }), {
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