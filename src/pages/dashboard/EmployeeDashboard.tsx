import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/ui/back-button';
import { useAuth } from '@/hooks/useAuth';
import { FileText, Users, Calendar, LogOut } from 'lucide-react';

const EmployeeDashboard = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || profile?.role !== 'tenant_employee') {
      navigate('/login');
    }
  }, [user, profile, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (!user || profile?.role !== 'tenant_employee') {
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
                <h1 className="text-2xl font-bold text-foreground">Employee Dashboard</h1>
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
              <CardTitle className="text-sm font-medium">Policies</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Manage</div>
              <p className="text-xs text-muted-foreground">
                Policy administration
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Support</div>
              <p className="text-xs text-muted-foreground">
                Customer service
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Schedule</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">View</div>
              <p className="text-xs text-muted-foreground">
                Appointments & tasks
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Today's Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-medium">Review pending claims</h3>
                    <p className="text-sm text-muted-foreground">5 claims awaiting review</p>
                  </div>
                  <Button size="sm">Review</Button>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-medium">Customer follow-ups</h3>
                    <p className="text-sm text-muted-foreground">3 customers to contact</p>
                  </div>
                  <Button size="sm" variant="outline">Contact</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default EmployeeDashboard;