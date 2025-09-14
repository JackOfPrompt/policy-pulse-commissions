import { useState } from "react";
import { Plus, Edit, Trash2, DollarSign, Copy, Search, Filter } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { StatusChip } from "@/components/ui/status-chip";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/superadmin/shared/ConfirmDialog";
import { PlanFormModal } from "@/components/superadmin/PlanFormModal";
import { useSuperadminPlans } from "@/hooks/useSuperdminPlans";
import { Plan, PlanFormData } from "@/types/superadmin";
import users from "@/data/users.json";

export default function Plans() {
  const user = users.superadmin;
  const {
    plans,
    loading,
    filters,
    setFilters,
    createPlan,
    updatePlan,
    deletePlan,
    duplicatePlan
  } = useSuperadminPlans();

  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(price);
  };

  const handleCreatePlan = () => {
    setSelectedPlan(null);
    setShowFormModal(true);
  };

  const handleEditPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    setShowFormModal(true);
  };

  const handleDeletePlan = (plan: Plan) => {
    setSelectedPlan(plan);
    setShowDeleteDialog(true);
  };

  const handleDuplicatePlan = (plan: Plan) => {
    duplicatePlan(plan.id);
  };

  const handleFormSubmit = async (data: PlanFormData) => {
    if (selectedPlan) {
      return await updatePlan(selectedPlan.id, data);
    } else {
      return await createPlan(data);
    }
  };

  const handleConfirmDelete = async () => {
    if (selectedPlan) {
      const success = await deletePlan(selectedPlan.id);
      if (success) {
        setShowDeleteDialog(false);
        setSelectedPlan(null);
      }
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setFilters({ ...filters, search: value || undefined });
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
    setFilters({ 
      ...filters, 
      status: value === "all" ? undefined : value as "active" | "inactive" 
    });
  };

  return (
    <DashboardLayout role="superadmin" user={user}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Subscription Plans</h1>
            <p className="text-muted-foreground">
              Manage subscription plans and pricing tiers
            </p>
          </div>
          <Button onClick={handleCreatePlan}>
            <Plus className="mr-2 h-4 w-4" />
            Add Plan
          </Button>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search plans..."
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
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card key={plan.id} className="relative">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <StatusChip variant={plan.status === 'active' ? 'success' : 'secondary'}>
                    {plan.status}
                  </StatusChip>
                </div>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">
                      {formatPrice(plan.price, plan.currency)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      per {plan.billing_cycle}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Max Users:</span>
                      <span className="font-medium">
                        {plan.max_users === -1 ? 'Unlimited' : plan.max_users}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Max Policies:</span>
                      <span className="font-medium">
                        {plan.max_policies === -1 ? 'Unlimited' : plan.max_policies.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Features:</h4>
                    <div className="flex flex-wrap gap-1">
                      {plan.features.slice(0, 3).map((feature, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                      {plan.features.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{plan.features.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex space-x-2 pt-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleEditPlan(plan)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDuplicatePlan(plan)}
                      title="Duplicate Plan"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDeletePlan(plan)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Plan Details</CardTitle>
            <CardDescription>
              Complete feature comparison across all plans
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead>Policies</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-4 w-4 text-primary" />
                        <div>
                          <p className="font-medium">{plan.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {plan.billing_cycle}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatPrice(plan.price, plan.currency)}
                    </TableCell>
                    <TableCell>
                      {plan.max_users === -1 ? 'Unlimited' : plan.max_users}
                    </TableCell>
                    <TableCell>
                      {plan.max_policies === -1 ? 'Unlimited' : plan.max_policies.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <StatusChip 
                        variant={plan.status === 'active' ? 'success' : 'secondary'}
                      >
                        {plan.status}
                      </StatusChip>
                    </TableCell>
                    <TableCell>
                      {new Date(plan.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEditPlan(plan)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDuplicatePlan(plan)}
                          title="Duplicate"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeletePlan(plan)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Form Modal */}
        <PlanFormModal
          open={showFormModal}
          onOpenChange={setShowFormModal}
          plan={selectedPlan}
          onSubmit={handleFormSubmit}
        />

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          title="Delete Plan"
          description={`Are you sure you want to delete the plan "${selectedPlan?.name}"? This action cannot be undone.`}
          confirmText="Delete Plan"
          onConfirm={handleConfirmDelete}
          variant="destructive"
        />
      </div>
    </DashboardLayout>
  );
}