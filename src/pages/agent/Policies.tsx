import { useState } from "react";
import { Search, Eye, Filter, FileText, Upload } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusChip } from "@/components/ui/status-chip";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import policies from "@/data/agent/policies.json";
import users from "@/data/users.json";
import { useNavigate } from "react-router-dom";

export default function AgentPolicies() {
  const user = users.agent;
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedPolicy, setSelectedPolicy] = useState<any>(null);

  const filteredPolicies = policies.filter(policy => {
    const matchesSearch = policy.policyNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         policy.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         policy.insurer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || policy.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <DashboardLayout role="agent" user={user}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">My Policies</h1>
            <p className="text-muted-foreground">
              Track and manage your insurance policies
            </p>
          </div>
          <Button onClick={() => navigate('/agent/policy-extraction')}>
            <Upload className="mr-2 h-4 w-4" />
            Upload Policy
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Policy Portfolio</CardTitle>
            <CardDescription>
              All policies you've sold and their current status
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
                <SelectTrigger className="w-40">
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
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Policy Number</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Insurer</TableHead>
                  <TableHead>Product Type</TableHead>
                  <TableHead>Premium</TableHead>
                  <TableHead>Commission</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPolicies.map((policy) => (
                  <TableRow key={policy.id}>
                    <TableCell className="font-medium">{policy.policyNumber}</TableCell>
                    <TableCell>{policy.customerName}</TableCell>
                    <TableCell>{policy.insurer}</TableCell>
                    <TableCell>{policy.productType}</TableCell>
                    <TableCell>₹{policy.premium.toLocaleString()}</TableCell>
                    <TableCell>₹{policy.commission.toLocaleString()}</TableCell>
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
                    <TableCell>{new Date(policy.startDate).toLocaleDateString()}</TableCell>
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
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>{selectedPolicy?.policyNumber}</DialogTitle>
                            <DialogDescription>
                              Policy details and commission breakdown
                            </DialogDescription>
                          </DialogHeader>
                          {selectedPolicy && (
                            <div className="space-y-6">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label>Customer</Label>
                                  <p className="text-sm text-muted-foreground">{selectedPolicy.customerName}</p>
                                </div>
                                <div>
                                  <Label>Customer Email</Label>
                                  <p className="text-sm text-muted-foreground">{selectedPolicy.customerEmail}</p>
                                </div>
                                <div>
                                  <Label>Insurer</Label>
                                  <p className="text-sm text-muted-foreground">{selectedPolicy.insurer}</p>
                                </div>
                                <div>
                                  <Label>Product Type</Label>
                                  <p className="text-sm text-muted-foreground">{selectedPolicy.productType}</p>
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
                                  <Label>Start Date</Label>
                                  <p className="text-sm text-muted-foreground">{new Date(selectedPolicy.startDate).toLocaleDateString()}</p>
                                </div>
                                <div>
                                  <Label>End Date</Label>
                                  <p className="text-sm text-muted-foreground">{new Date(selectedPolicy.endDate).toLocaleDateString()}</p>
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

                              <div className="border-t pt-6">
                                <h3 className="text-lg font-semibold mb-4">Commission Breakdown</h3>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label>Commission Rate</Label>
                                    <p className="text-sm text-muted-foreground">{selectedPolicy.commissionRate}%</p>
                                  </div>
                                  <div>
                                    <Label>Commission Amount</Label>
                                    <p className="text-sm text-muted-foreground">₹{selectedPolicy.commission.toLocaleString()}</p>
                                  </div>
                                  <div>
                                    <Label>Payout Status</Label>
                                    <StatusChip
                                      variant={selectedPolicy.payoutStatus === 'paid' ? 'success' : 'warning'}
                                    >
                                      {selectedPolicy.payoutStatus}
                                    </StatusChip>
                                  </div>
                                  <div>
                                    <Label>Last Payout Date</Label>
                                    <p className="text-sm text-muted-foreground">
                                      {selectedPolicy.lastPayoutDate ? 
                                        new Date(selectedPolicy.lastPayoutDate).toLocaleDateString() : 
                                        'Not paid yet'
                                      }
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
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