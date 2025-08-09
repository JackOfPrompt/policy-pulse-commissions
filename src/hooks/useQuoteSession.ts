import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSimpleAuth } from '@/components/auth/SimpleAuthContext';

export interface QuoteSession {
  id: string;
  user_id?: string;
  phone_number: string;
  line_of_business: string;
  product_id?: string;
  selected_insurer_id?: string;
  insured_persons?: any;
  vehicle_details?: any;
  quote_responses?: any;
  selected_quote?: any;
  addons_selected?: any;
  sum_insured?: number;
  premium_amount?: number;
  proposal_data?: any;
  current_step: string;
  is_complete: boolean;
  policy_id?: string;
  payment_status: string;
  payment_gateway?: string;
  created_at: string;
  updated_at: string;
  expires_at: string;
}

export const useQuoteSession = (phoneNumber?: string) => {
  const { user } = useSimpleAuth();
  const [session, setSession] = useState<QuoteSession | null>(null);
  const [loading, setLoading] = useState(false);

  // Load existing session
  useEffect(() => {
    if (user?.id || phoneNumber) {
      loadSession();
    }
  }, [user?.id, phoneNumber]);

  const loadSession = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('quote_sessions')
        .select('*')
        .eq('is_complete', false)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1);

      if (user?.id) {
        query = query.eq('user_id', user.id);
      } else if (phoneNumber) {
        query = query.eq('phone_number', phoneNumber).is('user_id', null);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        setSession(data[0] as QuoteSession);
      }
    } catch (error) {
      console.error('Error loading session:', error);
    } finally {
      setLoading(false);
    }
  };

  const createSession = async (data: Partial<QuoteSession>) => {
    try {
      const sessionData = {
        user_id: user?.id,
        phone_number: phoneNumber || '',
        line_of_business: data.line_of_business || '',
        ...data,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
      };

      const { data: newSession, error } = await supabase
        .from('quote_sessions')
        .insert(sessionData)
        .select()
        .single();

      if (error) throw error;
      
      setSession(newSession as QuoteSession);
      return newSession as QuoteSession;
    } catch (error) {
      console.error('Error creating session:', error);
      return null;
    }
  };

  const updateSession = async (updates: Partial<QuoteSession>) => {
    if (!session) return null;

    try {
      const { data: updatedSession, error } = await supabase
        .from('quote_sessions')
        .update(updates)
        .eq('id', session.id)
        .select()
        .single();

      if (error) throw error;
      
      setSession(updatedSession as QuoteSession);
      return updatedSession as QuoteSession;
    } catch (error) {
      console.error('Error updating session:', error);
      return null;
    }
  };

  const completeSession = async (policyId: string) => {
    if (!session) return null;

    return updateSession({
      is_complete: true,
      policy_id: policyId,
      current_step: 'complete',
      payment_status: 'success'
    });
  };

  const clearSession = () => {
    setSession(null);
  };

  return {
    session,
    loading,
    createSession,
    updateSession,
    completeSession,
    clearSession,
    loadSession
  };
};