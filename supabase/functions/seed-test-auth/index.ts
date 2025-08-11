// Supabase Edge Function: seed-test-auth
// Creates test users (system admin and two tenant admins) and two tenants, then links them.
// Uses service role to bypass RLS safely.

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type JsonRecord = Record<string, unknown>;

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars");
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function ensureTenant(code: string, name: string, email: string) {
  // Try find by tenant_code
  const { data: existing, error: findErr } = await admin
    .from("tenants")
    .select("tenant_id, tenant_code")
    .eq("tenant_code", code)
    .maybeSingle();
  if (findErr) throw findErr;

  if (existing?.tenant_id) {
    return existing.tenant_id as string;
  }

  const { data: created, error: insErr } = await admin
    .from("tenants")
    .insert({
      tenant_code: code,
      tenant_name: name,
      contact_email: email,
      status: "Active",
      timezone: "Asia/Kolkata",
    })
    .select("tenant_id")
    .maybeSingle();
  if (insErr) throw insErr;
  return (created?.tenant_id as string) ?? "";
}

async function ensureUser(email: string, password: string, full_name: string, user_type: string) {
  // Try to create the user first to avoid admin.listUsers (which can fail under some envs)
  let userId: string | undefined;
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name, user_type },
  });

  if (!createErr && created?.user?.id) {
    userId = created.user.id;
  } else {
    // If the user already exists or creation failed, try to resolve the id without listUsers
    // 1) Try profiles table by email (works if seeded partially before)
    const { data: profByEmail, error: profEmailErr } = await admin
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (profEmailErr) {
      console.warn("profiles lookup by email failed:", profEmailErr);
    }
    if (profByEmail?.id) {
      userId = profByEmail.id as string;
    } else {
      // 2) As a last resort, attempt listUsers (may fail in some environments)
      try {
        const { data: listed, error: listErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
        if (listErr) throw listErr as Error;
        const existing = listed.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
        if (existing) userId = existing.id;
      } catch (e) {
        console.error("listUsers fallback failed:", e);
      }
    }
  }

  if (!userId) {
    throw new Error(`Unable to ensure user for ${email}. Please check Edge Function secrets and Auth service.`);
  }

  // Ensure profile row
  const { data: profile, error: profErr } = await admin
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();
  if (profErr) throw profErr;

  if (!profile) {
    const { error: insProfErr } = await admin.from("profiles").insert({
      id: userId,
      email,
      full_name,
      user_type,
      is_active: true,
      kyc_status: "Verified",
    } as JsonRecord);
    if (insProfErr) throw insProfErr;
  }

  return userId;
}

async function ensureUserRole(user_id: string, role: string) {
  // user_roles has enum app_role. We'll insert only if not exists.
  const { data: existing, error: selErr } = await admin
    .from("user_roles")
    .select("id, role")
    .eq("user_id", user_id)
    .eq("role", role)
    .maybeSingle();
  if (selErr) {
    // If no such table, ignore silently
  } else if (!existing) {
    const { error: insErr } = await admin.from("user_roles").insert({ user_id, role });
    if (insErr) throw insErr;
  }
}

async function ensureTenantUser(tenant_id: string, user_id: string, role = "tenant_admin") {
  const { data: existing, error: selErr } = await admin
    .from("tenant_users")
    .select("tenant_id")
    .eq("tenant_id", tenant_id)
    .eq("user_id", user_id)
    .maybeSingle();
  if (selErr) {
    // If table missing or RLS blocks, let it throw; service role should bypass.
  }
  if (!existing) {
    const { error: insErr } = await admin.from("tenant_users").insert({ tenant_id, user_id, role, is_active: true });
    if (insErr) throw insErr;
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    // Seed tenants
    const alphaId = await ensureTenant("TEN-ALPHA", "Alpha Insurance Brokers", "alpha.admin@dev.example.com");
    const betaId = await ensureTenant("TEN-BETA", "Beta Risk Advisors", "beta.admin@dev.example.com");

    // Seed users
    const sysAdmin = {
      email: "sysadmin@dev.example.com",
      password: "Passw0rd!Admin",
      full_name: "System Admin",
      user_type: "Admin",
    };
    const alphaAdmin = {
      email: "alpha.admin@dev.example.com",
      password: "Passw0rd!Alpha",
      full_name: "Alpha Tenant Admin",
      user_type: "Admin",
    };
    const betaAdmin = {
      email: "beta.admin@dev.example.com",
      password: "Passw0rd!Beta",
      full_name: "Beta Tenant Admin",
      user_type: "Admin",
    };

    const sysAdminId = await ensureUser(sysAdmin.email, sysAdmin.password, sysAdmin.full_name, sysAdmin.user_type);
    const alphaAdminId = await ensureUser(alphaAdmin.email, alphaAdmin.password, alphaAdmin.full_name, alphaAdmin.user_type);
    const betaAdminId = await ensureUser(betaAdmin.email, betaAdmin.password, betaAdmin.full_name, betaAdmin.user_type);

    // Assign roles
    await ensureUserRole(sysAdminId, "admin"); // system-wide admin
    await ensureUserRole(alphaAdminId, "user");
    await ensureUserRole(betaAdminId, "user");

    // Link tenant admins
    await ensureTenantUser(alphaId, alphaAdminId, "tenant_admin");
    await ensureTenantUser(betaId, betaAdminId, "tenant_admin");

    const payload = {
      ok: true,
      tenants: [
        { tenant_code: "TEN-ALPHA", tenant_id: alphaId, tenant_name: "Alpha Insurance Brokers" },
        { tenant_code: "TEN-BETA", tenant_id: betaId, tenant_name: "Beta Risk Advisors" },
      ],
      users: [
        { ...sysAdmin, user_id: sysAdminId, role: "admin" },
        { ...alphaAdmin, user_id: alphaAdminId, role: "tenant_admin", tenant_code: "TEN-ALPHA" },
        { ...betaAdmin, user_id: betaAdminId, role: "tenant_admin", tenant_code: "TEN-BETA" },
      ],
    } as const;

    return new Response(JSON.stringify(payload), {
      headers: { "content-type": "application/json", ...corsHeaders },
      status: 200,
    });
  } catch (err: any) {
    console.error("seed-test-auth error:", err?.message || err);
    return new Response(JSON.stringify({ ok: false, error: err?.message || String(err) }), {
      headers: { "content-type": "application/json", ...corsHeaders },
      status: 500,
    });
  }
});
