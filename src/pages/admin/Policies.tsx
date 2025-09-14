import { Shield, Upload, Search, Eye, Edit, Filter, FileSpreadsheet } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { StatusChip } from "@/components/ui/status-chip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PolicyBulkUploadModal } from "@/components/admin/PolicyBulkUploadModal";
import users from "@/data/users.json";
import policies from "@/data/policies.json";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function AdminPolicies() {
  const user = users.admin;
  const navigate = useNavigate();
  const [showBulkUpload, setShowBulkUpload] = useState(false);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'pending': return 'warning';
      case 'expired': return 'destructive';
      case 'cancelled': return 'secondary';
      default: return 'secondary';
    }
  };

  const getExtractionVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'processing': return 'info';
      case 'pending': return 'warning';
      case 'failed': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <DashboardLayout role="admin" user={user}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Policies</h1>
            <p className="text-muted-foreground">
              Manage insurance policies and document processing
            </p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => setShowBulkUpload(true)}>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Bulk Upload
            </Button>
            <Button onClick={() => navigate('/admin/policy-extraction')}>
              <Upload className="mr-2 h-4 w-4" />
              Upload Policy
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Policy Management</CardTitle>
            <CardDescription>
              View and manage all insurance policies with AI extraction status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex space-x-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search policies..."
                  className="pl-10"
                />
              </div>
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
            </div>
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Policy ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>AI Extraction</TableHead>
                  <TableHead>Premium</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {policies.map((policy) => (
                  <TableRow key={policy.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Shield className="h-4 w-4 text-primary" />
                        <span className="font-medium">{policy.id}</span>
                      </div>
                    </TableCell>
                    <TableCell>{policy.customerName}</TableCell>
                    <TableCell className="capitalize">{policy.type}</TableCell>
                    <TableCell>
                      <StatusChip variant={getStatusVariant(policy.status)}>
                        {policy.status}
                      </StatusChip>
                    </TableCell>
                    <TableCell>
                      <StatusChip variant={getExtractionVariant(policy.extractionStatus)}>
                        {policy.extractionStatus}
                      </StatusChip>
                    </TableCell>
                    <TableCell>₹{policy.premium.toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      
      <PolicyBulkUploadModal
        open={showBulkUpload}
        onOpenChange={setShowBulkUpload}
        onUploadComplete={() => {
          // Refresh policies list
          window.location.reload();
        }}
      />
    </DashboardLayout>
  );
}