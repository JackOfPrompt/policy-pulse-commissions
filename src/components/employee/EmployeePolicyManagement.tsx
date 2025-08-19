import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Search, 
  Filter, 
  FileText, 
  Eye, 
  Download, 
  Calendar,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';

type PolicyStatus = 'active' | 'expired' | 'cancelled' | 'renewed';

interface Policy {
  id: string;
  policyNumber: string;
  productName: string;
  customerName: string;
  status: PolicyStatus;
  premium: number;
  commission: number;
  renewalDate: string;
  issueDate: string;
  lob: string;
}

const mockPolicies: Policy[] = [
  {
    id: '1',
    policyNumber: 'POL123456',
    productName: 'Comprehensive Health Insurance',
    customerName: 'John Doe',
    status: 'active',
    premium: 25000,
    commission: 2500,
    renewalDate: '2024-12-15',
    issueDate: '2023-12-15',
    lob: 'Health'
  },
  {
    id: '2',
    policyNumber: 'POL123457',
    productName: 'Term Life Insurance',
    customerName: 'Jane Smith',
    status: 'active',
    premium: 50000,
    commission: 5000,
    renewalDate: '2024-11-20',
    issueDate: '2023-11-20',
    lob: 'Life'
  },
  {
    id: '3',
    policyNumber: 'POL123458',
    productName: 'Motor Insurance',
    customerName: 'Robert Johnson',
    status: 'expired',
    premium: 15000,
    commission: 1500,
    renewalDate: '2024-08-10',
    issueDate: '2023-08-10',
    lob: 'Motor'
  },
  {
    id: '4',
    policyNumber: 'POL123459',
    productName: 'Home Insurance',
    customerName: 'Emily Davis',
    status: 'renewed',
    premium: 30000,
    commission: 3000,
    renewalDate: '2025-01-15',
    issueDate: '2024-01-15',
    lob: 'General'
  },
  {
    id: '5',
    policyNumber: 'POL123460',
    productName: 'Travel Insurance',
    customerName: 'Michael Brown',
    status: 'cancelled',
    premium: 5000,
    commission: 500,
    renewalDate: '2024-10-05',
    issueDate: '2024-05-05',
    lob: 'General'
  }
];

const getStatusIcon = (status: PolicyStatus) => {
  switch (status) {
    case 'active':
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case 'expired':
      return <AlertCircle className="h-4 w-4 text-orange-600" />;
    case 'cancelled':
      return <XCircle className="h-4 w-4 text-red-600" />;
    case 'renewed':
      return <Clock className="h-4 w-4 text-blue-600" />;
    default:
      return <Clock className="h-4 w-4" />;
  }
};

const getStatusBadge = (status: PolicyStatus) => {
  const variants = {
    active: 'default',
    expired: 'secondary',
    cancelled: 'destructive',
    renewed: 'outline'
  } as const;

  return (
    <Badge variant={variants[status]} className="flex items-center gap-1">
      {getStatusIcon(status)}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
};

export const EmployeePolicyManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [lobFilter, setLobFilter] = useState<string>('all');
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);

  const filteredPolicies = mockPolicies.filter(policy => {
    const matchesSearch = 
      policy.policyNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      policy.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      policy.productName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || policy.status === statusFilter;
    const matchesLob = lobFilter === 'all' || policy.lob === lobFilter;
    
    return matchesSearch && matchesStatus && matchesLob;
  });

  const policyStats = {
    total: mockPolicies.length,
    active: mockPolicies.filter(p => p.status === 'active').length,
    expired: mockPolicies.filter(p => p.status === 'expired').length,
    renewed: mockPolicies.filter(p => p.status === 'renewed').length,
    cancelled: mockPolicies.filter(p => p.status === 'cancelled').length,
    totalPremium: mockPolicies.reduce((sum, p) => sum + p.premium, 0),
    totalCommission: mockPolicies.reduce((sum, p) => sum + p.commission, 0)
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Policy Management</h1>
          <p className="text-muted-foreground">Manage and track your assigned policies</p>
        </div>
        <Button>
          <FileText className="mr-2 h-4 w-4" />
          New Policy
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Policies</p>
                <p className="text-2xl font-bold">{policyStats.total}</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Policies</p>
                <p className="text-2xl font-bold text-green-600">{policyStats.active}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Premium</p>
                <p className="text-2xl font-bold">₹{policyStats.totalPremium.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Commission</p>
                <p className="text-2xl font-bold text-green-600">₹{policyStats.totalCommission.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="list" className="space-y-6">
        <TabsList>
          <TabsTrigger value="list">Policy List</TabsTrigger>
          <TabsTrigger value="renewals">Pending Renewals</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search by policy number, customer name, or product..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="renewed">Renewed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={lobFilter} onValueChange={setLobFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Line of Business" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All LOB</SelectItem>
                    <SelectItem value="Health">Health</SelectItem>
                    <SelectItem value="Life">Life</SelectItem>
                    <SelectItem value="Motor">Motor</SelectItem>
                    <SelectItem value="General">General</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline">
                  <Filter className="mr-2 h-4 w-4" />
                  More Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Policy Table */}
          <Card>
            <CardHeader>
              <CardTitle>Policies ({filteredPolicies.length})</CardTitle>
              <CardDescription>
                Manage your assigned policies and track their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Policy Number</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Premium</TableHead>
                      <TableHead>Commission</TableHead>
                      <TableHead>Renewal Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPolicies.map((policy) => (
                      <TableRow key={policy.id}>
                        <TableCell className="font-mono">{policy.policyNumber}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{policy.productName}</p>
                            <p className="text-sm text-muted-foreground">{policy.lob}</p>
                          </div>
                        </TableCell>
                        <TableCell>{policy.customerName}</TableCell>
                        <TableCell>{getStatusBadge(policy.status)}</TableCell>
                        <TableCell>₹{policy.premium.toLocaleString()}</TableCell>
                        <TableCell className="text-green-600 font-medium">
                          ₹{policy.commission.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {new Date(policy.renewalDate).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setSelectedPolicy(policy)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="renewals" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Pending Renewals
              </CardTitle>
              <CardDescription>
                Policies that need renewal attention within the next 30 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockPolicies
                  .filter(policy => {
                    const renewalDate = new Date(policy.renewalDate);
                    const thirtyDaysFromNow = new Date();
                    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
                    return renewalDate <= thirtyDaysFromNow && policy.status === 'active';
                  })
                  .map((policy) => (
                    <div key={policy.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{policy.policyNumber}</h4>
                        <p className="text-sm text-muted-foreground">
                          {policy.customerName} - {policy.productName}
                        </p>
                        <div className="flex items-center gap-1 text-sm text-orange-600 mt-1">
                          <Calendar className="h-4 w-4" />
                          Due: {new Date(policy.renewalDate).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm">Process Renewal</Button>
                        <Button size="sm" variant="outline">Contact Customer</Button>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Document Management</CardTitle>
              <CardDescription>
                Upload and manage policy-related documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    Drag and drop files here, or click to browse
                  </p>
                  <Button className="mt-4">
                    Upload Documents
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Recent Documents</h4>
                  <div className="space-y-2">
                    {['Policy Certificate - POL123456.pdf', 'KYC Documents - John Doe.pdf', 'Proposal Form - POL123457.pdf'].map((doc, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{doc}</span>
                        </div>
                        <Button size="sm" variant="outline">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};