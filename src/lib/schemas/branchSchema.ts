import { z } from 'zod';

// ==========================================================
// Branch Schema
// ==========================================================
export const BranchesSchema = z.object({
  id: z.string().uuid().optional(),
  org_id: z.string().uuid(),
  branch_name: z.string().min(1, "Branch name is required"),
  region: z.string().optional(),
  state: z.string().optional(),
  district: z.string().optional(),
  city: z.string().optional(),
  pincode: z.string().optional(),
  landmark: z.string().optional(),
  address: z.string().optional(),
  status: z.enum(["active", "inactive"]).default("active"),
  department: z.string().optional(),
  sub_department: z.string().optional(),
});

export const branchSchema = BranchesSchema;
export type BranchFormData = z.infer<typeof BranchesSchema>;