import Papa from "papaparse";
import {
  LifePolicyBulkSchema,
  HealthPolicyBulkSchema,
  MotorPolicyBulkSchema,
} from "../schemas/policySchemas";

export interface ParsedCSVResult<T> {
  fileName: string;
  policyType: "life" | "health" | "motor";
  validRows: T[];
  invalidRows: { row: any; errors: string[]; rowIndex: number }[];
}

// Utility: detect policy type from file name
function detectPolicyType(fileName: string): "life" | "health" | "motor" {
  const lower = fileName.toLowerCase();
  
  // Check for exact matches first
  if (lower.includes("life") || lower.includes("term") || lower.includes("endowment")) return "life";
  if (lower.includes("health") || lower.includes("medical") || lower.includes("mediclaim")) return "health";
  if (lower.includes("motor") || lower.includes("vehicle") || lower.includes("auto") || lower.includes("car")) return "motor";
  
  throw new Error(
    `❌ Could not detect policy type for "${fileName}". File name must include keywords like 'life', 'health', 'motor', 'vehicle', 'medical', etc.`
  );
}

// Utility: pick schema based on policy type
function getSchema(type: "life" | "health" | "motor") {
  switch (type) {
    case "life":
      return LifePolicyBulkSchema;
    case "health":
      return HealthPolicyBulkSchema;
    case "motor":
      return MotorPolicyBulkSchema;
  }
}

/**
 * Parse CSV → JSON with Zod validation
 * Auto-detects schema from file name (life/health/motor)
 * @param file CSV file (File object from input)
 */
export async function parsePolicyCSV<T>(
  file: File
): Promise<ParsedCSVResult<T>> {
  const policyType = detectPolicyType(file.name);
  const schema = getSchema(policyType);

  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const validRows: T[] = [];
        const invalidRows: { row: any; errors: string[]; rowIndex: number }[] = [];

        results.data.forEach((row: any, index: number) => {
          const parsed = schema.safeParse(row);

          if (parsed.success) {
            validRows.push(parsed.data as T);
          } else {
            invalidRows.push({
              row,
              errors: parsed.error.errors.map(
                (err) => `${err.path.join(".")}: ${err.message}`
              ),
              rowIndex: index + 2, // +2 → account for header row + 1-based index
            });
          }
        });

        resolve({ fileName: file.name, policyType, validRows, invalidRows });
      },
      error: (error) => {
        reject(error);
      },
    });
  });
}

// Parse a single CSV file
function parseSingleCSV<T>(
  file: File,
  policyType: "life" | "health" | "motor",
  schema: any
): Promise<ParsedCSVResult<T>> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const validRows: T[] = [];
        const invalidRows: { row: any; errors: string[]; rowIndex: number }[] = [];

        results.data.forEach((row: any, index: number) => {
          const parsed = schema.safeParse(row);

          if (parsed.success) {
            validRows.push(parsed.data as T);
          } else {
            invalidRows.push({
              row,
              errors: parsed.error.errors.map(
                (err) => `${err.path.join(".")}: ${err.message}`
              ),
              rowIndex: index + 2, // account for header row
            });
          }
        });

        resolve({
          fileName: file.name,
          policyType,
          validRows,
          invalidRows,
        });
      },
      error: (error) => reject(error),
    });
  });
}

/**
 * Parse multiple CSV files → JSON with Zod validation
 * @param files File[] (from <input type="file" multiple />)
 */
export async function parseMultiplePolicyCSVs<T>(
  files: File[]
): Promise<ParsedCSVResult<T>[]> {
  const results: ParsedCSVResult<T>[] = [];

  for (const file of files) {
    try {
      const policyType = detectPolicyType(file.name);
      const schema = getSchema(policyType);
      const parsed = await parseSingleCSV<T>(file, policyType, schema);
      results.push(parsed);
    } catch (error) {
      // Add failed file with error information
      results.push({
        fileName: file.name,
        policyType: "life", // fallback
        validRows: [],
        invalidRows: [{
          row: {},
          errors: [error instanceof Error ? error.message : "Failed to parse file"],
          rowIndex: 0
        }]
      });
    }
  }

  return results;
}

/**
 * Generate CSV template for download based on policy type
 */
export function generateCSVTemplate(policyType: "life" | "health" | "motor"): string {
  const schema = getSchema(policyType);
  
  // Get the sample data based on policy type
  let sampleData: any;
  switch (policyType) {
    case "life":
      const { LIFE_POLICY_HEADERS, LIFE_POLICY_SAMPLE } = require("../schemas/policySchemas");
      sampleData = LIFE_POLICY_SAMPLE;
      break;
    case "health":
      const { HEALTH_POLICY_HEADERS, HEALTH_POLICY_SAMPLE } = require("../schemas/policySchemas");
      sampleData = HEALTH_POLICY_SAMPLE;
      break;
    case "motor":
      const { MOTOR_POLICY_HEADERS, MOTOR_POLICY_SAMPLE } = require("../schemas/policySchemas");
      sampleData = MOTOR_POLICY_SAMPLE;
      break;
  }

  // Convert to CSV format
  const headers = Object.keys(sampleData);
  const values = Object.values(sampleData);
  
  return [headers.join(","), values.join(",")].join("\n");
}