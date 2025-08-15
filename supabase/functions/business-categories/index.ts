import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BusinessCategory {
  category_id: number;
  category_code: string;
  category_name: string;
  description?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const url = new URL(req.url);
    const categoryId = url.pathname.split('/').pop();
    
    switch (req.method) {
      case 'GET':
        // Get all categories or single category
        if (categoryId && categoryId !== 'categories') {
          const { data, error } = await supabase
            .from('master_business_categories')
            .select('*')
            .eq('category_id', categoryId)
            .single();
            
          if (error) throw error;
          
          return new Response(JSON.stringify({ success: true, data }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } else {
          // Get all categories with filters
          const searchParams = url.searchParams;
          const search = searchParams.get('search');
          const status = searchParams.get('status');
          const page = parseInt(searchParams.get('page') || '1');
          const limit = parseInt(searchParams.get('limit') || '10');
          
          let query = supabase
            .from('master_business_categories')
            .select('*', { count: 'exact' });
          
          // Apply filters
          if (search) {
            query = query.or(`category_name.ilike.%${search}%,category_code.ilike.%${search}%`);
          }
          
          if (status && status !== 'all') {
            query = query.eq('status', status === 'active' ? 'Active' : 'Inactive');
          }
          
          // Apply pagination
          const startIndex = (page - 1) * limit;
          query = query.range(startIndex, startIndex + limit - 1);
          
          // Order by updated_at desc
          query = query.order('updated_at', { ascending: false });
          
          const { data, error, count } = await query;
          
          if (error) throw error;
          
          return new Response(JSON.stringify({
            success: true,
            data,
            meta: {
              page,
              limit,
              total: count || 0
            }
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
      case 'POST':
        // Create new category
        const createData = await req.json();
        
        const { data: newCategory, error: createError } = await supabase
          .from('master_business_categories')
          .insert([{
            category_code: createData.category_code.toUpperCase(),
            category_name: createData.category_name,
            description: createData.description || null,
            status: createData.status || 'Active'
          }])
          .select()
          .single();
          
        if (createError) throw createError;
        
        return new Response(JSON.stringify({
          success: true,
          data: newCategory,
          message: 'Category created successfully'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
        
      case 'PUT':
        // Update existing category
        if (!categoryId || categoryId === 'categories') {
          throw new Error('Category ID is required for update');
        }
        
        const updateData = await req.json();
        
        const { data: updatedCategory, error: updateError } = await supabase
          .from('master_business_categories')
          .update({
            category_code: updateData.category_code.toUpperCase(),
            category_name: updateData.category_name,
            description: updateData.description || null,
            status: updateData.status,
            updated_at: new Date().toISOString()
          })
          .eq('category_id', categoryId)
          .select()
          .single();
          
        if (updateError) throw updateError;
        
        return new Response(JSON.stringify({
          success: true,
          data: updatedCategory,
          message: 'Category updated successfully'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
        
      case 'DELETE':
        // Delete category
        if (!categoryId || categoryId === 'categories') {
          throw new Error('Category ID is required for delete');
        }
        
        const { error: deleteError } = await supabase
          .from('master_business_categories')
          .delete()
          .eq('category_id', categoryId);
          
        if (deleteError) throw deleteError;
        
        return new Response(JSON.stringify({
          success: true,
          message: 'Category deleted successfully'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
        
      case 'PATCH':
        // Toggle status
        if (!categoryId || categoryId === 'categories') {
          throw new Error('Category ID is required for status toggle');
        }
        
        // First get current status
        const { data: currentCategory, error: fetchError } = await supabase
          .from('master_business_categories')
          .select('status')
          .eq('category_id', categoryId)
          .single();
          
        if (fetchError) throw fetchError;
        
        const newStatus = currentCategory.status === 'Active' ? 'Inactive' : 'Active';
        
        const { data: toggledCategory, error: toggleError } = await supabase
          .from('master_business_categories')
          .update({
            status: newStatus,
            updated_at: new Date().toISOString()
          })
          .eq('category_id', categoryId)
          .select()
          .single();
          
        if (toggleError) throw toggleError;
        
        return new Response(JSON.stringify({
          success: true,
          data: toggledCategory,
          message: `Category ${newStatus.toLowerCase()} successfully`
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
        
      default:
        return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
    
  } catch (error) {
    console.error('Business Categories API Error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});