import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { LeadCard } from './LeadCard';
import { LeadDetailsModal } from './LeadDetailsModal';
import { LeadTaskModal } from './LeadTaskModal';
import { ConvertToPolicy } from './ConvertToPolicy';
import { 
  Filter, 
  Search, 
  Plus, 
  Download, 
  BarChart3,
  Users,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';

interface Lead {
  id: string;
  leadNumber: string;
  customerName: string;
  phone: string;
  email?: string;
  productInterest: string;
  leadSource: string;
  assignedTo: string;
  status: 'New' | 'Contacted' | 'Quoted' | 'In Discussion' | 'Converted' | 'Dropped';
  priority: 'Low' | 'Medium' | 'High';
  createdAt: string;
  lastContactDate?: string;
  nextFollowUp?: string;
  estimatedValue?: number;
  remarks?: string;
  daysSinceLastContact?: number;
}

interface LeadPipelineViewProps {
  userRole: string;
  userId: string;
}

export const LeadPipelineView: React.FC<LeadPipelineViewProps> = ({ userRole, userId }) => {
  const [view, setView] = useState<'pipeline' | 'table'>('pipeline');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSource, setFilterSource] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);

  // Mock data - replace with actual Supabase data
  const mockLeads: Lead[] = [
    {
      id: '1',
      leadNumber: 'LD-202401-001',
      customerName: 'Rajesh Kumar',
      phone: '+91 9876543210',
      email: 'rajesh.kumar@email.com',
      productInterest: 'Motor Insurance',
      leadSource: 'Walk-in',
      assignedTo: userId,
      status: 'New',
      priority: 'High',
      createdAt: '2024-01-15',
      estimatedValue: 15000,
      daysSinceLastContact: 1
    },
    {
      id: '2',
      leadNumber: 'LD-202401-002',
      customerName: 'Priya Sharma',
      phone: '+91 9876543211',
      email: 'priya.sharma@email.com',
      productInterest: 'Health Insurance',
      leadSource: 'Online',
      assignedTo: userId,
      status: 'Contacted',
      priority: 'Medium',
      createdAt: '2024-01-14',
      lastContactDate: '2024-01-16',
      nextFollowUp: '2024-01-20',
      estimatedValue: 25000,
      daysSinceLastContact: 2
    },
    {
      id: '3',
      leadNumber: 'LD-202401-003',
      customerName: 'Amit Patel',
      phone: '+91 9876543212',
      productInterest: 'Life Insurance',
      leadSource: 'Referral',
      assignedTo: userId,
      status: 'Quoted',
      priority: 'High',
      createdAt: '2024-01-13',
      lastContactDate: '2024-01-17',
      nextFollowUp: '2024-01-19',
      estimatedValue: 50000,
      daysSinceLastContact: 1
    },
    {
      id: '4',
      leadNumber: 'LD-202401-004',
      customerName: 'Sunita Reddy',
      phone: '+91 9876543213',
      productInterest: 'Motor Insurance',
      leadSource: 'Campaign',
      assignedTo: userId,
      status: 'In Discussion',
      priority: 'Medium',
      createdAt: '2024-01-12',
      lastContactDate: '2024-01-18',
      estimatedValue: 18000,
      daysSinceLastContact: 0
    },
    {
      id: '5',
      leadNumber: 'LD-202401-005',
      customerName: 'Vikram Joshi',
      phone: '+91 9876543214',
      productInterest: 'Health Insurance',
      leadSource: 'Walk-in',
      assignedTo: userId,
      status: 'Converted',
      priority: 'High',
      createdAt: '2024-01-10',
      lastContactDate: '2024-01-18',
      estimatedValue: 22000,
      daysSinceLastContact: 0
    }
  ];

  const statusColumns = [
    { key: 'New', label: 'New Leads', color: 'bg-blue-50 border-blue-200' },
    { key: 'Contacted', label: 'Contacted', color: 'bg-yellow-50 border-yellow-200' },
    { key: 'Quoted', label: 'Quoted', color: 'bg-purple-50 border-purple-200' },
    { key: 'In Discussion', label: 'In Discussion', color: 'bg-orange-50 border-orange-200' },
    { key: 'Converted', label: 'Converted', color: 'bg-green-50 border-green-200' },
    { key: 'Dropped', label: 'Dropped', color: 'bg-red-50 border-red-200' }
  ];

  const filteredLeads = useMemo(() => {
    return mockLeads.filter(lead => {
      const matchesStatus = filterStatus === 'all' || lead.status === filterStatus;
      const matchesSource = filterSource === 'all' || lead.leadSource === filterSource;
      const matchesSearch = searchTerm === '' || 
        lead.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.leadNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.phone.includes(searchTerm);
      
      return matchesStatus && matchesSource && matchesSearch;
    });
  }, [mockLeads, filterStatus, filterSource, searchTerm]);

  const getLeadsByStatus = (status: string) => {
    return filteredLeads.filter(lead => lead.status === status);
  };

  const kpis = useMemo(() => {
    const total = filteredLeads.length;
    const converted = filteredLeads.filter(l => l.status === 'Converted').length;
    const overdue = filteredLeads.filter(l => l.daysSinceLastContact && l.daysSinceLastContact > 2).length;
    const needsFollowUp = filteredLeads.filter(l => 
      l.nextFollowUp && new Date(l.nextFollowUp) <= new Date()
    ).length;

    return {
      total,
      converted,
      conversionRate: total > 0 ? ((converted / total) * 100).toFixed(1) : '0',
      overdue,
      needsFollowUp
    };
  }, [filteredLeads]);

  const handleViewDetails = (lead: Lead) => {
    setSelectedLead(lead);
    setShowDetailsModal(true);
  };

  const handleAddTask = (lead: Lead) => {
    setSelectedLead(lead);
    setShowTaskModal(true);
  };

  const handleConvert = (lead: Lead) => {
    setSelectedLead(lead);
    setShowConvertModal(true);
  };

  const handleStatusChange = (leadId: string, newStatus: Lead['status']) => {
    // Update lead status in database
    console.log('Updating lead status:', leadId, newStatus);
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Leads</p>
                <p className="text-2xl font-bold">{kpis.total}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Conversion Rate</p>
                <p className="text-2xl font-bold text-green-600">{kpis.conversionRate}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Needs Follow-up</p>
                <p className="text-2xl font-bold text-orange-600">{kpis.needsFollowUp}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold text-red-600">{kpis.overdue}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-4 items-center">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                <Input
                  placeholder="Search leads..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {statusColumns.map(status => (
                    <SelectItem key={status.key} value={status.key}>{status.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterSource} onValueChange={setFilterSource}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by Source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="Walk-in">Walk-in</SelectItem>
                  <SelectItem value="Online">Online</SelectItem>
                  <SelectItem value="Referral">Referral</SelectItem>
                  <SelectItem value="Campaign">Campaign</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Lead
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* View Toggle */}
      <Tabs value={view} onValueChange={(v) => setView(v as 'pipeline' | 'table')}>
        <TabsList>
          <TabsTrigger value="pipeline">Pipeline View</TabsTrigger>
          <TabsTrigger value="table">Table View</TabsTrigger>
        </TabsList>

        <TabsContent value="pipeline" className="space-y-6">
          {/* Pipeline Kanban View */}
          <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {statusColumns.map((column) => {
              const columnLeads = getLeadsByStatus(column.key);
              return (
                <Card key={column.key} className={`${column.color} min-h-[400px]`}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center justify-between">
                      {column.label}
                      <Badge variant="secondary" className="text-xs">
                        {columnLeads.length}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {columnLeads.map((lead) => (
                      <LeadCard
                        key={lead.id}
                        lead={lead}
                        onViewDetails={handleViewDetails}
                        onAddTask={handleAddTask}
                        onConvert={handleConvert}
                        onStatusChange={handleStatusChange}
                      />
                    ))}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="table">
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">Table view coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      {selectedLead && (
        <>
          <LeadDetailsModal
            lead={selectedLead}
            open={showDetailsModal}
            onClose={() => {
              setShowDetailsModal(false);
              setSelectedLead(null);
            }}
          />
          
          <LeadTaskModal
            lead={selectedLead}
            open={showTaskModal}
            onClose={() => {
              setShowTaskModal(false);
              setSelectedLead(null);
            }}
          />
          
          <ConvertToPolicy
            lead={selectedLead}
            open={showConvertModal}
            onClose={() => {
              setShowConvertModal(false);
              setSelectedLead(null);
            }}
          />
        </>
      )}
    </div>
  );
};