import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { CommissionTierModal } from './CommissionTierModal';

interface CommissionTier {
  id: string;
  name: string;
  description?: string;
  base_percentage: number;
  min_premium?: number;
  max_premium?: number;
  product_type_id?: string;
  provider_id?: string;
  is_active: boolean;
  created_at: string;
  product_types?: { name: string };
}

export function CommissionTiersManagement() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<CommissionTier | null>(null);
  const queryClient = useQueryClient();

  const { data: tiers, isLoading } = useQuery({
    queryKey: ['commission-tiers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('commission_tiers' as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data as any[]).map((tier: any) => ({
        ...tier,
        product_types: null // We'll handle this separately for now
      })) as CommissionTier[];
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('commission_tiers' as any)
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commission-tiers'] });
      toast.success('Commission tier deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete commission tier');
      console.error('Delete error:', error);
    }
  });

  const handleEdit = (tier: CommissionTier) => {
    setEditingTier(tier);
    setModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this commission tier?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingTier(null);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Commission Tiers</CardTitle>
          <Button 
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Tier
          </Button>
        </CardHeader>
        <CardContent>
          {!tiers || tiers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No commission tiers found. Create your first tier to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Base %</TableHead>
                    <TableHead>Premium Range</TableHead>
                    <TableHead>Product Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tiers.map((tier) => (
                    <TableRow key={tier.id}>
                      <TableCell className="font-medium">{tier.name}</TableCell>
                      <TableCell>{tier.description || '-'}</TableCell>
                      <TableCell>{tier.base_percentage}%</TableCell>
                      <TableCell>
                        {tier.min_premium || tier.max_premium ? (
                          <>
                            {tier.min_premium ? `₹${tier.min_premium.toLocaleString()}` : '₹0'} - {' '}
                            {tier.max_premium ? `₹${tier.max_premium.toLocaleString()}` : '∞'}
                          </>
                        ) : (
                          'All ranges'
                        )}
                      </TableCell>
                      <TableCell>
                        {tier.product_types?.name || 'All products'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={tier.is_active ? 'default' : 'secondary'}>
                          {tier.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(tier)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(tier.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <CommissionTierModal
        open={modalOpen}
        onOpenChange={handleCloseModal}
        tier={editingTier}
      />
    </>
  );
}