import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const supabase = createClient(supabaseUrl!, serviceKey!);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const email = 'superadmin@insurtech.com';
    const password = 'SuperAdmin@123!';

    // Find existing user by listing (no direct get-by-email API)
    const { data: list, error: listErr } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (listErr) throw listErr;

    let user = list?.users?.find((u: any) => u.email?.toLowerCase() === email);

    if (user) {
      // Ensure password and metadata
      const { data: upd, error: updErr } = await supabase.auth.admin.updateUserById(user.id, {
        password,
        email_confirm: true,
        user_metadata: { role: 'super_admin', full_name: 'Super Admin' },
      });
      if (updErr) throw updErr;
      user = upd.user ?? user;
    } else {
      // Create user
      const { data: created, error: createErr } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { role: 'super_admin', full_name: 'Super Admin' },
      });
      if (createErr) throw createErr;
      user = created.user;
    }

    // Upsert profile (no trigger exists)
    if (user?.id) {
      const { error: upsertErr } = await supabase.from('profiles').upsert({
        id: user.id,
        email: user.email,
        full_name: 'Super Admin',
        role: 'super_admin',
        org_id: null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });
      if (upsertErr) throw upsertErr;
    }

    return new Response(JSON.stringify({ success: true, email, password, user_id: user?.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('seed-superadmin error:', error);
    return new Response(JSON.stringify({ success: false, error: error?.message || 'Unknown error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});