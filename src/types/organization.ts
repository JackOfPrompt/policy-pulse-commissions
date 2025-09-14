export interface Organization {
  id: string;
  name: string;
  code: string;
  description?: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  industry_type?: string;
  business_type?: string;
  registration_number?: string;
  tax_id?: string;
  employee_count?: string;
  annual_revenue?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  logo_url?: string;
  latitude?: number;
  longitude?: number;
  status: string;
  created_at: string;
  updated_at: string;
  
  // Additional computed fields
  admin_count?: number;
  user_count?: number;
  policy_count?: number;
  monthly_revenue?: number;
  storage_used?: string;
  api_calls_month?: number;
}

export interface TenantModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organization?: Organization | null;
  onSuccess?: () => void;
}