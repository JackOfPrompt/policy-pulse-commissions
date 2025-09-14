// Mock API functions for Super Admin CRUD operations
// TODO: Replace these with actual API calls to your backend

import { 
  Tenant, 
  Plan, 
  Subscription, 
  FeatureCondition,
  TenantFormData,
  PlanFormData,
  SubscriptionFormData,
  ApiResponse,
  PaginatedResponse,
  TableFilters,
  TableSorting,
  TablePagination
} from '@/types/superadmin';

// Local storage keys
const STORAGE_KEYS = {
  TENANTS: 'sa_tenants',
  PLANS: 'sa_plans',
  SUBSCRIPTIONS: 'sa_subscriptions',
  PLAN_CONDITIONS: 'sa_plan_conditions'
};

// Utility functions
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const getFromStorage = <T>(key: string, fallback: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
};

const saveToStorage = <T>(key: string, data: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
};

// Initialize data from JSON files (call this on app start)
export const initializeMockData = async () => {
  try {
    // Import data files
    const tenantsData = (await import('@/data/superadmin/tenants.json')).default;
    const plansData = (await import('@/data/superadmin/plans.json')).default;
    const subscriptionsData = (await import('@/data/superadmin/subscriptions.json')).default;
    const planConditionsData = (await import('@/data/superadmin/plan_conditions.json')).default;

    // Initialize localStorage if not already set
    if (!localStorage.getItem(STORAGE_KEYS.TENANTS)) {
      saveToStorage(STORAGE_KEYS.TENANTS, tenantsData);
    }
    if (!localStorage.getItem(STORAGE_KEYS.PLANS)) {
      saveToStorage(STORAGE_KEYS.PLANS, plansData);
    }
    if (!localStorage.getItem(STORAGE_KEYS.SUBSCRIPTIONS)) {
      saveToStorage(STORAGE_KEYS.SUBSCRIPTIONS, subscriptionsData);
    }
    if (!localStorage.getItem(STORAGE_KEYS.PLAN_CONDITIONS)) {
      saveToStorage(STORAGE_KEYS.PLAN_CONDITIONS, planConditionsData);
    }
  } catch (error) {
    console.error('Failed to initialize mock data:', error);
  }
};

// ==================== TENANT API ====================

export const getTenants = async (
  filters?: TableFilters,
  sorting?: TableSorting,
  pagination?: TablePagination
): Promise<PaginatedResponse<Tenant>> => {
  await delay(300); // Simulate network delay
  
  let tenants: Tenant[] = getFromStorage(STORAGE_KEYS.TENANTS, []);
  
  // Filter out soft deleted
  tenants = tenants.filter(t => !t.soft_deleted);
  
  // Apply filters
  if (filters?.search) {
    const search = filters.search.toLowerCase();
    tenants = tenants.filter(t => 
      t.name.toLowerCase().includes(search) ||
      t.domain.toLowerCase().includes(search) ||
      t.contact_person.toLowerCase().includes(search)
    );
  }
  
  if (filters?.status) {
    tenants = tenants.filter(t => t.status === filters.status);
  }
  
  if (filters?.plan) {
    tenants = tenants.filter(t => t.plan_id === filters.plan);
  }
  
  // Apply sorting
  if (sorting) {
    tenants.sort((a, b) => {
      const aVal = a[sorting.field as keyof Tenant];
      const bVal = b[sorting.field as keyof Tenant];
      const multiplier = sorting.direction === 'asc' ? 1 : -1;
      return aVal < bVal ? -1 * multiplier : aVal > bVal ? 1 * multiplier : 0;
    });
  }
  
  // Apply pagination
  const total = tenants.length;
  const page = pagination?.page || 1;
  const pageSize = pagination?.pageSize || 10;
  const startIndex = (page - 1) * pageSize;
  const paginatedTenants = tenants.slice(startIndex, startIndex + pageSize);
  
  return {
    data: paginatedTenants,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize)
  };
};

export const getTenant = async (id: string): Promise<ApiResponse<Tenant | null>> => {
  await delay(200);
  
  const tenants: Tenant[] = getFromStorage(STORAGE_KEYS.TENANTS, []);
  const tenant = tenants.find(t => t.id === id && !t.soft_deleted);
  
  return {
    data: tenant || null,
    success: !!tenant,
    message: tenant ? 'Tenant found' : 'Tenant not found'
  };
};

export const createTenant = async (data: TenantFormData): Promise<ApiResponse<Tenant>> => {
  await delay(500);
  
  const tenants: Tenant[] = getFromStorage(STORAGE_KEYS.TENANTS, []);
  const newTenant: Tenant = {
    id: `tenant-${Date.now()}`,
    ...data,
    renewal_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    created_at: new Date().toISOString().split('T')[0],
    metadata: {
      branches: 0,
      employees: 0,
      agents: 0
    },
    soft_deleted: false
  };
  
  tenants.push(newTenant);
  saveToStorage(STORAGE_KEYS.TENANTS, tenants);
  
  return {
    data: newTenant,
    success: true,
    message: 'Tenant created successfully'
  };
};

export const updateTenant = async (id: string, data: Partial<TenantFormData>): Promise<ApiResponse<Tenant>> => {
  await delay(500);
  
  const tenants: Tenant[] = getFromStorage(STORAGE_KEYS.TENANTS, []);
  const index = tenants.findIndex(t => t.id === id && !t.soft_deleted);
  
  if (index === -1) {
    return {
      data: null as any,
      success: false,
      message: 'Tenant not found'
    };
  }
  
  tenants[index] = { ...tenants[index], ...data };
  saveToStorage(STORAGE_KEYS.TENANTS, tenants);
  
  return {
    data: tenants[index],
    success: true,
    message: 'Tenant updated successfully'
  };
};

export const deleteTenant = async (id: string): Promise<ApiResponse<boolean>> => {
  await delay(300);
  
  const tenants: Tenant[] = getFromStorage(STORAGE_KEYS.TENANTS, []);
  const index = tenants.findIndex(t => t.id === id);
  
  if (index === -1) {
    return {
      data: false,
      success: false,
      message: 'Tenant not found'
    };
  }
  
  // Soft delete
  tenants[index].soft_deleted = true;
  saveToStorage(STORAGE_KEYS.TENANTS, tenants);
  
  return {
    data: true,
    success: true,
    message: 'Tenant deleted successfully'
  };
};

export const suspendTenant = async (id: string, reason?: string): Promise<ApiResponse<Tenant>> => {
  return updateTenant(id, { status: 'suspended' });
};

export const reactivateTenant = async (id: string): Promise<ApiResponse<Tenant>> => {
  return updateTenant(id, { status: 'active' });
};

// ==================== PLAN API ====================

export const getPlans = async (
  filters?: TableFilters,
  sorting?: TableSorting,
  pagination?: TablePagination
): Promise<PaginatedResponse<Plan>> => {
  await delay(300);
  
  let plans: Plan[] = getFromStorage(STORAGE_KEYS.PLANS, []);
  
  // Filter out soft deleted
  plans = plans.filter(p => !p.soft_deleted);
  
  // Apply filters
  if (filters?.search) {
    const search = filters.search.toLowerCase();
    plans = plans.filter(p => 
      p.name.toLowerCase().includes(search) ||
      p.description.toLowerCase().includes(search)
    );
  }
  
  if (filters?.status) {
    plans = plans.filter(p => p.status === filters.status);
  }
  
  // Apply sorting
  if (sorting) {
    plans.sort((a, b) => {
      const aVal = a[sorting.field as keyof Plan];
      const bVal = b[sorting.field as keyof Plan];
      const multiplier = sorting.direction === 'asc' ? 1 : -1;
      return aVal < bVal ? -1 * multiplier : aVal > bVal ? 1 * multiplier : 0;
    });
  }
  
  // Apply pagination
  const total = plans.length;
  const page = pagination?.page || 1;
  const pageSize = pagination?.pageSize || 10;
  const startIndex = (page - 1) * pageSize;
  const paginatedPlans = plans.slice(startIndex, startIndex + pageSize);
  
  return {
    data: paginatedPlans,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize)
  };
};

export const createPlan = async (data: PlanFormData): Promise<ApiResponse<Plan>> => {
  await delay(500);
  
  const plans: Plan[] = getFromStorage(STORAGE_KEYS.PLANS, []);
  const newPlan: Plan = {
    id: `PLAN-${Date.now()}`,
    ...data,
    billing: data.billing_cycle,
    currency: 'INR',
    limits: {
      policies: data.max_policies === -1 ? 'unlimited' : data.max_policies,
      users: data.max_users === -1 ? 'unlimited' : data.max_users,
      storage: '100GB',
      apiCalls: 10000
    },
    popular: false,
    created_at: new Date().toISOString(),
    soft_deleted: false
  };
  
  plans.push(newPlan);
  saveToStorage(STORAGE_KEYS.PLANS, plans);
  
  return {
    data: newPlan,
    success: true,
    message: 'Plan created successfully'
  };
};

export const updatePlan = async (id: string, data: Partial<PlanFormData>): Promise<ApiResponse<Plan>> => {
  await delay(500);
  
  const plans: Plan[] = getFromStorage(STORAGE_KEYS.PLANS, []);
  const index = plans.findIndex(p => p.id === id && !p.soft_deleted);
  
  if (index === -1) {
    return {
      data: null as any,
      success: false,
      message: 'Plan not found'
    };
  }
  
  plans[index] = { ...plans[index], ...data };
  saveToStorage(STORAGE_KEYS.PLANS, plans);
  
  return {
    data: plans[index],
    success: true,
    message: 'Plan updated successfully'
  };
};

export const deletePlan = async (id: string): Promise<ApiResponse<boolean>> => {
  await delay(300);
  
  const plans: Plan[] = getFromStorage(STORAGE_KEYS.PLANS, []);
  const index = plans.findIndex(p => p.id === id);
  
  if (index === -1) {
    return {
      data: false,
      success: false,
      message: 'Plan not found'
    };
  }
  
  // Soft delete
  plans[index].soft_deleted = true;
  saveToStorage(STORAGE_KEYS.PLANS, plans);
  
  return {
    data: true,
    success: true,
    message: 'Plan deleted successfully'
  };
};

export const duplicatePlan = async (id: string): Promise<ApiResponse<Plan>> => {
  await delay(500);
  
  const plans: Plan[] = getFromStorage(STORAGE_KEYS.PLANS, []);
  const originalPlan = plans.find(p => p.id === id && !p.soft_deleted);
  
  if (!originalPlan) {
    return {
      data: null as any,
      success: false,
      message: 'Plan not found'
    };
  }
  
  const duplicatedPlan: Plan = {
    ...originalPlan,
    id: `PLAN-${Date.now()}`,
    name: `${originalPlan.name} (Copy)`,
    created_at: new Date().toISOString(),
    soft_deleted: false
  };
  
  plans.push(duplicatedPlan);
  saveToStorage(STORAGE_KEYS.PLANS, plans);
  
  return {
    data: duplicatedPlan,
    success: true,
    message: 'Plan duplicated successfully'
  };
};

// ==================== SUBSCRIPTION API ====================

export const getSubscriptions = async (
  filters?: TableFilters,
  sorting?: TableSorting,
  pagination?: TablePagination
): Promise<PaginatedResponse<Subscription>> => {
  await delay(300);
  
  let subscriptions: Subscription[] = getFromStorage(STORAGE_KEYS.SUBSCRIPTIONS, []);
  
  // Filter out soft deleted
  subscriptions = subscriptions.filter(s => !s.soft_deleted);
  
  // Apply filters
  if (filters?.search) {
    const search = filters.search.toLowerCase();
    subscriptions = subscriptions.filter(s => 
      s.organizationName.toLowerCase().includes(search) ||
      s.id.toLowerCase().includes(search)
    );
  }
  
  if (filters?.status) {
    subscriptions = subscriptions.filter(s => s.status === filters.status);
  }
  
  // Apply sorting
  if (sorting) {
    subscriptions.sort((a, b) => {
      const aVal = a[sorting.field as keyof Subscription];
      const bVal = b[sorting.field as keyof Subscription];
      const multiplier = sorting.direction === 'asc' ? 1 : -1;
      return aVal < bVal ? -1 * multiplier : aVal > bVal ? 1 * multiplier : 0;
    });
  }
  
  // Apply pagination
  const total = subscriptions.length;
  const page = pagination?.page || 1;
  const pageSize = pagination?.pageSize || 10;
  const startIndex = (page - 1) * pageSize;
  const paginatedSubscriptions = subscriptions.slice(startIndex, startIndex + pageSize);
  
  return {
    data: paginatedSubscriptions,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize)
  };
};

export const renewSubscription = async (id: string, months: number): Promise<ApiResponse<Subscription>> => {
  await delay(500);
  
  const subscriptions: Subscription[] = getFromStorage(STORAGE_KEYS.SUBSCRIPTIONS, []);
  const index = subscriptions.findIndex(s => s.id === id && !s.soft_deleted);
  
  if (index === -1) {
    return {
      data: null as any,
      success: false,
      message: 'Subscription not found'
    };
  }
  
  const currentEnd = new Date(subscriptions[index].nextBilling);
  const newEndDate = new Date(currentEnd.getTime() + (months * 30 * 24 * 60 * 60 * 1000));
  
  subscriptions[index].nextBilling = newEndDate.toISOString().split('T')[0];
  subscriptions[index].lastPayment = new Date().toISOString();
  
  saveToStorage(STORAGE_KEYS.SUBSCRIPTIONS, subscriptions);
  
  return {
    data: subscriptions[index],
    success: true,
    message: `Subscription renewed for ${months} months`
  };
};

export const cancelSubscription = async (id: string, reason?: string): Promise<ApiResponse<Subscription>> => {
  await delay(500);
  
  const subscriptions: Subscription[] = getFromStorage(STORAGE_KEYS.SUBSCRIPTIONS, []);
  const index = subscriptions.findIndex(s => s.id === id && !s.soft_deleted);
  
  if (index === -1) {
    return {
      data: null as any,
      success: false,
      message: 'Subscription not found'
    };
  }
  
  subscriptions[index].status = 'cancelled';
  subscriptions[index].auto_renew = false;
  
  saveToStorage(STORAGE_KEYS.SUBSCRIPTIONS, subscriptions);
  
  return {
    data: subscriptions[index],
    success: true,
    message: 'Subscription cancelled successfully'
  };
};

// ==================== PLAN CONDITIONS API ====================

export const getPlanConditions = async (): Promise<ApiResponse<FeatureCondition[]>> => {
  await delay(200);
  
  const conditions: FeatureCondition[] = getFromStorage(STORAGE_KEYS.PLAN_CONDITIONS, []);
  
  return {
    data: conditions,
    success: true,
    message: 'Plan conditions fetched successfully'
  };
};

export const updatePlanCondition = async (
  planId: string, 
  feature: string, 
  enabled: boolean
): Promise<ApiResponse<FeatureCondition[]>> => {
  await delay(300);
  
  const conditions: FeatureCondition[] = getFromStorage(STORAGE_KEYS.PLAN_CONDITIONS, []);
  const index = conditions.findIndex(c => c.plan_id === planId && c.feature === feature);
  
  if (index !== -1) {
    conditions[index].enabled = enabled;
    saveToStorage(STORAGE_KEYS.PLAN_CONDITIONS, conditions);
  }
  
  return {
    data: conditions,
    success: true,
    message: 'Plan condition updated successfully'
  };
};

// ==================== EXPORT/IMPORT FUNCTIONS ====================

export const exportToCSV = <T extends Record<string, any>>(
  data: T[], 
  filename: string, 
  columns?: Array<{ key: keyof T; label: string }>
): void => {
  if (!data.length) return;
  
  const headers = columns 
    ? columns.map(col => col.label)
    : Object.keys(data[0]);
    
  const keys = columns 
    ? columns.map(col => col.key)
    : Object.keys(data[0]) as Array<keyof T>;
  
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      keys.map(key => {
        const value = row[key];
        const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
        return `"${stringValue.replace(/"/g, '""')}"`;
      }).join(',')
    )
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};