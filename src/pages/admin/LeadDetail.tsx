import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ArrowLeft, Phone, Mail, MapPin, Calendar, Plus, Edit, CheckCircle, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { LeadStatusBadge } from "@/components/admin/LeadStatusBadge";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { cn } from "@/lib/utils";

const followUpSchema = z.object({
  followUpDate: z.date(),
  notes: z.string().min(1, "Notes are required")
});

type FollowUpData = z.infer<typeof followUpSchema>;

interface Lead {
  id: string;
  lead_number: string;
  full_name: string;
  phone_number: string;
  email?: string;
  location?: string;
  line_of_business: string;
  lead_source: string;
  lead_status: string;
  priority: string;
  reason_if_dropped?: string;
  next_follow_up_date?: string;
  created_at: string;
  updated_at: string;
  product?: { name: string };
  insurance_provider?: { provider_name: string };
  branch?: { name: string };
}

interface FollowUp {
  id: string;
  follow_up_date: string;
  follow_up_time?: string;
  notes: string;
  status: string;
  completed_at?: string;
  created_at: string;
}

interface StatusHistory {
  id: string;
  previous_status: string;
  new_status: string;
  changed_at: string;
  change_reason?: string;
}

export default function LeadDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [lead, setLead] = useState<Lead | null>(null);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [statusHistory, setStatusHistory] = useState<StatusHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddFollowUp, setShowAddFollowUp] = useState(false);
  const [showStatusChange, setShowStatusChange] = useState(false);
  const [newStatus, setNewStatus] = useState<"New" | "Contacted" | "In Progress" | "Converted" | "Dropped" | "">("");
  const [statusReason, setStatusReason] = useState("");

  const followUpForm = useForm<FollowUpData>({
    resolver: zodResolver(followUpSchema)
  });

  useEffect(() => {
    if (id) {
      fetchLeadData();
    }
  }, [id]);

  const fetchLeadData = async () => {
    setIsLoading(true);
    try {
      // Fetch lead details
      const { data: leadData, error: leadError } = await supabase
        .from('leads')
        .select(`
          *,
          product:insurance_products(name),
          insurance_provider:insurance_providers(provider_name),
          branch:branches(name)
        `)
        .eq('id', id)
        .single();

      if (leadError) throw leadError;
      setLead(leadData);

      // Fetch follow-ups
      const { data: followUpData, error: followUpError } = await supabase
        .from('lead_follow_ups')
        .select('*')
        .eq('lead_id', id)
        .order('follow_up_date', { ascending: false });

      if (followUpError) throw followUpError;
      setFollowUps(followUpData || []);

      // Fetch status history
      const { data: historyData, error: historyError } = await supabase
        .from('lead_status_history')
        .select('*')
        .eq('lead_id', id)
        .order('changed_at', { ascending: false });

      if (historyError) throw historyError;
      setStatusHistory(historyData || []);

    } catch (error: any) {
      toast.error(error.message || "Failed to fetch lead data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async () => {
    if (!newStatus || !lead) return;

    try {
      const { error } = await supabase
        .from('leads')
        .update({ 
          lead_status: newStatus,
          reason_if_dropped: newStatus === 'Dropped' ? statusReason : null
        })
        .eq('id', lead.id);

      if (error) throw error;

      toast.success("Lead status updated successfully");
      setShowStatusChange(false);
      setNewStatus("");
      setStatusReason("");
      fetchLeadData();
    } catch (error: any) {
      toast.error(error.message || "Failed to update status");
    }
  };

  const handleAddFollowUp = async (data: FollowUpData) => {
    if (!lead) return;

    try {
      const { error } = await supabase
        .from('lead_follow_ups')
        .insert({
          lead_id: lead.id,
          follow_up_date: format(data.followUpDate, 'yyyy-MM-dd'),
          notes: data.notes
        });

      if (error) throw error;

      // Update lead's next follow-up date
      await supabase
        .from('leads')
        .update({ next_follow_up_date: format(data.followUpDate, 'yyyy-MM-dd') })
        .eq('id', lead.id);

      toast.success("Follow-up added successfully");
      setShowAddFollowUp(false);
      followUpForm.reset();
      fetchLeadData();
    } catch (error: any) {
      toast.error(error.message || "Failed to add follow-up");
    }
  };

  const markFollowUpCompleted = async (followUpId: string) => {
    try {
      const { error } = await supabase
        .from('lead_follow_ups')
        .update({ 
          status: 'Completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', followUpId);

      if (error) throw error;

      toast.success("Follow-up marked as completed");
      fetchLeadData();
    } catch (error: any) {
      toast.error(error.message || "Failed to update follow-up");
    }
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      'Low': 'bg-gray-100 text-gray-800',
      'Medium': 'bg-blue-100 text-blue-800',
      'High': 'bg-orange-100 text-orange-800',
      'Urgent': 'bg-red-100 text-red-800'
    };
    return colors[priority as keyof typeof colors] || colors.Medium;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold">Lead not found</h2>
        <Button onClick={() => navigate('/admin/leads')} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Leads
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/admin/leads')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Leads
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{lead.full_name}</h1>
            <p className="text-muted-foreground">Lead #{lead.lead_number}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Dialog open={showAddFollowUp} onOpenChange={setShowAddFollowUp}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Follow-up
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Follow-up</DialogTitle>
              </DialogHeader>
              <Form {...followUpForm}>
                <form onSubmit={followUpForm.handleSubmit(handleAddFollowUp)} className="space-y-4">
                  <FormField
                    control={followUpForm.control}
                    name="followUpDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Follow-up Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <Calendar className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <CalendarComponent
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => date < new Date()}
                              initialFocus
                              className={cn("p-3 pointer-events-auto")}
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={followUpForm.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter follow-up notes" 
                            className="min-h-[80px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-2">
                    <Button type="submit">Add Follow-up</Button>
                    <Button type="button" variant="outline" onClick={() => setShowAddFollowUp(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          <Dialog open={showStatusChange} onOpenChange={setShowStatusChange}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Edit className="mr-2 h-4 w-4" />
                Change Status
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Change Lead Status</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">New Status</label>
                  <Select value={newStatus} onValueChange={(value) => setNewStatus(value as typeof newStatus)}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select new status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="New">New</SelectItem>
                      <SelectItem value="Contacted">Contacted</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Converted">Converted</SelectItem>
                      <SelectItem value="Dropped">Dropped</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {newStatus === 'Dropped' && (
                  <div>
                    <label className="text-sm font-medium">Reason for Dropping</label>
                    <Textarea
                      value={statusReason}
                      onChange={(e) => setStatusReason(e.target.value)}
                      placeholder="Enter reason for dropping the lead"
                      className="mt-2"
                    />
                  </div>
                )}

                <div className="flex gap-2">
                  <Button onClick={handleStatusChange} disabled={!newStatus}>
                    Update Status
                  </Button>
                  <Button variant="outline" onClick={() => setShowStatusChange(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Lead Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Lead Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{lead.phone_number}</p>
                  </div>
                </div>

                {lead.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{lead.email}</p>
                    </div>
                  </div>
                )}

                {lead.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Location</p>
                      <p className="font-medium">{lead.location}</p>
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-sm text-muted-foreground">Line of Business</p>
                  <p className="font-medium">{lead.line_of_business}</p>
                </div>

                {lead.product && (
                  <div>
                    <p className="text-sm text-muted-foreground">Product</p>
                    <p className="font-medium">{lead.product.name}</p>
                  </div>
                )}

                {lead.insurance_provider && (
                  <div>
                    <p className="text-sm text-muted-foreground">Provider</p>
                    <p className="font-medium">{lead.insurance_provider.provider_name}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm text-muted-foreground">Source</p>
                  <Badge variant="outline">{lead.lead_source}</Badge>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Priority</p>
                  <Badge variant="secondary" className={getPriorityBadge(lead.priority)}>
                    {lead.priority}
                  </Badge>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <LeadStatusBadge status={lead.lead_status} />
                </div>

                {lead.next_follow_up_date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Next Follow-up</p>
                      <p className="font-medium">
                        {format(new Date(lead.next_follow_up_date), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {lead.reason_if_dropped && (
                <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-sm font-medium text-red-800">Reason for Dropping:</p>
                  <p className="text-sm text-red-700 mt-1">{lead.reason_if_dropped}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Follow-ups */}
          <Card>
            <CardHeader>
              <CardTitle>Follow-ups ({followUps.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {followUps.length > 0 ? (
                <div className="space-y-4">
                  {followUps.map((followUp) => (
                    <div key={followUp.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={followUp.status === 'Completed' ? 'default' : 'secondary'}>
                              {followUp.status}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {format(new Date(followUp.follow_up_date), 'MMM dd, yyyy')}
                            </span>
                          </div>
                          <p className="text-sm">{followUp.notes}</p>
                          {followUp.completed_at && (
                            <p className="text-xs text-muted-foreground mt-2">
                              Completed on {format(new Date(followUp.completed_at), 'MMM dd, yyyy HH:mm')}
                            </p>
                          )}
                        </div>
                        {followUp.status === 'Pending' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => markFollowUpCompleted(followUp.id)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Mark Complete
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  No follow-ups recorded yet.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status History */}
          <Card>
            <CardHeader>
              <CardTitle>Status History</CardTitle>
            </CardHeader>
            <CardContent>
              {statusHistory.length > 0 ? (
                <div className="space-y-3">
                  {statusHistory.map((history) => (
                    <div key={history.id} className="text-sm">
                      <div className="flex items-center justify-between">
                        <LeadStatusBadge status={history.new_status} />
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(history.changed_at), 'MMM dd, HH:mm')}
                        </span>
                      </div>
                      {history.previous_status && (
                        <p className="text-xs text-muted-foreground mt-1">
                          From: {history.previous_status}
                        </p>
                      )}
                      {history.change_reason && (
                        <p className="text-xs mt-1">{history.change_reason}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No status changes recorded.</p>
              )}
            </CardContent>
          </Card>

          {/* Lead Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Lead Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="text-sm font-medium">
                  {format(new Date(lead.created_at), 'MMM dd, yyyy HH:mm')}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Updated</p>
                <p className="text-sm font-medium">
                  {format(new Date(lead.updated_at), 'MMM dd, yyyy HH:mm')}
                </p>
              </div>
              {lead.branch && (
                <div>
                  <p className="text-sm text-muted-foreground">Branch</p>
                  <p className="text-sm font-medium">{lead.branch.name}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}