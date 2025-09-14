import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, FileText, Eye, Filter } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { usePolicyExtraction, PolicyData } from "@/hooks/usePolicyExtraction";

export default function PolicyList() {
  const { getPolicies } = usePolicyExtraction();
  const navigate = useNavigate();
  const [policies, setPolicies] = useState<PolicyData[]>([]);
  const [filteredPolicies, setFilteredPolicies] = useState<PolicyData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [productTypeFilter, setProductTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const loadedPolicies = getPolicies();
    setPolicies(loadedPolicies);
    setFilteredPolicies(loadedPolicies);
  }, [getPolicies]);

  useEffect(() => {
    let filtered = policies;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        policy =>
          policy.policyNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          policy.customerName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by product type
    if (productTypeFilter !== "all") {
      filtered = filtered.filter(policy => policy.productType === productTypeFilter);
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter(policy => policy.status === statusFilter);
    }

    setFilteredPolicies(filtered);
  }, [policies, searchTerm, productTypeFilter, statusFilter]);

  const handleViewPolicy = (policyId: string) => {
    navigate(`/admin/policies/review/${policyId}`);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'finalized':
        return 'default';
      case 'draft':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getProductTypeBadgeVariant = (productType: string) => {
    switch (productType) {
      case 'motor':
        return 'default';
      case 'health':
        return 'secondary';
      case 'loan':
        return 'outline';
      case 'life':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Policy Management</h1>
          <p className="text-muted-foreground">Manage uploaded and extracted policy documents</p>
        </div>
        <Link to="/admin/policies/upload">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Upload New Policy
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by policy number or customer name"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Product Type</label>
              <Select value={productTypeFilter} onValueChange={setProductTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="motor">Motor</SelectItem>
                  <SelectItem value="health">Health</SelectItem>
                  <SelectItem value="loan">Loan</SelectItem>
                  <SelectItem value="life">Life</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="finalized">Finalized</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm("");
                  setProductTypeFilter("all");
                  setStatusFilter("all");
                }}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Policy Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Policies ({filteredPolicies.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredPolicies.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No policies found</h3>
              <p className="text-muted-foreground mb-4">
                {policies.length === 0 
                  ? "Upload your first policy document to get started."
                  : "No policies match your current filters."
                }
              </p>
              {policies.length === 0 && (
                <Link to="/admin/policies/upload">
                  <Button>Upload Policy</Button>
                </Link>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Policy Number</TableHead>
                  <TableHead>Customer Name</TableHead>
                  <TableHead>Product Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created Date</TableHead>
                  <TableHead>Uploaded By</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPolicies.map((policy) => (
                  <TableRow key={policy.id}>
                    <TableCell className="font-mono">{policy.policyNumber}</TableCell>
                    <TableCell>{policy.customerName}</TableCell>
                    <TableCell>
                      <Badge variant={getProductTypeBadgeVariant(policy.productType)}>
                        {policy.productType.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(policy.status)}>
                        {policy.status.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(policy.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{policy.metadata.uploadedBy}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewPolicy(policy.id)}
                        className="flex items-center gap-1"
                      >
                        <Eye className="h-3 w-3" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}