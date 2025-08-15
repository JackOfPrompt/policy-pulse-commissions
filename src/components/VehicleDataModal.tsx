import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface VehicleType {
  vehicle_type_id: number;
  vehicle_type_name: string;
}

interface VehicleData {
  vehicle_id: number;
  vehicle_type_id: number;
  make: string;
  model: string;
  variant?: string;
  cubic_capacity?: number;
  fuel_type?: string;
  status: boolean;
}

interface VehicleDataModalProps {
  open: boolean;
  onClose: () => void;
  vehicleData?: VehicleData | null;
  vehicleTypes: VehicleType[];
}

const fuelTypes = ['Petrol', 'Diesel', 'Electric', 'Hybrid', 'CNG', 'LPG'];

export const VehicleDataModal = ({ open, onClose, vehicleData, vehicleTypes }: VehicleDataModalProps) => {
  const [formData, setFormData] = useState({
    vehicle_type_id: '',
    make: '',
    model: '',
    variant: '',
    cubic_capacity: '',
    fuel_type: '',
    status: true
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (vehicleData) {
      setFormData({
        vehicle_type_id: vehicleData.vehicle_type_id.toString(),
        make: vehicleData.make,
        model: vehicleData.model,
        variant: vehicleData.variant || '',
        cubic_capacity: vehicleData.cubic_capacity?.toString() || '',
        fuel_type: vehicleData.fuel_type || '',
        status: vehicleData.status
      });
    } else {
      setFormData({
        vehicle_type_id: '',
        make: '',
        model: '',
        variant: '',
        cubic_capacity: '',
        fuel_type: '',
        status: true
      });
    }
  }, [vehicleData, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = {
        vehicle_type_id: parseInt(formData.vehicle_type_id),
        make: formData.make,
        model: formData.model,
        variant: formData.variant || null,
        cubic_capacity: formData.cubic_capacity ? parseInt(formData.cubic_capacity) : null,
        fuel_type: formData.fuel_type || null,
        status: formData.status
      };

      const method = vehicleData ? 'PUT' : 'POST';
      const url = vehicleData ? `master-vehicle-data/${vehicleData.vehicle_id}` : 'master-vehicle-data';

      const { error } = await supabase.functions.invoke(url, {
        method,
        body: submitData
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Vehicle data ${vehicleData ? 'updated' : 'created'} successfully`
      });

      onClose();
    } catch (error) {
      console.error('Error saving vehicle data:', error);
      toast({
        title: "Error",
        description: "Failed to save vehicle data",
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
            {vehicleData ? 'Edit Vehicle Data' : 'Add Vehicle Data'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="vehicle_type_id">Vehicle Type</Label>
            <Select
              value={formData.vehicle_type_id}
              onValueChange={(value) => handleInputChange('vehicle_type_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select vehicle type" />
              </SelectTrigger>
              <SelectContent>
                {vehicleTypes.map((type) => (
                  <SelectItem key={type.vehicle_type_id} value={type.vehicle_type_id.toString()}>
                    {type.vehicle_type_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="make">Make</Label>
            <Input
              id="make"
              value={formData.make}
              onChange={(e) => handleInputChange('make', e.target.value)}
              placeholder="e.g., Honda, Maruti"
              required
            />
          </div>

          <div>
            <Label htmlFor="model">Model</Label>
            <Input
              id="model"
              value={formData.model}
              onChange={(e) => handleInputChange('model', e.target.value)}
              placeholder="e.g., Activa 6G, Swift"
              required
            />
          </div>

          <div>
            <Label htmlFor="variant">Variant</Label>
            <Input
              id="variant"
              value={formData.variant}
              onChange={(e) => handleInputChange('variant', e.target.value)}
              placeholder="e.g., Deluxe, ZX, LXI"
            />
          </div>

          <div>
            <Label htmlFor="cubic_capacity">Cubic Capacity (CC)</Label>
            <Input
              id="cubic_capacity"
              type="number"
              value={formData.cubic_capacity}
              onChange={(e) => handleInputChange('cubic_capacity', e.target.value)}
              placeholder="e.g., 110, 1200"
            />
          </div>

          <div>
            <Label htmlFor="fuel_type">Fuel Type</Label>
            <Select
              value={formData.fuel_type}
              onValueChange={(value) => handleInputChange('fuel_type', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select fuel type" />
              </SelectTrigger>
              <SelectContent>
                {fuelTypes.map((fuel) => (
                  <SelectItem key={fuel} value={fuel}>
                    {fuel}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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