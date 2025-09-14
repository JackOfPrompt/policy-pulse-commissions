import { useState } from "react";
import { Search, Plus, Eye, Filter } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusChip } from "@/components/ui/status-chip";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import customers from "@/data/employee/customers.json";
import policies from "@/data/employee/policies.json";
import users from "@/data/users.json";

export default function EmployeeCustomers() {
  const user = users.employee;
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.phone.includes(searchTerm);
    const matchesStatus = statusFilter === "all" || customer.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getCustomerPolicies = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    return policies.filter(p => customer?.policies.includes(p.id));
  };

  return (
    <DashboardLayout role="employee" user={user}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Customers</h1>
            <p className="text-muted-foreground">
              Manage and view customer information
            </p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Customer
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Customer</DialogTitle>
                <DialogDescription>
                  Enter customer details and nominee information
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" placeholder="Enter full name" />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="Enter email" />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" placeholder="Enter phone number" />
                </div>
                <div>
                  <Label htmlFor="dob">Date of Birth</Label>
                  <Input id="dob" type="date" />
                </div>
                <div>
                  <Label htmlFor="aadhaar">Aadhaar Number</Label>
                  <Input id="aadhaar" placeholder="1234-5678-9012" />
                </div>
                <div>
                  <Label htmlFor="pan">PAN Number</Label>
                  <Input id="pan" placeholder="ABCDE1234F" />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea id="address" placeholder="Enter complete address" />
                </div>
                <div>
                  <Label htmlFor="nomineeName">Nominee Name</Label>
                  <Input id="nomineeName" placeholder="Enter nominee name" />
                </div>
                <div>
                  <Label htmlFor="nomineeRelation">Relation</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select relation" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="spouse">Spouse</SelectItem>
                      <SelectItem value="father">Father</SelectItem>
                      <SelectItem value="mother">Mother</SelectItem>
                      <SelectItem value="son">Son</SelectItem>
                      <SelectItem value="daughter">Daughter</SelectItem>
                      <SelectItem value="brother">Brother</SelectItem>
                      <SelectItem value="sister">Sister</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="nomineePhone">Nominee Phone</Label>
                  <Input id="nomineePhone" placeholder="Enter nominee phone" />
                </div>
                <div>
                  <Label htmlFor="agent">Assign Agent</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select agent" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="priya">Priya Sharma</SelectItem>
                      <SelectItem value="rohit">Rohit Singh</SelectItem>
                      <SelectItem value="kavita">Kavita Joshi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <Button variant="outline">Cancel</Button>
                <Button>Add Customer</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Customer List</CardTitle>
            <CardDescription>
              View and manage all customers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search customers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Assigned Agent</TableHead>
                  <TableHead>Policies</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>{customer.phone}</TableCell>
                    <TableCell>{customer.email}</TableCell>
                    <TableCell>{customer.assignedAgent}</TableCell>
                    <TableCell>{customer.policies.length}</TableCell>
                    <TableCell>
                      <StatusChip
                        variant={
                          customer.status === 'active' ? 'success' :
                          customer.status === 'pending' ? 'warning' : 'secondary'
                        }
                      >
                        {customer.status}
                      </StatusChip>
                    </TableCell>
                    <TableCell>{new Date(customer.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedCustomer(customer)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl">
                          <DialogHeader>
                            <DialogTitle>{selectedCustomer?.name}</DialogTitle>
                            <DialogDescription>
                              Customer details and policies
                            </DialogDescription>
                          </DialogHeader>
                          {selectedCustomer && (
                            <Tabs defaultValue="details" className="mt-4">
                              <TabsList>
                                <TabsTrigger value="details">Details</TabsTrigger>
                                <TabsTrigger value="policies">Policies</TabsTrigger>
                                <TabsTrigger value="nominee">Nominee Info</TabsTrigger>
                              </TabsList>
                              <TabsContent value="details" className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label>Email</Label>
                                    <p className="text-sm text-muted-foreground">{selectedCustomer.email}</p>
                                  </div>
                                  <div>
                                    <Label>Phone</Label>
                                    <p className="text-sm text-muted-foreground">{selectedCustomer.phone}</p>
                                  </div>
                                  <div>
                                    <Label>Date of Birth</Label>
                                    <p className="text-sm text-muted-foreground">{new Date(selectedCustomer.dob).toLocaleDateString()}</p>
                                  </div>
                                  <div>
                                    <Label>Status</Label>
                                    <StatusChip
                                      variant={
                                        selectedCustomer.status === 'active' ? 'success' :
                                        selectedCustomer.status === 'pending' ? 'warning' : 'secondary'
                                      }
                                    >
                                      {selectedCustomer.status}
                                    </StatusChip>
                                  </div>
                                  <div>
                                    <Label>Aadhaar</Label>
                                    <p className="text-sm text-muted-foreground">{selectedCustomer.aadhaar}</p>
                                  </div>
                                  <div>
                                    <Label>PAN</Label>
                                    <p className="text-sm text-muted-foreground">{selectedCustomer.pan}</p>
                                  </div>
                                  <div className="col-span-2">
                                    <Label>Address</Label>
                                    <p className="text-sm text-muted-foreground">{selectedCustomer.address}</p>
                                  </div>
                                </div>
                              </TabsContent>
                              <TabsContent value="policies">
                                <div className="space-y-4">
                                  {getCustomerPolicies(selectedCustomer.id).map((policy) => (
                                    <Card key={policy.id}>
                                      <CardContent className="p-4">
                                        <div className="grid grid-cols-3 gap-4">
                                          <div>
                                            <Label>Policy Number</Label>
                                            <p className="text-sm text-muted-foreground">{policy.policyNumber}</p>
                                          </div>
                                          <div>
                                            <Label>Product Type</Label>
                                            <p className="text-sm text-muted-foreground">{policy.productType}</p>
                                          </div>
                                          <div>
                                            <Label>Status</Label>
                                            <StatusChip
                                              variant={
                                                policy.status === 'active' ? 'success' :
                                                policy.status === 'pending' ? 'warning' : 'secondary'
                                              }
                                            >
                                              {policy.status}
                                            </StatusChip>
                                          </div>
                                          <div>
                                            <Label>Premium</Label>
                                            <p className="text-sm text-muted-foreground">₹{policy.premium.toLocaleString()}</p>
                                          </div>
                                          <div>
                                            <Label>Sum Assured</Label>
                                            <p className="text-sm text-muted-foreground">₹{policy.sumAssured.toLocaleString()}</p>
                                          </div>
                                          <div>
                                            <Label>Issue Date</Label>
                                            <p className="text-sm text-muted-foreground">{new Date(policy.issueDate).toLocaleDateString()}</p>
                                          </div>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  ))}
                                  {getCustomerPolicies(selectedCustomer.id).length === 0 && (
                                    <p className="text-center text-muted-foreground py-8">No policies found</p>
                                  )}
                                </div>
                              </TabsContent>
                              <TabsContent value="nominee">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label>Nominee Name</Label>
                                    <p className="text-sm text-muted-foreground">{selectedCustomer.nominee.name}</p>
                                  </div>
                                  <div>
                                    <Label>Relation</Label>
                                    <p className="text-sm text-muted-foreground">{selectedCustomer.nominee.relation}</p>
                                  </div>
                                  <div>
                                    <Label>Phone</Label>
                                    <p className="text-sm text-muted-foreground">{selectedCustomer.nominee.phone}</p>
                                  </div>
                                </div>
                              </TabsContent>
                            </Tabs>
                          )}
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}