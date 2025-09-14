import { z } from 'zod';

// ==========================================================
// Employee Schema
// ==========================================================
export const EmployeeSchema = z.object({
  id: z.string().uuid().optional(),
  org_id: z.string().uuid(),
  branch_id: z.string().uuid().nullable().optional(),

  employee_code: z.string().optional(),
  name: z.string().min(1, "Name is required"),
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

  designation: z.string().optional(),
  department: z.string().optional(),
  reporting_manager: z.string().uuid().nullable().optional(),
  status: z.enum(["active", "inactive"]).default("active"),

  pan_card: z.string().optional(),
  aadhar_card: z.string().optional(),
  qualification: z.string().optional(),
  reference: z.string().optional(),
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
});

export const employeeSchema = EmployeeSchema;
export type EmployeeFormData = z.infer<typeof EmployeeSchema>;