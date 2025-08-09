import { supabase } from "@/integrations/supabase/client";

export interface ProviderUpdateCSVRow {
  providerName: string; // Required field to identify the provider
  IRDAIRegistrationNumber?: string;
  contactPerson?: string;
  contactEmail?: string;
  headOfficeLocation?: string;
  status?: string;
  website?: string;
  supportEmail?: string;
  phoneNumber?: string;
  contractStartDate?: string;
  contractEndDate?: string;
  LOB_Type?: string;
}

export const getProviderUpdateTemplateColumns = (): string[] => [
  'providerName', // Required for identification
  'IRDAIRegistrationNumber',
  'contactPerson',
  'contactEmail',
  'headOfficeLocation',
  'status',
  'website',
  'supportEmail',
  'phoneNumber',
  'contractStartDate',
  'contractEndDate',
  'LOB_Type'
];

export const getProviderUpdateSampleData = (): Record<string, any>[] => [
  {
    providerName: 'HDFC Life Insurance',
    IRDAIRegistrationNumber: '101',
    contactPerson: 'Updated Manager Name',
    contactEmail: 'updated@hdfclife.com',
    headOfficeLocation: 'Mumbai',
    status: 'Active',
    website: 'https://www.hdfclife.com',
    supportEmail: 'support@hdfclife.com',
    phoneNumber: '+91-9876543210',
    contractStartDate: '2024-01-01',
    contractEndDate: '2024-12-31',
    LOB_Type: 'Health, Motor'
  },
  {
    providerName: 'Bajaj Allianz General',
    IRDAIRegistrationNumber: '113',
    contactPerson: 'Updated Director Name',
    contactEmail: 'updated@bajajallianz.com',
    headOfficeLocation: 'Pune',
    status: 'Active',
    website: 'https://www.bajajallianz.com',
    supportEmail: 'care@bajajallianz.com',
    phoneNumber: '+91-9876543211',
    contractStartDate: '2024-01-01',
    contractEndDate: '2024-12-31',
    LOB_Type: 'Motor, Travel'
  }
];

// Hardcoded provider list for bulk update template (deduped case-insensitively)
const HARDCODED_PROVIDER_LIST: Array<Pick<ProviderUpdateCSVRow, 'providerName' | 'IRDAIRegistrationNumber'>> = [
  { providerName: 'HDFC Life Insurance', IRDAIRegistrationNumber: '101' },
  { providerName: 'HDFC ERGO General Insurance' },
  { providerName: 'Bajaj Allianz General', IRDAIRegistrationNumber: '113' },
  { providerName: 'ICICI Lombard General Insurance' },
  { providerName: 'SBI General Insurance' },
  { providerName: 'Tata AIG General Insurance' },
  { providerName: 'The New India Assurance Co. Ltd.' },
  { providerName: 'United India Insurance Co. Ltd.' },
  { providerName: 'Oriental Insurance Company' },
  { providerName: 'Reliance General Insurance' },
  { providerName: 'IFFCO Tokio General Insurance' },
  { providerName: 'Future Generali India Insurance' },
  { providerName: 'Kotak Mahindra General Insurance' },
  { providerName: 'Aditya Birla Health Insurance' },
  { providerName: 'Star Health and Allied Insurance' },
  { providerName: 'Niva Bupa Health Insurance' },
  { providerName: 'Care Health Insurance' },
  { providerName: 'SBI Life Insurance' },
  { providerName: 'Max Life Insurance' },
  { providerName: 'LIC of India' }
];

const normalizeName = (name: string) => name.trim().replace(/\s+/g, ' ').toUpperCase();

export const getHardcodedProviderUpdateRows = (): Record<string, any>[] => {
  const deduped = new Map<string, Record<string, any>>();
  for (const p of HARDCODED_PROVIDER_LIST) {
    if (!p.providerName) continue;
    const key = normalizeName(p.providerName);
    if (!deduped.has(key)) {
      deduped.set(key, {
        providerName: p.providerName,
        IRDAIRegistrationNumber: p.IRDAIRegistrationNumber ?? '',
        contactPerson: '',
        contactEmail: '',
        headOfficeLocation: '',
        status: 'Active',
        website: '',
        supportEmail: '',
        phoneNumber: '',
        contractStartDate: '',
        contractEndDate: '',
        LOB_Type: ''
      });
    } else {
      const existing = deduped.get(key)!;
      if (!existing.IRDAIRegistrationNumber && p.IRDAIRegistrationNumber) {
        existing.IRDAIRegistrationNumber = p.IRDAIRegistrationNumber;
      }
    }
  }
  return Array.from(deduped.values());
};

// Function to get all existing provider names from the system
export const getExistingProviderNames = async (): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('insurance_providers')
      .select('insurer_name')
      .order('insurer_name');

    if (error) throw error;
    return data?.map(provider => provider.insurer_name) || [];
  } catch (error) {
    console.error('Error fetching provider names:', error);
    return [];
  }
};

// Function to download provider update template with existing provider names reference
export const downloadProviderUpdateTemplate = async (): Promise<void> => {
  try {
    // Get existing provider names
    const existingProviders = await getExistingProviderNames();
    
    // Create the main template content
    const templateColumns = getProviderUpdateTemplateColumns();
    const sampleData = getProviderUpdateSampleData();
    
    // Generate CSV content for main template
    const mainTemplateContent = [
      templateColumns.join(','),
      ...sampleData.map(row => 
        templateColumns.map(col => `"${(row[col] || '').toString().replace(/"/g, '""')}"`).join(',')
      )
    ].join('\n');

    // Generate reference sheet content with existing provider names
    const referenceContent = [
      'Existing Provider Names (Reference Only)',
      ...existingProviders.map(name => `"${name.replace(/"/g, '""')}"`)
    ].join('\n');

    // Combine both sheets in a single CSV with clear separation
    const combinedContent = [
      '# Provider Update Template',
      '# Use the provider names from the reference list below',
      '',
      '# Template Sheet:',
      mainTemplateContent,
      '',
      '# Reference - Existing Provider Names:',
      referenceContent
    ].join('\n');

    // Create and download the file
    const blob = new Blob([combinedContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'provider_update_template_with_reference.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading provider update template:', error);
    throw error;
  }
};

export const validateProviderUpdateRow = async (row: Record<string, any>): Promise<string[]> => {
  const errors: string[] = [];

  // Provider name is required for identification
  if (!row.providerName?.trim()) {
    errors.push('Provider name is required for identification');
  }

  // Check if provider exists
  if (row.providerName?.trim()) {
    try {
      const nameTrim = row.providerName.trim().replace(/\s+/g, ' ');
      const codeTrim = row.IRDAIRegistrationNumber?.trim();
      const filters = [`insurer_name.ilike.${nameTrim}`];
      if (codeTrim) filters.push(`irdai_registration_number.eq.${codeTrim}`);

      const { data: matches, error } = await supabase
        .from('insurance_providers')
        .select('provider_id, insurer_name')
        .or(filters.join(','));

      if (error) {
        errors.push(`Error finding provider: ${error.message}`);
      } else if (!matches || matches.length === 0) {
        errors.push(`Provider with name "${row.providerName}" not found`);
      }
    } catch (error) {
      errors.push(`Database error while validating provider: ${error}`);
    }
  }

  // Status validation
  if (row.status && !['Active', 'Inactive'].includes(row.status)) {
    errors.push('Status must be Active or Inactive');
  }

  // Email validation
  if (row.contactEmail && row.contactEmail.trim() && !isValidEmail(row.contactEmail)) {
    errors.push('Invalid contact email format');
  }

  if (row.supportEmail && row.supportEmail.trim() && !isValidEmail(row.supportEmail)) {
    errors.push('Invalid support email format');
  }

  // Date format validation
  if (row.contractStartDate && !isValidDate(row.contractStartDate)) {
    errors.push('Invalid contract start date format (use YYYY-MM-DD)');
  }

  if (row.contractEndDate && !isValidDate(row.contractEndDate)) {
    errors.push('Invalid contract end date format (use YYYY-MM-DD)');
  }

  // Date range validation
  if (row.contractStartDate && row.contractEndDate && 
      new Date(row.contractStartDate) > new Date(row.contractEndDate)) {
    errors.push('Contract start date must be before contract end date');
  }

  return errors;
};

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const isValidDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  const isValidFormat = /^\d{4}-\d{2}-\d{2}$/.test(dateString);
  return date instanceof Date && !isNaN(date.getTime()) && isValidFormat;
};

export const processProviderUpdateRow = async (row: Record<string, any>): Promise<any> => {
  const nameTrim = row.providerName?.trim()?.replace(/\s+/g, ' ');
  const codeTrim = row.IRDAIRegistrationNumber?.trim();
  const filters: string[] = [];
  if (nameTrim) filters.push(`insurer_name.ilike.${nameTrim}`);
  if (codeTrim) filters.push(`irdai_registration_number.eq.${codeTrim}`);

  const { data: matches, error: findError } = await supabase
    .from('insurance_providers')
    .select('provider_id, insurer_name, irdai_registration_number, contact_person, contact_email, support_email, head_office_location, phone_number, website, contract_start_date, contract_end_date, status, lob_types, created_at')
    .or(filters.join(','));

  if (findError) {
    throw new Error(`Error finding provider: ${findError.message}`);
  }
  if (!matches || matches.length === 0) {
    throw new Error(`Provider with name "${row.providerName}" not found`);
  }

  // Choose primary record (oldest)
  const sorted = matches.slice().sort((a: any, b: any) => (a.created_at || '') < (b.created_at || '') ? -1 : 1);
  const primary = sorted[0];
  const duplicates = sorted.slice(1);

  // Prepare update data from CSV
  const updateData: any = {};
  if (row.IRDAIRegistrationNumber?.trim()) updateData.irdai_registration_number = row.IRDAIRegistrationNumber.trim();
  if (row.contactPerson?.trim()) updateData.contact_person = row.contactPerson.trim();
  if (row.contactEmail?.trim()) updateData.contact_email = row.contactEmail.trim();
  if (row.headOfficeLocation?.trim()) updateData.head_office_location = row.headOfficeLocation.trim();
  if (row.status?.trim()) updateData.status = row.status.trim();
  if (row.website?.trim()) updateData.website = row.website.trim();
  if (row.supportEmail?.trim()) updateData.support_email = row.supportEmail.trim();
  if (row.LOB_Type?.trim()) updateData.lob_types = row.LOB_Type.split(/[;,]/).map((s: string) => s.trim()).filter(Boolean).map((s: string) => s.toUpperCase());
  if (row.phoneNumber?.trim()) updateData.phone_number = row.phoneNumber.trim();
  if (row.contractStartDate?.trim()) updateData.contract_start_date = row.contractStartDate.trim();
  if (row.contractEndDate?.trim()) updateData.contract_end_date = row.contractEndDate.trim();

  // Merge missing fields from duplicates if primary lacks them and CSV didn't provide
  const mergeFields = ['irdai_registration_number','contact_person','contact_email','support_email','head_office_location','phone_number','website','contract_start_date','contract_end_date','status','lob_types'] as const;
  for (const field of mergeFields) {
    const hasCsv = Object.prototype.hasOwnProperty.call(updateData, field);
    const primaryVal: any = (primary as any)[field];
    const isEmpty = primaryVal == null || primaryVal === '' || (Array.isArray(primaryVal) && primaryVal.length === 0);
    if (!hasCsv && isEmpty) {
      const donor = duplicates.find((d: any) => {
        const v = d[field];
        return v != null && v !== '' && (!Array.isArray(v) || v.length > 0);
      });
      if (donor) (updateData as any)[field] = donor[field];
    }
  }

  // Update primary
  let updatedPrimary: any = primary;
  if (Object.keys(updateData).length > 0) {
    const { data, error: updateError } = await supabase
      .from('insurance_providers')
      .update(updateData)
      .eq('provider_id', primary.provider_id)
      .select()
      .single();
    if (updateError) throw new Error(`Failed to update provider: ${updateError.message}`);
    updatedPrimary = data;
  }

  // Remove duplicates (delete; fallback to inactivate)
  if (duplicates.length > 0) {
    const dupIds = duplicates.map((d: any) => d.provider_id);
    try {
      const { error: delError } = await supabase
        .from('insurance_providers')
        .delete()
        .in('provider_id', dupIds);
      if (delError) throw delError;
    } catch (e) {
      await supabase
        .from('insurance_providers')
        .update({ status: 'Inactive' })
        .in('provider_id', dupIds);
    }
  }

  return updatedPrimary;
};