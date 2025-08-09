import { supabase } from "@/integrations/supabase/client";

export interface PolicyCSVRow {
  policyNumber: string;
  insurerName: string;
  productName: string;
  lineOfBusiness: string;
  policyType: string;
  policyStartDate: string;
  policyEndDate: string;
  premiumAmount: string;
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

export interface MotorPolicyCSVRow extends PolicyCSVRow {
  vehicleType?: string;
  registrationNumber?: string;
  manufacturer?: string;
  model?: string;
  variant?: string;
  fuelType?: string;
  IDV?: string;
  ownDamagePremium?: string;
  thirdPartyPremium?: string;
  NCBPercent?: string;
}

export interface LifePolicyCSVRow extends PolicyCSVRow {
  proposerName?: string;
  lifeAssuredName?: string;
  relationship?: string;
  planType?: string;
  policyTerm?: string;
  premiumPayingTerm?: string;
  paymentFrequency?: string;
  nomineeName?: string;
  nomineeRelation?: string;
}

export interface HealthPolicyCSVRow extends PolicyCSVRow {
  proposerName?: string;
  coverageType?: string;
  sumInsured?: string;
  deductible?: string;
  policyTerm?: string;
  paymentMode?: string;
  roomRentLimit?: string;
}

export interface CommercialPolicyCSVRow extends PolicyCSVRow {
  policyCategory?: string;
  businessType?: string;
  riskAddress?: string;
  numberOfEmployees?: string;
  companyName?: string;
  PAN?: string;
  GSTIN?: string;
}

export const getTemplateColumns = (lineOfBusiness: string): string[] => {
  const baseColumns = [
    'policyNumber',
    'insurerName', 
    'productName',
    'lineOfBusiness',
    'policyType',
    'policyStartDate',
    'policyEndDate',
    'premiumAmount',
    'sumAssured',
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
  
  // Add vehicle type for Motor LOB
  if (lineOfBusiness?.toLowerCase() === 'motor') {
    baseColumns.splice(baseColumns.indexOf('customerName'), 0, 'vehicleType');
  }

  switch (lineOfBusiness?.toLowerCase()) {
    case 'motor':
      return [
        ...baseColumns,
        'vehicleType',
        'registrationNumber',
        'manufacturer',
        'model',
        'variant',
        'fuelType',
        'IDV',
        'ownDamagePremium',
        'thirdPartyPremium',
        'NCBPercent'
      ];
    case 'life':
      return [
        ...baseColumns,
        'proposerName',
        'lifeAssuredName',
        'relationship',
        'planType',
        'policyTerm',
        'premiumPayingTerm',
        'paymentFrequency',
        'nomineeName',
        'nomineeRelation'
      ];
    case 'health':
      return [
        ...baseColumns,
        'proposerName',
        'coverageType',
        'sumInsured',
        'deductible',
        'policyTerm',
        'paymentMode',
        'roomRentLimit'
      ];
    case 'commercial':
      return [
        ...baseColumns,
        'policyCategory',
        'businessType',
        'riskAddress',
        'numberOfEmployees',
        'companyName',
        'PAN',
        'GSTIN'
      ];
    default:
      return baseColumns;
  }
};

export const getSampleData = (lineOfBusiness: string): Record<string, any>[] => {
  const baseSample = {
    policyNumber: 'POL001',
    insurerName: 'ABC Insurance',
    productName: 'Comprehensive Cover',
    lineOfBusiness: lineOfBusiness,
    policyStartDate: '2024-01-01',
    policyEndDate: '2024-12-31',
    premiumAmount: '50000',
    sumAssured: '1000000',
    policyType: 'New',
    policySource: 'Online',
    createdByType: 'Agent',
    agentCode: 'AGT001',
    employeeCode: '',
    branchName: 'Main Branch',
    status: 'Active',
    remarks: 'Sample policy'
  };

  switch (lineOfBusiness?.toLowerCase()) {
    case 'motor':
      return [{
        ...baseSample,
        vehicleType: 'Car',
        registrationNumber: 'MH01AB1234',
        manufacturer: 'Maruti',
        model: 'Swift',
        variant: 'VXI',
        fuelType: 'Petrol',
        IDV: '800000',
        ownDamagePremium: '25000',
        thirdPartyPremium: '15000',
        NCBPercent: '20'
      }];
    case 'life':
      return [{
        ...baseSample,
        proposerName: 'John Doe',
        lifeAssuredName: 'John Doe',
        relationship: 'Self',
        planType: 'Term',
        policyTerm: '20',
        premiumPayingTerm: '20',
        paymentFrequency: 'Annual',
        nomineeName: 'Jane Doe',
        nomineeRelation: 'Spouse'
      }];
    case 'health':
      return [{
        ...baseSample,
        proposerName: 'John Doe',
        coverageType: 'Individual',
        sumInsured: '500000',
        deductible: '10000',
        policyTerm: '1',
        paymentMode: 'Annual',
        roomRentLimit: '5000'
      }];
    case 'commercial':
      return [{
        ...baseSample,
        policyCategory: 'Fire',
        businessType: 'Manufacturing',
        riskAddress: '123 Industrial Area',
        numberOfEmployees: '50',
        companyName: 'ABC Industries Ltd',
        PAN: 'ABCDE1234F',
        GSTIN: '29ABCDE1234F1Z5'
      }];
    default:
      return [baseSample];
  }
};

export const validatePolicyRow = (row: Record<string, any>): string[] => {
  const errors: string[] = [];

  // Required fields validation
  if (!row.policyNumber?.trim()) {
    errors.push('Policy number is required');
  }
  
  if (!row.insurerName?.trim()) {
    errors.push('Insurer name is required');
  }
  
  // Product name is not mandatory - will be handled during processing
  
  if (!row.lineOfBusiness?.trim()) {
    errors.push('Line of business is required');
  }
  
  if (!row.policyStartDate?.trim()) {
    errors.push('Policy start date is required');
  }
  
  if (!row.policyEndDate?.trim()) {
    errors.push('Policy end date is required');
  }
  
  if (!row.premiumAmount?.trim()) {
    errors.push('Premium amount is required');
  }

  // Date format validation
  if (row.policyStartDate && !isValidDate(row.policyStartDate)) {
    errors.push('Invalid policy start date format (use YYYY-MM-DD)');
  }
  
  if (row.policyEndDate && !isValidDate(row.policyEndDate)) {
    errors.push('Invalid policy end date format (use YYYY-MM-DD)');
  }

  // Numeric validation
  if (row.premiumAmount && isNaN(parseFloat(row.premiumAmount))) {
    errors.push('Premium amount must be a valid number');
  }
  
  if (row.sumAssured && row.sumAssured.trim() && isNaN(parseFloat(row.sumAssured))) {
    errors.push('Sum assured must be a valid number');
  }

  // Line of business validation
  const validLOBs = ['Health', 'Motor', 'Life', 'Travel', 'Loan', 'Pet', 'Commercial'];
  if (row.lineOfBusiness && !validLOBs.includes(row.lineOfBusiness)) {
    errors.push('Line of business must be one of: Health, Motor, Life, Travel, Loan, Pet, Commercial');
  }

  // Policy type validation
  const validPolicyTypes = ['New', 'Renewal', 'Portability', 'Top-Up', 'Rollover', 'Converted'];
  if (!row.policyType?.trim()) {
    errors.push('Policy type is required');
  } else if (!validPolicyTypes.includes(row.policyType)) {
    errors.push(`Policy type must be one of: ${validPolicyTypes.join(', ')}`);
  }

  // Vehicle type validation for Motor LOB
  if (row.lineOfBusiness === 'Motor' && row.vehicleType?.trim()) {
    const validVehicleTypes = ['Two-Wheeler', 'Private Car', 'Commercial Vehicle', 'Miscellaneous'];
    if (!validVehicleTypes.includes(row.vehicleType)) {
      errors.push(`Vehicle type must be one of: ${validVehicleTypes.join(', ')}`);
    }
  }

  // Payment mode validation
  if (row.paymentMode?.trim()) {
    const validPaymentModes = ['Cash', 'UPI', 'Cheque', 'Online', 'Bank Transfer'];
    if (!validPaymentModes.includes(row.paymentMode)) {
      errors.push(`Payment mode must be one of: ${validPaymentModes.join(', ')}`);
    }
  }

  // Created by type validation
  if (row.createdByType && !['Agent', 'Employee'].includes(row.createdByType)) {
    errors.push('Created By Type must be either Agent or Employee');
  }

  // Validate Agent/Employee logic
  if (row.createdByType === 'Agent') {
    if (!row.agentCode?.trim()) {
      errors.push('Agent Code is required when Created By Type is Agent');
    }
    if (row.employeeCode?.trim()) {
      errors.push('Employee Code must be empty when Created By Type is Agent');
    }
  } else if (row.createdByType === 'Employee') {
    if (!row.employeeCode?.trim()) {
      errors.push('Employee Code is required when Created By Type is Employee');
    }
    if (row.agentCode?.trim()) {
      errors.push('Agent Code must be empty when Created By Type is Employee');
    }
  }

  return errors;
};

const isValidDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  const isValidFormat = /^\d{4}-\d{2}-\d{2}$/.test(dateString);
  return date instanceof Date && !isNaN(date.getTime()) && isValidFormat;
};

export const processPolicyRow = async (row: Record<string, any>): Promise<any> => {
  // First, get or create related entities
  const insurerId = await getOrCreateInsurer(row.insurerName);
  const productId = await getOrCreateProduct(row.productName, insurerId, row.lineOfBusiness, row.policyType);
  const agentId = row.agentCode ? await getAgentByCode(row.agentCode) : null;
  const employeeId = row.employeeCode ? await getEmployeeByCode(row.employeeCode) : null;
  const branchId = row.branchName ? await getBranchByName(row.branchName) : null;
  const lineOfBusinessId = await getLineOfBusinessId(row.lineOfBusiness);
  const vehicleTypeId = row.vehicleType ? await getVehicleTypeId(row.vehicleType) : null;

  // Map policy type to valid values
  const mapPolicyType = (policyType: string): string | null => {
    if (!policyType) return null;
    
    const normalizedType = policyType.toUpperCase().trim();
    
    // Mapping common variations to valid policy types
    if (normalizedType.includes('NEW') || normalizedType.includes('FRESH') || normalizedType === 'INDIVIDUL' || normalizedType === 'INDIVIDUAL' || normalizedType === 'FAMILY' || normalizedType === 'FLOATER') {
      return 'New';
    }
    if (normalizedType === 'RENEWAL' || normalizedType.includes('RENEW')) {
      return 'Renewal';
    }
    if (normalizedType === 'ROLLOVER' || normalizedType === 'ROLL-OVER' || normalizedType.includes('ROLL')) {
      return 'Roll-over';
    }
    if (normalizedType === 'PORTED' || normalizedType.includes('PORT')) {
      return 'Ported';
    }
    
    // Default to 'New' for unrecognized types
    return 'New';
  };

  // Determine created_by_type based on which ID is present
  let createdByType: 'Agent' | 'Employee' = 'Employee';
  if (agentId && !employeeId) {
    createdByType = 'Agent';
  } else if (employeeId && !agentId) {
    createdByType = 'Employee';
  } else if (row.createdByType) {
    createdByType = row.createdByType === 'Agent' ? 'Agent' : 'Employee';
  }

  // Check if this is an unverified customer policy
  const isUnverifiedCustomer = row.customerName?.toLowerCase().trim() === 'unverified customer';

  // Create the main policy record
  const policyData = {
    policy_number: row.policyNumber,
    insurer_id: insurerId,
    product_id: productId,
    line_of_business: row.lineOfBusiness,
    line_of_business_id: lineOfBusinessId,
    policy_type: row.policyType as any,
    policy_start_date: row.policyStartDate,
    policy_end_date: row.policyEndDate,
    premium_amount: parseFloat(row.premiumAmount),
    sum_assured: row.sumAssured ? parseFloat(row.sumAssured) : null,
    vehicle_type_id: vehicleTypeId,
    customer_name: isUnverifiedCustomer ? 'Unverified Customer' : (row.customerName || null),
    customer_phone: isUnverifiedCustomer ? null : (row.customerPhone || null),
    customer_email: isUnverifiedCustomer ? null : (row.customerEmail || null),
    previous_policy_number: row.previousPolicyNumber || null,
    payment_mode: row.paymentMode as any,
    policy_source: row.policySource || null,
    created_by_type: createdByType,
    agent_id: createdByType === 'Agent' ? agentId : null,
    employee_id: createdByType === 'Employee' ? employeeId : null,
    branch_id: branchId,
    status: row.status || 'Active',
    remarks: isUnverifiedCustomer ? 
      `Unverified Customer Policy. ${row.remarks || ''}`.trim() : 
      (row.remarks || null)
  };

  const { data: policy, error } = await supabase
    .from('policies_new')
    .insert(policyData)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create policy: ${error.message}`);
  }

  // Create line-specific policy record
  await createLineSpecificPolicy(policy.id, row.lineOfBusiness, row);

  return policy;
};

const getOrCreateInsurer = async (insurerName: string): Promise<string> => {
  // First try to find existing insurer
  const { data: existing } = await supabase
    .from('insurance_providers')
    .select('id')
    .eq('provider_name', insurerName)
    .single();

  if (existing) {
    return existing.id;
  }

  // Create new insurer if not found
  const { data: newInsurer, error } = await supabase
    .from('insurance_providers')
    .insert({
      provider_name: insurerName,
      irdai_code: `AUTO_${Date.now()}`,
      provider_type: 'General'
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create insurer: ${error.message}`);
  }

  return newInsurer.id;
};

const getOrCreateProduct = async (productName: string, providerId: string, lineOfBusiness: string, policyType?: string): Promise<string> => {
  // If no product name provided, create placeholder immediately
  if (!productName?.trim()) {
    const { data: newProduct, error } = await supabase
      .from('insurance_products')
      .insert({
        name: 'Product name not found in system',
        code: `AUTO_${Date.now()}`,
        provider_id: providerId,
        category: lineOfBusiness,
        coverage_type: 'Comprehensive',
        premium_type: 'Fixed',
        min_sum_insured: 100000,
        max_sum_insured: 10000000
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create placeholder product: ${error.message}`);
    }

    return newProduct.id;
  }

  // First try to find existing product with enhanced matching
  let query = supabase
    .from('insurance_products')
    .select('id')
    .eq('provider_id', providerId)
    .eq('category', lineOfBusiness);

  // Try exact name match first
  const { data: exactMatch } = await query
    .eq('name', productName)
    .maybeSingle();

  if (exactMatch) {
    return exactMatch.id;
  }

  // If no exact match, try case-insensitive search
  const { data: caseInsensitiveMatch } = await query
    .ilike('name', productName)
    .maybeSingle();

  if (caseInsensitiveMatch) {
    return caseInsensitiveMatch.id;
  }

  // If policy type is provided, try to match with policy type consideration
  if (policyType) {
    const { data: policyTypeMatch } = await supabase
      .from('insurance_products')
      .select('id')
      .eq('provider_id', providerId)
      .eq('category', lineOfBusiness)
      .contains('supported_policy_types', [policyType])
      .ilike('name', `%${productName}%`)
      .maybeSingle();

    if (policyTypeMatch) {
      return policyTypeMatch.id;
    }
  }

  // If no product found, create a placeholder product with "Product name not found in system"
  const { data: newProduct, error } = await supabase
    .from('insurance_products')
    .insert({
      name: 'Product name not found in system',
      code: `AUTO_${Date.now()}`,
      provider_id: providerId,
      category: lineOfBusiness,
      coverage_type: 'Comprehensive',
      premium_type: 'Fixed',
      min_sum_insured: 100000,
      max_sum_insured: 10000000
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create placeholder product: ${error.message}`);
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
    .eq('name', lineOfBusinessName as any)
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

const createLineSpecificPolicy = async (policyId: string, lineOfBusiness: string, row: Record<string, any>) => {
  switch (lineOfBusiness?.toLowerCase()) {
    case 'motor':
      await createMotorPolicy(policyId, row);
      break;
    case 'life':
      await createLifePolicy(policyId, row);
      break;
    case 'health':
      await createHealthPolicy(policyId, row);
      break;
    case 'commercial':
      await createCommercialPolicy(policyId, row);
      break;
  }
};

const createMotorPolicy = async (policyId: string, row: Record<string, any>) => {
  const motorData = {
    policy_id: policyId,
    vehicle_type: row.vehicleType || null,
    registration_number: row.registrationNumber || null,
    manufacturer: row.manufacturer || null,
    model: row.model || null,
    variant: row.variant || null,
    fuel_type: row.fuelType || null,
    idv: row.IDV ? parseFloat(row.IDV) : null,
    own_damage_premium: row.ownDamagePremium ? parseFloat(row.ownDamagePremium) : null,
    third_party_premium: row.thirdPartyPremium ? parseFloat(row.thirdPartyPremium) : null,
    ncb_percent: row.NCBPercent ? parseInt(row.NCBPercent) : null
  };

  const { error } = await supabase
    .from('motor_policies')
    .insert(motorData);

  if (error) {
    throw new Error(`Failed to create motor policy details: ${error.message}`);
  }
};

const createLifePolicy = async (policyId: string, row: Record<string, any>) => {
  const lifeData = {
    policy_id: policyId,
    proposer_name: row.proposerName || null,
    life_assured_name: row.lifeAssuredName || null,
    relationship: row.relationship || null,
    plan_type: row.planType || null,
    policy_term: row.policyTerm ? parseInt(row.policyTerm) : null,
    premium_paying_term: row.premiumPayingTerm ? parseInt(row.premiumPayingTerm) : null,
    payment_frequency: row.paymentFrequency || null,
    nominee_name: row.nomineeName || null,
    nominee_relation: row.nomineeRelation || null
  };

  const { error } = await supabase
    .from('life_policies')
    .insert(lifeData);

  if (error) {
    throw new Error(`Failed to create life policy details: ${error.message}`);
  }
};

const createHealthPolicy = async (policyId: string, row: Record<string, any>) => {
  const healthData = {
    policy_id: policyId,
    proposer_name: row.proposerName || null,
    floater_or_individual: row.coverageType || null,
    sum_insured: row.sumInsured ? parseFloat(row.sumInsured) : null,
    deductible: row.deductible ? parseFloat(row.deductible) : null,
    policy_term: row.policyTerm ? parseInt(row.policyTerm) : null,
    payment_mode: row.paymentMode || null,
    room_rent_limit: row.roomRentLimit || null
  };

  const { error } = await supabase
    .from('health_policies')
    .insert(healthData);

  if (error) {
    throw new Error(`Failed to create health policy details: ${error.message}`);
  }
};

const createCommercialPolicy = async (policyId: string, row: Record<string, any>) => {
  const commercialData = {
    policy_id: policyId,
    policy_category: row.policyCategory || null,
    business_type: row.businessType || null,
    risk_address: row.riskAddress || null,
    number_of_employees: row.numberOfEmployees ? parseInt(row.numberOfEmployees) : null,
    proposer_details: row.companyName ? {
      companyName: row.companyName,
      PAN: row.PAN,
      GSTIN: row.GSTIN
    } : null
  };

  const { error } = await supabase
    .from('commercial_policies')
    .insert(commercialData);

  if (error) {
    throw new Error(`Failed to create commercial policy details: ${error.message}`);
  }
};