import { supabase } from "@/integrations/supabase/client";

export interface ProductCSVRow {
  productName: string;
  insurerName: string;
  lineOfBusiness: string;
  isActive?: string;
  description?: string;
}

export const getProductTemplateColumns = (): string[] => [
  'productName',
  'insurerName',
  'lineOfBusiness', 
  'isActive',
  'description'
];

export const getProductSampleData = (): Record<string, any>[] => [
  {
    productName: 'Comprehensive Motor Insurance',
    insurerName: 'HDFC ERGO General',
    lineOfBusiness: 'Motor',
    isActive: 'true',
    description: 'Complete protection for your vehicle'
  },
  {
    productName: 'Term Life Plan',
    insurerName: 'HDFC Life Insurance', 
    lineOfBusiness: 'Life',
    isActive: 'true',
    description: 'Pure term life insurance coverage'
  }
];

export const validateProductRow = (row: Record<string, any>): string[] => {
  const errors: string[] = [];

  if (!row.productName?.trim()) {
    errors.push('Product name is required');
  }
  
  if (!row.insurerName?.trim()) {
    errors.push('Insurer name is required');
  }
  
  if (!row.lineOfBusiness?.trim()) {
    errors.push('Line of business is required');
  }

  const validLOBs = ['Motor', 'Life', 'Health', 'Commercial'];
  if (row.lineOfBusiness && !validLOBs.includes(row.lineOfBusiness)) {
    errors.push('Line of business must be one of: Motor, Life, Health, Commercial');
  }

  if (row.isActive && !['true', 'false'].includes(row.isActive.toLowerCase())) {
    errors.push('isActive must be true or false');
  }

  return errors;
};

export const processProductRow = async (row: Record<string, any>): Promise<any> => {
  let providerId: string;

  // Find the provider by name (case-insensitive)
  const { data: provider, error: providerError } = await supabase
    .from('insurance_providers')
    .select('id')
    .ilike('provider_name', row.insurerName)
    .maybeSingle();

  if (providerError) {
    throw new Error(`Error finding provider: ${providerError.message}`);
  }

  if (!provider) {
    // Auto-create the provider if it doesn't exist
    const providerData = {
      provider_name: row.insurerName,
      irdai_code: `AUTO_${Date.now()}`,
      provider_type: row.lineOfBusiness === 'Life' ? 'Life' : 'General',
      status: 'Active'
    };

    const { data: newProvider, error: createError } = await supabase
      .from('insurance_providers')
      .insert(providerData)
      .select('id')
      .single();

    if (createError) {
      throw new Error(`Failed to create provider "${row.insurerName}": ${createError.message}`);
    }

    providerId = newProvider.id;
  } else {
    providerId = provider.id;
  }

  // Generate unique product code
  const timestamp = Date.now();
  const productCode = `${row.lineOfBusiness.toUpperCase()}_${timestamp}`;

  const productData = {
    name: row.productName,
    code: productCode,
    provider_id: providerId,
    category: row.lineOfBusiness,
    coverage_type: 'Comprehensive',
    premium_type: 'Fixed',
    min_sum_insured: 100000,
    max_sum_insured: 10000000,
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

  return product;
};