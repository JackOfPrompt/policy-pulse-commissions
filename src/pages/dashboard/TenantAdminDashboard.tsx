import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/ui/back-button';
import { useAuth } from '@/hooks/useAuth';
import { Building, Users, FileText, LogOut } from 'lucide-react';

const TenantAdminDashboard = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || profile?.role !== 'tenant_admin') {
      navigate('/login');
    }
  }, [user, profile, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (!user || profile?.role !== 'tenant_admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <BackButton to="/" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">Tenant Admin Dashboard</h1>
                <p className="text-sm text-muted-foreground">
                  Welcome back, {profile?.first_name} {profile?.last_name}
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Organization</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Manage</div>
              <p className="text-xs text-muted-foreground">
                Organization settings
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Manage</div>
              <p className="text-xs text-muted-foreground">
                Employee and agent accounts
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reports</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">View</div>
              <p className="text-xs text-muted-foreground">
                Analytics and reports
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button className="h-20 flex flex-col">
                  <Building className="w-6 h-6 mb-2" />
                  Manage Organization
                </Button>
                <Button variant="outline" className="h-20 flex flex-col">
                  <Users className="w-6 h-6 mb-2" />
                  Add Employee
                </Button>
                <Button variant="outline" className="h-20 flex flex-col">
                  <Users className="w-6 h-6 mb-2" />
                  Add Agent
                </Button>
                <Button variant="outline" className="h-20 flex flex-col">
                  <FileText className="w-6 h-6 mb-2" />
                  View Reports
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default TenantAdminDashboard;