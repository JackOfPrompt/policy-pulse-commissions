import { useState, useEffect } from "react";
import { Plus, Search, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { CreateEditPremiumFrequencyModal } from "@/components/CreateEditPremiumFrequencyModal";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ListView, GridView, KanbanView, ViewToggle, useViewMode } from '@/components/ui/list-views';

interface PremiumFrequency {
  frequency_id: number;
  frequency_name: string;
  frequency_code: string;
  frequency_days: number;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export default function ManagePremiumFrequency() {
  const [frequencies, setFrequencies] = useState<PremiumFrequency[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFrequency, setEditingFrequency] = useState<PremiumFrequency | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [frequencyToDelete, setFrequencyToDelete] = useState<PremiumFrequency | null>(null);
  const { toast } = useToast();
  const { viewMode, setViewMode } = useViewMode({ defaultView: 'list', storageKey: 'premium-frequency-view' });

  const fetchFrequencies = async () => {
    try {
      const { data, error } = await supabase
        .from('master_premium_frequency')
        .select('*')
        .order('frequency_name');

      if (error) throw error;
      setFrequencies(data || []);
    } catch (error) {
      console.error('Error fetching premium frequencies:', error);
      toast({
        title: "Error",
        description: "Failed to fetch premium frequencies",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFrequencies();
  }, []);

  const handleCreateSuccess = () => {
    fetchFrequencies();
    setIsModalOpen(false);
    toast({
      title: "Success",
      description: "Premium frequency created successfully",
    });
  };

  const handleEditSuccess = () => {
    fetchFrequencies();
    setIsModalOpen(false);
    setEditingFrequency(null);
    toast({
      title: "Success",
      description: "Premium frequency updated successfully",
    });
  };

  const handleEdit = (frequency: PremiumFrequency) => {
    setEditingFrequency(frequency);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (frequency: PremiumFrequency) => {
    setFrequencyToDelete(frequency);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!frequencyToDelete) return;

    try {
      const { error } = await supabase
        .from('master_premium_frequency')
        .delete()
        .eq('frequency_id', frequencyToDelete.frequency_id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Premium frequency deleted successfully",
      });
      fetchFrequencies();
    } catch (error) {
      console.error('Error deleting premium frequency:', error);
      toast({
        title: "Error",
        description: "Failed to delete premium frequency",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setFrequencyToDelete(null);
    }
  };

  const filteredFrequencies = frequencies.filter((frequency) => {
    const matchesSearch = frequency.frequency_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         frequency.frequency_code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "active" && frequency.is_active) ||
                         (statusFilter === "inactive" && !frequency.is_active);
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading premium frequencies...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Premium Frequency Management</h1>
          <p className="text-muted-foreground">Manage premium payment frequencies</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add New Frequency
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Premium Frequencies</CardTitle>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "inactive")}
              className="px-3 py-2 border border-input bg-background rounded-md text-sm"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Frequency Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Days</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFrequencies.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      No premium frequencies found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredFrequencies.map((frequency) => (
                    <TableRow key={frequency.frequency_id}>
                      <TableCell className="font-medium">
                        {frequency.frequency_id}
                      </TableCell>
                      <TableCell>{frequency.frequency_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{frequency.frequency_code}</Badge>
                      </TableCell>
                      <TableCell>{frequency.frequency_days}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {frequency.description || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={frequency.is_active ? "default" : "secondary"}>
                          {frequency.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(frequency)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteClick(frequency)}
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
          </div>
        </CardContent>
      </Card>

      <CreateEditPremiumFrequencyModal
        open={isModalOpen}
        onOpenChange={(open) => {
          setIsModalOpen(open);
          if (!open) {
            setEditingFrequency(null);
          }
        }}
        frequency={editingFrequency}
        onSuccess={editingFrequency ? handleEditSuccess : handleCreateSuccess}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Premium Frequency</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the premium frequency "{frequencyToDelete?.frequency_name}"? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}