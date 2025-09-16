import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateAdminRequest {
  adminName: string;
  adminEmail: string;
  adminPassword: string;
  organizationId: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify the requesting user is a super admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the current user's role
    const { data: currentUser, error: userError } = await supabaseAdmin.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !currentUser.user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is super admin
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', currentUser.user.id)
      .single();

    if (profileError || profile?.role !== 'superadmin') {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Super admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { adminName, adminEmail, adminPassword, organizationId }: CreateAdminRequest = await req.json();

    if (!adminName || !adminEmail || !adminPassword || !organizationId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // First check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers.users.find(user => user.email === adminEmail);

    let targetUser;

    if (existingUser) {
      // User exists, update their metadata
      const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        existingUser.id,
        {
          user_metadata: {
            ...existingUser.user_metadata,
            full_name: adminName,
            role: 'admin',
            org_id: organizationId,
          }
        }
      );

      if (updateError) {
        console.error('Error updating existing user:', updateError);
        return new Response(
          JSON.stringify({ error: updateError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      targetUser = updatedUser.user;
      console.log(`Updated existing user: ${adminEmail} for org: ${organizationId}`);
    } else {
      // Create new user WITHOUT auto-confirming to prevent auto-login
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        user_metadata: {
          full_name: adminName,
          role: 'admin',
          org_id: organizationId,
        },
        email_confirm: false // Do NOT auto-confirm to prevent auto-login
      });

      if (createError) {
        console.error('Error creating admin user:', createError);
        return new Response(
          JSON.stringify({ error: createError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!newUser.user) {
        return new Response(
          JSON.stringify({ error: 'Failed to create user' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Manually confirm the user after creation to activate the account
      // but don't auto-login them
      const { error: confirmError } = await supabaseAdmin.auth.admin.updateUserById(
        newUser.user.id,
        { email_confirm: true }
      );

      if (confirmError) {
        console.error('Error confirming user email:', confirmError);
        // Continue anyway, the user can confirm later
      }

      targetUser = newUser.user;
      console.log(`Created new user: ${adminEmail} for org: ${organizationId}`);
    }

    // Upsert user_organizations mapping (insert or update if exists)
    const { error: userOrgError } = await supabaseAdmin
      .from('user_organizations')
      .upsert({
        user_id: targetUser.id,
        org_id: organizationId,
        role: 'admin',
      }, {
        onConflict: 'user_id,org_id'
      });

    if (userOrgError) {
      console.error('Error creating/updating user_organizations mapping:', userOrgError);
      // Only cleanup if we created a new user
      if (!existingUser) {
        await supabaseAdmin.auth.admin.deleteUser(targetUser.id);
      }
      return new Response(
        JSON.stringify({ error: 'Failed to create organization mapping' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Ensure profiles row exists/updated for this user
    const { error: profileUpsertError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: targetUser.id,
        full_name: adminName,
        email: targetUser.email,
        role: 'admin',
        org_id: organizationId,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });

    if (profileUpsertError) {
      console.error('Error upserting profile for tenant admin:', profileUpsertError);
      // Don't fail the whole request if profile upsert fails; just log it
    }

    console.log(`Successfully created tenant admin: ${adminEmail} for org: ${organizationId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: {
          id: targetUser.id,
          email: targetUser.email,
          full_name: adminName
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error in create-tenant-admin:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});