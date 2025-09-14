export interface Plan {
  id: string;
  name: string;
  description: string;
  features: {
    modules: string[];
    limits: string;
  };
  price_monthly: number;
  price_yearly: number;
  trial_period_days: number;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  org_id: string;
  plan_id: string;
  status: 'trialing' | 'active' | 'expired' | 'canceled';
  start_date: string;
  end_date?: string;
  trial_end?: string;
  cancel_at?: string;
  created_at: string;
  updated_at: string;
  plan?: Plan;
}

export interface SubscriptionWithPlan extends Subscription {
  plan: Plan;
}

export type BillingPeriod = 'monthly' | 'yearly';

export interface UpgradeRequest {
  org_id: string;
  plan_id: string;
  billing_period: BillingPeriod;
}