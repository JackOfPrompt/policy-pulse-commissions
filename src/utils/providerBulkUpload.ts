import { supabase } from "@/integrations/supabase/client";

export interface ProviderCSVRow {
  providerName: string;
  IRDAIRegistrationNumber: string;
  contactPerson?: string;
  contactEmail?: string;
  headOfficeLocation?: string;
  active?: string;
  LOB_Type?: string;
}

export const getProviderTemplateColumns = (): string[] => [
  'providerName',
  'IRDAIRegistrationNumber',
  'contactPerson',
  'contactEmail',
  'supportEmail',
  'headOfficeAddress',
  'phoneNumber',
  'website',
  'contractStartDate',
  'contractEndDate',
  'status',
  'LOB_Type'
];

export const getProviderSampleData = (): Record<string, any>[] => [
  {
    providerName: 'HDFC Life Insurance',
    IRDAIRegistrationNumber: '101',
    contactPerson: 'John Manager',
    contactEmail: 'contact@hdfclife.com',
    supportEmail: 'support@hdfclife.com',
    headOfficeAddress: 'Mumbai',
    phoneNumber: '+91-9876543210',
    website: 'https://www.hdfclife.com',
    contractStartDate: '2024-01-01',
    contractEndDate: '2024-12-31',
    status: 'Active',
    LOB_Type: 'Health, Motor'
  },
  {
    providerName: 'Bajaj Allianz General',
    IRDAIRegistrationNumber: '113',
    contactPerson: 'Jane Director',
    contactEmail: 'contact@bajajallianz.com',
    supportEmail: 'care@bajajallianz.com',
    headOfficeAddress: 'Pune',
    phoneNumber: '+91-9876543211',
    website: 'https://www.bajajallianz.com',
    contractStartDate: '2024-01-01',
    contractEndDate: '2024-12-31',
    status: 'Active',
    LOB_Type: 'Motor, Travel'
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

  if (row.contactEmail && row.contactEmail.trim() && !isValidEmail(row.contactEmail)) {
    errors.push('Invalid contact email format');
  }

  if (row.supportEmail && row.supportEmail.trim() && !isValidEmail(row.supportEmail)) {
    errors.push('Invalid support email format');
  }

  if (row.status && !['Active', 'Inactive'].includes(row.status)) {
    errors.push('Status must be Active or Inactive');
  }

  if (!row.status && row.active && !['true', 'false'].includes(String(row.active).toLowerCase())) {
    errors.push('Active must be true or false');
  }

  if (row.contractStartDate && !isValidDate(row.contractStartDate)) {
    errors.push('Invalid contract start date format (use YYYY-MM-DD)');
  }

  if (row.contractEndDate && !isValidDate(row.contractEndDate)) {
    errors.push('Invalid contract end date format (use YYYY-MM-DD)');
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

export const processProviderRow = async (row: Record<string, any>): Promise<any> => {
  const statusNormalized = row.status?.trim()
    ? (row.status === 'Inactive' ? 'Inactive' : 'Active')
    : (String(row.active).toLowerCase() === 'false' ? 'Inactive' : 'Active');

  const lobTypes = row.LOB_Type
    ? row.LOB_Type.toString()
        .split(/[;,]/)
        .map((s: string) => s.trim())
        .filter(Boolean)
        .map((s: string) => s.toUpperCase())
    : null;

  const providerData = {
    insurer_name: row.providerName?.trim(),
    irdai_registration_number: row.IRDAIRegistrationNumber?.trim(),
    contact_person: row.contactPerson?.trim() || null,
    contact_email: row.contactEmail?.trim() || null,
    support_email: row.supportEmail?.trim() || null,
    head_office_location: row.headOfficeAddress?.trim() || row.headOfficeLocation?.trim() || null,
    phone_number: row.phoneNumber?.trim() || null,
    website: row.website?.trim() || null,
    contract_start_date: row.contractStartDate?.trim() || null,
    contract_end_date: row.contractEndDate?.trim() || null,
    status: statusNormalized,
    lob_types: lobTypes
  } as any;

  // Case-insensitive dedup: find existing by name/code, merge missing fields, keep oldest
  const nameUpper = row.providerName?.trim()?.toUpperCase();
  const codeUpper = row.IRDAIRegistrationNumber?.trim()?.toUpperCase();
  const filters: string[] = [];
  if (nameUpper) filters.push(`insurer_name.eq.${nameUpper}`);
  if (codeUpper) filters.push(`irdai_registration_number.eq.${codeUpper}`);

  if (filters.length > 0) {
    const { data: matches } = await supabase
      .from('insurance_providers')
      .select('provider_id, insurer_name, irdai_registration_number, contact_person, contact_email, support_email, head_office_location, phone_number, website, contract_start_date, contract_end_date, status, lob_types, created_at')
      .or(filters.join(','));

    if (matches && matches.length > 0) {
      const sorted = matches.slice().sort((a: any, b: any) => (a.created_at || '') < (b.created_at || '') ? -1 : 1);
      const primary = sorted[0];
      const duplicates = sorted.slice(1);

      // Build update from incoming data, and fill missing from duplicates
      const updateData: any = {};
      const assignIf = (k: string, v: any) => { if (v != null && v !== '') updateData[k] = v; };
      assignIf('irdai_registration_number', providerData.irdai_registration_number);
      assignIf('contact_person', providerData.contact_person);
      assignIf('contact_email', providerData.contact_email);
      assignIf('support_email', providerData.support_email);
      assignIf('head_office_location', providerData.head_office_location);
      assignIf('phone_number', providerData.phone_number);
      assignIf('website', providerData.website);
      assignIf('contract_start_date', providerData.contract_start_date);
      assignIf('contract_end_date', providerData.contract_end_date);
      assignIf('status', providerData.status);
      assignIf('lob_types', providerData.lob_types);

      const fields = ['irdai_registration_number','contact_person','contact_email','support_email','head_office_location','phone_number','website','contract_start_date','contract_end_date','status','lob_types'] as const;
      for (const f of fields) {
        const hasCsv = Object.prototype.hasOwnProperty.call(updateData, f);
        const primaryVal: any = (primary as any)[f];
        const isEmpty = primaryVal == null || primaryVal === '' || (Array.isArray(primaryVal) && primaryVal.length === 0);
        if (!hasCsv && isEmpty) {
          const donor = duplicates.find((d: any) => {
            const v = d[f];
            return v != null && v !== '' && (!Array.isArray(v) || v.length > 0);
          });
          if (donor) (updateData as any)[f] = donor[f];
        }
      }

      // Update primary
      let updatedPrimary: any = primary;
      if (Object.keys(updateData).length > 0) {
        const { data: upd, error: updErr } = await supabase
          .from('insurance_providers')
          .update(updateData)
          .eq('provider_id', primary.provider_id)
          .select()
          .single();
        if (updErr) throw new Error(`Failed to update provider: ${updErr.message}`);
        updatedPrimary = upd;
      }

      // Remove duplicates (delete or inactivate)
      if (duplicates.length > 0) {
        const dupIds = duplicates.map((d: any) => d.provider_id);
        try {
          const { error: delErr } = await supabase
            .from('insurance_providers')
            .delete()
            .in('provider_id', dupIds);
          if (delErr) throw delErr;
        } catch (e) {
          await supabase
            .from('insurance_providers')
            .update({ status: 'Inactive' })
            .in('provider_id', dupIds);
        }
      }

      return updatedPrimary;
    }
  }

  // No existing, insert new
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