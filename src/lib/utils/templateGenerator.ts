import { z } from "zod";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";

// Sample data map for generating example rows
const sampleDataMap: Record<string, any> = {
  // 🔹 Common fields
  id: "uuid-example",
  org_id: "uuid-of-organization",
  branch_id: "uuid-of-branch",
  employee_id: "uuid-of-employee",
  agent_id: "uuid-of-agent",
  misp_id: "uuid-of-misp",
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-01T00:00:00Z",
  created_by: "uuid-of-creator",
  updated_by: "uuid-of-updater",

  // 🔹 Branches
  branch_name: "Main Branch",
  region: "South",
  state: "Karnataka",
  district: "Bangalore Urban",
  city: "Bangalore",
  pincode: "560001",
  landmark: "Near MG Road",
  address: "123 MG Road, Bangalore",
  status: "active",
  department: "Sales",
  sub_department: "Motor Insurance",

  // 🔹 Employees
  employee_code: "EMP001",
  name: "John Doe",
  gender: "male",
  dob: "1990-01-01",
  phone: "9876543210",
  email: "john.doe@example.com",
  designation: "Sales Manager",
  reporting_manager: "uuid-of-manager",
  country: "India",
  qualification: "MBA",
  reference: "Employee Referral",
  pan_card: "ABCDE1234F",
  aadhar_card: "1234 5678 9012",
  pan_url: "https://example.com/pan.pdf",
  aadhar_url: "https://example.com/aadhar.pdf",
  degree_doc: "https://example.com/degree.pdf",
  cheque_doc: "https://example.com/cheque.pdf",
  profile_doc: "https://example.com/profile.jpg",
  other_doc: "https://example.com/other.pdf",

  // 🔹 Agents (POSP)
  agent_code: "AGT123",
  agent_name: "Ravi Kumar",
  agent_type: "POSP",
  percentage: "10.5",
  kyc_status: "approved",

  // 🔹 MISP
  channel_partner_name: "ABC Motors",
  type_of_dealer: "Car Dealer",
  dealer_pan_number: "ABCDE1234F",
  dealer_gst_number: "29ABCDE1234F1Z5",
  dealer_principal_firstname: "Suresh",
  dealer_principal_lastname: "Patil",
  dealer_principal_phone_number: "9123456789",
  dealer_principal_email_id: "suresh.patil@abcmotors.com",
  dealer_principal_kyc: "PAN Card",
  sales_person_firstname: "Amit",
  sales_person_lastname: "Shah",
  sales_person_mobile_number: "9876543210",
  sales_person_email_id: "amit.shah@abcmotors.com",
  sales_person_kyc: "Aadhar Card",
  sales_person_educational_certificate: "Graduate",

  // 🔹 Bank Details
  account_name: "Ravi Kumar",
  account_holder_name: "ABC Motors Pvt Ltd",
  bank_name: "HDFC Bank",
  account_number: "123456789012",
  ifsc_code: "HDFC0000123",
  account_type: "savings",

  // 🔹 Documents
  company_front_photo: "https://example.com/company-front.jpg",
  company_back_photo: "https://example.com/company-back.jpg",
  company_left_photo: "https://example.com/company-left.jpg",
  company_right_photo: "https://example.com/company-right.jpg",
  dealer_pan_card_doc: "https://example.com/dealer-pan.pdf",
  dealer_gst_certificate_doc: "https://example.com/gst-cert.pdf",
  dealer_principal_photo: "https://example.com/principal-photo.jpg",
  dealer_principal_kyc_doc: "https://example.com/principal-kyc.pdf",
  sales_person_kyc_doc: "https://example.com/sales-kyc.pdf",
  sales_person_photo: "https://example.com/sales-photo.jpg",
  sales_person_educational_certificate_doc: "https://example.com/education-cert.pdf",
  misp_agreement_doc: "https://example.com/misp-agreement.pdf",

  // 🔹 Permissions
  mobilepermissions: "true",
  emailpermissions: "true",
};

// Extract object keys from a Zod schema
export function getSchemaKeys(schema: z.AnyZodObject): string[] {
  return Object.keys(schema.shape);
}

// CSV Template Generator
export function downloadCsvTemplate(
  schema: z.AnyZodObject,
  filename: string,
  withSample = true
) {
  const headers = getSchemaKeys(schema);
  let csvContent = headers.join(",") + "\n";

  if (withSample) {
    const sampleRow = headers
      .map((key) => (sampleDataMap[key] ? sampleDataMap[key] : ""))
      .join(",");
    csvContent += sampleRow + "\n";
  }

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  saveAs(blob, `${filename}.csv`);
}

// XLSX Template Generator
export function downloadXlsxTemplate(
  schema: z.AnyZodObject,
  filename: string,
  withSample = true
) {
  const headers = getSchemaKeys(schema);
  const rows: any[][] = [headers];

  if (withSample) {
    const sampleRow = headers.map((key) =>
      sampleDataMap[key] ? sampleDataMap[key] : ""
    );
    rows.push(sampleRow);
  }

  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Template");

  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

// Get template headers for display
export function getTemplateHeaders(schema: z.AnyZodObject): string[] {
  return getSchemaKeys(schema);
}

// Get required fields from schema
export function getRequiredFields(schema: z.AnyZodObject): string[] {
  const shape = schema.shape;
  const requiredFields: string[] = [];
  
  for (const [key, value] of Object.entries(shape)) {
    // Check if field is required (not optional, not nullable, not has default)
    if (value instanceof z.ZodString || value instanceof z.ZodNumber) {
      if (!value.isOptional()) {
        requiredFields.push(key);
      }
    }
  }
  
  return requiredFields;
}

// Get sample data for a specific schema
export function getSampleData(schema: z.AnyZodObject): Record<string, any> {
  const headers = getSchemaKeys(schema);
  const sample: Record<string, any> = {};
  
  headers.forEach(key => {
    sample[key] = sampleDataMap[key] || "";
  });
  
  return sample;
}