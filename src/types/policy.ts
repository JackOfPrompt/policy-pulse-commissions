export type UserRole = 'admin' | 'employee' | 'agent';

export interface PolicyField {
  field: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'select' | 'array';
  required?: boolean;
  options?: string[];
  arrayType?: string;
  schema?: PolicyField[];
}

export interface PolicySection {
  label: string;
  fields: PolicyField[];
}

export interface PolicySchema {
  [sectionKey: string]: PolicySection;
}

export interface PolicyData {
  [sectionKey: string]: {
    [fieldKey: string]: any;
  };
}

export interface PolicyRecord {
  id: string;
  uploaded_by: string;
  agent_id?: string;
  role: UserRole;
  data: PolicyData;
  status: 'draft' | 'reviewed' | 'saved';
  uploaded_at: string;
  file_name?: string;
  extraction_confidence?: number;
}

export interface Agent {
  id: string;
  name: string;
  email: string;
  code: string;
}

export interface UploadOption {
  type: 'direct' | 'agent';
  agent_id?: string;
}