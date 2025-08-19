import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          user_id: string;
          email: string;
          first_name: string;
          last_name: string;
          phone: string;
          tenant_id: string;
          role: string;
          must_change_password: boolean;
          created_at: string;
          updated_at: string;
        };
      };
      master_departments: {
        Row: {
          department_id: number;
          department_name: string;
          department_code: string;
          tenant_id: number;
          description: string;
          status: string;
          created_at: string;
          updated_at: string;
        };
      };
      activity_logs: {
        Row: {
          id: string;
          user_id: string;
          tenant_id: string;
          module: string;
          action: string;
          details: string;
          created_at: string;
        };
      };
    };
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient<Database>(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { action, ...requestData } = await req.json();

    // Get current user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Get user profile to determine tenant
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      throw new Error('User profile not found');
    }

    switch (action) {
      case 'get_employees':
        return await getEmployees(supabaseClient, profile, requestData);
      
      case 'create_employee':
        return await createEmployee(supabaseClient, profile, requestData);
      
      case 'get_employee_detail':
        return await getEmployeeDetail(supabaseClient, profile, requestData.employee_id);
      
      case 'update_employee':
        return await updateEmployee(supabaseClient, profile, requestData.employee_id, requestData);
      
      case 'update_status':
        return await updateEmployeeStatus(supabaseClient, profile, requestData.employee_id, requestData.status);
      
      case 'delete_employee':
        return await deleteEmployee(supabaseClient, profile, requestData.employee_id);
      
      case 'assign_roles':
        return await assignRoles(supabaseClient, profile, requestData.employee_id, requestData.roles);
      
      case 'get_employee_roles':
        return await getEmployeeRoles(supabaseClient, profile, requestData.employee_id);
      
      case 'remove_role':
        return await removeRole(supabaseClient, profile, requestData.employee_id, requestData.role_id);
      
      case 'bulk_import':
        return await bulkImportEmployees(supabaseClient, profile, requestData);
      
      case 'export_employees':
        return await exportEmployees(supabaseClient, profile, requestData);
      
      case 'get_activity_logs':
        return await getActivityLogs(supabaseClient, profile, requestData.employee_id);
      
      case 'get_employee_salaries':
        return await getEmployeeSalaries(supabaseClient, profile, requestData.employee_id);
      
      case 'add_salary_record':
        return await addSalaryRecord(supabaseClient, profile, requestData.employee_id, requestData);
      
      case 'get_latest_salary':
        return await getLatestSalary(supabaseClient, profile, requestData.employee_id);
      
      case 'update_salary_record':
        return await updateSalaryRecord(supabaseClient, profile, requestData.salary_id, requestData);
      
      case 'delete_salary_record':
        return await deleteSalaryRecord(supabaseClient, profile, requestData.salary_id);
      
      default:
        throw new Error('Invalid action');
    }

  } catch (error) {
    console.error('Employee Management Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});

async function getEmployees(supabaseClient: any, profile: any, filters: any = {}) {
  try {
    let query = supabaseClient
      .from('profiles')
      .select(`
        id,
        user_id,
        email,
        first_name,
        last_name,
        phone,
        role,
        created_at,
        updated_at
      `)
      .eq('tenant_id', profile.tenant_id);

    // Apply filters
    if (filters.status) {
      if (filters.status === 'Active') {
        query = query.neq('role', 'inactive');
      } else if (filters.status === 'Inactive') {
        query = query.eq('role', 'inactive');
      }
    }

    if (filters.department) {
      // Department filtering would need tenant_employee_roles table integration
    }

    if (filters.search) {
      query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
    }

    const { data: employees, error: employeesError } = await query;

    if (employeesError) {
      throw employeesError;
    }

    // Get departments for the tenant
    const { data: departments } = await supabaseClient
      .from('master_departments')
      .select('*')
      .eq('tenant_id', profile.tenant_id);

    // Process employee data with current salary
    const processedEmployees = await Promise.all(employees.map(async (emp: any) => {
      // Get latest salary for this employee
      const { data: latestSalary } = await supabaseClient
        .from('tenant_employee_salaries')
        .select('total_salary')
        .eq('employee_id', emp.id)
        .eq('tenant_id', profile.tenant_id)
        .eq('status', 'Active')
        .order('effective_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      return {
        id: emp.id,
        employee_id: emp.user_id.substring(0, 8).toUpperCase(),
        first_name: emp.first_name || '',
        last_name: emp.last_name || '',
        email: emp.email || '',
        phone: emp.phone || '',
        department: 'General', // Default department
        roles: [emp.role],
        status: emp.role === 'inactive' ? 'Inactive' : 'Active',
        created_at: emp.created_at,
        current_salary: latestSalary?.total_salary || null
      };
    }));

    // Calculate KPIs
    const kpis = {
      total_employees: employees.length,
      active_employees: employees.filter((emp: any) => emp.role !== 'inactive').length,
      inactive_employees: employees.filter((emp: any) => emp.role === 'inactive').length,
      recently_added: employees.filter((emp: any) => {
        const createdDate = new Date(emp.created_at);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return createdDate >= thirtyDaysAgo;
      }).length
    };

    return new Response(
      JSON.stringify({
        success: true,
        kpis,
        employees: processedEmployees
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    throw error;
  }
}

async function createEmployee(supabaseClient: any, profile: any, employeeData: any) {
  try {
    // Create user in auth
    const { data: authUser, error: authError } = await supabaseClient.auth.admin.createUser({
      email: employeeData.email,
      email_confirm: true,
      user_metadata: {
        first_name: employeeData.first_name,
        last_name: employeeData.last_name,
        role: 'employee'
      }
    });

    if (authError) {
      throw authError;
    }

    // Create profile
    const { data: newProfile, error: profileError } = await supabaseClient
      .from('profiles')
      .insert({
        user_id: authUser.user.id,
        email: employeeData.email,
        first_name: employeeData.first_name,
        last_name: employeeData.last_name,
        phone: employeeData.phone,
        tenant_id: profile.tenant_id,
        role: 'employee',
        must_change_password: true
      })
      .select()
      .single();

    if (profileError) {
      throw profileError;
    }

    // Log activity
    await supabaseClient
      .from('activity_logs')
      .insert({
        user_id: profile.user_id,
        tenant_id: profile.tenant_id,
        module: 'Employee Management',
        action: 'Create Employee',
        details: `Created employee: ${employeeData.first_name} ${employeeData.last_name}`
      });

    return new Response(
      JSON.stringify({
        success: true,
        employee: newProfile
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    throw error;
  }
}

async function getEmployeeDetail(supabaseClient: any, profile: any, employeeId: string) {
  try {
    // Get employee profile
    const { data: employee, error: employeeError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', employeeId)
      .eq('tenant_id', profile.tenant_id)
      .single();

    if (employeeError) {
      throw employeeError;
    }

    // Get activity logs for this employee
    const { data: activityLogs } = await supabaseClient
      .from('activity_logs')
      .select('*')
      .eq('user_id', employee.user_id)
      .order('created_at', { ascending: false })
      .limit(50);

    const employeeDetail = {
      id: employee.id,
      employee_id: employee.user_id.substring(0, 8).toUpperCase(),
      first_name: employee.first_name || '',
      last_name: employee.last_name || '',
      email: employee.email || '',
      phone: employee.phone || '',
      address: employee.address || '',
      department: 'General',
      designation: 'Employee',
      manager: 'Not assigned',
      roles: [employee.role],
      permissions: ['Basic Access'],
      status: employee.role === 'inactive' ? 'Inactive' : 'Active',
      activity_logs: activityLogs?.map((log: any) => ({
        id: log.id,
        action: log.action,
        timestamp: log.created_at,
        details: log.details
      })) || []
    };

    return new Response(
      JSON.stringify({
        success: true,
        employee: employeeDetail
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    throw error;
  }
}

async function updateEmployeeStatus(supabaseClient: any, profile: any, employeeId: string, status: string) {
  try {
    const { data: employee, error: updateError } = await supabaseClient
      .from('profiles')
      .update({ 
        role: status === 'Inactive' ? 'inactive' : 'employee',
        updated_at: new Date().toISOString()
      })
      .eq('id', employeeId)
      .eq('tenant_id', profile.tenant_id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    // Log activity
    await supabaseClient
      .from('activity_logs')
      .insert({
        user_id: profile.user_id,
        tenant_id: profile.tenant_id,
        module: 'Employee Management',
        action: 'Update Employee Status',
        details: `Changed employee status to ${status}: ${employee.first_name} ${employee.last_name}`
      });

    return new Response(
      JSON.stringify({
        success: true,
        employee
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    throw error;
  }
}

async function deleteEmployee(supabaseClient: any, profile: any, employeeId: string) {
  try {
    // Get employee info first for logging
    const { data: employee } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', employeeId)
      .eq('tenant_id', profile.tenant_id)
      .single();

    // Delete from profiles (this will cascade to auth.users)
    const { error: deleteError } = await supabaseClient
      .from('profiles')
      .delete()
      .eq('id', employeeId)
      .eq('tenant_id', profile.tenant_id);

    if (deleteError) {
      throw deleteError;
    }

    // Log activity
    if (employee) {
      await supabaseClient
        .from('activity_logs')
        .insert({
          user_id: profile.user_id,
          tenant_id: profile.tenant_id,
          module: 'Employee Management',
          action: 'Delete Employee',
          details: `Deleted employee: ${employee.first_name} ${employee.last_name}`
        });
    }

    return new Response(
      JSON.stringify({
        success: true
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    throw error;
  }
}

async function updateEmployee(supabaseClient: any, profile: any, employeeId: string, updateData: any) {
  try {
    const { data: employee, error: updateError } = await supabaseClient
      .from('profiles')
      .update({
        first_name: updateData.first_name,
        last_name: updateData.last_name,
        phone: updateData.phone,
        updated_at: new Date().toISOString()
      })
      .eq('id', employeeId)
      .eq('tenant_id', profile.tenant_id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    // Log activity
    await supabaseClient
      .from('activity_logs')
      .insert({
        user_id: profile.user_id,
        tenant_id: profile.tenant_id,
        module: 'Employee Management',
        action: 'Update Employee',
        details: `Updated employee: ${employee.first_name} ${employee.last_name}`
      });

    return new Response(
      JSON.stringify({
        success: true,
        employee
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    throw error;
  }
}

async function assignRoles(supabaseClient: any, profile: any, employeeId: string, roles: any[]) {
  try {
    // For now, using the tenant_roles table structure
    const roleAssignments = roles.map(role => ({
      user_id: employeeId,
      role_id: role.role_id,
      tenant_id: profile.tenant_id,
      branch_id: role.branch_id || null,
      department_id: role.department_id || null,
      assigned_by: profile.user_id,
      assigned_at: new Date().toISOString()
    }));

    const { data, error } = await supabaseClient
      .from('tenant_roles')
      .insert(roleAssignments)
      .select();

    if (error) {
      throw error;
    }

    // Log activity
    await supabaseClient
      .from('activity_logs')
      .insert({
        user_id: profile.user_id,
        tenant_id: profile.tenant_id,
        module: 'Employee Management',
        action: 'Assign Roles',
        details: `Assigned ${roles.length} role(s) to employee`
      });

    return new Response(
      JSON.stringify({
        success: true,
        assignments: data
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    throw error;
  }
}

async function getEmployeeRoles(supabaseClient: any, profile: any, employeeId: string) {
  try {
    const { data: roles, error } = await supabaseClient
      .from('tenant_roles')
      .select('*')
      .eq('user_id', employeeId)
      .eq('tenant_id', profile.tenant_id);

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({
        success: true,
        roles: roles || []
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    throw error;
  }
}

async function removeRole(supabaseClient: any, profile: any, employeeId: string, roleId: number) {
  try {
    const { error } = await supabaseClient
      .from('tenant_roles')
      .delete()
      .eq('user_id', employeeId)
      .eq('role_id', roleId)
      .eq('tenant_id', profile.tenant_id);

    if (error) {
      throw error;
    }

    // Log activity
    await supabaseClient
      .from('activity_logs')
      .insert({
        user_id: profile.user_id,
        tenant_id: profile.tenant_id,
        module: 'Employee Management',
        action: 'Remove Role',
        details: `Removed role ${roleId} from employee`
      });

    return new Response(
      JSON.stringify({
        success: true
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    throw error;
  }
}

async function bulkImportEmployees(supabaseClient: any, profile: any, importData: any) {
  try {
    const { employees, format } = importData;
    const results = {
      total: employees.length,
      success: 0,
      failed: 0,
      errors: [] as any[]
    };

    for (let i = 0; i < employees.length; i++) {
      try {
        const emp = employees[i];
        
        // Create user in auth
        const { data: authUser, error: authError } = await supabaseClient.auth.admin.createUser({
          email: emp.email,
          email_confirm: true,
          user_metadata: {
            first_name: emp.first_name,
            last_name: emp.last_name,
            role: 'employee'
          }
        });

        if (authError) {
          throw authError;
        }

        // Create profile
        await supabaseClient
          .from('profiles')
          .insert({
            user_id: authUser.user.id,
            email: emp.email,
            first_name: emp.first_name,
            last_name: emp.last_name,
            phone: emp.phone,
            tenant_id: profile.tenant_id,
            role: 'employee',
            must_change_password: true
          });

        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          row: i + 1,
          email: employees[i].email,
          error: error.message
        });
      }
    }

    // Log activity
    await supabaseClient
      .from('activity_logs')
      .insert({
        user_id: profile.user_id,
        tenant_id: profile.tenant_id,
        module: 'Employee Management',
        action: 'Bulk Import',
        details: `Imported ${results.success}/${results.total} employees`
      });

    return new Response(
      JSON.stringify({
        success: true,
        results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    throw error;
  }
}

async function exportEmployees(supabaseClient: any, profile: any, options: any = {}) {
  try {
    const { data: employees, error } = await supabaseClient
      .from('profiles')
      .select(`
        id,
        user_id,
        email,
        first_name,
        last_name,
        phone,
        role,
        created_at,
        updated_at
      `)
      .eq('tenant_id', profile.tenant_id);

    if (error) {
      throw error;
    }

    // Transform data for export
    const exportData = employees.map((emp: any) => ({
      employee_id: emp.user_id.substring(0, 8).toUpperCase(),
      first_name: emp.first_name,
      last_name: emp.last_name,
      email: emp.email,
      phone: emp.phone,
      status: emp.role === 'inactive' ? 'Inactive' : 'Active',
      created_at: emp.created_at
    }));

    // Log activity
    await supabaseClient
      .from('activity_logs')
      .insert({
        user_id: profile.user_id,
        tenant_id: profile.tenant_id,
        module: 'Employee Management',
        action: 'Export Employees',
        details: `Exported ${employees.length} employee records`
      });

    return new Response(
      JSON.stringify({
        success: true,
        data: exportData,
        count: employees.length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    throw error;
  }
}

async function getActivityLogs(supabaseClient: any, profile: any, employeeId: string) {
  try {
    // Get employee first to get user_id
    const { data: employee, error: empError } = await supabaseClient
      .from('profiles')
      .select('user_id')
      .eq('id', employeeId)
      .eq('tenant_id', profile.tenant_id)
      .single();

    if (empError) {
      throw empError;
    }

    // Get activity logs for this employee
    const { data: logs, error } = await supabaseClient
      .from('activity_logs')
      .select('*')
      .eq('user_id', employee.user_id)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({
        success: true,
        logs: logs || []
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    throw error;
  }
}

async function getEmployeeSalaries(supabaseClient: any, profile: any, employeeId: string) {
  try {
    const { data: salaries, error } = await supabaseClient
      .from('tenant_employee_salaries')
      .select(`
        id,
        effective_date,
        base_salary,
        bonus,
        total_salary,
        reason,
        revised_by,
        status,
        created_at,
        updated_at
      `)
      .eq('employee_id', employeeId)
      .eq('tenant_id', profile.tenant_id)
      .order('effective_date', { ascending: false });

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({
        success: true,
        salaries: salaries || []
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    throw error;
  }
}

async function addSalaryRecord(supabaseClient: any, profile: any, employeeId: string, salaryData: any) {
  try {
    const { data: salaryRecord, error: salaryError } = await supabaseClient
      .from('tenant_employee_salaries')
      .insert({
        employee_id: employeeId,
        tenant_id: profile.tenant_id,
        effective_date: salaryData.effective_date,
        base_salary: salaryData.base_salary,
        bonus: salaryData.bonus || 0,
        reason: salaryData.reason,
        revised_by: profile.user_id,
        status: 'Active'
      })
      .select()
      .single();

    if (salaryError) {
      throw salaryError;
    }

    // Log activity
    await supabaseClient
      .from('activity_logs')
      .insert({
        user_id: profile.user_id,
        tenant_id: profile.tenant_id,
        module: 'Employee Management',
        action: 'Add Salary Record',
        details: `Added salary record: ₹${salaryData.base_salary} + bonus ₹${salaryData.bonus || 0}`
      });

    return new Response(
      JSON.stringify({
        success: true,
        salary: salaryRecord
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    throw error;
  }
}

async function getLatestSalary(supabaseClient: any, profile: any, employeeId: string) {
  try {
    const { data: latestSalary, error } = await supabaseClient
      .from('tenant_employee_salaries')
      .select(`
        id,
        effective_date,
        base_salary,
        bonus,
        total_salary,
        reason,
        created_at
      `)
      .eq('employee_id', employeeId)
      .eq('tenant_id', profile.tenant_id)
      .eq('status', 'Active')
      .order('effective_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({
        success: true,
        salary: latestSalary
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    throw error;
  }
}

async function updateSalaryRecord(supabaseClient: any, profile: any, salaryId: string, updateData: any) {
  try {
    const { data: updatedSalary, error } = await supabaseClient
      .from('tenant_employee_salaries')
      .update({
        effective_date: updateData.effective_date,
        base_salary: updateData.base_salary,
        bonus: updateData.bonus,
        reason: updateData.reason,
        updated_at: new Date().toISOString()
      })
      .eq('id', salaryId)
      .eq('tenant_id', profile.tenant_id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Log activity
    await supabaseClient
      .from('activity_logs')
      .insert({
        user_id: profile.user_id,
        tenant_id: profile.tenant_id,
        module: 'Employee Management',
        action: 'Update Salary Record',
        details: `Updated salary record: ₹${updateData.base_salary} + bonus ₹${updateData.bonus || 0}`
      });

    return new Response(
      JSON.stringify({
        success: true,
        salary: updatedSalary
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    throw error;
  }
}

async function deleteSalaryRecord(supabaseClient: any, profile: any, salaryId: string) {
  try {
    const { data: deletedSalary, error } = await supabaseClient
      .from('tenant_employee_salaries')
      .delete()
      .eq('id', salaryId)
      .eq('tenant_id', profile.tenant_id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Log activity
    await supabaseClient
      .from('activity_logs')
      .insert({
        user_id: profile.user_id,
        tenant_id: profile.tenant_id,
        module: 'Employee Management',
        action: 'Delete Salary Record',
        details: `Deleted salary record: ₹${deletedSalary.base_salary} + bonus ₹${deletedSalary.bonus || 0}`
      });

    return new Response(
      JSON.stringify({
        success: true
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    throw error;
  }
}