import { supabase } from "@/integrations/supabase/client";

export interface EmployeeCSVRow {
  fullName: string;
  employeeCode: string;
  designation: string;
  email?: string;
  mobile?: string;
  role: string;
  assignedBranch?: string;
  reportsTo?: string;
}

export const getEmployeeTemplateColumns = (): string[] => [
  'fullName',
  'employeeCode',
  'designation', 
  'email',
  'mobile',
  'role',
  'assignedBranch',
  'reportsTo'
];

export const getEmployeeSampleData = (): Record<string, any>[] => [
  {
    fullName: 'John Smith',
    employeeCode: 'EMP001',
    designation: 'Sales Manager',
    email: 'john.smith@company.com',
    mobile: '9876543210',
    role: 'Sales Manager',
    assignedBranch: 'Main Branch',
    reportsTo: ''
  },
  {
    fullName: 'Jane Doe', 
    employeeCode: 'EMP002',
    designation: 'Sales Executive',
    email: 'jane.doe@company.com',
    mobile: '9876543211',
    role: 'Sales Executive',
    assignedBranch: 'Main Branch',
    reportsTo: 'EMP001'
  }
];

export const validateEmployeeRow = (row: Record<string, any>): string[] => {
  const errors: string[] = [];

  if (!row.fullName?.trim()) {
    errors.push('Full name is required');
  }
  
  if (!row.employeeCode?.trim()) {
    errors.push('Employee code is required');
  }
  
  if (!row.designation?.trim()) {
    errors.push('Designation is required');
  }

  if (!row.role?.trim()) {
    errors.push('Role is required');
  }

  if (row.email && row.email.trim() && !isValidEmail(row.email)) {
    errors.push('Invalid email format');
  }

  if (row.mobile && row.mobile.trim() && !isValidMobile(row.mobile)) {
    errors.push('Invalid mobile number format');
  }

  return errors;
};

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const isValidMobile = (mobile: string): boolean => {
  const mobileRegex = /^[0-9]{10}$/;
  return mobileRegex.test(mobile.replace(/\s+/g, ''));
};

export const processEmployeeRow = async (row: Record<string, any>): Promise<any> => {
  // Find branch if specified
  let branchId = null;
  if (row.assignedBranch?.trim()) {
    const { data: branch } = await supabase
      .from('branches')
      .select('id')
      .eq('name', row.assignedBranch)
      .maybeSingle();
    
    branchId = branch?.id || null;
  }

  const employeeData = {
    name: row.fullName,
    employee_id: row.employeeCode,
    role: row.role,
    email: row.email || null,
    phone: row.mobile || null,
    branch_id: branchId,
    status: 'Active'
  };

  const { data: employee, error } = await supabase
    .from('employees')
    .insert(employeeData)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create employee: ${error.message}`);
  }

  return employee;
};