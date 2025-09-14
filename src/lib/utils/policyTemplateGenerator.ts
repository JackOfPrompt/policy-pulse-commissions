import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import {
  LIFE_POLICY_HEADERS,
  HEALTH_POLICY_HEADERS,
  MOTOR_POLICY_HEADERS,
  LIFE_POLICY_SAMPLE,
  HEALTH_POLICY_SAMPLE,
  MOTOR_POLICY_SAMPLE
} from "@/lib/schemas/policySchemas";

export type PolicyType = 'life' | 'health' | 'motor';

// Generate CSV template for specific policy type
export function downloadPolicyCsvTemplate(type: PolicyType, withSample = true) {
  let headers: string[];
  let sampleData: any;
  
  switch (type) {
    case 'life':
      headers = LIFE_POLICY_HEADERS;
      sampleData = LIFE_POLICY_SAMPLE;
      break;
    case 'health':
      headers = HEALTH_POLICY_HEADERS;
      sampleData = HEALTH_POLICY_SAMPLE;
      break;
    case 'motor':
      headers = MOTOR_POLICY_HEADERS;
      sampleData = MOTOR_POLICY_SAMPLE;
      break;
    default:
      throw new Error(`Unsupported policy type: ${type}`);
  }

  let csvContent = headers.join(",") + "\n";

  if (withSample) {
    const sampleRow = headers.map(header => {
      const value = sampleData[header] || "";
      // Escape commas and quotes in CSV
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(",");
    csvContent += sampleRow + "\n";
  }

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  saveAs(blob, `${type}_policies_template.csv`);
}

// Generate XLSX template for specific policy type
export function downloadPolicyXlsxTemplate(type: PolicyType, withSample = true) {
  let headers: string[];
  let sampleData: any;
  
  switch (type) {
    case 'life':
      headers = LIFE_POLICY_HEADERS;
      sampleData = LIFE_POLICY_SAMPLE;
      break;
    case 'health':
      headers = HEALTH_POLICY_HEADERS;
      sampleData = HEALTH_POLICY_SAMPLE;
      break;
    case 'motor':
      headers = MOTOR_POLICY_HEADERS;
      sampleData = MOTOR_POLICY_SAMPLE;
      break;
    default:
      throw new Error(`Unsupported policy type: ${type}`);
  }

  const rows: any[][] = [headers];

  if (withSample) {
    const sampleRow = headers.map(header => sampleData[header] || "");
    rows.push(sampleRow);
  }

  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Template");

  XLSX.writeFile(workbook, `${type}_policies_template.xlsx`);
}

// Get template headers for display
export function getPolicyTemplateHeaders(type: PolicyType): string[] {
  switch (type) {
    case 'life':
      return LIFE_POLICY_HEADERS;
    case 'health':
      return HEALTH_POLICY_HEADERS;
    case 'motor':
      return MOTOR_POLICY_HEADERS;
    default:
      return [];
  }
}

// Get required fields for validation
export function getPolicyRequiredFields(type: PolicyType): string[] {
  // Base required fields for all policy types
  const baseRequired = [
    'org_id',
    'customer_id', 
    'policy_number',
    'product_type_id'
  ];

  switch (type) {
    case 'life':
      return [...baseRequired, 'sum_assured'];
    case 'health':
      return [...baseRequired, 'sum_insured'];
    case 'motor':
      return [...baseRequired, 'vehicle_number', 'idv'];
    default:
      return baseRequired;
  }
}

// Get sample data for a specific policy type
export function getPolicySampleData(type: PolicyType): Record<string, any> {
  switch (type) {
    case 'life':
      return LIFE_POLICY_SAMPLE;
    case 'health':
      return HEALTH_POLICY_SAMPLE;
    case 'motor':
      return MOTOR_POLICY_SAMPLE;
    default:
      return {};
  }
}