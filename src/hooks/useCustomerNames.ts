import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CustomerData {
  [policyId: string]: string;
}

export function useCustomerNames(policyIds: string[]) {
  const [customerNames, setCustomerNames] = useState<CustomerData>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (policyIds.length === 0) return;

    const fetchCustomerNames = async () => {
      try {
        setLoading(true);
        
        const { data: policies, error } = await supabase
          .from('policies')
          .select(`
            id,
            customers!inner(
              first_name,
              last_name,
              company_name
            )
          `)
          .in('id', policyIds);

        if (error) throw error;

        const names: CustomerData = {};
        policies?.forEach((policy: any) => {
          const customer = policy.customers;
          if (customer) {
            names[policy.id] = customer.company_name || 
              `${customer.first_name || ''} ${customer.last_name || ''}`.trim() ||
              'Unknown Customer';
          }
        });

        setCustomerNames(names);
      } catch (error) {
        console.error('Error fetching customer names:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomerNames();
  }, [policyIds.join(',')]);

  return { customerNames, loading };
}