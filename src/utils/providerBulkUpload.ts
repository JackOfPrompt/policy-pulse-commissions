import { supabase } from "@/integrations/supabase/client";

export interface ProviderCSVRow {
  providerName: string;
  IRDAIRegistrationNumber: string;
  type: string;
  contactPerson?: string;
  contactEmail?: string;
  headOfficeLocation?: string;
  active?: string;
}

export const getProviderTemplateColumns = (): string[] => [
  'providerName',
  'IRDAIRegistrationNumber', 
  'type',
  'contactPerson',
  'contactEmail',
  'headOfficeLocation',
  'active'
];

export const getProviderSampleData = (): Record<string, any>[] => [
  {
    providerName: 'HDFC Life Insurance',
    IRDAIRegistrationNumber: '101',
    type: 'Life',
    contactPerson: 'John Manager',
    contactEmail: 'contact@hdfclife.com',
    headOfficeLocation: 'Mumbai',
    active: 'true'
  },
  {
    providerName: 'Bajaj Allianz General',
    IRDAIRegistrationNumber: '113', 
    type: 'General',
    contactPerson: 'Jane Director',
    contactEmail: 'support@bajajallianz.com',
    headOfficeLocation: 'Pune',
    active: 'true'
  }
];

export const validateProviderRow = (row: Record<string, any>): string[] => {
  const errors: string[] = [];

  if (!row.providerName?.trim()) {
    errors.push('Provider name is required');
  }
  
  if (!row.IRDAIRegistrationNumber?.trim()) {
    errors.push('IRDAI registration number is required');
  }
  
  if (!row.type?.trim()) {
    errors.push('Provider type is required');
  }

  const validTypes = ['Life', 'Health', 'General'];
  if (row.type && !validTypes.includes(row.type)) {
    errors.push('Type must be one of: Life, Health, General');
  }

  if (row.contactEmail && row.contactEmail.trim() && !isValidEmail(row.contactEmail)) {
    errors.push('Invalid email format');
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

export const processProviderRow = async (row: Record<string, any>): Promise<any> => {
  const providerData = {
    provider_name: row.providerName,
    irdai_code: row.IRDAIRegistrationNumber,
    provider_type: row.type,
    contact_person: row.contactPerson || null,
    support_email: row.contactEmail || null,
    status: row.active?.toLowerCase() === 'false' ? 'Inactive' : 'Active'
  };

  const { data: provider, error } = await supabase
    .from('insurance_providers')
    .insert(providerData)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create provider: ${error.message}`);
  }

  return provider;
};