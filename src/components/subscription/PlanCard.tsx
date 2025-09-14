import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plan, BillingPeriod } from "@/types/subscription";
import { Check, Crown, Zap } from "lucide-react";
import { useState } from "react";

interface PlanCardProps {
  plan: Plan;
  currentPlanId?: string;
  onUpgrade: (planId: string, billingPeriod: BillingPeriod) => Promise<boolean>;
  upgrading: boolean;
  isTrialing?: boolean;
}

export const PlanCard = ({ plan, currentPlanId, onUpgrade, upgrading, isTrialing = false }: PlanCardProps) => {
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly');
  
  const isCurrentPlan = currentPlanId === plan.id;
  const price = billingPeriod === 'monthly' ? plan.price_monthly : plan.price_yearly;
  const displayPrice = price / 100; // Convert from cents
  
  const getPlanIcon = () => {
    switch (plan.name) {
      case 'free':
        return <Zap className="h-6 w-6 text-muted-foreground" />;
      case 'pro':
        return <Check className="h-6 w-6 text-primary" />;
      case 'enterprise':
        return <Crown className="h-6 w-6 text-gradient-primary" />;
      default:
        return null;
    }
  };

  const getPlanVariant = () => {
    switch (plan.name) {
      case 'free':
        return 'secondary';
      case 'pro':
        return 'default';
      case 'enterprise':
        return 'premium';
      default:
        return 'default';
    }
  };

  const getFeatures = () => {
    const baseFeatures = ['CRM Access', 'User Management', 'Basic Reports'];
    
    switch (plan.name) {
      case 'free':
        return [...baseFeatures, `${plan.trial_period_days} days trial`];
      case 'pro':
        return [...baseFeatures, 'Advanced Reports', 'API Access', 'Priority Support'];
      case 'enterprise':
        return [...baseFeatures, 'Online Policy Purchase', 'Custom Integrations', 'Dedicated Support', 'Advanced Analytics'];
      default:
        return baseFeatures;
    }
  };

  const handleUpgrade = async () => {
    await onUpgrade(plan.id, billingPeriod);
  };

  const getButtonText = () => {
    if (upgrading) return 'Upgrading...';
    if (isCurrentPlan) return 'Current Plan';
    if (plan.name === 'free') return 'Downgrade';
    return 'Choose Plan';
  };

  const getButtonVariant = () => {
    if (isCurrentPlan) return 'secondary';
    if (plan.name === 'enterprise') return 'premium';
    return 'default';
  };

  return (
    <Card className={`relative transition-all duration-200 hover:shadow-lg ${
      plan.name === 'pro' ? 'border-primary shadow-md' : ''
    } ${plan.name === 'enterprise' ? 'border-gradient-primary shadow-glow' : ''}`}>
      {plan.name === 'pro' && (
        <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground">
          Most Popular
        </Badge>
      )}
      
      <CardHeader className="text-center">
        <div className="flex justify-center mb-2">
          {getPlanIcon()}
        </div>
        <CardTitle className="capitalize text-2xl">{plan.name}</CardTitle>
        <CardDescription className="text-sm">{plan.description}</CardDescription>
        
        <div className="mt-4">
          {plan.name !== 'free' && (
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Button
                variant={billingPeriod === 'monthly' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setBillingPeriod('monthly')}
                disabled={upgrading}
              >
                Monthly
              </Button>
              <Button
                variant={billingPeriod === 'yearly' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setBillingPeriod('yearly')}
                disabled={upgrading}
              >
                Yearly
              </Button>
            </div>
          )}
          
          <div className="text-center">
            {plan.name === 'free' ? (
              <div>
                <span className="text-3xl font-bold">Free</span>
                <span className="text-muted-foreground">/trial</span>
              </div>
            ) : (
              <div>
                <span className="text-3xl font-bold">₹{displayPrice.toLocaleString()}</span>
                <span className="text-muted-foreground">/{billingPeriod === 'monthly' ? 'month' : 'year'}</span>
                {billingPeriod === 'yearly' && (
                  <div className="text-sm text-success">Save 2 months</div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <ul className="space-y-2">
          {getFeatures().map((feature, index) => (
            <li key={index} className="flex items-center space-x-2">
              <Check className="h-4 w-4 text-success" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter>
        <Button 
          className="w-full" 
          variant={getButtonVariant() as any}
          onClick={handleUpgrade}
          disabled={upgrading || isCurrentPlan}
        >
          {getButtonText()}
        </Button>
      </CardFooter>
    </Card>
  );
};