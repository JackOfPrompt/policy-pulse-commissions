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
interface Organization {
  id: string;
  org_name: string;
  type?: string;
  is_active?: boolean;
  created_at: string;
  [key: string]: any;
}
const SystemAdminDashboard = () => {
  const [tenants, setTenants] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const {
    user,
    profile,
    signOut
  } = useAuth();
  const {
    toast
  } = useToast();
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
      const {
        data,
        error
      } = await supabase.from('organizations').select('*').order('created_at', {
        ascending: false
      });
      if (error) throw error;
      setTenants(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch tenant organizations",
        variant: "destructive"
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
  return <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Modern Header with Gradient */}
      <header className="bg-gradient-to-r from-primary via-secondary to-accent shadow-lg border-b border-border/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-6">
              <BackButton to="/" />
              <div className="text-primary-foreground">
                <h1 className="text-2xl font-normal">System Admin Dashboard</h1>
                
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-primary-foreground text-right">
                
                
              </div>
              <Button variant="secondary" size="sm" onClick={handleSignOut} className="bg-white/10 hover:bg-white/20 text-primary-foreground border-white/20">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Compact KPI Cards */}
        <div className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <Card className="hover-lift bg-gradient-to-br from-secondary/10 to-primary/10 border-secondary/30">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-secondary">Total Tenants</p>
                    <p className="text-xl font-bold text-secondary">{tenants.length}</p>
                  </div>
                  <div className="p-1.5 rounded-full bg-secondary/20">
                    <Building className="h-4 w-4 text-secondary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="hover-lift bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/30">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-primary">Active Tenants</p>
                    <p className="text-xl font-bold text-primary">
                      {tenants.filter(t => t.is_active).length}
                    </p>
                  </div>
                  <div className="p-1.5 rounded-full bg-primary/20">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="hover-lift bg-gradient-to-br from-secondary/5 via-primary/5 to-secondary/10 border-secondary/20">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-secondary">System Health</p>
                    <p className="text-xl bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent font-semibold">Online</p>
                  </div>
                  <div className="p-1.5 rounded-full bg-gradient-to-r from-secondary/20 to-primary/20">
                    <Settings className="h-4 w-4 text-secondary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Master Data Management Section */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center gap-2 font-normal">
                  <Database className="w-5 h-5" />
                  Master Data Management
                </CardTitle>
                
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <MDMDashboard />
          </CardContent>
        </Card>

        {/* Tenant Management Module */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center gap-2 font-normal">
                  <Building className="w-5 h-5" />
                  Tenant Management
                </CardTitle>
                
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Tenant Organizations */}
              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/admin/tenants')}>
                <CardContent className="p-4 text-center">
                  <div className="mb-3 flex justify-center">
                    <div className="p-2.5 rounded-full bg-primary/10">
                      <Building className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                  <h3 className="text-foreground mb-2 font-normal">Tenant Organizations</h3>
                  
                  <div className="mt-3 text-xl font-bold text-primary">{tenants.length}</div>
                </CardContent>
              </Card>

              {/* Subscription Management */}
              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/admin/subscription-management')}>
                <CardContent className="p-4 text-center">
                  <div className="mb-3 flex justify-center">
                    <div className="p-2.5 rounded-full bg-secondary/10">
                      <Settings className="w-6 h-6 text-secondary" />
                    </div>
                  </div>
                  <h3 className="text-foreground mb-2 font-normal">Subscription Management</h3>
                  <p className="text-xs text-muted-foreground">Plans, billing, invoices, and payments</p>
                </CardContent>
              </Card>

              {/* Analytics & Reports */}
              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/admin/tenant-analytics')}>
                <CardContent className="p-4 text-center">
                  <div className="mb-3 flex justify-center">
                    <div className="p-2.5 rounded-full bg-accent/10">
                      <Users className="w-6 h-6 text-accent" />
                    </div>
                  </div>
                  <h3 className="text-foreground mb-2 font-normal">Analytics & Reports</h3>
                  <p className="text-xs text-muted-foreground">Revenue, usage, and tenant insights</p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>;
};
export default SystemAdminDashboard;