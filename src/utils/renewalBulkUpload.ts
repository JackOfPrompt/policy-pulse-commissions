import { supabase } from "@/integrations/supabase/client";

export interface RenewalUploadData {
  policyNumber: string;
  customerName: string;
  expiryDate: string;
  productName: string;
  insurerName: string;
  agentCode: string;
  branchName: string;
  premiumAmount: string;
  renewalStatus: string;
  followUpDate: string;
  remarks: string;
}

export const renewalTemplate = {
  filename: "renewal_upload_template.csv",
  columns: [
    "policyNumber",
    "customerName", 
    "expiryDate",
    "productName",
    "insurerName",
    "agentCode",
    "branchName",
    "premiumAmount",
    "renewalStatus",
    "followUpDate",
    "remarks"
  ]
};

export const renewalSampleData: RenewalUploadData[] = [
  {
    policyNumber: "POL001",
    customerName: "John Doe",
    expiryDate: "2024-12-31",
    productName: "Health Plus",
    insurerName: "ABC Insurance",
    agentCode: "AGT001",
    branchName: "Mumbai Central",
    premiumAmount: "25000",
    renewalStatus: "Pending",
    followUpDate: "2024-12-20",
    remarks: "Customer interested in upgrading coverage"
  },
  {
    policyNumber: "POL002", 
    customerName: "Jane Smith",
    expiryDate: "2024-11-30",
    productName: "Motor Comprehensive",
    insurerName: "XYZ Insurance",
    agentCode: "AGT002",
    branchName: "Delhi North",
    premiumAmount: "15000",
    renewalStatus: "Pending",
    followUpDate: "2024-11-25",
    remarks: "Renewal due soon, customer to be contacted"
  }
];

export const validateRenewalData = (data: RenewalUploadData[]): { valid: RenewalUploadData[], errors: string[] } => {
  const valid: RenewalUploadData[] = [];
  const errors: string[] = [];

  data.forEach((row, index) => {
    const rowErrors: string[] = [];

    if (!row.policyNumber?.trim()) {
      rowErrors.push(`Row ${index + 1}: Policy Number is required`);
    }

    if (!row.customerName?.trim()) {
      rowErrors.push(`Row ${index + 1}: Customer Name is required`);
    }

    if (!row.expiryDate?.trim()) {
      rowErrors.push(`Row ${index + 1}: Expiry Date is required`);
    } else {
      const date = new Date(row.expiryDate);
      if (isNaN(date.getTime())) {
        rowErrors.push(`Row ${index + 1}: Invalid expiry date format`);
      }
    }

    if (row.premiumAmount && isNaN(Number(row.premiumAmount))) {
      rowErrors.push(`Row ${index + 1}: Premium amount must be a valid number`);
    }

    if (row.renewalStatus && !["Pending", "Renewed", "Missed", "Cancelled"].includes(row.renewalStatus)) {
      rowErrors.push(`Row ${index + 1}: Invalid renewal status. Use: Pending, Renewed, Missed, or Cancelled`);
    }

    if (row.followUpDate && row.followUpDate.trim()) {
      const followUpDate = new Date(row.followUpDate);
      if (isNaN(followUpDate.getTime())) {
        rowErrors.push(`Row ${index + 1}: Invalid follow-up date format`);
      }
    }

    if (rowErrors.length === 0) {
      valid.push(row);
    } else {
      errors.push(...rowErrors);
    }
  });

  return { valid, errors };
};

export const uploadRenewalData = async (data: RenewalUploadData[]): Promise<{ success: number, failed: number, errors: string[] }> => {
  let success = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const renewal of data) {
    try {
      // First, try to find the policy by policy number
      const { data: policyData, error: policyError } = await supabase
        .from("policies_new")
        .select("id, agent_id, employee_id, branch_id, product_id, insurer_id")
        .eq("policy_number", renewal.policyNumber)
        .single();

      if (policyError || !policyData) {
        errors.push(`Policy ${renewal.policyNumber} not found in system`);
        failed++;
        continue;
      }

      // Check if renewal record already exists
      const { data: existingRenewal } = await supabase
        .from("policy_renewals")
        .select("id")
        .eq("policy_id", policyData.id)
        .single();

      if (existingRenewal) {
        // Update existing renewal
        const { error: updateError } = await supabase
          .from("policy_renewals")
          .update({
            customer_name: renewal.customerName,
            original_expiry_date: renewal.expiryDate,
            renewal_due_date: renewal.expiryDate,
            renewal_status: renewal.renewalStatus || "Pending",
            follow_up_date: renewal.followUpDate || null,
            remarks: renewal.remarks || null,
            updated_at: new Date().toISOString()
          })
          .eq("id", existingRenewal.id);

        if (updateError) {
          errors.push(`Failed to update renewal for policy ${renewal.policyNumber}: ${updateError.message}`);
          failed++;
        } else {
          success++;
        }
      } else {
        // Create new renewal record
        const { error: insertError } = await supabase
          .from("policy_renewals")
          .insert({
            policy_id: policyData.id,
            customer_name: renewal.customerName,
            agent_id: policyData.agent_id,
            employee_id: policyData.employee_id,
            branch_id: policyData.branch_id,
            product_id: policyData.product_id,
            insurer_id: policyData.insurer_id,
            original_expiry_date: renewal.expiryDate,
            renewal_due_date: renewal.expiryDate,
            renewal_status: renewal.renewalStatus || "Pending",
            follow_up_date: renewal.followUpDate || null,
            remarks: renewal.remarks || null
          });

        if (insertError) {
          errors.push(`Failed to create renewal for policy ${renewal.policyNumber}: ${insertError.message}`);
          failed++;
        } else {
          success++;
        }
      }

    } catch (error) {
      errors.push(`Unexpected error processing policy ${renewal.policyNumber}: ${error}`);
      failed++;
    }
  }

  return { success, failed, errors };
};