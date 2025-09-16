import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search, Eye, Edit, Trash2, Filter } from "lucide-react";
import { format } from "date-fns";
import { usePolicies, type Policy } from "@/hooks/usePolicies";
import { PolicyForm } from "./PolicyForm";

interface PolicyListProps {
  userRole: string;
}

export function PolicyList({ userRole }: PolicyListProps) {
  const { policies, loading, deletePolicy } = usePolicies();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);

  const filteredPolicies = policies.filter(policy => {
    const matchesSearch = 
      policy.policy_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      policy.customer?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      policy.customer?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      policy.agent?.agent_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || policy.policy_status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleDelete = async (policyId: string) => {
    if (window.confirm("Are you sure you want to delete this policy?")) {
      await deletePolicy(policyId);
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'expired': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading policies...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Policy Management</h1>
          <p className="text-muted-foreground">
            Manage insurance policies and customer information
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Policy
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Policy</DialogTitle>
              <DialogDescription>
                Add a new insurance policy to the system.
              </DialogDescription>
            </DialogHeader>
            <PolicyForm
              onSuccess={() => setShowCreateDialog(false)}
              onCancel={() => setShowCreateDialog(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by policy number, customer name, or agent..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Policies Table */}
      <Card>
        <CardHeader>
          <CardTitle>Policies ({filteredPolicies.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredPolicies.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Plus className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>No policies found. Create your first policy to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Policy Number</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Product Type</TableHead>
                  <TableHead>Premium</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPolicies.map((policy) => (
                  <TableRow key={policy.id}>
                    <TableCell className="font-mono text-sm">
                      {policy.policy_number}
                    </TableCell>
                    <TableCell>
                      {policy.customer ? 
                        `${policy.customer.first_name} ${policy.customer.last_name}` : 
                        'Unknown Customer'
                      }
                    </TableCell>
                    <TableCell>{policy.product_type?.name || 'Unknown'}</TableCell>
                    <TableCell>
                      ₹{policy.premium_with_gst?.toLocaleString() || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(policy.policy_status)}>
                        {policy.policy_status || 'Unknown'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {policy.created_at ? format(new Date(policy.created_at), 'MMM d, yyyy') : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedPolicy(policy)}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedPolicy(policy);
                            setShowEditDialog(true);
                          }}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        {(userRole === 'admin' || userRole === 'superadmin') && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(policy.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Policy</DialogTitle>
            <DialogDescription>
              Update policy information.
            </DialogDescription>
          </DialogHeader>
          {selectedPolicy && (
            <PolicyForm
              policy={selectedPolicy}
              onSuccess={() => {
                setShowEditDialog(false);
                setSelectedPolicy(null);
              }}
              onCancel={() => {
                setShowEditDialog(false);
                setSelectedPolicy(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={!!selectedPolicy && !showEditDialog} onOpenChange={() => setSelectedPolicy(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Policy Details</DialogTitle>
          </DialogHeader>
          {selectedPolicy && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><strong>Policy Number:</strong> {selectedPolicy.policy_number}</div>
                <div><strong>Status:</strong> 
                  <Badge className={`ml-2 ${getStatusColor(selectedPolicy.policy_status)}`}>
                    {selectedPolicy.policy_status || 'Unknown'}
                  </Badge>
                </div>
                <div><strong>Customer:</strong> 
                  {selectedPolicy.customer ? 
                    `${selectedPolicy.customer.first_name} ${selectedPolicy.customer.last_name}` : 
                    'Unknown'
                  }
                </div>
                <div><strong>Product Type:</strong> 
                  {typeof selectedPolicy.product_type === 'string' 
                    ? selectedPolicy.product_type 
                    : selectedPolicy.product_type?.name || 'Unknown'}
                </div>
                <div><strong>Premium:</strong> ₹{selectedPolicy.premium_with_gst?.toLocaleString() || 'N/A'}</div>
                <div><strong>Created:</strong> 
                  {selectedPolicy.created_at ? format(new Date(selectedPolicy.created_at), 'PPP') : 'N/A'}
                </div>
              </div>
              
              {selectedPolicy.dynamic_details && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Additional Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-sm bg-muted p-3 rounded-md overflow-auto">
                      {JSON.stringify(selectedPolicy.dynamic_details, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}