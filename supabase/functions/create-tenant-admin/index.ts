import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Payload {
  tenant_id: string;
  tenant_name?: string;
  contact_person?: string;
  contact_email?: string;
  phone_number: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tenant_id, tenant_name, contact_person, contact_email, phone_number } = (await req.json()) as Payload;

    if (!tenant_id || !phone_number) {
      return new Response(JSON.stringify({ error: "tenant_id and phone_number are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");

    if (!SERVICE_ROLE_KEY || !SUPABASE_URL) {
      return new Response(JSON.stringify({ error: "Missing Supabase service configuration" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Normalize phone and derive email for password login
    const normalizedPhone = phone_number.replace(/\D/g, "");
    const derivedEmail = `${normalizedPhone}@tenants.local`;
    const defaultPassword = "1234567";

    // Try to create the auth user
    let userId: string | null = null;
    const fullName = contact_person || tenant_name || `Tenant Admin ${normalizedPhone}`;

    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email: derivedEmail,
      password: defaultPassword,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        user_type: "Admin",
        phone: normalizedPhone,
      },
    });

    if (createErr) {
      // If user already exists, fetch by email
      if (createErr.message && createErr.message.toLowerCase().includes("already registered")) {
        const { data: existing, error: listErr } = await admin.auth.admin.listUsers({
          page: 1,
          perPage: 200,
        });
        if (listErr) throw listErr;
        const found = existing.users.find((u: any) => u.email?.toLowerCase() === derivedEmail.toLowerCase());
        if (!found) throw createErr;
        userId = found.id;
      } else {
        throw createErr;
      }
    } else {
      userId = created.user?.id || null;
    }

    if (!userId) throw new Error("Unable to determine user id");

    // Link to tenant as tenant_admin
    const { error: linkErr } = await admin.from("tenant_users").upsert({
      tenant_id,
      user_id: userId,
      role: "tenant_admin",
      is_active: true,
    }, { onConflict: "tenant_id,user_id" });

    if (linkErr) throw linkErr;

    return new Response(
      JSON.stringify({ success: true, user_id: userId, login_hint: { email: derivedEmail, password: defaultPassword } }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (err: any) {
    console.error("create-tenant-admin error", err);
    return new Response(JSON.stringify({ error: err.message || "Internal error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
