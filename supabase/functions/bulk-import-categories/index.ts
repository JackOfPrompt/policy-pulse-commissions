import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ImportResult {
  total: number;
  successful: number;
  failed: number;
  errors: Array<{
    row: number;
    data: any;
    error: string;
  }>;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    const { data: categories } = await req.json();

    if (!Array.isArray(categories)) {
      return new Response(
        JSON.stringify({ success: false, message: 'Invalid data format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result: ImportResult = {
      total: categories.length,
      successful: 0,
      failed: 0,
      errors: []
    };

    console.log(`Processing ${categories.length} categories for bulk import`);

    for (let i = 0; i < categories.length; i++) {
      const category = categories[i];
      const rowNumber = i + 2; // +2 because row 1 is header and array is 0-indexed

      try {
        // Validate required fields
        if (!category.category_code || !category.category_name) {
          throw new Error('category_code and category_name are required');
        }

        // Check for duplicate category_code
        const { data: existingCode } = await supabase
          .from('master_product_category')
          .select('category_id')
          .eq('category_code', category.category_code)
          .single();

        if (existingCode) {
          throw new Error(`Category code '${category.category_code}' already exists`);
        }

        // Check for duplicate category_name
        const { data: existingName } = await supabase
          .from('master_product_category')
          .select('category_id')
          .eq('category_name', category.category_name)
          .single();

        if (existingName) {
          throw new Error(`Category name '${category.category_name}' already exists`);
        }

        // Prepare data for insertion
        const categoryData = {
          category_code: category.category_code.trim(),
          category_name: category.category_name.trim(),
          category_desc: category.category_desc ? category.category_desc.trim() : null,
          is_active: category.is_active === 'false' ? false : true // Default to true
        };

        // Insert category
        const { error: insertError } = await supabase
          .from('master_product_category')
          .insert(categoryData);

        if (insertError) {
          throw new Error(insertError.message);
        }

        result.successful++;
        console.log(`Successfully imported category: ${category.category_name}`);

      } catch (error) {
        console.error(`Error importing category at row ${rowNumber}:`, error);
        result.failed++;
        result.errors.push({
          row: rowNumber,
          data: category,
          error: error.message
        });
      }
    }

    console.log(`Bulk import completed. Success: ${result.successful}, Failed: ${result.failed}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        result,
        message: `Import completed. ${result.successful} successful, ${result.failed} failed.`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Bulk import error:', error);
    return new Response(
      JSON.stringify({ success: false, message: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});