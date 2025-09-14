import { useState } from "react";
import { Shield, Eye, Calendar, Filter, Search } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { StatusChip } from "@/components/ui/status-chip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import customerData from "@/data/customer/customerData.json";
import policies from "@/data/customer/policies.json";

export default function CustomerPolicies() {
  const [selectedPolicy, setSelectedPolicy] = useState<typeof policies[0] | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredPolicies = policies.filter(policy => {
    const matchesStatus = filterStatus === "all" || policy.status === filterStatus;
    const matchesSearch = policy.productType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         policy.insurer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         policy.policyNumber.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'renewal_due': return 'warning';
      case 'expired': return 'secondary';
      default: return 'secondary';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getDaysUntilRenewal = (renewalDate: string) => {
    const days = Math.ceil((new Date(renewalDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  return (
    <DashboardLayout role="customer" user={customerData}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">My Policies</h1>
            <p className="text-muted-foreground">
              View and manage all your insurance policies
            </p>
          </div>
          <Button>
            <Shield className="mr-2 h-4 w-4" />
            Buy New Policy
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search policies by type, insurer, or policy number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-48">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Policies</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="renewal_due">Renewal Due</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Policies Table */}
        <Card>
          <CardHeader>
            <CardTitle>Policy List</CardTitle>
            <CardDescription>
              {filteredPolicies.length} policies found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Policy Number</TableHead>
                  <TableHead>Insurer</TableHead>
                  <TableHead>Product Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Premium</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPolicies.map((policy) => {
                  const daysUntilRenewal = getDaysUntilRenewal(policy.renewalDue);
                  const isUrgent = daysUntilRenewal <= 30 && daysUntilRenewal > 0;
                  
                  return (
                    <TableRow key={policy.id}>
                      <TableCell className="font-medium">
                        {policy.policyNumber}
                      </TableCell>
                      <TableCell>{policy.insurer}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Shield className="h-4 w-4 text-muted-foreground" />
                          <span>{policy.productType}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col space-y-1">
                          <StatusChip variant={getStatusVariant(policy.status)}>
                            {policy.status === 'renewal_due' ? 'renewal due' : policy.status}
                          </StatusChip>
                          {isUrgent && (
                            <span className="text-xs text-warning">
                              {daysUntilRenewal} days left
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(policy.startDate)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(policy.endDate)}
                      </TableCell>
                      <TableCell className="font-medium">
                        ₹{policy.premium.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setSelectedPolicy(policy)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Policy Details</DialogTitle>
                              <DialogDescription>
                                Complete information about your {policy.productType} policy
                              </DialogDescription>
                            </DialogHeader>
                            
                            {selectedPolicy && (
                              <div className="space-y-6">
                                {/* Policy Summary */}
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">Policy Number</label>
                                    <p className="font-medium">{selectedPolicy.policyNumber}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">Insurer</label>
                                    <p className="font-medium">{selectedPolicy.insurer}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">Product Type</label>
                                    <p className="font-medium">{selectedPolicy.productType}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                                    <StatusChip variant={getStatusVariant(selectedPolicy.status)}>
                                      {selectedPolicy.status === 'renewal_due' ? 'renewal due' : selectedPolicy.status}
                                    </StatusChip>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">Coverage Amount</label>
                                    <p className="font-medium text-lg">₹{selectedPolicy.coverage.toLocaleString()}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">Annual Premium</label>
                                    <p className="font-medium text-lg">₹{selectedPolicy.premium.toLocaleString()}</p>
                                  </div>
                                </div>

                                {/* Policy Summary */}
                                <div>
                                  <h3 className="font-medium mb-2">Policy Summary</h3>
                                  <p className="text-muted-foreground">{selectedPolicy.summary}</p>
                                </div>

                                {/* Coverage Details */}
                                <div>
                                  <h3 className="font-medium mb-3">Coverage Details</h3>
                                  <div className="grid grid-cols-2 gap-3">
                                    {Object.entries(selectedPolicy.coverageDetails).map(([key, value]) => (
                                      <div key={key} className="p-3 border rounded-lg">
                                        <p className="text-sm font-medium capitalize">
                                          {key.replace(/([A-Z])/g, ' $1').trim()}
                                        </p>
                                        <p className="text-muted-foreground">{value}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Policy Dates */}
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">Policy Start</label>
                                    <p className="font-medium">{formatDate(selectedPolicy.startDate)}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">Policy End</label>
                                    <p className="font-medium">{formatDate(selectedPolicy.endDate)}</p>
                                  </div>
                                </div>

                                {selectedPolicy.status === 'active' && (
                                  <div className="pt-4 border-t">
                                    <div className="flex items-center justify-between gap-4">
                                      <Button className="flex-1">
                                        <Calendar className="mr-2 h-4 w-4" />
                                        Renew Policy
                                      </Button>
                                      <Button variant="outline" className="flex-1">
                                        Download Certificate
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}