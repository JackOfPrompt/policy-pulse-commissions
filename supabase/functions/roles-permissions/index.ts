import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { action, ...body } = await req.json()

    console.log('Action:', action, 'Body:', body)

    switch (action) {
      case 'get_roles':
        return await getRoles(supabaseClient, body)
      case 'get_users':
        return await getUsers(supabaseClient, body)
      case 'get_permissions':
        return await getPermissions(supabaseClient, body)
      case 'create_role':
        return await createRole(supabaseClient, body)
      case 'update_role':
        return await updateRole(supabaseClient, body)
      case 'delete_role':
        return await deleteRole(supabaseClient, body)
      case 'update_role_status':
        return await updateRoleStatus(supabaseClient, body)
      case 'assign_roles':
        return await assignRoles(supabaseClient, body)
      case 'remove_role':
        return await removeRole(supabaseClient, body)
      case 'get_role_detail':
        return await getRoleDetail(supabaseClient, body)
      default:
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function getRoles(supabaseClient: any, body: any) {
  const { search, status } = body

  let query = supabaseClient
    .from('roles')
    .select(`
      *,
      role_permissions (
        permissions (*)
      )
    `)
    .order('created_at', { ascending: false })

  if (search) {
    query = query.or(`role_name.ilike.%${search}%,role_code.ilike.%${search}%`)
  }

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching roles:', error)
    throw error
  }

  // Transform data to include permission count and permissions
  const transformedData = data.map((role: any) => ({
    ...role,
    permission_count: role.role_permissions?.length || 0,
    permissions: role.role_permissions?.map((rp: any) => rp.permissions) || []
  }))

  return new Response(
    JSON.stringify({ success: true, data: transformedData }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function getUsers(supabaseClient: any, body: any) {
  const { search } = body

  let query = supabaseClient
    .from('profiles')
    .select(`
      *,
      user_roles (
        role_id,
        tenant_id,
        branch_id,
        department_id,
        roles (
          role_name,
          role_code
        )
      )
    `)
    .order('created_at', { ascending: false })

  if (search) {
    query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching users:', error)
    throw error
  }

  return new Response(
    JSON.stringify({ success: true, data }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function getPermissions(supabaseClient: any, body: any) {
  const { data, error } = await supabaseClient
    .from('permissions')
    .select('*')
    .order('module', { ascending: true })
    .order('permission_name', { ascending: true })

  if (error) {
    console.error('Error fetching permissions:', error)
    throw error
  }

  return new Response(
    JSON.stringify({ success: true, data }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function createRole(supabaseClient: any, body: any) {
  const { role_name, role_code, description, status, permissions, tenant_id } = body

  // Create role
  const { data: roleData, error: roleError } = await supabaseClient
    .from('roles')
    .insert([{
      role_name,
      role_code,
      description,
      status,
      tenant_id
    }])
    .select()
    .single()

  if (roleError) {
    console.error('Error creating role:', roleError)
    throw roleError
  }

  // Assign permissions to role
  if (permissions && permissions.length > 0) {
    const rolePermissions = permissions.map((permissionId: number) => ({
      role_id: roleData.role_id,
      permission_id: permissionId
    }))

    const { error: permissionError } = await supabaseClient
      .from('role_permissions')
      .insert(rolePermissions)

    if (permissionError) {
      console.error('Error assigning permissions:', permissionError)
      throw permissionError
    }
  }

  return new Response(
    JSON.stringify({ success: true, data: roleData }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function updateRole(supabaseClient: any, body: any) {
  const { role_id, role_name, role_code, description, status, permissions } = body

  // Update role
  const { data: roleData, error: roleError } = await supabaseClient
    .from('roles')
    .update({
      role_name,
      role_code,
      description,
      status,
      updated_at: new Date().toISOString()
    })
    .eq('role_id', role_id)
    .select()
    .single()

  if (roleError) {
    console.error('Error updating role:', roleError)
    throw roleError
  }

  // Update permissions
  if (permissions) {
    // Remove existing permissions
    await supabaseClient
      .from('role_permissions')
      .delete()
      .eq('role_id', role_id)

    // Add new permissions
    if (permissions.length > 0) {
      const rolePermissions = permissions.map((permissionId: number) => ({
        role_id,
        permission_id: permissionId
      }))

      const { error: permissionError } = await supabaseClient
        .from('role_permissions')
        .insert(rolePermissions)

      if (permissionError) {
        console.error('Error updating permissions:', permissionError)
        throw permissionError
      }
    }
  }

  return new Response(
    JSON.stringify({ success: true, data: roleData }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function deleteRole(supabaseClient: any, body: any) {
  const { role_id } = body

  // Check if role is assigned to any users
  const { data: userRoles } = await supabaseClient
    .from('user_roles')
    .select('user_role_id')
    .eq('role_id', role_id)
    .limit(1)

  if (userRoles && userRoles.length > 0) {
    throw new Error('Cannot delete role that is assigned to users')
  }

  // Delete role permissions first
  await supabaseClient
    .from('role_permissions')
    .delete()
    .eq('role_id', role_id)

  // Delete role
  const { error } = await supabaseClient
    .from('roles')
    .delete()
    .eq('role_id', role_id)

  if (error) {
    console.error('Error deleting role:', error)
    throw error
  }

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function updateRoleStatus(supabaseClient: any, body: any) {
  const { role_id, status } = body

  const { data, error } = await supabaseClient
    .from('roles')
    .update({
      status,
      updated_at: new Date().toISOString()
    })
    .eq('role_id', role_id)
    .select()
    .single()

  if (error) {
    console.error('Error updating role status:', error)
    throw error
  }

  return new Response(
    JSON.stringify({ success: true, data }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function assignRoles(supabaseClient: any, body: any) {
  const { user_id, roles } = body

  // Remove existing roles for this user
  await supabaseClient
    .from('user_roles')
    .delete()
    .eq('user_id', user_id)

  // Assign new roles
  if (roles && roles.length > 0) {
    const userRoles = roles.map((role: any) => ({
      user_id,
      role_id: role.role_id,
      tenant_id: role.tenant_id || 1,
      branch_id: role.branch_id,
      department_id: role.department_id
    }))

    const { error } = await supabaseClient
      .from('user_roles')
      .insert(userRoles)

    if (error) {
      console.error('Error assigning roles:', error)
      throw error
    }
  }

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function removeRole(supabaseClient: any, body: any) {
  const { user_id, role_id } = body

  const { error } = await supabaseClient
    .from('user_roles')
    .delete()
    .eq('user_id', user_id)
    .eq('role_id', role_id)

  if (error) {
    console.error('Error removing role:', error)
    throw error
  }

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function getRoleDetail(supabaseClient: any, body: any) {
  const { role_id } = body

  // Get role with permissions
  const { data: roleData, error: roleError } = await supabaseClient
    .from('roles')
    .select(`
      *,
      role_permissions (
        permissions (*)
      )
    `)
    .eq('role_id', role_id)
    .single()

  if (roleError) {
    console.error('Error fetching role detail:', roleError)
    throw roleError
  }

  // Get users assigned to this role
  const { data: assignedUsers, error: usersError } = await supabaseClient
    .from('user_roles')
    .select(`
      *,
      profiles (
        first_name,
        last_name,
        email
      )
    `)
    .eq('role_id', role_id)

  if (usersError) {
    console.error('Error fetching assigned users:', usersError)
    throw usersError
  }

  const transformedData = {
    ...roleData,
    permissions: roleData.role_permissions?.map((rp: any) => rp.permissions) || [],
    assigned_users: assignedUsers.map((ur: any) => ({
      ...ur.profiles,
      user_id: ur.user_id,
      assigned_at: ur.assigned_at,
      branch_name: ur.branch_id ? `Branch ${ur.branch_id}` : null,
      department_name: ur.department_id ? `Department ${ur.department_id}` : null
    }))
  }

  return new Response(
    JSON.stringify({ success: true, data: transformedData }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}