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
      .select("tenant_id")
      .eq("user_id", user.id)
      .single();

    if (!profile?.tenant_id) {
      throw new Error("User not associated with any tenant");
    }

    const body = await req.json();
    const { page = 1, size = 10, search, module, export: exportLogs } = body;

    if (req.method === "GET") {
      let query = supabaseClient
        .from("activity_logs")
        .select(`
          id,
          action,
          module,
          details,
          created_at,
          profiles!inner (
            first_name,
            last_name
          )
        `, { count: "exact" })
        .eq("tenant_id", profile.tenant_id);

      // Apply filters
      if (search) {
        query = query.or(`action.ilike.%${search}%,details.ilike.%${search}%`);
      }

      if (module) {
        query = query.eq("module", module);
      }

      // For export, get all records
      if (exportLogs) {
        const { data: logs, error } = await query
          .order("created_at", { ascending: false });

        if (error) throw error;

        // Convert to CSV
        const headers = ["User", "Action", "Module", "Timestamp", "Details"];
        const csvRows = [
          headers.join(","),
          ...logs.map(log => [
            `"${log.profiles?.first_name} ${log.profiles?.last_name}"`,
            `"${log.action}"`,
            `"${log.module}"`,
            `"${new Date(log.created_at).toLocaleString()}"`,
            `"${log.details}"`
          ].join(","))
        ];

        return new Response(
          JSON.stringify({ csv: csvRows.join("\n") }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          }
        );
      }

      // For regular request, apply pagination
      const offset = (page - 1) * size;
      const { data: logs, error, count } = await query
        .order("created_at", { ascending: false })
        .range(offset, offset + size - 1);

      if (error) throw error;

      const formattedLogs = logs?.map(log => ({
        id: log.id,
        user_name: `${log.profiles?.first_name || ''} ${log.profiles?.last_name || ''}`.trim(),
        action: log.action,
        module: log.module,
        timestamp: log.created_at,
        details: log.details
      })) || [];

      return new Response(
        JSON.stringify({ 
          logs: formattedLogs,
          total: count || 0
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 405,
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