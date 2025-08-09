import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Search, Edit, Trash2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { LineOfBusinessForm } from "@/components/admin/LineOfBusinessForm";
import BulkUploadModal from "@/components/admin/BulkUploadModal";
import { getLOBTemplateColumns, getLOBSampleData, validateLOBRow, processLOBRow } from "@/utils/lobBulkUpload";

interface LineOfBusiness {
  lob_id: string;
  lob_name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  lob_code?: string;
}

const LineOfBusinessTab = () => {
  const [lobs, setLobs] = useState<LineOfBusiness[]>([]);
  const [filteredLobs, setFilteredLobs] = useState<LineOfBusiness[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [editingLob, setEditingLob] = useState<LineOfBusiness | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchLobs();
  }, []);

  useEffect(() => {
    filterLobs();
  }, [lobs, searchTerm, statusFilter]);

  const fetchLobs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('lines_of_business')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLobs((data as LineOfBusiness[]) || []);
    } catch (error: any) {
      console.error('Error fetching LOBs:', error);
      toast({
        title: "Error",
        description: "Failed to fetch lines of business",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterLobs = () => {
    let filtered = lobs;

    if (searchTerm) {
      filtered = filtered.filter(lob =>
        lob.lob_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (lob.description && lob.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(lob => 
        statusFilter === "active" ? lob.is_active : !lob.is_active
      );
    }

    setFilteredLobs(filtered);
  };

  const handleEdit = (lob: LineOfBusiness) => {
    setEditingLob(lob);
    setShowForm(true);
  };

  const handleDelete = async (lobId: string, lobName: string) => {
    try {
      const { error } = await supabase
        .from('lines_of_business')
        .update({ is_active: false })
        .eq('lob_id', lobId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${lobName} has been archived`
      });
      
      fetchLobs();
    } catch (error: any) {
      console.error('Error archiving LOB:', error);
      toast({
        title: "Error",
        description: "Failed to archive line of business",
        variant: "destructive"
      });
    }
  };

  const toggleLOBStatus = async (lobId: string, currentStatus: boolean, lobName: string) => {
    const newStatus = !currentStatus;
    
    try {
      const { error } = await supabase
        .from('lines_of_business')
        .update({ is_active: newStatus })
        .eq('lob_id', lobId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${lobName} has been ${newStatus ? 'activated' : 'deactivated'}`
      });
      
      fetchLobs();
    } catch (error: any) {
      console.error('Error updating LOB status:', error);
      toast({
        title: "Error",
        description: "Failed to update LOB status",
        variant: "destructive"
      });
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingLob(null);
    fetchLobs();
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingLob(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Lines of Business</h2>
          <p className="text-muted-foreground mt-1">
            Define and manage lines of business for products
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowBulkUpload(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Bulk Upload
          </Button>
          <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingLob(null)}>
                <Plus className="h-4 w-4 mr-2" />
                Add New LOB
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingLob ? "Edit LOB" : "Add New LOB"}
                </DialogTitle>
              </DialogHeader>
              <LineOfBusinessForm
                lob={editingLob}
                onSuccess={handleFormSuccess}
                onCancel={handleFormCancel}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 p-4 bg-muted/50 rounded-lg">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search LOBs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-input bg-background px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading lines of business...
          </div>
        ) : filteredLobs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No lines of business found
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
                {filteredLobs.map((lob) => (
                <TableRow key={lob.lob_id}>
                  <TableCell className="font-medium">{lob.lob_name}</TableCell>
                  <TableCell>{lob.description || 'N/A'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant={lob.is_active ? 'default' : 'secondary'}>
                        {lob.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleLOBStatus(lob.lob_id, lob.is_active, lob.lob_name)}
                        className="h-6 px-2"
                      >
                        {lob.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(lob)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Archive LOB</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to archive "{lob.lob_name}"?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(lob.lob_id, lob.lob_name)}
                              >
                                Archive
                              </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Bulk Upload Modal */}
      <BulkUploadModal
        isOpen={showBulkUpload}
        onClose={() => setShowBulkUpload(false)}
        entityType="Line of Business"
        onSuccess={fetchLobs}
        templateColumns={getLOBTemplateColumns()}
        sampleData={getLOBSampleData()}
        validateRow={validateLOBRow}
        processRow={processLOBRow}
      />
    </div>
  );
};

export default LineOfBusinessTab;