import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Building, Users, Settings, LogOut, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BackButton } from '@/components/ui/back-button';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import MDMDashboard from '@/components/MDMDashboard';

const SystemAdminDashboard = () => {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const { user, profile, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || profile?.role !== 'system_admin') {
      navigate('/login');
      return;
    }
    
    fetchTenants();
  }, [user, profile, navigate]);

  const fetchTenants = async () => {
    try {
      const { data, error } = await supabase
        .from('tenant_organizations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTenants(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch tenant organizations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const handleCreateTenant = () => {
    navigate('/admin/create-tenant');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-secondary/10">
      {/* Header */}
      <header className="bg-card border-b border-border/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <BackButton to="/" />
              <div className="flex items-center">
                <h1 className="text-xl font-bold text-primary">LMV Insurance</h1>
                <span className="ml-4 text-sm text-muted-foreground">System Admin Dashboard</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">
                Welcome, {profile?.first_name} {profile?.last_name}
              </span>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tenants.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Tenants</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {tenants.filter((t: any) => t.is_active).length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Health</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">Online</div>
            </CardContent>
          </Card>
        </div>

        {/* Master Data Management Section */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Master Data Management
                </CardTitle>
                <CardDescription>Manage all insurance master data entities</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <MDMDashboard />
          </CardContent>
        </Card>

        {/* Tenant Management */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Tenant Organizations</CardTitle>
                <CardDescription>Manage tenant organizations and their subscriptions</CardDescription>
              </div>
              <Button onClick={handleCreateTenant}>
                <Plus className="w-4 h-4 mr-2" />
                Add Tenant
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : tenants.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No tenant organizations found. Create your first tenant to get started.
              </div>
            ) : (
              <div className="space-y-4">
                {tenants.map((tenant: any) => (
                  <div key={tenant.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div>
                      <h3 className="font-medium">{tenant.name}</h3>
                      <p className="text-sm text-muted-foreground">{tenant.contact_email}</p>
                      <span className={`inline-block px-2 py-1 text-xs rounded-full mt-2 ${
                        tenant.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {tenant.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="space-x-2">
                      <Button variant="outline" size="sm">View</Button>
                      <Button variant="outline" size="sm">Edit</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default SystemAdminDashboard;