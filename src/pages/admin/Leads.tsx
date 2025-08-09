import { useState, useEffect } from "react";
import { Plus, Search, Filter, Download, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { LeadForm } from "@/components/admin/LeadForm";
import { LeadStatusBadge } from "@/components/admin/LeadStatusBadge";
import BulkUploadModal from "@/components/admin/BulkUploadModal";
import { getLeadTemplateColumns, getLeadSampleData, validateLeadRow, processLeadRow } from "@/utils/leadBulkUpload";
import { toast } from "sonner";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

interface Lead {
  id: string;
  lead_number: string;
  full_name: string;
  phone_number: string;
  email?: string;
  location?: string;
  line_of_business: string;
  lead_source: string;
  lead_status: string;
  priority: string;
  next_follow_up_date?: string;
  created_at: string;
  product?: { name: string };
  insurance_provider?: { provider_name: string };
  assigned_employee?: { name: string };
  assigned_agent?: { name: string };
  branch?: { name: string };
}

export default function Leads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [lobFilter, setLobFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchLeads();
  }, []);

  useEffect(() => {
    filterLeads();
  }, [leads, searchTerm, statusFilter, lobFilter, sourceFilter, priorityFilter]);

  const fetchLeads = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('leads')
        .select(`
          *,
          product:insurance_products(name),
          insurance_provider:insurance_providers(provider_name),
          branch:branches(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Process the data to add assigned person names
      const processedData = await Promise.all((data || []).map(async (lead: any) => {
        let assignedName = null;
        if (lead.assigned_to_id && lead.assigned_to_type) {
          if (lead.assigned_to_type === 'Employee') {
            const { data: employee } = await supabase
              .from('employees')
              .select('name')
              .eq('id', lead.assigned_to_id)
              .single();
            assignedName = employee?.name;
          } else if (lead.assigned_to_type === 'Agent') {
            const { data: agent } = await supabase
              .from('agents')
              .select('name')
              .eq('id', lead.assigned_to_id)
              .single();
            assignedName = agent?.name;
          }
        }
        
        return {
          ...lead,
          assigned_employee: lead.assigned_to_type === 'Employee' ? { name: assignedName } : undefined,
          assigned_agent: lead.assigned_to_type === 'Agent' ? { name: assignedName } : undefined
        };
      }));
      
      setLeads(processedData);
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch leads");
    } finally {
      setIsLoading(false);
    }
  };

  const filterLeads = () => {
    let filtered = leads;

    if (searchTerm) {
      filtered = filtered.filter(lead =>
        lead.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.phone_number.includes(searchTerm) ||
        lead.lead_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(lead => lead.lead_status === statusFilter);
    }

    if (lobFilter !== "all") {
      filtered = filtered.filter(lead => lead.line_of_business === lobFilter);
    }

    if (sourceFilter !== "all") {
      filtered = filtered.filter(lead => lead.lead_source === sourceFilter);
    }

    if (priorityFilter !== "all") {
      filtered = filtered.filter(lead => lead.priority === priorityFilter);
    }

    setFilteredLeads(filtered);
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      'Low': 'bg-gray-100 text-gray-800',
      'Medium': 'bg-blue-100 text-blue-800',
      'High': 'bg-orange-100 text-orange-800',
      'Urgent': 'bg-red-100 text-red-800'
    };
    return colors[priority as keyof typeof colors] || colors.Medium;
  };

  const handleLeadClick = (leadId: string) => {
    navigate(`/admin/leads/${leadId}`);
  };

  const exportToCSV = () => {
    const headers = [
      'Lead Number', 'Full Name', 'Phone', 'Email', 'Location', 
      'Line of Business', 'Product', 'Provider', 'Source', 'Status', 
      'Priority', 'Assigned To', 'Branch', 'Next Follow-up', 'Created Date'
    ];

    const csvData = filteredLeads.map(lead => [
      lead.lead_number,
      lead.full_name,
      lead.phone_number,
      lead.email || '',
      lead.location || '',
      lead.line_of_business,
      lead.product?.name || '',
      lead.insurance_provider?.provider_name || '',
      lead.lead_source,
      lead.lead_status,
      lead.priority,
      lead.assigned_employee?.name || lead.assigned_agent?.name || '',
      lead.branch?.name || '',
      lead.next_follow_up_date ? format(new Date(lead.next_follow_up_date), 'yyyy-MM-dd') : '',
      format(new Date(lead.created_at), 'yyyy-MM-dd HH:mm')
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    toast.success("Leads exported successfully");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div></div>
        <div className="flex gap-2">
          <Button onClick={exportToCSV} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <BulkUploadModal
            isOpen={showBulkUpload}
            onClose={() => setShowBulkUpload(false)}
            entityType="Leads"
            templateColumns={getLeadTemplateColumns()}
            sampleData={getLeadSampleData()}
            validateRow={validateLeadRow}
            processRow={processLeadRow}
            onSuccess={() => {
              setShowBulkUpload(false);
              fetchLeads();
            }}
          />
          <Button onClick={() => setShowBulkUpload(true)} variant="outline">
            <Upload className="mr-2 h-4 w-4" />
            Bulk Upload
          </Button>
          <Sheet open={showAddForm} onOpenChange={setShowAddForm}>
            <SheetTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Lead
              </Button>
            </SheetTrigger>
            <SheetContent className="w-full max-w-2xl overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Add New Lead</SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                <LeadForm 
                  onSuccess={() => {
                    setShowAddForm(false);
                    fetchLeads();
                  }}
                  onCancel={() => setShowAddForm(false)}
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{leads.filter(l => l.lead_status === 'New').length}</div>
            <div className="text-sm text-muted-foreground">New Leads</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{leads.filter(l => l.lead_status === 'Contacted').length}</div>
            <div className="text-sm text-muted-foreground">Contacted</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">{leads.filter(l => l.lead_status === 'In Progress').length}</div>
            <div className="text-sm text-muted-foreground">In Progress</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{leads.filter(l => l.lead_status === 'Converted').length}</div>
            <div className="text-sm text-muted-foreground">Converted</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{leads.filter(l => l.lead_status === 'Dropped').length}</div>
            <div className="text-sm text-muted-foreground">Dropped</div>
          </CardContent>
        </Card>
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
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search leads..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="New">New</SelectItem>
                <SelectItem value="Contacted">Contacted</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Converted">Converted</SelectItem>
                <SelectItem value="Dropped">Dropped</SelectItem>
              </SelectContent>
            </Select>

            <Select value={lobFilter} onValueChange={setLobFilter}>
              <SelectTrigger>
                <SelectValue placeholder="LOB" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All LOB</SelectItem>
                <SelectItem value="Life">Life</SelectItem>
                <SelectItem value="Health">Health</SelectItem>
                <SelectItem value="Motor">Motor</SelectItem>
                <SelectItem value="Travel">Travel</SelectItem>
                <SelectItem value="Commercial">Commercial</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="Walk-in">Walk-in</SelectItem>
                <SelectItem value="Website">Website</SelectItem>
                <SelectItem value="Referral">Referral</SelectItem>
                <SelectItem value="Tele-calling">Tele-calling</SelectItem>
                <SelectItem value="Campaign">Campaign</SelectItem>
                <SelectItem value="API">API</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
                setLobFilter("all");
                setSourceFilter("all");
                setPriorityFilter("all");
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Leads Table */}
      <Card>
        <CardHeader>
          <CardTitle>Leads ({filteredLeads.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lead #</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>LOB</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Follow-up</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.map((lead) => (
                  <TableRow 
                    key={lead.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleLeadClick(lead.id)}
                  >
                    <TableCell className="font-medium">{lead.lead_number}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{lead.full_name}</div>
                        {lead.email && <div className="text-sm text-muted-foreground">{lead.email}</div>}
                      </div>
                    </TableCell>
                    <TableCell>{lead.phone_number}</TableCell>
                    <TableCell>{lead.line_of_business}</TableCell>
                    <TableCell>
                      {lead.product?.name && (
                        <div>
                          <div className="text-sm">{lead.product.name}</div>
                          {lead.insurance_provider?.provider_name && (
                            <div className="text-xs text-muted-foreground">
                              {lead.insurance_provider.provider_name}
                            </div>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{lead.lead_source}</Badge>
                    </TableCell>
                    <TableCell>
                      <LeadStatusBadge status={lead.lead_status} />
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={getPriorityBadge(lead.priority)}>
                        {lead.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {lead.assigned_employee?.name || lead.assigned_agent?.name || '-'}
                    </TableCell>
                    <TableCell>
                      {lead.next_follow_up_date 
                        ? format(new Date(lead.next_follow_up_date), 'MMM dd, yyyy')
                        : '-'
                      }
                    </TableCell>
                    <TableCell>
                      {format(new Date(lead.created_at), 'MMM dd, yyyy')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {filteredLeads.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No leads found matching the current filters.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}