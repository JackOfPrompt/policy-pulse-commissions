import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { 
  SidebarProvider, 
  Sidebar, 
  SidebarContent, 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarGroupLabel,
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar 
} from '@/components/ui/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  FileText, 
  BarChart3, 
  LogOut, 
  Clock, 
  DollarSign,
  Target,
  AlertCircle,
  TrendingUp,
  CalendarDays
} from 'lucide-react';
import { EmployeeProfile } from '@/components/employee/EmployeeProfile';
import { EmployeePolicyManagement } from '@/components/employee/EmployeePolicyManagement';
import { EmployeeReports } from '@/components/employee/EmployeeReports';
import { BackButton } from '@/components/ui/back-button';

type ActiveView = 'dashboard' | 'profile' | 'policies' | 'reports';

const EmployeeDashboard = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');

  useEffect(() => {
    if (!user || (profile?.role !== 'tenant_employee' && profile?.role !== 'tenant_agent')) {
      navigate('/login');
    }
  }, [user, profile, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (!user || (profile?.role !== 'tenant_employee' && profile?.role !== 'tenant_agent')) {
    return null;
  }

  const isAgent = profile?.role === 'tenant_agent';

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'policies', label: 'Policies', icon: FileText },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
  ];

  const dashboardCards = [
    {
      title: 'Active Policies',
      value: '24',
      description: 'Policies under management',
      icon: FileText,
      color: 'text-blue-600'
    },
    {
      title: 'Monthly Commission',
      value: '₹45,280',
      description: 'This month earnings',
      icon: DollarSign,
      color: 'text-green-600'
    },
    {
      title: 'Pending Renewals',
      value: '8',
      description: 'Due within 30 days',
      icon: Clock,
      color: 'text-orange-600'
    },
    {
      title: 'Target Achievement',
      value: '78%',
      description: 'Monthly target progress',
      icon: Target,
      color: 'text-purple-600'
    }
  ];

  const recentActivities = [
    {
      type: 'policy_created',
      description: 'New health policy created for John Doe',
      time: '2 hours ago',
      icon: FileText,
      color: 'text-green-600'
    },
    {
      type: 'renewal_reminder',
      description: 'Renewal reminder sent for Policy #POL123456',
      time: '4 hours ago',
      icon: Clock,
      color: 'text-orange-600'
    },
    {
      type: 'commission_earned',
      description: 'Commission earned: ₹2,500',
      time: '1 day ago',
      icon: DollarSign,
      color: 'text-green-600'
    }
  ];

  const pendingTasks = [
    {
      title: 'Document Upload Required',
      description: 'Upload KYC documents for Policy #POL123457',
      priority: 'high',
      dueDate: 'Today'
    },
    {
      title: 'Policy Renewal Follow-up',
      description: '3 policies expiring this week need follow-up',
      priority: 'medium',
      dueDate: 'Tomorrow'
    },
    {
      title: 'Customer Meeting',
      description: 'Schedule meeting with Jane Smith for new policy',
      priority: 'low',
      dueDate: 'This week'
    }
  ];

  const renderMainContent = () => {
    switch (activeView) {
      case 'profile':
        return <EmployeeProfile />;
      case 'policies':
        return <EmployeePolicyManagement />;
      case 'reports':
        return <EmployeeReports />;
      default:
        return (
          <div className="space-y-6">
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-primary to-primary/80 rounded-lg p-6 text-white">
              <h1 className="text-2xl font-bold mb-2">
                Welcome back, {profile?.first_name} {profile?.last_name}!
              </h1>
              <p className="text-white/90">
                {isAgent ? 'Agent Dashboard' : 'Employee Dashboard'} - {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>

            {/* Dashboard Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {dashboardCards.map((card, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                    <card.icon className={`h-4 w-4 ${card.color}`} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{card.value}</div>
                    <p className="text-xs text-muted-foreground">{card.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Activities */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Recent Activities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivities.map((activity, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 rounded-lg border">
                        <activity.icon className={`h-4 w-4 mt-1 ${activity.color}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{activity.description}</p>
                          <p className="text-xs text-muted-foreground">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Pending Tasks */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    Pending Tasks
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {pendingTasks.map((task, index) => (
                      <div key={index} className="p-3 rounded-lg border">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="text-sm font-medium">{task.title}</h4>
                              <Badge 
                                variant={task.priority === 'high' ? 'destructive' : 
                                        task.priority === 'medium' ? 'default' : 'secondary'}
                                className="text-xs"
                              >
                                {task.priority}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mb-1">
                              {task.description}
                            </p>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <CalendarDays className="h-3 w-3" />
                              Due: {task.dueDate}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );
    }
  };

  return (
    <SidebarProvider defaultOpen>
      <div className="min-h-screen flex w-full bg-background">
        {/* Sidebar */}
        <Sidebar className="w-64" collapsible="icon">
          <SidebarContent>
            <div className="p-4 border-b">
              <div className="flex items-center gap-3">
                <div>
                  <h2 className="font-semibold text-lg">
                    {isAgent ? 'Agent' : 'Employee'} Portal
                  </h2>
                  <p className="text-sm text-muted-foreground">{profile?.email}</p>
                </div>
              </div>
            </div>

            <SidebarGroup>
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        onClick={() => setActiveView(item.id as ActiveView)}
                        className={activeView === item.id ? 'bg-primary text-primary-foreground' : ''}
                      >
                        <item.icon className="mr-2 h-4 w-4" />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <div className="mt-auto p-4 border-t">
              <SidebarMenuButton onClick={handleSignOut} className="w-full text-destructive hover:bg-destructive/10">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign Out</span>
              </SidebarMenuButton>
            </div>
          </SidebarContent>
        </Sidebar>

        {/* Main Content */}
        <main className="flex-1 flex flex-col min-w-0">
          <header className="h-12 flex items-center border-b bg-background px-4 gap-2">
            <SidebarTrigger />
            <BackButton to="/" size="sm" variant="ghost" />
          </header>
          
          <div className="flex-1 p-6 overflow-auto">
            {renderMainContent()}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default EmployeeDashboard;