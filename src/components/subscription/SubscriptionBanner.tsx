import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";

interface SubscriptionBannerProps {
  orgId: string;
}

export const SubscriptionBanner = ({ orgId }: SubscriptionBannerProps) => {
  const navigate = useNavigate();
  const { subscription, isTrialExpired, getTrialDaysLeft, isSubscriptionExpired } = useSubscription(orgId);

  if (!subscription) return null;

  const trialDaysLeft = getTrialDaysLeft();
  const showTrialWarning = subscription.status === 'trialing' && trialDaysLeft <= 7 && trialDaysLeft > 0;
  const showTrialExpired = subscription.status === 'trialing' && isTrialExpired();
  const showSubscriptionExpired = subscription.status === 'active' && isSubscriptionExpired();

  if (!showTrialWarning && !showTrialExpired && !showSubscriptionExpired) return null;

  const handleUpgradeClick = () => {
    navigate('/admin/subscription');
  };

  if (showTrialExpired || showSubscriptionExpired) {
    return (
      <Alert variant="destructive" className="mb-4">
        <XCircle className="h-4 w-4" />
        <AlertTitle>
          {showTrialExpired ? 'Trial Expired' : 'Subscription Expired'}
        </AlertTitle>
        <AlertDescription className="flex items-center justify-between">
          <span>
            {showTrialExpired 
              ? 'Your trial period has ended. Upgrade to continue using all CRM features.'
              : 'Your subscription has expired. Please renew to continue using all features.'
            }
          </span>
          <Button size="sm" onClick={handleUpgradeClick}>
            {showTrialExpired ? 'Upgrade Now' : 'Renew Subscription'}
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (showTrialWarning) {
    return (
      <Alert variant="default" className="mb-4 border-yellow-500 bg-yellow-50">
        <AlertTriangle className="h-4 w-4 text-yellow-600" />
        <AlertTitle className="text-yellow-800">Trial Ending Soon</AlertTitle>
        <AlertDescription className="flex items-center justify-between text-yellow-700">
          <span>
            Your trial expires in {trialDaysLeft} day{trialDaysLeft !== 1 ? 's' : ''}. 
            Upgrade now to continue using all features.
          </span>
          <Button size="sm" variant="outline" onClick={handleUpgradeClick}>
            <Clock className="mr-2 h-4 w-4" />
            Upgrade Now
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return null;
};