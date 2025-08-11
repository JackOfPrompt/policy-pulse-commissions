import { supabase } from "@/integrations/supabase/client";

export interface BranchCSVRow {
  branchName: string;
  branchCode: string;
  managerName?: string;
  managerPhone?: string;
  email?: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  status?: string;
}

export const getBranchTemplateColumns = (): string[] => [
  'branchName',
  'branchCode',
  'managerName',
  'managerPhone',
  'email',
  'phone',
  'addressLine1',
  'addressLine2',
  'city',
  'state',
  'pincode',
  'status'
];

export const getBranchSampleData = (): Record<string, any>[] => [
  {
    branchName: 'Main Branch',
    branchCode: 'BR001',
    managerName: 'John Manager',
    managerPhone: '9876543210',
    email: 'main@company.com',
    phone: '022-12345678',
    addressLine1: '123 Business Street',
    addressLine2: 'Commercial Complex',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
    status: 'Active'
  },
  {
    branchName: 'Delhi Branch',
    branchCode: 'BR002',
    managerName: 'Jane Director',
    managerPhone: '9876543211',
    email: 'delhi@company.com',
    phone: '011-87654321',
    addressLine1: '456 Corporate Avenue',
    addressLine2: 'Tower B, Floor 5',
    city: 'New Delhi',
    state: 'Delhi',
    pincode: '110001',
    status: 'Active'
  }
];

export const validateBranchRow = (row: Record<string, any>): string[] => {
  const errors: string[] = [];

  if (!row.branchName?.trim()) {
    errors.push('Branch name is required');
  }
  
  if (!row.branchCode?.trim()) {
    errors.push('Branch code is required');
  }

  if (row.email && row.email.trim() && !isValidEmail(row.email)) {
    errors.push('Invalid email format');
  }

  if (row.managerPhone && row.managerPhone.trim() && !isValidMobile(row.managerPhone)) {
    errors.push('Invalid manager phone number format');
  }

  if (row.phone && row.phone.trim() && !isValidPhone(row.phone)) {
    errors.push('Invalid phone number format');
  }

  if (row.pincode && row.pincode.trim() && !isValidPincode(row.pincode)) {
    errors.push('Invalid pincode format');
  }

  if (row.status && !['Active', 'Inactive'].includes(row.status)) {
    errors.push('Status must be Active or Inactive');
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

const isValidPhone = (phone: string): boolean => {
  // Allows formats like 022-12345678, +91-22-12345678, etc.
  const phoneRegex = /^[\+]?[0-9\-\s]{8,15}$/;
  return phoneRegex.test(phone);
};

const isValidPincode = (pincode: string): boolean => {
  const pincodeRegex = /^[0-9]{6}$/;
  return pincodeRegex.test(pincode);
};

export const processBranchRow = async (row: Record<string, any>, tenantId?: string): Promise<any> => {
  let tId = tenantId || null;

  if (!tId) {
    const { data, error } = await supabase.rpc('current_user_tenant_ids');
    if (error) {
      throw new Error(`Failed to resolve tenant: ${error.message}`);
    }
    const ids: string[] = Array.isArray(data) ? data : [];
    tId = ids[0] || null;
  }

  if (!tId) {
    throw new Error('No tenant context available. Please select a tenant and try again.');
  }

  const branchData = {
    tenant_id: tId,
    branch_name: row.branchName,
    branch_code: row.branchCode || null,
    contact_person: row.managerName || null,
    email: row.email || null,
    phone_number: row.phone || row.managerPhone || null,
    address_line1: row.addressLine1 || null,
    address_line2: row.addressLine2 || null,
    city: row.city || null,
    state: row.state || null,
    pincode: row.pincode || null,
    status: row.status || 'Active'
  };
  const { data: branch, error } = await supabase
    .from('branches')
    .insert(branchData)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create branch: ${error.message}`);
  }

  return branch;
};