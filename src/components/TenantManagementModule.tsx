import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import BranchManagement from './BranchManagement';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Building2, 
  Save, 
  X, 
  Download, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Activity,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface OrganizationData {
  id: string;
  name: string;
  tenant_code: string;
  domain: string;
  contact_person: string;
  contact_email: string;
  contact_phone: string;
  address: string;
  logo_url: string;
  status: string;
}

interface SubscriptionData {
  plan_name: string;
  plan_type: string;
  start_date: string;
  end_date: string;
  status: string;
  max_users: number;
  max_policies: number;
  current_users: number;
  current_policies: number;
  features: string[];
}

interface ActivityLog {
  id: string;
  user_name: string;
  action: string;
  timestamp: string;
  module: string;
  details: string;
}

interface SubscriptionPlan {
  id: string;
  plan_name: string;
  plan_code: string;
  monthly_price: number;
  annual_price: number;
  max_users: number;
  max_policies: number;
  features: any;
}

export const TenantManagementModule = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [organizationData, setOrganizationData] = useState<OrganizationData | null>(null);
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [availablePlans, setAvailablePlans] = useState<SubscriptionPlan[]>([]);
  const [upgradeDowngradeModalOpen, setUpgradeDowngradeModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterModule, setFilterModule] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    contact_email: '',
    contact_phone: '',
    contact_person: '',
    domain: '',
    logo_url: ''
  });

  useEffect(() => {
    fetchOrganizationData();
    fetchSubscriptionData();
    fetchActivityLogs();
    fetchAvailablePlans();
  }, [currentPage, searchTerm, filterModule]);

  const fetchOrganizationData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('tenant-organization', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });

      if (error) throw error;

      if (data?.organization) {
        setOrganizationData(data.organization);
        setFormData({
          name: data.organization.name || '',
          address: data.organization.address || '',
          contact_email: data.organization.contact_email || '',
          contact_phone: data.organization.contact_phone || '',
          contact_person: data.organization.contact_person || '',
          domain: data.organization.domain || '',
          logo_url: data.organization.logo_url || ''
        });
      }
    } catch (error) {
      console.error('Error fetching organization data:', error);
      toast({
        title: "Error",
        description: "Failed to load organization details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscriptionData = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('tenant-subscription', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });

      if (error) throw error;
      setSubscriptionData(data?.subscription);
    } catch (error) {
      console.error('Error fetching subscription data:', error);
    }
  };

  const fetchActivityLogs = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('tenant-activity-logs', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: {
          page: currentPage,
          size: 10,
          search: searchTerm,
          module: filterModule === 'all' ? undefined : filterModule
        }
      });

      if (error) throw error;
      setActivityLogs(data?.logs || []);
      setTotalPages(Math.ceil((data?.total || 0) / 10));
    } catch (error) {
      console.error('Error fetching activity logs:', error);
    }
  };

  const fetchAvailablePlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('monthly_price');

      if (error) throw error;
      setAvailablePlans((data || []).map(plan => ({
        ...plan,
        features: Array.isArray(plan.features) ? plan.features : []
      })));
    } catch (error) {
      console.error('Error fetching available plans:', error);
    }
  };

  const handleSaveChanges = async () => {
    try {
      setSaving(true);
      const { data, error } = await supabase.functions.invoke('tenant-organization', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: formData
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Organization details updated successfully",
      });

      fetchOrganizationData();
    } catch (error) {
      console.error('Error updating organization:', error);
      toast({
        title: "Error",
        description: "Failed to update organization details",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSubscriptionChange = async (planId: string, action: 'upgrade' | 'downgrade') => {
    try {
      setSaving(true);
      const { data, error } = await supabase.functions.invoke(`tenant-subscription-${action}`, {
        method: 'POST',
        body: { plan_id: planId }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Subscription ${action} successful`,
      });

      setUpgradeDowngradeModalOpen(false);
      fetchSubscriptionData();
    } catch (error) {
      console.error(`Error ${action} subscription:`, error);
      toast({
        title: "Error",
        description: `Failed to ${action} subscription`,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const exportLogs = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('tenant-activity-logs', {
        method: 'GET',
        body: { export: true }
      });

      if (error) throw error;

      // Create and download CSV file
      const csvContent = data.csv;
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `activity-logs-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Activity logs exported successfully",
      });
    } catch (error) {
      console.error('Error exporting logs:', error);
      toast({
        title: "Error",
        description: "Failed to export activity logs",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Activity className="w-8 h-8 text-primary animate-pulse mr-2" />
        <span>Loading organization data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Building2 className="w-6 h-6 text-primary" />
        <div>
          <h2 className="text-lg font-semibold">Organization Details</h2>
          <p className="text-sm text-muted-foreground">
            {organizationData?.name} • {organizationData?.tenant_code}
          </p>
        </div>
      </div>

        <Tabs defaultValue="organization" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="organization">Organization Info</TabsTrigger>
            <TabsTrigger value="subscription">Subscription</TabsTrigger>
            <TabsTrigger value="branches">Branch Management</TabsTrigger>
            <TabsTrigger value="activity">Activity Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="organization" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Organization Details</CardTitle>
                <CardDescription>Update organization information and contact details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Organization Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Organization name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact_person">Contact Person</Label>
                    <Input
                      id="contact_person"
                      value={formData.contact_person}
                      onChange={(e) => setFormData(prev => ({ ...prev, contact_person: e.target.value }))}
                      placeholder="Contact person name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact_email">Contact Email</Label>
                    <Input
                      id="contact_email"
                      type="email"
                      value={formData.contact_email}
                      onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
                      placeholder="contact@organization.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact_phone">Contact Phone</Label>
                    <Input
                      id="contact_phone"
                      value={formData.contact_phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, contact_phone: e.target.value }))}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="domain">Domain</Label>
                    <Input
                      id="domain"
                      value={formData.domain}
                      onChange={(e) => setFormData(prev => ({ ...prev, domain: e.target.value }))}
                      placeholder="organization.domain.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="logo_url">Logo URL</Label>
                    <Input
                      id="logo_url"
                      value={formData.logo_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, logo_url: e.target.value }))}
                      placeholder="https://example.com/logo.png"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Organization address"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button onClick={handleSaveChanges} disabled={saving}>
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subscription" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Current Subscription</CardTitle>
                <CardDescription>Manage your subscription plan and usage</CardDescription>
              </CardHeader>
              <CardContent>
                {subscriptionData ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="p-4 rounded-lg border border-border bg-accent/20">
                        <h4 className="font-semibold text-sm text-muted-foreground">Plan Name</h4>
                        <p className="text-lg font-bold">{subscriptionData.plan_name}</p>
                      </div>
                      <div className="p-4 rounded-lg border border-border bg-accent/20">
                        <h4 className="font-semibold text-sm text-muted-foreground">Status</h4>
                        <Badge variant={subscriptionData.status === 'active' ? 'default' : 'secondary'}>
                          {subscriptionData.status}
                        </Badge>
                      </div>
                      <div className="p-4 rounded-lg border border-border bg-accent/20">
                        <h4 className="font-semibold text-sm text-muted-foreground">Start Date</h4>
                        <p className="text-lg font-bold">{new Date(subscriptionData.start_date).toLocaleDateString()}</p>
                      </div>
                      <div className="p-4 rounded-lg border border-border bg-accent/20">
                        <h4 className="font-semibold text-sm text-muted-foreground">End Date</h4>
                        <p className="text-lg font-bold">{new Date(subscriptionData.end_date).toLocaleDateString()}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg border border-border">
                        <h4 className="font-semibold mb-2">User Usage</h4>
                        <div className="flex justify-between mb-2">
                          <span>Current: {subscriptionData.current_users}</span>
                          <span>Limit: {subscriptionData.max_users}</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full" 
                            style={{
                              width: `${Math.min((subscriptionData.current_users / subscriptionData.max_users) * 100, 100)}%`
                            }}
                          ></div>
                        </div>
                      </div>
                      <div className="p-4 rounded-lg border border-border">
                        <h4 className="font-semibold mb-2">Policy Usage</h4>
                        <div className="flex justify-between mb-2">
                          <span>Current: {subscriptionData.current_policies}</span>
                          <span>Limit: {subscriptionData.max_policies}</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full" 
                            style={{
                              width: `${Math.min((subscriptionData.current_policies / subscriptionData.max_policies) * 100, 100)}%`
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button 
                        variant="outline" 
                        onClick={() => setUpgradeDowngradeModalOpen(true)}
                      >
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Upgrade Plan
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setUpgradeDowngradeModalOpen(true)}
                      >
                        <TrendingDown className="w-4 h-4 mr-2" />
                        Downgrade Plan
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No subscription data available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="branches" className="space-y-6">
            <BranchManagement />
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Activity Logs</CardTitle>
                    <CardDescription>Track user actions and system events</CardDescription>
                  </div>
                  <Button variant="outline" onClick={exportLogs}>
                    <Download className="w-4 h-4 mr-2" />
                    Export Logs
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex space-x-4 mb-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Search logs..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <Select value={filterModule} onValueChange={setFilterModule}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by module" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Modules</SelectItem>
                      <SelectItem value="tenant">Tenant Management</SelectItem>
                      <SelectItem value="users">User Management</SelectItem>
                      <SelectItem value="policies">Policy Management</SelectItem>
                      <SelectItem value="products">Product Management</SelectItem>
                      <SelectItem value="settings">Settings</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Module</TableHead>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activityLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-medium">{log.user_name}</TableCell>
                        <TableCell>{log.action}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{log.module}</Badge>
                        </TableCell>
                        <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                        <TableCell className="max-w-xs truncate">{log.details}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {totalPages > 1 && (
                  <div className="flex justify-between items-center mt-4">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4 mr-2" />
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Upgrade/Downgrade Modal */}
        <Dialog open={upgradeDowngradeModalOpen} onOpenChange={setUpgradeDowngradeModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change Subscription Plan</DialogTitle>
              <DialogDescription>
                Select a new plan to upgrade or downgrade your subscription
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a plan" />
                </SelectTrigger>
                <SelectContent>
                  {availablePlans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.plan_name} - ${plan.monthly_price}/month
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setUpgradeDowngradeModalOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => handleSubscriptionChange(selectedPlan, 'upgrade')}
                  disabled={!selectedPlan || saving}
                >
                  {saving ? 'Processing...' : 'Confirm Change'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
    </div>
  );
};