import { supabase } from "@/integrations/supabase/client";

export interface PayoutUploadRow {
  agentCode: string;
  policyNumber: string;
  payoutAmount: number;
  payoutDate: string;
  payoutStatus: string;
  paymentMode: string;
  processedByEmail?: string;
  remarks?: string;
}

export interface PayoutUploadResult {
  success: boolean;
  totalRows: number;
  successCount: number;
  errorCount: number;
  errors: Array<{
    row: number;
    error: string;
    data: PayoutUploadRow;
  }>;
}

export const processPayout = async (
  row: PayoutUploadRow,
  rowIndex: number
): Promise<{ success: boolean; error?: string; data?: any }> => {
  try {
    // Validate required fields
    if (!row.agentCode || !row.policyNumber || !row.payoutAmount || !row.payoutDate) {
      return {
        success: false,
        error: "Missing required fields: agentCode, policyNumber, payoutAmount, or payoutDate"
      };
    }

    // Validate payout status
    const validStatuses = ["Pending", "Paid", "Failed", "On Hold"];
    if (!validStatuses.includes(row.payoutStatus)) {
      return {
        success: false,
        error: `Invalid payout status. Must be one of: ${validStatuses.join(", ")}`
      };
    }

    // Validate payment mode
    const validPaymentModes = ["UPI", "Bank Transfer", "Cheque", "Cash"];
    if (!validPaymentModes.includes(row.paymentMode)) {
      return {
        success: false,
        error: `Invalid payment mode. Must be one of: ${validPaymentModes.join(", ")}`
      };
    }

    // Find agent by agent code
    const { data: agentData, error: agentError } = await supabase
      .from("agents")
      .select("id")
      .eq("agent_code", row.agentCode)
      .single();

    if (agentError || !agentData) {
      return {
        success: false,
        error: `Agent with code ${row.agentCode} not found`
      };
    }

    // Find policy by policy number
    const { data: policyData, error: policyError } = await supabase
      .from("policies_new")
      .select("id, premium_amount")
      .eq("policy_number", row.policyNumber)
      .single();

    if (policyError || !policyData) {
      return {
        success: false,
        error: `Policy with number ${row.policyNumber} not found`
      };
    }

    // Find commission for this policy and agent
    const { data: commissionData, error: commissionError } = await supabase
      .from("commissions")
      .select("commission_amount")
      .eq("policy_id", policyData.id)
      .eq("agent_id", agentData.id)
      .single();

    if (commissionError || !commissionData) {
      return {
        success: false,
        error: `No commission record found for policy ${row.policyNumber} and agent ${row.agentCode}`
      };
    }

    // Validate payout amount against commission
    if (row.payoutAmount > commissionData.commission_amount) {
      return {
        success: false,
        error: `Payout amount (₹${row.payoutAmount}) cannot exceed commission amount (₹${commissionData.commission_amount})`
      };
    }

    // Find processed by employee if email provided
    let processedBy = null;
    if (row.processedByEmail) {
      const { data: employeeData, error: employeeError } = await supabase
        .from("employees")
        .select("id")
        .eq("email", row.processedByEmail)
        .single();

      if (employeeError || !employeeData) {
        return {
          success: false,
          error: `Employee with email ${row.processedByEmail} not found`
        };
      }
      processedBy = employeeData.id;
    }

    // Insert payout transaction
    const { data: payoutData, error: payoutError } = await supabase
      .from("payout_transactions")
      .insert({
        agent_id: agentData.id,
        policy_id: policyData.id,
        payout_amount: row.payoutAmount,
        payout_date: row.payoutDate,
        payout_status: row.payoutStatus as "Pending" | "Paid" | "Failed" | "On Hold",
        payment_mode: row.paymentMode as "UPI" | "Bank Transfer" | "Cheque" | "Cash",
        processed_by: processedBy,
        remarks: row.remarks || null
      })
      .select()
      .single();

    if (payoutError) {
      return {
        success: false,
        error: `Failed to create payout transaction: ${payoutError.message}`
      };
    }

    return {
      success: true,
      data: payoutData
    };

  } catch (error: any) {
    return {
      success: false,
      error: `Unexpected error: ${error.message}`
    };
  }
};

export const bulkUploadPayouts = async (payouts: PayoutUploadRow[]): Promise<PayoutUploadResult> => {
  const result: PayoutUploadResult = {
    success: false,
    totalRows: payouts.length,
    successCount: 0,
    errorCount: 0,
    errors: []
  };

  for (let i = 0; i < payouts.length; i++) {
    const payout = payouts[i];
    const processResult = await processPayout(payout, i + 1);

    if (processResult.success) {
      result.successCount++;
    } else {
      result.errorCount++;
      result.errors.push({
        row: i + 1,
        error: processResult.error || "Unknown error",
        data: payout
      });
    }
  }

  result.success = result.errorCount === 0;
  return result;
};

export const generatePayoutTemplate = () => {
  const headers = [
    "agentCode",
    "policyNumber", 
    "payoutAmount",
    "payoutDate",
    "payoutStatus",
    "paymentMode",
    "processedByEmail",
    "remarks"
  ];

  const sampleData = [
    "AGT001,POL001,5000,2024-01-15,Paid,Bank Transfer,finance@company.com,Monthly payout",
    "AGT002,POL002,3000,2024-01-15,Pending,UPI,,Quarterly payout"
  ];

  const csvContent = headers.join(",") + "\n" + sampleData.join("\n");
  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "payout_upload_template.csv";
  a.click();
  window.URL.revokeObjectURL(url);
};