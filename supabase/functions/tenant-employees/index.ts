import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: userData } = await supabaseClient.auth.getUser(token);
    const user = userData.user;

    if (!user) {
      throw new Error("User not authenticated");
    }

    // Get user profile to find tenant_id
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("tenant_id, role")
      .eq("user_id", user.id)
      .single();

    if (!profile?.tenant_id) {
      throw new Error("User not associated with any tenant");
    }

    const body = await req.json();
    const { action } = body;

    if (action === "get_tenant_employees") {
      // Get employees from new tenant_employees table
      const { data: employees, error } = await supabaseClient
        .from("tenant_employees")
        .select(`
          *,
          organizations!inner(name),
          master_departments(department_name)
        `)
        .eq("tenant_id", profile.tenant_id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get KPIs
      const totalEmployees = employees?.length || 0;
      const activeEmployees = employees?.filter(emp => emp.status === 'Active').length || 0;
      const inactiveEmployees = totalEmployees - activeEmployees;

      return new Response(
        JSON.stringify({
          employees: employees || [],
          kpis: {
            total_employees: totalEmployees,
            active_employees: activeEmployees,
            inactive_employees: inactiveEmployees
          }
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    if (action === "create_employee") {
      const { 
        employee_id, 
        first_name, 
        last_name, 
        email, 
        phone, 
        department_id, 
        organization_id, 
        position, 
        salary, 
        hire_date 
      } = body;

      const { data: employee, error } = await supabaseClient
        .from("tenant_employees")
        .insert({
          employee_id,
          tenant_id: profile.tenant_id,
          first_name,
          last_name,
          email,
          phone,
          department_id,
          organization_id,
          position,
          salary,
          hire_date,
          status: 'Active',
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;

      // Log the activity
      await supabaseClient
        .from("activity_logs")
        .insert({
          user_id: user.id,
          action: "Created employee",
          module: "employee_management",
          details: `Created employee: ${first_name} ${last_name}`,
          tenant_id: profile.tenant_id
        });

      return new Response(
        JSON.stringify({ success: true, employee }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    if (action === "update_employee") {
      const { 
        id,
        first_name, 
        last_name, 
        email, 
        phone, 
        department_id, 
        organization_id, 
        position, 
        salary, 
        status 
      } = body;

      const { data: employee, error } = await supabaseClient
        .from("tenant_employees")
        .update({
          first_name,
          last_name,
          email,
          phone,
          department_id,
          organization_id,
          position,
          salary,
          status,
          updated_by: user.id,
          updated_at: new Date().toISOString()
        })
        .eq("id", id)
        .eq("tenant_id", profile.tenant_id)
        .select()
        .single();

      if (error) throw error;

      // Log the activity
      await supabaseClient
        .from("activity_logs")
        .insert({
          user_id: user.id,
          action: "Updated employee",
          module: "employee_management",
          details: `Updated employee: ${first_name} ${last_name}`,
          tenant_id: profile.tenant_id
        });

      return new Response(
        JSON.stringify({ success: true, employee }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});