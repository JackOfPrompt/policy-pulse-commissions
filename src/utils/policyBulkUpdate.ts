import { supabase } from "@/integrations/supabase/client";

export interface PolicyUpdateCSVRow {
  policyNumber: string;
  insurerName?: string;
  productName?: string;
  lineOfBusiness?: string;
  policyType?: string;
  policyStartDate?: string;
  policyEndDate?: string;
  premiumAmount?: string;
  sumAssured?: string;
  vehicleType?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  previousPolicyNumber?: string;
  paymentMode?: string;
  policySource?: string;
  createdByType?: string;
  agentCode?: string;
  employeeCode?: string;
  branchName?: string;
  status?: string;
  remarks?: string;
}

export const getPolicyUpdateTemplateColumns = (): string[] => {
  return [
    'policyNumber',
    'insurerName', 
    'productName',
    'lineOfBusiness',
    'policyType',
    'policyStartDate',
    'policyEndDate',
    'premiumAmount',
    'sumAssured',
    'vehicleType',
    'customerName',
    'customerPhone',
    'customerEmail',
    'previousPolicyNumber',
    'paymentMode',
    'policySource',
    'createdByType',
    'agentCode',
    'employeeCode',
    'branchName',
    'status',
    'remarks'
  ];
};

export const generatePolicyUpdateTemplate = async () => {
  const templateColumns = getPolicyUpdateTemplateColumns();
  
  // Get existing policies for reference
  const { data: policies } = await supabase
    .from('policies_new')
    .select('policy_number, line_of_business, policy_type, status')
    .limit(100);

  // Create workbook with template and reference sheets
  const XLSX = await import('xlsx');
  const workbook = XLSX.utils.book_new();
  
  // Template sheet with headers
  const templateSheet = XLSX.utils.aoa_to_sheet([templateColumns]);
  XLSX.utils.book_append_sheet(workbook, templateSheet, 'Policy_Update_Template');
  
  // Reference sheet with existing policies
  if (policies && policies.length > 0) {
    const referenceData = [
      ['Policy Number', 'Line of Business', 'Policy Type', 'Current Status'],
      ...policies.map(p => [p.policy_number, p.line_of_business, p.policy_type, p.status])
    ];
    const referenceSheet = XLSX.utils.aoa_to_sheet(referenceData);
    XLSX.utils.book_append_sheet(workbook, referenceSheet, 'Existing_Policies_Reference');
  }
  
  return XLSX.writeFile(workbook, 'policy_bulk_update_template.xlsx');
};

export const validatePolicyUpdateRow = (row: Record<string, any>): string[] => {
  const errors: string[] = [];

  // Policy number is required for updates
  if (!row.policyNumber?.trim()) {
    errors.push('Policy number is required for updates');
  }

  // Date format validation if provided
  if (row.policyStartDate && !isValidDate(row.policyStartDate)) {
    errors.push('Invalid policy start date format (use YYYY-MM-DD)');
  }
  
  if (row.policyEndDate && !isValidDate(row.policyEndDate)) {
    errors.push('Invalid policy end date format (use YYYY-MM-DD)');
  }

  // Numeric validation if provided
  if (row.premiumAmount && row.premiumAmount.trim() && isNaN(parseFloat(row.premiumAmount))) {
    errors.push('Premium amount must be a valid number');
  }
  
  if (row.sumAssured && row.sumAssured.trim() && isNaN(parseFloat(row.sumAssured))) {
    errors.push('Sum assured must be a valid number');
  }

  // Line of business validation if provided
  if (row.lineOfBusiness) {
    const validLOBs = ['HEALTH', 'MOTOR', 'LIFE', 'TRAVEL', 'LOAN', 'PET', 'COMMERCIAL'];
    if (!validLOBs.includes(row.lineOfBusiness.toUpperCase())) {
      errors.push('Line of business must be one of: Health, Motor, Life, Travel, Loan, Pet, Commercial');
    }
  }

  // Policy type validation if provided
  if (row.policyType) {
    const validPolicyTypes = ['NEW', 'RENEWAL', 'PORTABILITY', 'TOP-UP', 'ROLLOVER', 'CONVERTED'];
    if (!validPolicyTypes.includes(row.policyType.toUpperCase())) {
      errors.push('Policy type must be one of: New, Renewal, Portability, Top-Up, Rollover, Converted');
    }
  }

  // Vehicle type validation for Motor LOB if provided
  if (row.lineOfBusiness?.toUpperCase() === 'MOTOR' && row.vehicleType?.trim()) {
    const validVehicleTypes = ['TWO-WHEELER', 'PRIVATE CAR', 'COMMERCIAL VEHICLE', 'MISCELLANEOUS'];
    if (!validVehicleTypes.includes(row.vehicleType.toUpperCase())) {
      errors.push('Vehicle type must be one of: Two-Wheeler, Private Car, Commercial Vehicle, Miscellaneous');
    }
  }

  // Payment mode validation if provided
  if (row.paymentMode?.trim()) {
    const validPaymentModes = ['CASH', 'UPI', 'CHEQUE', 'ONLINE', 'BANK TRANSFER'];
    if (!validPaymentModes.includes(row.paymentMode.toUpperCase())) {
      errors.push('Payment mode must be one of: Cash, UPI, Cheque, Online, Bank Transfer');
    }
  }

  // Created by type validation if provided
  if (row.createdByType && !['AGENT', 'EMPLOYEE'].includes(row.createdByType.toUpperCase())) {
    errors.push('Created By Type must be either Agent or Employee');
  }

  return errors;
};

const isValidDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  const isValidFormat = /^\d{4}-\d{2}-\d{2}$/.test(dateString);
  return date instanceof Date && !isNaN(date.getTime()) && isValidFormat;
};

export const processPolicyUpdateRow = async (row: Record<string, any>): Promise<any> => {
  // Find existing policy by policy number
  const { data: existingPolicy, error: findError } = await supabase
    .from('policies_new')
    .select('*')
    .eq('policy_number', row.policyNumber)
    .single();

  if (findError || !existingPolicy) {
    throw new Error(`Policy not found: ${row.policyNumber}`);
  }

  // Prepare update data - only include fields that are provided
  const updateData: any = {};

  if (row.insurerName?.trim()) {
    const insurerId = await getOrCreateInsurer(row.insurerName.toUpperCase());
    updateData.insurer_id = insurerId;
  }

  if (row.productName?.trim()) {
    const productId = await getOrCreateProduct(
      row.productName.toUpperCase(), 
      updateData.insurer_id || existingPolicy.insurer_id, 
      row.lineOfBusiness?.toUpperCase() || existingPolicy.line_of_business
    );
    updateData.product_id = productId;
  }

  if (row.lineOfBusiness?.trim()) {
    updateData.line_of_business = row.lineOfBusiness.toUpperCase();
    const lineOfBusinessId = await getLineOfBusinessId(row.lineOfBusiness.toUpperCase());
    updateData.line_of_business_id = lineOfBusinessId;
  }

  if (row.policyType?.trim()) {
    updateData.policy_type = row.policyType.toUpperCase();
  }

  if (row.policyStartDate?.trim()) {
    updateData.policy_start_date = row.policyStartDate;
  }

  if (row.policyEndDate?.trim()) {
    updateData.policy_end_date = row.policyEndDate;
  }

  if (row.premiumAmount?.trim()) {
    updateData.premium_amount = parseFloat(row.premiumAmount);
  }

  if (row.sumAssured?.trim()) {
    updateData.sum_assured = parseFloat(row.sumAssured);
  }

  if (row.vehicleType?.trim()) {
    const vehicleTypeId = await getVehicleTypeId(row.vehicleType.toUpperCase());
    updateData.vehicle_type_id = vehicleTypeId;
  }

  if (row.customerName?.trim()) {
    updateData.customer_name = row.customerName;
  }

  if (row.customerPhone?.trim()) {
    updateData.customer_phone = row.customerPhone;
  }

  if (row.customerEmail?.trim()) {
    updateData.customer_email = row.customerEmail;
  }

  if (row.previousPolicyNumber?.trim()) {
    updateData.previous_policy_number = row.previousPolicyNumber;
  }

  if (row.paymentMode?.trim()) {
    updateData.payment_mode = row.paymentMode.toUpperCase();
  }

  if (row.policySource?.trim()) {
    updateData.policy_source = row.policySource.toUpperCase();
  }

  if (row.agentCode?.trim()) {
    const agentId = await getAgentByCode(row.agentCode);
    if (agentId) {
      updateData.agent_id = agentId;
      updateData.created_by_type = 'AGENT';
      updateData.employee_id = null;
    }
  }

  if (row.employeeCode?.trim()) {
    const employeeId = await getEmployeeByCode(row.employeeCode);
    if (employeeId) {
      updateData.employee_id = employeeId;
      updateData.created_by_type = 'EMPLOYEE';
      updateData.agent_id = null;
    }
  }

  if (row.branchName?.trim()) {
    const branchId = await getBranchByName(row.branchName);
    updateData.branch_id = branchId;
  }

  if (row.status?.trim()) {
    updateData.status = row.status.toUpperCase();
    updateData.policy_status = row.status.toUpperCase();
  }

  if (row.remarks?.trim()) {
    updateData.remarks = row.remarks;
  }

  // Update the policy
  const { data: updatedPolicy, error } = await supabase
    .from('policies_new')
    .update(updateData)
    .eq('id', existingPolicy.id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update policy: ${error.message}`);
  }

  return updatedPolicy;
};

// Helper functions (reused from policyBulkUpload.ts)
const getOrCreateInsurer = async (insurerName: string): Promise<string> => {
  const { data: existing } = await supabase
    .from('insurance_providers')
    .select('id')
    .eq('provider_name', insurerName)
    .single();

  if (existing) {
    return existing.id;
  }

  const { data: newInsurer, error } = await supabase
    .from('insurance_providers')
    .insert({
      provider_name: insurerName,
      irdai_code: `AUTO_${Date.now()}`,
      status: 'ACTIVE'
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create insurer: ${error.message}`);
  }

  return newInsurer.id;
};

const getOrCreateProduct = async (productName: string, providerId: string, lineOfBusiness: string): Promise<string> => {
  const { data: existing } = await supabase
    .from('insurance_products')
    .select('id')
    .eq('provider_id', providerId)
    .eq('category', lineOfBusiness)
    .ilike('name', productName)
    .single();

  if (existing) {
    return existing.id;
  }

  const { data: newProduct, error } = await supabase
    .from('insurance_products')
    .insert({
      name: productName,
      code: `AUTO_${Date.now()}`,
      provider_id: providerId,
      category: lineOfBusiness,
      coverage_type: 'COMPREHENSIVE',
      premium_type: 'FIXED',
      min_sum_insured: 100000,
      max_sum_insured: 10000000,
      status: 'ACTIVE'
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create product: ${error.message}`);
  }

  return newProduct.id;
};

const getAgentByCode = async (agentCode: string): Promise<string | null> => {
  const { data } = await supabase
    .from('agents')
    .select('id')
    .eq('agent_code', agentCode)
    .single();

  return data?.id || null;
};

const getEmployeeByCode = async (employeeCode: string): Promise<string | null> => {
  const { data } = await supabase
    .from('employees')
    .select('id')
    .eq('employee_id', employeeCode)
    .single();

  return data?.id || null;
};

const getBranchByName = async (branchName: string): Promise<string | null> => {
  const { data } = await supabase
    .from('branches')
    .select('id')
    .eq('name', branchName)
    .single();

  return data?.id || null;
};

const getLineOfBusinessId = async (lineOfBusinessName: string): Promise<string> => {
  const { data, error } = await supabase
    .from('line_of_business')
    .select('id')
    .eq('name', lineOfBusinessName)
    .single();

  if (error) {
    throw new Error(`Failed to find line of business "${lineOfBusinessName}": ${error.message}`);
  }

  return data.id;
};

const getVehicleTypeId = async (vehicleTypeName: string): Promise<string | null> => {
  const { data } = await supabase
    .from('motor_vehicle_types')
    .select('id')
    .eq('name', vehicleTypeName as any)
    .single();

  return data?.id || null;
};