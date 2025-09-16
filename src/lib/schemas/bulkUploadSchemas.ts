import { z } from "zod";

// Standard schemas for form validation  
export const AgentFormSchema = z.object({
  agent_name: z.string().min(1, "Agent name is required"),
  agent_code: z.string().min(1, "Agent code is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(7, "Valid phone number is required"),
  commission_tier_name: z.string().optional(),
  override_percentage: z.number().min(0).max(100).optional(),
});

export const MispFormSchema = z.object({
  channel_partner_name: z.string().min(1, "Channel partner name is required"),
  misp_code: z.string().min(1, "MISP code is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(7, "Valid phone number is required"),
  commission_tier_name: z.string().optional(),
  override_percentage: z.number().min(0).max(100).optional(),
});

// Relaxed bulk-upload versions: allow empty strings for optional fields
export const AgentBulkSchema = z.object({
  agent_name: z.string().min(1, "Agent name is required"),
  agent_code: z.string().min(1, "Agent code is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(1, "Phone number is required"),
  commission_tier_name: z.string().optional().or(z.literal("")),
  override_percentage: z
    .string()
    .optional()
    .transform((val) => (val && val.trim() !== "" ? parseFloat(val) : undefined))
    .refine((val) => val === undefined || (val >= 0 && val <= 100), {
      message: "Override percentage must be between 0 and 100",
    }),
});

export const MispBulkSchema = z.object({
  channel_partner_name: z.string().min(1, "Channel partner name is required"),
  misp_code: z.string().min(1, "MISP code is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(1, "Phone number is required"),
  commission_tier_name: z.string().optional().or(z.literal("")),
  override_percentage: z
    .string()
    .optional()
    .transform((val) => (val && val.trim() !== "" ? parseFloat(val) : undefined))
    .refine((val) => val === undefined || (val >= 0 && val <= 100), {
      message: "Override percentage must be between 0 and 100",
    }),
});

// Type definitions
export type AgentForm = z.infer<typeof AgentFormSchema>;
export type MispForm = z.infer<typeof MispFormSchema>;
export type AgentBulk = z.infer<typeof AgentBulkSchema>;
export type MispBulk = z.infer<typeof MispBulkSchema>;