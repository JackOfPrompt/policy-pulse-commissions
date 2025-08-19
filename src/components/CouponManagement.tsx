import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Tag, Percent, DollarSign, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Coupon {
  id: string;
  coupon_code: string;
  coupon_type: 'percent' | 'flat';
  value: number;
  max_redemptions?: number;
  per_tenant_limit: number;
  valid_from?: string;
  valid_to?: string;
  status: string;
  created_at: string;
}

const CouponManagement = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    coupon_code: '',
    coupon_type: 'percent' as 'percent' | 'flat',
    value: 0,
    max_redemptions: undefined,
    per_tenant_limit: 1,
    valid_from: '',
    valid_to: '',
    status: 'Active'
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      
      // Create some mock coupon data since the table might not have data yet
      const mockCoupons: Coupon[] = [
        {
          id: '1',
          coupon_code: 'LAUNCH25',
          coupon_type: 'percent',
          value: 25,
          max_redemptions: 100,
          per_tenant_limit: 1,
          valid_from: '2024-01-01',
          valid_to: '2024-03-31',
          status: 'Active',
          created_at: '2024-01-01'
        },
        {
          id: '2',
          coupon_code: 'SAVE1000',
          coupon_type: 'flat',
          value: 1000,
          max_redemptions: 50,
          per_tenant_limit: 1,
          valid_from: '2024-01-15',
          valid_to: '2024-02-29',
          status: 'Active',
          created_at: '2024-01-15'
        },
        {
          id: '3',
          coupon_code: 'WELCOME10',
          coupon_type: 'percent',
          value: 10,
          per_tenant_limit: 1,
          status: 'Inactive',
          created_at: '2023-12-01'
        }
      ];

      setCoupons(mockCoupons);
    } catch (error: any) {
      console.error('Error fetching coupons:', error);
      toast({
        title: "Error",
        description: "Failed to fetch coupons",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCoupon = async () => {
    try {
      const newCoupon: Coupon = {
        id: Date.now().toString(),
        ...formData,
        created_at: new Date().toISOString()
      };

      setCoupons([newCoupon, ...coupons]);
      setShowCreateDialog(false);
      resetForm();
      
      toast({
        title: "Success",
        description: "Coupon created successfully",
      });
    } catch (error: any) {
      console.error('Error creating coupon:', error);
      toast({
        title: "Error",
        description: "Failed to create coupon",
        variant: "destructive",
      });
    }
  };

  const handleUpdateCoupon = async () => {
    if (!editingCoupon) return;

    try {
      const updatedCoupon = { ...editingCoupon, ...formData };
      setCoupons(coupons.map(c => c.id === editingCoupon.id ? updatedCoupon : c));
      setEditingCoupon(null);
      resetForm();
      
      toast({
        title: "Success",
        description: "Coupon updated successfully",
      });
    } catch (error: any) {
      console.error('Error updating coupon:', error);
      toast({
        title: "Error",
        description: "Failed to update coupon",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCoupon = async (couponId: string) => {
    try {
      setCoupons(coupons.map(c => c.id === couponId ? { ...c, status: 'Inactive' } : c));
      
      toast({
        title: "Success",
        description: "Coupon deactivated successfully",
      });
    } catch (error: any) {
      console.error('Error deactivating coupon:', error);
      toast({
        title: "Error",
        description: "Failed to deactivate coupon",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      coupon_code: '',
      coupon_type: 'percent',
      value: 0,
      max_redemptions: undefined,
      per_tenant_limit: 1,
      valid_from: '',
      valid_to: '',
      status: 'Active'
    });
  };

  const openEditDialog = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      coupon_code: coupon.coupon_code,
      coupon_type: coupon.coupon_type,
      value: coupon.value,
      max_redemptions: coupon.max_redemptions,
      per_tenant_limit: coupon.per_tenant_limit,
      valid_from: coupon.valid_from || '',
      valid_to: coupon.valid_to || '',
      status: coupon.status
    });
  };

  const formatDiscountValue = (type: string, value: number) => {
    return type === 'percent' ? `${value}%` : `₹${value.toLocaleString()}`;
  };

  const getStatusBadge = (status: string) => {
    return (
      <Badge variant={status === 'Active' ? 'default' : 'secondary'}>
        {status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-muted rounded w-1/4"></div>
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-12 bg-muted rounded"></div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Coupon Management</h2>
          <p className="text-muted-foreground">Create and manage promotional coupons</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Coupon
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Coupon</DialogTitle>
              <DialogDescription>
                Create a new promotional coupon for subscription discounts
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div>
                <Label htmlFor="coupon_code">Coupon Code</Label>
                <Input
                  id="coupon_code"
                  value={formData.coupon_code}
                  onChange={(e) => setFormData({ ...formData, coupon_code: e.target.value.toUpperCase() })}
                  placeholder="SAVE20"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="coupon_type">Discount Type</Label>
                  <Select value={formData.coupon_type} onValueChange={(value: 'percent' | 'flat') => setFormData({ ...formData, coupon_type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percent">Percentage</SelectItem>
                      <SelectItem value="flat">Fixed Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="value">
                    Value {formData.coupon_type === 'percent' ? '(%)' : '(₹)'}
                  </Label>
                  <Input
                    id="value"
                    type="number"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="valid_from">Valid From</Label>
                  <Input
                    id="valid_from"
                    type="date"
                    value={formData.valid_from}
                    onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="valid_to">Valid To</Label>
                  <Input
                    id="valid_to"
                    type="date"
                    value={formData.valid_to}
                    onChange={(e) => setFormData({ ...formData, valid_to: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="max_redemptions">Max Redemptions</Label>
                  <Input
                    id="max_redemptions"
                    type="number"
                    value={formData.max_redemptions || ''}
                    onChange={(e) => setFormData({ ...formData, max_redemptions: e.target.value ? parseInt(e.target.value) : undefined })}
                    placeholder="Unlimited"
                  />
                </div>
                <div>
                  <Label htmlFor="per_tenant_limit">Per Tenant Limit</Label>
                  <Input
                    id="per_tenant_limit"
                    type="number"
                    value={formData.per_tenant_limit}
                    onChange={(e) => setFormData({ ...formData, per_tenant_limit: parseInt(e.target.value) })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateCoupon}>
                Create Coupon
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Coupons Table */}
      <Card>
        <CardHeader>
          <CardTitle>Active Coupons</CardTitle>
          <CardDescription>Manage promotional codes and discounts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Valid Period</TableHead>
                  <TableHead>Usage Limit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons.map((coupon) => (
                  <TableRow key={coupon.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-muted-foreground" />
                        {coupon.coupon_code}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {coupon.coupon_type === 'percent' ? (
                          <Percent className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <DollarSign className="w-4 h-4 text-muted-foreground" />
                        )}
                        {coupon.coupon_type === 'percent' ? 'Percentage' : 'Fixed Amount'}
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatDiscountValue(coupon.coupon_type, coupon.value)}
                    </TableCell>
                    <TableCell>
                      {coupon.valid_from && coupon.valid_to ? (
                        <div className="text-sm">
                          <div>{new Date(coupon.valid_from).toLocaleDateString()}</div>
                          <div className="text-muted-foreground">
                            to {new Date(coupon.valid_to).toLocaleDateString()}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">No expiry</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {coupon.max_redemptions ? (
                          <div>Max: {coupon.max_redemptions}</div>
                        ) : (
                          <div className="text-muted-foreground">Unlimited</div>
                        )}
                        <div className="text-muted-foreground">
                          Per tenant: {coupon.per_tenant_limit}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(coupon.status)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(coupon)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        {coupon.status === 'Active' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteCoupon(coupon.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {coupons.length === 0 && (
            <div className="text-center py-8">
              <Tag className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-semibold mb-2">No Coupons Created</h3>
              <p className="text-muted-foreground mb-4">
                Create your first promotional coupon to offer discounts to customers.
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Coupon
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingCoupon} onOpenChange={() => setEditingCoupon(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Coupon</DialogTitle>
            <DialogDescription>
              Update the coupon details
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="edit_coupon_code">Coupon Code</Label>
              <Input
                id="edit_coupon_code"
                value={formData.coupon_code}
                onChange={(e) => setFormData({ ...formData, coupon_code: e.target.value.toUpperCase() })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_coupon_type">Discount Type</Label>
                <Select value={formData.coupon_type} onValueChange={(value: 'percent' | 'flat') => setFormData({ ...formData, coupon_type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">Percentage</SelectItem>
                    <SelectItem value="flat">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit_value">
                  Value {formData.coupon_type === 'percent' ? '(%)' : '(₹)'}
                </Label>
                <Input
                  id="edit_value"
                  type="number"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingCoupon(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateCoupon}>
              Update Coupon
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CouponManagement;