import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { useCommissionGrids } from '@/hooks/useCommissionGrids';
import { useEnhancedCommissionCalculation, Provider } from '@/hooks/useEnhancedCommissionCalculation';
import { useProductTypes } from '@/hooks/useProductTypes';

interface EnhancedCommissionGridModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  grid?: any;
  onSuccess: () => void;
}

export function EnhancedCommissionGridModal({
  open,
  onOpenChange,
  grid,
  onSuccess,
}: EnhancedCommissionGridModalProps) {
  const [formData, setFormData] = useState({
    product_type: '',
    product_subtype: '',
    provider_id: '',
    min_premium: '',
    max_premium: '',
    base_commission_rate: '',
    reward_commission_rate: '',
    bonus_commission_rate: '',
    effective_from: '',
    effective_to: '',
    reward_effective_from: '',
    reward_effective_to: '',
    bonus_effective_from: '',
    bonus_effective_to: '',
  });
  const [providers, setProviders] = useState<Provider[]>([]);
  const { toast } = useToast();
  const { createCommissionGrid, updateCommissionGrid, loading } = useCommissionGrids();
  const { getProviders } = useEnhancedCommissionCalculation();
  const { data: productTypes } = useProductTypes();

  useEffect(() => {
    loadProviders();
  }, []);

  useEffect(() => {
    if (grid) {
      setFormData({
        product_type: grid.product_type || '',
        product_subtype: grid.product_subtype || '',
        provider_id: grid.provider_id || '',
        min_premium: grid.min_premium?.toString() || '',
        max_premium: grid.max_premium?.toString() || '',
        base_commission_rate: grid.commission_rate?.toString() || '',
        reward_commission_rate: grid.reward_rate?.toString() || '',
        bonus_commission_rate: grid.bonus_commission_rate?.toString() || '',
        effective_from: grid.effective_from || '',
        effective_to: grid.effective_to || '',
        reward_effective_from: grid.reward_effective_from || '',
        reward_effective_to: grid.reward_effective_to || '',
        bonus_effective_from: grid.bonus_effective_from || '',
        bonus_effective_to: grid.bonus_effective_to || '',
      });
    } else {
      setFormData({
        product_type: '',
        product_subtype: '',
        provider_id: '',
        min_premium: '',
        max_premium: '',
        base_commission_rate: '',
        reward_commission_rate: '',
        bonus_commission_rate: '',
        effective_from: new Date().toISOString().split('T')[0],
        effective_to: '',
        reward_effective_from: '',
        reward_effective_to: '',
        bonus_effective_from: '',
        bonus_effective_to: '',
      });
    }
  }, [grid, open]);

  const loadProviders = async () => {
    const providerData = await getProviders();
    setProviders(providerData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.product_type || !formData.provider_id || !formData.base_commission_rate) {
      toast({
        title: "Validation Error",
        description: "Product type, provider, and base commission rate are required",
        variant: "destructive",
      });
      return;
    }

    const gridData = {
      product_type: formData.product_type,
      product_subtype: formData.product_subtype || undefined,
      provider_id: formData.provider_id,
      min_premium: formData.min_premium ? parseFloat(formData.min_premium) : undefined,
      max_premium: formData.max_premium ? parseFloat(formData.max_premium) : undefined,
      base_commission_rate: parseFloat(formData.base_commission_rate),
      reward_commission_rate: formData.reward_commission_rate ? parseFloat(formData.reward_commission_rate) : 0,
      bonus_commission_rate: formData.bonus_commission_rate ? parseFloat(formData.bonus_commission_rate) : 0,
      commission_rate: parseFloat(formData.base_commission_rate) + (formData.reward_commission_rate ? parseFloat(formData.reward_commission_rate) : 0) + (formData.bonus_commission_rate ? parseFloat(formData.bonus_commission_rate) : 0),
      effective_from: formData.effective_from,
      effective_to: formData.effective_to || undefined,
      reward_effective_from: formData.reward_effective_from || undefined,
      reward_effective_to: formData.reward_effective_to || undefined,
      bonus_effective_from: formData.bonus_effective_from || undefined,
      bonus_effective_to: formData.bonus_effective_to || undefined,
    };

    let success = false;
    if (grid) {
      success = await updateCommissionGrid(grid.id, gridData);
    } else {
      success = await createCommissionGrid(gridData);
    }

    if (success) {
      onSuccess();
      onOpenChange(false);
    }
  };

  const selectedProvider = providers.find(p => p.id === formData.provider_id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {grid ? 'Edit' : 'Create'} Commission Grid
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Product Type */}
          <div className="space-y-2">
            <Label htmlFor="product_type">Product Type *</Label>
            <Select
              value={formData.product_type}
              onValueChange={(value) => setFormData({ ...formData, product_type: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select product type" />
              </SelectTrigger>
              <SelectContent>
                {productTypes.map((productType) => (
                  <SelectItem key={productType.id} value={productType.name}>
                    {productType.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Provider */}
          <div className="space-y-2">
            <Label htmlFor="provider_id">Provider *</Label>
            <Select
              value={formData.provider_id}
              onValueChange={(value) => setFormData({ ...formData, provider_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select provider" />
              </SelectTrigger>
              <SelectContent>
                {providers
                  .filter(provider => 
                    !formData.product_type || 
                    provider.provider_type === formData.product_type || 
                    provider.provider_type === 'insurer'
                  )
                  .map((provider) => (
                    <SelectItem key={provider.id} value={provider.id}>
                      {provider.name} ({provider.code})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Product Subtype */}
          <div className="space-y-2">
            <Label htmlFor="product_subtype">Product Subtype</Label>
            <Input
              id="product_subtype"
              value={formData.product_subtype}
              onChange={(e) => setFormData({ ...formData, product_subtype: e.target.value })}
              placeholder="e.g., Term Plan, Comprehensive"
            />
          </div>

          {/* Premium Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="min_premium">Min Premium</Label>
              <Input
                id="min_premium"
                type="number"
                value={formData.min_premium}
                onChange={(e) => setFormData({ ...formData, min_premium: e.target.value })}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_premium">Max Premium</Label>
              <Input
                id="max_premium"
                type="number"
                value={formData.max_premium}
                onChange={(e) => setFormData({ ...formData, max_premium: e.target.value })}
                placeholder="No limit"
              />
            </div>
          </div>

          {/* Commission Rates */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="base_commission_rate">Base Commission Rate (%) *</Label>
              <Input
                id="base_commission_rate"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.base_commission_rate}
                onChange={(e) => setFormData({ ...formData, base_commission_rate: e.target.value })}
                placeholder="e.g., 20.0"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reward_commission_rate">Reward Commission Rate (%)</Label>
              <Input
                id="reward_commission_rate"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.reward_commission_rate}
                onChange={(e) => setFormData({ ...formData, reward_commission_rate: e.target.value })}
                placeholder="e.g., 3.0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bonus_commission_rate">Bonus Commission Rate (%)</Label>
              <Input
                id="bonus_commission_rate"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.bonus_commission_rate}
                onChange={(e) => setFormData({ ...formData, bonus_commission_rate: e.target.value })}
                placeholder="e.g., 2.0"
              />
            </div>

            {/* Total Commission Rate Display */}
            {(formData.base_commission_rate || formData.reward_commission_rate || formData.bonus_commission_rate) && (
              <div className="p-2 bg-muted rounded text-sm">
                <strong>Total Commission Rate: {
                  (parseFloat(formData.base_commission_rate || '0') + 
                   parseFloat(formData.reward_commission_rate || '0') + 
                   parseFloat(formData.bonus_commission_rate || '0')).toFixed(2)
                }%</strong>
              </div>
            )}
          </div>

          {/* Effective Period */}
          <div className="space-y-4">
            <div className="text-sm font-medium">Base Commission Effective Period</div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="effective_from">Effective From *</Label>
                <Input
                  id="effective_from"
                  type="date"
                  value={formData.effective_from}
                  onChange={(e) => setFormData({ ...formData, effective_from: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="effective_to">Effective To</Label>
                <Input
                  id="effective_to"
                  type="date"
                  value={formData.effective_to}
                  onChange={(e) => setFormData({ ...formData, effective_to: e.target.value })}
                />
              </div>
            </div>

            {/* Reward Commission Date Filters */}
            {formData.reward_commission_rate && (
              <>
                <div className="text-sm font-medium">Reward Commission Effective Period</div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="reward_effective_from">Reward From</Label>
                    <Input
                      id="reward_effective_from"
                      type="date"
                      value={formData.reward_effective_from}
                      onChange={(e) => setFormData({ ...formData, reward_effective_from: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reward_effective_to">Reward To</Label>
                    <Input
                      id="reward_effective_to"
                      type="date"
                      value={formData.reward_effective_to}
                      onChange={(e) => setFormData({ ...formData, reward_effective_to: e.target.value })}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Bonus Commission Date Filters */}
            {formData.bonus_commission_rate && (
              <>
                <div className="text-sm font-medium">Bonus Commission Effective Period</div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bonus_effective_from">Bonus From</Label>
                    <Input
                      id="bonus_effective_from"
                      type="date"
                      value={formData.bonus_effective_from}
                      onChange={(e) => setFormData({ ...formData, bonus_effective_from: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bonus_effective_to">Bonus To</Label>
                    <Input
                      id="bonus_effective_to"
                      type="date"
                      value={formData.bonus_effective_to}
                      onChange={(e) => setFormData({ ...formData, bonus_effective_to: e.target.value })}
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Preview */}
          {selectedProvider && formData.base_commission_rate && (
            <div className="p-3 bg-muted rounded-lg text-sm">
              <div className="font-medium mb-1">Grid Preview:</div>
              <div>{selectedProvider.name} - {formData.product_type}</div>
              <div>Base Commission: {formData.base_commission_rate}%</div>
              {formData.reward_commission_rate && (
                <div>Reward Commission: {formData.reward_commission_rate}%</div>
              )}
              {formData.bonus_commission_rate && (
                <div>Bonus Commission: {formData.bonus_commission_rate}%</div>
              )}
              <div className="font-medium">Total Commission: {
                (parseFloat(formData.base_commission_rate || '0') + 
                 parseFloat(formData.reward_commission_rate || '0') + 
                 parseFloat(formData.bonus_commission_rate || '0')).toFixed(2)
              }%</div>
              {formData.min_premium && formData.max_premium && (
                <div>Premium Range: ₹{formData.min_premium} - ₹{formData.max_premium}</div>
              )}
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : grid ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}