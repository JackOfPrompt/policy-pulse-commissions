import { useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PlanCard } from "@/components/subscription/PlanCard";
import { useSubscription } from "@/hooks/useSubscription";
import { AlertTriangle, Calendar, CreditCard, Users } from "lucide-react";
import users from "@/data/users.json";

export default function Subscription() {
  const user = users.admin;
  // Get org_id from user context - in real app this would come from auth context
  const orgId = "550e8400-e29b-41d4-a716-446655440000"; // Example org ID
  
  const {
    subscription,
    plans,
    loading,
    upgrading,
    upgradePlan,
    cancelSubscription,
    isTrialExpired,
    getTrialDaysLeft,
    isSubscriptionExpired,
    hasFeatureAccess
  } = useSubscription(orgId);

  const [showCancelDialog, setShowCancelDialog] = useState(false);

  if (loading) {
    return (
      <DashboardLayout role="admin" user={user}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'trialing':
        return <Badge variant="outline" className="border-blue-500 text-blue-700">Trial</Badge>;
      case 'active':
        return <Badge variant="outline" className="border-green-500 text-green-700">Active</Badge>;
      case 'expired':
        return <Badge variant="destructive">Expired</Badge>;
      case 'canceled':
        return <Badge variant="secondary">Canceled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleCancelSubscription = async () => {
    const success = await cancelSubscription();
    if (success) {
      setShowCancelDialog(false);
    }
  };

  const trialDaysLeft = getTrialDaysLeft();
  const showTrialWarning = subscription?.status === 'trialing' && trialDaysLeft <= 7 && trialDaysLeft > 0;
  const showTrialExpired = subscription?.status === 'trialing' && isTrialExpired();
  const showSubscriptionExpired = subscription?.status === 'active' && isSubscriptionExpired();

  return (
    <DashboardLayout role="admin" user={user}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Subscription Management</h1>
            <p className="text-muted-foreground">
              Manage your organization's subscription and billing
            </p>
          </div>
        </div>

        {/* Warning Banners */}
        {(showTrialWarning || showTrialExpired || showSubscriptionExpired) && (
          <Alert 
            variant={showTrialExpired || showSubscriptionExpired ? "destructive" : "default"}
            className={showTrialWarning ? "border-yellow-500 bg-yellow-50" : ""}
          >
            <AlertTriangle className={`h-4 w-4 ${showTrialWarning ? "text-yellow-600" : ""}`} />
            <AlertTitle className={showTrialWarning ? "text-yellow-800" : ""}>
              {showTrialExpired && 'Trial Expired'}
              {showSubscriptionExpired && 'Subscription Expired'}
              {showTrialWarning && 'Trial Ending Soon'}
            </AlertTitle>
            <AlertDescription className={showTrialWarning ? "text-yellow-700" : ""}>
              {showTrialExpired && 'Your trial period has ended. Upgrade to continue using all CRM features.'}
              {showSubscriptionExpired && 'Your subscription has expired. Please renew to continue using all features.'}
              {showTrialWarning && `Your trial expires in ${trialDaysLeft} day${trialDaysLeft !== 1 ? 's' : ''}. Upgrade now to continue using all features.`}
            </AlertDescription>
          </Alert>
        )}

        {/* Current Subscription Status */}
        {subscription && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Current Subscription
                {getStatusBadge(subscription.status)}
              </CardTitle>
              <CardDescription>
                Your current subscription details and usage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center space-x-3">
                  <CreditCard className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Plan</p>
                    <p className="text-2xl font-bold capitalize">{subscription.plan?.name || 'Unknown'}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Calendar className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-sm font-medium">
                      {subscription.status === 'trialing' ? 'Trial Ends' : 'Expires'}
                    </p>
                    <p className="text-2xl font-bold">
                      {subscription.status === 'trialing' 
                        ? formatDate(subscription.trial_end)
                        : formatDate(subscription.end_date)
                      }
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Users className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Features</p>
                    <p className="text-sm">
                      {subscription.plan?.features.modules.join(', ') || 'None'}
                    </p>
                  </div>
                </div>
              </div>

              {subscription.status === 'active' && subscription.plan?.name !== 'free' && (
                <div className="mt-6">
                  <Button 
                    variant="destructive" 
                    onClick={() => setShowCancelDialog(true)}
                    disabled={upgrading}
                  >
                    Cancel Subscription
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Available Plans */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Available Plans</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                currentPlanId={subscription?.plan_id}
                onUpgrade={upgradePlan}
                upgrading={upgrading}
                isTrialing={subscription?.status === 'trialing'}
              />
            ))}
          </div>
        </div>

        {/* Feature Access Status */}
        <Card>
          <CardHeader>
            <CardTitle>Feature Access</CardTitle>
            <CardDescription>
              Your current access to system features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span>CRM Access</span>
                <Badge 
                  variant={hasFeatureAccess('CRM') ? 'outline' : 'destructive'}
                  className={hasFeatureAccess('CRM') ? 'border-green-500 text-green-700' : ''}
                >
                  {hasFeatureAccess('CRM') ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Online Policy Purchase</span>
                <Badge 
                  variant={hasFeatureAccess('OnlinePolicyPurchase') ? 'outline' : 'secondary'}
                  className={hasFeatureAccess('OnlinePolicyPurchase') ? 'border-green-500 text-green-700' : ''}
                >
                  {hasFeatureAccess('OnlinePolicyPurchase') ? 'Enabled' : 'Not Available'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cancel Confirmation Dialog */}
        {showCancelDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Cancel Subscription</CardTitle>
                <CardDescription>
                  Are you sure you want to cancel your subscription? You'll lose access to premium features.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
                  Keep Subscription
                </Button>
                <Button variant="destructive" onClick={handleCancelSubscription}>
                  Cancel Subscription
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}