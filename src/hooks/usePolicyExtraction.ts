import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface PolicyExtractionResult {
  success: boolean;
  filePath: string;
  extracted: Record<string, any>;
}

export interface PolicyData {
  id: string;
  policyNumber: string;
  customerName: string;
  productType: string;
  status: 'draft' | 'finalized';
  createdAt: string;
  extractedData: Record<string, any>;
  metadata: {
    fileName: string;
    fileSize: number;
    uploadedBy: string;
    role: string;
    agentId?: string;
  };
}

export function usePolicyExtraction() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PolicyExtractionResult | null>(null);

  const extractPolicy = useCallback(async (filePath: string, productType?: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data: result, error } = await supabase.functions.invoke('extract-policy', {
        body: { filePath }
      });

      if (error) {
        throw new Error(`Failed to extract policy: ${error.message}`);
      }

      // Handle both success and failure cases from edge function
      if (result) {
        setData(result);
        if (result.success && result.extracted) {
          // Add product type to extracted data if provided
          if (productType && result.extracted.policy) {
            result.extracted.policy.PRODUCT_TYPE = productType;
          }
          
          // Save current extraction (temporary)
          localStorage.setItem(
            "current_policy_extraction",
            JSON.stringify(result.extracted)
          );
        }
      } else {
        throw new Error("No response from extraction service");
      }
    } catch (err: any) {
      setError(err.message);
      setData({
        success: false,
        filePath: filePath,
        extracted: {}
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const savePolicyDraft = useCallback((extractedData: Record<string, any>, metadata: any) => {
    const policyId = `policy_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const policyData: PolicyData = {
      id: policyId,
      policyNumber: extractedData.policy?.POLICY_NUMBER || 'Unknown',
      customerName: extractedData.customer?.CUSTOMER_NAME || 'Unknown',
      productType: extractedData.policy?.PRODUCT_TYPE || 'general',
      status: 'draft',
      createdAt: new Date().toISOString(),
      extractedData,
      metadata
    };

    // Get existing policies array
    const existing = JSON.parse(localStorage.getItem("policies") || "[]");
    existing.push(policyData);
    localStorage.setItem("policies", JSON.stringify(existing));

    return policyId;
  }, []);

  const finalizePolicyData = useCallback((policyId: string, finalData: Record<string, any>) => {
    const existing = JSON.parse(localStorage.getItem("policies") || "[]");
    const policyIndex = existing.findIndex((p: PolicyData) => p.id === policyId);
    
    if (policyIndex !== -1) {
      existing[policyIndex] = {
        ...existing[policyIndex],
        status: 'finalized',
        extractedData: finalData,
        finalizedAt: new Date().toISOString()
      };
      localStorage.setItem("policies", JSON.stringify(existing));
    }
  }, []);

  const getPolicies = useCallback((): PolicyData[] => {
    return JSON.parse(localStorage.getItem("policies") || "[]");
  }, []);

  const getPolicyById = useCallback((id: string): PolicyData | null => {
    const policies = getPolicies();
    return policies.find((p: PolicyData) => p.id === id) || null;
  }, [getPolicies]);

  const clearExtraction = useCallback(() => {
    setData(null);
    localStorage.removeItem("current_policy_extraction");
  }, []);

  const loadFromStorage = useCallback(() => {
    const stored = localStorage.getItem("current_policy_extraction");
    if (stored) {
      setData({
        success: true,
        filePath: "localStorage",
        extracted: JSON.parse(stored),
      });
    }
  }, []);

  return {
    loading,
    error,
    data,
    extractPolicy,
    savePolicyDraft,
    finalizePolicyData,
    getPolicies,
    getPolicyById,
    clearExtraction,
    loadFromStorage,
  };
}