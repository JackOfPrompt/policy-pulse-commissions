import { z } from "zod";
import {
  BranchesSchema,
  EmployeeSchema,
  AgentSchema,
  MispSchema,
} from "./index";

// ==========================================================
// Bulk Upload Wrappers
// ==========================================================

// CSV/XLS rows are all strings → coerce + make fields optional
const CsvSafe = <T extends z.ZodRawShape>(schema: z.ZodObject<T>) => {
  return schema.partial().transform((row) => {
    const normalized: any = {};
    for (const key in row) {
      if (row[key] === "" || row[key] === null || row[key] === undefined) {
        normalized[key] = undefined;
      } else {
        normalized[key] = row[key];
      }
    }
    return normalized;
  });
};

// Bulk schemas (array of rows)
export const BulkBranchesSchema = z.array(CsvSafe(BranchesSchema));
export const BulkEmployeesSchema = z.array(CsvSafe(EmployeeSchema));
export const BulkAgentsSchema = z.array(CsvSafe(AgentSchema));
export const BulkMispsSchema = z.array(CsvSafe(MispSchema));

// Export types
export type BulkBranchData = z.infer<typeof BulkBranchesSchema>;
export type BulkEmployeeData = z.infer<typeof BulkEmployeesSchema>;
export type BulkAgentData = z.infer<typeof BulkAgentsSchema>;
export type BulkMispData = z.infer<typeof BulkMispsSchema>;