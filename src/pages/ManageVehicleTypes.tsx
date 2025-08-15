import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { VehicleTypeModal } from '@/components/VehicleTypeModal';
import { VehicleDataModal } from '@/components/VehicleDataModal';

interface VehicleType {
  vehicle_type_id: number;
  vehicle_type_name: string;
  description?: string;
  status: boolean;
  created_at?: string;
  updated_at?: string;
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
  master_vehicle_types?: {
    vehicle_type_name: string;
  };
}

const ManageVehicleTypes = () => {
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [vehicleData, setVehicleData] = useState<VehicleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [vehicleTypeModalOpen, setVehicleTypeModalOpen] = useState(false);
  const [vehicleDataModalOpen, setVehicleDataModalOpen] = useState(false);
  const [selectedVehicleType, setSelectedVehicleType] = useState<VehicleType | null>(null);
  const [selectedVehicleData, setSelectedVehicleData] = useState<VehicleData | null>(null);
  const [activeTab, setActiveTab] = useState<'types' | 'data'>('types');
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch vehicle types
      const { data: typesData, error: typesError } = await supabase.functions.invoke('master-vehicle-types', {
        method: 'GET'
      });

      if (typesError) throw typesError;
      setVehicleTypes(typesData || []);

      // Fetch vehicle data
      const { data: vehiclesData, error: vehiclesError } = await supabase.functions.invoke('master-vehicle-data', {
        method: 'GET'
      });

      if (vehiclesError) throw vehiclesError;
      setVehicleData(vehiclesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch vehicle data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVehicleType = async (id: number) => {
    if (!confirm('Are you sure you want to delete this vehicle type?')) return;

    try {
      const { error } = await supabase.functions.invoke(`master-vehicle-types/${id}`, {
        method: 'DELETE'
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Vehicle type deleted successfully"
      });
      
      fetchData();
    } catch (error) {
      console.error('Error deleting vehicle type:', error);
      toast({
        title: "Error",
        description: "Failed to delete vehicle type",
        variant: "destructive"
      });
    }
  };

  const handleDeleteVehicleData = async (id: number) => {
    if (!confirm('Are you sure you want to delete this vehicle data?')) return;

    try {
      const { error } = await supabase.functions.invoke(`master-vehicle-data/${id}`, {
        method: 'DELETE'
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Vehicle data deleted successfully"
      });
      
      fetchData();
    } catch (error) {
      console.error('Error deleting vehicle data:', error);
      toast({
        title: "Error",
        description: "Failed to delete vehicle data",
        variant: "destructive"
      });
    }
  };

  const handleVehicleTypeModalClose = () => {
    setVehicleTypeModalOpen(false);
    setSelectedVehicleType(null);
    fetchData();
  };

  const handleVehicleDataModalClose = () => {
    setVehicleDataModalOpen(false);
    setSelectedVehicleData(null);
    fetchData();
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="container-padding section-padding">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Manage Vehicle Types & Data</h1>
        <p className="text-muted-foreground">Manage vehicle types and master vehicle data</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6">
        <Button
          variant={activeTab === 'types' ? 'default' : 'outline'}
          onClick={() => setActiveTab('types')}
        >
          Vehicle Types
        </Button>
        <Button
          variant={activeTab === 'data' ? 'default' : 'outline'}
          onClick={() => setActiveTab('data')}
        >
          Vehicle Data
        </Button>
      </div>

      {activeTab === 'types' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Vehicle Types</CardTitle>
            <Button onClick={() => setVehicleTypeModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Vehicle Type
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Vehicle Type Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vehicleTypes.map((vehicleType) => (
                  <TableRow key={vehicleType.vehicle_type_id}>
                    <TableCell>{vehicleType.vehicle_type_id}</TableCell>
                    <TableCell className="font-medium">{vehicleType.vehicle_type_name}</TableCell>
                    <TableCell>{vehicleType.description || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={vehicleType.status ? 'default' : 'secondary'}>
                        {vehicleType.status ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedVehicleType(vehicleType);
                            setVehicleTypeModalOpen(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteVehicleType(vehicleType.vehicle_type_id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {activeTab === 'data' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Master Vehicle Data</CardTitle>
            <Button onClick={() => setVehicleDataModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Vehicle Data
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Vehicle Type</TableHead>
                  <TableHead>Make</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Variant</TableHead>
                  <TableHead>CC</TableHead>
                  <TableHead>Fuel Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vehicleData.map((vehicle) => (
                  <TableRow key={vehicle.vehicle_id}>
                    <TableCell>{vehicle.vehicle_id}</TableCell>
                    <TableCell>{vehicle.master_vehicle_types?.vehicle_type_name || '-'}</TableCell>
                    <TableCell className="font-medium">{vehicle.make}</TableCell>
                    <TableCell>{vehicle.model}</TableCell>
                    <TableCell>{vehicle.variant || '-'}</TableCell>
                    <TableCell>{vehicle.cubic_capacity || '-'}</TableCell>
                    <TableCell>{vehicle.fuel_type || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={vehicle.status ? 'default' : 'secondary'}>
                        {vehicle.status ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedVehicleData(vehicle);
                            setVehicleDataModalOpen(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteVehicleData(vehicle.vehicle_id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <VehicleTypeModal
        open={vehicleTypeModalOpen}
        onClose={handleVehicleTypeModalClose}
        vehicleType={selectedVehicleType}
      />

      <VehicleDataModal
        open={vehicleDataModalOpen}
        onClose={handleVehicleDataModalClose}
        vehicleData={selectedVehicleData}
        vehicleTypes={vehicleTypes}
      />
    </div>
  );
};

export default ManageVehicleTypes;