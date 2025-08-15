import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(part => part.length > 0);
    const subcategoryId = pathParts[1]; // subcategories/:id

    console.log(`${req.method} ${url.pathname}`, { pathParts, subcategoryId });

    switch (req.method) {
      case 'GET':
        return await handleGet(supabase, url, subcategoryId);
      case 'POST':
        return await handlePost(supabase, req);
      case 'PUT':
        return await handlePut(supabase, req, subcategoryId);
      case 'DELETE':
        return await handleDelete(supabase, subcategoryId);
      default:
        return new Response(
          JSON.stringify({ success: false, message: 'Method not allowed' }), 
          { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ success: false, message: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function handleGet(supabase: any, url: URL, subcategoryId?: string) {
  const searchParams = url.searchParams;
  
  // Single subcategory by ID
  if (subcategoryId) {
    const { data, error } = await supabase
      .from('product_subcategory')
      .select(`
        *,
        master_product_category (
          category_id,
          category_code,
          category_name
        )
      `)
      .eq('subcategory_id', subcategoryId)
      .single();

    if (error) {
      console.error('Error fetching subcategory:', error);
      return new Response(
        JSON.stringify({ success: false, message: 'Subcategory not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // All subcategories with filters
  let query = supabase
    .from('product_subcategory')
    .select(`
      *,
      master_product_category (
        category_id,
        category_code,
        category_name
      )
    `);

  // Apply filters
  const categoryId = searchParams.get('category_id');
  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }

  const isActive = searchParams.get('is_active');
  if (isActive !== null) {
    query = query.eq('is_active', isActive === 'true');
  }

  const search = searchParams.get('search');
  if (search) {
    query = query.or(`subcategory_name.ilike.%${search}%,subcategory_code.ilike.%${search}%`);
  }

  // Apply pagination
  const limit = parseInt(searchParams.get('limit') || '10');
  const offset = parseInt(searchParams.get('offset') || '0');
  query = query.range(offset, offset + limit - 1);

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching subcategories:', error);
    return new Response(
      JSON.stringify({ success: false, message: 'Error fetching subcategories' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({ success: true, data }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handlePost(supabase: any, req: Request) {
  const body = await req.json();
  const { category_id, subcategory_code, subcategory_name, subcategory_desc, is_active = true } = body;

  // Validation
  if (!category_id || !subcategory_code || !subcategory_name) {
    return new Response(
      JSON.stringify({ success: false, message: 'category_id, subcategory_code and subcategory_name are required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Check if parent category exists
  const { data: parentCategory } = await supabase
    .from('master_product_category')
    .select('category_id')
    .eq('category_id', category_id)
    .eq('is_active', true)
    .single();

  if (!parentCategory) {
    return new Response(
      JSON.stringify({ success: false, message: 'Parent category does not exist or is inactive' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Check for duplicate subcategory_code
  const { data: existingCode } = await supabase
    .from('product_subcategory')
    .select('subcategory_id')
    .eq('subcategory_code', subcategory_code)
    .single();

  if (existingCode) {
    return new Response(
      JSON.stringify({ success: false, message: 'subcategory_code must be unique' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Check for duplicate subcategory_name within the same category
  const { data: existingName } = await supabase
    .from('product_subcategory')
    .select('subcategory_id')
    .eq('category_id', category_id)
    .eq('subcategory_name', subcategory_name)
    .single();

  if (existingName) {
    return new Response(
      JSON.stringify({ success: false, message: 'subcategory_name must be unique within the same category' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const { data, error } = await supabase
    .from('product_subcategory')
    .insert({ category_id, subcategory_code, subcategory_name, subcategory_desc, is_active })
    .select(`
      *,
      master_product_category (
        category_id,
        category_code,
        category_name
      )
    `)
    .single();

  if (error) {
    console.error('Error creating subcategory:', error);
    return new Response(
      JSON.stringify({ success: false, message: 'Error creating subcategory' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({ success: true, data, message: 'Subcategory created successfully' }),
    { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handlePut(supabase: any, req: Request, subcategoryId: string) {
  if (!subcategoryId) {
    return new Response(
      JSON.stringify({ success: false, message: 'Subcategory ID is required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const body = await req.json();
  const { category_id, subcategory_code, subcategory_name, subcategory_desc, is_active } = body;

  // Check if subcategory exists
  const { data: existingSubcategory } = await supabase
    .from('product_subcategory')
    .select('subcategory_id, category_id')
    .eq('subcategory_id', subcategoryId)
    .single();

  if (!existingSubcategory) {
    return new Response(
      JSON.stringify({ success: false, message: 'Subcategory not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // If category_id is being updated, check if new parent category exists
  if (category_id && category_id !== existingSubcategory.category_id) {
    const { data: parentCategory } = await supabase
      .from('master_product_category')
      .select('category_id')
      .eq('category_id', category_id)
      .eq('is_active', true)
      .single();

    if (!parentCategory) {
      return new Response(
        JSON.stringify({ success: false, message: 'Parent category does not exist or is inactive' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  }

  // Check for duplicate subcategory_code (excluding current record)
  if (subcategory_code) {
    const { data: existingCode } = await supabase
      .from('product_subcategory')
      .select('subcategory_id')
      .eq('subcategory_code', subcategory_code)
      .neq('subcategory_id', subcategoryId)
      .single();

    if (existingCode) {
      return new Response(
        JSON.stringify({ success: false, message: 'subcategory_code must be unique' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  }

  // Check for duplicate subcategory_name within the same category (excluding current record)
  if (subcategory_name) {
    const targetCategoryId = category_id || existingSubcategory.category_id;
    const { data: existingName } = await supabase
      .from('product_subcategory')
      .select('subcategory_id')
      .eq('category_id', targetCategoryId)
      .eq('subcategory_name', subcategory_name)
      .neq('subcategory_id', subcategoryId)
      .single();

    if (existingName) {
      return new Response(
        JSON.stringify({ success: false, message: 'subcategory_name must be unique within the same category' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  }

  const updateData: any = {};
  if (category_id !== undefined) updateData.category_id = category_id;
  if (subcategory_code !== undefined) updateData.subcategory_code = subcategory_code;
  if (subcategory_name !== undefined) updateData.subcategory_name = subcategory_name;
  if (subcategory_desc !== undefined) updateData.subcategory_desc = subcategory_desc;
  if (is_active !== undefined) updateData.is_active = is_active;

  const { data, error } = await supabase
    .from('product_subcategory')
    .update(updateData)
    .eq('subcategory_id', subcategoryId)
    .select(`
      *,
      master_product_category (
        category_id,
        category_code,
        category_name
      )
    `)
    .single();

  if (error) {
    console.error('Error updating subcategory:', error);
    return new Response(
      JSON.stringify({ success: false, message: 'Error updating subcategory' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({ success: true, data, message: 'Subcategory updated successfully' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleDelete(supabase: any, subcategoryId: string) {
  if (!subcategoryId) {
    return new Response(
      JSON.stringify({ success: false, message: 'Subcategory ID is required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Check if subcategory exists
  const { data: existingSubcategory } = await supabase
    .from('product_subcategory')
    .select('subcategory_id')
    .eq('subcategory_id', subcategoryId)
    .single();

  if (!existingSubcategory) {
    return new Response(
      JSON.stringify({ success: false, message: 'Subcategory not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Soft delete by setting is_active to false
  const { data, error } = await supabase
    .from('product_subcategory')
    .update({ is_active: false })
    .eq('subcategory_id', subcategoryId)
    .select(`
      *,
      master_product_category (
        category_id,
        category_code,
        category_name
      )
    `)
    .single();

  if (error) {
    console.error('Error deleting subcategory:', error);
    return new Response(
      JSON.stringify({ success: false, message: 'Error deleting subcategory' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({ success: true, data, message: 'Subcategory deleted successfully' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}