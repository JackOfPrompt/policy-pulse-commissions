import { supabase } from "@/integrations/supabase/client";

export interface ProductCSVRow {
  productName: string;
  insurerName: string;
  lineOfBusiness: string;
  code?: string;
  uin?: string;
  isStandardProduct?: string;
  supportedPolicyTypes?: string;
  vehicleTypes?: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  isActive?: string;
  description?: string;
}

export const getProductTemplateColumns = (): string[] => [
  'productName',
  'insurerName',
  'lineOfBusiness',
  'code',
  'uin',
  'isStandardProduct',
  'supportedPolicyTypes',
  'vehicleTypes',
  'effectiveFrom',
  'effectiveTo',
  'isActive',
  'description'
];

export const getProductSampleData = (): Record<string, any>[] => [
  {
    productName: 'Comprehensive Motor Insurance',
    insurerName: 'HDFC ERGO General',
    lineOfBusiness: 'Motor',
    code: 'COMP_MOTOR_001',
    uin: 'HDFC123456789012',
    isStandardProduct: 'false',
    supportedPolicyTypes: 'New,Renewal,Portability',
    vehicleTypes: 'Private Car,Two-Wheeler',
    effectiveFrom: '2024-01-01',
    effectiveTo: '2024-12-31',
    isActive: 'true',
    description: 'Complete protection for your vehicle'
  },
  {
    productName: 'Term Life Plan',
    insurerName: 'HDFC Life Insurance', 
    lineOfBusiness: 'Life',
    code: 'TERM_LIFE_001',
    uin: 'HDFC987654321098',
    isStandardProduct: 'false',
    supportedPolicyTypes: 'New,Renewal,Top-Up',
    vehicleTypes: '',
    effectiveFrom: '2024-01-01',
    effectiveTo: '',
    isActive: 'true',
    description: 'Pure term life insurance coverage'
  }
];

export const validateProductRow = async (row: Record<string, any>): Promise<string[]> => {
  const errors: string[] = [];

  // Basic field validation
  if (!row.productName?.trim()) {
    errors.push('Product name is required');
  }
  
  if (!row.insurerName?.trim()) {
    errors.push('Insurer name is required');
  }
  
  if (!row.lineOfBusiness?.trim()) {
    errors.push('Line of business is required');
  }

  // Check if insurer exists in master table, if not we'll create it during processing
  if (row.insurerName?.trim()) {
    try {
      const { data: provider, error } = await supabase
        .from('insurance_providers')
        .select('provider_id, status')
        .ilike('insurer_name', row.insurerName)
        .maybeSingle();

      if (error) {
        errors.push(`Error validating insurer: ${error.message}`);
      }
      // Note: We no longer treat missing provider as an error - it will be auto-created
    } catch (error) {
      errors.push(`Database error while validating insurer: ${error}`);
    }
  }

  // Validate Line of Business exists in master table
  if (row.lineOfBusiness?.trim()) {
    try {
      const { data: lob, error } = await supabase
        .from('lines_of_business')
        .select('lob_id, is_active')
        .ilike('lob_name', row.lineOfBusiness)
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        errors.push(`Error validating line of business: ${error.message}`);
      } else if (!lob) {
        errors.push(`Line of business "${row.lineOfBusiness}" not found in master LOB list or is inactive`);
      }
    } catch (error) {
      errors.push(`Database error while validating LOB: ${error}`);
    }
  }

  // Note: Provider-LOB mapping validation is removed since providers can be auto-created
  // during bulk upload. LOB validation still applies.

  // Boolean field validation
  if (row.isStandardProduct && !['true', 'false'].includes(row.isStandardProduct.toLowerCase())) {
    errors.push('isStandardProduct must be true or false');
  }

  if (row.isActive && !['true', 'false'].includes(row.isActive.toLowerCase())) {
    errors.push('isActive must be true or false');
  }

  // Policy types validation
  const validPolicyTypes = ['New', 'Renewal', 'Portability', 'Top-Up', 'Rollover', 'Converted'];
  if (row.supportedPolicyTypes?.trim()) {
    const policyTypes = row.supportedPolicyTypes.split(',').map((t: string) => t.trim());
    const invalidTypes = policyTypes.filter((type: string) => !validPolicyTypes.includes(type));
    if (invalidTypes.length > 0) {
      errors.push(`Invalid policy types: ${invalidTypes.join(', ')}. Valid types are: ${validPolicyTypes.join(', ')}`);
    }
  }

  // Vehicle types validation (Motor LOB only)
  const validVehicleTypes = ['Two-Wheeler', 'Private Car', 'Commercial Vehicle', 'Miscellaneous'];
  if (row.vehicleTypes?.trim()) {
    if (row.lineOfBusiness !== 'Motor') {
      errors.push('Vehicle types can only be specified for Motor line of business');
    } else {
      const vehicleTypes = row.vehicleTypes.split(',').map((t: string) => t.trim());
      const invalidTypes = vehicleTypes.filter((type: string) => !validVehicleTypes.includes(type));
      if (invalidTypes.length > 0) {
        errors.push(`Invalid vehicle types: ${invalidTypes.join(', ')}. Valid types are: ${validVehicleTypes.join(', ')}`);
      }
    }
  }

  // Date format validation
  if (row.effectiveFrom && !isValidDate(row.effectiveFrom)) {
    errors.push('Invalid effective from date format (use YYYY-MM-DD)');
  }

  if (row.effectiveTo && !isValidDate(row.effectiveTo)) {
    errors.push('Invalid effective to date format (use YYYY-MM-DD)');
  }

  // Date range validation
  if (row.effectiveFrom && row.effectiveTo && 
      new Date(row.effectiveFrom) > new Date(row.effectiveTo)) {
    errors.push('Effective from date must be before effective to date');
  }

  return errors;
};

const isValidDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  const isValidFormat = /^\d{4}-\d{2}-\d{2}$/.test(dateString);
  return date instanceof Date && !isNaN(date.getTime()) && isValidFormat;
};

export const processProductRow = async (row: Record<string, any>): Promise<any> => {
  let providerId: string;
  let lineOfBusinessId: string;

  // Find or create the provider by name (case-insensitive)
  let { data: provider, error: providerError } = await supabase
    .from('insurance_providers')
    .select('provider_id')
    .ilike('insurer_name', row.insurerName)
    .maybeSingle();

  if (providerError) {
    throw new Error(`Error finding provider: ${providerError.message}`);
  }

  // If provider doesn't exist, create it
  if (!provider) {
    const { data: newProvider, error: createError } = await supabase
      .from('insurance_providers')
      .insert({
        insurer_name: row.insurerName.trim(),
        status: 'Active'
      })
      .select('provider_id')
      .single();

    if (createError) {
      throw new Error(`Failed to create new provider "${row.insurerName}": ${createError.message}`);
    }
    
    provider = newProvider;
    // Provider auto-created; consider completing provider profile later.
  }

  providerId = provider.provider_id;

  // Find the line of business ID - must exist
  const { data: lob, error: lobError } = await supabase
    .from('lines_of_business')
    .select('lob_id')
    .ilike('lob_name', row.lineOfBusiness)
    .eq('is_active', true)
    .maybeSingle();

  if (lobError) {
    throw new Error(`Error finding line of business: ${lobError.message}`);
  }

  if (!lob) {
    throw new Error(`Line of business "${row.lineOfBusiness}" not found in master LOB list or is inactive.`);
  }

  lineOfBusinessId = lob.lob_id;

  // Skipping provider-LOB mapping as mapping table may not exist in current schema

  // Parse supported policy types
  const supportedPolicyTypes = row.supportedPolicyTypes?.trim() 
    ? row.supportedPolicyTypes.split(',').map((t: string) => t.trim())
    : ['New'];

  // Generate unique product code if not provided
  const productCode = row.code?.trim() || `${row.lineOfBusiness.toUpperCase()}_${Date.now()}`;

  const productData = {
    product_name: row.productName,
    product_code: productCode,
    provider_id: providerId,
    lob_id: lineOfBusinessId,
    product_type: row.lineOfBusiness,
    uin_code: row.uin?.trim() || null,
    is_standard_product: row.isStandardProduct?.toLowerCase() === 'true',
    supported_policy_types: supportedPolicyTypes,
    effective_from: row.effectiveFrom || null,
    effective_to: row.effectiveTo || null,
    vehicle_types: row.vehicleTypes?.trim() 
      ? row.vehicleTypes.split(',').map((t: string) => t.trim())
      : null,
    status: row.isActive?.toLowerCase() === 'false' ? 'Inactive' : 'Active',
    description: row.description || null
  };

  const { data: product, error } = await supabase
    .from('insurance_products')
    .insert(productData)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create product: ${error.message}`);
  }

  // Vehicle types are stored in the product's vehicle_types array in this schema

  return product;
};