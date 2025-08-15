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

    const { data: subcategories } = await req.json();

    if (!Array.isArray(subcategories)) {
      return new Response(
        JSON.stringify({ success: false, message: 'Invalid data format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result: ImportResult = {
      total: subcategories.length,
      successful: 0,
      failed: 0,
      errors: []
    };

    console.log(`Processing ${subcategories.length} subcategories for bulk import`);

    // Get all categories to validate parent category codes
    const { data: allCategories, error: categoriesError } = await supabase
      .from('master_product_category')
      .select('category_id, category_code, category_name');

    if (categoriesError) {
      throw new Error('Failed to fetch categories for validation');
    }

    const categoryMap = new Map();
    allCategories?.forEach(cat => {
      categoryMap.set(cat.category_code, cat.category_id);
    });

    for (let i = 0; i < subcategories.length; i++) {
      const subcategory = subcategories[i];
      const rowNumber = i + 2; // +2 because row 1 is header and array is 0-indexed

      try {
        // Validate required fields
        if (!subcategory.category_code || !subcategory.subcategory_code || !subcategory.subcategory_name) {
          throw new Error('category_code, subcategory_code and subcategory_name are required');
        }

        // Find parent category
        const parentCategoryId = categoryMap.get(subcategory.category_code);
        if (!parentCategoryId) {
          throw new Error(`Parent category with code '${subcategory.category_code}' not found`);
        }

        // Check for duplicate subcategory_code
        const { data: existingCode } = await supabase
          .from('product_subcategory')
          .select('subcategory_id')
          .eq('subcategory_code', subcategory.subcategory_code)
          .single();

        if (existingCode) {
          throw new Error(`Subcategory code '${subcategory.subcategory_code}' already exists`);
        }

        // Check for duplicate subcategory_name within the same category
        const { data: existingName } = await supabase
          .from('product_subcategory')
          .select('subcategory_id')
          .eq('category_id', parentCategoryId)
          .eq('subcategory_name', subcategory.subcategory_name)
          .single();

        if (existingName) {
          throw new Error(`Subcategory name '${subcategory.subcategory_name}' already exists in this category`);
        }

        // Prepare data for insertion
        const subcategoryData = {
          category_id: parentCategoryId,
          subcategory_code: subcategory.subcategory_code.trim(),
          subcategory_name: subcategory.subcategory_name.trim(),
          subcategory_desc: subcategory.subcategory_desc ? subcategory.subcategory_desc.trim() : null,
          is_active: subcategory.is_active === 'false' ? false : true // Default to true
        };

        // Insert subcategory
        const { error: insertError } = await supabase
          .from('product_subcategory')
          .insert(subcategoryData);

        if (insertError) {
          throw new Error(insertError.message);
        }

        result.successful++;
        console.log(`Successfully imported subcategory: ${subcategory.subcategory_name}`);

      } catch (error) {
        console.error(`Error importing subcategory at row ${rowNumber}:`, error);
        result.failed++;
        result.errors.push({
          row: rowNumber,
          data: subcategory,
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