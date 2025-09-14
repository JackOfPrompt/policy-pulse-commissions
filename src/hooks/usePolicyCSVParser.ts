import { useState, useCallback } from "react";
import { 
  parsePolicyCSV, 
  parseMultiplePolicyCSVs,
  ParsedCSVResult 
} from "../lib/utils/csvPolicyParser";
import { toast } from "sonner";

interface UsePolicyCSVParserReturn {
  parseFile: (file: File) => Promise<void>;
  parseMultipleFiles: (files: File[]) => Promise<void>;
  isLoading: boolean;
  singleResult: ParsedCSVResult<any> | null;
  multipleResults: ParsedCSVResult<any>[] | null;
  error: string | null;
  reset: () => void;
}

export function usePolicyCSVParser(): UsePolicyCSVParserReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [singleResult, setSingleResult] = useState<ParsedCSVResult<any> | null>(null);
  const [multipleResults, setMultipleResults] = useState<ParsedCSVResult<any>[] | null>(null);
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
    setSingleResult(null);
    setMultipleResults(null);

    try {
      const parsed = await parsePolicyCSV(file);
      setSingleResult(parsed);
      
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

  const parseMultipleFiles = useCallback(async (files: File[]) => {
    if (!files || files.length === 0) {
      setError("No files provided");
      return;
    }

    const csvFiles = files.filter(file => file.name.endsWith('.csv'));
    if (csvFiles.length === 0) {
      setError("No CSV files found");
      toast.error("Please upload CSV files");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSingleResult(null);
    setMultipleResults(null);

    try {
      const results = await parseMultiplePolicyCSVs(csvFiles);
      setMultipleResults(results);
      
      const totalValid = results.reduce((sum, result) => sum + result.validRows.length, 0);
      const totalInvalid = results.reduce((sum, result) => sum + result.invalidRows.length, 0);
      
      toast.success(
        `Parsed ${results.length} CSV files: ${totalValid} total valid rows, ${totalInvalid} total invalid rows`
      );
      
      // Log details for each file
      results.forEach(({ fileName, policyType, validRows, invalidRows }) => {
        console.log(`📂 File: ${fileName} (${policyType})`);
        console.log("✅ Valid rows:", validRows.length);
        console.log("❌ Invalid rows:", invalidRows.length);
        if (invalidRows.length > 0) {
          console.warn("Invalid rows:", invalidRows);
        }
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to parse CSV files";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setSingleResult(null);
    setMultipleResults(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    parseFile,
    parseMultipleFiles,
    isLoading,
    singleResult,
    multipleResults,
    error,
    reset,
  };
}