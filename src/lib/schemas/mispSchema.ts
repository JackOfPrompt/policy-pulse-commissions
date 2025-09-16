import { z } from 'zod';

// ==========================================================
// MISP Schema (Channel Partners)
// ==========================================================
export const MispSchema = z.object({
  id: z.string().uuid().optional(),
  org_id: z.string().uuid(),
  employee_id: z.string().uuid().nullable().optional(),

  channel_partner_name: z.string().min(1, "Channel Partner Name is required"),
  type_of_dealer: z.string().optional(),
  dealer_pan_number: z.string().optional(),
  dealer_gst_number: z.string().optional(),

  dealer_principal_firstname: z.string().optional(),
  dealer_principal_lastname: z.string().optional(),
  dealer_principal_phone_number: z.string().optional(),
  dealer_principal_email_id: z.string().email().optional(),
  dealer_principal_kyc: z.string().optional(),

  sales_person_firstname: z.string().optional(),
  sales_person_lastname: z.string().optional(),
  sales_person_mobile_number: z.string().optional(),
  sales_person_email_id: z.string().email().optional(),
  sales_person_kyc: z.string().optional(),
  sales_person_educational_certificate: z.string().optional(),

  address: z.string().optional(),
  landmark: z.string().optional(),
  pincode: z.string().optional(),
  city: z.string().optional(),
  district: z.string().optional(),
  state: z.string().optional(),

  account_holder_name: z.string().optional(),
  bank_name: z.string().optional(),
  account_type: z.string().optional(),
  account_number: z.string().optional(),
  ifsc_code: z.string().optional(),

  company_front_photo: z.string().url().optional(),
  company_back_photo: z.string().url().optional(),
  company_left_photo: z.string().url().optional(),
  company_right_photo: z.string().url().optional(),
  dealer_pan_card_doc: z.string().url().optional(),
  dealer_gst_certificate_doc: z.string().url().optional(),
  dealer_principal_photo: z.string().url().optional(),
  dealer_principal_kyc_doc: z.string().url().optional(),
  sales_person_kyc_doc: z.string().url().optional(),
  sales_person_photo: z.string().url().optional(),
  sales_person_educational_certificate_doc: z.string().url().optional(),
  cheque_doc: z.string().url().optional(),
  misp_agreement_doc: z.string().url().optional(),

  commission_tier_id: z.string().uuid().optional(),
  override_percentage: z.coerce.number().min(0).max(100).optional(),
  mobilepermissions: z.boolean().default(true),
  emailpermissions: z.boolean().default(true),
});

export const mispSchema = MispSchema;
export type MispFormData = z.infer<typeof MispSchema>;