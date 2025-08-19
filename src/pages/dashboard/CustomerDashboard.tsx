import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/ui/back-button';
import { useAuth } from '@/hooks/useAuth';
import { Shield, FileText, CreditCard, LogOut } from 'lucide-react';

const CustomerDashboard = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || profile?.role !== 'customer') {
      navigate('/login');
    }
  }, [user, profile, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (!user || profile?.role !== 'customer') {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <BackButton to="/" />
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
              <CardTitle className="text-sm font-medium">Active Policies</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">
                Auto, Home, Life
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Claims</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1</div>
              <p className="text-xs text-muted-foreground">
                Pending claim
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Premium</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$245</div>
              <p className="text-xs text-muted-foreground">
                Next payment: Jan 15
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>My Policies</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-medium">Auto Insurance</h3>
                    <p className="text-sm text-muted-foreground">Policy #: AUTO-2024-001</p>
                    <p className="text-sm text-muted-foreground">Expires: 12/31/2024</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">$85/mo</div>
                    <Button size="sm" variant="outline">View Details</Button>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-medium">Home Insurance</h3>
                    <p className="text-sm text-muted-foreground">Policy #: HOME-2024-002</p>
                    <p className="text-sm text-muted-foreground">Expires: 06/30/2024</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">$120/mo</div>
                    <Button size="sm" variant="outline">View Details</Button>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-medium">Life Insurance</h3>
                    <p className="text-sm text-muted-foreground">Policy #: LIFE-2024-003</p>
                    <p className="text-sm text-muted-foreground">Coverage: $250,000</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">$40/mo</div>
                    <Button size="sm" variant="outline">View Details</Button>
                  </div>
                </div>
              </div>
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
                  <FileText className="w-6 h-6 mb-2" />
                  File Claim
                </Button>
                <Button variant="outline" className="h-20 flex flex-col">
                  <CreditCard className="w-6 h-6 mb-2" />
                  Make Payment
                </Button>
                <Button variant="outline" className="h-20 flex flex-col">
                  <Shield className="w-6 h-6 mb-2" />
                  Get Quote
                </Button>
                <Button variant="outline" className="h-20 flex flex-col">
                  <FileText className="w-6 h-6 mb-2" />
                  View Documents
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default CustomerDashboard;