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

    if (req.method === "POST") {
      const body = await req.json();
      const { plan_id } = body;

      if (!plan_id) {
        throw new Error("Plan ID is required");
      }

      // Get the new plan details
      const { data: newPlan, error: planError } = await supabaseClient
        .from("subscription_plans")
        .select("*")
        .eq("id", plan_id)
        .single();

      if (planError) throw planError;

      // Get current subscription
      const { data: currentSub } = await supabaseClient
        .from("tenant_subscriptions")
        .select("*, subscription_plans(*)")
        .eq("tenant_id", profile.tenant_id)
        .eq("status", "active")
        .single();

      // Update current subscription to cancelled
      if (currentSub) {
        await supabaseClient
          .from("tenant_subscriptions")
          .update({ status: "cancelled", updated_at: new Date().toISOString() })
          .eq("id", currentSub.id);
      }

      // Create new subscription
      const { data: newSubscription, error: subError } = await supabaseClient
        .from("tenant_subscriptions")
        .insert({
          tenant_id: profile.tenant_id,
          plan_id: plan_id,
          status: "active",
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
          billing_cycle: "annual",
          amount: newPlan.annual_price
        })
        .select()
        .single();

      if (subError) throw subError;

      // Log the activity
      await supabaseClient
        .from("activity_logs")
        .insert({
          user_id: user.id,
          action: "Upgraded subscription plan",
          module: "tenant",
          details: `Upgraded to ${newPlan.plan_name} plan`,
          tenant_id: profile.tenant_id
        });

      return new Response(
        JSON.stringify({ 
          success: true, 
          subscription: newSubscription,
          plan: newPlan
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