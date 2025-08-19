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
      // Get current subscription details with usage stats
      const { data: subscription, error: subError } = await supabaseClient
        .from("tenant_subscriptions")
        .select(`
          *,
          subscription_plans (
            plan_name,
            plan_code,
            max_users,
            max_policies,
            features
          )
        `)
        .eq("tenant_id", profile.tenant_id)
        .eq("status", "active")
        .single();

      if (subError && subError.code !== 'PGRST116') {
        throw subError;
      }

      let subscriptionData = null;

      if (subscription) {
        // Get current usage stats
        const { data: userCount } = await supabaseClient
          .from("profiles")
          .select("id", { count: "exact" })
          .eq("tenant_id", profile.tenant_id);

        const { data: policyCount } = await supabaseClient
          .from("policies")
          .select("id", { count: "exact" })
          .eq("tenant_id", profile.tenant_id);

        subscriptionData = {
          plan_name: subscription.subscription_plans?.plan_name || "Unknown",
          plan_type: subscription.billing_cycle || "monthly",
          start_date: subscription.start_date,
          end_date: subscription.end_date,
          status: subscription.status,
          max_users: subscription.subscription_plans?.max_users || 0,
          max_policies: subscription.subscription_plans?.max_policies || 0,
          current_users: userCount?.length || 0,
          current_policies: policyCount?.length || 0,
          features: subscription.subscription_plans?.features || []
        };
      }

      return new Response(
        JSON.stringify({ subscription: subscriptionData }),
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