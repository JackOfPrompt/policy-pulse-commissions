import { supabase } from "@/integrations/supabase/client";

export interface ProductUpdateCSVRow {
  productCode: string; // Required field to identify the product
  description?: string;
  status?: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  minSumInsured?: string;
  maxSumInsured?: string;
  features?: string;
  eligibilityCriteria?: string;
  isStandardProduct?: string;
}

export const getProductUpdateTemplateColumns = (): string[] => [
  'productCode', // Required for identification
  'description',
  'status',
  'effectiveFrom',
  'effectiveTo',
  'minSumInsured',
  'maxSumInsured',
  'features',
  'eligibilityCriteria',
  'isStandardProduct'
];

export const getProductUpdateSampleData = (): Record<string, any>[] => [
  {
    productCode: 'COMP_MOTOR_001',
    description: 'Updated comprehensive motor insurance description',
    status: 'Active',
    effectiveFrom: '2024-01-01',
    effectiveTo: '2024-12-31',
    minSumInsured: '100000',
    maxSumInsured: '10000000',
    features: 'Zero Depreciation,Engine Protection,Roadside Assistance',
    eligibilityCriteria: 'Vehicle age should be less than 10 years',
    isStandardProduct: 'false'
  },
  {
    productCode: 'TERM_LIFE_001',
    description: 'Updated term life insurance description',
    status: 'Active',
    effectiveFrom: '2024-01-01',
    effectiveTo: '',
    minSumInsured: '500000',
    maxSumInsured: '50000000',
    features: 'Income Tax Benefits,Flexible Payout Options',
    eligibilityCriteria: 'Age between 18-65 years',
    isStandardProduct: 'false'
  }
];

export const validateProductUpdateRow = async (row: Record<string, any>): Promise<string[]> => {
  const errors: string[] = [];

  // Product code is required for identification
  if (!row.productCode?.trim()) {
    errors.push('Product code is required for identification');
  }

  // Check if product exists
  if (row.productCode?.trim()) {
    try {
      const { data: product, error } = await supabase
        .from('insurance_products')
        .select('product_id, product_name')
        .eq('product_code', row.productCode)
        .maybeSingle();

      if (error) {
        errors.push(`Error finding product: ${error.message}`);
      } else if (!product) {
        errors.push(`Product with code "${row.productCode}" not found`);
      }
    } catch (error) {
      errors.push(`Database error while validating product: ${error}`);
    }
  }

  // Status validation
  if (row.status && !['Active', 'Inactive'].includes(row.status)) {
    errors.push('Status must be Active or Inactive');
  }

  // Boolean field validation
  if (row.isStandardProduct && !['true', 'false'].includes(row.isStandardProduct.toLowerCase())) {
    errors.push('isStandardProduct must be true or false');
  }

  // Numeric field validation
  if (row.minSumInsured && (isNaN(Number(row.minSumInsured)) || Number(row.minSumInsured) < 0)) {
    errors.push('minSumInsured must be a valid positive number');
  }

  if (row.maxSumInsured && (isNaN(Number(row.maxSumInsured)) || Number(row.maxSumInsured) < 0)) {
    errors.push('maxSumInsured must be a valid positive number');
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

  // Sum insured range validation
  if (row.minSumInsured && row.maxSumInsured && 
      Number(row.minSumInsured) > Number(row.maxSumInsured)) {
    errors.push('Minimum sum insured must be less than maximum sum insured');
  }

  return errors;
};

const isValidDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  const isValidFormat = /^\d{4}-\d{2}-\d{2}$/.test(dateString);
  return date instanceof Date && !isNaN(date.getTime()) && isValidFormat;
};

export const processProductUpdateRow = async (row: Record<string, any>): Promise<any> => {
  // Find the product by code
  const { data: product, error: findError } = await supabase
    .from('insurance_products')
    .select('product_id')
    .eq('product_code', row.productCode)
    .single();

  if (findError) {
    throw new Error(`Error finding product: ${findError.message}`);
  }

  if (!product) {
    throw new Error(`Product with code "${row.productCode}" not found`);
  }

  // Prepare update data (only include fields that are provided)
  const updateData: any = {};

  if (row.description?.trim()) updateData.description = row.description.trim();
  if (row.status?.trim()) updateData.status = row.status.trim();
  if (row.effectiveFrom?.trim()) updateData.effective_from = row.effectiveFrom.trim();
  if (row.effectiveTo?.trim()) updateData.effective_to = row.effectiveTo.trim();
  if (row.isStandardProduct?.trim()) updateData.is_standard_product = row.isStandardProduct.toLowerCase() === 'true';

  // Update the product
  const { data: updatedProduct, error: updateError } = await supabase
    .from('insurance_products')
    .update(updateData)
    .eq('product_id', product.product_id)
    .select()
    .single();

  if (updateError) {
    throw new Error(`Failed to update product: ${updateError.message}`);
  }

  return updatedProduct;
};