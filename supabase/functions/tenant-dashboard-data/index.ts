import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Tenant dashboard data function called');

    // Get request headers for auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { tenantId } = await req.json();
    console.log('Fetching data for tenant:', tenantId);

    // Fetch KPI data
    console.log('Fetching KPI data...');
    
    // Get branches count (mock for now - will need actual branches table)
    const branchesCount = 8; // Mock data
    
    // Get active users count
    const { count: usersCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId);
    console.log('Users count:', usersCount);

    // Get products count (mock for now - will need actual products table)
    const productsCount = 35; // Mock data
    
    // Get policies count (mock for now - will need actual policies table)
    const policiesCount = 1200; // Mock data
    
    // Get MDM import errors (mock for now - will need actual import jobs table)
    const errorsCount = 12; // Mock data

    // Fetch branch-wise data (mock for now)
    const branchData = [
      { name: 'Mumbai', users: 45, policies: 320 },
      { name: 'Delhi', users: 38, policies: 280 },
      { name: 'Bangalore', users: 42, policies: 310 },
      { name: 'Chennai', users: 35, policies: 220 },
      { name: 'Kolkata', users: 40, policies: 270 },
    ];

    // Fetch product sales data (mock for now)
    const productSalesData = [
      { name: 'Health', value: 40, color: 'hsl(214 84% 25%)' },
      { name: 'Motor', value: 25, color: 'hsl(142 76% 36%)' },
      { name: 'Life', value: 20, color: 'hsl(25 95% 58%)' },
      { name: 'Travel', value: 15, color: 'hsl(220 13% 46%)' },
    ];

    // Fetch employee activity trend (mock for now)
    const employeeActivityData = [
      { month: 'Jan', activity: 65 },
      { month: 'Feb', activity: 59 },
      { month: 'Mar', activity: 80 },
      { month: 'Apr', activity: 81 },
      { month: 'May', activity: 56 },
      { month: 'Jun', activity: 55 },
    ];

    // Fetch error data (mock for now)
    const errorData = [
      { entity: 'Product Import', errors: 8 },
      { entity: 'User Creation', errors: 6 },
      { entity: 'Policy Upload', errors: 4 },
      { entity: 'Branch Setup', errors: 3 },
    ];

    const dashboardData = {
      kpis: {
        branches: branchesCount,
        users: usersCount || 200,
        products: productsCount,
        policies: policiesCount,
        errors: errorsCount,
      },
      branchData,
      productSalesData,
      employeeActivityData,
      errorData,
    };

    console.log('Dashboard data prepared:', dashboardData);

    return new Response(JSON.stringify(dashboardData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in tenant-dashboard-data function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        details: error.toString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});