import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface CommissionCalculationResult {
  policy_id: string;
  policy_number: string;
  product_type: string;
  customer_name: string;
  premium_amount: number;
  provider: string;
  source_type: string;
  source_name: string;
  commission_rate: number;
  reward_rate?: number;
  bonus_rate?: number;
  insurer_commission: number;
  agent_commission: number;
  misp_commission: number;
  employee_commission: number;
  broker_share: number;
  commission_status: string;
  grid_table: string;
  grid_id: string;
  calc_date: string;
}

// Temporarily export the simplified version
export { useCommissionCalculation } from '@/hooks/useCommissionCalculationTemp';
