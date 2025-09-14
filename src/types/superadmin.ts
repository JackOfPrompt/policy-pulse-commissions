// TypeScript types for Super Admin entities

export interface Tenant {
  id: string;
  name: string;
  domain: string;
  contact_person: string;
  contact_email: string;
  address: string;
  plan_id: string;
  plan_name?: string;
  status: 'active' | 'suspended' | 'trial';
  renewal_date: string;
  created_at: string;
  metadata: {
    branches: number;
    employees: number;
    agents: number;
  };
  soft_deleted: boolean;
}

export interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  billing: 'monthly' | 'yearly';
  currency: string;
  billing_cycle: 'monthly' | 'yearly';
  features: string[];
  limits: {
    policies: number | 'unlimited';
    users: number | 'unlimited';
    storage: string;
    apiCalls: number | 'unlimited';
  };
  max_users: number;
  max_policies: number;
  status: 'active' | 'inactive';
  popular: boolean;
  created_at: string;
  soft_deleted?: boolean;
}

export interface Subscription {
  id: string;
  organizationId: string;
  organizationName: string;
  planId: string;
  planName: string;
  status: 'active' | 'trial' | 'expired' | 'cancelled';
  startDate: string;
  nextBilling: string;
  monthlyAmount: number;
  currency: string;
  users: number;
  maxUsers: number;
  policies: number;
  maxPolicies: number;
  lastPayment: string;
  auto_renew: boolean;
  soft_deleted?: boolean;
}

export interface FeatureCondition {
  plan_id: string;
  plan_name: string;
  feature: string;
  enabled: boolean;
}

export interface Feature {
  key: string;
  label: string;
  description: string;
  dependencies?: string[];
}

export interface FeatureMatrix {
  features: Feature[];
  matrix: Record<string, Record<string, boolean>>;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Form types
export interface TenantFormData {
  name: string;
  domain: string;
  contact_person: string;
  contact_email: string;
  address: string;
  plan_id: string;
  status: 'active' | 'suspended' | 'trial';
}

export interface PlanFormData {
  name: string;
  description: string;
  price: number;
  billing_cycle: 'monthly' | 'yearly';
  features: string[];
  max_users: number;
  max_policies: number;
  status: 'active' | 'inactive';
}

export interface SubscriptionFormData {
  tenant_id: string;
  plan_id: string;
  start_date: string;
  end_date: string;
  auto_renew: boolean;
}

// Table filter types
export interface TableFilters {
  search?: string;
  status?: string;
  plan?: string;
  dateRange?: {
    from: string;
    to: string;
  };
  priceRange?: {
    min: number;
    max: number;
  };
}

export interface TableSorting {
  field: string;
  direction: 'asc' | 'desc';
}

export interface TablePagination {
  page: number;
  pageSize: number;
}