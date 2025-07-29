import { supabase } from "@/integrations/supabase/client";

export interface AgentCSVRow {
  fullName: string;
  agentCode: string;
  type: string;
  mobile?: string;
  email?: string;
  assignedEmployeeCode?: string;
  assignedBranch?: string;
  referralSource?: string;
  PAN?: string;
  IRDAI_CertificationDate?: string;
  active?: string;
}

export const getAgentTemplateColumns = (): string[] => [
  'fullName',
  'agentCode',
  'type',
  'mobile',
  'email',
  'assignedEmployeeCode',
  'assignedBranch',
  'referralSource',
  'PAN',
  'IRDAI_CertificationDate',
  'active'
];

export const getAgentSampleData = (): Record<string, any>[] => [
  {
    fullName: 'Robert Agent',
    agentCode: 'AGT001',
    type: 'POSP',
    mobile: '9876543220',
    email: 'robert@agents.com',
    assignedEmployeeCode: 'EMP001',
    assignedBranch: 'Main Branch',
    referralSource: 'Direct',
    PAN: 'ABCDE1234F',
    IRDAI_CertificationDate: '2024-01-15',
    active: 'true'
  },
  {
    fullName: 'Sarah Agent',
    agentCode: 'AGT002', 
    type: 'MISP',
    mobile: '9876543221',
    email: 'sarah@agents.com',
    assignedEmployeeCode: 'EMP002',
    assignedBranch: 'Branch 2',
    referralSource: 'Employee Referral',
    PAN: 'FGHIJ5678K',
    IRDAI_CertificationDate: '2024-02-01',
    active: 'true'
  }
];

export const validateAgentRow = (row: Record<string, any>): string[] => {
  const errors: string[] = [];

  if (!row.fullName?.trim()) {
    errors.push('Full name is required');
  }
  
  if (!row.agentCode?.trim()) {
    errors.push('Agent code is required');
  }
  
  if (!row.type?.trim()) {
    errors.push('Agent type is required');
  }

  const validTypes = ['POSP', 'MISP'];
  if (row.type && !validTypes.includes(row.type)) {
    errors.push('Type must be POSP or MISP');
  }

  if (row.email && row.email.trim() && !isValidEmail(row.email)) {
    errors.push('Invalid email format');
  }

  if (row.mobile && row.mobile.trim() && !isValidMobile(row.mobile)) {
    errors.push('Invalid mobile number format');
  }

  if (row.IRDAI_CertificationDate && !isValidDate(row.IRDAI_CertificationDate)) {
    errors.push('Invalid IRDAI certification date format (use YYYY-MM-DD)');
  }

  if (row.active && !['true', 'false'].includes(row.active.toLowerCase())) {
    errors.push('Active must be true or false');
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

const isValidDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  const isValidFormat = /^\d{4}-\d{2}-\d{2}$/.test(dateString);
  return date instanceof Date && !isNaN(date.getTime()) && isValidFormat;
};

export const processAgentRow = async (row: Record<string, any>): Promise<any> => {
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

  // Find employee if specified  
  let employeeId = null;
  if (row.assignedEmployeeCode?.trim()) {
    const { data: employee } = await supabase
      .from('employees')
      .select('id')
      .eq('employee_id', row.assignedEmployeeCode)
      .maybeSingle();
    
    employeeId = employee?.id || null;
  }

  const agentData = {
    name: row.fullName,
    agent_code: row.agentCode,
    agent_type: row.type,
    phone: row.mobile || null,
    email: row.email || null,
    referred_by_employee_id: employeeId,
    branch_id: branchId,
    pan_number: row.PAN || null,
    irdai_certified: !!row.IRDAI_CertificationDate,
    status: row.active?.toLowerCase() === 'false' ? 'Inactive' : 'Active'
  };

  const { data: agent, error } = await supabase
    .from('agents')
    .insert(agentData)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create agent: ${error.message}`);
  }

  return agent;
};