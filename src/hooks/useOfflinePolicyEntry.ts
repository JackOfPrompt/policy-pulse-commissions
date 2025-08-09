import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSimpleAuth } from '@/components/auth/SimpleAuthContext';
import { generateTempPolicyNumber, isTempPolicyNumber } from '@/utils/policyNumberGenerator';

interface OfflinePolicyEntry {
  id: string;
  tempId: string;
  policy_number: string;
  customer_name: string;
  phone_number: string;
  product_id: string;
  premium_amount: number;
  policy_status: 'Draft' | 'Pending Sync' | 'Underwriting';
  line_of_business: string;
  created_at: string;
  created_by_type: 'Employee' | 'Agent';
  created_by_id: string;
  synced: boolean;
  sync_error?: string;
}

const OFFLINE_POLICIES_KEY = 'offline_policies';

export const useOfflinePolicyEntry = () => {
  const { user } = useSimpleAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlinePolicies, setOfflinePolicies] = useState<OfflinePolicyEntry[]>([]);
  const [syncInProgress, setSyncInProgress] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  useEffect(() => {
    // Load offline policies from localStorage
    loadOfflinePolicies();

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true);
      syncOfflinePolicies();
    };
    
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Auto-sync when component mounts if online
    if (navigator.onLine) {
      syncOfflinePolicies();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadOfflinePolicies = () => {
    try {
      const stored = localStorage.getItem(OFFLINE_POLICIES_KEY);
      if (stored) {
        const policies = JSON.parse(stored);
        setOfflinePolicies(policies);
        setPendingSyncCount(policies.filter((p: OfflinePolicyEntry) => !p.synced).length);
      }
    } catch (error) {
      console.error('Error loading offline policies:', error);
    }
  };

  const saveOfflinePolicies = (policies: OfflinePolicyEntry[]) => {
    try {
      localStorage.setItem(OFFLINE_POLICIES_KEY, JSON.stringify(policies));
      setOfflinePolicies(policies);
      setPendingSyncCount(policies.filter(p => !p.synced).length);
    } catch (error) {
      console.error('Error saving offline policies:', error);
    }
  };

  const createOfflinePolicy = async (policyData: Partial<OfflinePolicyEntry>) => {
    const tempId = generateTempPolicyNumber();
    
    // Get user details
    let createdById = '';
    let createdByType: 'Employee' | 'Agent' = 'Employee';
    
    if (user?.role === 'Employee') {
      const { data: employee } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', user.id)
        .single();
      createdById = employee?.id || '';
      createdByType = 'Employee';
    } else if (user?.role === 'Agent') {
      const { data: agent } = await supabase
        .from('agents')
        .select('id')
        .eq('user_id', user.id)
        .single();
      createdById = agent?.id || '';
      createdByType = 'Agent';
    }

    const newPolicy: OfflinePolicyEntry = {
      id: '',
      tempId,
      policy_number: policyData.policy_number || tempId,
      customer_name: policyData.customer_name || '',
      phone_number: policyData.phone_number || '',
      product_id: policyData.product_id || '',
      premium_amount: policyData.premium_amount || 0,
      policy_status: isOnline ? 'Underwriting' : 'Pending Sync',
      line_of_business: policyData.line_of_business || '',
      created_at: new Date().toISOString(),
      created_by_type: createdByType,
      created_by_id: createdById,
      synced: false,
    };

    if (isOnline) {
      // Try to sync immediately if online
      try {
        const syncResult = await syncSinglePolicy(newPolicy);
        if (syncResult.success) {
          newPolicy.synced = true;
          newPolicy.id = syncResult.id || '';
          newPolicy.policy_status = 'Underwriting';
        }
      } catch (error) {
        console.error('Failed to sync policy immediately:', error);
      }
    }

    const updatedPolicies = [...offlinePolicies, newPolicy];
    saveOfflinePolicies(updatedPolicies);

    return newPolicy;
  };

  const syncSinglePolicy = async (policy: OfflinePolicyEntry) => {
    try {
      const { data, error } = await supabase
        .from('policies_new')
        .insert({
          policy_number: isTempPolicyNumber(policy.policy_number) ? null : policy.policy_number,
          product_id: policy.product_id || null,
          customer_name: policy.customer_name,
          premium_amount: policy.premium_amount,
          policy_status: 'Underwriting',
          line_of_business: policy.line_of_business,
          created_by_type: policy.created_by_type,
          employee_id: policy.created_by_type === 'Employee' ? policy.created_by_id : null,
          agent_id: policy.created_by_type === 'Agent' ? policy.created_by_id : null,
          insurer_id: null,
          policy_start_date: new Date().toISOString().split('T')[0],
          policy_end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return { success: true, id: data.id, policy_number: data.policy_number };
    } catch (error) {
      console.error('Error syncing policy:', error);
      return { success: false, error: error.message };
    }
  };

  const syncOfflinePolicies = async () => {
    if (!isOnline || syncInProgress) return;

    setSyncInProgress(true);
    
    try {
      const unsynced = offlinePolicies.filter(p => !p.synced);
      const syncResults = [];

      for (const policy of unsynced) {
        const result = await syncSinglePolicy(policy);
        syncResults.push({ policy, result });
        
        // Update local policy with sync result
        if (result.success) {
          policy.synced = true;
          policy.id = result.id || '';
          policy.policy_number = result.policy_number || policy.policy_number;
          policy.policy_status = 'Underwriting';
          delete policy.sync_error;
        } else {
          policy.sync_error = result.error;
        }
      }

      // Save updated policies
      saveOfflinePolicies([...offlinePolicies]);
      
      return syncResults;
    } catch (error) {
      console.error('Error during bulk sync:', error);
    } finally {
      setSyncInProgress(false);
    }
  };

  const deleteOfflinePolicy = (tempId: string) => {
    const updatedPolicies = offlinePolicies.filter(p => p.tempId !== tempId);
    saveOfflinePolicies(updatedPolicies);
  };

  const clearSyncedPolicies = () => {
    const unsynced = offlinePolicies.filter(p => !p.synced);
    saveOfflinePolicies(unsynced);
  };

  return {
    isOnline,
    offlinePolicies,
    pendingSyncCount,
    syncInProgress,
    createOfflinePolicy,
    syncOfflinePolicies,
    deleteOfflinePolicy,
    clearSyncedPolicies,
  };
};