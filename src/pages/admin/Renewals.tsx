import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Bell, CheckCircle2, AlertTriangle, Clock, Search, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import BulkUploadModal from "@/components/admin/BulkUploadModal";
import { renewalTemplate, renewalSampleData, validateRenewalData, uploadRenewalData } from "@/utils/renewalBulkUpload";

interface RenewalData {
  id: string;
  policy_number: string;
  customer_name: string;
  renewal_due_date: string;
  renewal_status: string;
  urgency_status: string;
  days_until_due: number;
  agent_name: string;
  product_name: string;
  insurer_name: string;
  branch_name: string;
  premium_amount: number;
  follow_up_date: string;
  remarks: string;
  renewal_reminder_sent: boolean;
}

const Renewals = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [renewals, setRenewals] = useState<RenewalData[]>([]);
  const [filteredRenewals, setFilteredRenewals] = useState<RenewalData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [urgencyFilter, setUrgencyFilter] = useState("all");
  const [selectedRenewals, setSelectedRenewals] = useState<string[]>([]);
  const [showReminderDialog, setShowReminderDialog] = useState(false);
  const [showRenewalDialog, setShowRenewalDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showFollowUpDialog, setShowFollowUpDialog] = useState(false);
  const [selectedRenewal, setSelectedRenewal] = useState<RenewalData | null>(null);
  const [reminderNotes, setReminderNotes] = useState("");
  const [renewalNotes, setRenewalNotes] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [followUpNotes, setFollowUpNotes] = useState("");
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [reminderPolicies, setReminderPolicies] = useState<any[]>([]);
  
  const { toast } = useToast();

  useEffect(() => {
    fetchRenewals();
    if (activeTab === "logs") {
      fetchActivityLogs();
    }
    if (activeTab === "reminders") {
      fetchReminderPolicies();
    }
  }, [activeTab]);

  useEffect(() => {
    filterRenewals();
  }, [renewals, searchTerm, statusFilter, urgencyFilter]);

  const fetchRenewals = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("renewals_with_details")
        .select("*")
        .order("renewal_due_date", { ascending: true });

      if (error) throw error;
      setRenewals(data || []);
    } catch (error) {
      console.error("Error fetching renewals:", error);
      toast({
        title: "Error",
        description: "Failed to fetch renewals data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchActivityLogs = async () => {
    try {
      const { data, error } = await supabase
        .from("policy_renewal_logs")
        .select(`
          *,
          policy_renewals!inner (
            policy_number,
            customer_name
          )
        `)
        .order("timestamp", { ascending: false })
        .limit(100);

      if (error) throw error;
      setActivityLogs(data || []);
    } catch (error) {
      console.error("Error fetching activity logs:", error);
    }
  };

  const fetchReminderPolicies = async () => {
    try {
      const today = new Date();
      const fifteenDaysFromNow = new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000);
      
      const { data, error } = await supabase
        .from("renewals_with_details")
        .select("*")
        .gte("renewal_due_date", today.toISOString().split('T')[0])
        .lte("renewal_due_date", fifteenDaysFromNow.toISOString().split('T')[0])
        .eq("renewal_status", "Pending")
        .order("renewal_due_date", { ascending: true });

      if (error) throw error;
      setReminderPolicies(data || []);
    } catch (error) {
      console.error("Error fetching reminder policies:", error);
    }
  };

  const filterRenewals = () => {
    let filtered = renewals;

    if (searchTerm) {
      filtered = filtered.filter(r => 
        r.policy_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.agent_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter && statusFilter !== "all") {
      filtered = filtered.filter(r => r.renewal_status === statusFilter);
    }

    if (urgencyFilter && urgencyFilter !== "all") {
      filtered = filtered.filter(r => r.urgency_status === urgencyFilter);
    }

    setFilteredRenewals(filtered);
  };

  const handleSendReminder = async (renewalId: string, notes: string) => {
    try {
      const { error: updateError } = await supabase
        .from("policy_renewals")
        .update({ 
          renewal_reminder_sent: true,
          updated_at: new Date().toISOString()
        })
        .eq("id", renewalId);

      if (updateError) throw updateError;

      const { error: logError } = await supabase
        .from("policy_renewal_logs")
        .insert({
          renewal_id: renewalId,
          action: "Reminder Sent",
          notes: notes || "Renewal reminder sent to customer"
        });

      if (logError) throw logError;

      toast({
        title: "Success",
        description: "Reminder sent successfully"
      });

      fetchRenewals();
    } catch (error) {
      console.error("Error sending reminder:", error);
      toast({
        title: "Error",
        description: "Failed to send reminder",
        variant: "destructive"
      });
    }
  };

  const handleMarkAsRenewed = async (renewalId: string, notes: string) => {
    try {
      const { error: updateError } = await supabase
        .from("policy_renewals")
        .update({ 
          renewal_status: "Renewed",
          updated_at: new Date().toISOString()
        })
        .eq("id", renewalId);

      if (updateError) throw updateError;

      const { error: logError } = await supabase
        .from("policy_renewal_logs")
        .insert({
          renewal_id: renewalId,
          action: "Policy Renewed",
          notes: notes || "Policy marked as renewed"
        });

      if (logError) throw logError;

      toast({
        title: "Success",
        description: "Policy marked as renewed"
      });

      fetchRenewals();
    } catch (error) {
      console.error("Error marking as renewed:", error);
      toast({
        title: "Error", 
        description: "Failed to update renewal status",
        variant: "destructive"
      });
    }
  };

  const handleUpdateRenewalStatus = async (renewalId: string, status: string, notes: string) => {
    try {
      const { error: updateError } = await supabase
        .from("policy_renewals")
        .update({ 
          renewal_status: status,
          updated_at: new Date().toISOString()
        })
        .eq("id", renewalId);

      if (updateError) throw updateError;

      const { error: logError } = await supabase
        .from("policy_renewal_logs")
        .insert({
          renewal_id: renewalId,
          action: `Status Updated to ${status}`,
          notes: notes || `Status changed to ${status}`
        });

      if (logError) throw logError;

      toast({
        title: "Success",
        description: `Status updated to ${status}`
      });

      fetchRenewals();
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Error", 
        description: "Failed to update renewal status",
        variant: "destructive"
      });
    }
  };

  const handleScheduleFollowUp = async (renewalId: string, followUpDate: string, notes: string) => {
    try {
      const { error: updateError } = await supabase
        .from("policy_renewals")
        .update({ 
          follow_up_date: followUpDate,
          updated_at: new Date().toISOString()
        })
        .eq("id", renewalId);

      if (updateError) throw updateError;

      const { error: logError } = await supabase
        .from("policy_renewal_logs")
        .insert({
          renewal_id: renewalId,
          action: "Follow-up Scheduled",
          notes: notes || `Follow-up scheduled for ${format(new Date(followUpDate), 'PPP')}`
        });

      if (logError) throw logError;

      toast({
        title: "Success",
        description: "Follow-up scheduled successfully"
      });

      fetchRenewals();
    } catch (error) {
      console.error("Error scheduling follow-up:", error);
      toast({
        title: "Error", 
        description: "Failed to schedule follow-up",
        variant: "destructive"
      });
    }
  };

  const handleBulkReminders = async () => {
    try {
      for (const renewalId of selectedRenewals) {
        await handleSendReminder(renewalId, "Bulk reminder sent");
      }
      setSelectedRenewals([]);
      toast({
        title: "Success",
        description: `Sent reminders to ${selectedRenewals.length} customers`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send bulk reminders",
        variant: "destructive"
      });
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "Renewed": return "default";
      case "Pending": return "secondary";
      case "Missed": return "destructive";
      case "Cancelled": return "outline";
      default: return "secondary";
    }
  };

  const getUrgencyBadgeVariant = (urgency: string) => {
    switch (urgency) {
      case "Overdue": return "destructive";
      case "Due Soon": return "default";
      case "Upcoming": return "secondary";
      default: return "secondary";
    }
  };

  const renderDashboard = () => {
    const overdue = renewals.filter(r => r.urgency_status === "Overdue").length;
    const dueSoon = renewals.filter(r => r.urgency_status === "Due Soon").length;
    const pending = renewals.filter(r => r.renewal_status === "Pending").length;
    const renewed = renewals.filter(r => r.renewal_status === "Renewed").length;

    return (
      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="shadow-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Overdue</p>
                  <p className="text-2xl font-bold text-destructive">{overdue}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Due Soon</p>
                  <p className="text-2xl font-bold text-primary">{dueSoon}</p>
                </div>
                <Clock className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold text-foreground">{pending}</p>
                </div>
                <Calendar className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Renewed</p>
                  <p className="text-2xl font-bold text-green-600">{renewed}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex flex-col md:flex-row gap-4 flex-1">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  <Input
                    placeholder="Search policies, customers, agents..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64"
                  />
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Renewed">Renewed</SelectItem>
                    <SelectItem value="Missed">Missed</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Urgency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="Overdue">Overdue</SelectItem>
                    <SelectItem value="Due Soon">Due Soon</SelectItem>
                    <SelectItem value="Upcoming">Upcoming</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                {selectedRenewals.length > 0 && (
                  <Button onClick={handleBulkReminders} className="bg-gradient-primary">
                    <Bell className="h-4 w-4 mr-2" />
                    Send Bulk Reminders ({selectedRenewals.length})
                  </Button>
                )}
                <Button variant="outline" onClick={() => setShowBulkUpload(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Bulk Upload
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Renewals Table */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Policy Renewals</CardTitle>
            <CardDescription>
              Manage policy renewals and track follow-ups
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading renewals...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedRenewals(filteredRenewals.map(r => r.id));
                          } else {
                            setSelectedRenewals([]);
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead>Policy No</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead>Days Until Due</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Urgency</TableHead>
                    <TableHead>Agent</TableHead>
                    <TableHead>Premium</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRenewals.map((renewal) => (
                    <TableRow key={renewal.id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedRenewals.includes(renewal.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedRenewals([...selectedRenewals, renewal.id]);
                            } else {
                              setSelectedRenewals(selectedRenewals.filter(id => id !== renewal.id));
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{renewal.policy_number}</TableCell>
                      <TableCell>{renewal.customer_name}</TableCell>
                      <TableCell>{format(new Date(renewal.renewal_due_date), "dd/MM/yyyy")}</TableCell>
                      <TableCell>
                        <span className={renewal.days_until_due <= 0 ? "text-destructive font-medium" : ""}>
                          {renewal.days_until_due} days
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(renewal.renewal_status)}>
                          {renewal.renewal_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getUrgencyBadgeVariant(renewal.urgency_status)}>
                          {renewal.urgency_status}
                        </Badge>
                      </TableCell>
                      <TableCell>{renewal.agent_name}</TableCell>
                      <TableCell>₹{renewal.premium_amount?.toLocaleString()}</TableCell>
                       <TableCell>
                         <div className="flex gap-1">
                           <Button
                             size="sm"
                             variant="outline"
                             onClick={() => {
                               setSelectedRenewal(renewal);
                               setShowReminderDialog(true);
                             }}
                             disabled={renewal.renewal_reminder_sent}
                             title="Send Reminder"
                           >
                             <Bell className="h-3 w-3" />
                           </Button>
                           <Button
                             size="sm"
                             variant="outline" 
                             onClick={() => {
                               setSelectedRenewal(renewal);
                               setShowStatusDialog(true);
                             }}
                             title="Update Status"
                           >
                             Status
                           </Button>
                           <Button
                             size="sm"
                             variant="outline"
                             onClick={() => {
                               setSelectedRenewal(renewal);
                               setShowFollowUpDialog(true);
                             }}
                             title="Schedule Follow-up"
                           >
                             Follow-up
                           </Button>
                           <Button
                             size="sm"
                             onClick={() => {
                               setSelectedRenewal(renewal);
                               setShowRenewalDialog(true);
                             }}
                             disabled={renewal.renewal_status === "Renewed"}
                             title="Mark as Renewed"
                           >
                             <CheckCircle2 className="h-3 w-3" />
                           </Button>
                         </div>
                       </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="border-b border-border pb-4">
        <h1 className="text-3xl font-bold text-foreground">Policy Renewals</h1>
        <p className="text-muted-foreground mt-1">
          Manage policy renewals, send reminders, and track renewal workflow
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="reminders">Reminders</TabsTrigger>
          <TabsTrigger value="logs">Activity Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          {renderDashboard()}
        </TabsContent>

        <TabsContent value="reminders">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Renewal Reminders</CardTitle>
              <CardDescription>
                Policies requiring follow-up in the next 15 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : reminderPolicies.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No policies requiring reminders in the next 15 days
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Policy No</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Days Left</TableHead>
                      <TableHead>Agent</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reminderPolicies.map((policy) => (
                      <TableRow key={policy.id}>
                        <TableCell className="font-medium">{policy.policy_number}</TableCell>
                        <TableCell>{policy.customer_name}</TableCell>
                        <TableCell>{format(new Date(policy.renewal_due_date), "dd/MM/yyyy")}</TableCell>
                        <TableCell>
                          <span className={policy.days_until_due <= 3 ? "text-destructive font-medium" : ""}>
                            {policy.days_until_due} days
                          </span>
                        </TableCell>
                        <TableCell>{policy.agent_name}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedRenewal(policy);
                                setShowReminderDialog(true);
                              }}
                              disabled={policy.renewal_reminder_sent}
                            >
                              <Bell className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedRenewal(policy);
                                setShowFollowUpDialog(true);
                              }}
                            >
                              Schedule
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Activity Logs</CardTitle>
              <CardDescription>
                View all renewal-related activities and employee actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading logs...</div>
              ) : activityLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No activity logs found
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Policy</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead>Performed By</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activityLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>{format(new Date(log.timestamp), "dd/MM/yyyy HH:mm")}</TableCell>
                        <TableCell className="font-medium">{log.policy_renewals?.policy_number}</TableCell>
                        <TableCell>{log.policy_renewals?.customer_name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{log.action}</Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{log.notes}</TableCell>
                        <TableCell>{log.performed_by || "System"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Send Reminder Dialog */}
      <Dialog open={showReminderDialog} onOpenChange={setShowReminderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Renewal Reminder</DialogTitle>
            <DialogDescription>
              Send a renewal reminder for policy {selectedRenewal?.policy_number}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reminder-notes">Additional Notes</Label>
              <Textarea
                id="reminder-notes"
                placeholder="Add any specific notes for this reminder..."
                value={reminderNotes}
                onChange={(e) => setReminderNotes(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowReminderDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  if (selectedRenewal) {
                    handleSendReminder(selectedRenewal.id, reminderNotes);
                    setShowReminderDialog(false);
                    setReminderNotes("");
                  }
                }}
              >
                Send Reminder
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Mark as Renewed Dialog */}
      <Dialog open={showRenewalDialog} onOpenChange={setShowRenewalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark as Renewed</DialogTitle>
            <DialogDescription>
              Mark policy {selectedRenewal?.policy_number} as renewed
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="renewal-notes">Renewal Notes</Label>
              <Textarea
                id="renewal-notes"
                placeholder="Add any notes about the renewal..."
                value={renewalNotes}
                onChange={(e) => setRenewalNotes(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowRenewalDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  if (selectedRenewal) {
                    handleMarkAsRenewed(selectedRenewal.id, renewalNotes);
                    setShowRenewalDialog(false);
                    setRenewalNotes("");
                  }
                }}
              >
                Mark as Renewed
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Renewal Status</DialogTitle>
            <DialogDescription>
              Update status for policy {selectedRenewal?.policy_number}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="status-select">New Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select new status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Renewed">Renewed</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                  <SelectItem value="Missed">Missed</SelectItem>
                  <SelectItem value="Not Interested">Not Interested</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="status-notes">Notes</Label>
              <Textarea
                id="status-notes"
                placeholder="Add notes about the status change..."
                value={renewalNotes}
                onChange={(e) => setRenewalNotes(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowStatusDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  if (selectedRenewal && newStatus) {
                    handleUpdateRenewalStatus(selectedRenewal.id, newStatus, renewalNotes);
                    setShowStatusDialog(false);
                    setNewStatus("");
                    setRenewalNotes("");
                  }
                }}
                disabled={!newStatus}
              >
                Update Status
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Schedule Follow-up Dialog */}
      <Dialog open={showFollowUpDialog} onOpenChange={setShowFollowUpDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Follow-up</DialogTitle>
            <DialogDescription>
              Schedule a follow-up for policy {selectedRenewal?.policy_number}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="followup-date">Follow-up Date</Label>
              <Input
                id="followup-date"
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="followup-notes">Follow-up Notes</Label>
              <Textarea
                id="followup-notes"
                placeholder="Add notes for the follow-up..."
                value={followUpNotes}
                onChange={(e) => setFollowUpNotes(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowFollowUpDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  if (selectedRenewal && followUpDate) {
                    handleScheduleFollowUp(selectedRenewal.id, followUpDate, followUpNotes);
                    setShowFollowUpDialog(false);
                    setFollowUpDate("");
                    setFollowUpNotes("");
                  }
                }}
                disabled={!followUpDate}
              >
                Schedule Follow-up
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Upload Modal */}
      <BulkUploadModal
        isOpen={showBulkUpload}
        onClose={() => setShowBulkUpload(false)}
        entityType="renewals"
        templateColumns={renewalTemplate.columns}
        sampleData={renewalSampleData}
        validateRow={(row) => {
          const { errors } = validateRenewalData([row as any]);
          return errors;
        }}
        processRow={async (row) => {
          const { success, errors } = await uploadRenewalData([row as any]);
          if (errors.length > 0) throw new Error(errors[0]);
          return success;
        }}
        onSuccess={() => {
          fetchRenewals();
          setShowBulkUpload(false);
        }}
      />
    </div>
  );
};

export default Renewals;