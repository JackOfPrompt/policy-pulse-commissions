import { useState, useCallback } from "react";
import { parsePolicyCSV, ParsedCSVResult } from "../lib/utils/csvPolicyParser";
import { toast } from "sonner";

interface UsePolicyCSVParserReturn {
  parseFile: (file: File) => Promise<void>;
  isLoading: boolean;
  result: ParsedCSVResult<any> | null;
  error: string | null;
  reset: () => void;
}

export function usePolicyCSVParser(): UsePolicyCSVParserReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ParsedCSVResult<any> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const parseFile = useCallback(async (file: File) => {
    if (!file) {
      setError("No file provided");
      return;
    }

    if (!file.name.endsWith('.csv')) {
      setError("File must be a CSV file");
      toast.error("Please upload a CSV file");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const parsed = await parsePolicyCSV(file);
      setResult(parsed);
      
      const { validRows, invalidRows, policyType } = parsed;
      
      toast.success(
        `Parsed ${policyType} policy CSV: ${validRows.length} valid rows, ${invalidRows.length} invalid rows`
      );
      
      if (invalidRows.length > 0) {
        console.warn("Invalid rows found:", invalidRows);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to parse CSV file";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    parseFile,
    isLoading,
    result,
    error,
    reset,
  };
}