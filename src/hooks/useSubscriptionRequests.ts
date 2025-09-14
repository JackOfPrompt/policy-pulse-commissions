import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SubscriptionUpgradeRequest {
  id: string;
  org_id: string;
  current_plan_id: string;
  requested_plan_id: string;
  status: string;
  justification?: string;
  attachment_urls: string[];
  created_by: string;
  reviewed_by?: string;
  created_at: string;
  updated_at: string;
  // Joined data - making them optional and flexible
  organization?: any;
  current_plan?: any;
  requested_plan?: any;
  creator?: any;
}

export const useSubscriptionRequests = () => {
  const [requests, setRequests] = useState<SubscriptionUpgradeRequest[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('subscription_upgrade_requests')
        .select(`
          *,
          organization:organizations!org_id(name),
          current_plan:plans!current_plan_id(name),
          requested_plan:plans!requested_plan_id(name),
          creator:profiles!created_by(full_name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching requests:', error);
        throw error;
      }

      setRequests(data as SubscriptionUpgradeRequest[] || []);
    } catch (error) {
      toast.error('Failed to fetch upgrade requests');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const createRequest = async (requestData: {
    current_plan_id: string;
    requested_plan_id: string;
    justification?: string;
    attachment_urls?: string[];
  }) => {
    try {
      // Get user's org_id
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('org_id')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!userProfile?.org_id) {
        throw new Error('User organization not found');
      }

      const { error } = await supabase
        .from('subscription_upgrade_requests')
        .insert({
          org_id: userProfile.org_id,
          current_plan_id: requestData.current_plan_id,
          requested_plan_id: requestData.requested_plan_id,
          justification: requestData.justification,
          attachment_urls: requestData.attachment_urls || [],
          created_by: (await supabase.auth.getUser()).data.user?.id
        });

      if (error) throw error;

      toast.success('Upgrade request submitted successfully');
      fetchRequests();
      return true;
    } catch (error) {
      toast.error('Failed to submit upgrade request');
      console.error('Error:', error);
      return false;
    }
  };

  const reviewRequest = async (requestId: string, status: 'approved' | 'rejected') => {
    try {
      const updates: any = {
        status,
        reviewed_by: (await supabase.auth.getUser()).data.user?.id,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('subscription_upgrade_requests')
        .update(updates)
        .eq('id', requestId);

      if (error) throw error;

      // If approved, update the organization's subscription
      if (status === 'approved') {
        const request = requests.find(r => r.id === requestId);
        if (request) {
          const { error: subscriptionError } = await supabase
            .from('subscriptions')
            .update({ plan_id: request.requested_plan_id })
            .eq('org_id', request.org_id);

          if (subscriptionError) {
            console.error('Error updating subscription:', subscriptionError);
            toast.error('Request approved but failed to update subscription');
          }
        }
      }

      toast.success(`Request ${status} successfully`);
      fetchRequests();
      return true;
    } catch (error) {
      toast.error(`Failed to ${status} request`);
      console.error('Error:', error);
      return false;
    }
  };

  const uploadFile = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('upgrade-requests')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('upgrade-requests')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file');
      return null;
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  return {
    requests,
    loading,
    fetchRequests,
    createRequest,
    reviewRequest,
    uploadFile
  };
};