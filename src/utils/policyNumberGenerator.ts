import { supabase } from '@/integrations/supabase/client';

/**
 * Generates a unique policy number using database sequence
 * Format: POL-YYYY-NNNNNNN (e.g., POL-2025-1000001)
 */
export const generatePolicyNumber = async (): Promise<string> => {
  try {
    const { data, error } = await supabase.rpc('generate_policy_number');
    
    if (error) {
      console.error('Error generating policy number:', error);
      // Fallback to timestamp-based generation if database function fails
      return `POL-${new Date().getFullYear()}-${Date.now()}`;
    }
    
    return data;
  } catch (error) {
    console.error('Error calling policy number generation function:', error);
    // Fallback to timestamp-based generation
    return `POL-${new Date().getFullYear()}-${Date.now()}`;
  }
};

/**
 * Validates policy number format
 * Accepts formats: POL-YYYY-NNNNNNN, POL-NNNNNNNNNN, TEMP-XXXXX
 */
export const validatePolicyNumber = (policyNumber: string): boolean => {
  if (!policyNumber) return false;
  
  // Allow temporary policy numbers for offline entries
  if (policyNumber.startsWith('TEMP-')) {
    return policyNumber.length > 5;
  }
  
  // Standard policy number formats
  const patterns = [
    /^POL-\d{4}-\d{7}$/, // POL-YYYY-NNNNNNN
    /^POL-\d{10,}$/,     // POL-NNNNNNNNNN (legacy format)
  ];
  
  return patterns.some(pattern => pattern.test(policyNumber));
};

/**
 * Generates temporary policy number for offline entries
 */
export const generateTempPolicyNumber = (): string => {
  const tempId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  return `TEMP-${tempId}`;
};

/**
 * Checks if policy number is temporary
 */
export const isTempPolicyNumber = (policyNumber: string): boolean => {
  return policyNumber.startsWith('TEMP-');
};

/**
 * Formats policy number for display
 */
export const formatPolicyNumber = (policyNumber: string): string => {
  if (isTempPolicyNumber(policyNumber)) {
    return `${policyNumber} (Temporary)`;
  }
  return policyNumber;
};