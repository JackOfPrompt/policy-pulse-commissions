import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  Eye, 
  Edit, 
  RefreshCw, 
  Upload, 
  ChevronLeft, 
  ChevronRight,
  DollarSign,
  Calendar,
  User
} from 'lucide-react';
import { RenewPolicyModal } from './RenewPolicyModal';
import { useLOBs } from '@/hooks/useLOBs';
import { ListView, GridView, KanbanView, ViewToggle, useViewMode } from '@/components/ui/list-views';

interface Policy {
  id: string;
  policyNumber: string;
  holderName: string;
  product: string;
  lob: string;
  premium: number;
  commission: number;
  revenue: number;
  issueDate: string;
  expiryDate: string;
  status: 'Active' | 'Expired' | 'Cancelled' | 'Renewed';
  channelType: string;
}

interface PolicyListProps {
  tenantId: string;
}

export const PolicyList: React.FC<PolicyListProps> = ({ tenantId }) => {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    lob: '',
    product: '',
    status: '',
    channelType: '',
    dateRange: { from: '', to: '' }
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [renewingPolicy, setRenewingPolicy] = useState<Policy | null>(null);
  const { viewMode, setViewMode } = useViewMode({ defaultView: 'list', storageKey: 'policies-view' });

  const { lobs } = useLOBs();

  // Mock data for development
  useEffect(() => {
    const mockPolicies: Policy[] = [
      {
        id: '1',
        policyNumber: 'POL001234',
        holderName: 'John Doe',
        product: 'Health Plus',
        lob: 'Health',
        premium: 25000,
        commission: 2500,
        revenue: 22500,
        issueDate: '2024-01-15',
        expiryDate: '2025-01-15',
        status: 'Active',
        channelType: 'POSP'
      },
      {
        id: '2',
        policyNumber: 'POL001235',
        holderName: 'Jane Smith',
        product: 'Motor Comprehensive',
        lob: 'Motor',
        premium: 15000,
        commission: 1200,
        revenue: 13800,
        issueDate: '2024-02-01',
        expiryDate: '2025-02-01',
        status: 'Active',
        channelType: 'Direct'
      }
    ];
    
    setTimeout(() => {
      setPolicies(mockPolicies);
      setLoading(false);
      setTotalPages(Math.ceil(mockPolicies.length / pageSize));
    }, 1000);
  }, [pageSize, tenantId]);

  const fetchPolicies = async () => {
    setLoading(true);
    // Stub for API call
    // const response = await fetch(`/api/v1/tenant-admin/${tenantId}/policies?page=${currentPage}&pageSize=${pageSize}&search=${searchTerm}&filters=${JSON.stringify(filters)}`);
    // const data = await response.json();
    // setPolicies(data.policies);
    // setTotalPages(data.totalPages);
    setLoading(false);
  };

  const getStatusBadge = (status: Policy['status']) => {
    const variants = {
      Active: 'default',
      Expired: 'secondary',
      Cancelled: 'destructive',
      Renewed: 'outline'
    } as const;
    
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  // Status configuration for Kanban view
  const statusConfig = {
    Active: { label: 'Active', color: 'text-green-600', bgColor: 'bg-green-100 text-green-800' },
    Expired: { label: 'Expired', color: 'text-red-600', bgColor: 'bg-red-100 text-red-800' },
    Cancelled: { label: 'Cancelled', color: 'text-gray-600', bgColor: 'bg-gray-100 text-gray-800' },
    Renewed: { label: 'Renewed', color: 'text-blue-600', bgColor: 'bg-blue-100 text-blue-800' }
  };

  // List view columns configuration
  const listColumns = [
    { key: 'policyNumber', header: 'Policy No', className: 'font-medium' },
    { key: 'holderName', header: 'Holder' },
    { key: 'product', header: 'Product' },
    { key: 'lob', header: 'LOB' },
    { 
      key: 'premium', 
      header: 'Premium', 
      render: (policy: Policy) => formatCurrency(policy.premium)
    },
    { 
      key: 'commission', 
      header: 'Commission', 
      render: (policy: Policy) => formatCurrency(policy.commission)
    },
    { 
      key: 'revenue', 
      header: 'Revenue', 
      render: (policy: Policy) => formatCurrency(policy.revenue)
    },
    { 
      key: 'issueDate', 
      header: 'Issue Date', 
      render: (policy: Policy) => formatDate(policy.issueDate)
    },
    { 
      key: 'expiryDate', 
      header: 'Expiry Date', 
      render: (policy: Policy) => formatDate(policy.expiryDate)
    },
    { 
      key: 'status', 
      header: 'Status', 
      render: (policy: Policy) => getStatusBadge(policy.status)
    }
  ];

  // Grid/Card render function
  const renderPolicyCard = (policy: Policy, actions?: React.ReactNode) => (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{policy.policyNumber}</CardTitle>
            <p className="text-sm text-muted-foreground">{policy.holderName}</p>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(policy.status)}
            {actions}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Product:</span>
            <span className="font-medium">{policy.product}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">LOB:</span>
            <Badge variant="outline" className="text-xs">{policy.lob}</Badge>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{formatCurrency(policy.premium)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{formatDate(policy.expiryDate)}</span>
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          Channel: {policy.channelType}
        </div>
      </CardContent>
    </Card>
  );

  // Actions component
  const renderActions = (policy: Policy) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-background border shadow-md z-50">
        <DropdownMenuItem>
          <Eye className="w-4 h-4 mr-2" />
          View
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Edit className="w-4 h-4 mr-2" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setRenewingPolicy(policy)}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Renew
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Upload className="w-4 h-4 mr-2" />
          Upload Docs
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="space-y-6">
      {/* Search and Filter Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search policies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Filters
                  </Button>
                </div>
                <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
              </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-4 p-4 border rounded-lg bg-muted/30">
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <Select value={filters.lob} onValueChange={(value) => setFilters(prev => ({ ...prev, lob: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Line of Business" />
                  </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="all">All LOBs</SelectItem>
                    {lobs.map((lob) => (
                      <SelectItem key={lob.lob_id} value={lob.lob_code}>
                        {lob.lob_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filters.product} onValueChange={(value) => setFilters(prev => ({ ...prev, product: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Product" />
                  </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="all">All Products</SelectItem>
                    <SelectItem value="health-plus">Health Plus</SelectItem>
                    <SelectItem value="motor-comprehensive">Motor Comprehensive</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Expired">Expired</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                    <SelectItem value="Renewed">Renewed</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.channelType} onValueChange={(value) => setFilters(prev => ({ ...prev, channelType: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Channel Type" />
                  </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="all">All Channels</SelectItem>
                    <SelectItem value="POSP">POSP</SelectItem>
                    <SelectItem value="MISP">MISP</SelectItem>
                    <SelectItem value="Bancassurance">Bancassurance</SelectItem>
                    <SelectItem value="Direct">Direct</SelectItem>
                    <SelectItem value="Online">Online</SelectItem>
                    <SelectItem value="Broker">Broker</SelectItem>
                  </SelectContent>
                </Select>

                <Button onClick={fetchPolicies} className="w-full">
                  Apply Filters
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Policy Data */}
      <Card>
        <CardHeader>
          <CardTitle>Policies</CardTitle>
        </CardHeader>
        <CardContent>
          {viewMode === 'list' && (
            <ListView
              data={policies}
              columns={listColumns}
              loading={loading}
              actions={renderActions}
              className="overflow-x-auto"
            />
          )}

          {(viewMode === 'grid-small' || viewMode === 'grid-medium' || viewMode === 'grid-large') && (
            <GridView
              data={policies}
              loading={loading}
              renderCard={renderPolicyCard}
              actions={renderActions}
              viewMode={viewMode}
            />
          )}

          {viewMode === 'kanban' && (
            <KanbanView
              data={policies}
              loading={loading}
              renderCard={renderPolicyCard}
              actions={renderActions}
              getItemStatus={(policy) => policy.status}
              statusConfig={statusConfig}
            />
          )}

          {/* Pagination for List View */}
          {viewMode === 'list' && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {Math.min((currentPage - 1) * pageSize + 1, policies.length)} to{' '}
                {Math.min(currentPage * pageSize, policies.length)} of {policies.length} policies
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
                <span className="text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Renew Policy Modal */}
      {renewingPolicy && (
        <RenewPolicyModal
          policy={renewingPolicy}
          isOpen={!!renewingPolicy}
          onClose={() => setRenewingPolicy(null)}
          tenantId={tenantId}
        />
      )}
    </div>
  );
};