import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useLOBs } from '@/hooks/useLOBs';
import CreateEditPlanTypeModal from '@/components/CreateEditPlanTypeModal';

interface PlanType {
  plan_type_id: string;
  plan_type_name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  lob_id: string;
  lob_name?: string;
}

const ManagePlanTypes: React.FC = () => {
  const [planTypes, setPlanTypes] = useState<PlanType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLOB, setSelectedLOB] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlanType, setEditingPlanType] = useState<PlanType | null>(null);
  const { toast } = useToast();
  const { lobs } = useLOBs();

  const fetchPlanTypes = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('master_plan_types')
        .select(`
          plan_type_id,
          plan_type_name,
          description,
          is_active,
          created_at,
          updated_at,
          lob_id,
          master_line_of_business (
            lob_name
          )
        `)
        .order('plan_type_name');

      const { data, error } = await query;

      if (error) throw error;

      // Transform the data to flatten the LOB information
      const transformedData = data?.map(item => ({
        ...item,
        lob_name: item.master_line_of_business?.lob_name || 'Unknown LOB'
      })) || [];

      setPlanTypes(transformedData);
    } catch (error) {
      console.error('Error fetching plan types:', error);
      toast({
        title: "Error",
        description: "Failed to fetch plan types",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlanTypes();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('master_plan_types')
        .delete()
        .eq('plan_type_id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Plan type deleted successfully",
      });
      
      fetchPlanTypes();
    } catch (error) {
      console.error('Error deleting plan type:', error);
      toast({
        title: "Error",
        description: "Failed to delete plan type",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (planType: PlanType) => {
    setEditingPlanType(planType);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingPlanType(null);
  };

  const handleModalSuccess = () => {
    fetchPlanTypes();
    handleModalClose();
  };

  // Filter plan types based on search term and selected LOB
  const filteredPlanTypes = planTypes.filter(planType => {
    const matchesSearch = planType.plan_type_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (planType.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesLOB = selectedLOB === 'all' || planType.lob_id === selectedLOB;
    return matchesSearch && matchesLOB;
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Plan Types Management</h1>
          <p className="text-muted-foreground">Manage insurance plan types for different lines of business</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Plan Type
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Plan Types</CardTitle>
          <CardDescription>
            All insurance plan types organized by line of business
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search plan types..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={selectedLOB} onValueChange={setSelectedLOB}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filter by LOB" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All LOBs</SelectItem>
                {lobs.map((lob) => (
                  <SelectItem key={lob.lob_id} value={lob.lob_id}>
                    {lob.lob_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Plan Types Table */}
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="text-muted-foreground">Loading...</div>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Line of Business</TableHead>
                    <TableHead>Plan Type Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPlanTypes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No plan types found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPlanTypes.map((planType) => (
                      <TableRow key={planType.plan_type_id}>
                        <TableCell className="font-medium">
                          {planType.lob_name}
                        </TableCell>
                        <TableCell className="font-medium">
                          {planType.plan_type_name}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {planType.description || '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={planType.is_active ? "default" : "secondary"}>
                            {planType.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(planType)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Plan Type</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{planType.plan_type_name}"? 
                                    This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(planType.plan_type_id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <CreateEditPlanTypeModal
        open={isModalOpen}
        onOpenChange={handleModalClose}
        planType={editingPlanType}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
};

export default ManagePlanTypes;