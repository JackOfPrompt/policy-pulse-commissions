import { z } from 'zod';

// ==========================================================
// Agent Schema (POSP)
// ==========================================================
export const AgentSchema = z.object({
  id: z.string().uuid().optional(),
  org_id: z.string().uuid(),
  employee_id: z.string().uuid().nullable().optional(),

  agent_code: z.string().optional(),
  agent_name: z.string().min(1, "Agent name is required"),
  gender: z.enum(["male", "female", "other"]).optional(),
  dob: z.string().optional(),
  phone: z.string().min(10).max(15),
  email: z.string().email(),
  address: z.string().optional(),
  city: z.string().optional(),
  district: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  pincode: z.string().optional(),

  agent_type: z.string().default("POSP"),
  qualification: z.string().optional(),
  reference: z.string().optional(),
  percentage: z.coerce.number().min(0).max(100).optional(),
  commission_tier_id: z.string().uuid().optional(),
  override_percentage: z.coerce.number().min(0).max(100).optional(),
  status: z.enum(["active", "inactive"]).default("active"),

  pan_card: z.string().optional(),
  aadhar_card: z.string().optional(),
  pan_url: z.string().url().optional(),
  aadhar_url: z.string().url().optional(),
  degree_doc: z.string().url().optional(),
  cheque_doc: z.string().url().optional(),
  profile_doc: z.string().url().optional(),
  other_doc: z.string().url().optional(),

  account_name: z.string().optional(),
  bank_name: z.string().optional(),
  account_number: z.string().optional(),
  ifsc_code: z.string().optional(),
  account_type: z.string().optional(),
  branch_name: z.string().optional(),

  mobilepermissions: z.boolean().default(true),
  emailpermissions: z.boolean().default(true),
  kyc_status: z.enum(["approved", "pending", "rejected"]).default("pending"),
  reporting_manager_id: z.string().uuid().optional(),
  reporting_manager_name: z.string().optional(),
});

export const agentSchema = AgentSchema;
export type AgentFormData = z.infer<typeof AgentSchema>;