import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SubscriptionWithPlan, Plan, BillingPeriod } from '@/types/subscription';
import { toast } from 'sonner';

export const useSubscription = (orgId?: string) => {
  const [subscription, setSubscription] = useState<SubscriptionWithPlan | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    if (orgId) {
      fetchSubscription();
      fetchPlans();
    }
  }, [orgId]);

  const fetchSubscription = async () => {
    if (!orgId) return;

    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          *,
          plan:plans(*)
        `)
        .eq('org_id', orgId)
        .single();

      if (error) {
        console.error('Error fetching subscription:', error);
        return;
      }

      setSubscription(data as SubscriptionWithPlan);
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .order('price_monthly', { ascending: true });

      if (error) {
        console.error('Error fetching plans:', error);
        return;
      }

      // Transform the data to match our Plan interface
      const transformedPlans = (data || []).map(plan => ({
        ...plan,
        features: typeof plan.features === 'string' 
          ? JSON.parse(plan.features) 
          : plan.features
      })) as Plan[];

      setPlans(transformedPlans);
    } catch (error) {
      console.error('Error fetching plans:', error);
    }
  };

  const upgradePlan = async (planId: string, billingPeriod: BillingPeriod = 'monthly') => {
    if (!orgId || !subscription) return false;

    setUpgrading(true);
    try {
      const selectedPlan = plans.find(p => p.id === planId);
      if (!selectedPlan) {
        toast.error('Selected plan not found');
        return false;
      }

      // Calculate end date based on billing period
      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + (billingPeriod === 'yearly' ? 12 : 1));

      const updateData: any = {
        plan_id: planId,
        status: 'active',
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        trial_end: null // Clear trial when upgrading
      };

      const { error } = await supabase
        .from('subscriptions')
        .update(updateData)
        .eq('id', subscription.id);

      if (error) {
        console.error('Error upgrading subscription:', error);
        toast.error('Failed to upgrade subscription');
        return false;
      }

      toast.success(`Successfully upgraded to ${selectedPlan.name} plan!`);
      await fetchSubscription(); // Refresh subscription data
      return true;
    } catch (error) {
      console.error('Error upgrading subscription:', error);
      toast.error('Failed to upgrade subscription');
      return false;
    } finally {
      setUpgrading(false);
    }
  };

  const cancelSubscription = async () => {
    if (!subscription) return false;

    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({
          status: 'canceled',
          cancel_at: new Date().toISOString()
        })
        .eq('id', subscription.id);

      if (error) {
        console.error('Error canceling subscription:', error);
        toast.error('Failed to cancel subscription');
        return false;
      }

      toast.success('Subscription canceled successfully');
      await fetchSubscription(); // Refresh subscription data
      return true;
    } catch (error) {
      console.error('Error canceling subscription:', error);
      toast.error('Failed to cancel subscription');
      return false;
    }
  };

  // Helper functions
  const isTrialExpired = () => {
    if (!subscription?.trial_end) return false;
    return new Date() > new Date(subscription.trial_end);
  };

  const getTrialDaysLeft = () => {
    if (!subscription?.trial_end) return 0;
    const trialEnd = new Date(subscription.trial_end);
    const now = new Date();
    const diffTime = trialEnd.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const isSubscriptionExpired = () => {
    if (!subscription?.end_date) return false;
    return new Date() > new Date(subscription.end_date);
  };

  const hasFeatureAccess = (feature: string) => {
    if (!subscription?.plan) return false;
    
    // If trial is active, allow access
    if (subscription.status === 'trialing' && !isTrialExpired()) {
      return true;
    }

    // If subscription is active and not expired
    if (subscription.status === 'active' && !isSubscriptionExpired()) {
      return subscription.plan.features.modules.includes(feature);
    }

    return false;
  };

  return {
    subscription,
    plans,
    loading,
    upgrading,
    upgradePlan,
    cancelSubscription,
    isTrialExpired,
    getTrialDaysLeft,
    isSubscriptionExpired,
    hasFeatureAccess,
    refetch: fetchSubscription
  };
};