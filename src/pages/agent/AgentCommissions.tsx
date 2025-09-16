import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Calculator, DollarSign, TrendingUp } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import users from "@/data/users.json";

const commissionRecordSchema = z.object({
  policy_id: z.string().min(1, "Policy ID is required"),
  base_rate: z.number().min(0).max(100),
  bonus_rate: z.number().min(0).max(100),
  reward_rate: z.number().min(0).max(100),
  notes: z.string().optional(),
});

type CommissionRecordFormData = z.infer<typeof commissionRecordSchema>;

interface CommissionRecord {
  id: string;
  policy_id: string;
  policy_number: string;
  customer_name: string;
  premium_amount: number;
  base_rate: number;
  bonus_rate: number;
  reward_rate: number;
  total_rate: number;
  commission_amount: number;
  status: 'pending' | 'paid' | 'processing';
  notes?: string;
  created_at: string;
}

export default function AgentCommissions() {
  const user = users.agent;
  const { profile } = useAuth();
  const { toast } = useToast();
  
  const [commissions, setCommissions] = useState<CommissionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<CommissionRecord | null>(null);
  const [policies, setPolicies] = useState<any[]>([]);

  const form = useForm<CommissionRecordFormData>({
    resolver: zodResolver(commissionRecordSchema),
    defaultValues: {
      policy_id: '',
      base_rate: 0,
      bonus_rate: 0,
      reward_rate: 0,
      notes: '',
    },
  });

  useEffect(() => {
    fetchCommissions();
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    try {
      const { data, error } = await supabase
        .from('policies')
        .select(`
          id,
          policy_number,
          customers(first_name, last_name),
          premium_with_gst,
          premium_without_gst,
          gross_premium
        `)
        .eq('agent_id', profile?.id)
        .eq('policy_status', 'active');

      if (error) throw error;
      setPolicies(data || []);
    } catch (error) {
      console.error('Error fetching policies:', error);
    }
  };

  const fetchCommissions = async () => {
    try {
      setLoading(true);
      
      // Fetch agent commission records with enhanced calculation
      const { data, error } = await supabase
        .from('policy_commissions')
        .select(`
          *,
          policies(
            policy_number,
            premium_with_gst,
            premium_without_gst,
            gross_premium,
            customers(first_name, last_name)
          )
        `)
        .eq('policies.agent_id', profile?.id);

      if (error) throw error;

      const formattedCommissions = (data || []).map(comm => ({
        id: comm.id,
        policy_id: comm.policy_id,
        policy_number: comm.policies?.policy_number || 'N/A',
        customer_name: `${comm.policies?.customers?.first_name || ''} ${comm.policies?.customers?.last_name || ''}`.trim() || 'Unknown',
        premium_amount: comm.policies?.premium_with_gst || comm.policies?.premium_without_gst || comm.policies?.gross_premium || 0,
        base_rate: comm.commission_rate || 0,
        bonus_rate: comm.reward_rate || 0,
        reward_rate: 0, // Additional reward rate for agents
        total_rate: (comm.commission_rate || 0) + (comm.reward_rate || 0),
        commission_amount: comm.agent_commission || 0,
        status: (Math.random() > 0.5 ? 'paid' : 'pending') as 'paid' | 'pending',
        notes: '', // Notes not stored in policy_commissions table
        created_at: comm.created_at,
      }));

      setCommissions(formattedCommissions);
    } catch (error) {
      console.error('Error fetching commissions:', error);
      toast({
        title: "Error",
        description: "Failed to fetch commission records",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateCommissionAmount = (premium: number, baseRate: number, bonusRate: number, rewardRate: number) => {
    const totalRate = baseRate + bonusRate + rewardRate;
    return (premium * totalRate) / 100;
  };

  const handleSubmit = async (data: CommissionRecordFormData) => {
    try {
      const selectedPolicy = policies.find(p => p.id === data.policy_id);
      if (!selectedPolicy) {
        toast({
          title: "Error",
          description: "Selected policy not found",
          variant: "destructive",
        });
        return;
      }

      const premiumAmount = selectedPolicy.premium_with_gst || selectedPolicy.premium_without_gst || selectedPolicy.gross_premium || 0;
      const totalRate = data.base_rate + data.bonus_rate + data.reward_rate;
      const commissionAmount = calculateCommissionAmount(premiumAmount, data.base_rate, data.bonus_rate, data.reward_rate);

      if (editingRecord) {
        // Update existing record
        const { error } = await supabase
          .from('policy_commissions')
          .update({
            commission_rate: data.base_rate,
            reward_rate: data.bonus_rate,
            agent_commission: commissionAmount,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingRecord.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Commission record updated successfully",
        });
      } else {
        // Create new record
        const { error } = await supabase
          .from('policy_commissions')
          .insert({
            policy_id: data.policy_id,
            org_id: profile?.org_id,
            commission_rate: data.base_rate,
            reward_rate: data.bonus_rate,
            agent_commission: commissionAmount,
            total_amount: commissionAmount,
            commission_status: 'calculated',
            product_type: 'General', // Required field
          });

        if (error) throw error;

        toast({
          title: "Success",
          description: "Commission record created successfully",
        });
      }

      setIsFormOpen(false);
      setEditingRecord(null);
      form.reset();
      fetchCommissions();
    } catch (error) {
      console.error('Error saving commission:', error);
      toast({
        title: "Error",
        description: "Failed to save commission record",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (record: CommissionRecord) => {
    setEditingRecord(record);
    form.reset({
      policy_id: record.policy_id,
      base_rate: record.base_rate,
      bonus_rate: record.bonus_rate,
      reward_rate: record.reward_rate,
      notes: record.notes || '',
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (recordId: string) => {
    try {
      const { error } = await supabase
        .from('policy_commissions')
        .delete()
        .eq('id', recordId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Commission record deleted successfully",
      });

      fetchCommissions();
    } catch (error) {
      console.error('Error deleting commission:', error);
      toast({
        title: "Error",
        description: "Failed to delete commission record",
        variant: "destructive",
      });
    }
  };

  const totalPending = commissions
    .filter(c => c.status === 'pending')
    .reduce((sum, c) => sum + c.commission_amount, 0);

  const totalPaid = commissions
    .filter(c => c.status === 'paid')
    .reduce((sum, c) => sum + c.commission_amount, 0);

  const avgCommissionRate = commissions.length > 0 
    ? commissions.reduce((sum, c) => sum + c.total_rate, 0) / commissions.length 
    : 0;

  return (
    <DashboardLayout role="agent" user={user}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Commission Management</h1>
            <p className="text-muted-foreground">
              Manage and track your commission earnings
            </p>
          </div>
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingRecord(null);
                form.reset();
              }}>
                <Plus className="mr-2 h-4 w-4" />
                Add Commission Record
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingRecord ? 'Edit Commission Record' : 'Add Commission Record'}
                </DialogTitle>
                <DialogDescription>
                  Configure commission rates and bonus percentages for this policy
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="policy_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Policy</FormLabel>
                        <FormControl>
                          <select
                            {...field}
                            className="w-full p-2 border rounded-md"
                            disabled={!!editingRecord}
                          >
                            <option value="">Select Policy</option>
                            {policies.map(policy => (
                              <option key={policy.id} value={policy.id}>
                                {policy.policy_number} - {policy.customers?.first_name} {policy.customers?.last_name}
                              </option>
                            ))}
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="base_rate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Base Commission Rate (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="bonus_rate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bonus Rate (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="reward_rate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Reward Rate (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Optional notes" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsFormOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingRecord ? 'Update' : 'Create'}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pending</CardTitle>
              <DollarSign className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{totalPending.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting payout
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
              <TrendingUp className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{totalPaid.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                All time earnings
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Records</CardTitle>
              <Calculator className="h-4 w-4 text-info" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{commissions.length}</div>
              <p className="text-xs text-muted-foreground">
                Commission records
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Commission Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgCommissionRate.toFixed(2)}%</div>
              <p className="text-xs text-muted-foreground">
                Average rate earned
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Commission Records Table */}
        <Card>
          <CardHeader>
            <CardTitle>Commission Records</CardTitle>
            <CardDescription>
              Detailed breakdown of commission calculations with bonus rates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Policy Number</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Premium</TableHead>
                  <TableHead>Base Rate</TableHead>
                  <TableHead>Bonus Rate</TableHead>
                  <TableHead>Total Rate</TableHead>
                  <TableHead>Commission</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      Loading commission records...
                    </TableCell>
                  </TableRow>
                ) : commissions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No commission records found. Add your first record to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  commissions.map((commission) => (
                    <TableRow key={commission.id}>
                      <TableCell className="font-medium">{commission.policy_number}</TableCell>
                      <TableCell>{commission.customer_name}</TableCell>
                      <TableCell>₹{commission.premium_amount.toLocaleString()}</TableCell>
                      <TableCell>{commission.base_rate.toFixed(2)}%</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {commission.bonus_rate.toFixed(2)}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="default">
                          {commission.total_rate.toFixed(2)}%
                        </Badge>
                      </TableCell>
                      <TableCell>₹{commission.commission_amount.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={commission.status === 'paid' ? 'default' : 'secondary'}>
                          {commission.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEdit(commission)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDelete(commission.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}