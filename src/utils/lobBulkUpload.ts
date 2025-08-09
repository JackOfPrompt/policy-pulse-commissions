import { supabase } from "@/integrations/supabase/client";

export interface LOBCSVRow {
  lob_name: string;
  lob_code?: string;
  description?: string;
  active?: string;
}

export const getLOBTemplateColumns = (): string[] => [
  'lob_name',
  'lob_code',
  'description',
  'active'
];

export const getLOBSampleData = (): Record<string, any>[] => [
  {
    lob_name: 'Health',
    lob_code: 'HEALTH',
    description: 'Health insurance products',
    active: 'true'
  },
  {
    lob_name: 'Motor',
    lob_code: 'MOTOR',
    description: 'Motor vehicle insurance',
    active: 'true'
  }
];

const generateCode = (name: string): string =>
  name?.toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_|_$/g, '') || '';

export const validateLOBRow = (row: Record<string, any>): string[] => {
  const errors: string[] = [];

  if (!row.lob_name?.toString().trim()) {
    errors.push('LOB name is required');
  }

  if (row.active && !['true', 'false'].includes(String(row.active).toLowerCase())) {
    errors.push('Active must be true or false');
  }

  return errors;
};

export const processLOBRow = async (row: Record<string, any>): Promise<any> => {
  const lob_name: string = String(row.lob_name || '').trim();
  const lob_code_input: string | undefined = row.lob_code?.toString().trim();

  const lobData = {
    lob_name,
    lob_code: lob_code_input || generateCode(lob_name),
    description: row.description?.toString().trim() || null,
    is_active: String(row.active || 'true').toLowerCase() === 'false' ? false : true
  };

  const { data: lob, error } = await supabase
    .from('lines_of_business')
    .insert(lobData)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create LOB: ${error.message}`);
  }

  return lob;
};