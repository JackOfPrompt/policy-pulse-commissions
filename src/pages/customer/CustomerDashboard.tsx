import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useSimpleAuth } from '@/components/auth/SimpleAuthContext';
import { CustomerSidebar } from '@/components/customer/CustomerSidebar';
import { 
  Shield, 
  Calendar, 
  FileText, 
  Clock, 
  AlertTriangle,
  CheckCircle2,
  Phone,
  Mail,
  CreditCard,
  RefreshCw,
  Download
} from 'lucide-react';

const CustomerDashboard = () => {
  const { user } = useSimpleAuth();

  const myPolicies = [
    {
      id: "POL-2024-156",
      type: "Motor Insurance",
      vehicle: "Honda City (MH-01-AB-1234)",
      premium: "₹15,000",
      status: "Active",
      expiryDate: "2024-12-15",
      nextDue: "2024-11-15",
      daysToExpiry: 45
    },
    {
      id: "POL-2024-089",
      type: "Health Insurance",
      coverage: "₹5,00,000",
      premium: "₹25,000",
      status: "Active",
      expiryDate: "2024-08-20",
      nextDue: "2024-07-20",
      daysToExpiry: 120
    },
    {
      id: "POL-2023-245",
      type: "Term Life Insurance",
      coverage: "₹25,00,000",
      premium: "₹18,000",
      status: "Active",
      expiryDate: "2025-03-10",
      nextDue: "2024-03-10",
      daysToExpiry: 280
    }
  ];

  const quickActions = [
    { 
      label: "Renew Policy", 
      description: "Renew your existing policies",
      href: "/customer/renewals", 
      icon: RefreshCw,
      color: "text-blue-600",
      bgColor: "bg-blue-100"
    },
    { 
      label: "File a Claim", 
      description: "Submit insurance claim",
      href: "/customer/claims/new", 
      icon: FileText,
      color: "text-orange-600",
      bgColor: "bg-orange-100"
    },
    { 
      label: "Download Documents", 
      description: "Get policy certificates",
      href: "/customer/documents", 
      icon: Download,
      color: "text-green-600",
      bgColor: "bg-green-100"
    },
    { 
      label: "Contact Support", 
      description: "Get help and assistance",
      href: "/customer/support", 
      icon: Phone,
      color: "text-purple-600",
      bgColor: "bg-purple-100"
    }
  ];

  const upcomingRenewals = myPolicies.filter(p => p.daysToExpiry <= 60);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'default';
      case 'Expired': return 'destructive';
      case 'Pending': return 'secondary';
      default: return 'outline';
    }
  };

  const getUrgencyColor = (days: number) => {
    if (days <= 30) return 'text-red-600 bg-red-100';
    if (days <= 60) return 'text-orange-600 bg-orange-100';
    return 'text-green-600 bg-green-100';
  };

  return (
    <div className="flex h-screen">
      <CustomerSidebar />
      <div className="flex-1 p-6 space-y-6 overflow-auto">
        {/* Header */}
        <div className="border-b border-border pb-4">
          <h1 className="text-2xl font-bold text-foreground">
            Welcome back, {user?.email}
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline">Customer</Badge>
            <Badge variant="default">KYC: Verified</Badge>
          </div>
        </div>

      {/* Policy Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="p-4 rounded-lg bg-blue-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Policies</p>
                  <p className="text-2xl font-bold text-blue-600">{myPolicies.length}</p>
                  <p className="text-xs text-muted-foreground">All products</p>
                </div>
                <Shield className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="p-4 rounded-lg bg-green-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Coverage</p>
                  <p className="text-2xl font-bold text-green-600">₹30.5L</p>
                  <p className="text-xs text-muted-foreground">Sum insured</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="p-4 rounded-lg bg-orange-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Renewals Due</p>
                  <p className="text-2xl font-bold text-orange-600">{upcomingRenewals.length}</p>
                  <p className="text-xs text-muted-foreground">Next 60 days</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* My Policies */}
        <Card className="lg:col-span-2 shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              My Policies
            </CardTitle>
            <CardDescription>Overview of all your insurance policies</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {myPolicies.map((policy, index) => (
                <div key={index} className="p-4 border border-border rounded-lg">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold">{policy.type}</h3>
                      <p className="text-sm text-muted-foreground">{policy.id}</p>
                      {policy.vehicle && (
                        <p className="text-xs text-muted-foreground">{policy.vehicle}</p>
                      )}
                      {policy.coverage && (
                        <p className="text-xs text-muted-foreground">Coverage: {policy.coverage}</p>
                      )}
                    </div>
                    <Badge variant={getStatusColor(policy.status)}>
                      {policy.status}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Premium</p>
                      <p className="font-medium">{policy.premium}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Expires</p>
                      <p className="font-medium">{policy.expiryDate}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Days Left</p>
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getUrgencyColor(policy.daysToExpiry)}`}>
                        {policy.daysToExpiry} days
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" className="text-xs">
                        View
                      </Button>
                      <Button size="sm" variant="outline" className="text-xs">
                        Renew
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and services</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {quickActions.map((action, index) => {
              const IconComponent = action.icon;
              return (
                <div key={index} className={`p-3 rounded-lg ${action.bgColor} cursor-pointer hover:opacity-80 transition-opacity`}>
                  <div className="flex items-start gap-3">
                    <IconComponent className={`h-5 w-5 ${action.color} mt-0.5`} />
                    <div>
                      <p className="font-medium text-sm">{action.label}</p>
                      <p className="text-xs text-muted-foreground">{action.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Renewal Alerts */}
      {upcomingRenewals.length > 0 && (
        <Card className="shadow-card border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="h-5 w-5" />
              Renewal Reminders
            </CardTitle>
            <CardDescription>Policies expiring soon</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingRenewals.map((policy, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <div>
                    <p className="font-medium">{policy.type}</p>
                    <p className="text-sm text-muted-foreground">Expires: {policy.expiryDate}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-orange-600">
                      {policy.daysToExpiry} days left
                    </span>
                    <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
                      Renew Now
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      </div>
    </div>
  );
};

export default CustomerDashboard;