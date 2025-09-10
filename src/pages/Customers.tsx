import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Edit, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { SidebarProvider } from '@/components/ui/sidebar';
import AppSidebar from '@/components/AppSidebar';
import AppHeader from '@/components/AppHeader';
import { useCustomers, Customer, CustomerFilters } from '@/hooks/useCustomers';
import CustomerForm from '@/components/CustomerForm';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';

const Customers: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [filters, setFilters] = useState<CustomerFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const { profile } = useAuth();
  const {
    customers,
    loading,
    totalCount,
    fetchCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    canCreate,
    canUpdate,
    canDelete,
  } = useCustomers();

  useEffect(() => {
    fetchCustomers(currentPage, pageSize, filters);
  }, [currentPage, pageSize, filters]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setFilters(prev => ({ ...prev, search: value }));
    setCurrentPage(1);
  };

  const handleFilterChange = (key: keyof CustomerFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value || undefined }));
    setCurrentPage(1);
  };

  const handleCreateSubmit = async (data: any) => {
    try {
      setFormLoading(true);
      await createCustomer(data);
      setShowCreateDialog(false);
      fetchCustomers(currentPage, pageSize, filters);
    } catch (error) {
      console.error('Error creating customer:', error);
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditSubmit = async (data: any) => {
    if (!selectedCustomer) return;
    
    try {
      setFormLoading(true);
      await updateCustomer(selectedCustomer.id, data);
      setShowEditDialog(false);
      setSelectedCustomer(null);
      fetchCustomers(currentPage, pageSize, filters);
    } catch (error) {
      console.error('Error updating customer:', error);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCustomer) return;
    
    try {
      await deleteCustomer(selectedCustomer.id);
      setShowDeleteDialog(false);
      setSelectedCustomer(null);
      fetchCustomers(currentPage, pageSize, filters);
    } catch (error) {
      console.error('Error deleting customer:', error);
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  const getMaritalStatusBadge = (status?: string) => {
    if (!status) return null;
    
    const variants: Record<string, any> = {
      single: 'default',
      married: 'secondary',
      divorced: 'destructive',
      widowed: 'outline',
    };

    return (
      <Badge variant={variants[status] || 'default'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatAddress = (address?: any) => {
    if (!address) return 'N/A';
    const parts = [address.street, address.city, address.state, address.zipcode, address.country]
      .filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'N/A';
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <AppHeader />
          <main className="flex-1 p-6 bg-background">
            <div className="container mx-auto space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-foreground">Customer Management</h1>
                  <p className="text-muted-foreground">
                    Manage your customer database and relationships
                  </p>
                </div>
                {canCreate && (
                  <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Customer
                  </Button>
                )}
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Customers</CardTitle>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by name, email, or phone..."
                        value={searchTerm}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Select
                      value={filters.marital_status || ''}
                      onValueChange={(value) => handleFilterChange('marital_status', value)}
                    >
                      <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="Marital Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Status</SelectItem>
                        <SelectItem value="single">Single</SelectItem>
                        <SelectItem value="married">Married</SelectItem>
                        <SelectItem value="divorced">Divorced</SelectItem>
                        <SelectItem value="widowed">Widowed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : (
                    <>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Marital Status</TableHead>
                            <TableHead>Agent</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {customers.map((customer) => (
                            <TableRow key={customer.id}>
                              <TableCell className="font-medium">
                                {customer.customer_name}
                              </TableCell>
                              <TableCell>{customer.email || 'N/A'}</TableCell>
                              <TableCell>{customer.phone || 'N/A'}</TableCell>
                              <TableCell>{getMaritalStatusBadge(customer.marital_status)}</TableCell>
                              <TableCell>
                                {customer.agent 
                                  ? `${customer.agent.first_name} ${customer.agent.last_name}`.trim()
                                  : 'Unassigned'
                                }
                              </TableCell>
                              <TableCell>
                                {format(new Date(customer.created_at), 'MMM dd, yyyy')}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end space-x-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedCustomer(customer);
                                      setShowViewDialog(true);
                                    }}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  {canUpdate && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedCustomer(customer);
                                        setShowEditDialog(true);
                                      }}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  )}
                                  {canDelete && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedCustomer(customer);
                                        setShowDeleteDialog(true);
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>

                      {/* Pagination */}
                      {totalPages > 1 && (
                        <div className="flex justify-between items-center mt-4">
                          <p className="text-sm text-muted-foreground">
                            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} customers
                          </p>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                              disabled={currentPage === 1}
                            >
                              Previous
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                              disabled={currentPage === totalPages}
                            >
                              Next
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

      {/* Create Customer Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
            <DialogDescription>
              Fill in the customer information below to create a new customer record.
            </DialogDescription>
          </DialogHeader>
          <CustomerForm
            onSubmit={handleCreateSubmit}
            onCancel={() => setShowCreateDialog(false)}
            loading={formLoading}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Customer Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
            <DialogDescription>
              Update the customer information below.
            </DialogDescription>
          </DialogHeader>
          {selectedCustomer && (
            <CustomerForm
              customer={selectedCustomer}
              onSubmit={handleEditSubmit}
              onCancel={() => {
                setShowEditDialog(false);
                setSelectedCustomer(null);
              }}
              loading={formLoading}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* View Customer Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Customer Details</DialogTitle>
          </DialogHeader>
          {selectedCustomer && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-foreground">Basic Information</h4>
                  <div className="mt-2 space-y-2 text-sm">
                    <p><span className="font-medium">Name:</span> {selectedCustomer.customer_name}</p>
                    <p><span className="font-medium">DOB:</span> {selectedCustomer.dob ? format(new Date(selectedCustomer.dob), 'MMM dd, yyyy') : 'N/A'}</p>
                    <p><span className="font-medium">Phone:</span> {selectedCustomer.phone || 'N/A'}</p>
                    <p><span className="font-medium">Email:</span> {selectedCustomer.email || 'N/A'}</p>
                    <p><span className="font-medium">Marital Status:</span> {selectedCustomer.marital_status || 'N/A'}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-foreground">Address</h4>
                  <div className="mt-2 text-sm">
                    <p>{formatAddress(selectedCustomer.address)}</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-foreground">Nominee Information</h4>
                  <div className="mt-2 space-y-2 text-sm">
                    <p><span className="font-medium">Name:</span> {selectedCustomer.nominee_name || 'N/A'}</p>
                    <p><span className="font-medium">Relationship:</span> {selectedCustomer.nominee_relationship || 'N/A'}</p>
                    <p><span className="font-medium">Phone:</span> {selectedCustomer.nominee_phone || 'N/A'}</p>
                    <p><span className="font-medium">Email:</span> {selectedCustomer.nominee_email || 'N/A'}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-foreground">Assignment</h4>
                  <div className="mt-2 text-sm">
                    <p><span className="font-medium">Agent:</span> {selectedCustomer.agent ? `${selectedCustomer.agent.first_name} ${selectedCustomer.agent.last_name}`.trim() : 'Unassigned'}</p>
                    <p><span className="font-medium">Created:</span> {format(new Date(selectedCustomer.created_at), 'MMM dd, yyyy HH:mm')}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Customer Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the customer
              record for {selectedCustomer?.customer_name}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedCustomer(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Customers;