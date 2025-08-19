import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Edit2, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BackButton } from '@/components/ui/back-button';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import BulkImportOccupationsModal from '@/components/BulkImportOccupationsModal';

interface Occupation {
  occupation_id: string;
  occupation_name: string;
  occupation_code: string;
  description?: string;
  is_active: boolean;
  category?: string;
  risk_level?: string;
  created_at: string;
  updated_at: string;
}

const ManageOccupations = () => {
  const [occupations, setOccupations] = useState<Occupation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [editingOccupation, setEditingOccupation] = useState<Occupation | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    status: 'Active'
  });

  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || profile?.role !== 'system_admin') {
      navigate('/login');
      return;
    }
    fetchOccupations();
  }, [user, profile, navigate]);

  const fetchOccupations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('master_occupations')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setOccupations((data || []) as unknown as Occupation[]);
    } catch (error) {
      console.error('Error fetching occupations:', error);
      toast({
        title: "Error",
        description: "Failed to fetch occupations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingOccupation) {
        const { error } = await supabase
          .from('master_occupations')
          .update({
            occupation_name: formData.name,
            occupation_code: formData.code || formData.name.toUpperCase().replace(/\s+/g, '_').slice(0, 32),
            description: formData.description || null,
            is_active: formData.status === 'Active',
            updated_at: new Date().toISOString()
          })
          .eq('occupation_id', editingOccupation.occupation_id as string);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Occupation updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('master_occupations')
          .insert({
            occupation_name: formData.name,
            occupation_code: formData.code || formData.name.toUpperCase().replace(/\s+/g, '_').slice(0, 32),
            description: formData.description || null,
            is_active: formData.status === 'Active',
            updated_at: new Date().toISOString()
          });

        if (error) throw error;

        toast({
          title: "Success",
          description: "Occupation created successfully",
        });
      }

      setIsDialogOpen(false);
      setEditingOccupation(null);
      setFormData({ name: '', code: '', description: '', status: 'Active' });
      fetchOccupations();
    } catch (error: any) {
      console.error('Error saving occupation:', error);
      
      if (error.code === '23505') {
        if (error.message.includes('master_occupations_name_key')) {
          toast({
            title: "Error",
            description: "An occupation with this name already exists",
            variant: "destructive",
          });
        } else if (error.message.includes('master_occupations_code_key')) {
          toast({
            title: "Error",
            description: "An occupation with this code already exists",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: "A duplicate occupation already exists",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Error",
          description: "Failed to save occupation",
          variant: "destructive",
        });
      }
    }
  };

  const handleEdit = (occupation: Occupation) => {
    setEditingOccupation(occupation);
    setFormData({
      name: occupation.occupation_name,
      code: occupation.occupation_code || '',
      description: occupation.description || '',
      status: occupation.is_active ? 'Active' : 'Inactive'
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (occupation: Occupation) => {
    if (!confirm('Are you sure you want to deactivate this occupation?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('master_occupations')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('occupation_id', occupation.occupation_id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Occupation deactivated successfully",
      });
      fetchOccupations();
    } catch (error) {
      console.error('Error deactivating occupation:', error);
      toast({
        title: "Error",
        description: "Failed to deactivate occupation",
        variant: "destructive",
      });
    }
  };

  const openCreateDialog = () => {
    setEditingOccupation(null);
    setFormData({ name: '', code: '', description: '', status: 'Active' });
    setIsDialogOpen(true);
  };

  const filteredOccupations = occupations.filter(occupation => {
    const matchesSearch = 
      occupation.occupation_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (occupation.occupation_code && occupation.occupation_code.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'All' || (occupation.is_active ? 'Active' : 'Inactive') === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-secondary/10">
      {/* Header */}
      <header className="bg-card border-b border-border/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <BackButton to="/admin-dashboard" />
              <div>
                <h1 className="text-xl font-bold text-primary">Manage Occupations</h1>
                <p className="text-sm text-muted-foreground">Master occupation data for policy creation</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Occupations</CardTitle>
                <CardDescription>Manage standard occupation values for customer profiling</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsBulkImportOpen(true)}>
                  <Upload className="w-4 h-4 mr-2" />
                  Bulk Import
                </Button>
                <Button onClick={openCreateDialog}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Occupation
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Search and Filter */}
            <div className="flex gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search occupations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background border shadow-lg z-50">
                  <SelectItem value="All">All Status</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Table */}
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : filteredOccupations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No occupations found. {searchTerm && "Try adjusting your search."}
              </div>
            ) : (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOccupations.map((occupation) => (
                      <TableRow key={occupation.occupation_id}>
                        <TableCell className="font-medium">{occupation.occupation_name}</TableCell>
                        <TableCell>{occupation.occupation_code || '-'}</TableCell>
                        <TableCell className="max-w-xs truncate">{occupation.description || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={occupation.is_active ? 'default' : 'secondary'}>
                            {occupation.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(occupation.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(occupation)}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            {occupation.is_active && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(occupation)}
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
            )}
          </CardContent>
        </Card>
      </main>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-background border shadow-lg z-50">
          <DialogHeader>
            <DialogTitle>
              {editingOccupation ? 'Edit Occupation' : 'Create New Occupation'}
            </DialogTitle>
            <DialogDescription>
              {editingOccupation ? 'Update the occupation details below.' : 'Enter the details for the new occupation.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Occupation Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Software Engineer"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="code">Occupation Code</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="e.g., OCC001"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Details about the occupation..."
                  rows={3}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">Status *</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-lg z-50">
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingOccupation ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Bulk Import Modal */}
      <BulkImportOccupationsModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
        onImportComplete={fetchOccupations}
      />
    </div>
  );
};

export default ManageOccupations;