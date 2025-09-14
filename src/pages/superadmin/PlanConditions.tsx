import { useState } from "react";
import { Settings, Save, RotateCcw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import users from "@/data/users.json";
import planConditionsData from "@/data/superadmin/plan_conditions.json";

interface PlanCondition {
  plan_id: string;
  plan_name: string;
  feature: string;
  enabled: boolean;
}

export default function PlanConditions() {
  const user = users.superadmin;
  const { toast } = useToast();
  const [planConditions, setPlanConditions] = useState<PlanCondition[]>(planConditionsData);
  const [hasChanges, setHasChanges] = useState(false);

  // Group conditions by plan
  const planGroups = planConditions.reduce((groups, condition) => {
    if (!groups[condition.plan_id]) {
      groups[condition.plan_id] = {
        planName: condition.plan_name,
        features: []
      };
    }
    groups[condition.plan_id].features.push(condition);
    return groups;
  }, {} as Record<string, { planName: string; features: PlanCondition[] }>);

  const handleFeatureToggle = (planId: string, feature: string, enabled: boolean) => {
    const updatedConditions = planConditions.map(condition => 
      condition.plan_id === planId && condition.feature === feature
        ? { ...condition, enabled }
        : condition
    );
    
    setPlanConditions(updatedConditions);
    setHasChanges(true);
  };

  const handleSaveChanges = () => {
    // In a real app, this would make an API call
    toast({
      title: "Changes Saved",
      description: "Plan feature conditions have been updated successfully.",
    });
    setHasChanges(false);
  };

  const handleResetChanges = () => {
    setPlanConditions(planConditionsData);
    setHasChanges(false);
    toast({
      title: "Changes Reset",
      description: "All changes have been reverted to the original state.",
    });
  };

  const getFeatureIcon = (feature: string) => {
    switch (feature) {
      case 'AI Extraction': return '🤖';
      case 'Commission Tracking': return '💰';
      case 'Audit Logs': return '📋';
      case 'Multi-Branch Support': return '🏢';
      case 'Advanced Reporting': return '📊';
      case 'Custom Integrations': return '🔗';
      case 'White-label Solution': return '🏷️';
      default: return '⚙️';
    }
  };

  return (
    <DashboardLayout role="superadmin" user={user}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Plan Feature Conditions</h1>
            <p className="text-muted-foreground">
              Configure feature availability for each subscription plan
            </p>
          </div>
          <div className="flex space-x-2">
            {hasChanges && (
              <Button variant="outline" onClick={handleResetChanges}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset Changes
              </Button>
            )}
            <Button 
              onClick={handleSaveChanges} 
              disabled={!hasChanges}
              className="bg-success text-success-foreground hover:bg-success/90"
            >
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {Object.entries(planGroups).map(([planId, planGroup]) => (
            <Card key={planId} className="h-fit">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Settings className="h-5 w-5 text-primary" />
                    <span>{planGroup.planName}</span>
                  </CardTitle>
                  <Badge variant="outline">
                    {planGroup.features.filter(f => f.enabled).length} / {planGroup.features.length}
                  </Badge>
                </div>
                <CardDescription>
                  Feature availability configuration
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {planGroup.features.map((condition) => (
                    <div 
                      key={`${condition.plan_id}-${condition.feature}`}
                      className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">
                          {getFeatureIcon(condition.feature)}
                        </span>
                        <div>
                          <p className="font-medium text-sm">{condition.feature}</p>
                          <p className="text-xs text-muted-foreground">
                            {condition.enabled ? 'Available' : 'Restricted'}
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={condition.enabled}
                        onCheckedChange={(enabled) => 
                          handleFeatureToggle(condition.plan_id, condition.feature, enabled)
                        }
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Feature Matrix Table */}
        <Card>
          <CardHeader>
            <CardTitle>Feature Comparison Matrix</CardTitle>
            <CardDescription>
              Complete overview of all features across subscription plans
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">Feature</th>
                    {Object.entries(planGroups).map(([planId, planGroup]) => (
                      <th key={planId} className="text-center p-3 font-medium">
                        {planGroup.planName}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from(new Set(planConditions.map(c => c.feature))).map((feature) => (
                    <tr key={feature} className="border-b hover:bg-accent/50">
                      <td className="p-3">
                        <div className="flex items-center space-x-2">
                          <span>{getFeatureIcon(feature)}</span>
                          <span className="font-medium">{feature}</span>
                        </div>
                      </td>
                      {Object.entries(planGroups).map(([planId, planGroup]) => {
                        const condition = planGroup.features.find(f => f.feature === feature);
                        return (
                          <td key={planId} className="text-center p-3">
                            {condition ? (
                              <Switch
                                checked={condition.enabled}
                                onCheckedChange={(enabled) => 
                                  handleFeatureToggle(condition.plan_id, condition.feature, enabled)
                                }
                              />
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}