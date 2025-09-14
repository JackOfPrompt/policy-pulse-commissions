import { ReactNode } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Lock, Crown } from 'lucide-react';

interface FeatureGateProps {
  feature: string;
  orgId: string;
  children: ReactNode;
  fallback?: ReactNode;
  showUpgrade?: boolean;
}

export const FeatureGate = ({ 
  feature, 
  orgId, 
  children, 
  fallback, 
  showUpgrade = true 
}: FeatureGateProps) => {
  const navigate = useNavigate();
  const { hasFeatureAccess, subscription, isTrialExpired, isSubscriptionExpired } = useSubscription(orgId);

  const hasAccess = hasFeatureAccess(feature);

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  // Default fallback with upgrade prompt
  const getUpgradeMessage = () => {
    if (!subscription) {
      return "No active subscription found.";
    }

    if (subscription.status === 'trialing' && isTrialExpired()) {
      return "Your trial has expired. Upgrade to continue using this feature.";
    }

    if (subscription.status === 'active' && isSubscriptionExpired()) {
      return "Your subscription has expired. Please renew to access this feature.";
    }

    return `This feature requires a ${feature === 'OnlinePolicyPurchase' ? 'Enterprise' : 'Pro'} plan or higher.`;
  };

  const handleUpgrade = () => {
    navigate('/admin/subscription');
  };

  return (
    <Card className="border-dashed border-2 border-muted">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-2">
          {feature === 'OnlinePolicyPurchase' ? (
            <Crown className="h-12 w-12 text-muted-foreground" />
          ) : (
            <Lock className="h-12 w-12 text-muted-foreground" />
          )}
        </div>
        <CardTitle className="text-muted-foreground">Feature Locked</CardTitle>
        <CardDescription>
          {getUpgradeMessage()}
        </CardDescription>
      </CardHeader>
      {showUpgrade && (
        <CardContent className="text-center">
          <Button onClick={handleUpgrade} variant="default">
            {subscription?.status === 'trialing' && isTrialExpired() 
              ? 'Upgrade Now' 
              : subscription?.status === 'active' && isSubscriptionExpired()
              ? 'Renew Subscription'
              : 'View Plans'
            }
          </Button>
        </CardContent>
      )}
    </Card>
  );
};