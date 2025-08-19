import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Building2, Plus, Search, Eye, Edit, Trash2, Users, MapPin, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BackButton } from '@/components/ui/back-button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import BranchFormModal from '@/components/BranchFormModal';
import BranchDetailsModal from '@/components/BranchDetailsModal';
import AssignDepartmentsModal from '@/components/AssignDepartmentsModal';

interface Branch {
  branch_id: number;
  branch_name: string;
  address: string;
  status: string;
  created_at: string;
  manager?: {
    employee_id: number;
    name: string;
    email: string;
  };
  departments?: Array<{
    dept_id: number;
    master_departments: {
      department_id: number;
      department_name: string;
      department_code: string;
    };
  }>;
}

const BranchManagementPage = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('tenant-branches', {
        method: 'GET'
      });

      if (error) throw error;
      
      if (data.success) {
        setBranches(data.branches || []);
      } else {
        throw new Error(data.error || 'Failed to fetch branches');
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
      toast({
        title: "Error",
        description: "Failed to fetch branches",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (branchId: number) => {
    if (!confirm('Are you sure you want to delete this branch?')) return;

    try {
      const { error } = await supabase.functions.invoke(`tenant-branches/${branchId}`, {
        method: 'DELETE'
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Branch deleted successfully",
      });

      fetchBranches();
    } catch (error) {
      console.error('Error deleting branch:', error);
      toast({
        title: "Error",
        description: "Failed to delete branch",
        variant: "destructive",
      });
    }
  };

  const openEditModal = (branch: Branch) => {
    setSelectedBranch(branch);
    setShowEditModal(true);
  };

  const openDetailsModal = (branch: Branch) => {
    setSelectedBranch(branch);
    setShowDetailsModal(true);
  };

  const openAssignModal = (branch: Branch) => {
    setSelectedBranch(branch);
    setShowAssignModal(true);
  };

  const filteredBranches = branches.filter(branch =>
    branch.branch_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    branch.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getDepartmentsSummary = (departments?: Branch['departments']) => {
    if (!departments || departments.length === 0) {
      return 'No departments assigned';
    }
    
    if (departments.length <= 2) {
      return departments.map(d => d.master_departments.department_code).join(', ');
    }
    
    return `${departments.length} Departments`;
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-secondary/10">
      {/* Header */}
      <header className="bg-card border-b border-border/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <BackButton to="/tenant-admin-dashboard" />
              <div className="ml-4">
                <h1 className="text-xl font-bold text-primary flex items-center">
                  <Building2 className="w-6 h-6 mr-2" />
                  Branch Management
                </h1>
                <p className="text-sm text-muted-foreground">Manage your organization's branches</p>
              </div>
            </div>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Branch
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Branch List</CardTitle>
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search branches..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Branch ID</TableHead>
                  <TableHead>Branch Name</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Manager</TableHead>
                  <TableHead>Assigned Departments</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBranches.map((branch) => (
                  <TableRow key={branch.branch_id}>
                    <TableCell className="font-medium">{branch.branch_id}</TableCell>
                    <TableCell className="font-semibold">{branch.branch_name}</TableCell>
                    <TableCell>
                      <div className="flex items-start space-x-2">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{branch.address || 'No address'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {branch.manager ? (
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{branch.manager.name}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">No manager assigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{getDepartmentsSummary(branch.departments)}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={branch.status === 'ACTIVE' ? 'default' : 'secondary'}>
                        {branch.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openDetailsModal(branch)}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEditModal(branch)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(branch.branch_id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openAssignModal(branch)}
                        >
                          <Settings className="h-3 w-3 mr-1" />
                          Assign Departments
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {filteredBranches.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No branches found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Modals */}
      <BranchFormModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false);
          fetchBranches();
        }}
        mode="create"
      />

      {selectedBranch && (
        <>
          <BranchFormModal
            isOpen={showEditModal}
            onClose={() => {
              setShowEditModal(false);
              setSelectedBranch(null);
            }}
            onSuccess={() => {
              setShowEditModal(false);
              setSelectedBranch(null);
              fetchBranches();
            }}
            mode="edit"
            branch={selectedBranch}
          />

          <BranchDetailsModal
            isOpen={showDetailsModal}
            onClose={() => {
              setShowDetailsModal(false);
              setSelectedBranch(null);
            }}
            branch={selectedBranch}
            onEdit={() => {
              setShowDetailsModal(false);
              setShowEditModal(true);
            }}
            onAssignDepartments={() => {
              setShowDetailsModal(false);
              setShowAssignModal(true);
            }}
          />

          <AssignDepartmentsModal
            isOpen={showAssignModal}
            onClose={() => {
              setShowAssignModal(false);
              setSelectedBranch(null);
            }}
            onSuccess={() => {
              setShowAssignModal(false);
              setSelectedBranch(null);
              fetchBranches();
            }}
            branch={selectedBranch}
          />
        </>
      )}
    </div>
  );
};

export default BranchManagementPage;