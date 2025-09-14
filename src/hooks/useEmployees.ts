import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Employee {
  id: string;
  org_id: string;
  branch_id?: string;
  employee_code?: string;
  name?: string;
  role?: string;
  gender?: 'male' | 'female' | 'other';
  dob?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  district?: string;
  state?: string;
  country?: string;
  pincode?: string;
  designation?: string;
  department?: string;
  status: 'active' | 'inactive' | 'suspended';
  qualification?: string;
  reference?: string;
  reporting_manager?: string;
  mobilepermissions?: boolean;
  emailpermissions?: boolean;
  pan_card?: string;
  aadhar_card?: string;
  pan_url?: string;
  aadhar_url?: string;
  degree_doc?: string;
  cheque_doc?: string;
  profile_doc?: string;
  other_doc?: string;
  account_name?: string;
  bank_name?: string;
  account_number?: string;
  ifsc_code?: string;
  account_type?: 'savings' | 'current';
  branch_name?: string;
  created_at: string;
  updated_at: string;
}

export function useEmployees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('employees')
        .select(`
          *,
          organizations(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEmployees((data as Employee[]) || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  };

  const createEmployee = async (employeeData: Partial<Employee>) => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .insert(employeeData as any)
        .select()
        .single();

      if (error) throw error;
      
      await fetchEmployees();
      return { success: true, data };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create employee';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const updateEmployee = async (id: string, employeeData: Partial<Employee>) => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .update(employeeData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      await fetchEmployees();
      return { success: true, data };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update employee';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const deleteEmployee = async (id: string) => {
    try {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      await fetchEmployees();
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete employee';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  return {
    employees,
    loading,
    error,
    fetchEmployees,
    createEmployee,
    updateEmployee,
    deleteEmployee,
  };
}