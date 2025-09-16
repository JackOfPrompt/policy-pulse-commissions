import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EditGridModalProps {
  gridEntry: {
    id: string;
    product_type: string;
    provider: string;
    commission_rate: number;
    reward_rate?: number;
    is_active: boolean;
    [key: string]: any;
  };
  gridType: 'motor' | 'health' | 'life';
  onGridUpdated: () => void;
}

export default function EditGridModal({ gridEntry, gridType, onGridUpdated }: EditGridModalProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    provider: gridEntry.provider || '',
    commission_rate: gridEntry.commission_rate || 0,
    reward_rate: gridEntry.reward_rate || 0,
    is_active: gridEntry.is_active,
    product_sub_type: gridEntry.product_sub_type || '',
    plan_name: gridEntry.plan_name || '',
    valid_from: gridEntry.valid_from || new Date().toISOString().split('T')[0],
    valid_to: gridEntry.valid_to || '',
    // Motor specific fields
    vehicle_make: gridEntry.vehicle_make || '',
    fuel_type_id: gridEntry.fuel_type_id || '',
    // Health specific fields
    sum_insured_min: gridEntry.sum_insured_min || '',
    sum_insured_max: gridEntry.sum_insured_max || '',
    // Life specific fields
    premium_start_price: gridEntry.premium_start_price || '',
    premium_end_price: gridEntry.premium_end_price || '',
    ppt: gridEntry.ppt || '',
    pt: gridEntry.pt || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.provider || !formData.commission_rate) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      let tableName: string;
      let updateData: any = {
        provider: formData.provider,
        commission_rate: parseFloat(formData.commission_rate.toString()),
        reward_rate: parseFloat(formData.reward_rate.toString()) || 0,
        is_active: formData.is_active,
        valid_from: formData.valid_from,
        valid_to: formData.valid_to || null,
        updated_at: new Date().toISOString()
      };

      switch (gridType) {
        case 'motor':
          tableName = 'motor_payout_grid';
          updateData = {
            ...updateData,
            product_type: 'motor',
            product_subtype: formData.product_sub_type,
            vehicle_make: formData.vehicle_make || null,
            fuel_type_id: formData.fuel_type_id ? parseInt(formData.fuel_type_id) : null,
          };
          break;
        case 'health':
          tableName = 'health_payout_grid';
          updateData = {
            ...updateData,
            product_type: 'health',
            product_sub_type: formData.product_sub_type,
            plan_name: formData.plan_name,
            sum_insured_min: formData.sum_insured_min ? parseInt(formData.sum_insured_min) : null,
            sum_insured_max: formData.sum_insured_max ? parseInt(formData.sum_insured_max) : null,
          };
          break;
        case 'life':
          tableName = 'life_payout_grid';
          updateData = {
            ...updateData,
            product_type: 'life',
            product_sub_type: formData.product_sub_type,
            plan_name: formData.plan_name,
            premium_start_price: formData.premium_start_price ? parseFloat(formData.premium_start_price) : null,
            premium_end_price: formData.premium_end_price ? parseFloat(formData.premium_end_price) : null,
            ppt: formData.ppt ? parseInt(formData.ppt) : null,
            pt: formData.pt ? parseInt(formData.pt) : null,
          };
          break;
        default:
          throw new Error('Invalid grid type');
      }

      const { error } = await supabase
        .from(tableName as any)
        .update(updateData)
        .eq('id', gridEntry.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Commission grid updated successfully",
      });

      setOpen(false);
      onGridUpdated();
    } catch (error) {
      console.error('Error updating grid:', error);
      toast({
        title: "Error",
        description: "Failed to update commission grid",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit {gridType.charAt(0).toUpperCase() + gridType.slice(1)} Commission Grid</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="provider">Provider *</Label>
              <Input
                id="provider"
                value={formData.provider}
                onChange={(e) => setFormData(prev => ({ ...prev, provider: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="commission_rate">Commission Rate (%) *</Label>
              <Input
                id="commission_rate"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.commission_rate}
                onChange={(e) => setFormData(prev => ({ ...prev, commission_rate: Number(e.target.value) }))}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="reward_rate">Reward Rate (%)</Label>
              <Input
                id="reward_rate"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.reward_rate}
                onChange={(e) => setFormData(prev => ({ ...prev, reward_rate: Number(e.target.value) }))}
              />
            </div>
            <div>
              <Label htmlFor="is_active">Status *</Label>
              <Select 
                value={formData.is_active ? "active" : "inactive"} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, is_active: value === "active" }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="valid_from">Valid From *</Label>
              <Input
                id="valid_from"
                type="date"
                value={formData.valid_from}
                onChange={(e) => setFormData(prev => ({ ...prev, valid_from: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="valid_to">Valid To</Label>
              <Input
                id="valid_to"
                type="date"
                value={formData.valid_to}
                onChange={(e) => setFormData(prev => ({ ...prev, valid_to: e.target.value }))}
              />
            </div>
          </div>

          {/* Product-specific fields */}
          {gridType === 'motor' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="vehicle_make">Vehicle Make</Label>
                <Input
                  id="vehicle_make"
                  value={formData.vehicle_make}
                  onChange={(e) => setFormData(prev => ({ ...prev, vehicle_make: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="fuel_type_id">Fuel Type ID</Label>
                <Input
                  id="fuel_type_id"
                  type="number"
                  value={formData.fuel_type_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, fuel_type_id: e.target.value }))}
                />
              </div>
            </div>
          )}

          {gridType === 'health' && (
            <>
              <div>
                <Label htmlFor="plan_name">Plan Name</Label>
                <Input
                  id="plan_name"
                  value={formData.plan_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, plan_name: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sum_insured_min">Min Sum Insured</Label>
                  <Input
                    id="sum_insured_min"
                    type="number"
                    value={formData.sum_insured_min}
                    onChange={(e) => setFormData(prev => ({ ...prev, sum_insured_min: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="sum_insured_max">Max Sum Insured</Label>
                  <Input
                    id="sum_insured_max"
                    type="number"
                    value={formData.sum_insured_max}
                    onChange={(e) => setFormData(prev => ({ ...prev, sum_insured_max: e.target.value }))}
                  />
                </div>
              </div>
            </>
          )}

          {gridType === 'life' && (
            <>
              <div>
                <Label htmlFor="plan_name">Plan Name</Label>
                <Input
                  id="plan_name"
                  value={formData.plan_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, plan_name: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="premium_start_price">Min Premium</Label>
                  <Input
                    id="premium_start_price"
                    type="number"
                    value={formData.premium_start_price}
                    onChange={(e) => setFormData(prev => ({ ...prev, premium_start_price: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="premium_end_price">Max Premium</Label>
                  <Input
                    id="premium_end_price"
                    type="number"
                    value={formData.premium_end_price}
                    onChange={(e) => setFormData(prev => ({ ...prev, premium_end_price: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ppt">Premium Payment Term</Label>
                  <Input
                    id="ppt"
                    type="number"
                    value={formData.ppt}
                    onChange={(e) => setFormData(prev => ({ ...prev, ppt: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="pt">Policy Term</Label>
                  <Input
                    id="pt"
                    type="number"
                    value={formData.pt}
                    onChange={(e) => setFormData(prev => ({ ...prev, pt: e.target.value }))}
                  />
                </div>
              </div>
            </>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update Grid"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}