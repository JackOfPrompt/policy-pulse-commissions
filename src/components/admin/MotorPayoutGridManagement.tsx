import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface MotorPayoutGrid {
  id: string;
  provider: string;
  product_type: string;
  product_subtype: string;
  commission_rate: number;
  reward_rate: number;
  bonus_commission_rate: number;
  min_premium: number | null;
  max_premium: number | null;
  vehicle_make: string | null;
  cc_range: string | null;
  gvw_range: string | null;
  ncb_percentage: number | null;
  effective_from: string;
  effective_to: string | null;
  is_active: boolean;
}

export function MotorPayoutGridManagement() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGrid, setEditingGrid] = useState<MotorPayoutGrid | null>(null);

  // Fetch motor payout grids
  const { data: grids = [], isLoading } = useQuery({
    queryKey: ['motor-payout-grids'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('motor_payout_grid')
        .select('*')
        .eq('org_id', profile?.org_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as MotorPayoutGrid[];
    },
    enabled: !!profile?.org_id,
  });

  // Create/Update grid mutation
  const gridMutation = useMutation({
    mutationFn: async (gridData: any) => {
      if (editingGrid) {
        const { error } = await supabase
          .from('motor_payout_grid')
          .update(gridData)
          .eq('id', editingGrid.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('motor_payout_grid')
          .insert([gridData]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['motor-payout-grids'] });
      setIsDialogOpen(false);
      setEditingGrid(null);
      toast({
        title: 'Success',
        description: editingGrid ? 'Grid updated successfully' : 'Grid created successfully',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to save grid',
        variant: 'destructive',
      });
    },
  });

  // Delete grid mutation
  const deleteMutation = useMutation({
    mutationFn: async (gridId: string) => {
      const { error } = await supabase
        .from('motor_payout_grid')
        .delete()
        .eq('id', gridId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['motor-payout-grids'] });
      toast({
        title: 'Success',
        description: 'Grid deleted successfully',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const gridData: any = {
      provider: formData.get('provider') as string,
      product_type: formData.get('product_type') as string,
      product_subtype: formData.get('product_subtype') as string,
      commission_rate: parseFloat(formData.get('commission_rate') as string),
      reward_rate: parseFloat(formData.get('reward_rate') as string) || 0,
      bonus_commission_rate: parseFloat(formData.get('bonus_commission_rate') as string) || 0,
      min_premium: formData.get('min_premium') ? parseFloat(formData.get('min_premium') as string) : null,
      max_premium: formData.get('max_premium') ? parseFloat(formData.get('max_premium') as string) : null,
      vehicle_make: formData.get('vehicle_make') as string || null,
      cc_range: formData.get('cc_range') as string || null,
      gvw_range: formData.get('gvw_range') as string || null,
      ncb_percentage: formData.get('ncb_percentage') ? parseFloat(formData.get('ncb_percentage') as string) : null,
      effective_from: formData.get('effective_from') as string,
      effective_to: formData.get('effective_to') as string || null,
      is_active: true,
    };
    
    if (!editingGrid) {
      gridData.org_id = profile?.org_id;
    }

    gridMutation.mutate(gridData);
  };

  const openEditDialog = (grid: MotorPayoutGrid) => {
    setEditingGrid(grid);
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingGrid(null);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Motor Insurance Commission Grids</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Add Grid
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingGrid ? 'Edit Motor Insurance Grid' : 'Create Motor Insurance Grid'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="provider">Provider</Label>
                  <Input
                    id="provider"
                    name="provider"
                    defaultValue={editingGrid?.provider || ''}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="product_type">Product Type</Label>
                  <Select name="product_type" defaultValue={editingGrid?.product_type || ''}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select product type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="motor">Motor</SelectItem>
                      <SelectItem value="two_wheeler">Two Wheeler</SelectItem>
                      <SelectItem value="commercial_vehicle">Commercial Vehicle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="product_subtype">Product Subtype</Label>
                <Input
                  id="product_subtype"
                  name="product_subtype"
                  defaultValue={editingGrid?.product_subtype || ''}
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="commission_rate">Commission Rate (%)</Label>
                  <Input
                    id="commission_rate"
                    name="commission_rate"
                    type="number"
                    step="0.01"
                    defaultValue={editingGrid?.commission_rate || ''}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="reward_rate">Reward Rate (%)</Label>
                  <Input
                    id="reward_rate"
                    name="reward_rate"
                    type="number"
                    step="0.01"
                    defaultValue={editingGrid?.reward_rate || 0}
                  />
                </div>
                <div>
                  <Label htmlFor="bonus_commission_rate">Bonus Rate (%)</Label>
                  <Input
                    id="bonus_commission_rate"
                    name="bonus_commission_rate"
                    type="number"
                    step="0.01"
                    defaultValue={editingGrid?.bonus_commission_rate || 0}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="min_premium">Min Premium</Label>
                  <Input
                    id="min_premium"
                    name="min_premium"
                    type="number"
                    defaultValue={editingGrid?.min_premium || ''}
                  />
                </div>
                <div>
                  <Label htmlFor="max_premium">Max Premium</Label>
                  <Input
                    id="max_premium"
                    name="max_premium"
                    type="number"
                    defaultValue={editingGrid?.max_premium || ''}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="vehicle_make">Vehicle Make</Label>
                  <Input
                    id="vehicle_make"
                    name="vehicle_make"
                    defaultValue={editingGrid?.vehicle_make || ''}
                  />
                </div>
                <div>
                  <Label htmlFor="cc_range">CC Range</Label>
                  <Input
                    id="cc_range"
                    name="cc_range"
                    placeholder="e.g., 1000-1500"
                    defaultValue={editingGrid?.cc_range || ''}
                  />
                </div>
                <div>
                  <Label htmlFor="gvw_range">GVW Range</Label>
                  <Input
                    id="gvw_range"
                    name="gvw_range"
                    placeholder="e.g., 3500-7500"
                    defaultValue={editingGrid?.gvw_range || ''}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="ncb_percentage">NCB Percentage</Label>
                <Input
                  id="ncb_percentage"
                  name="ncb_percentage"
                  type="number"
                  min="0"
                  max="50"
                  defaultValue={editingGrid?.ncb_percentage || ''}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="effective_from">Effective From</Label>
                  <Input
                    id="effective_from"
                    name="effective_from"
                    type="date"
                    defaultValue={editingGrid?.effective_from || new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="effective_to">Effective To</Label>
                  <Input
                    id="effective_to"
                    name="effective_to"
                    type="date"
                    defaultValue={editingGrid?.effective_to || ''}
                  />
                </div>
              </div>

              <Button type="submit" disabled={gridMutation.isPending}>
                {gridMutation.isPending ? 'Saving...' : editingGrid ? 'Update Grid' : 'Create Grid'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Provider</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Subtype</TableHead>
                <TableHead>Base %</TableHead>
                <TableHead>Reward %</TableHead>
                <TableHead>Bonus %</TableHead>
                <TableHead>Total %</TableHead>
                <TableHead>Premium Range</TableHead>
                <TableHead>Vehicle Make</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-4">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : grids.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-4">
                    No grids configured
                  </TableCell>
                </TableRow>
              ) : (
                grids.map((grid) => (
                  <TableRow key={grid.id}>
                    <TableCell>{grid.provider}</TableCell>
                    <TableCell>{grid.product_type}</TableCell>
                    <TableCell>{grid.product_subtype}</TableCell>
                    <TableCell>{grid.commission_rate}%</TableCell>
                    <TableCell>{grid.reward_rate}%</TableCell>
                    <TableCell>{grid.bonus_commission_rate}%</TableCell>
                    <TableCell className="font-semibold">
                      {(grid.commission_rate + grid.reward_rate + grid.bonus_commission_rate).toFixed(2)}%
                    </TableCell>
                    <TableCell>
                      {grid.min_premium ? `₹${grid.min_premium.toLocaleString()}` : 'No min'} - 
                      {grid.max_premium ? `₹${grid.max_premium.toLocaleString()}` : 'No max'}
                    </TableCell>
                    <TableCell>{grid.vehicle_make || 'Any'}</TableCell>
                    <TableCell>
                      <Badge variant={grid.is_active ? 'default' : 'secondary'}>
                        {grid.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(grid)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteMutation.mutate(grid.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}