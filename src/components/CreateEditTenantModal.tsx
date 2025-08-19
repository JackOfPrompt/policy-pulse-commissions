import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Tenant {
  id: string;
  name: string;
  tenant_code: string | null;
  domain: string | null;
  contact_person: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  address: string | null;
  logo_url: string | null;
  notes: string | null;
  status: string;
}

interface SubscriptionPlan {
  id: string;
  plan_name: string;
  plan_code: string;
}

interface CreateEditTenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  mode: 'create' | 'edit';
  tenant?: Tenant;
}

export const CreateEditTenantModal = ({ isOpen, onClose, onSuccess, mode, tenant }: CreateEditTenantModalProps) => {
  const [loading, setLoading] = useState(false);
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
  const [formData, setFormData] = useState({
    tenant_name: '',
    tenant_code: '',
    domain: '',
    contact_person: '',
    contact_email: '',
    contact_phone: '',
    address: '',
    logo_url: '',
    notes: '',
    status: 'Active',
    subscription_plan_id: 'none'
  });

  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchSubscriptionPlans();
      if (mode === 'edit' && tenant) {
        setFormData({
          tenant_name: tenant.name || '',
          tenant_code: tenant.tenant_code || '',
          domain: tenant.domain || '',
          contact_person: tenant.contact_person || '',
          contact_email: tenant.contact_email || '',
          contact_phone: tenant.contact_phone || '',
          address: tenant.address || '',
          logo_url: tenant.logo_url || '',
          notes: tenant.notes || '',
          status: tenant.status || 'Active',
          subscription_plan_id: 'none'
        });
      } else {
        setFormData({
          tenant_name: '',
          tenant_code: '',
          domain: '',
          contact_person: '',
          contact_email: '',
          contact_phone: '',
          address: '',
          logo_url: '',
          notes: '',
          status: 'Active',
          subscription_plan_id: 'none'
        });
      }
    }
  }, [isOpen, mode, tenant]);

  const fetchSubscriptionPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('id, plan_name, plan_code')
        .eq('is_active', true)
        .order('plan_name');

      if (error) throw error;
      setSubscriptionPlans(data || []);
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const method = mode === 'create' ? 'POST' : 'PUT';
      const url = mode === 'create' ? 'tenants' : `tenants/${tenant?.id}`;

      const { data, error } = await supabase.functions.invoke(url, {
        method,
        body: formData
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "Success",
          description: `Tenant ${mode === 'create' ? 'created' : 'updated'} successfully`,
        });
        onSuccess();
      } else {
        throw new Error(data?.error || 'Operation failed');
      }
    } catch (error: any) {
      console.error(`Error ${mode === 'create' ? 'creating' : 'updating'} tenant:`, error);
      toast({
        title: "Error",
        description: error.message || `Failed to ${mode} tenant`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Create New Tenant' : 'Edit Tenant'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Enter the details for the new tenant organization.' 
              : 'Update the tenant organization details.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tenant_name">Tenant Name *</Label>
              <Input
                id="tenant_name"
                value={formData.tenant_name}
                onChange={(e) => handleInputChange('tenant_name', e.target.value)}
                placeholder="e.g., LMV Insurance Broking Services"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tenant_code">Tenant Code *</Label>
              <Input
                id="tenant_code"
                value={formData.tenant_code}
                onChange={(e) => handleInputChange('tenant_code', e.target.value)}
                placeholder="e.g., LMV001"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="domain">Domain / Subdomain</Label>
              <Input
                id="domain"
                value={formData.domain}
                onChange={(e) => handleInputChange('domain', e.target.value)}
                placeholder="e.g., lmv.lakshitha.tech"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                  <SelectItem value="Suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_person">Contact Person Name *</Label>
              <Input
                id="contact_person"
                value={formData.contact_person}
                onChange={(e) => handleInputChange('contact_person', e.target.value)}
                placeholder="e.g., John Doe"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_email">Contact Email *</Label>
              <Input
                id="contact_email"
                type="email"
                value={formData.contact_email}
                onChange={(e) => handleInputChange('contact_email', e.target.value)}
                placeholder="e.g., john@lmv.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_phone">Contact Phone *</Label>
              <Input
                id="contact_phone"
                value={formData.contact_phone}
                onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                placeholder="e.g., +91-9876543210"
                required
              />
            </div>

            {mode === 'create' && (
              <div className="space-y-2">
                <Label htmlFor="subscription_plan_id">Subscription Plan</Label>
                <Select value={formData.subscription_plan_id} onValueChange={(value) => handleInputChange('subscription_plan_id', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a plan" />
                  </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="none">No plan selected</SelectItem>
                   {subscriptionPlans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.plan_name} ({plan.plan_code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="logo_url">Logo URL</Label>
              <Input
                id="logo_url"
                value={formData.logo_url}
                onChange={(e) => handleInputChange('logo_url', e.target.value)}
                placeholder="https://example.com/logo.png"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="Full address of the organization"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Any additional notes or comments"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : mode === 'create' ? 'Create Tenant' : 'Update Tenant'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};