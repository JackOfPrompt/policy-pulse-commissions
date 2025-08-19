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

    if (req.method === "GET") {
      // Get tenant organization details from new organizations table
      const { data: organization, error } = await supabaseClient
        .from("organizations")
        .select("*")
        .eq("tenant_id", profile.tenant_id)
        .eq("type", "tenant")
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({ organization }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    if (req.method === "PUT") {
      // Update tenant organization details
      const body = await req.json();
      const { name, address, contact_email, contact_phone, contact_person, logo_url } = body;

      const { data: organization, error } = await supabaseClient
        .from("organizations")
        .update({
          name,
          address,
          contact_email,
          contact_phone,
          contact_person,
          logo_url,
          updated_at: new Date().toISOString(),
          updated_by: user.id
        })
        .eq("tenant_id", profile.tenant_id)
        .eq("type", "tenant")
        .select()
        .single();

      if (error) throw error;

      // Log the activity
      await supabaseClient
        .from("activity_logs")
        .insert({
          user_id: user.id,
          action: "Updated organization details",
          module: "tenant",
          details: `Updated organization: ${name}`,
          tenant_id: profile.tenant_id
        });

      return new Response(
        JSON.stringify({ success: true, organization }),
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