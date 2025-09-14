import { useState } from "react";
import { Search, Upload, Eye, Filter, FileText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusChip } from "@/components/ui/status-chip";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import policies from "@/data/employee/policies.json";
import users from "@/data/users.json";
import { useNavigate } from "react-router-dom";

export default function EmployeePolicies() {
  const user = users.employee;
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [productFilter, setProductFilter] = useState("all");
  const [selectedPolicy, setSelectedPolicy] = useState<any>(null);

  const filteredPolicies = policies.filter(policy => {
    const matchesSearch = policy.policyNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         policy.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         policy.insurer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || policy.status === statusFilter;
    const matchesProduct = productFilter === "all" || policy.productType === productFilter;
    return matchesSearch && matchesStatus && matchesProduct;
  });

  const productTypes = [...new Set(policies.map(p => p.productType))];

  return (
    <DashboardLayout role="employee" user={user}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Policies</h1>
            <p className="text-muted-foreground">
              Manage and process insurance policies
            </p>
          </div>
          <Button onClick={() => navigate('/employee/policy-extraction')}>
            <Upload className="mr-2 h-4 w-4" />
            Upload Policy
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Policy List</CardTitle>
            <CardDescription>
              View and manage all policies
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search policies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
              <Select value={productFilter} onValueChange={setProductFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Product Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Products</SelectItem>
                  {productTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Policy Number</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Product Type</TableHead>
                  <TableHead>Insurer</TableHead>
                  <TableHead>Premium</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Issue Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPolicies.map((policy) => (
                  <TableRow key={policy.id}>
                    <TableCell className="font-medium">{policy.policyNumber}</TableCell>
                    <TableCell>{policy.customer}</TableCell>
                    <TableCell>{policy.productType}</TableCell>
                    <TableCell>{policy.insurer}</TableCell>
                    <TableCell>₹{policy.premium.toLocaleString()}</TableCell>
                    <TableCell>
                      <StatusChip
                        variant={
                          policy.status === 'active' ? 'success' :
                          policy.status === 'pending' ? 'warning' : 'secondary'
                        }
                      >
                        {policy.status}
                      </StatusChip>
                    </TableCell>
                    <TableCell>{new Date(policy.issueDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedPolicy(policy)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl">
                          <DialogHeader>
                            <DialogTitle>{selectedPolicy?.policyNumber}</DialogTitle>
                            <DialogDescription>
                              Policy details and information
                            </DialogDescription>
                          </DialogHeader>
                          {selectedPolicy && (
                            <Tabs defaultValue="overview" className="mt-4">
                              <TabsList>
                                <TabsTrigger value="overview">Overview</TabsTrigger>
                                {selectedPolicy.members && <TabsTrigger value="members">Members</TabsTrigger>}
                                {selectedPolicy.vehicle && <TabsTrigger value="vehicle">Vehicle</TabsTrigger>}
                                {selectedPolicy.loan && <TabsTrigger value="loan">Loan</TabsTrigger>}
                              </TabsList>
                              
                              <TabsContent value="overview" className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label>Customer</Label>
                                    <p className="text-sm text-muted-foreground">{selectedPolicy.customer}</p>
                                  </div>
                                  <div>
                                    <Label>Product Type</Label>
                                    <p className="text-sm text-muted-foreground">{selectedPolicy.productType}</p>
                                  </div>
                                  <div>
                                    <Label>Insurer</Label>
                                    <p className="text-sm text-muted-foreground">{selectedPolicy.insurer}</p>
                                  </div>
                                  <div>
                                    <Label>Agent</Label>
                                    <p className="text-sm text-muted-foreground">{selectedPolicy.agent}</p>
                                  </div>
                                  <div>
                                    <Label>Premium</Label>
                                    <p className="text-sm text-muted-foreground">₹{selectedPolicy.premium.toLocaleString()}</p>
                                  </div>
                                  <div>
                                    <Label>Sum Assured</Label>
                                    <p className="text-sm text-muted-foreground">₹{selectedPolicy.sumAssured.toLocaleString()}</p>
                                  </div>
                                  <div>
                                    <Label>Issue Date</Label>
                                    <p className="text-sm text-muted-foreground">{new Date(selectedPolicy.issueDate).toLocaleDateString()}</p>
                                  </div>
                                  <div>
                                    <Label>Expiry Date</Label>
                                    <p className="text-sm text-muted-foreground">{new Date(selectedPolicy.expiryDate).toLocaleDateString()}</p>
                                  </div>
                                  <div>
                                    <Label>Commission</Label>
                                    <p className="text-sm text-muted-foreground">₹{selectedPolicy.commission.toLocaleString()}</p>
                                  </div>
                                  <div>
                                    <Label>Status</Label>
                                    <StatusChip
                                      variant={
                                        selectedPolicy.status === 'active' ? 'success' :
                                        selectedPolicy.status === 'pending' ? 'warning' : 'secondary'
                                      }
                                    >
                                      {selectedPolicy.status}
                                    </StatusChip>
                                  </div>
                                </div>
                              </TabsContent>

                              {selectedPolicy.members && (
                                <TabsContent value="members">
                                  <div className="space-y-4">
                                    {selectedPolicy.members.map((member: any, index: number) => (
                                      <Card key={index}>
                                        <CardContent className="p-4">
                                          <div className="grid grid-cols-3 gap-4">
                                            <div>
                                              <Label>Name</Label>
                                              <p className="text-sm text-muted-foreground">{member.name}</p>
                                            </div>
                                            <div>
                                              <Label>Relation</Label>
                                              <p className="text-sm text-muted-foreground">{member.relation}</p>
                                            </div>
                                            <div>
                                              <Label>Age</Label>
                                              <p className="text-sm text-muted-foreground">{member.age}</p>
                                            </div>
                                            <div>
                                              <Label>Sum Assured</Label>
                                              <p className="text-sm text-muted-foreground">₹{member.sumAssured.toLocaleString()}</p>
                                            </div>
                                          </div>
                                        </CardContent>
                                      </Card>
                                    ))}
                                  </div>
                                </TabsContent>
                              )}

                              {selectedPolicy.vehicle && (
                                <TabsContent value="vehicle">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label>Make</Label>
                                      <p className="text-sm text-muted-foreground">{selectedPolicy.vehicle.make}</p>
                                    </div>
                                    <div>
                                      <Label>Model</Label>
                                      <p className="text-sm text-muted-foreground">{selectedPolicy.vehicle.model}</p>
                                    </div>
                                    <div>
                                      <Label>Year</Label>
                                      <p className="text-sm text-muted-foreground">{selectedPolicy.vehicle.year}</p>
                                    </div>
                                    <div>
                                      <Label>Registration Number</Label>
                                      <p className="text-sm text-muted-foreground">{selectedPolicy.vehicle.registrationNumber}</p>
                                    </div>
                                    <div>
                                      <Label>Engine Number</Label>
                                      <p className="text-sm text-muted-foreground">{selectedPolicy.vehicle.engineNumber}</p>
                                    </div>
                                    <div>
                                      <Label>Chassis Number</Label>
                                      <p className="text-sm text-muted-foreground">{selectedPolicy.vehicle.chassisNumber}</p>
                                    </div>
                                  </div>
                                </TabsContent>
                              )}

                              {selectedPolicy.loan && (
                                <TabsContent value="loan">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label>Loan Amount</Label>
                                      <p className="text-sm text-muted-foreground">₹{selectedPolicy.loan.loanAmount.toLocaleString()}</p>
                                    </div>
                                    <div>
                                      <Label>Loan Type</Label>
                                      <p className="text-sm text-muted-foreground">{selectedPolicy.loan.loanType}</p>
                                    </div>
                                    <div>
                                      <Label>Tenure</Label>
                                      <p className="text-sm text-muted-foreground">{selectedPolicy.loan.tenure} years</p>
                                    </div>
                                    <div>
                                      <Label>Bank</Label>
                                      <p className="text-sm text-muted-foreground">{selectedPolicy.loan.bankName}</p>
                                    </div>
                                  </div>
                                </TabsContent>
                              )}
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