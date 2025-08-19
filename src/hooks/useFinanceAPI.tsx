import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export const useFinanceAPI = () => {
  const { profile } = useAuth();
  const { toast } = useToast();

  const callFinanceAPI = async (action: string, data?: any, params?: any) => {
    try {
      const { data: result, error } = await supabase.functions.invoke('finance-management', {
        body: {
          action,
          tenant_id: profile?.tenant_id,
          data,
          params
        }
      });

      if (error) throw error;
      return result;
    } catch (error) {
      console.error(`Finance API Error (${action}):`, error);
      toast({
        title: "Error",
        description: `Failed to ${action.replace('_', ' ')}`,
        variant: "destructive",
      });
      throw error;
    }
  };

  // Dashboard KPIs
  const getDashboardKPIs = () => callFinanceAPI('get_dashboard_kpis');

  // Accounts
  const getAccounts = (params?: any) => callFinanceAPI('get_accounts', null, params);
  const createAccount = (data: any) => callFinanceAPI('create_account', data);
  const updateAccount = (data: any) => callFinanceAPI('update_account', data);

  // Journals
  const getJournals = (params?: any) => callFinanceAPI('get_journals', null, params);
  const createJournal = (data: any) => callFinanceAPI('create_journal', data);
  const postJournal = (journal_id: string) => callFinanceAPI('post_journal', { journal_id });

  // Settlements
  const getSettlements = (params?: any) => callFinanceAPI('get_settlements', null, params);
  const createSettlement = (data: any) => callFinanceAPI('create_settlement', data);
  const approveSettlement = (data: any) => callFinanceAPI('approve_settlement', data);

  // Payouts
  const getPayouts = (params?: any) => callFinanceAPI('get_payouts', null, params);
  const createPayout = (data: any) => callFinanceAPI('create_payout', data);
  const approvePayout = (data: any) => callFinanceAPI('approve_payout', data);
  const markPayoutPaid = (data: any) => callFinanceAPI('mark_payout_paid', data);

  // Variances
  const getVariances = (params?: any) => callFinanceAPI('get_variances', null, params);
  const createVariance = (data: any) => callFinanceAPI('create_variance', data);
  const resolveVariance = (data: any) => callFinanceAPI('resolve_variance', data);

  return {
    // Dashboard
    getDashboardKPIs,
    
    // Accounts
    getAccounts,
    createAccount,
    updateAccount,
    
    // Journals
    getJournals,
    createJournal,
    postJournal,
    
    // Settlements
    getSettlements,
    createSettlement,
    approveSettlement,
    
    // Payouts
    getPayouts,
    createPayout,
    approvePayout,
    markPayoutPaid,
    
    // Variances
    getVariances,
    createVariance,
    resolveVariance,
  };
};