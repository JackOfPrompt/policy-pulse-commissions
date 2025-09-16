import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ReportsData {
  totalPremium: number;
  totalCommissions: number;
  totalPolicies: number;
  avgCommissionRate: number;
  pendingPayouts: number;
  commissionByProduct: Array<{
    product_type: string;
    total_amount: number;
    count: number;
  }>;
  commissionByProvider: Array<{
    provider: string;
    total_amount: number;
    count: number;
  }>;
  policyRenewalRate: number;
  claimsRatio: number;
}

type Range = { start?: string; end?: string };

export function useReportsData(range?: Range) {
  const [data, setData] = useState<ReportsData>({
    totalPremium: 0,
    totalCommissions: 0,
    totalPolicies: 0,
    avgCommissionRate: 0,
    pendingPayouts: 0,
    commissionByProduct: [],
    commissionByProvider: [],
    policyRenewalRate: 0,
    claimsRatio: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReportsData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get enhanced commission distribution report from the view
      let query = supabase
        .from('policy_commission_distribution_view')
        .select('*');

      // Apply date filters
      if (range?.start) {
        query = query.gte('calc_date', range.start);
      }
      if (range?.end) {
        query = query.lte('calc_date', range.end);
      }

      const { data: commissionDistribution, error: distributionError } = await query;

      if (distributionError) throw distributionError;

      // Calculate summary metrics from commission distribution
      const totalPremium = commissionDistribution?.reduce((sum: number, c: any) => 
        sum + (parseFloat(String(c.premium_amount)) || 0), 0) || 0;
      
      const totalCommissions = commissionDistribution?.reduce((sum: number, c: any) => 
        sum + (parseFloat(String(c.insurer_commission_amount)) || 0), 0) || 0;
      
      const totalPolicies = commissionDistribution?.length || 0;
      
      const avgCommissionRate = commissionDistribution?.length > 0 
        ? commissionDistribution.reduce((sum: number, c: any) => 
            sum + (parseFloat(String(c.insurer_commission_rate)) || 0), 0) / commissionDistribution.length 
        : 0;
      
      const pendingPayouts = commissionDistribution?.filter((c: any) => 
        c.commission_status === 'calculated').length || 0;

      // Group by product type
      const commissionByProduct = commissionDistribution?.reduce((acc: any[], commission: any) => {
        const productType = commission.product_type || 'Unknown';
        const existing = acc.find(item => item.product_type === productType);
        const amount = parseFloat(String(commission.insurer_commission_amount)) || 0;
        
        if (existing) {
          existing.total_amount += amount;
          existing.count += 1;
        } else {
          acc.push({
            product_type: productType,
            total_amount: amount,
            count: 1
          });
        }
        return acc;
      }, []) || [];

      // Group by provider
      const commissionByProvider = commissionDistribution?.reduce((acc: any[], commission: any) => {
        const provider = commission.provider || 'Unknown';
        const existing = acc.find(item => item.provider === provider);
        const amount = parseFloat(String(commission.insurer_commission_amount)) || 0;
        
        if (existing) {
          existing.total_amount += amount;
          existing.count += 1;
        } else {
          acc.push({
            provider,
            total_amount: amount,
            count: 1
          });
        }
        return acc;
      }, []) || [];

      setData({
        totalPremium,
        totalCommissions,
        totalPolicies,
        avgCommissionRate,
        pendingPayouts,
        commissionByProduct,
        commissionByProvider,
        policyRenewalRate: 89, // Mock for now
        claimsRatio: 12.5 // Mock for now
      });

    } catch (err) {
      console.error('Error fetching reports data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch reports data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportsData();
  }, [range?.start, range?.end]);

  return {
    data,
    loading,
    error,
    refetch: fetchReportsData
  };
}