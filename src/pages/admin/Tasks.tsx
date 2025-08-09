import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle2, Clock, AlertTriangle, Search, Plus, Upload, Eye, Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import BulkUploadModal from "@/components/admin/BulkUploadModal";
import { taskTemplate, taskSampleData, validateTaskData, uploadTaskData } from "@/utils/taskBulkUpload";

interface TaskData {
  id: string;
  task_title: string;
  description: string;
  assigned_employee_name: string;
  assigned_agent_name: string;
  priority: string;
  task_type: string;
  due_date: string;
  status: string;
  urgency_status: string;
  hours_until_due: number;
  related_to: string;
  reminder_date_time: string;
  notification_sent: boolean;
  created_by_name: string;
  created_at: string;
}

const Tasks = () => {
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<TaskData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [employeeFilter, setEmployeeFilter] = useState("all");
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskData | null>(null);
  const [showTaskDialog, setShowTaskDialog] = useState(false);

  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    filterTasks();
  }, [tasks, searchTerm, statusFilter, priorityFilter, employeeFilter]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("tasks_with_details")
        .select("*")
        .order("due_date", { ascending: true });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      toast({
        title: "Error",
        description: "Failed to fetch tasks data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterTasks = () => {
    let filtered = tasks;

    if (searchTerm) {
      filtered = filtered.filter(t => 
        t.task_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.assigned_employee_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.assigned_agent_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter && statusFilter !== "all") {
      filtered = filtered.filter(t => t.status === statusFilter);
    }

    if (priorityFilter && priorityFilter !== "all") {
      filtered = filtered.filter(t => t.priority === priorityFilter);
    }

    if (employeeFilter && employeeFilter !== "all") {
      filtered = filtered.filter(t => t.assigned_employee_name === employeeFilter);
    }

    setFilteredTasks(filtered);
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from("tasks")
        .update({ 
          status: "Completed",
          updated_at: new Date().toISOString()
        })
        .eq("id", taskId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Task marked as completed"
      });

      fetchTasks();
    } catch (error) {
      console.error("Error completing task:", error);
      toast({
        title: "Error",
        description: "Failed to complete task",
        variant: "destructive"
      });
    }
  };

  const handleSendReminder = async (taskId: string) => {
    try {
      // Update notification sent status
      const { error: updateError } = await supabase
        .from("tasks")
        .update({ notification_sent: true })
        .eq("id", taskId);

      if (updateError) throw updateError;

      // Log the reminder
      const { error: logError } = await supabase
        .from("task_reminder_logs")
        .insert({
          task_id: taskId,
          via: "In-app",
          status: "Sent",
          message: "Task reminder sent"
        });

      if (logError) throw logError;

      toast({
        title: "Success",
        description: "Reminder sent successfully"
      });

      fetchTasks();
    } catch (error) {
      console.error("Error sending reminder:", error);
      toast({
        title: "Error",
        description: "Failed to send reminder",
        variant: "destructive"
      });
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "Completed": return "default";
      case "Open": return "secondary";
      case "In Progress": return "outline";
      case "Overdue": return "destructive";
      case "Cancelled": return "secondary";
      default: return "secondary";
    }
  };

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case "High": return "destructive";
      case "Medium": return "default";
      case "Low": return "secondary";
      default: return "secondary";
    }
  };

  const getUrgencyBadgeVariant = (urgency: string) => {
    switch (urgency) {
      case "Overdue": return "destructive";
      case "Due Today": return "default";
      case "Due Soon": return "outline";
      case "Upcoming": return "secondary";
      default: return "secondary";
    }
  };

  // Calculate KPIs
  const openTasks = tasks.filter(t => t.status === "Open").length;
  const overdueTasks = tasks.filter(t => t.urgency_status === "Overdue").length;
  const completedTasks = tasks.filter(t => t.status === "Completed").length;
  const dueToday = tasks.filter(t => t.urgency_status === "Due Today").length;

  return (
    <div className="p-6 space-y-6">

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Open Tasks</p>
                <p className="text-2xl font-bold text-foreground">{openTasks}</p>
              </div>
              <Clock className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold text-destructive">{overdueTasks}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Due Today</p>
                <p className="text-2xl font-bold text-primary">{dueToday}</p>
              </div>
              <Clock className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-green-600">{completedTasks}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card className="shadow-card">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col md:flex-row gap-4 flex-1">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                <Input
                  placeholder="Search tasks..."
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
                  <SelectItem value="Open">Open</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Overdue">Overdue</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button onClick={() => navigate("/admin/tasks/create")} className="bg-gradient-primary">
                <Plus className="h-4 w-4 mr-2" />
                Create Task
              </Button>
              <Button variant="outline" onClick={() => setShowBulkUpload(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Bulk Upload
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tasks Table */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>All Tasks</CardTitle>
          <CardDescription>
            Manage and track all assigned tasks and reminders
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading tasks...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Urgency</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{task.task_title}</p>
                        {task.description && (
                          <p className="text-sm text-muted-foreground truncate">
                            {task.description.substring(0, 50)}...
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{task.task_type}</TableCell>
                    <TableCell>
                      <div>
                        {task.assigned_employee_name && (
                          <p className="text-sm">{task.assigned_employee_name}</p>
                        )}
                        {task.assigned_agent_name && (
                          <p className="text-xs text-muted-foreground">{task.assigned_agent_name}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getPriorityBadgeVariant(task.priority)}>
                        {task.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p>{format(new Date(task.due_date), "dd/MM/yyyy")}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(task.due_date), "HH:mm")}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(task.status)}>
                        {task.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getUrgencyBadgeVariant(task.urgency_status)}>
                        {task.urgency_status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedTask(task);
                            setShowTaskDialog(true);
                          }}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSendReminder(task.id)}
                          disabled={task.notification_sent}
                        >
                          <Bell className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleCompleteTask(task.id)}
                          disabled={task.status === "Completed"}
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

      {/* Task Details Dialog */}
      <Dialog open={showTaskDialog} onOpenChange={setShowTaskDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedTask?.task_title}</DialogTitle>
            <DialogDescription>
              Task details and related information
            </DialogDescription>
          </DialogHeader>
          {selectedTask && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Type</p>
                  <p className="text-sm text-muted-foreground">{selectedTask.task_type}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Priority</p>
                  <Badge variant={getPriorityBadgeVariant(selectedTask.priority)}>
                    {selectedTask.priority}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium">Status</p>
                  <Badge variant={getStatusBadgeVariant(selectedTask.status)}>
                    {selectedTask.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium">Due Date</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(selectedTask.due_date), "dd/MM/yyyy HH:mm")}
                  </p>
                </div>
              </div>
              
              {selectedTask.description && (
                <div>
                  <p className="text-sm font-medium">Description</p>
                  <p className="text-sm text-muted-foreground">{selectedTask.description}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Assigned Employee</p>
                  <p className="text-sm text-muted-foreground">{selectedTask.assigned_employee_name || "Not assigned"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Assigned Agent</p>
                  <p className="text-sm text-muted-foreground">{selectedTask.assigned_agent_name || "Not assigned"}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium">Created By</p>
                <p className="text-sm text-muted-foreground">{selectedTask.created_by_name}</p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(selectedTask.created_at), "dd/MM/yyyy HH:mm")}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Bulk Upload Modal */}
      <BulkUploadModal
        isOpen={showBulkUpload}
        onClose={() => setShowBulkUpload(false)}
        entityType="tasks"
        templateColumns={taskTemplate.columns}
        sampleData={taskSampleData}
        validateRow={(row) => {
          const { errors } = validateTaskData([row as any]);
          return errors;
        }}
        processRow={async (row) => {
          const { success, errors } = await uploadTaskData([row as any]);
          if (errors.length > 0) throw new Error(errors[0]);
          return success;
        }}
        onSuccess={() => {
          fetchTasks();
          setShowBulkUpload(false);
        }}
      />
    </div>
  );
};

export default Tasks;