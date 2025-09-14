import { z } from "zod";

// =============================
// Life Insurance Bulk Upload
// =============================
export const LifePolicyBulkSchema = z.object({
  org_id: z.string().uuid().optional(),
  customer_id: z.string().uuid().optional(),
  agent_id: z.string().uuid().optional(),
  employee_id: z.string().uuid().optional(),
  policy_number: z.string().optional(),
  application_id: z.string().optional(),
  plan_name: z.string().optional(),
  uin: z.string().optional(),
  policy_term: z.string().optional(), // keep text since formats vary
  maturity_date: z.string().date().optional(),
  sum_assured: z.coerce.number().optional(),
  policy_startdate: z.string().date().optional(),
  policy_enddate: z.string().date().optional(),
  premium_without_gst: z.coerce.number().optional(),
  premium_with_gst: z.coerce.number().optional(),
});

// =============================
// Health Insurance Bulk Upload
// =============================
export const HealthPolicyBulkSchema = z.object({
  org_id: z.string().uuid().optional(),
  customer_id: z.string().uuid().optional(),
  agent_id: z.string().uuid().optional(),
  employee_id: z.string().uuid().optional(),
  policy_number: z.string().optional(),
  proposal_number: z.string().optional(),
  plan_name: z.string().optional(),
  cover_type: z.enum(["individual", "floater"]).optional(),
  sum_insured: z.coerce.number().optional(),
  insured_members: z
    .string()
    .transform((val) => {
      try {
        return JSON.parse(val); // Expect JSON array string from CSV
      } catch {
        return [];
      }
    })
    .optional(),
  ncb: z.string().optional(),
  policy_startdate: z.string().date().optional(),
  policy_enddate: z.string().date().optional(),
  premium_without_gst: z.coerce.number().optional(),
  premium_with_gst: z.coerce.number().optional(),
});

// =============================
// Motor Insurance Bulk Upload
// =============================
export const MotorPolicyBulkSchema = z.object({
  org_id: z.string().uuid().optional(),
  customer_id: z.string().uuid().optional(),
  agent_id: z.string().uuid().optional(),
  employee_id: z.string().uuid().optional(),
  policy_number: z.string().optional(),
  vehicle_number: z.string().optional(),
  vehicle_make: z.string().optional(),
  vehicle_model: z.string().optional(),
  vehicle_variant: z.string().optional(),
  fuel_type: z.string().optional(),
  cc: z.coerce.number().optional(),
  idv: z.coerce.number().optional(),
  policy_startdate: z.string().date().optional(),
  policy_enddate: z.string().date().optional(),
  premium_without_gst: z.coerce.number().optional(),
  premium_with_gst: z.coerce.number().optional(),
});

// =============================
// Bulk Arrays (per template)
// =============================
export const LifePoliciesBulkUploadSchema = z.array(LifePolicyBulkSchema);
export const HealthPoliciesBulkUploadSchema = z.array(HealthPolicyBulkSchema);
export const MotorPoliciesBulkUploadSchema = z.array(MotorPolicyBulkSchema);

// Legacy schemas for backward compatibility
export const PolicyLifeSchema = LifePolicyBulkSchema;
export const PolicyHealthSchema = HealthPolicyBulkSchema;
export const PolicyMotorSchema = MotorPolicyBulkSchema;
export const BulkPolicyLifeSchema = LifePoliciesBulkUploadSchema;
export const BulkPolicyHealthSchema = HealthPoliciesBulkUploadSchema;
export const BulkPolicyMotorSchema = MotorPoliciesBulkUploadSchema;

// Export types
export type LifePolicyBulkData = z.infer<typeof LifePolicyBulkSchema>;
export type HealthPolicyBulkData = z.infer<typeof HealthPolicyBulkSchema>;
export type MotorPolicyBulkData = z.infer<typeof MotorPolicyBulkSchema>;
export type LifePoliciesBulkUploadData = z.infer<typeof LifePoliciesBulkUploadSchema>;
export type HealthPoliciesBulkUploadData = z.infer<typeof HealthPoliciesBulkUploadSchema>;
export type MotorPoliciesBulkUploadData = z.infer<typeof MotorPoliciesBulkUploadSchema>;

// Legacy type exports for backward compatibility
export type PolicyLifeData = z.infer<typeof PolicyLifeSchema>;
export type PolicyHealthData = z.infer<typeof PolicyHealthSchema>;
export type PolicyMotorData = z.infer<typeof PolicyMotorSchema>;
export type BulkPolicyLifeData = z.infer<typeof BulkPolicyLifeSchema>;
export type BulkPolicyHealthData = z.infer<typeof BulkPolicyHealthSchema>;
export type BulkPolicyMotorData = z.infer<typeof BulkPolicyMotorSchema>;

// Template headers for CSV generation (matching the bulk schemas)
export const LIFE_POLICY_HEADERS = [
  'org_id', 'customer_id', 'agent_id', 'employee_id', 'policy_number',
  'application_id', 'plan_name', 'uin', 'policy_term', 'maturity_date',
  'sum_assured', 'policy_startdate', 'policy_enddate', 'premium_without_gst', 'premium_with_gst'
];

export const HEALTH_POLICY_HEADERS = [
  'org_id', 'customer_id', 'agent_id', 'employee_id', 'policy_number',
  'proposal_number', 'plan_name', 'cover_type', 'sum_insured', 'insured_members',
  'ncb', 'policy_startdate', 'policy_enddate', 'premium_without_gst', 'premium_with_gst'
];

export const MOTOR_POLICY_HEADERS = [
  'org_id', 'customer_id', 'agent_id', 'employee_id', 'policy_number',
  'vehicle_number', 'vehicle_make', 'vehicle_model', 'vehicle_variant', 'fuel_type',
  'cc', 'idv', 'policy_startdate', 'policy_enddate', 'premium_without_gst', 'premium_with_gst'
];

// Sample data for templates (matching the bulk schema fields)
export const LIFE_POLICY_SAMPLE = {
  org_id: '11111111-1111-1111-1111-111111111111',
  customer_id: '22222222-2222-2222-2222-222222222222',
  agent_id: '33333333-3333-3333-3333-333333333333',
  employee_id: '44444444-4444-4444-4444-444444444444',
  policy_number: 'LIFE123456',
  application_id: 'APP987654',
  plan_name: 'ICICI Smart Life',
  uin: 'UIN123',
  policy_term: '20 years',
  maturity_date: '2045-03-15',
  sum_assured: '500000',
  policy_startdate: '2025-03-15',
  policy_enddate: '2045-03-15',
  premium_without_gst: '25000',
  premium_with_gst: '29500'
};

export const HEALTH_POLICY_SAMPLE = {
  org_id: '11111111-1111-1111-1111-111111111111',
  customer_id: '22222222-2222-2222-2222-222222222222',
  agent_id: '33333333-3333-3333-3333-333333333333',
  employee_id: '44444444-4444-4444-4444-444444444444',
  policy_number: 'HEALTH54321',
  proposal_number: 'PRO12345',
  plan_name: 'Care Health Protect',
  cover_type: 'individual',
  sum_insured: '1000000',
  insured_members: '[{"name":"John Doe","dob":"1985-06-15","gender":"M"},{"name":"Jane Doe","dob":"1987-08-25","gender":"F"}]',
  ncb: 'NCB50',
  policy_startdate: '2025-01-01',
  policy_enddate: '2026-01-01',
  premium_without_gst: '12000',
  premium_with_gst: '14160'
};

export const MOTOR_POLICY_SAMPLE = {
  org_id: '11111111-1111-1111-1111-111111111111',
  customer_id: '22222222-2222-2222-2222-222222222222',
  agent_id: '33333333-3333-3333-3333-333333333333',
  employee_id: '44444444-4444-4444-4444-444444444444',
  policy_number: 'MOTOR78901',
  vehicle_number: 'KA01AB1234',
  vehicle_make: 'Hyundai',
  vehicle_model: 'Creta',
  vehicle_variant: 'SX Petrol',
  fuel_type: 'Petrol',
  cc: '1497',
  idv: '950000',
  policy_startdate: '2025-02-01',
  policy_enddate: '2026-02-01',
  premium_without_gst: '18000',
  premium_with_gst: '21240'
};