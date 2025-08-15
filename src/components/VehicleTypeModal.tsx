import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface VehicleType {
  vehicle_type_id: number;
  vehicle_type_name: string;
  description?: string;
  status: boolean;
}

interface VehicleTypeModalProps {
  open: boolean;
  onClose: () => void;
  vehicleType?: VehicleType | null;
}

export const VehicleTypeModal = ({ open, onClose, vehicleType }: VehicleTypeModalProps) => {
  const [formData, setFormData] = useState({
    vehicle_type_name: '',
    description: '',
    status: true
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (vehicleType) {
      setFormData({
        vehicle_type_name: vehicleType.vehicle_type_name,
        description: vehicleType.description || '',
        status: vehicleType.status
      });
    } else {
      setFormData({
        vehicle_type_name: '',
        description: '',
        status: true
      });
    }
  }, [vehicleType, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const method = vehicleType ? 'PUT' : 'POST';
      const url = vehicleType ? `master-vehicle-types/${vehicleType.vehicle_type_id}` : 'master-vehicle-types';

      const { error } = await supabase.functions.invoke(url, {
        method,
        body: formData
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Vehicle type ${vehicleType ? 'updated' : 'created'} successfully`
      });

      onClose();
    } catch (error) {
      console.error('Error saving vehicle type:', error);
      toast({
        title: "Error",
        description: "Failed to save vehicle type",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {vehicleType ? 'Edit Vehicle Type' : 'Add Vehicle Type'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="vehicle_type_name">Vehicle Type Name</Label>
            <Input
              id="vehicle_type_name"
              value={formData.vehicle_type_name}
              onChange={(e) => handleInputChange('vehicle_type_name', e.target.value)}
              placeholder="e.g., Two Wheeler, Four Wheeler"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Description of the vehicle type"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status ? 'true' : 'false'}
              onValueChange={(value) => handleInputChange('status', value === 'true')}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};