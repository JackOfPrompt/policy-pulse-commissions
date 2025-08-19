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
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
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

    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    
    // Handle different path structures
    // Expected: /tenant-branches/{branchId} or /tenant-branches/{branchId}/departments or /tenant-branches/{branchId}/departments/{deptId}
    let branchId: string | null = null;
    let isDepartmentPath = false;
    let deptId: string | null = null;

    // Find branchId in the path
    const branchIndex = pathParts.findIndex(part => !isNaN(Number(part)));
    if (branchIndex !== -1 && pathParts[branchIndex]) {
      branchId = pathParts[branchIndex];
      
      // Check if this is a department-related path
      if (pathParts[branchIndex + 1] === 'departments') {
        isDepartmentPath = true;
        if (pathParts[branchIndex + 2] && !isNaN(Number(pathParts[branchIndex + 2]))) {
          deptId = pathParts[branchIndex + 2];
        }
      }
    }

    if (req.method === "GET") {
      if (isDepartmentPath && branchId) {
        // GET /branches/{branchId}/departments - List assigned departments
        console.log(`Fetching departments for branch ${branchId}`);
        
        const { data: departments, error } = await supabaseClient
          .from("branch_departments")
          .select(`
            dept_id,
            assigned_at,
            master_departments:dept_id (
              department_id,
              department_name,
              department_code,
              description,
              status
            )
          `)
          .eq("branch_id", parseInt(branchId));

        if (error) throw error;

        return new Response(
          JSON.stringify({ 
            success: true,
            departments: departments || []
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          }
        );
      } else if (branchId) {
        // GET /branches/{branchId} - Branch details with assigned departments
        console.log(`Fetching branch details for branch ${branchId}`);
        
        const { data: branch, error } = await supabaseClient
          .from("branches")
          .select(`
            *,
            manager:manager_id (
              employee_id,
              name,
              email
            ),
            departments:branch_departments (
              dept_id,
              master_departments:dept_id (
                department_id,
                department_name,
                department_code
              )
            )
          `)
          .eq("branch_id", parseInt(branchId))
          .eq("tenant_id", profile.tenant_id)
          .single();

        if (error) throw error;

        return new Response(
          JSON.stringify({ 
            success: true,
            branch 
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          }
        );
      } else {
        // GET /branches - List tenant branches
        console.log(`Fetching branches for tenant ${profile.tenant_id}`);
        
        const { data: branches, error } = await supabaseClient
          .from("branches")
          .select(`
            *,
            manager:manager_id (
              employee_id,
              name,
              email
            ),
            departments:branch_departments (
              dept_id,
              master_departments:dept_id (
                department_id,
                department_name,
                department_code
              )
            )
          `)
          .eq("tenant_id", profile.tenant_id)
          .order("created_at", { ascending: false });

        if (error) throw error;

        return new Response(
          JSON.stringify({ 
            success: true,
            branches: branches || []
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          }
        );
      }
    }

    if (req.method === "POST") {
      const body = await req.json();

      if (isDepartmentPath && branchId) {
        // POST /branches/{branchId}/departments - Assign departments
        console.log(`Assigning departments to branch ${branchId}`);
        
        const { dept_ids } = body;

        if (!dept_ids || !Array.isArray(dept_ids)) {
          throw new Error("dept_ids array is required");
        }

        // First, remove existing assignments for this branch
        await supabaseClient
          .from("branch_departments")
          .delete()
          .eq("branch_id", parseInt(branchId));

        // Insert new assignments if any departments selected
        if (dept_ids.length > 0) {
          const assignments = dept_ids.map((dept_id: number) => ({
            branch_id: parseInt(branchId),
            dept_id
          }));

          const { data, error } = await supabaseClient
            .from("branch_departments")
            .insert(assignments)
            .select();

          if (error) throw error;

          // Log the activity
          await supabaseClient
            .from("activity_logs")
            .insert({
              user_id: user.id,
              action: "Assigned departments to branch",
              module: "branches",
              details: `Assigned ${dept_ids.length} departments to branch ${branchId}`,
              tenant_id: profile.tenant_id
            });

          return new Response(
            JSON.stringify({ 
              success: true, 
              message: `Successfully assigned ${dept_ids.length} departments`,
              assignments: data 
            }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 200,
            }
          );
        } else {
          return new Response(
            JSON.stringify({ 
              success: true, 
              message: "All departments unassigned from branch"
            }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 200,
            }
          );
        }
      } else {
        // POST /branches - Create branch
        console.log("Creating new branch");
        
        const { branch_name, address, manager_id, status } = body;

        if (!branch_name) {
          throw new Error("Branch name is required");
        }

        const { data: branch, error } = await supabaseClient
          .from("branches")
          .insert({
            tenant_id: profile.tenant_id,
            branch_name,
            address: address || null,
            manager_id: manager_id || null,
            status: status || 'ACTIVE'
          })
          .select()
          .single();

        if (error) throw error;

        // Log the activity
        await supabaseClient
          .from("activity_logs")
          .insert({
            user_id: user.id,
            action: "Created branch",
            module: "branches",
            details: `Created branch: ${branch_name}`,
            tenant_id: profile.tenant_id
          });

        console.log(`Branch created with ID: ${branch.branch_id}`);

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "Branch created successfully",
            branch 
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 201,
          }
        );
      }
    }

    if (req.method === "PUT") {
      // PUT /branches/{branchId} - Update branch
      if (!branchId) {
        throw new Error("Branch ID is required for updates");
      }
      
      console.log(`Updating branch ${branchId}`);
      
      const body = await req.json();
      const { branch_name, address, manager_id, status } = body;

      const { data: branch, error } = await supabaseClient
        .from("branches")
        .update({
          branch_name,
          address: address || null,
          manager_id: manager_id || null,
          status
        })
        .eq("branch_id", parseInt(branchId))
        .eq("tenant_id", profile.tenant_id)
        .select()
        .single();

      if (error) throw error;

      // Log the activity
      await supabaseClient
        .from("activity_logs")
        .insert({
          user_id: user.id,
          action: "Updated branch",
          module: "branches",
          details: `Updated branch: ${branch_name}`,
          tenant_id: profile.tenant_id
        });

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Branch updated successfully",
          branch 
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    if (req.method === "DELETE") {
      if (isDepartmentPath && deptId && branchId) {
        // DELETE /branches/{branchId}/departments/{deptId} - Remove specific department assignment
        console.log(`Removing department ${deptId} from branch ${branchId}`);
        
        const { error } = await supabaseClient
          .from("branch_departments")
          .delete()
          .eq("branch_id", parseInt(branchId))
          .eq("dept_id", parseInt(deptId));

        if (error) throw error;

        // Log the activity
        await supabaseClient
          .from("activity_logs")
          .insert({
            user_id: user.id,
            action: "Removed department from branch",
            module: "branches",
            details: `Removed department ${deptId} from branch ${branchId}`,
            tenant_id: profile.tenant_id
          });

        return new Response(
          JSON.stringify({ 
            success: true,
            message: "Department assignment removed successfully"
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          }
        );
      } else {
        // DELETE /branches/{branchId} - Delete branch (soft delete)
        if (!branchId) {
          throw new Error("Branch ID is required for deletion");
        }
        
        console.log(`Deleting branch ${branchId}`);
        
        const { data: branch, error } = await supabaseClient
          .from("branches")
          .update({ status: 'INACTIVE' })
          .eq("branch_id", parseInt(branchId))
          .eq("tenant_id", profile.tenant_id)
          .select()
          .single();

        if (error) throw error;

        // Log the activity
        await supabaseClient
          .from("activity_logs")
          .insert({
            user_id: user.id,
            action: "Deleted branch",
            module: "branches",
            details: `Deleted branch: ${branch.branch_name}`,
            tenant_id: profile.tenant_id
          });

        return new Response(
          JSON.stringify({ 
            success: true,
            message: "Branch deleted successfully"
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          }
        );
      }
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