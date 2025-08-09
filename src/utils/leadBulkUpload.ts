import { supabase } from "@/integrations/supabase/client";

export interface LeadCSVRow {
  fullName: string;
  phoneNumber: string;
  email?: string;
  location?: string;
  lineOfBusiness: string;
  productName?: string;
  leadSource?: string;
  assignedToType?: string;
  assignedToName?: string;
  priority?: string;
  followUpDate?: string;
}

export const getLeadTemplateColumns = (): string[] => [
  'fullName',
  'phoneNumber', 
  'email',
  'location',
  'lineOfBusiness',
  'productName',
  'leadSource',
  'assignedToType',
  'assignedToName',
  'priority',
  'followUpDate'
];

export const getLeadSampleData = (): Record<string, any>[] => [
  {
    fullName: 'John Doe',
    phoneNumber: '9876543210',
    email: 'john.doe@email.com',
    location: 'Mumbai',
    lineOfBusiness: 'Life',
    productName: 'Term Life Insurance',
    leadSource: 'Website',
    assignedToType: 'Employee',
    assignedToName: 'Sales Manager',
    priority: 'High',
    followUpDate: '2024-02-01'
  },
  {
    fullName: 'Jane Smith',
    phoneNumber: '9876543211',
    email: 'jane.smith@email.com',
    location: 'Delhi',
    lineOfBusiness: 'Motor',
    productName: 'Car Insurance',
    leadSource: 'Referral',
    assignedToType: 'Agent',
    assignedToName: 'Insurance Agent',
    priority: 'Medium',
    followUpDate: '2024-02-05'
  }
];

export const validateLeadRow = (row: Record<string, any>): string[] => {
  const errors: string[] = [];

  if (!row.fullName?.trim()) {
    errors.push('Full name is required');
  }

  if (!row.phoneNumber?.trim()) {
    errors.push('Phone number is required');
  }

  if (row.phoneNumber && !isValidMobile(row.phoneNumber)) {
    errors.push('Invalid phone number format');
  }

  if (!row.lineOfBusiness?.trim()) {
    errors.push('Line of business is required');
  }

  if (row.email && row.email.trim() && !isValidEmail(row.email)) {
    errors.push('Invalid email format');
  }

  if (row.leadSource && !['Walk-in', 'Website', 'Referral', 'Tele-calling', 'Campaign', 'API'].includes(row.leadSource)) {
    errors.push('Invalid lead source');
  }

  if (row.assignedToType && !['Employee', 'Agent'].includes(row.assignedToType)) {
    errors.push('Assigned to type must be Employee or Agent');
  }

  if (row.priority && !['Low', 'Medium', 'High', 'Urgent'].includes(row.priority)) {
    errors.push('Priority must be Low, Medium, High, or Urgent');
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

export const processLeadRow = async (row: Record<string, any>): Promise<any> => {
  // Find product if specified
  let productId = null;
  let insurerId = null;
  
  if (row.productName?.trim()) {
    const { data: product } = await supabase
      .from('insurance_products')
      .select('id, provider_id')
      .eq('name', row.productName)
      .maybeSingle();
    
    if (product) {
      productId = product.id;
      insurerId = product.provider_id;
    }
  }

  // Find assigned person
  let assignedToId = null;
  if (row.assignedToName?.trim() && row.assignedToType?.trim()) {
    if (row.assignedToType === 'Employee') {
      const { data: employee } = await supabase
        .from('employees')
        .select('id')
        .eq('name', row.assignedToName)
        .maybeSingle();
      assignedToId = employee?.id || null;
    } else if (row.assignedToType === 'Agent') {
      const { data: agent } = await supabase
        .from('agents')
        .select('id')
        .eq('name', row.assignedToName)
        .maybeSingle();
      assignedToId = agent?.id || null;
    }
  }

  const leadData = {
    full_name: row.fullName,
    phone_number: row.phoneNumber,
    email: row.email || null,
    location: row.location || null,
    line_of_business: row.lineOfBusiness,
    product_id: productId,
    insurance_provider_id: insurerId,
    lead_source: row.leadSource || 'Walk-in',
    assigned_to_type: row.assignedToType || null,
    assigned_to_id: assignedToId,
    priority: row.priority || 'Medium',
    next_follow_up_date: row.followUpDate ? new Date(row.followUpDate).toISOString().split('T')[0] : null
  };

  const { data: lead, error } = await supabase
    .from('leads')
    .insert(leadData)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create lead: ${error.message}`);
  }

  return lead;
};