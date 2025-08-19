import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Package, DollarSign, Calendar, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionPlan {
  id: string;
  plan_code: string;
  plan_name: string;
  billing_cycles: string[];
  base_price: number;
  currency: string;
  trial_days: number;
  seat_config: any;
  features: string[];
  status: string;
  description: string;
  created_at: string;
}

const PlanCatalog = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    plan_code: '',
    plan_name: '',
    billing_cycles: ['MONTHLY'],
    base_price: 0,
    currency: 'INR',
    trial_days: 14,
    seat_config: { included: 1, extra_price: 0 },
    features: [],
    status: 'Active',
    description: ''
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      
      // Use mock data for now since table structure is being updated
      const mockPlans: SubscriptionPlan[] = [
        {
          id: '1',
          plan_code: 'BASIC_MONTHLY',
          plan_name: 'Basic Plan',
          billing_cycles: ['MONTHLY'],
          base_price: 999,
          currency: 'INR',
          trial_days: 14,
          seat_config: { included: 1, extra_price: 250 },
          features: ['Basic Support', 'Core Features'],
          status: 'Active',
          description: 'Perfect for small businesses',
          created_at: '2024-01-01'
        }
      ];
      setPlans(mockPlans);
    } catch (error: any) {
      console.error('Error fetching plans:', error);
      toast({
        title: "Error",
        description: "Failed to fetch subscription plans",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlan = async () => {
    try {
      const newPlan: SubscriptionPlan = {
        id: Date.now().toString(),
        ...formData,
        created_at: new Date().toISOString()
      };

      setPlans([newPlan, ...plans]);
      setShowCreateDialog(false);
      resetForm();
      
      toast({
        title: "Success",
        description: "Subscription plan created successfully",
      });
    } catch (error: any) {
      console.error('Error creating plan:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create subscription plan",
        variant: "destructive",
      });
    }
  };

  const handleUpdatePlan = async () => {
    if (!editingPlan) return;

    try {
      const updatedPlan = { ...editingPlan, ...formData };
      setPlans(plans.map(p => p.id === editingPlan.id ? updatedPlan : p));
      setEditingPlan(null);
      resetForm();
      
      toast({
        title: "Success",
        description: "Subscription plan updated successfully",
      });
    } catch (error: any) {
      console.error('Error updating plan:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update subscription plan",
        variant: "destructive",
      });
    }
  };

  const handleDeletePlan = async (planId: string) => {
    try {
      setPlans(plans.map(p => p.id === planId ? { ...p, status: 'Inactive' } : p));
      
      toast({
        title: "Success",
        description: "Subscription plan deactivated successfully",
      });
    } catch (error: any) {
      console.error('Error deactivating plan:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to deactivate subscription plan",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      plan_code: '',
      plan_name: '',
      billing_cycles: ['MONTHLY'],
      base_price: 0,
      currency: 'INR',
      trial_days: 14,
      seat_config: { included: 1, extra_price: 0 },
      features: [],
      status: 'Active',
      description: ''
    });
  };

  const openEditDialog = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setFormData({
      plan_code: plan.plan_code,
      plan_name: plan.plan_name,
      billing_cycles: plan.billing_cycles,
      base_price: plan.base_price,
      currency: plan.currency,
      trial_days: plan.trial_days,
      seat_config: plan.seat_config,
      features: plan.features,
      status: plan.status,
      description: plan.description
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-muted rounded w-1/4"></div>
                <div className="h-6 bg-muted rounded w-1/2"></div>
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Plan Catalog</h2>
          <p className="text-muted-foreground">Manage subscription plans and pricing</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Subscription Plan</DialogTitle>
              <DialogDescription>
                Define a new subscription plan with pricing and features
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="plan_code">Plan Code</Label>
                  <Input
                    id="plan_code"
                    value={formData.plan_code}
                    onChange={(e) => setFormData({ ...formData, plan_code: e.target.value })}
                    placeholder="PREMIUM_MONTHLY"
                  />
                </div>
                <div>
                  <Label htmlFor="plan_name">Plan Name</Label>
                  <Input
                    id="plan_name"
                    value={formData.plan_name}
                    onChange={(e) => setFormData({ ...formData, plan_name: e.target.value })}
                    placeholder="Premium Plan"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="base_price">Base Price (₹)</Label>
                  <Input
                    id="base_price"
                    type="number"
                    value={formData.base_price}
                    onChange={(e) => setFormData({ ...formData, base_price: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="trial_days">Trial Days</Label>
                  <Input
                    id="trial_days"
                    type="number"
                    value={formData.trial_days}
                    onChange={(e) => setFormData({ ...formData, trial_days: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Plan description..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreatePlan}>
                Create Plan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Plans Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.id} className={`relative ${plan.status === 'Inactive' ? 'opacity-60' : ''}`}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    {plan.plan_name}
                  </CardTitle>
                  <CardDescription>{plan.plan_code}</CardDescription>
                </div>
                <Badge variant={plan.status === 'Active' ? 'default' : 'secondary'}>
                  {plan.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                <span className="text-2xl font-bold">₹{plan.base_price.toLocaleString()}</span>
                <span className="text-muted-foreground">/{plan.billing_cycles[0]?.toLowerCase()}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{plan.trial_days} days free trial</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">
                  {plan.seat_config?.included || 1} seat{(plan.seat_config?.included || 1) > 1 ? 's' : ''} included
                </span>
              </div>
              
              {plan.description && (
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              )}
              
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditDialog(plan)}
                  className="flex-1"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                {plan.status === 'Active' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeletePlan(plan.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {plans.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-semibold mb-2">No Subscription Plans</h3>
            <p className="text-muted-foreground mb-4">
              Create your first subscription plan to start managing subscriptions.
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Plan
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingPlan} onOpenChange={() => setEditingPlan(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Subscription Plan</DialogTitle>
            <DialogDescription>
              Update the subscription plan details
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_plan_code">Plan Code</Label>
                <Input
                  id="edit_plan_code"
                  value={formData.plan_code}
                  onChange={(e) => setFormData({ ...formData, plan_code: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit_plan_name">Plan Name</Label>
                <Input
                  id="edit_plan_name"
                  value={formData.plan_name}
                  onChange={(e) => setFormData({ ...formData, plan_name: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_base_price">Base Price (₹)</Label>
                <Input
                  id="edit_base_price"
                  type="number"
                  value={formData.base_price}
                  onChange={(e) => setFormData({ ...formData, base_price: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="edit_trial_days">Trial Days</Label>
                <Input
                  id="edit_trial_days"
                  type="number"
                  value={formData.trial_days}
                  onChange={(e) => setFormData({ ...formData, trial_days: parseInt(e.target.value) })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit_description">Description</Label>
              <Textarea
                id="edit_description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingPlan(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdatePlan}>
              Update Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PlanCatalog;