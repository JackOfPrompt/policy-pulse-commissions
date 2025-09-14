import { useState } from "react";
import { Building2, Calendar, DollarSign, Edit, MoreHorizontal, Search, Filter, RefreshCw, Ban } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { StatusChip } from "@/components/ui/status-chip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { SubscriptionActionModal } from "@/components/superadmin/SubscriptionActionModal";
import { useSuperadminSubscriptions } from "@/hooks/useSuperadminSubscriptions";
import { Subscription } from "@/types/superadmin";
import users from "@/data/users.json";

export default function Subscriptions() {
  const user = users.superadmin;
  const {
    subscriptions,
    loading,
    filters,
    setFilters,
    statistics,
    renewSubscription,
    cancelSubscription
  } = useSuperadminSubscriptions();

  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [actionType, setActionType] = useState<'extend' | 'cancel' | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'trial': return 'info';
      case 'expired': return 'destructive';
      case 'cancelled': return 'secondary';
      default: return 'secondary';
    }
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const handleExtendSubscription = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setActionType('extend');
    setShowActionModal(true);
  };

  const handleCancelSubscription = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setActionType('cancel');
    setShowActionModal(true);
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setFilters({ ...filters, search: value || undefined });
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
    setFilters({ 
      ...filters, 
      status: value === "all" ? undefined : value as "active" | "trial" | "expired" | "cancelled"
    });
  };

  return (
    <DashboardLayout role="superadmin" user={user}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Subscriptions</h1>
            <p className="text-muted-foreground">
              Monitor and manage all subscription activities
            </p>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search subscriptions..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={statusFilter} onValueChange={handleStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="trial">Trial</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Subscriptions
              </CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.total}</div>
              <p className="text-xs text-muted-foreground">
                All subscription plans
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Subscriptions
              </CardTitle>
              <Calendar className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{statistics.active}</div>
              <p className="text-xs text-muted-foreground">
                Currently paying
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Trial Subscriptions
              </CardTitle>
              <Calendar className="h-4 w-4 text-info" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-info">{statistics.trial}</div>
              <p className="text-xs text-muted-foreground">
                In trial period
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Monthly Revenue
              </CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatPrice(statistics.totalRevenue, 'USD')}</div>
              <p className="text-xs text-muted-foreground">
                From active plans
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Subscriptions</CardTitle>
            <CardDescription>
              Complete overview of subscription status and billing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organization</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>Next Billing</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscriptions.map((subscription) => (
                  <TableRow key={subscription.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{subscription.organizationName}</p>
                          <p className="text-sm text-muted-foreground">
                            ID: {subscription.organizationId}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                        <div>
                        <p className="font-medium">{subscription.planName}</p>
                        <p className="text-sm text-muted-foreground">
                          {subscription.planId}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusChip variant={getStatusVariant(subscription.status)}>
                        {subscription.status}
                      </StatusChip>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatPrice(subscription.monthlyAmount, subscription.currency)}
                    </TableCell>
                    <TableCell>
                      {formatDate(subscription.startDate)}
                    </TableCell>
                    <TableCell>
                      {subscription.nextBilling 
                        ? formatDate(subscription.nextBilling)
                        : '-'
                      }
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleExtendSubscription(subscription)}>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Extend Subscription
                          </DropdownMenuItem>
                          <DropdownMenuItem disabled>
                            Upgrade Plan
                          </DropdownMenuItem>
                          <DropdownMenuItem disabled>
                            Downgrade Plan
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => handleCancelSubscription(subscription)}
                          >
                            <Ban className="mr-2 h-4 w-4" />
                            Cancel Subscription
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Action Modal */}
        <SubscriptionActionModal
          open={showActionModal}
          onOpenChange={setShowActionModal}
          subscription={selectedSubscription}
          action={actionType}
          onExtend={renewSubscription}
          onCancel={cancelSubscription}
        />
      </div>
    </DashboardLayout>
  );
}