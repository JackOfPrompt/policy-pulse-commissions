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
    const categoryId = pathParts[1]; // categories/:id or categories/:id/subcategories

    console.log(`${req.method} ${url.pathname}`, { pathParts, categoryId });

    switch (req.method) {
      case 'GET':
        return await handleGet(supabase, url, categoryId);
      case 'POST':
        return await handlePost(supabase, req);
      case 'PUT':
        return await handlePut(supabase, req, categoryId);
      case 'DELETE':
        return await handleDelete(supabase, categoryId);
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

async function handleGet(supabase: any, url: URL, categoryId?: string) {
  const searchParams = url.searchParams;
  
  // Check if this is for subcategories: /categories/:id/subcategories
  if (categoryId && url.pathname.includes('/subcategories')) {
    let query = supabase
      .from('product_subcategory')
      .select('*')
      .eq('category_id', categoryId);

    // Apply filters
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

  // Single category by ID
  if (categoryId) {
    const { data, error } = await supabase
      .from('master_product_category')
      .select('*')
      .eq('category_id', categoryId)
      .single();

    if (error) {
      console.error('Error fetching category:', error);
      return new Response(
        JSON.stringify({ success: false, message: 'Category not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // All categories with filters
  let query = supabase.from('master_product_category').select('*');

  // Apply filters
  const isActive = searchParams.get('is_active');
  if (isActive !== null) {
    query = query.eq('is_active', isActive === 'true');
  }

  const search = searchParams.get('search');
  if (search) {
    query = query.or(`category_name.ilike.%${search}%,category_code.ilike.%${search}%`);
  }

  // Apply pagination
  const limit = parseInt(searchParams.get('limit') || '10');
  const offset = parseInt(searchParams.get('offset') || '0');
  query = query.range(offset, offset + limit - 1);

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching categories:', error);
    return new Response(
      JSON.stringify({ success: false, message: 'Error fetching categories' }),
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
  const { category_code, category_name, category_desc, is_active = true } = body;

  // Validation
  if (!category_code || !category_name) {
    return new Response(
      JSON.stringify({ success: false, message: 'category_code and category_name are required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Check for duplicate category_code
  const { data: existingCode } = await supabase
    .from('master_product_category')
    .select('category_id')
    .eq('category_code', category_code)
    .single();

  if (existingCode) {
    return new Response(
      JSON.stringify({ success: false, message: 'category_code must be unique' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Check for duplicate category_name
  const { data: existingName } = await supabase
    .from('master_product_category')
    .select('category_id')
    .eq('category_name', category_name)
    .single();

  if (existingName) {
    return new Response(
      JSON.stringify({ success: false, message: 'category_name must be unique' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const { data, error } = await supabase
    .from('master_product_category')
    .insert({ category_code, category_name, category_desc, is_active })
    .select()
    .single();

  if (error) {
    console.error('Error creating category:', error);
    return new Response(
      JSON.stringify({ success: false, message: 'Error creating category' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({ success: true, data, message: 'Category created successfully' }),
    { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handlePut(supabase: any, req: Request, categoryId: string) {
  if (!categoryId) {
    return new Response(
      JSON.stringify({ success: false, message: 'Category ID is required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const body = await req.json();
  const { category_code, category_name, category_desc, is_active } = body;

  // Check if category exists
  const { data: existingCategory } = await supabase
    .from('master_product_category')
    .select('category_id')
    .eq('category_id', categoryId)
    .single();

  if (!existingCategory) {
    return new Response(
      JSON.stringify({ success: false, message: 'Category not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Check for duplicate category_code (excluding current record)
  if (category_code) {
    const { data: existingCode } = await supabase
      .from('master_product_category')
      .select('category_id')
      .eq('category_code', category_code)
      .neq('category_id', categoryId)
      .single();

    if (existingCode) {
      return new Response(
        JSON.stringify({ success: false, message: 'category_code must be unique' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  }

  // Check for duplicate category_name (excluding current record)
  if (category_name) {
    const { data: existingName } = await supabase
      .from('master_product_category')
      .select('category_id')
      .eq('category_name', category_name)
      .neq('category_id', categoryId)
      .single();

    if (existingName) {
      return new Response(
        JSON.stringify({ success: false, message: 'category_name must be unique' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  }

  const updateData: any = {};
  if (category_code !== undefined) updateData.category_code = category_code;
  if (category_name !== undefined) updateData.category_name = category_name;
  if (category_desc !== undefined) updateData.category_desc = category_desc;
  if (is_active !== undefined) updateData.is_active = is_active;

  const { data, error } = await supabase
    .from('master_product_category')
    .update(updateData)
    .eq('category_id', categoryId)
    .select()
    .single();

  if (error) {
    console.error('Error updating category:', error);
    return new Response(
      JSON.stringify({ success: false, message: 'Error updating category' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({ success: true, data, message: 'Category updated successfully' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleDelete(supabase: any, categoryId: string) {
  if (!categoryId) {
    return new Response(
      JSON.stringify({ success: false, message: 'Category ID is required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Check if category exists
  const { data: existingCategory } = await supabase
    .from('master_product_category')
    .select('category_id')
    .eq('category_id', categoryId)
    .single();

  if (!existingCategory) {
    return new Response(
      JSON.stringify({ success: false, message: 'Category not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Soft delete by setting is_active to false
  const { data, error } = await supabase
    .from('master_product_category')
    .update({ is_active: false })
    .eq('category_id', categoryId)
    .select()
    .single();

  if (error) {
    console.error('Error deleting category:', error);
    return new Response(
      JSON.stringify({ success: false, message: 'Error deleting category' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({ success: true, data, message: 'Category deleted successfully' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}