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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: requestData } = await req.json()
    const { data: records } = requestData

    if (!records || !Array.isArray(records)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Invalid data format. Expected array of records.' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 400 
        }
      )
    }

    const result = {
      total: records.length,
      successful: 0,
      failed: 0,
      errors: [] as Array<{
        row: number;
        data: any;
        error: string;
      }>
    }

    // Process each record
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const rowNumber = i + 2; // +2 because row 1 is header and array index starts at 0

      try {
        // Validate required fields
        if (!record.tenure_name || !record.duration_value || !record.duration_unit) {
          throw new Error('Missing required fields: tenure_name, duration_value, or duration_unit');
        }

        // Validate duration_value is a positive number
        const durationValue = parseInt(record.duration_value);
        if (isNaN(durationValue) || durationValue < 1) {
          throw new Error('duration_value must be a positive number');
        }

        // Validate duration_unit
        const validUnits = ['Years', 'Months', 'Days'];
        if (!validUnits.includes(record.duration_unit)) {
          throw new Error('duration_unit must be one of: Years, Months, Days');
        }

        // Parse is_active
        let isActive = true;
        if (record.is_active !== undefined) {
          if (typeof record.is_active === 'string') {
            isActive = record.is_active.toLowerCase() === 'true';
          } else {
            isActive = Boolean(record.is_active);
          }
        }

        // Prepare data for insertion
        const policyTenureData = {
          tenure_name: record.tenure_name.trim(),
          duration_value: durationValue,
          duration_unit: record.duration_unit,
          is_active: isActive,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        // Insert the record
        const { error: insertError } = await supabaseClient
          .from('master_policy_tenure')
          .insert([policyTenureData]);

        if (insertError) {
          throw insertError;
        }

        result.successful++;
      } catch (error) {
        console.error(`Error processing row ${rowNumber}:`, error);
        result.failed++;
        result.errors.push({
          row: rowNumber,
          data: record,
          error: error.message || 'Unknown error occurred'
        });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        result 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 200 
      }
    )

  } catch (error) {
    console.error('Bulk import error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: error.message || 'Internal server error' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 
      }
    )
  }
})